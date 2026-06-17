import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useSearchParams } from 'react-router-dom'
import { useTurnoActivo } from '../hooks/useTurnoActivo'
import AvisoSinTurno from '../components/AvisoSinTurno'

function CheckIn() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [hab, setHab] = useState(null)
  const [searchParams] = useSearchParams()
  const reservaId = searchParams.get('reserva')
  const [montoEarly, setMontoEarly] = useState('')
  const [salidaDesdeReserva, setSalidaDesdeReserva] = useState(null)
  // Datos del huésped
  const [dni, setDni] = useState('')
  const [tipoDoc, setTipoDoc] = useState('dni')
  const [cliente, setCliente] = useState(null)
  const [nombres, setNombres] = useState('')
  const [telefono, setTelefono] = useState('')
  const [nacionalidad, setNacionalidad] = useState('')

  // Datos del hospedaje
  const [tarifaPorNoche, setTarifaPorNoche] = useState('')
  const [tarifa, setTarifa] = useState('')
  const [noches, setNoches] = useState(1)
  const [fechaSalida, setFechaSalida] = useState('')
  const [metodoPago, setMetodoPago] = useState('efectivo')
  const [nroTicket, setNroTicket] = useState('')
  const [modalPago, setModalPago] = useState('al_salir')
  const [adelanto, setAdelanto] = useState('')
  const [comprobante, setComprobante] = useState('ninguno')
  const [ruc, setRuc] = useState('')
  const [observaciones, setObservaciones] = useState('')

  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')
  const { turnoActivo, cargandoTurno } = useTurnoActivo()

  useEffect(() => 
    {
      async function cargarDatos() {
        const { data: habData } = await supabase
          .from('habitaciones')
          .select('*')
          .eq('id', id)
          .single()
        if (habData) {
          setHab(habData)
          setTarifaPorNoche(habData.precio_actual)
        }

        // Fecha de salida por defecto: 1 noche desde ahora
        const ahora = new Date()
        const hora = ahora.getHours()
        const salidaPorDefecto = new Date(ahora)
        if (hora >= 5) {
          salidaPorDefecto.setDate(salidaPorDefecto.getDate() + 1)
        }
        setFechaSalida(salidaPorDefecto.toISOString().split('T')[0])

      if (reservaId) {
        const { data: reserva } = await supabase
          .from('reservas')
          .select('*, clientes(*)')
          .eq('id', reservaId)
          .single()

      if (reserva) {
        setDni(reserva.clientes?.dni_pasaporte || '')
        setNombres(reserva.clientes?.nombres || '')
        setTelefono(reserva.clientes?.telefono || '')
        setNacionalidad(reserva.clientes?.nacionalidad || '')
        setCliente(reserva.clientes)
        if (reserva.clientes?.tarifa_habitual) {
          setTarifaPorNoche(reserva.clientes.tarifa_habitual)
        }
        if (parseFloat(reserva.adelanto) > 0) {
          setAdelanto(reserva.adelanto.toString())
          setModalPago('adelanto')
        }
        if (parseFloat(reserva.monto_early) > 0) {
          setMontoEarly(reserva.monto_early.toString())
        }
        if (reserva.observaciones) setObservaciones(reserva.observaciones)
        if (reserva.fecha_salida) {
          const fechaSalidaReserva = new Date(reserva.fecha_salida)
          setSalidaDesdeReserva(fechaSalidaReserva.toISOString())
          setFechaSalida(fechaSalidaReserva.toISOString().split('T')[0])
          const diffMs = fechaSalidaReserva.setHours(0,0,0,0) - new Date().setHours(0,0,0,0)
          const nochesCalculadas = Math.max(1, Math.round(diffMs / (1000 * 60 * 60 * 24)))
          setNoches(nochesCalculadas)
        }
      }
    }
  }
  cargarDatos()
}, [id, reservaId])

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
    setSalidaDesdeReserva(null)
  }

  function actualizarFechaSalida(valor) {
    setFechaSalida(valor)
    setSalidaDesdeReserva(null)
    const hoy = new Date()
    hoy.setHours(0, 0, 0, 0)
    const nuevaFecha = new Date(valor + 'T00:00:00')
    const diffDias = Math.round((nuevaFecha - hoy) / (1000 * 60 * 60 * 24))
    setNoches(Math.max(1, diffDias))
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
      setNacionalidad(data.nacionalidad || '')
      if (data.tarifa_habitual) setTarifaPorNoche(data.tarifa_habitual)
    } else {
      setCliente(null)
      setNombres('')
      setTelefono('')
    }
  }

  async function confirmarCheckin() {
    setError('')
    if (!turnoActivo) { setError('No hay un turno activo. Debes iniciar turno antes de continuar.'); return }
    if (!nombres.trim()) { setError('El nombre es obligatorio'); return }
    if (tipoDoc === 'dni' && dni.length !== 8) { setError('El DNI debe tener 8 dígitos'); return }
    if (!tarifaPorNoche) { setError('La tarifa por noche es obligatoria'); return }
    if (reservaId) {
      await supabase
        .from('reservas')
        .update({ estado: 'convertida' })
        .eq('id', reservaId)
    }
    setGuardando(true)

    // 1. Crear o actualizar cliente
    let clienteId
    if (cliente) {
      clienteId = cliente.id
    } else {
      const { data, error } = await supabase
        .from('clientes')
        .insert({ dni_pasaporte: dni.trim(), nombres, telefono, nacionalidad })
        .select()
        .single()
      if (error) { setError('Error al guardar cliente'); setGuardando(false); return }
      clienteId = data.id
    }

    // 2. Calcular salida estimada a partir de la fecha elegida
    if (!fechaSalida) { setError('La fecha de salida es obligatoria'); setGuardando(false); return }
    const ahora = new Date()
    const salidaEstimada = new Date(fechaSalida + 'T12:00:00')

    // 3. Crear hospedaje
    const { data: hospedaje, error: errHosp } = await supabase
      .from('hospedajes')
      .insert({
        habitacion_id: id,
        turno_id: turnoActivo.id,
        ingreso: ahora.toISOString(),
        salida_estimada: salidaEstimada.toISOString(),
        tarifa_pactada: parseFloat(tarifa),
        metodo_pago: metodoPago,
        estado_pago: modalPago === 'completo' ? 'pagado' : modalPago === 'adelanto' ? 'parcial' : 'pendiente',
        comprobante,
        ruc: comprobante === 'factura' ? ruc : null,
        observaciones,
        estado: 'activo',
        early_checkin: parseFloat(montoEarly || 0) > 0,
        monto_early: parseFloat(montoEarly || 0),
        
      })
      .select()
      .single()

    if (errHosp) { setError('Error al crear hospedaje'); setGuardando(false); return }

    // 4. Vincular huésped
    await supabase.from('huesped_hospedaje').insert({
      hospedaje_id: hospedaje.id,
      cliente_id: clienteId,
      es_titular: true
    })

    // 5. Registrar pago si hay
        let montoPagado = 0
        if (modalPago === 'completo') {
          montoPagado = parseFloat(tarifa)
          await supabase.from('pagos').insert({
            hospedaje_id: hospedaje.id,
            monto: montoPagado,
            metodo: metodoPago,
            concepto: 'hospedaje',
            observaciones: nroTicket
          })
        } else if (modalPago === 'adelanto' && parseFloat(adelanto) > 0) {
          montoPagado = parseFloat(adelanto)
          await supabase.from('pagos').insert({
            hospedaje_id: hospedaje.id,
            monto: montoPagado,
            metodo: metodoPago,
            concepto: 'hospedaje',
            observaciones: nroTicket
          })
        }

        // Actualizar caja del turno activo
            if (montoPagado > 0) {
              await supabase
                .from('turnos')
                .update({
                  caja_principal_actual: turnoActivo.caja_principal_actual + montoPagado
                })
                .eq('id', turnoActivo.id)
            }

    // 6. Cambiar estado habitación
    await supabase
      .from('habitaciones')
      .update({ estado: 'ocupada' })
      .eq('id', id)

    navigate('/')
  }

  if (!hab || cargandoTurno) return <div className="p-4 text-gray-500">Cargando...</div>

  if (!turnoActivo) {
    return <AvisoSinTurno mensaje="Debes iniciar un turno antes de registrar un check-in." />
  }

  return (
    <div className="p-4">
      <button onClick={() => navigate(`/habitacion/${id}`)} className="mb-4 text-sm text-blue-600">
        ← Volver
      </button>

      <h2 className="text-xl font-semibold mb-4">Check-in · Hab {hab.numero}</h2>

      {/* DNI */}
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
              onBlur={buscarCliente}
              placeholder={tipoDoc === 'dni' ? '8 dígitos' : tipoDoc === 'pasaporte' ? 'Nro de pasaporte' : 'Nro de documento'}
              className="flex-1 border rounded-lg px-3 py-2 text-sm"
              maxLength={tipoDoc === 'dni' ? 8 : 20}
            />
            <button
              onClick={buscarCliente}
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
              Tarifa habitual: S/{cliente.tarifa_habitual} · Última visita registrada
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

      {/* Datos personales */}
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

      {/* Estadía */}
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

      {/* Tarifa y pago */}
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
        {metodoPago === 'tarjeta' && 
            (
            <input
                type="text"
                value={nroTicket}
                onChange={e => setNroTicket(e.target.value)}
                placeholder="Nro de ticket (opcional)"
                className="w-full border rounded-lg px-3 py-2 text-sm mt-2"
            />
            )
        }
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

      {/* Comprobante */}
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

      {/* Observaciones */}
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
        onClick={confirmarCheckin}
        disabled={guardando}
        className="w-full py-3 bg-green-600 text-white rounded-xl font-semibold disabled:opacity-50"
      >
        {guardando ? 'Guardando...' : 'Confirmar check-in'}
      </button>
    </div>
  )
}

export default CheckIn