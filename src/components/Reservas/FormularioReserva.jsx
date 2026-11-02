import { useState, useEffect } from 'react'
import { useReservas } from '../../hooks/useReservas'
import { useHabitaciones } from '../../hooks/useHabitaciones'
import { clientesService } from '../../services/clientesService'
import { useAuth } from '../../context/AuthContext'
import Icono from '../Compartido/Icono'

export default function FormularioReserva({ onCancel, turnoActivo }) {
  const { crearReserva, error: errorReserva } = useReservas()
  const { habitaciones, cargarTodas } = useHabitaciones()
  const { usuario } = useAuth()

  const [dni, setDni] = useState('')
  const [tipoDoc, setTipoDoc] = useState('dni')
  const [cliente, setCliente] = useState(null)
  const [nombres, setNombres] = useState('')
  const [telefono, setTelefono] = useState('')
  const [habitacionId, setHabitacionId] = useState('')
  const [tarifaPactada, setTarifaPactada] = useState('')
  const [fechaLlegada, setFechaLlegada] = useState('')
  const [fechaSalida, setFechaSalida] = useState('')
  const [adelanto, setAdelanto] = useState('')
  const [montoEarly, setMontoEarly] = useState('')
  const [observaciones, setObservaciones] = useState('')
  // Número de ficha manual
  const [nroFicha, setNroFicha] = useState('')
  
  const [guardando, setGuardando] = useState(false)
  const [errorValidacion, setErrorValidacion] = useState('')

  useEffect(() => {
    cargarTodas()
  }, [cargarTodas])

  // Al seleccionar habitación, precargamos su tarifa base (editable después)
  useEffect(() => {
    if (!habitacionId) return
    const hab = habitaciones.find(h => h.id === habitacionId)
    if (hab?.precio_actual) setTarifaPactada(hab.precio_actual.toString())
  }, [habitacionId, habitaciones])

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
    if (!nroFicha.trim()) { setErrorValidacion('El número de ficha es obligatorio'); return }
    if (tipoDoc === 'dni' && dni.length !== 8) { setErrorValidacion('El DNI debe tener 8 dígitos'); return }
    if (!nombres.trim()) { setErrorValidacion('El nombre es obligatorio'); return }
    if (!habitacionId) { setErrorValidacion('Selecciona una habitación'); return }
    if (!fechaLlegada) { setErrorValidacion('La fecha de llegada es obligatoria'); return }
    
    setGuardando(true)

    const exito = await crearReserva(
      {
        habitacion_id: habitacionId,
        nro_ficha: parseInt(nroFicha),
        tarifa_pactada: tarifaPactada ? parseFloat(tarifaPactada) : null,
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
      },
      usuario
    )

    if (exito) {
      onCancel() // Cierra el formulario
    }
    setGuardando(false)
  }

  const errorMostrar = errorValidacion || errorReserva

  return (
    <div className="card p-4 sm:p-8 mb-8 max-w-4xl mx-auto">
      
      <div className="mb-6">
        <h3 className="text-2xl font-black text-gray-800">Nueva Reserva</h3>
        <p className="text-sm text-gray-500">Programa la llegada de un futuro huésped</p>
      </div>

      {/* N° DE FICHA MANUAL */}
      <div className="bg-gray-50 border border-gray-200 rounded-2xl px-4 sm:px-6 py-4 mb-6 flex items-center gap-4">
        <div className="flex-1">
          <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-1.5">
            <Icono name="receipt" className="w-4 h-4 inline-block shrink-0" /> Número de Ficha <span className="text-rose-500">*</span>
          </label>
          <input
            type="number"
            inputMode="numeric"
            value={nroFicha}
            onChange={e => setNroFicha(e.target.value)}
            onFocus={e => e.target.select()}
            onWheel={e => e.target.blur()}
            placeholder="Ej: 4425"
            className="input !text-2xl !font-black !tracking-widest !py-3"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
        <div className="space-y-5">
          <h4 className="text-sm font-bold text-gray-500 uppercase tracking-widest border-b border-gray-100 pb-2">
            Datos del Huésped
          </h4>
          
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1.5">Documento de Identidad</label>
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="flex gap-2">
                <select
                  value={tipoDoc}
                  onChange={e => { setTipoDoc(e.target.value); setDni('') }}
                  className="input w-24 sm:w-1/3 shrink-0 "
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
                  className="input flex-1 min-w-0 "
                  maxLength={tipoDoc === 'dni' ? 8 : 20}
                />
              </div>
              <button
                onClick={buscarCliente}
                className="btn btn-secondary w-full sm:w-auto"
              >
                Buscar
              </button>
            </div>
            {tipoDoc === 'dni' && dni.length > 0 && dni.length < 8 && (
              <p className="text-xs text-rose-500 font-bold mt-1.5">El DNI debe tener 8 dígitos</p>
            )}
            {cliente && (
              <div className="mt-2 bg-gray-50 border border-gray-200 p-3 rounded-xl space-y-2">
                <p className="text-xs font-bold text-blue-700 flex items-center gap-1">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                  Cliente registrado
                </p>
                {(() => {
                  if (!cliente.huesped_hospedaje || cliente.huesped_hospedaje.length === 0) return null;
                  
                  // Filtrar los que tienen hospedajes (por si acaso viene null en inner join)
                  const historicos = cliente.huesped_hospedaje
                    .map(h => h.hospedajes)
                    .filter(Boolean)
                    .sort((a, b) => new Date(b.ingreso) - new Date(a.ingreso));

                  if (historicos.length === 0) return null;

                  const ultimo = historicos[0];
                  
                  // Calcular habitación favorita (la que más se repite)
                  const conteoHabitaciones = {};
                  let maxCount = 0;
                  let favorita = 'N/A';
                  
                  historicos.forEach(h => {
                    if (h.habitaciones?.numero) {
                      const num = h.habitaciones.numero;
                      conteoHabitaciones[num] = (conteoHabitaciones[num] || 0) + 1;
                      if (conteoHabitaciones[num] > maxCount) {
                        maxCount = conteoHabitaciones[num];
                        favorita = num;
                      }
                    }
                  });

                  return (
                    <div className="text-xs text-gray-600 space-y-1 pt-1 border-t border-gray-200">
                      <p><span className="font-bold">Última visita:</span> {new Date(ultimo.ingreso).toLocaleDateString()} (S/{ultimo.tarifa_pactada})</p>
                      <p><span className="font-bold">Hab. favorita:</span> {favorita} ({maxCount} veces)</p>
                      <p><span className="font-bold">Total visitas:</span> {historicos.length}</p>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>

          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1.5">Nombre Completo</label>
            <input
              type="text"
              value={nombres}
              onChange={e => setNombres(e.target.value)}
              placeholder="Ej: María Gonzales"
              className="input "
            />
          </div>

          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1.5">Teléfono de Contacto</label>
            <input
              type="text"
              value={telefono}
              onChange={e => setTelefono(e.target.value)}
              placeholder="Número de celular"
              className="input "
            />
          </div>
        </div>

        <div className="space-y-5">
          <h4 className="text-sm font-bold text-gray-500 uppercase tracking-widest border-b border-gray-100 pb-2">
            Detalles de la Reserva
          </h4>
          
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1.5">Habitación Asignada</label>
            <select
              value={habitacionId}
              onChange={e => setHabitacionId(e.target.value)}
              className="input "
            >
              <option value="">Seleccionar habitación...</option>
              {habitaciones.map(h => (
                <option key={h.id} value={h.id}>
                  Hab {h.numero} — {h.tipo_actual} (S/{h.precio_actual}) - {h.estado}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1.5">Tarifa por Noche (S/)</label>
            <input
              type="number"
              inputMode="decimal"
              value={tarifaPactada}
              onChange={e => setTarifaPactada(e.target.value)}
              onFocus={e => e.target.select()}
              onWheel={e => e.target.blur()}
              placeholder="Se llena con el precio de la habitación"
              className="input font-bold text-gray-700"
            />
            <p className="text-[11px] text-gray-400 mt-1">Se precarga con el precio actual de la habitación, pero puedes negociar otra tarifa aquí mismo.</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1.5">Llegada Estimada</label>
              <input
                type="datetime-local"
                value={fechaLlegada}
                onChange={e => setFechaLlegada(e.target.value)}
                className="input "
              />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1.5">Salida (Opcional)</label>
              <input
                type="datetime-local"
                value={fechaSalida}
                onChange={e => setFechaSalida(e.target.value)}
                className="input "
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
                className="input "
              />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1.5">Early Check-in (S/)</label>
              <input
                type="number"
                value={montoEarly}
                onChange={e => setMontoEarly(e.target.value)}
                placeholder="0.00"
                className="input "
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1.5">Observaciones Adicionales</label>
            <textarea
              value={observaciones}
              onChange={e => setObservaciones(e.target.value)}
              placeholder="Requerimientos especiales, hora exacta de llegada..."
              className="input h-16 resize-none"
            />
          </div>
        </div>
      </div>

      {errorMostrar && (
        <div className="mt-6 bg-rose-50 text-rose-600 text-sm p-4 rounded-xl border border-rose-100 font-bold text-center">
          <Icono name="alert" className="w-4 h-4 inline-block shrink-0" /> {errorMostrar}
        </div>
      )}

      <div className="mt-8 pt-6 border-t border-gray-100 flex gap-4">
        <button
          onClick={onCancel}
          className="btn btn-secondary flex-1 !min-h-[52px]"
        >
          Cancelar
        </button>
        <button
          onClick={handleCrearReserva}
          disabled={guardando}
          className="btn btn-primary flex-[2] !min-h-[52px] !text-base disabled:opacity-50"
        >
          {guardando ? 'Registrando...' : 'Confirmar Reserva'}
        </button>
      </div>
    </div>
  )
}
