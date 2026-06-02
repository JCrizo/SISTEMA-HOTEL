import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useSearchParams } from 'react-router-dom'

function CheckIn() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [hab, setHab] = useState(null)
  const [searchParams] = useSearchParams()
  const reservaId = searchParams.get('reserva')
  const [montoEarly, setMontoEarly] = useState('')

  // Datos del huésped
  const [dni, setDni] = useState('')
  const [cliente, setCliente] = useState(null)
  const [nombres, setNombres] = useState('')
  const [telefono, setTelefono] = useState('')
  const [nacionalidad, setNacionalidad] = useState('')

  // Datos del hospedaje
  const [tarifa, setTarifa] = useState('')
  const [metodoPago, setMetodoPago] = useState('efectivo')
  const [nroTicket, setNroTicket] = useState('')
  const [modalPago, setModalPago] = useState('al_salir')
  const [adelanto, setAdelanto] = useState('')
  const [comprobante, setComprobante] = useState('ninguno')
  const [ruc, setRuc] = useState('')
  const [observaciones, setObservaciones] = useState('')

  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
  async function cargarDatos() {
    const { data: habData } = await supabase
      .from('habitaciones')
      .select('*')
      .eq('id', id)
      .single()
    if (habData) {
      setHab(habData)
      setTarifa(habData.precio_actual)
    }

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
          setTarifa(reserva.clientes.tarifa_habitual)
        }
        if (parseFloat(reserva.adelanto) > 0) {
          setAdelanto(reserva.adelanto.toString())
          setModalPago('adelanto')
        }
        if (parseFloat(reserva.monto_early) > 0) {
          setMontoEarly(reserva.monto_early.toString())
        }
      }
    }
  }
  cargarDatos()
}, [id, reservaId])
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
      if (data.tarifa_habitual) setTarifa(data.tarifa_habitual)
    } else {
      setCliente(null)
      setNombres('')
      setTelefono('')
    }
  }

  async function confirmarCheckin() {
    setError('')
    if (!nombres.trim()) { setError('El nombre es obligatorio'); return }
    if (!tarifa) { setError('La tarifa es obligatoria'); return }
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

    // 2. Calcular salida estimada
    const ahora = new Date()
    const hora = ahora.getHours()
    const salidaEstimada = new Date(ahora)
    if (hora >= 5) {
      salidaEstimada.setDate(salidaEstimada.getDate() + 1)
    }
    salidaEstimada.setHours(12, 0, 0, 0)

    // 3. Crear hospedaje
    const { data: hospedaje, error: errHosp } = await supabase
      .from('hospedajes')
      .insert({
        habitacion_id: id,
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
            const { data: turnos } = await supabase
              .from('turnos')
              .select('*')
              .is('cierre', null)
              .order('apertura', { ascending: false })
              .limit(1)

            const turnoActivo = turnos?.[0]
            if (turnoActivo) {
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

  if (!hab) return <div className="p-4 text-gray-500">Cargando...</div>

  return (
    <div className="p-4">
      <button onClick={() => navigate(`/habitacion/${id}`)} className="mb-4 text-sm text-blue-600">
        ← Volver
      </button>

      <h2 className="text-xl font-semibold mb-4">Check-in · Hab {hab.numero}</h2>

      {/* DNI */}
      <div className="bg-white rounded-xl border p-4 mb-3">
        <label className="text-xs text-gray-500 font-medium uppercase">DNI o Pasaporte</label>
        <div className="flex gap-2 mt-1">
          <input
            type="text"
            value={dni}
            onChange={e => setDni(e.target.value)}
            onBlur={buscarCliente}
            placeholder="Ej: 45123890"
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

      {/* Tarifa y pago */}
      <div className="bg-white rounded-xl border p-4 mb-3">
        <label className="text-xs text-gray-500 font-medium uppercase">Tarifa y pago</label>
        <input
          type="number"
          value={tarifa}
          onChange={e => setTarifa(e.target.value)}
          placeholder="Tarifa (S/)"
          className="w-full border rounded-lg px-3 py-2 text-sm mt-2"
        />
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