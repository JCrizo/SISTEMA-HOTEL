import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

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
      }
    )

    if (exito) {
      navigate('/')
    }
  }

  return (
    <div>
      <div className="bg-white rounded-xl border p-4 mb-3">
        <label className="text-xs text-gray-500 font-medium uppercase">Documento</label>
        <select
          value={tipoDoc}
          onChange={e => { setTipoDoc(e.target.value); setDni('') }}
          className="w-full border rounded-lg px-3 py-2 text-sm mt-2 mb-2"
        >
          <option value="dni">DNI (8 dígitos)</option>
          <option value="pasaporte">Pasaporte</option>
          <option value="otro">Otro documento</option>
        </select>
        <div className="flex gap-2">
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
            onBlur={handleBuscarCliente}
            placeholder={tipoDoc === 'dni' ? '8 dígitos' : tipoDoc === 'pasaporte' ? 'Nro de pasaporte' : 'Nro de documento'}
            className="flex-1 border rounded-lg px-3 py-2 text-sm"
            maxLength={tipoDoc === 'dni' ? 8 : 20}
          />
          <button
            onClick={handleBuscarCliente}
            className="px-4 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium"
          >
            Buscar
          </button>
        </div>
        {tipoDoc === 'dni' && dni.length > 0 && dni.length < 8 && (
          <p className="text-xs text-red-500 mt-1">El DNI debe tener 8 dígitos</p>
        )}

        {cliente && (
          <div className="mt-2 p-2 bg-green-50 border border-green-300 rounded-lg">
            <p className="text-xs font-medium text-green-800">✓ Cliente frecuente encontrado</p>
            <p className="text-xs text-green-700 mt-1">
              Tarifa habitual: S/{cliente.tarifa_habitual}
            </p>
            {cliente.lista_negra && (
              <p className="text-xs text-red-600 font-medium mt-1">⚠ Cliente en lista negra</p>
            )}
            {cliente.deuda_pendiente > 0 && (
              <p className="text-xs text-red-600 mt-1">⚠ Tiene deuda pendiente: S/{cliente.deuda_pendiente}</p>
            )}
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl border p-4 mb-3">
        <label className="text-xs text-gray-500 font-medium uppercase">Datos del huésped</label>
        <input
          type="text"
          value={nombres}
          onChange={e => setNombres(e.target.value)}
          placeholder="Nombres y apellidos"
          className="w-full border rounded-lg px-3 py-2 text-sm mt-2"
        />
        <input
          type="text"
          value={telefono}
          onChange={e => setTelefono(e.target.value)}
          placeholder="Teléfono"
          className="w-full border rounded-lg px-3 py-2 text-sm mt-2"
        />
        <input
          type="text"
          value={nacionalidad}
          onChange={e => setNacionalidad(e.target.value)}
          placeholder="Nacionalidad"
          className="w-full border rounded-lg px-3 py-2 text-sm mt-2"
        />
      </div>

      <div className="bg-white rounded-xl border p-4 mb-3">
        <label className="text-xs text-gray-500 font-medium uppercase">Estadía</label>
        <div className="flex gap-2 mt-2">
          <div className="flex-1">
            <label className="text-xs text-gray-400 mb-1 block">Noches</label>
            <input
              type="number"
              min="1"
              value={noches}
              onChange={e => actualizarNoches(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div className="flex-1">
            <label className="text-xs text-gray-400 mb-1 block">Fecha de salida</label>
            <input
              type="date"
              value={fechaSalida}
              onChange={e => actualizarFechaSalida(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm"
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border p-4 mb-3">
        <label className="text-xs text-gray-500 font-medium uppercase">Tarifa y pago</label>
        <input
          type="number"
          value={tarifaPorNoche}
          onChange={e => setTarifaPorNoche(e.target.value)}
          placeholder="Tarifa por noche (S/)"
          className="w-full border rounded-lg px-3 py-2 text-sm mt-2"
        />
        {noches > 1 && (
          <p className="text-xs text-gray-500 mt-1">
            S/{tarifaPorNoche || 0} × {noches} noches = <span className="font-semibold">S/{parseFloat(tarifa || 0).toFixed(2)}</span>
          </p>
        )}
        <select
          value={metodoPago}
          onChange={e => setMetodoPago(e.target.value)}
          className="w-full border rounded-lg px-3 py-2 text-sm mt-2"
        >
          <option value="efectivo">Efectivo</option>
          <option value="yape">Yape</option>
          <option value="tarjeta">Tarjeta</option>
          <option value="transferencia">Transferencia</option>
        </select>
        {metodoPago === 'tarjeta' && (
          <input
            type="text"
            value={nroTicket}
            onChange={e => setNroTicket(e.target.value)}
            placeholder="Nro de ticket (opcional)"
            className="w-full border rounded-lg px-3 py-2 text-sm mt-2"
          />
        )}
        <div className="flex flex-col gap-2 mt-2">
          {[
            { value: 'completo', label: 'Paga ahora completo' },
            { value: 'adelanto', label: 'Adelanto' },
            { value: 'al_salir', label: 'Paga al salir' },
          ].map(op => (
            <label key={op.value} className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="modalPago"
                value={op.value}
                checked={modalPago === op.value}
                onChange={() => setModalPago(op.value)}
              />
              {op.label}
            </label>
          ))}
        </div>

        {modalPago === 'adelanto' && (
          <input
            type="number"
            value={adelanto}
            onChange={e => setAdelanto(e.target.value)}
            placeholder="Monto adelanto (S/)"
            className="w-full border rounded-lg px-3 py-2 text-sm mt-2"
          />
        )}
      </div>

      <div className="bg-white rounded-xl border p-4 mb-3">
        <label className="text-xs text-gray-500 font-medium uppercase">Comprobante</label>
        <div className="flex gap-4 mt-2">
          {['ninguno', 'boleta', 'factura'].map(op => (
            <label key={op} className="flex items-center gap-2 text-sm capitalize">
              <input
                type="radio"
                name="comprobante"
                value={op}
                checked={comprobante === op}
                onChange={() => setComprobante(op)}
              />
              {op}
            </label>
          ))}
        </div>
        {comprobante === 'factura' && (
          <input
            type="text"
            value={ruc}
            onChange={e => setRuc(e.target.value)}
            placeholder="RUC"
            className="w-full border rounded-lg px-3 py-2 text-sm mt-2"
          />
        )}
      </div>

      <div className="bg-white rounded-xl border p-4 mb-4">
        <label className="text-xs text-gray-500 font-medium uppercase">Observaciones</label>
        <textarea
          value={observaciones}
          onChange={e => setObservaciones(e.target.value)}
          placeholder="Notas adicionales..."
          className="w-full border rounded-lg px-3 py-2 text-sm mt-2 h-20 resize-none"
        />
      </div>

      {error && <p className="text-red-500 text-sm mb-3">{error}</p>}

      <button
        onClick={confirmar}
        disabled={cargando}
        className="w-full py-3 bg-green-600 text-white rounded-xl font-semibold disabled:opacity-50 hover:bg-green-700"
      >
        {cargando ? 'Guardando...' : 'Confirmar check-in'}
      </button>
    </div>
  )
}
