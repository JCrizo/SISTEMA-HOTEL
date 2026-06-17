import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

function ReportesAdmin() {
  const navigate = useNavigate()
  const [vista, setVista] = useState('general')
  const [cargando, setCargando] = useState(true)
  const [periodo, setPeriodo] = useState('hoy')

  // General
  const [stats, setStats] = useState({})

  // Por turno
  const [turnos, setTurnos] = useState([])
  const [turnoSeleccionado, setTurnoSeleccionado] = useState(null)
  const [hospedajesTurno, setHospedajesTurno] = useState([])
  const [movimientosTurno, setMovimientosTurno] = useState([])
  const [movimientosStockTurno, setMovimientosStockTurno] = useState([])

  // Limpieza
  const [limpiezas, setLimpiezas] = useState([])

  // Cochera
  const [cocheras, setCocheras] = useState([])

  // Búsqueda ficha (puntual, por número)
  const [busquedaFicha, setBusquedaFicha] = useState('')
  const [resultadosFicha, setResultadosFicha] = useState([])

  // Fichas (listado completo con filtros)
  const [todasFichas, setTodasFichas] = useState([])
  const [filtroFichas, setFiltroFichas] = useState('')
  const [fechaFiltroFichas, setFechaFiltroFichas] = useState('')

  useEffect(() => {
    cargarDatos()
  }, [periodo])

  async function cargarDatos() {
    setCargando(true)
    const ahora = new Date()
    let fechaInicio = new Date()

    if (periodo === 'hoy') {
      fechaInicio.setHours(0, 0, 0, 0)
    } else if (periodo === 'semana') {
      fechaInicio.setDate(ahora.getDate() - 7)
    } else if (periodo === 'mes') {
      fechaInicio.setDate(1)
      fechaInicio.setHours(0, 0, 0, 0)
    }

    // Stats generales
    const { data: habs } = await supabase.from('habitaciones').select('estado')
    const { data: pagosData } = await supabase.from('pagos').select('monto, concepto, metodo, created_at')
      .gte('created_at', fechaInicio.toISOString())

    const ingresosHospedaje = pagosData?.filter(p => p.concepto === 'hospedaje')
      .reduce((s, p) => s + parseFloat(p.monto), 0) || 0
    const ingresosConsumos = pagosData?.filter(p => p.concepto === 'consumo')
      .reduce((s, p) => s + parseFloat(p.monto), 0) || 0
    const { data: cocheraData } = await supabase.from('cochera').select('monto')
      .eq('estado_pago', 'pagado').gte('hora_ingreso', fechaInicio.toISOString())
    const ingresosCochera = cocheraData?.reduce((s, c) => s + parseFloat(c.monto), 0) || 0

    // Desglose por medio de pago
    const totalEfectivo = pagosData?.filter(p => p.metodo === 'efectivo').reduce((s, p) => s + parseFloat(p.monto), 0) || 0
    const totalYape = pagosData?.filter(p => p.metodo === 'yape').reduce((s, p) => s + parseFloat(p.monto), 0) || 0
    const totalTarjeta = pagosData?.filter(p => p.metodo === 'tarjeta').reduce((s, p) => s + parseFloat(p.monto), 0) || 0
    const totalTransferencia = pagosData?.filter(p => p.metodo === 'transferencia').reduce((s, p) => s + parseFloat(p.monto), 0) || 0

    const hoyInicio = new Date()
    hoyInicio.setHours(0, 0, 0, 0)
    const { data: checkinsData } = await supabase.from('hospedajes').select('id')
      .gte('ingreso', hoyInicio.toISOString())
    const { data: checkoutsData } = await supabase.from('hospedajes').select('id')
      .eq('estado', 'finalizado').gte('salida_real', hoyInicio.toISOString())

    setStats({
      habitacionesOcupadas: habs?.filter(h => h.estado === 'ocupada').length || 0,
      habitacionesTotal: habs?.length || 0,
      ingresosHospedaje,
      ingresosConsumos,
      ingresosCochera,
      totalIngresos: ingresosHospedaje + ingresosConsumos + ingresosCochera,
      checkinsHoy: checkinsData?.length || 0,
      checkoutsHoy: checkoutsData?.length || 0,
      totalEfectivo,
      totalYape,
      totalTarjeta,
      totalTransferencia,
    })

    // Turnos
    const { data: turnosData } = await supabase.from('turnos')
      .select('*, usuarios(nombre)')
      .order('apertura', { ascending: false })
      .limit(20)
    setTurnos(turnosData || [])

    // Limpieza
    const { data: limpData } = await supabase.from('limpieza')
      .select('*, habitaciones(numero, tipo_actual)')
      .order('hora', { ascending: false })
      .limit(50)
    setLimpiezas(limpData || [])

    // Cochera
    const { data: cocheraAll } = await supabase.from('cochera')
      .select('*, hospedajes(habitacion_id, habitaciones(numero))')
      .order('hora_ingreso', { ascending: false })
      .limit(50)
    setCocheras(cocheraAll || [])

    // Fichas (listado completo)
    const { data: fichasData } = await supabase.from('hospedajes')
      .select(`
        *,
        habitaciones(numero, tipo_actual),
        huesped_hospedaje(clientes(nombres, dni_pasaporte))
      `)
      .order('ingreso', { ascending: false })
      .limit(50)
    setTodasFichas(fichasData || [])

    setCargando(false)
  }

  async function cargarHospedajesTurno(turno) {
    setTurnoSeleccionado(turno)
    const { data } = await supabase.from('hospedajes')
      .select(`
        *,
        habitaciones(numero, tipo_actual),
        huesped_hospedaje(clientes(nombres, dni_pasaporte))
      `)
      .eq('turno_id', turno.id)
      .order('ingreso')
    setHospedajesTurno(data || [])

    const { data: movs } = await supabase.from('movimientos_caja')
      .select('*')
      .eq('turno_id', turno.id)
      .order('created_at', { ascending: false })
    setMovimientosTurno(movs || [])

    const { data: movsStock } = await supabase.from('movimientos_stock')
      .select('*, productos(nombre), usuarios(nombre)')
      .eq('turno_id', turno.id)
      .order('created_at', { ascending: false })
    setMovimientosStockTurno(movsStock || [])
  }

  async function buscarFicha() {
    if (!busquedaFicha.trim()) return
    const { data } = await supabase.from('hospedajes')
      .select(`
        *,
        habitaciones(numero, tipo_actual),
        huesped_hospedaje(clientes(nombres, dni_pasaporte))
      `)
      .eq('nro_ficha', parseInt(busquedaFicha))
    setResultadosFicha(data || [])
  }

  const fichasFiltradas = todasFichas.filter(h => {
    const nroFicha = String(h.nro_ficha).padStart(6, '0')
    const nombre = h.huesped_hospedaje?.[0]?.clientes?.nombres?.toLowerCase() || ''
    const dni = h.huesped_hospedaje?.[0]?.clientes?.dni_pasaporte || ''
    const fechaMatch = fechaFiltroFichas
      ? new Date(h.ingreso).toISOString().split('T')[0] === fechaFiltroFichas
      : true
    return (
      fechaMatch &&
      (nroFicha.includes(filtroFichas) ||
       nombre.includes(filtroFichas.toLowerCase()) ||
       dni.includes(filtroFichas))
    )
  })

  if (cargando) return <div className="p-4 text-gray-500">Cargando...</div>

  return (
    <div className="p-4">
      <button onClick={() => navigate('/')} className="mb-4 text-sm text-blue-600">← Volver</button>
      <h2 className="text-xl font-semibold mb-4">Reportes Admin</h2>

      {/* Tabs */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
        {[
          { key: 'general', label: 'General' },
          { key: 'turnos', label: 'Turnos' },
          { key: 'fichas', label: 'Fichas' },
          { key: 'limpieza', label: 'Limpieza' },
          { key: 'cochera', label: 'Cochera' },
          { key: 'ficha', label: 'Buscar N° ficha' },
        ].map(t => (
          <button key={t.key} onClick={() => setVista(t.key)}
            className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap ${
              vista === t.key ? 'bg-blue-600 text-white' : 'bg-white border text-gray-600'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* General */}
      {vista === 'general' && (
        <>
          <div className="flex justify-end mb-3">
            <select value={periodo} onChange={e => setPeriodo(e.target.value)}
              className="border rounded-lg px-3 py-2 text-sm">
              <option value="hoy">Hoy</option>
              <option value="semana">Últimos 7 días</option>
              <option value="mes">Este mes</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-white rounded-xl border p-3">
              <p className="text-xs text-gray-500">Habitaciones ocupadas</p>
              <p className="text-2xl font-bold mt-1">{stats.habitacionesOcupadas}<span className="text-sm text-gray-400">/{stats.habitacionesTotal}</span></p>
            </div>
            <div className="bg-white rounded-xl border p-3">
              <p className="text-xs text-gray-500">Total ingresos</p>
              <p className="text-2xl font-bold mt-1 text-green-700">S/{stats.totalIngresos?.toFixed(2)}</p>
            </div>
            <div className="bg-white rounded-xl border p-3">
              <p className="text-xs text-gray-500">Check-ins hoy</p>
              <p className="text-2xl font-bold mt-1">{stats.checkinsHoy}</p>
            </div>
            <div className="bg-white rounded-xl border p-3">
              <p className="text-xs text-gray-500">Check-outs hoy</p>
              <p className="text-2xl font-bold mt-1">{stats.checkoutsHoy}</p>
            </div>
          </div>
          <div className="bg-white rounded-xl border p-4">
            <p className="text-xs text-gray-500 font-medium uppercase mb-3">Desglose ingresos por concepto</p>
            <div className="flex justify-between text-sm py-2 border-b">
              <span>Hospedaje</span><span className="font-medium">S/{stats.ingresosHospedaje?.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm py-2 border-b">
              <span>Consumos</span><span className="font-medium">S/{stats.ingresosConsumos?.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm py-2 border-b">
              <span>Cochera</span><span className="font-medium">S/{stats.ingresosCochera?.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm py-2 font-semibold">
              <span>Total</span><span className="text-green-700">S/{stats.totalIngresos?.toFixed(2)}</span>
            </div>
          </div>
          <div className="bg-white rounded-xl border p-4 mt-3">
            <p className="text-xs text-gray-500 font-medium uppercase mb-3">Desglose por medio de pago</p>
            <div className="flex justify-between text-sm py-2 border-b">
              <span>💵 Efectivo</span><span className="font-semibold text-green-700">S/{stats.totalEfectivo?.toFixed(2)}</span>
            </div>
            {stats.totalYape > 0 && (
              <div className="flex justify-between text-sm py-2 border-b">
                <span>📱 Yape</span><span className="font-medium">S/{stats.totalYape?.toFixed(2)}</span>
              </div>
            )}
            {stats.totalTarjeta > 0 && (
              <div className="flex justify-between text-sm py-2 border-b">
                <span>💳 Tarjeta</span><span className="font-medium">S/{stats.totalTarjeta?.toFixed(2)}</span>
              </div>
            )}
            {stats.totalTransferencia > 0 && (
              <div className="flex justify-between text-sm py-2 border-b">
                <span>🏦 Transferencia</span><span className="font-medium">S/{stats.totalTransferencia?.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm py-2 font-semibold border-t mt-1">
              <span>Otros medios (total)</span>
              <span className="text-blue-700">S/{((stats.totalYape || 0) + (stats.totalTarjeta || 0) + (stats.totalTransferencia || 0)).toFixed(2)}</span>
            </div>
          </div>
        </>
      )}

      {/* Turnos */}
      {vista === 'turnos' && (
        <>
          {!turnoSeleccionado ? (
            <div className="flex flex-col gap-3">
              {turnos.map(t => (
                <div key={t.id} onClick={() => cargarHospedajesTurno(t)}
                  className="bg-white rounded-xl border p-4 cursor-pointer">
                  <div className="flex justify-between items-center mb-1">
                    <p className="font-semibold capitalize">{t.tipo}</p>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      !t.cierre ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {!t.cierre ? 'Activo' : 'Cerrado'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">{t.usuarios?.nombre || 'Sin usuario'}</p>
                  <p className="text-xs text-gray-400">{new Date(t.apertura).toLocaleString('es-PE')}</p>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <div className="bg-gray-50 rounded-lg p-2">
                      <p className="text-xs text-gray-400">Caja principal</p>
                      <p className="text-sm font-semibold">S/{t.caja_principal_actual}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-2">
                      <p className="text-xs text-gray-400">Caja consumos</p>
                      <p className="text-sm font-semibold">S/{t.caja_consumos_actual}</p>
                    </div>
                  </div>
                  {t.observaciones && (
                    <p className="text-xs text-gray-500 mt-2 italic">"{t.observaciones}"</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <>
              <button onClick={() => setTurnoSeleccionado(null)}
                className="mb-3 text-sm text-blue-600">← Volver a turnos</button>
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-3">
                <p className="font-semibold capitalize">{turnoSeleccionado.tipo}</p>
                <p className="text-xs text-blue-600">{turnoSeleccionado.usuarios?.nombre}</p>
                <p className="text-xs text-blue-500">{new Date(turnoSeleccionado.apertura).toLocaleString('es-PE')}</p>
              </div>

              {movimientosTurno.length > 0 && (
                <div className="bg-white rounded-xl border p-4 mb-3">
                  <p className="text-xs text-gray-500 font-medium uppercase mb-2">Movimientos de caja</p>
                  {movimientosTurno.map(mov => (
                    <div key={mov.id} className="flex justify-between items-start py-1.5 border-b last:border-0">
                      <div>
                        <p className="text-sm font-medium text-gray-700">{mov.concepto}</p>
                        <p className="text-xs text-gray-400">
                          {mov.tipo === 'prestamo_entre_cajas'
                            ? `Préstamo: ${mov.caja_origen} → ${mov.caja_destino}`
                            : `Salida de caja ${mov.caja_origen}`}
                        </p>
                        {mov.autorizado_por && (
                          <p className="text-xs text-gray-400">Autorizado: {mov.autorizado_por}</p>
                        )}
                      </div>
                      <span className="text-sm font-medium text-red-600">− S/{mov.monto}</span>
                    </div>
                  ))}
                </div>
              )}

              {movimientosStockTurno.length > 0 && (
                <div className="bg-white rounded-xl border p-4 mb-3">
                  <p className="text-xs text-gray-500 font-medium uppercase mb-2">Movimientos de productos</p>
                  {movimientosStockTurno.map(mov => (
                    <div key={mov.id} className="flex justify-between items-start py-1.5 border-b last:border-0">
                      <div>
                        <p className="text-sm font-medium text-gray-700">{mov.productos?.nombre || 'Producto eliminado'}</p>
                        <p className="text-xs text-gray-400">
                          {mov.tipo === 'consumo' ? 'Vendido en consumo' : 'Ajuste manual de stock'}
                          {mov.usuarios?.nombre ? ` · ${mov.usuarios.nombre}` : ''}
                        </p>
                      </div>
                      <span className={`text-sm font-medium ${mov.cantidad < 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {mov.cantidad > 0 ? '+' : ''}{mov.cantidad}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {hospedajesTurno.length === 0 ? (
                <p className="text-gray-400 text-sm text-center py-4">Sin hospedajes en este turno</p>
              ) : (() => {
                const activos = hospedajesTurno.filter(h => h.estado === 'activo')
                const finalizados = hospedajesTurno.filter(h => h.estado !== 'activo')
                return (
                  <>
                    {activos.length > 0 && (
                      <div className="mb-4">
                        <p className="text-xs text-gray-500 font-medium uppercase mb-2">
                          Habitaciones aún ocupadas ({activos.length})
                        </p>
                        <div className="flex flex-col gap-3">
                          {activos.map(h => (
                            <div key={h.id} onClick={() => navigate(`/ficha/${h.id}`)}
                              className="bg-white rounded-xl border-2 border-red-200 p-4 cursor-pointer">
                              <div className="flex justify-between items-start">
                                <div>
                                  <p className="font-semibold">
                                    {h.huesped_hospedaje?.[0]?.clientes?.nombres || 'Sin nombre'}
                                  </p>
                                  <p className="text-xs text-gray-500">Hab {h.habitaciones?.numero} · {h.habitaciones?.tipo_actual}</p>
                                  <p className="text-xs text-gray-400">{new Date(h.ingreso).toLocaleString('es-PE')}</p>
                                </div>
                                <div className="text-right">
                                  <p className="text-sm font-semibold">S/{h.tarifa_pactada}</p>
                                  <p className="text-xs text-blue-600">N° {String(h.nro_ficha).padStart(6, '0')}</p>
                                  <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-800">
                                    Ocupada
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {finalizados.length > 0 && (
                      <div>
                        <p className="text-xs text-gray-500 font-medium uppercase mb-2">
                          Ya hicieron checkout ({finalizados.length})
                        </p>
                        <div className="flex flex-col gap-3">
                          {finalizados.map(h => (
                            <div key={h.id} onClick={() => navigate(`/ficha/${h.id}`)}
                              className="bg-white rounded-xl border p-4 cursor-pointer opacity-80">
                              <div className="flex justify-between items-start">
                                <div>
                                  <p className="font-semibold">
                                    {h.huesped_hospedaje?.[0]?.clientes?.nombres || 'Sin nombre'}
                                  </p>
                                  <p className="text-xs text-gray-500">Hab {h.habitaciones?.numero} · {h.habitaciones?.tipo_actual}</p>
                                  <p className="text-xs text-gray-400">{new Date(h.ingreso).toLocaleString('es-PE')}</p>
                                </div>
                                <div className="text-right">
                                  <p className="text-sm font-semibold">S/{h.tarifa_pactada}</p>
                                  <p className="text-xs text-blue-600">N° {String(h.nro_ficha).padStart(6, '0')}</p>
                                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                                    h.estado_pago === 'pagado' ? 'bg-green-100 text-green-800' :
                                    h.estado_pago === 'parcial' ? 'bg-yellow-100 text-yellow-800' :
                                    'bg-red-100 text-red-800'
                                  }`}>
                                    {h.estado_pago === 'pagado' ? 'Pagado' :
                                     h.estado_pago === 'parcial' ? 'Parcial' : 'Pendiente'}
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )
              })()}
            </>
          )}
        </>
      )}

      {/* Fichas */}
      {vista === 'fichas' && (
        <>
          <div className="flex gap-2 mb-3">
            <input
              type="text"
              value={filtroFichas}
              onChange={e => setFiltroFichas(e.target.value)}
              placeholder="Buscar por ficha, nombre o DNI"
              className="flex-1 border rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <input
            type="date"
            value={fechaFiltroFichas}
            onChange={e => setFechaFiltroFichas(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-sm mb-3"
          />

          {fichasFiltradas.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-4">Sin resultados</p>
          ) : (
            <div className="flex flex-col gap-3">
              {fichasFiltradas.map(h => (
                <div
                  key={h.id}
                  onClick={() => navigate(`/ficha/${h.id}`)}
                  className="bg-white rounded-xl border p-4 cursor-pointer"
                >
                  <div className="flex justify-between items-start mb-1">
                    <p className="font-semibold">
                      {h.huesped_hospedaje?.[0]?.clientes?.nombres || 'Sin nombre'}
                    </p>
                    <span className="text-xs font-medium text-blue-600">
                      N° {String(h.nro_ficha).padStart(6, '0')}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">
                    Hab {h.habitaciones?.numero} · {h.habitaciones?.tipo_actual}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Ingreso: {new Date(h.ingreso).toLocaleDateString('es-PE')}
                  </p>
                  <div className="flex justify-between mt-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      h.estado === 'activo' ? 'bg-green-100 text-green-800' :
                      h.estado === 'finalizado' ? 'bg-gray-100 text-gray-600' :
                      'bg-red-100 text-red-600'
                    }`}>
                      {h.estado === 'activo' ? 'Activo' :
                       h.estado === 'finalizado' ? 'Finalizado' : 'Cancelado'}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      h.estado_pago === 'pagado' ? 'bg-green-100 text-green-800' :
                      h.estado_pago === 'parcial' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {h.estado_pago === 'pagado' ? 'Pagado' :
                       h.estado_pago === 'parcial' ? 'Parcial' : 'Pendiente'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Limpieza */}
      {vista === 'limpieza' && (
        <div className="flex flex-col gap-3">
          {limpiezas.map(l => (
            <div key={l.id} className="bg-white rounded-xl border p-4">
              <div className="flex justify-between items-start mb-1">
                <p className="font-semibold">Hab {l.habitaciones?.numero}</p>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  l.tipo === 'total' ? 'bg-yellow-100 text-yellow-800' : 'bg-orange-100 text-orange-800'
                }`}>
                  {l.tipo === 'total' ? 'Total' : 'Simple'}
                </span>
              </div>
              <p className="text-xs text-gray-400">
                Inicio: {l.hora ? new Date(l.hora).toLocaleString('es-PE') : 'No registrado'}
              </p>
              {l.observaciones && (
                <p className="text-xs text-gray-600 mt-1">{l.observaciones}</p>
              )}
              <span className={`text-xs px-2 py-0.5 rounded-full mt-2 inline-block ${
                l.estado === 'completada' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
              }`}>
                {l.estado === 'completada' ? 'Completada' : 'En proceso'}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Cochera */}
      {vista === 'cochera' && (
        <div className="flex flex-col gap-3">
          {cocheras.map(c => (
            <div key={c.id} className="bg-white rounded-xl border p-4">
              <div className="flex justify-between items-start mb-1">
                <p className="font-semibold">{c.placa}</p>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  c.estado_pago === 'pagado' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {c.estado_pago === 'pagado' ? 'Pagado' : 'Pendiente'}
                </span>
              </div>
              {c.hospedajes?.habitaciones?.numero && (
                <p className="text-xs text-blue-600">Hab {c.hospedajes.habitaciones.numero}</p>
              )}
              <p className="text-xs text-gray-400">
                Ingreso: {new Date(c.hora_ingreso).toLocaleString('es-PE')}
              </p>
              {c.hora_salida && (
                <p className="text-xs text-gray-400">
                  Salida: {new Date(c.hora_salida).toLocaleString('es-PE')}
                </p>
              )}
              {c.monto > 0 && (
                <p className="text-sm font-medium mt-1">S/{c.monto}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Buscar ficha */}
      {vista === 'ficha' && (
        <>
          <div className="flex gap-2 mb-4">
            <input
              type="number"
              value={busquedaFicha}
              onChange={e => setBusquedaFicha(e.target.value)}
              placeholder="Número de ficha"
              className="flex-1 border rounded-lg px-3 py-2 text-sm"
              onKeyDown={e => e.key === 'Enter' && buscarFicha()}
            />
            <button onClick={buscarFicha}
              className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium">
              Buscar
            </button>
          </div>
          {resultadosFicha.map(h => (
            <div key={h.id} onClick={() => navigate(`/ficha/${h.id}`)}
              className="bg-white rounded-xl border p-4 cursor-pointer">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-semibold">
                    {h.huesped_hospedaje?.[0]?.clientes?.nombres || 'Sin nombre'}
                  </p>
                  <p className="text-xs text-gray-500">Hab {h.habitaciones?.numero}</p>
                  <p className="text-xs text-gray-400">{new Date(h.ingreso).toLocaleString('es-PE')}</p>
                </div>
                <p className="text-xs font-medium text-blue-600">N° {String(h.nro_ficha).padStart(6, '0')}</p>
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  )
}

export default ReportesAdmin