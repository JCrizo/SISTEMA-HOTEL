import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useTurnoActivo } from '../hooks/useTurnoActivo'
import { useAuth } from '../context/AuthContext'

function Cochera() {
  const navigate = useNavigate()
  const [vehiculos, setVehiculos] = useState([])
  const [cargando, setCargando] = useState(true)

  const [placa, setPlaca] = useState('')
  const [tipo, setTipo] = useState('particular')
  const [habitacionId, setHabitacionId] = useState('')
  const [monto, setMonto] = useState('')
  const [metodoPago, setMetodoPago] = useState('efectivo')
  const [horaIngreso, setHoraIngreso] = useState(
  new Date().toTimeString().slice(0, 5)
  )

  const [mostrarExtension, setMostrarExtension] = useState(null)
  const [montoExtension, setMontoExtension] = useState('')
  const [descExtension, setDescExtension] = useState('')

  const [habitaciones, setHabitaciones] = useState([])
  const [mostrarForm, setMostrarForm] = useState(false)
  const [guardando, setGuardando] = useState(false)

  const [metodoPagoVehiculo, setMetodoPagoVehiculo] = useState({})
  const { turnoActivo, cargandoTurno } = useTurnoActivo()
  const { usuario } = useAuth()

  useEffect(() => {
    cargarDatos()
  }, [])

  async function cargarDatos() {
    const { data: vehiculosData } = await supabase
      .from('cochera')
      .select('*, hospedajes(habitacion_id, habitaciones(numero))')
      .is('hora_salida', null)
      .order('hora_ingreso', { ascending: false })
    setVehiculos(vehiculosData || [])

    const { data: habsData } = await supabase
      .from('habitaciones')
      .select('id, numero')
      .eq('estado', 'ocupada')
      .order('numero')
    setHabitaciones(habsData || [])

    setCargando(false)
  }

  async function registrarExtension(vehiculo) {
    if (!montoExtension) return

    await supabase.from('cochera')
      .update({
        monto: parseFloat(vehiculo.monto) + parseFloat(montoExtension),
        estado_pago: 'pendiente'
      })
      .eq('id', vehiculo.id)

    setMontoExtension('')
    setDescExtension('')
    setMostrarExtension(null)
    cargarDatos()
  }

  async function registrarIngreso() {
    if (!placa.trim()) return
    if (!turnoActivo) { alert('No hay un turno activo. Debes iniciar turno antes de registrar un ingreso.'); return }
    setGuardando(true)

    let hospedajeId = null
    if (tipo === 'huesped' && habitacionId) {
      const { data } = await supabase
        .from('hospedajes')
        .select('id')
        .eq('habitacion_id', habitacionId)
        .eq('estado', 'activo')
        .single()
      hospedajeId = data?.id
    }

    const ahora = new Date()
    const [horas, minutos] = horaIngreso.split(':')
    ahora.setHours(parseInt(horas), parseInt(minutos), 0, 0)

    await supabase.from('cochera').insert({
      placa: placa.toUpperCase().trim(),
      hospedaje_id: hospedajeId,
      hora_ingreso: ahora.toISOString(),
      monto: parseFloat(monto || 0),
      estado_pago: parseFloat(monto || 0) === 0 ? 'pagado' : 'pendiente',
      metodo_pago: metodoPago,
      usuario_id: usuario?.id || null
    })

    setPlaca('')
    setTipo('particular')
    setHabitacionId('')
    setMonto('')
    setMetodoPago('efectivo')
    setMostrarForm(false)
    setGuardando(false)
    cargarDatos()
    setHoraIngreso(new Date().toTimeString().slice(0, 5))
  }

  async function registrarSalida(vehiculo) {
    if (!confirm(`¿Registrar salida de ${vehiculo.placa}?`)) return

    await supabase
      .from('cochera')
      .update({ hora_salida: new Date().toISOString() })
      .eq('id', vehiculo.id)

    cargarDatos()
  }

  async function registrarPago(vehiculo) {
    const metodo = metodoPagoVehiculo[vehiculo.id] || 'efectivo'

    await supabase
      .from('cochera')
      .update({ estado_pago: 'pagado', metodo_pago: metodo })
      .eq('id', vehiculo.id)

    if (metodo === 'efectivo') {
      const { data: turnos } = await supabase
        .from('turnos').select('*').is('cierre', null)
        .order('apertura', { ascending: false }).limit(1)
      const turnoActivo = turnos?.[0]
      if (turnoActivo) {
        await supabase.from('turnos')
          .update({ caja_principal_actual: turnoActivo.caja_principal_actual + parseFloat(vehiculo.monto) })
          .eq('id', turnoActivo.id)
      }
    }

    cargarDatos()
  }

  if (cargando) return (
    <div className="flex justify-center items-center h-screen bg-gray-50">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <header className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-10 mb-8">
        <div className="max-w-5xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/')} 
              className="p-2 rounded-full hover:bg-gray-100 text-gray-600 transition-colors"
              title="Volver"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            </button>
            <div>
              <h1 className="text-xl font-black text-gray-800 tracking-tight">Gestión de Cochera</h1>
              <p className="text-sm text-gray-500 font-medium">Control de vehículos en estacionamiento</p>
            </div>
          </div>
          {turnoActivo && (
            <button
              onClick={() => setMostrarForm(!mostrarForm)}
              className={`text-sm px-5 py-2.5 font-bold rounded-xl transition-all shadow-sm flex items-center gap-2 ${
                mostrarForm 
                  ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' 
                  : 'bg-indigo-600 text-white hover:bg-indigo-700'
              }`}
            >
              {mostrarForm ? 'Cerrar Registro' : (
                <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4" /></svg> Nuevo Ingreso</>
              )}
            </button>
          )}
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4">
        {!cargandoTurno && !turnoActivo && (
          <div className="bg-yellow-50 border-2 border-yellow-200 rounded-3xl p-6 mb-8 text-center flex flex-col items-center justify-center gap-2">
            <span className="text-3xl">🔒</span>
            <p className="text-sm font-bold text-yellow-800">
              No hay un turno activo. Inicia turno para poder registrar nuevos ingresos.
            </p>
          </div>
        )}

        {mostrarForm && (
          <div className="bg-white rounded-3xl border border-gray-100 p-8 mb-8 shadow-xl relative overflow-hidden animate-fadeIn">
            <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500"></div>
            <h3 className="text-lg font-black text-gray-800 tracking-tight mb-6 flex items-center gap-2">
              <span className="text-2xl">🚗</span> Registrar Nuevo Vehículo
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1.5">Placa del Vehículo</label>
                <input
                  type="text"
                  value={placa}
                  onChange={e => setPlaca(e.target.value)}
                  placeholder="Ej: ABC-123"
                  className="w-full border-2 border-gray-100 rounded-xl px-4 py-3 text-lg font-black uppercase outline-none focus:border-indigo-500 bg-gray-50 focus:bg-white transition-colors"
                />
              </div>
              
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1.5">Tipo de Ingreso</label>
                <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
                  <button 
                    onClick={() => setTipo('particular')}
                    className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${tipo === 'particular' ? 'bg-white text-indigo-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    Particular
                  </button>
                  <button 
                    onClick={() => setTipo('huesped')}
                    className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${tipo === 'huesped' ? 'bg-white text-indigo-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    Huésped
                  </button>
                </div>
              </div>

              {tipo === 'huesped' && (
                <div className="md:col-span-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1.5">Vincular a Habitación Ocupada</label>
                  <select
                    value={habitacionId}
                    onChange={e => setHabitacionId(e.target.value)}
                    className="w-full border-2 border-gray-100 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-indigo-500 bg-gray-50 focus:bg-white transition-colors"
                  >
                    <option value="">-- Seleccionar Habitación --</option>
                    {habitaciones.map(h => (
                      <option key={h.id} value={h.id}>Habitación {h.numero}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1.5">Hora de Ingreso</label>
                <input
                  type="time"
                  value={horaIngreso}
                  onChange={e => setHoraIngreso(e.target.value)}
                  className="w-full border-2 border-gray-100 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-indigo-500 bg-gray-50 focus:bg-white transition-colors"
                />
              </div>
              
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1.5">Tarifa a Cobrar (S/)</label>
                <input
                  type="number"
                  value={monto}
                  onChange={e => setMonto(e.target.value)}
                  placeholder="0 si está incluido"
                  className="w-full border-2 border-gray-100 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-indigo-500 bg-gray-50 focus:bg-white transition-colors"
                />
              </div>

              {parseFloat(monto || 0) > 0 && (
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1.5">Método de pago</label>
                  <select
                    value={metodoPago}
                    onChange={e => setMetodoPago(e.target.value)}
                    className="w-full border-2 border-gray-100 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-indigo-500 bg-gray-50 focus:bg-white transition-colors"
                  >
                    <option value="efectivo">Efectivo</option>
                    <option value="yape">Yape</option>
                    <option value="tarjeta">Tarjeta</option>
                    <option value="transferencia">Transferencia</option>
                  </select>
                </div>
              )}
            </div>
            
            <div className="flex gap-3 pt-6 border-t border-gray-100">
              <button
                onClick={() => setMostrarForm(false)}
                className="px-8 py-3 border-2 border-gray-200 rounded-xl text-gray-600 font-bold hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={registrarIngreso}
                disabled={guardando}
                className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-md active:scale-[0.98] transition-transform disabled:opacity-50"
              >
                {guardando ? 'Registrando...' : 'Confirmar Ingreso de Vehículo'}
              </button>
            </div>
          </div>
        )}

        {vehiculos.length === 0 ? (
          <div className="bg-white rounded-3xl border border-gray-100 p-16 text-center shadow-sm flex flex-col items-center justify-center">
            <div className="text-6xl mb-4 text-gray-300">🚙</div>
            <h3 className="text-xl font-black text-gray-800 mb-2">Cochera Vacía</h3>
            <p className="text-gray-500">No hay vehículos registrados actualmente en el estacionamiento.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {vehiculos.map(v => (
              <div key={v.id} className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden flex flex-col hover:shadow-lg transition-all">
                <div className="p-6 flex-1 flex flex-col">
                  
                  {/* Header de la tarjeta */}
                  <div className="flex justify-between items-start mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center text-xl shadow-inner border border-gray-200">
                        🚙
                      </div>
                      <div>
                        <p className="text-2xl font-black text-gray-800 tracking-wider uppercase">{v.placa}</p>
                        {v.hospedajes?.habitaciones?.numero ? (
                          <p className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md inline-block mt-1 border border-indigo-100">
                            Habitación {v.hospedajes.habitaciones.numero}
                          </p>
                        ) : (
                          <p className="text-xs font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md inline-block mt-1">
                            Particular
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-right flex flex-col items-end gap-1">
                      {v.monto > 0 ? (
                        <p className="font-black text-xl text-gray-800">S/{v.monto}</p>
                      ) : (
                        <p className="font-black text-sm text-green-600 bg-green-50 px-2 py-1 rounded-lg">Incluido</p>
                      )}
                      {v.monto > 0 && (
                        <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md ${
                          v.estado_pago === 'pagado'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {v.estado_pago === 'pagado' ? '✓ Pagado' : 'Pendiente'}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Info de ingreso */}
                  <div className="bg-gray-50 rounded-2xl p-4 mb-4 border border-gray-100 flex-1">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Ingreso Registrado</p>
                    <p className="text-sm font-bold text-gray-700">
                      {new Date(v.hora_ingreso).toLocaleString('es-PE', {
                        weekday: 'short', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
                      })}
                    </p>
                  </div>
                  
                  {/* Secciones Dinámicas (Cargo y Pago) */}
                  <div className="space-y-3 mt-auto">
                    {/* Sección de Pago si está pendiente */}
                    {v.estado_pago === 'pendiente' && v.monto > 0 && (
                      <div className="bg-red-50 p-4 rounded-2xl border-2 border-red-100 flex flex-col gap-3">
                        <p className="text-xs font-black text-red-800 uppercase tracking-widest flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                          Requiere Pago
                        </p>
                        <div className="flex gap-2">
                          <select
                            value={metodoPagoVehiculo[v.id] || 'efectivo'}
                            onChange={e => setMetodoPagoVehiculo(prev => ({ ...prev, [v.id]: e.target.value }))}
                            className="w-1/2 border-2 border-white rounded-xl px-3 py-2.5 text-sm font-bold bg-white text-gray-700 outline-none focus:border-red-300"
                          >
                            <option value="efectivo">💵 Efectivo</option>
                            <option value="yape">📱 Yape/Plin</option>
                            <option value="tarjeta">💳 Tarjeta</option>
                            <option value="transferencia">🏦 Transf.</option>
                          </select>
                          <button
                            onClick={() => registrarPago(v)}
                            className="w-1/2 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-black shadow-sm transition-colors active:scale-95"
                          >
                            Abonar Pago
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Sección de Agregar Cargo */}
                    {mostrarExtension === v.id ? (
                      <div className="bg-indigo-50 p-4 rounded-2xl border-2 border-indigo-100 animate-fadeIn">
                        <p className="text-xs font-black text-indigo-800 uppercase tracking-widest mb-3">Agregar Cargo Adicional</p>
                        <div className="space-y-2 mb-3">
                          <input
                            type="number"
                            value={montoExtension}
                            onChange={e => setMontoExtension(e.target.value)}
                            placeholder="Monto (S/)"
                            className="w-full border-2 border-white rounded-xl px-3 py-2.5 text-sm font-bold bg-white outline-none focus:border-indigo-300"
                          />
                          <input
                            type="text"
                            value={descExtension}
                            onChange={e => setDescExtension(e.target.value)}
                            placeholder="Descripción (ej: noche extra, lavado)"
                            className="w-full border-2 border-white rounded-xl px-3 py-2.5 text-sm font-bold bg-white outline-none focus:border-indigo-300"
                          />
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setMostrarExtension(null)}
                            className="flex-1 py-2 bg-white text-indigo-700 border-2 border-indigo-200 rounded-xl text-sm font-bold hover:bg-indigo-100"
                          >
                            Cancelar
                          </button>
                          <button
                            onClick={() => registrarExtension(v)}
                            className="flex-1 py-2 bg-indigo-600 text-white rounded-xl text-sm font-black shadow-sm hover:bg-indigo-700"
                          >
                            Agregar Cargo
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setMostrarExtension(v.id)}
                        className="w-full py-2.5 bg-gray-50 border border-gray-200 text-gray-600 hover:bg-gray-100 rounded-xl text-sm font-bold transition-colors border-dashed"
                      >
                        + Agregar Cargo Extra
                      </button>
                    )}
                  </div>
                </div>

                {/* Footer Tarjeta */}
                <div className="p-4 bg-gray-50 border-t border-gray-100">
                  <button
                    onClick={() => registrarSalida(v)}
                    className="w-full py-3 bg-white border-2 border-gray-200 hover:border-gray-800 hover:bg-gray-800 text-gray-700 hover:text-white rounded-xl text-sm font-black transition-colors flex items-center justify-center gap-2 group"
                  >
                    Registrar Salida del Vehículo
                    <svg className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

export default Cochera