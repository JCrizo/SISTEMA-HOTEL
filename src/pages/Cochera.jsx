import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useTurnoActivo } from '../hooks/useTurnoActivo'
import { useAuth } from '../context/AuthContext'
import BloqueoTurnoAjeno from '../components/Compartido/BloqueoTurnoAjeno'
import { turnosService } from '../services/turnosService'
import Icono from '../components/Compartido/Icono'

function Cochera() {
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
  const { turnoActivo, cargandoTurno, turnoAjeno } = useTurnoActivo()
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
    if (!turnoActivo) { alert('No hay un turno activo.'); return }

    await supabase.from('cochera')
      .update({
        monto: parseFloat(vehiculo.monto) + parseFloat(montoExtension),
        // FIX C2: siempre marcar pendiente al agregar cargo, sin importar estado previo
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
    // FIX C3: bloquear salida si hay pago pendiente
    if (vehiculo.estado_pago === 'pendiente' && parseFloat(vehiculo.monto || 0) > 0) {
      alert(`El vehículo ${vehiculo.placa} tiene un pago pendiente de S/${vehiculo.monto}. Registra el pago antes de registrar la salida.`)
      return
    }
    if (!confirm(`¿Registrar salida de ${vehiculo.placa}?`)) return

    await supabase
      .from('cochera')
      .update({ hora_salida: new Date().toISOString() })
      .eq('id', vehiculo.id)

    cargarDatos()
  }

  async function registrarPago(vehiculo) {
    // FIX C1: usar turnoActivo del hook en lugar de re-consultar
    if (!turnoActivo) { alert('No hay un turno activo.'); return }
    const metodo = metodoPagoVehiculo[vehiculo.id] || 'efectivo'

    await supabase
      .from('cochera')
      .update({ estado_pago: 'pagado', metodo_pago: metodo })
      .eq('id', vehiculo.id)

    // FIX C1: sumar a caja usando turnoActivo del hook (sin re-consultar BD)
    if (metodo === 'efectivo') {
      await turnosService.sumarACaja(
        parseFloat(vehiculo.monto),
        'principal',
        turnoActivo.id,
        turnoActivo.caja_principal_actual
      )
    }

    cargarDatos()
  }

  if (cargandoTurno || cargando) return (
    <div className="flex flex-col justify-center items-center h-80 gap-3">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
      <span className="text-sm text-gray-400 font-semibold">Cargando cochera...</span>
    </div>
  )

  if (turnoAjeno) {
    return <BloqueoTurnoAjeno />
  }

  // Resumen (solo lectura, derivado de la lista actual)
  const totalVehiculos = vehiculos.length
  const totalHuespedes = vehiculos.filter(v => v.hospedajes?.habitaciones?.numero).length
  const totalPorCobrar = vehiculos
    .filter(v => v.estado_pago === 'pendiente' && v.monto > 0)
    .reduce((acc, v) => acc + parseFloat(v.monto || 0), 0)

  const metodos = [
    { id: 'efectivo', texto: 'Efectivo' },
    { id: 'yape', texto: 'Yape / Plin' },
    { id: 'tarjeta', texto: 'Tarjeta' },
    { id: 'transferencia', texto: 'Transferencia' },
  ]

  return (
    <div className="max-w-5xl mx-auto space-y-5 pb-12">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="page-title">Gestión de Cochera</h1>
          <p className="page-sub">Control de vehículos en estacionamiento</p>
        </div>
        {turnoActivo && (
          <button
            onClick={() => setMostrarForm(!mostrarForm)}
            className={`btn ${mostrarForm ? 'btn-secondary' : 'btn-primary'}`}
          >
            {mostrarForm ? 'Cerrar registro' : (<><Icono name="plus" className="w-4 h-4" /> Nuevo ingreso</>)}
          </button>
        )}
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-3 gap-3">
        <div className="card p-3 sm:p-4">
          <p className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-wide">En cochera</p>
          <p className="text-2xl font-black text-gray-800">{totalVehiculos}</p>
        </div>
        <div className="card p-3 sm:p-4">
          <p className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-wide">De huéspedes</p>
          <p className="text-2xl font-black text-blue-600">{totalHuespedes}</p>
        </div>
        <div className="card p-3 sm:p-4">
          <p className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-wide">Por cobrar</p>
          <p className={`text-2xl font-black ${totalPorCobrar > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
            S/ {totalPorCobrar.toFixed(2)}
          </p>
        </div>
      </div>

      {!cargandoTurno && !turnoActivo && (
        <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-2xl p-4">
          <Icono name="alert" className="w-5 h-5 text-amber-600 shrink-0" />
          <p className="text-sm font-bold text-amber-800">
            No hay un turno activo. Inicia turno para poder registrar nuevos ingresos.
          </p>
        </div>
      )}

      {mostrarForm && (
        <div className="card border-blue-100 p-4 sm:p-6 shadow-sm">
          <h2 className="text-lg font-black text-gray-800 tracking-tight mb-5">Registrar nuevo vehículo</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 mb-5">
            <div>
              <label className="label">Placa del vehículo</label>
              <input
                type="text"
                value={placa}
                onChange={e => setPlaca(e.target.value)}
                placeholder="Ej: ABC-123"
                className="input !text-lg !font-black uppercase tracking-wider"
              />
            </div>

            <div>
              <label className="label">Tipo de ingreso</label>
              <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
                <button
                  onClick={() => setTipo('particular')}
                  className={`flex-1 min-h-[40px] text-sm font-bold rounded-lg transition-colors ${tipo === 'particular' ? 'bg-white text-blue-700 shadow-xs' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  Particular
                </button>
                <button
                  onClick={() => setTipo('huesped')}
                  className={`flex-1 min-h-[40px] text-sm font-bold rounded-lg transition-colors ${tipo === 'huesped' ? 'bg-white text-blue-700 shadow-xs' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  Huésped
                </button>
              </div>
            </div>

            {tipo === 'huesped' && (
              <div className="md:col-span-2">
                <label className="label">Vincular a habitación ocupada</label>
                <select
                  value={habitacionId}
                  onChange={e => setHabitacionId(e.target.value)}
                  className="input"
                >
                  <option value="">-- Seleccionar habitación --</option>
                  {habitaciones.map(h => (
                    <option key={h.id} value={h.id}>Habitación {h.numero}</option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="label">Hora de ingreso</label>
              <input
                type="time"
                value={horaIngreso}
                onChange={e => setHoraIngreso(e.target.value)}
                className="input"
              />
            </div>

            <div>
              <label className="label">Tarifa a cobrar (S/)</label>
              <input
                type="number"
                value={monto}
                onChange={e => setMonto(e.target.value)}
                placeholder="0 si está incluido"
                className="input"
              />
            </div>

            {parseFloat(monto || 0) > 0 && (
              <div>
                <label className="label">Método de pago</label>
                <select
                  value={metodoPago}
                  onChange={e => setMetodoPago(e.target.value)}
                  className="input"
                >
                  <option value="efectivo">Efectivo</option>
                  <option value="yape">Yape</option>
                  <option value="tarjeta">Tarjeta</option>
                  <option value="transferencia">Transferencia</option>
                </select>
              </div>
            )}
          </div>

          <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 pt-4 border-t border-gray-100">
            <button onClick={() => setMostrarForm(false)} className="btn btn-secondary sm:px-8">
              Cancelar
            </button>
            <button onClick={registrarIngreso} disabled={guardando} className="btn btn-primary flex-1">
              {guardando ? 'Registrando...' : 'Confirmar ingreso del vehículo'}
            </button>
          </div>
        </div>
      )}

      {vehiculos.length === 0 ? (
        <div className="card flex flex-col items-center justify-center text-center p-12 sm:p-16">
          <div className="w-14 h-14 rounded-2xl bg-gray-100 text-gray-400 flex items-center justify-center text-2xl font-black mb-3">P</div>
          <h3 className="text-lg font-black text-gray-800 mb-1">Cochera vacía</h3>
          <p className="text-sm text-gray-500">No hay vehículos registrados actualmente en el estacionamiento.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
          {vehiculos.map(v => (
            <article key={v.id} className="card card-hover overflow-hidden flex flex-col">
              <div className="p-4 sm:p-5 flex-1 flex flex-col gap-4">

                {/* Cabecera de la tarjeta */}
                <div className="flex justify-between items-start gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-11 h-11 shrink-0 bg-gray-900 text-white rounded-xl flex items-center justify-center text-base font-black">
                      P
                    </div>
                    <div className="min-w-0">
                      <p className="text-xl sm:text-2xl font-black text-gray-800 tracking-wider uppercase truncate">{v.placa}</p>
                      {v.hospedajes?.habitaciones?.numero ? (
                        <span className="badge badge-info mt-1">Habitación {v.hospedajes.habitaciones.numero}</span>
                      ) : (
                        <span className="badge badge-muted mt-1">Particular</span>
                      )}
                    </div>
                  </div>
                  <div className="text-right flex flex-col items-end gap-1 shrink-0">
                    {v.monto > 0 ? (
                      <p className="font-black text-xl text-gray-800">S/ {Number(v.monto).toFixed(2)}</p>
                    ) : (
                      <span className="badge badge-ok">Incluido</span>
                    )}
                    {v.monto > 0 && (
                      <span className={`badge ${v.estado_pago === 'pagado' ? 'badge-ok' : 'badge-danger'}`}>
                        {v.estado_pago === 'pagado' ? (<><Icono name="check" className="w-3 h-3" /> Pagado</>) : 'Pendiente'}
                      </span>
                    )}
                  </div>
                </div>

                {/* Info de ingreso */}
                <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2.5 border border-gray-100">
                  <Icono name="clock" className="w-4 h-4 text-gray-400 shrink-0" />
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide leading-none">Ingreso registrado</p>
                    <p className="text-sm font-bold text-gray-700 mt-0.5">
                      {new Date(v.hora_ingreso).toLocaleString('es-PE', {
                        weekday: 'short', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>

                {/* Secciones dinámicas (pago y cargo extra) */}
                <div className="space-y-3 mt-auto">
                  {v.estado_pago === 'pendiente' && v.monto > 0 && (
                    <div className="bg-rose-50 p-3 sm:p-4 rounded-xl border border-rose-100 flex flex-col gap-3">
                      <p className="text-xs font-black text-rose-800 uppercase tracking-wide flex items-center gap-1.5">
                        <Icono name="cash" className="w-4 h-4" /> Requiere pago
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        <select
                          value={metodoPagoVehiculo[v.id] || 'efectivo'}
                          onChange={e => setMetodoPagoVehiculo(prev => ({ ...prev, [v.id]: e.target.value }))}
                          className="input !bg-white !border-white"
                        >
                          {metodos.map(m => <option key={m.id} value={m.id}>{m.texto}</option>)}
                        </select>
                        <button onClick={() => registrarPago(v)} className="btn btn-danger">
                          Abonar pago
                        </button>
                      </div>
                    </div>
                  )}

                  {mostrarExtension === v.id ? (
                    <div className="bg-blue-50 p-3 sm:p-4 rounded-xl border border-blue-100">
                      <p className="text-xs font-black text-blue-800 uppercase tracking-wide mb-3">Agregar cargo adicional</p>
                      <div className="space-y-2 mb-3">
                        <input
                          type="number"
                          value={montoExtension}
                          onChange={e => setMontoExtension(e.target.value)}
                          placeholder="Monto (S/)"
                          className="input !bg-white !border-white"
                        />
                        <input
                          type="text"
                          value={descExtension}
                          onChange={e => setDescExtension(e.target.value)}
                          placeholder="Descripción (ej: noche extra, lavado)"
                          className="input !bg-white !border-white"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <button onClick={() => setMostrarExtension(null)} className="btn btn-secondary">
                          Cancelar
                        </button>
                        <button onClick={() => registrarExtension(v)} className="btn btn-primary">
                          Agregar cargo
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setMostrarExtension(v.id)}
                      className="btn btn-secondary w-full !border-dashed text-gray-600"
                    >
                      <Icono name="plus" className="w-4 h-4" /> Agregar cargo extra
                    </button>
                  )}
                </div>
              </div>

              {/* Pie de la tarjeta */}
              <div className="p-3 sm:p-4 bg-gray-50 border-t border-gray-100">
                <button
                  onClick={() => registrarSalida(v)}
                  className="btn btn-secondary w-full hover:!bg-gray-900 hover:!text-white hover:!border-gray-900"
                >
                  Registrar salida del vehículo
                  <Icono name="logout" className="w-4 h-4" />
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}

export default Cochera
