import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

function Cochera() {
  const navigate = useNavigate()
  const [vehiculos, setVehiculos] = useState([])
  const [cargando, setCargando] = useState(true)

  const [placa, setPlaca] = useState('')
  const [tipo, setTipo] = useState('particular')
  const [habitacionId, setHabitacionId] = useState('')
  const [monto, setMonto] = useState('')
  const [horaIngreso, setHoraIngreso] = useState(
  new Date().toTimeString().slice(0, 5)
  )

  const [mostrarExtension, setMostrarExtension] = useState(null)
  const [montoExtension, setMontoExtension] = useState('')
  const [descExtension, setDescExtension] = useState('')

  const [habitaciones, setHabitaciones] = useState([])
  const [mostrarForm, setMostrarForm] = useState(false)
  const [guardando, setGuardando] = useState(false)

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
      estado_pago: parseFloat(monto || 0) === 0 ? 'pagado' : 'pendiente'
    })

    setPlaca('')
    setTipo('particular')
    setHabitacionId('')
    setMonto('')
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
    await supabase
      .from('cochera')
      .update({ estado_pago: 'pagado' })
      .eq('id', vehiculo.id)

    // Sumar a caja principal
    const { data: turnos } = await supabase
      .from('turnos').select('*').is('cierre', null)
      .order('apertura', { ascending: false }).limit(1)
    const turnoActivo = turnos?.[0]
    if (turnoActivo) {
      await supabase.from('turnos')
        .update({ caja_principal_actual: turnoActivo.caja_principal_actual + parseFloat(vehiculo.monto) })
        .eq('id', turnoActivo.id)
    }

    cargarDatos()
  }

  if (cargando) return <div className="p-4 text-gray-500">Cargando...</div>

  return (
    <div className="p-4">
      <button onClick={() => navigate('/')} className="mb-4 text-sm text-blue-600">
        ← Volver
      </button>

      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Cochera</h2>
        <button
          onClick={() => setMostrarForm(!mostrarForm)}
          className="text-sm px-4 py-2 bg-green-600 text-white rounded-xl"
        >
          + Registrar
        </button>
      </div>

      {mostrarForm && (
        <div className="bg-white rounded-xl border p-4 mb-4">
          <p className="text-xs text-gray-500 font-medium uppercase mb-3">Nuevo ingreso</p>
          <input
            type="text"
            value={placa}
            onChange={e => setPlaca(e.target.value)}
            placeholder="Placa del vehículo"
            className="w-full border rounded-lg px-3 py-2 text-sm mb-2 uppercase"
          />
          <select
            value={tipo}
            onChange={e => setTipo(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-sm mb-2"
          >
            <option value="particular">Particular</option>
            <option value="huesped">Huésped — vincular habitación</option>
          </select>
          {tipo === 'huesped' && (
            <select
              value={habitacionId}
              onChange={e => setHabitacionId(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm mb-2"
            >
              <option value="">Seleccionar habitación</option>
              {habitaciones.map(h => (
                <option key={h.id} value={h.id}>Hab {h.numero}</option>
              ))}
            </select>
          )}
          <label className="text-xs text-gray-500 mb-1 block">Hora de ingreso</label>
            <input
              type="time"
              value={horaIngreso}
              onChange={e => setHoraIngreso(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm mb-2"
            />
          <input
            type="number"
            value={monto}
            onChange={e => setMonto(e.target.value)}
            placeholder="Monto (S/) — 0 si es incluido"
            className="w-full border rounded-lg px-3 py-2 text-sm mb-3"
          />
          
          <div className="flex gap-2">
            <button
              onClick={() => setMostrarForm(false)}
              className="flex-1 py-2 border rounded-xl text-sm text-gray-600"
            >
              Cancelar
            </button>
            <button
              onClick={registrarIngreso}
              disabled={guardando}
              className="flex-1 py-2 bg-green-600 text-white rounded-xl text-sm font-medium disabled:opacity-50"
            >
              Confirmar ingreso
            </button>
          </div>
        </div>
      )}

      {vehiculos.length === 0 ? (
        <div className="bg-white rounded-xl border p-6 text-center">
          <p className="text-gray-500">No hay vehículos en cochera</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {vehiculos.map(v => (
            <div key={v.id} className="bg-white rounded-xl border p-4">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="font-semibold text-lg">{v.placa}</p>
                  <p className="text-xs text-gray-400">
                    Ingreso: {new Date(v.hora_ingreso).toLocaleString('es-PE')}
                  </p>
                  {v.hospedajes?.habitaciones?.numero && (
                    <p className="text-xs text-blue-600 mt-1">
                      Hab {v.hospedajes.habitaciones.numero}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  {v.monto > 0 && (
                    <p className="font-semibold">S/{v.monto}</p>
                  )}
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                    v.estado_pago === 'pagado'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {v.estado_pago === 'pagado' ? 'Pagado' : 'Pendiente'}
                  </span>
                </div>
              </div>
              <div className="flex gap-2 mt-2">
                {v.estado_pago === 'pendiente' && v.monto > 0 && (
                  <button
                    onClick={() => registrarPago(v)}
                    className="flex-1 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium"
                  >
                    Registrar pago
                  </button>
                )}
                {mostrarExtension === v.id ? (
                  <div className="mt-2 border-t pt-2">
                    <p className="text-xs text-gray-500 mb-1">Cargo adicional cochera</p>
                    <input
                      type="number"
                      value={montoExtension}
                      onChange={e => setMontoExtension(e.target.value)}
                      placeholder="Monto (S/)"
                      className="w-full border rounded-lg px-3 py-2 text-sm mb-2"
                    />
                    <input
                      type="text"
                      value={descExtension}
                      onChange={e => setDescExtension(e.target.value)}
                      placeholder="Descripción (ej: noche adicional)"
                      className="w-full border rounded-lg px-3 py-2 text-sm mb-2"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => setMostrarExtension(null)}
                        className="flex-1 py-2 border rounded-xl text-sm text-gray-600"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={() => registrarExtension(v)}
                        className="flex-1 py-2 bg-blue-600 text-white rounded-xl text-sm"
                      >
                        Agregar cargo
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setMostrarExtension(v.id)}
                    className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-xl text-sm"
                  >
                    + Cargo
                  </button>
                )}
                <button
                  onClick={() => registrarSalida(v)}
                  className="flex-1 py-2 bg-red-500 text-white rounded-xl text-sm font-medium"
                >
                  Registrar salida
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default Cochera  