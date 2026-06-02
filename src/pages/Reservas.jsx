import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

function Reservas() {
  const navigate = useNavigate()
  const [reservas, setReservas] = useState([])
  const [habitaciones, setHabitaciones] = useState([])
  const [cargando, setCargando] = useState(true)
  const [mostrarForm, setMostrarForm] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')

  const [dni, setDni] = useState('')
  const [cliente, setCliente] = useState(null)
  const [nombres, setNombres] = useState('')
  const [telefono, setTelefono] = useState('')
  const [habitacionId, setHabitacionId] = useState('')
  const [fechaLlegada, setFechaLlegada] = useState('')
  const [adelanto, setAdelanto] = useState('')
  const [montoEarly, setMontoEarly] = useState('')
  const [observaciones, setObservaciones] = useState('')

  useEffect(() => {
    cargarDatos()
  }, [])

  async function cargarDatos() {
    const { data: resData } = await supabase
      .from('reservas')
      .select(`
        *,
        clientes(nombres, dni_pasaporte, telefono),
        habitaciones(numero, tipo_actual, precio_actual)
      `)
      .in('estado', ['pendiente', 'confirmada'])
      .order('fecha_llegada')
    setReservas(resData || [])

    const { data: habsData } = await supabase
      .from('habitaciones')
      .select('id, numero, tipo_actual, precio_actual')
      .eq('estado', 'disponible')
      .order('numero')
    setHabitaciones(habsData || [])

    setCargando(false)
  }

  async function buscarCliente() {
    if (!dni.trim()) return
    const { data } = await supabase
      .from('clientes')
      .select('*')
      .eq('dni_pasaporte', dni.trim())
      .single()

    if (data) {
      setCliente(data)
      setNombres(data.nombres)
      setTelefono(data.telefono || '')
    } else {
      setCliente(null)
      setNombres('')
      setTelefono('')
    }
  }

  async function crearReserva() {
    setError('')
    if (!nombres.trim()) { setError('El nombre es obligatorio'); return }
    if (!habitacionId) { setError('Selecciona una habitación'); return }
    if (!fechaLlegada) { setError('La fecha de llegada es obligatoria'); return }
    setGuardando(true)

    let clienteId
    if (cliente) {
      clienteId = cliente.id
    } else {
      const { data, error: errCliente } = await supabase
        .from('clientes')
        .insert({ dni_pasaporte: dni.trim(), nombres, telefono })
        .select().single()
      if (errCliente) { setError('Error al guardar cliente'); setGuardando(false); return }
      clienteId = data.id
    }

    await supabase.from('reservas').insert({
      cliente_id: clienteId,
      habitacion_id: habitacionId,
      fecha_llegada: new Date(fechaLlegada).toISOString(),
      adelanto: parseFloat(adelanto || 0),
      monto_early: parseFloat(montoEarly || 0),
      estado: 'confirmada',
      observaciones
    })

    setDni('')
    setCliente(null)
    setNombres('')
    setTelefono('')
    setHabitacionId('')
    setFechaLlegada('')
    setAdelanto('')
    setMontoEarly('')
    setObservaciones('')
    setMostrarForm(false)
    setGuardando(false)
    cargarDatos()
  }

  async function anularReserva(reserva) {
    if (!confirm(`¿Anular reserva de ${reserva.clientes?.nombres}?`)) return
    await supabase
      .from('reservas')
      .update({ estado: 'anulada' })
      .eq('id', reserva.id)
    cargarDatos()
  }

  async function convertirAHospedaje(reserva) {
    navigate(`/checkin/${reserva.habitacion_id}?reserva=${reserva.id}`)
  }

  if (cargando) return <div className="p-4 text-gray-500">Cargando...</div>

  return (
    <div className="p-4">
      <button onClick={() => navigate('/')} className="mb-4 text-sm text-blue-600">
        ← Volver
      </button>

      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Reservas</h2>
        <button
          onClick={() => setMostrarForm(!mostrarForm)}
          className="text-sm px-4 py-2 bg-green-600 text-white rounded-xl"
        >
          + Nueva
        </button>
      </div>

      {mostrarForm && (
        <div className="bg-white rounded-xl border p-4 mb-4">
          <p className="text-xs text-gray-500 font-medium uppercase mb-3">Nueva reserva</p>

          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={dni}
              onChange={e => setDni(e.target.value)}
              onBlur={buscarCliente}
              placeholder="DNI o pasaporte"
              className="flex-1 border rounded-lg px-3 py-2 text-sm"
            />
            <button
              onClick={buscarCliente}
              className="px-4 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium"
            >
              Buscar
            </button>
          </div>

          {cliente && (
            <div className="mb-2 p-2 bg-green-50 border border-green-300 rounded-lg">
              <p className="text-xs font-medium text-green-800">✓ Cliente encontrado</p>
              <p className="text-xs text-green-700 mt-1">{cliente.nombres}</p>
            </div>
          )}

          <input
            type="text"
            value={nombres}
            onChange={e => setNombres(e.target.value)}
            placeholder="Nombre completo"
            className="w-full border rounded-lg px-3 py-2 text-sm mb-2"
          />
          <input
            type="text"
            value={telefono}
            onChange={e => setTelefono(e.target.value)}
            placeholder="Teléfono"
            className="w-full border rounded-lg px-3 py-2 text-sm mb-2"
          />
          <select
            value={habitacionId}
            onChange={e => setHabitacionId(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-sm mb-2"
          >
            <option value="">Seleccionar habitación</option>
            {habitaciones.map(h => (
              <option key={h.id} value={h.id}>
                Hab {h.numero} — {h.tipo_actual} · S/{h.precio_actual}
              </option>
            ))}
          </select>
          <input
            type="datetime-local"
            value={fechaLlegada}
            onChange={e => setFechaLlegada(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-sm mb-2"
          />
          <input
            type="number"
            value={adelanto}
            onChange={e => setAdelanto(e.target.value)}
            placeholder="Adelanto (S/) — opcional"
            className="w-full border rounded-lg px-3 py-2 text-sm mb-2"
          />
          <input
            type="number"
            value={montoEarly}
            onChange={e => setMontoEarly(e.target.value)}
            placeholder="Early check-in (S/) — opcional"
            className="w-full border rounded-lg px-3 py-2 text-sm mb-2"
          />
          <textarea
            value={observaciones}
            onChange={e => setObservaciones(e.target.value)}
            placeholder="Observaciones..."
            className="w-full border rounded-lg px-3 py-2 text-sm mb-3 h-16 resize-none"
          />

          {error && <p className="text-red-500 text-sm mb-2">{error}</p>}

          <div className="flex gap-2">
            <button
              onClick={() => setMostrarForm(false)}
              className="flex-1 py-2 border rounded-xl text-sm text-gray-600"
            >
              Cancelar
            </button>
            <button
              onClick={crearReserva}
              disabled={guardando}
              className="flex-1 py-2 bg-green-600 text-white rounded-xl text-sm font-medium disabled:opacity-50"
            >
              {guardando ? 'Guardando...' : 'Confirmar reserva'}
            </button>
          </div>
        </div>
      )}

      {reservas.length === 0 ? (
        <div className="bg-white rounded-xl border p-6 text-center">
          <p className="text-gray-500">No hay reservas pendientes</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {reservas.map(r => (
            <div key={r.id} className="bg-white rounded-xl border p-4">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="font-semibold">{r.clientes?.nombres}</p>
                  <p className="text-xs text-gray-500">{r.clientes?.dni_pasaporte}</p>
                </div>
                <span className="text-xs font-medium px-2 py-1 rounded-full bg-blue-100 text-blue-800">
                  {r.estado}
                </span>
              </div>
              <div className="text-sm text-gray-600 mb-1">
                Hab {r.habitaciones?.numero} — {r.habitaciones?.tipo_actual}
              </div>
              <div className="text-xs text-gray-400 mb-1">
                Llegada: {new Date(r.fecha_llegada).toLocaleString('es-PE')}
              </div>
              {r.adelanto > 0 && (
                <div className="text-xs text-green-700 mb-1">
                  Adelanto: S/{r.adelanto}
                </div>
              )}
              {r.monto_early > 0 && (
                <div className="text-xs text-blue-700 mb-1">
                  Early check-in: S/{r.monto_early}
                </div>
              )}
              {r.observaciones && (
                <div className="text-xs text-gray-500 mb-2">
                  {r.observaciones}
                </div>
              )}
              <div className="flex gap-2 mt-2">
                <button
                  onClick={() => convertirAHospedaje(r)}
                  className="flex-1 py-2 bg-green-600 text-white rounded-xl text-sm font-medium"
                >
                  Check-in
                </button>
                <button
                  onClick={() => anularReserva(r)}
                  className="flex-1 py-2 bg-red-100 text-red-600 rounded-xl text-sm font-medium"
                >
                  Anular
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default Reservas