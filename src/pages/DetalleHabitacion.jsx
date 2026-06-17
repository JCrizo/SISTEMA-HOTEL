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

  const [mostrarConfigHab, setMostrarConfigHab] = useState(false)
  const [nuevoTipo, setNuevoTipo] = useState('')
  const [nuevoPrecio, setNuevoPrecio] = useState('')

  // Cobro adicional / reabrir (para pendiente_limpieza)
  const [hospedajeFinalizado, setHospedajeFinalizado] = useState(null)
  const [pagosFinalizado, setPagosFinalizado] = useState([])
  const [mostrarCobroAdicional, setMostrarCobroAdicional] = useState(false)
  const [montoCobroAdicional, setMontoCobroAdicional] = useState('')
  const [metodoCobroAdicional, setMetodoCobroAdicional] = useState('efectivo')
  const [conceptoCobroAdicional, setConceptoCobroAdicional] = useState('hospedaje')
  const [descCobroAdicional, setDescCobroAdicional] = useState('')
  const [guardandoCobroAdicional, setGuardandoCobroAdicional] = useState(false)

  const [montoPago, setMontoPago] = useState('')
  const [metodoPago, setMetodoPago] = useState('efectivo')
  const [conceptoPago, setConceptoPago] = useState('hospedaje')
  const [guardandoPago, setGuardandoPago] = useState(false)
  const [mostrarPago, setMostrarPago] = useState(false)
  const [nroTicket, setNroTicket] = useState('')
  const [mostrarExtension, setMostrarExtension] = useState(false)
  const [fechaExtension, setFechaExtension] = useState('')

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

    // Cargar hospedaje finalizado para pendiente_limpieza (por si el huésped quiere quedarse más)
    if (habData?.estado === 'pendiente_limpieza' || habData?.estado === 'en_limpieza' || habData?.estado === 'limpieza_simple') {
      const { data: hospFin } = await supabase
        .from('hospedajes')
        .select('*, huesped_hospedaje(clientes(nombres, dni_pasaporte))')
        .eq('habitacion_id', id)
        .eq('estado', 'finalizado')
        .order('salida_real', { ascending: false })
        .limit(1)
        .single()
      setHospedajeFinalizado(hospFin || null)
      if (hospFin) {
        const { data: pagosFinData } = await supabase
          .from('pagos').select('*').eq('hospedaje_id', hospFin.id)
        setPagosFinalizado(pagosFinData || [])
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

    const pagosActualizados = [...pagos, { concepto: conceptoPago, monto: montoPago }]
    const totalPagadoNuevo = pagosActualizados
      .filter(p => p.concepto !== 'penalidad')
      .reduce((s, p) => s + parseFloat(p.monto), 0)
    const nuevoPago = totalPagadoNuevo >= parseFloat(hospedaje.tarifa_pactada) ? 'pagado' : 'parcial'

    await supabase.from('hospedajes')
      .update({ estado_pago: nuevoPago }).eq('id', hospedaje.id)

    await actualizarCaja(
      parseFloat(montoPago),
      conceptoPago === 'consumo' ? 'consumos' : 'principal'
    )

    setMontoPago('')
    setNroTicket('')
    setConceptoPago('hospedaje')
    setMostrarPago(false)
    setGuardandoPago(false)
    cargarDatos()
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
  async function extenderEstadia()
   {
      if (!fechaExtension) return

      const nuevaFecha = new Date(fechaExtension)
      nuevaFecha.setHours(12, 0, 0, 0)

      const checkoutActual = new Date(hospedaje.salida_estimada)
      const diffMs = nuevaFecha - checkoutActual
      const noches = Math.round(diffMs / (1000 * 60 * 60 * 24))

      if (noches === 0) 
      {
        alert('La nueva fecha debe ser diferente al checkout actual')
        return
      }

      const costoExtension = noches * parseFloat(hospedaje.tarifa_pactada)
      const mensaje = noches > 0
        ? `Se agregarán ${noches} noche(s) por S/${Math.abs(costoExtension).toFixed(2)}. ¿Confirmar?`
        : `Se reducirá la estadía en ${Math.abs(noches)} noche(s). ¿Confirmar?`

      if (!confirm(mensaje)) return
      //if (!confirm(`Se agregarán ${noches} noche(s) adicional(es) por S/${costoExtension.toFixed(2)}. ¿Confirmar?`)) return

      // Actualizar fecha de salida
      await supabase.from('hospedajes')
        .update({ salida_estimada: nuevaFecha.toISOString() })
        .eq('id', hospedaje.id)

      // Agregar cargo por noches adicionales
      if (noches > 0) 
      {
        await supabase.from('pagos').insert({
          hospedaje_id: hospedaje.id,
          monto: costoExtension,
          metodo: 'efectivo',
          concepto: 'penalidad',
          observaciones: `Extensión de estadía: ${noches} noche(s) adicional(es) hasta ${nuevaFecha.toLocaleDateString('es-PE')}`
        })
      }

      setFechaExtension('')
      setMostrarExtension(false)
      cargarDatos()
    }
    async function actualizarHabitacion() {
      const updates = {}
      if (nuevoTipo) { updates.tipo_actual = nuevoTipo }
      if (nuevoPrecio) { updates.precio_actual = parseFloat(nuevoPrecio) }
      if (Object.keys(updates).length === 0) return

      await supabase.from('habitaciones').update(updates).eq('id', id)
      setMostrarConfigHab(false)
      setNuevoTipo('')
      setNuevoPrecio('')
      cargarDatos()
    }

    async function cambiarEstadoHab(estado) {
      if (!confirm(`¿Cambiar estado a "${estado}"?`)) return
      await supabase.from('habitaciones').update({ estado }).eq('id', id)
      cargarDatos()
    }




  async function registrarCobroAdicional() {
    if (!montoCobroAdicional || parseFloat(montoCobroAdicional) <= 0) return
    if (!descCobroAdicional.trim()) { alert('Ingresa una descripción del cobro'); return }
    setGuardandoCobroAdicional(true)

    await supabase.from('pagos').insert({
      hospedaje_id: hospedajeFinalizado.id,
      monto: parseFloat(montoCobroAdicional),
      metodo: metodoCobroAdicional,
      concepto: conceptoCobroAdicional,
      observaciones: descCobroAdicional
    })

    await actualizarCaja(
      parseFloat(montoCobroAdicional),
      conceptoCobroAdicional === 'consumo' ? 'consumos' : 'principal'
    )

    setMontoCobroAdicional('')
    setDescCobroAdicional('')
    setMostrarCobroAdicional(false)
    setGuardandoCobroAdicional(false)
    cargarDatos()
  }

     async function reabrirHospedaje() {
    if (!confirm(`¿Reabrir el hospedaje de ${hospedajeFinalizado?.huesped_hospedaje?.[0]?.clientes?.nombres || 'este huésped'}? La habitación volverá a "Ocupada".`)) return

    await supabase.from('hospedajes')
      .update({ estado: 'activo', salida_real: null })
      .eq('id', hospedajeFinalizado.id)

    await supabase.from('habitaciones')
      .update({ estado: 'ocupada' })
      .eq('id', id)

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

    await supabase.from('cochera')
      .update({ hora_salida: new Date().toISOString() })
      .eq('hospedaje_id', hospedaje.id)
      .is('hora_salida', null)

    navigate('/')
  }

  if (cargando) return <div className="p-4 text-gray-500">Cargando...</div>
  if (!hab) return <div className="p-4 text-red-500">Habitación no encontrada</div>

  const totalConsumos = consumos.reduce((s, c) => s + parseFloat(c.precio_unitario) * c.cantidad, 0)
  const totalPenalidades = pagos.filter(p => p.concepto === 'penalidad').reduce((s, p) => s + parseFloat(p.monto), 0)
  const pagosHospedaje = pagos.filter(p => p.concepto === 'hospedaje').reduce((s, p) => s + parseFloat(p.monto), 0)
  const pagosConsumo = pagos.filter(p => p.concepto === 'consumo').reduce((s, p) => s + parseFloat(p.monto), 0)
  const pagosPenalidad = pagos.filter(p => p.concepto === 'pago_penalidad').reduce((s, p) => s + parseFloat(p.monto), 0)
  const totalPagadoReal = pagosHospedaje + pagosConsumo + pagosPenalidad
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
          {/* Huésped */}
          <div className="bg-white rounded-xl border p-4 mb-3">
            <div className="flex justify-between items-center mb-2">
              <p className="text-xs text-gray-500 font-medium uppercase">Huésped</p>
              <p className="text-xs font-medium text-blue-600">Ficha N° {String(hospedaje.nro_ficha).padStart(6, '0')}</p>
            </div>
            <p className="font-semibold">{huesped?.nombres || 'Sin nombre'}</p>
            <p className="text-sm text-gray-500">{huesped?.dni_pasaporte}</p>
            <p className="text-xs text-gray-400 mt-1">Ingreso: {new Date(hospedaje.ingreso).toLocaleString('es-PE')}</p>
            <p className="text-xs text-gray-400">Checkout: {new Date(hospedaje.salida_estimada).toLocaleString('es-PE')}</p>
            {hospedaje.observaciones && (
              <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-xs text-yellow-800 font-medium">Observaciones</p>
                <p className="text-xs text-yellow-700 mt-1">{hospedaje.observaciones}</p>
              </div>
            )}
            {hospedaje.comprobante && hospedaje.comprobante !== 'ninguno' && (
              <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-xs text-blue-800 font-medium capitalize">
                  Requiere {hospedaje.comprobante}
                  {hospedaje.comprobante === 'factura' && hospedaje.ruc ? ` — RUC: ${hospedaje.ruc}` : ''}
                </p>
              </div>
            )}
          </div>

          {/* Cuenta */}
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
                <span>Cargos adicionales</span><span>S/{totalPenalidades.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm py-1 font-medium border-t mt-1 pt-1">
              <span>Total</span>
              <span>S/{(parseFloat(hospedaje.tarifa_pactada) + totalConsumos + totalPenalidades).toFixed(2)}</span>
            </div>
            <div className="border-t mt-2 pt-1">
              {pagosHospedaje > 0 && (
                <div className="flex justify-between text-sm py-1 text-green-700">
                  <span>Pagado hospedaje</span><span>− S/{pagosHospedaje.toFixed(2)}</span>
                </div>
              )}
              {pagosConsumo > 0 && (
                <div className="flex justify-between text-sm py-1 text-green-700">
                  <span>Pagado consumos</span><span>− S/{pagosConsumo.toFixed(2)}</span>
                </div>
              )}
              {pagosPenalidad > 0 && (
                <div className="flex justify-between text-sm py-1 text-green-700">
                  <span>Pagado cargos adicionales</span><span>− S/{pagosPenalidad.toFixed(2)}</span>
                </div>
              )}
            </div>
            <div className="flex justify-between font-semibold py-1 border-t mt-1">
              <span>Saldo pendiente</span>
              <span className={saldo > 0 ? 'text-red-600' : 'text-green-600'}>S/{saldo.toFixed(2)}</span>
            </div>
          </div>

          {/* Pago */}
          {mostrarPago ? (
            <div className="bg-white rounded-xl border p-4 mb-3">
              <p className="text-xs text-gray-500 font-medium uppercase mb-2">Registrar pago</p>
              <input type="number" value={montoPago} onChange={e => setMontoPago(e.target.value)}
                placeholder="Monto (S/)" className="w-full border rounded-lg px-3 py-2 text-sm mb-2" />
              <select value={conceptoPago} onChange={e => setConceptoPago(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm mb-2">
                <option value="hospedaje">Hospedaje</option>
                <option value="consumo">Consumos</option>
                <option value="pago_penalidad">Cargo adicional / Penalidad</option>
              </select>
              <select value={metodoPago} onChange={e => setMetodoPago(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm mb-2">
                <option value="efectivo">Efectivo</option>
                <option value="yape">Yape</option>
                <option value="tarjeta">Tarjeta</option>
                <option value="transferencia">Transferencia</option>
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
                  <p className="text-xs text-gray-500 font-medium uppercase mb-3">Cargos adicionales / Penalidades</p>
                  {pagos.filter(p => p.concepto === 'penalidad').length > 0 ? (
                    <div className="mb-3">
                      {pagos.filter(p => p.concepto === 'penalidad').map(p => (
                        <div key={p.id} className="flex justify-between items-start py-2 border-b last:border-0">
                          <div>
                            <p className="text-sm font-medium">{p.observaciones || 'Sin descripción'}</p>
                            <p className="text-xs text-gray-400">{new Date(p.created_at).toLocaleString('es-PE')}</p>
                          </div>
                          <span className="text-sm font-medium text-purple-700">S/{parseFloat(p.monto).toFixed(2)}</span>
                        </div>
                      ))}
                      <div className="flex justify-between text-sm font-semibold pt-2 mt-1">
                        <span>Total cargos</span>
                        <span className="text-purple-700">S/{totalPenalidades.toFixed(2)}</span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400 mb-3">Sin cargos registrados</p>
                  )}
                  <div className="border-t pt-3">
                    <p className="text-xs text-gray-500 font-medium mb-2">Agregar cargo</p>
                    <input type="number" value={montoPenalidad} onChange={e => setMontoPenalidad(e.target.value)}
                      placeholder="Monto (S/)" className="w-full border rounded-lg px-3 py-2 text-sm mb-2" />
                    <input type="text" value={descPenalidad} onChange={e => setDescPenalidad(e.target.value)}
                      placeholder="Descripción (ej: manchó la sábana)" className="w-full border rounded-lg px-3 py-2 text-sm mb-3" />
                    <div className="flex gap-2">
                      <button onClick={() => setMostrarPenalidad(false)}
                        className="flex-1 py-2 border rounded-xl text-sm text-gray-600">Cerrar</button>
                      <button onClick={registrarPenalidad}
                        className="flex-1 py-2 bg-purple-600 text-white rounded-xl text-sm font-medium">Agregar</button>
                    </div>
                  </div>
                </div>
              )}
              <div className="grid grid-cols-2 gap-2 mb-3">
                <button onClick={() => navigate(`/consumos/${id}`)}
                  className="py-2.5 bg-orange-500 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-1.5">
                  🛒 Consumos
                </button>
                <button onClick={() => setMostrarPenalidad(!mostrarPenalidad)}
                  className="py-2.5 bg-purple-600 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-1.5">
                  ⚠️ Cargo extra
                </button>
                <button onClick={() => setMostrarPago(true)}
                  className="py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-1.5">
                  💰 Registrar pago
                </button>
                <button
                  onClick={() => setMostrarExtension(true)}
                  className="py-2.5 bg-green-700 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-1.5"
                >
                  📅 Cambiar checkout
                </button>
              </div>
            </>
          )}
          {mostrarExtension && (
              <div className="bg-white rounded-xl border p-4 mb-3">
                <p className="text-xs text-gray-500 font-medium uppercase mb-2">Cambiar fecha de checkout</p>
                <p className="text-xs text-gray-400 mb-2">
                  Checkout actual: {new Date(hospedaje.salida_estimada).toLocaleString('es-PE')}
                </p>
                <label className="text-xs text-gray-500 mb-1 block">Nueva fecha de salida</label>
                <input
                  type="date"
                  value={fechaExtension}
                  onChange={e => setFechaExtension(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm mb-3"
                  //min={new Date().toISOString().split('T')[0]}
                />
                <div className="flex gap-2">
                  <button onClick={() => setMostrarExtension(false)}
                    className="flex-1 py-2 border rounded-xl text-sm text-gray-600">Cancelar</button>
                  <button onClick={extenderEstadia}
                    className="flex-1 py-2 bg-green-600 text-white rounded-xl text-sm font-medium">Confirmar</button>
                </div>
              </div>
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
            className="w-full py-2 bg-yellow-500 text-white rounded-xl text-sm font-medium mb-3">Ir a limpieza</button>

          {/* Opciones si el huésped anterior quiere continuar */}
          {hospedajeFinalizado && (
            <>
              <div className="border-t pt-3 mt-1">
                <p className="text-xs text-gray-500 font-medium uppercase mb-1">Último huésped</p>
                <p className="text-sm font-semibold">{hospedajeFinalizado.huesped_hospedaje?.[0]?.clientes?.nombres || 'Sin nombre'}</p>
                <p className="text-xs text-gray-400 mb-3">Ficha N° {String(hospedajeFinalizado.nro_ficha).padStart(6, '0')} · Checkout: {new Date(hospedajeFinalizado.salida_real).toLocaleString('es-PE')}</p>

                {/* Cobro adicional */}
                {mostrarCobroAdicional ? (
                  <div className="bg-blue-50 rounded-xl p-3 mb-3">
                    <p className="text-xs text-blue-800 font-medium uppercase mb-2">Cobro adicional (misma ficha)</p>
                    <input type="number" value={montoCobroAdicional} onChange={e => setMontoCobroAdicional(e.target.value)}
                      placeholder="Monto (S/)" className="w-full border rounded-lg px-3 py-2 text-sm mb-2" />
                    <input type="text" value={descCobroAdicional} onChange={e => setDescCobroAdicional(e.target.value)}
                      placeholder="Descripción (ej: medio día extra)" className="w-full border rounded-lg px-3 py-2 text-sm mb-2" />
                    <select value={conceptoCobroAdicional} onChange={e => setConceptoCobroAdicional(e.target.value)}
                      className="w-full border rounded-lg px-3 py-2 text-sm mb-2">
                      <option value="hospedaje">Hospedaje</option>
                      <option value="consumo">Consumos</option>
                      <option value="pago_penalidad">Cargo adicional</option>
                    </select>
                    <select value={metodoCobroAdicional} onChange={e => setMetodoCobroAdicional(e.target.value)}
                      className="w-full border rounded-lg px-3 py-2 text-sm mb-3">
                      <option value="efectivo">Efectivo</option>
                      <option value="yape">Yape</option>
                      <option value="tarjeta">Tarjeta</option>
                      <option value="transferencia">Transferencia</option>
                    </select>
                    <div className="flex gap-2">
                      <button onClick={() => setMostrarCobroAdicional(false)}
                        className="flex-1 py-2 border rounded-xl text-sm text-gray-600">Cancelar</button>
                      <button onClick={registrarCobroAdicional} disabled={guardandoCobroAdicional}
                        className="flex-1 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium disabled:opacity-50">
                        {guardandoCobroAdicional ? 'Guardando...' : 'Confirmar'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <button onClick={() => setMostrarCobroAdicional(true)}
                    className="w-full py-2 bg-blue-600 text-white rounded-xl text-sm font-medium mb-2">
                    💰 Cobro adicional (horas extra / consumo)
                  </button>
                )}

                <button onClick={reabrirHospedaje}
                  className="w-full py-2 bg-green-600 text-white rounded-xl text-sm font-medium">
                  🔄 Reabrir hospedaje (se queda más noches)
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {hab.estado === 'mantenimiento' && (
        <div className="bg-white rounded-xl border p-4">
          <p className="text-gray-600 text-sm font-medium">En mantenimiento</p>
        </div>
      )}
      {/* Configuración de habitación */}
        <div className="bg-white rounded-xl border p-4 mt-3">
          <div className="flex justify-between items-center">
            <p className="text-xs text-gray-500 font-medium uppercase">Configuración</p>
            <button
              onClick={() => setMostrarConfigHab(!mostrarConfigHab)}
              className="text-xs text-blue-600"
            >
              {mostrarConfigHab ? 'Cerrar' : 'Editar'}
            </button>
          </div>
          {mostrarConfigHab && (
            <div className="mt-3">
              <select
                value={nuevoTipo}
                onChange={e => setNuevoTipo(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm mb-2"
              >
                <option value="">Tipo actual: {hab.tipo_actual}</option>
                <option value="Matrimonial">Matrimonial</option>
                <option value="Queen">Queen</option>
                <option value="Doble">Doble</option>
                <option value="Doble 2">Doble 2</option>
                <option value="Familiar">Familiar</option>
              </select>
              <input
                type="number"
                value={nuevoPrecio}
                onChange={e => setNuevoPrecio(e.target.value)}
                placeholder={`Precio actual: S/${hab.precio_actual}`}
                className="w-full border rounded-lg px-3 py-2 text-sm mb-2"
              />
              <button
                onClick={actualizarHabitacion}
                className="w-full py-2 bg-blue-600 text-white rounded-xl text-sm font-medium mb-2"
              >
                Guardar cambios
              </button>
              <div className="flex gap-2 mt-1">
                {hab.estado !== 'mantenimiento' && (
                  <button
                    onClick={() => cambiarEstadoHab('mantenimiento')}
                    className="flex-1 py-2 bg-gray-600 text-white rounded-xl text-sm"
                  >
                    Poner en mantenimiento
                  </button>
                )}
                {hab.estado === 'mantenimiento' && (
                  <button
                    onClick={() => cambiarEstadoHab('disponible')}
                    className="flex-1 py-2 bg-green-600 text-white rounded-xl text-sm"
                  >
                    Marcar disponible
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
    </div>
  )
}

export default DetalleHabitacion