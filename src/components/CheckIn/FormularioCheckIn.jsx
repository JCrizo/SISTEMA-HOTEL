import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import SeccionHuespedTitular from './SeccionHuespedTitular'
import SeccionAcompanantes from './SeccionAcompanantes'
import SeccionEstadia from './SeccionEstadia'
import SeccionPago from './SeccionPago'

export default function FormularioCheckIn({
  hab,
  datosIniciales,
  turnoActivo,
  cargando,
  error,
  setError,
  buscarCliente,
  realizarCheckIn
}) {
  const navigate = useNavigate()
  
  const [dni, setDni] = useState('')
  const [tipoDoc, setTipoDoc] = useState('dni')
  const [cliente, setCliente] = useState(null)
  const [nombres, setNombres] = useState('')
  const [telefono, setTelefono] = useState('')
  const [nacionalidad, setNacionalidad] = useState('')

  const [tarifaPorNoche, setTarifaPorNoche] = useState('')
  const [tarifa, setTarifa] = useState('')
  const [noches, setNoches] = useState(1)
  const [fechaSalida, setFechaSalida] = useState('')
  const [metodoPago, setMetodoPago] = useState('efectivo')
  const [nroTicket, setNroTicket] = useState('')
  const [modalPago, setModalPago] = useState('al_salir')
  const [adelanto, setAdelanto] = useState('')
  const [montoEarly, setMontoEarly] = useState('')
  const [comprobante, setComprobante] = useState('ninguno')
  const [ruc, setRuc] = useState('')
  const [observaciones, setObservaciones] = useState('')

  // Efecto para cargar datos iniciales de la habitación o reserva
  useEffect(() => {
    if (!datosIniciales) return

    setTarifaPorNoche(datosIniciales.habitacion?.precio_actual || '')
    
    // Fecha de salida por defecto
    const ahora = new Date()
    const hora = ahora.getHours()
    const salidaPorDefecto = new Date(ahora)
    if (hora >= 5) salidaPorDefecto.setDate(salidaPorDefecto.getDate() + 1)
    setFechaSalida(salidaPorDefecto.toISOString().split('T')[0])

    // Si viene de una reserva
    if (datosIniciales.reserva) {
      const res = datosIniciales.reserva
      const cli = res.clientes
      
      if (cli) {
        setDni(cli.dni_pasaporte || '')
        setNombres(cli.nombres || '')
        setTelefono(cli.telefono || '')
        setNacionalidad(cli.nacionalidad || '')
        setCliente(cli)
        if (cli.tarifa_habitual) setTarifaPorNoche(cli.tarifa_habitual)
      }
      
      if (parseFloat(res.adelanto) > 0) {
        setAdelanto(res.adelanto.toString())
        setModalPago('adelanto')
      }
      if (parseFloat(res.monto_early) > 0) {
        setMontoEarly(res.monto_early.toString())
      }
      if (res.observaciones) setObservaciones(res.observaciones)
      
      if (res.fecha_salida) {
        const fechaSalidaReserva = new Date(res.fecha_salida)
        setFechaSalida(fechaSalidaReserva.toISOString().split('T')[0])
        const diffMs = fechaSalidaReserva.setHours(0,0,0,0) - new Date().setHours(0,0,0,0)
        const nochesCalculadas = Math.max(1, Math.round(diffMs / (1000 * 60 * 60 * 24)))
        setNoches(nochesCalculadas)
      }
    }
  }, [datosIniciales])

  // Tarifa total = tarifa por noche × número de noches
  useEffect(() => {
    const porNoche = parseFloat(tarifaPorNoche) || 0
    setTarifa((porNoche * noches).toString())
  }, [tarifaPorNoche, noches])

  function calcularFechaDesdeNoches(n) {
    const ahora = new Date()
    const hora = ahora.getHours()
    const base = new Date(ahora)
    if (hora >= 5) base.setDate(base.getDate() + 1)
    base.setDate(base.getDate() + (n - 1))
    return base.toISOString().split('T')[0]
  }

  function actualizarNoches(valor) {
    const n = Math.max(1, parseInt(valor) || 1)
    setNoches(n)
    setFechaSalida(calcularFechaDesdeNoches(n))
  }

  function actualizarFechaSalida(valor) {
    setFechaSalida(valor)
    const hoy = new Date()
    hoy.setHours(0, 0, 0, 0)
    const nuevaFecha = new Date(valor + 'T00:00:00')
    const diffDias = Math.round((nuevaFecha - hoy) / (1000 * 60 * 60 * 24))
    setNoches(Math.max(1, diffDias))
  }

  async function handleBuscarCliente() {
    if (!dni.trim()) return
    const data = await buscarCliente(dni.trim())
    if (data) {
      setCliente(data)
      setNombres(data.nombres)
      setTelefono(data.telefono || '')
      setNacionalidad(data.nacionalidad || '')
      if (data.tarifa_habitual) setTarifaPorNoche(data.tarifa_habitual)
    } else {
      setCliente(null)
      setNombres('')
      setTelefono('')
    }
  }

  async function confirmar() {
    setError(null)
    if (!turnoActivo) { setError('Debes iniciar turno antes de continuar.'); return }
    if (!nombres.trim()) { setError('El nombre es obligatorio'); return }
    if (tipoDoc === 'dni' && dni.length !== 8) { setError('El DNI debe tener 8 dígitos'); return }
    if (!tarifaPorNoche) { setError('La tarifa por noche es obligatoria'); return }
    if (!fechaSalida) { setError('La fecha de salida es obligatoria'); return }

    const ahora = new Date()
    const salidaEstimada = new Date(fechaSalida + 'T12:00:00')

    let montoPagado = 0
    if (modalPago === 'completo') montoPagado = parseFloat(tarifa)
    else if (modalPago === 'adelanto' && parseFloat(adelanto) > 0) montoPagado = parseFloat(adelanto)

    const exito = await realizarCheckIn(
      {
        habitacionId: hab.id,
        turnoId: turnoActivo.id,
        reservaId: datosIniciales?.reserva?.id || null,
        ingreso: ahora.toISOString(),
        salida_estimada: salidaEstimada.toISOString(),
        tarifa_pactada: parseFloat(tarifa),
        metodo_pago: metodoPago,
        estado_pago: modalPago === 'completo' ? 'pagado' : modalPago === 'adelanto' ? 'parcial' : 'pendiente',
        comprobante,
        ruc: comprobante === 'factura' ? ruc : null,
        observaciones,
        monto_early: parseFloat(montoEarly || 0),
        montoPagado,
        cajaTurnoActual: turnoActivo.caja_principal_actual,
        nroTicket
      },
      {
        id: cliente?.id || null,
        dni_pasaporte: dni.trim(),
        nombres,
        telefono,
        nacionalidad
      },
      acompanantes
    )

    if (exito) {
      navigate('/')
    }
  }

  const [acompanantes, setAcompanantes] = useState([])
  
  function agregarAcompanante() {
    setAcompanantes([...acompanantes, { dni: '', tipoDoc: 'dni', nombres: '', telefono: '', nacionalidad: '', clienteId: null }])
  }

  function eliminarAcompanante(index) {
    const nuevos = [...acompanantes]
    nuevos.splice(index, 1)
    setAcompanantes(nuevos)
  }

  function actualizarAcompanante(index, campo, valor) {
    const nuevos = [...acompanantes]
    nuevos[index][campo] = valor
    setAcompanantes(nuevos)
  }

  async function buscarAcompanante(index) {
    const ac = acompanantes[index]
    if (!ac.dni.trim()) return
    const data = await buscarCliente(ac.dni.trim())
    if (data) {
      actualizarAcompanante(index, 'nombres', data.nombres)
      actualizarAcompanante(index, 'telefono', data.telefono || '')
      actualizarAcompanante(index, 'nacionalidad', data.nacionalidad || '')
      actualizarAcompanante(index, 'clienteId', data.id)
    } else {
      actualizarAcompanante(index, 'nombres', '')
      actualizarAcompanante(index, 'telefono', '')
      actualizarAcompanante(index, 'clienteId', null)
    }
  }

  // --- RENDERING ...
  return (
    <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
      {/* ... header ... */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-6 text-white flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black tracking-tight flex items-center gap-2">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" /></svg>
            Registro Check-In
          </h2>
          <p className="text-blue-100 font-medium text-sm mt-1">Completa los datos para iniciar la estadía</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-blue-200 font-bold uppercase tracking-widest">Habitación</p>
          <p className="text-3xl font-black">{hab.numero}</p>
        </div>
      </div>

      <div className="p-8 space-y-8">
        
        {/* SECCIÓN: HUÉSPED TITULAR */}
        <section>
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-gray-600">1</span>
            Huésped Titular
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50 p-6 rounded-2xl border border-gray-100">
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1.5">Documento</label>
              <div className="flex gap-2">
                <select
                  value={tipoDoc}
                  onChange={e => { setTipoDoc(e.target.value); setDni('') }}
                  className="w-1/3 border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-blue-500 bg-white transition-colors font-medium"
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
                    } else setDni(e.target.value)
                  }}
                  onBlur={handleBuscarCliente}
                  placeholder={tipoDoc === 'dni' ? '8 dígitos' : 'Número'}
                  className="flex-1 border-2 border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-500 bg-white transition-colors"
                  maxLength={tipoDoc === 'dni' ? 8 : 20}
                />
                <button
                  onClick={handleBuscarCliente}
                  className="px-4 py-2.5 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-xl text-sm font-bold transition-colors"
                >
                  Buscar
                </button>
              </div>
              {tipoDoc === 'dni' && dni.length > 0 && dni.length < 8 && (
                <p className="text-xs text-red-500 font-bold mt-1.5">El DNI debe tener 8 dígitos</p>
              )}

              {cliente && (
                <div className="mt-3 p-3 bg-blue-50 border border-blue-100 rounded-xl space-y-2">
                  <p className="text-xs font-bold text-blue-800 flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                    Cliente frecuente
                  </p>
                  
                  {(() => {
                    if (!cliente.huesped_hospedaje || cliente.huesped_hospedaje.length === 0) return null;
                    
                    const historicos = cliente.huesped_hospedaje
                      .map(h => h.hospedajes)
                      .filter(Boolean)
                      .sort((a, b) => new Date(b.ingreso) - new Date(a.ingreso));

                    if (historicos.length === 0) return null;

                    const ultimo = historicos[0];
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
                      <div className="text-[10px] text-blue-800 space-y-1 pt-1 border-t border-blue-200/50">
                        <p><span className="font-bold">Última visita:</span> {new Date(ultimo.ingreso).toLocaleDateString()} (S/{ultimo.tarifa_pactada})</p>
                        <p><span className="font-bold">Hab. favorita:</span> {favorita} ({maxCount} veces)</p>
                        <p><span className="font-bold">Total visitas:</span> {historicos.length}</p>
                      </div>
                    );
                  })()}

                  {cliente.tarifa_habitual && (
                    <p className="text-xs font-bold text-blue-700 mt-1 bg-white px-2 py-1 rounded inline-block shadow-sm">
                      Tarifa habitual: S/{cliente.tarifa_habitual}
                    </p>
                  )}
                  {cliente.lista_negra && (
                    <p className="text-xs text-red-600 font-black mt-2 bg-red-100 px-2 py-1 rounded inline-block">⚠ EN LISTA NEGRA</p>
                  )}
                  {cliente.deuda_pendiente > 0 && (
                    <p className="text-xs text-orange-600 font-bold mt-2 bg-orange-100 px-2 py-1 rounded inline-block">⚠ Deuda: S/{cliente.deuda_pendiente}</p>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1.5">Nombre Completo</label>
                <input
                  type="text"
                  value={nombres}
                  onChange={e => setNombres(e.target.value)}
                  placeholder="Ej: Juan Pérez"
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-500 bg-white transition-colors"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1.5">Teléfono</label>
                  <input
                    type="text"
                    value={telefono}
                    onChange={e => setTelefono(e.target.value)}
                    placeholder="Opcional"
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-500 bg-white transition-colors"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1.5">Nacionalidad</label>
                  <input
                    type="text"
                    value={nacionalidad}
                    onChange={e => setNacionalidad(e.target.value)}
                    placeholder="Ej: Peruana"
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-500 bg-white transition-colors"
                  />
                </div>
              </div>
            </div>
          </div>
          
          {/* SECCIÓN ACOMPAÑANTES */}
          <SeccionAcompanantes
            acompanantes={acompanantes}
            agregarAcompanante={agregarAcompanante}
            eliminarAcompanante={eliminarAcompanante}
            actualizarAcompanante={actualizarAcompanante}
            buscarAcompanante={buscarAcompanante}
          />
        </section>

        {/* SECCIÓN: ESTADÍA */}
        <SeccionEstadia
          noches={noches} actualizarNoches={actualizarNoches}
          fechaSalida={fechaSalida} actualizarFechaSalida={actualizarFechaSalida}
          tarifaPorNoche={tarifaPorNoche} setTarifaPorNoche={setTarifaPorNoche}
          tarifa={tarifa} montoEarly={montoEarly} setMontoEarly={setMontoEarly}
        />

        {/* SECCIÓN: PAGO */}
        <SeccionPago
          tarifa={tarifa} tarifaPorNoche={tarifaPorNoche} noches={noches}
          modalPago={modalPago} setModalPago={setModalPago}
          metodoPago={metodoPago} setMetodoPago={setMetodoPago}
          nroTicket={nroTicket} setNroTicket={setNroTicket}
          adelanto={adelanto} setAdelanto={setAdelanto}
          comprobante={comprobante} setComprobante={setComprobante}
          ruc={ruc} setRuc={setRuc}
          observaciones={observaciones} setObservaciones={setObservaciones}
        />

        {error && (
          <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 text-center">
            <p className="text-sm font-bold text-red-600 flex justify-center items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              {error}
            </p>
          </div>
        )}

        <div className="pt-4 border-t border-gray-100 flex gap-4">
          <button
            onClick={() => navigate('/')}
            className="px-8 py-4 border-2 border-gray-200 rounded-2xl text-gray-600 font-bold hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={confirmar}
            disabled={cargando}
            className="flex-1 py-4 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-2xl font-black text-lg shadow-lg transition-transform active:scale-[0.98] disabled:opacity-50 flex justify-center items-center gap-2"
          >
            {cargando ? (
              <span className="flex items-center gap-2">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Procesando...
              </span>
            ) : (
              <>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                Confirmar Check-In
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  )
}
