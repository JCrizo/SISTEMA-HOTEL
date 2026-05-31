import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const colores = {
  disponible:         'bg-green-100 border-green-400 text-green-900',
  ocupada:            'bg-red-100 border-red-400 text-red-900',
  pendiente_limpieza: 'bg-yellow-100 border-yellow-400 text-yellow-900',
  en_limpieza:        'bg-yellow-100 border-yellow-400 text-yellow-900',
  limpieza_simple:    'bg-yellow-100 border-yellow-400 text-yellow-900',
  habilitada:         'bg-green-100 border-green-400 text-green-900',
  mantenimiento:      'bg-gray-100 border-gray-400 text-gray-700',
}

const etiquetas = {
  disponible:         'Disponible',
  ocupada:            'Ocupada',
  pendiente_limpieza: 'Pend. limpieza Total',
  en_limpieza:        'En limpieza',
  limpieza_simple:    'Limp. simple',
  habilitada:         'Habilitada',
  mantenimiento:      'Mantenimiento',
}

function DetalleHabitacion() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [hab, setHab] = useState(null)
  const [hospedaje, setHospedaje] = useState(null)
  const [huesped, setHuesped] = useState(null)
  const [pagos, setPagos] = useState([])
  const [consumos, setConsumos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [conceptoPago, setConceptoPago] = useState('hospedaje')

  const [montoPago, setMontoPago] = useState('')
  const [metodoPago, setMetodoPago] = useState('efectivo')
  const [guardandoPago, setGuardandoPago] = useState(false)
  const [mostrarPago, setMostrarPago] = useState(false)
  const [nroTicket, setNroTicket] = useState('')

  const [mostrarPenalidad, setMostrarPenalidad] = useState(false)
  const [montoPenalidad, setMontoPenalidad] = useState('')
  const [descPenalidad, setDescPenalidad] = useState('')

  useEffect(() => { cargarDatos() }, [id])

  async function cargarDatos() {
    const { data: habData } = await supabase
      .from('habitaciones').select('*').eq('id', id).single()
    setHab(habData)

    if (habData?.estado === 'ocupada') {
      const { data: hospData } = await supabase
        .from('hospedajes').select('*')
        .eq('habitacion_id', id).eq('estado', 'activo').single()

      if (hospData) {
        setHospedaje(hospData)

        const { data: huespedData } = await supabase
          .from('huesped_hospedaje').select('*, clientes(*)')
          .eq('hospedaje_id', hospData.id).eq('es_titular', true).single()
        setHuesped(huespedData?.clientes)

        const { data: pagosData } = await supabase
          .from('pagos').select('*').eq('hospedaje_id', hospData.id)
        setPagos(pagosData || [])

        const { data: consumosData } = await supabase
          .from('consumos').select('*').eq('hospedaje_id', hospData.id)
        setConsumos(consumosData || [])
      }
    }
    setCargando(false)
  }

  async function actualizarCaja(monto, tipoCaja = 'principal') {
  const { data: turnos } = await supabase
    .from('turnos').select('*').is('cierre', null)
    .order('apertura', { ascending: false }).limit(1)
  const turnoActivo = turnos?.[0]
  if (turnoActivo) {
    const campo = tipoCaja === 'consumos' ? 'caja_consumos_actual' : 'caja_principal_actual'
    const valorActual = tipoCaja === 'consumos' ? turnoActivo.caja_consumos_actual : turnoActivo.caja_principal_actual
    await supabase.from('turnos')
      .update({ [campo]: valorActual + monto })
      .eq('id', turnoActivo.id)
  }
}

  async function registrarPago() {
    if (!montoPago || parseFloat(montoPago) <= 0) return
    setGuardandoPago(true)

    await supabase.from('pagos').insert({
      observaciones: nroTicket,
      hospedaje_id: hospedaje.id,
      monto: parseFloat(montoPago),
      metodo: metodoPago,
      concepto: conceptoPago
    })

    const totalPagadoReal = pagos.filter(p => p.concepto !== 'penalidad')
      .reduce((s, p) => s + parseFloat(p.monto), 0) + parseFloat(montoPago)
    const nuevoPago = totalPagadoReal >= parseFloat(hospedaje.tarifa_pactada) ? 'pagado' : 'parcial'

    await supabase.from('hospedajes')
      .update({ estado_pago: nuevoPago }).eq('id', hospedaje.id)

    await actualizarCaja(parseFloat(montoPago), conceptoPago === 'consumo' ? 'consumos' : 'principal')

    setMontoPago('')
    setNroTicket('')
    setMostrarPago(false)
    setGuardandoPago(false)
    cargarDatos()
    setConceptoPago('hospedaje')
  }

  async function registrarPenalidad() {
    if (!montoPenalidad || parseFloat(montoPenalidad) <= 0) return
    if (!descPenalidad.trim()) return

    await supabase.from('pagos').insert({
      hospedaje_id: hospedaje.id,
      monto: parseFloat(montoPenalidad),
      metodo: 'efectivo',
      concepto: 'penalidad',
      observaciones: descPenalidad
    })

    setMontoPenalidad('')
    setDescPenalidad('')
    setMostrarPenalidad(false)
    cargarDatos()
  }

  async function hacerCheckout() {
    if (saldo > 0) {
      if (!confirm(`El huésped tiene un saldo pendiente de S/${saldo.toFixed(2)}. ¿Confirmar checkout de todas formas?`)) return
    } else {
      if (!confirm('¿Confirmar checkout?')) return
    }

    await supabase.from('hospedajes')
      .update({ estado: 'finalizado', salida_real: new Date().toISOString() })
      .eq('id', hospedaje.id)

    await supabase.from('habitaciones')
      .update({ estado: 'pendiente_limpieza' }).eq('id', id)

    navigate('/')
  }

  if (cargando) return <div className="p-4 text-gray-500">Cargando...</div>
  if (!hab) return <div className="p-4 text-red-500">Habitación no encontrada</div>

  const totalConsumos = consumos.reduce((s, c) => s + parseFloat(c.precio_unitario) * c.cantidad, 0)
  const totalPenalidades = pagos.filter(p => p.concepto === 'penalidad').reduce((s, p) => s + parseFloat(p.monto), 0)
  const totalPagadoReal = pagos.filter(p => p.concepto !== 'penalidad').reduce((s, p) => s + parseFloat(p.monto), 0)
  const saldo = hospedaje ? parseFloat(hospedaje.tarifa_pactada) + totalConsumos + totalPenalidades - totalPagadoReal : 0

  return (
    <div className="p-4">
      <button onClick={() => navigate('/')} className="mb-4 text-sm text-blue-600">← Volver</button>

      <div className={`border rounded-xl p-4 mb-4 ${colores[hab.estado]}`}>
        <div className="text-3xl font-bold">Hab {hab.numero}</div>
        <div className="text-sm mt-1">{hab.tipo_actual} · S/{hab.precio_actual}</div>
        <div className="text-xs mt-2 font-medium">{etiquetas[hab.estado]}</div>
      </div>

      {hab.estado === 'disponible' && (
        <button onClick={() => navigate(`/checkin/${hab.id}`)}
          className="w-full py-3 bg-green-600 text-white rounded-xl font-semibold">
          Nuevo check-in
        </button>
      )}

      {hab.estado === 'ocupada' && hospedaje && (
        <>
          <div className="bg-white rounded-xl border p-4 mb-3">
            <p className="text-xs text-gray-500 font-medium uppercase mb-2">Huésped</p>
            <p className="font-semibold">{huesped?.nombres || 'Sin nombre'}</p>
            <p className="text-sm text-gray-500">{huesped?.dni_pasaporte}</p>
            <p className="text-xs text-gray-400 mt-1">Ingreso: {new Date(hospedaje.ingreso).toLocaleString('es-PE')}</p>
            <p className="text-xs text-gray-400">Checkout: {new Date(hospedaje.salida_estimada).toLocaleString('es-PE')}</p>
          </div>

          <div className="bg-white rounded-xl border p-4 mb-3">
            <p className="text-xs text-gray-500 font-medium uppercase mb-2">Cuenta</p>
            <div className="flex justify-between text-sm py-1">
              <span>Hospedaje</span><span>S/{hospedaje.tarifa_pactada}</span>
            </div>
            {totalConsumos > 0 && (
              <div className="flex justify-between text-sm py-1">
                <span>Consumos</span><span>S/{totalConsumos.toFixed(2)}</span>
              </div>
            )}
            {totalPenalidades > 0 && (
              <div className="flex justify-between text-sm py-1 text-purple-700">
                <span>Penalidades</span><span>S/{totalPenalidades.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm py-1 text-green-700">
              <span>Pagado</span><span>− S/{totalPagadoReal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-semibold py-1 border-t mt-1">
              <span>Saldo pendiente</span>
              <span className={saldo > 0 ? 'text-red-600' : 'text-green-600'}>S/{saldo.toFixed(2)}</span>
            </div>
          </div>

          {mostrarPago ? (
            <div className="bg-white rounded-xl border p-4 mb-3">
              <p className="text-xs text-gray-500 font-medium uppercase mb-2">Registrar pago</p>
              <input type="number" value={montoPago} onChange={e => setMontoPago(e.target.value)}
                placeholder="Monto (S/)" className="w-full border rounded-lg px-3 py-2 text-sm mb-2" />
              <select value={metodoPago} onChange={e => setMetodoPago(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm mb-2">
                <option value="efectivo">Efectivo</option>
                <option value="yape">Yape</option>
                <option value="tarjeta">Tarjeta</option>
                <option value="transferencia">Transferencia</option>
              </select>
              <select
                value={conceptoPago}
                onChange={e => setConceptoPago(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm mb-2"
              >
                <option value="hospedaje">Hospedaje</option>
                <option value="consumo">Consumos</option>
                
              </select>
              {metodoPago === 'tarjeta' && (
                <input type="text" value={nroTicket} onChange={e => setNroTicket(e.target.value)}
                  placeholder="Nro de ticket (opcional)" className="w-full border rounded-lg px-3 py-2 text-sm mb-2" />
              )}
              <div className="flex gap-2">
                <button onClick={() => setMostrarPago(false)}
                  className="flex-1 py-2 border rounded-xl text-sm text-gray-600">Cancelar</button>
                <button onClick={registrarPago} disabled={guardandoPago}
                  className="flex-1 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium disabled:opacity-50">
                  {guardandoPago ? 'Guardando...' : 'Confirmar pago'}
                </button>
              </div>
            </div>
          ) : (
            <>
              {mostrarPenalidad && (
                <div className="bg-white rounded-xl border p-4 mb-3">
                  <p className="text-xs text-gray-500 font-medium uppercase mb-2">Cargo adicional / Penalidad</p>
                  <input type="number" value={montoPenalidad} onChange={e => setMontoPenalidad(e.target.value)}
                    placeholder="Monto (S/)" className="w-full border rounded-lg px-3 py-2 text-sm mb-2" />
                  <input type="text" value={descPenalidad} onChange={e => setDescPenalidad(e.target.value)}
                    placeholder="Descripción (ej: manchó la sábana)" className="w-full border rounded-lg px-3 py-2 text-sm mb-3" />
                  <div className="flex gap-2">
                    <button onClick={() => setMostrarPenalidad(false)}
                      className="flex-1 py-2 border rounded-xl text-sm text-gray-600">Cancelar</button>
                    <button onClick={registrarPenalidad}
                      className="flex-1 py-2 bg-purple-600 text-white rounded-xl text-sm font-medium">Guardar</button>
                  </div>
                </div>
              )}
              <button onClick={() => navigate(`/consumos/${id}`)}
                className="w-full py-3 bg-orange-500 text-white rounded-xl font-semibold mb-3">Consumos</button>
              <button onClick={() => setMostrarPenalidad(!mostrarPenalidad)}
                className="w-full py-3 bg-purple-600 text-white rounded-xl font-semibold mb-3">Cargo adicional / Penalidad</button>
              <button onClick={() => setMostrarPago(true)}
                className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold mb-3">Registrar pago</button>
            </>
          )}

          <button onClick={hacerCheckout}
            className="w-full py-3 bg-red-600 text-white rounded-xl font-semibold">Hacer checkout</button>
        </>
      )}

      {(hab.estado === 'pendiente_limpieza' || hab.estado === 'en_limpieza' || hab.estado === 'limpieza_simple') && (
        <div className="bg-white rounded-xl border p-4">
          <p className="text-gray-600 text-sm font-medium mb-3">
            {hab.estado === 'pendiente_limpieza' ? 'Pend. Limpieza Total' :
             hab.estado === 'en_limpieza' ? 'En limpieza' : 'Limpieza simple'}
          </p>
          <button onClick={() => navigate('/limpieza')}
            className="w-full py-2 bg-yellow-500 text-white rounded-xl text-sm font-medium">Ir a limpieza</button>
        </div>
      )}

      {hab.estado === 'mantenimiento' && (
        <div className="bg-white rounded-xl border p-4">
          <p className="text-gray-600 text-sm font-medium">En mantenimiento</p>
        </div>
      )}
    </div>
  )
}

export default DetalleHabitacion