import { useState, useEffect } from 'react'
import { useReservas } from '../../hooks/useReservas'
import { useHabitaciones } from '../../hooks/useHabitaciones'
import { clientesService } from '../../services/clientesService'

function etiquetaEstado(estado) {
  const etiquetas = {
    ocupada: 'Ocupada',
    pendiente_limpieza: 'Pend. limpieza',
    en_limpieza: 'En limpieza',
    limpieza_simple: 'Limpieza simple',
    mantenimiento: 'Mantenimiento'
  }
  return etiquetas[estado] || estado
}

export default function FormularioReserva({ onCancel, turnoActivo }) {
  const { crearReserva, error: errorReserva } = useReservas()
  const { habitaciones, cargarTodas } = useHabitaciones()

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
    cargarTodas()
  }, [cargarTodas])

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
    <div className="bg-white rounded-3xl border border-indigo-100 p-8 shadow-xl relative overflow-hidden mb-8 max-w-4xl mx-auto">
      <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-500 to-purple-500"></div>
      
      <div className="mb-6">
        <h3 className="text-2xl font-black text-gray-800">Nueva Reserva</h3>
        <p className="text-sm text-gray-500">Programa la llegada de un futuro huésped</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
        <div className="space-y-5">
          <h4 className="text-sm font-bold text-indigo-800 uppercase tracking-widest border-b border-indigo-100 pb-2">
            Datos del Huésped
          </h4>
          
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1.5">Documento de Identidad</label>
            <div className="flex gap-2">
              <select
                value={tipoDoc}
                onChange={e => { setTipoDoc(e.target.value); setDni('') }}
                className="w-1/3 border-2 border-gray-100 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-indigo-500 bg-gray-50 focus:bg-white transition-colors"
              >
                <option value="dni">DNI</option>
                <option value="pasaporte">Pasaporte</option>
                <option value="otro">Otro</option>
              </select>
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
                placeholder={tipoDoc === 'dni' ? '8 dígitos' : 'Número'}
                className="flex-1 border-2 border-gray-100 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-500 bg-gray-50 focus:bg-white transition-colors"
                maxLength={tipoDoc === 'dni' ? 8 : 20}
              />
              <button
                onClick={buscarCliente}
                className="px-4 py-2.5 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 rounded-xl text-sm font-bold transition-colors"
              >
                Buscar
              </button>
            </div>
            {tipoDoc === 'dni' && dni.length > 0 && dni.length < 8 && (
              <p className="text-xs text-red-500 font-bold mt-1.5">El DNI debe tener 8 dígitos</p>
            )}
            {cliente && (
              <p className="text-xs font-bold text-green-600 bg-green-50 px-3 py-2 rounded-lg mt-2 inline-flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                Cliente registrado
              </p>
            )}
          </div>

          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1.5">Nombre Completo</label>
            <input
              type="text"
              value={nombres}
              onChange={e => setNombres(e.target.value)}
              placeholder="Ej: María Gonzales"
              className="w-full border-2 border-gray-100 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-500 bg-gray-50 focus:bg-white transition-colors"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1.5">Teléfono de Contacto</label>
            <input
              type="text"
              value={telefono}
              onChange={e => setTelefono(e.target.value)}
              placeholder="Número de celular"
              className="w-full border-2 border-gray-100 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-500 bg-gray-50 focus:bg-white transition-colors"
            />
          </div>
        </div>

        <div className="space-y-5">
          <h4 className="text-sm font-bold text-indigo-800 uppercase tracking-widest border-b border-indigo-100 pb-2">
            Detalles de la Reserva
          </h4>
          
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1.5">Habitación Asignada</label>
            <select
              value={habitacionId}
              onChange={e => setHabitacionId(e.target.value)}
              className="w-full border-2 border-gray-100 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-500 bg-gray-50 focus:bg-white transition-colors"
            >
              <option value="">Seleccionar habitación...</option>
              {habitaciones.map(h => (
                <option key={h.id} value={h.id}>
                  Hab {h.numero} — {h.tipo_actual} (S/{h.precio_actual}){h.estado !== 'disponible' ? ` · ${etiquetaEstado(h.estado)} ahora` : ''}
                </option>
              ))}
            </select>
            {habitacionId && habitaciones.find(h => h.id === habitacionId)?.estado !== 'disponible' && (
              <p className="text-xs text-amber-600 font-bold mt-1.5 bg-amber-50 px-3 py-2 rounded-lg">
                ⚠ Esta habitación está {etiquetaEstado(habitaciones.find(h => h.id === habitacionId)?.estado).toLowerCase()} en este momento. Confirma que estará libre para la fecha de llegada.
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1.5">Llegada Estimada</label>
              <input
                type="datetime-local"
                value={fechaLlegada}
                onChange={e => setFechaLlegada(e.target.value)}
                className="w-full border-2 border-gray-100 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-indigo-500 bg-gray-50 focus:bg-white transition-colors"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1.5">Salida (Opcional)</label>
              <input
                type="datetime-local"
                value={fechaSalida}
                onChange={e => setFechaSalida(e.target.value)}
                className="w-full border-2 border-gray-100 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-indigo-500 bg-gray-50 focus:bg-white transition-colors"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1.5">Adelanto (S/)</label>
              <input
                type="number"
                value={adelanto}
                onChange={e => setAdelanto(e.target.value)}
                placeholder="0.00"
                className="w-full border-2 border-gray-100 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-500 bg-gray-50 focus:bg-white transition-colors"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1.5">Early Check-in (S/)</label>
              <input
                type="number"
                value={montoEarly}
                onChange={e => setMontoEarly(e.target.value)}
                placeholder="0.00"
                className="w-full border-2 border-gray-100 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-500 bg-gray-50 focus:bg-white transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1.5">Observaciones Adicionales</label>
            <textarea
              value={observaciones}
              onChange={e => setObservaciones(e.target.value)}
              placeholder="Requerimientos especiales, hora exacta de llegada..."
              className="w-full border-2 border-gray-100 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-500 bg-gray-50 focus:bg-white transition-colors h-16 resize-none"
            />
          </div>
        </div>
      </div>

      {errorMostrar && (
        <div className="mt-6 bg-red-50 text-red-600 text-sm p-4 rounded-xl border border-red-100 font-bold text-center">
          ⚠ {errorMostrar}
        </div>
      )}

      <div className="mt-8 pt-6 border-t border-gray-100 flex gap-4">
        <button
          onClick={onCancel}
          className="flex-1 py-3.5 border-2 border-gray-200 rounded-xl text-gray-700 font-bold hover:bg-gray-50 transition-colors"
        >
          Cancelar
        </button>
        <button
          onClick={handleCrearReserva}
          disabled={guardando}
          className="flex-[2] py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl font-bold text-lg shadow-md transition-transform active:scale-[0.98] disabled:opacity-50"
        >
          {guardando ? 'Registrando...' : 'Confirmar Reserva'}
        </button>
      </div>
    </div>
  )
}
