import { useState, useEffect } from 'react'
import { useReservas } from '../../hooks/useReservas'
import { useHabitaciones } from '../../hooks/useHabitaciones'
import { clientesService } from '../../services/clientesService'

export default function FormularioReserva({ onCancel, turnoActivo }) {
  const { crearReserva, error: errorReserva } = useReservas()
  const { habitaciones, cargarDisponibles } = useHabitaciones()

  const [dni, setDni] = useState('')
  const [tipoDoc, setTipoDoc] = useState('dni')
  const [cliente, setCliente] = useState(null)
  const [nombres, setNombres] = useState('')
  const [telefono, setTelefono] = useState('')
  const [habitacionId, setHabitacionId] = useState('')
  const [fechaLlegada, setFechaLlegada] = useState('')
  const [fechaSalida, setFechaSalida] = useState('')
  const [adelanto, setAdelanto] = useState('')
  const [montoEarly, setMontoEarly] = useState('')
  const [observaciones, setObservaciones] = useState('')
  
  const [guardando, setGuardando] = useState(false)
  const [errorValidacion, setErrorValidacion] = useState('')

  useEffect(() => {
    cargarDisponibles()
  }, [cargarDisponibles])

  async function buscarCliente() {
    if (!dni.trim()) return
    try {
      const data = await clientesService.buscarPorDniPasaporte(dni.trim())
      if (data) {
        setCliente(data)
        setNombres(data.nombres)
        setTelefono(data.telefono || '')
      } else {
        setCliente(null)
        setNombres('')
        setTelefono('')
      }
    } catch (err) {
      console.error(err)
    }
  }

  async function handleCrearReserva() {
    setErrorValidacion('')
    if (!turnoActivo) { setErrorValidacion('Debes iniciar turno antes de crear una reserva.'); return }
    if (tipoDoc === 'dni' && dni.length !== 8) { setErrorValidacion('El DNI debe tener 8 dígitos'); return }
    if (!nombres.trim()) { setErrorValidacion('El nombre es obligatorio'); return }
    if (!habitacionId) { setErrorValidacion('Selecciona una habitación'); return }
    if (!fechaLlegada) { setErrorValidacion('La fecha de llegada es obligatoria'); return }
    
    setGuardando(true)

    const exito = await crearReserva(
      {
        habitacion_id: habitacionId,
        fecha_llegada: new Date(fechaLlegada).toISOString(),
        fecha_salida: fechaSalida ? new Date(fechaSalida).toISOString() : null,
        adelanto: parseFloat(adelanto || 0),
        monto_early: parseFloat(montoEarly || 0),
        estado: 'confirmada',
        observaciones
      },
      {
        clienteId: cliente ? cliente.id : null,
        dni_pasaporte: dni.trim(),
        nombres,
        telefono
      }
    )

    if (exito) {
      onCancel() // Cierra el formulario
    }
    setGuardando(false)
  }

  const errorMostrar = errorValidacion || errorReserva

  return (
    <div className="bg-white rounded-xl border p-4 mb-4 shadow-sm">
      <p className="text-xs text-gray-500 font-medium uppercase mb-3">Nueva reserva</p>

      <div className="flex gap-2 mb-2">
        <select
          value={tipoDoc}
          onChange={e => { setTipoDoc(e.target.value); setDni('') }}
          className="w-full border rounded-lg px-3 py-2 text-sm mb-2"
        >
          <option value="dni">DNI (8 dígitos)</option>
          <option value="pasaporte">Pasaporte</option>
          <option value="otro">Otro documento</option>
        </select>
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            value={dni}
            onChange={e => {
              const val = e.target.value.replace(/\D/g, '')
              if (tipoDoc === 'dni') {
                if (val.length <= 8) setDni(val)
              } else {
                setDni(e.target.value)
              }
            }}
            onBlur={buscarCliente}
            placeholder={tipoDoc === 'dni' ? '8 dígitos' : tipoDoc === 'pasaporte' ? 'Nro de pasaporte' : 'Nro de documento'}
            className="flex-1 border rounded-lg px-3 py-2 text-sm"
            maxLength={tipoDoc === 'dni' ? 8 : 20}
          />
        </div>
        <button
          onClick={buscarCliente}
          className="px-4 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium mb-2 h-10"
        >
          Buscar
        </button>
      </div>
      {tipoDoc === 'dni' && dni.length > 0 && dni.length < 8 && (
        <p className="text-xs text-red-500 mb-2 mt-[-8px]">El DNI debe tener 8 dígitos</p>
      )}

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
        type="datetime-local"
        value={fechaSalida}
        onChange={e => setFechaSalida(e.target.value)}
        placeholder="Fecha de salida (opcional)"
        className="w-full border rounded-lg px-3 py-2 text-sm mb-2"
      />
      <div className="flex gap-2">
        <input
          type="number"
          value={adelanto}
          onChange={e => setAdelanto(e.target.value)}
          placeholder="Adelanto (S/)"
          className="w-full border rounded-lg px-3 py-2 text-sm mb-2"
        />
        <input
          type="number"
          value={montoEarly}
          onChange={e => setMontoEarly(e.target.value)}
          placeholder="Early check-in (S/)"
          className="w-full border rounded-lg px-3 py-2 text-sm mb-2"
        />
      </div>
      <textarea
        value={observaciones}
        onChange={e => setObservaciones(e.target.value)}
        placeholder="Observaciones..."
        className="w-full border rounded-lg px-3 py-2 text-sm mb-3 h-16 resize-none"
      />

      {errorMostrar && <p className="text-red-500 text-sm mb-2">{errorMostrar}</p>}

      <div className="flex gap-2">
        <button
          onClick={onCancel}
          className="flex-1 py-2 border rounded-xl text-sm text-gray-600 font-medium hover:bg-gray-50"
        >
          Cancelar
        </button>
        <button
          onClick={handleCrearReserva}
          disabled={guardando}
          className="flex-1 py-2 bg-green-600 text-white rounded-xl text-sm font-medium disabled:opacity-50 hover:bg-green-700"
        >
          {guardando ? 'Guardando...' : 'Confirmar reserva'}
        </button>
      </div>
    </div>
  )
}
