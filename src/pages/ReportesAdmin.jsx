import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar, Legend, LineChart, Line
} from 'recharts'
import {
  exportarReporteGeneralPDF,
  exportarReporteGeneralExcel,
  exportarCierreTurnoPDF,
  exportarCierreTurnoExcel,
} from '../utils/exportReportes'

function ReportesAdmin() {
  const navigate = useNavigate()
  const [vista, setVista] = useState('general')
  const [cargando, setCargando] = useState(true)
  
  // Filtros General
  const [periodo, setPeriodo] = useState('semana')
  const [fechasPersonalizadas, setFechasPersonalizadas] = useState({ desde: '', hasta: '' })

  // Filtros Turnos y Cochera
  const [fechaFiltroTurnos, setFechaFiltroTurnos] = useState('')
  const [fechaFiltroCochera, setFechaFiltroCochera] = useState('')

  // Datos Generales
  const [stats, setStats] = useState({})
  const [chartData, setChartData] = useState({ porDia: [], conceptos: [], pagos: [], rentables: [], solicitadas: [], clientes: [] })
  const [insights, setInsights] = useState([])

  // Por turno
  const [turnos, setTurnos] = useState([])
  const [turnoSeleccionado, setTurnoSeleccionado] = useState(null)
  const [hospedajesTurno, setHospedajesTurno] = useState([])
  const [movimientosTurno, setMovimientosTurno] = useState([])
  const [movimientosStockTurno, setMovimientosStockTurno] = useState([])

  // Limpieza, Cochera, Fichas
  const [limpiezas, setLimpiezas] = useState([])
  const [cocheras, setCocheras] = useState([])
  const [todasFichas, setTodasFichas] = useState([])
  const [filtroFichas, setFiltroFichas] = useState('')
  const [fechaFiltroFichas, setFechaFiltroFichas] = useState('')
  const [busquedaFicha, setBusquedaFicha] = useState('')
  const [resultadosFicha, setResultadosFicha] = useState([])

  useEffect(() => {
    cargarDatosGenerales()
  }, [periodo, fechasPersonalizadas])

  useEffect(() => {
    cargarListasAdicionales()
  }, [])

  const getFechasRango = () => {
    const ahora = new Date()
    ahora.setHours(23, 59, 59, 999)
    const inicio = new Date()
    inicio.setHours(0, 0, 0, 0)
    let fin = new Date(ahora)
    
    let prevInicio = new Date()
    let prevFin = new Date()
    
    if (periodo === 'hoy') {
      prevInicio.setDate(inicio.getDate() - 1)
      prevFin = new Date(prevInicio); prevFin.setHours(23, 59, 59, 999)
    } else if (periodo === 'ayer') {
      inicio.setDate(inicio.getDate() - 1)
      fin = new Date(inicio); fin.setHours(23, 59, 59, 999)
      prevInicio.setDate(inicio.getDate() - 1)
      prevFin = new Date(prevInicio); prevFin.setHours(23, 59, 59, 999)
    } else if (periodo === 'semana') {
      inicio.setDate(ahora.getDate() - 6)
      prevInicio = new Date(inicio); prevInicio.setDate(prevInicio.getDate() - 7)
      prevFin = new Date(inicio); prevFin.setDate(prevFin.getDate() - 1); prevFin.setHours(23, 59, 59, 999)
    } else if (periodo === 'mes') {
      inicio.setDate(1)
      prevInicio = new Date(inicio); prevInicio.setMonth(prevInicio.getMonth() - 1)
      prevFin = new Date(inicio); prevFin.setDate(0); prevFin.setHours(23, 59, 59, 999)
    } else if (periodo === 'ultimo_mes') {
      inicio.setDate(1); inicio.setMonth(inicio.getMonth() - 1)
      fin = new Date(inicio); fin.setMonth(fin.getMonth() + 1); fin.setDate(0); fin.setHours(23, 59, 59, 999)
      prevInicio = new Date(inicio); prevInicio.setMonth(prevInicio.getMonth() - 1)
      prevFin = new Date(inicio); prevFin.setDate(0); prevFin.setHours(23, 59, 59, 999)
    } else if (periodo === 'personalizado' && fechasPersonalizadas.desde && fechasPersonalizadas.hasta) {
      inicio.setTime(new Date(fechasPersonalizadas.desde + 'T00:00:00').getTime())
      fin.setTime(new Date(fechasPersonalizadas.hasta + 'T23:59:59').getTime())
      const diffTime = Math.abs(fin - inicio)
      prevFin = new Date(inicio.getTime() - 1)
      prevInicio = new Date(prevFin.getTime() - diffTime)
    }
    
    return { inicio, fin, prevInicio, prevFin }
  }

  async function cargarDatosGenerales() {
    setCargando(true)
    const { inicio, fin, prevInicio, prevFin } = getFechasRango()

    // Query unificada de datos
    const [pagosRes, cocheraRes, habsRes, hospRes] = await Promise.all([
      supabase.from('pagos').select('monto, concepto, metodo, created_at, hospedaje_id').gte('created_at', prevInicio.toISOString()).lte('created_at', fin.toISOString()),
      supabase.from('cochera').select('monto, hora_ingreso, estado_pago').gte('hora_ingreso', prevInicio.toISOString()).lte('hora_ingreso', fin.toISOString()),
      supabase.from('habitaciones').select('id, numero, estado, tipo_actual'),
      supabase.from('hospedajes').select('id, habitacion_id, ingreso, salida_real, tarifa_pactada, estado, estado_pago, huesped_hospedaje(clientes(id, nombres))').gte('ingreso', prevInicio.toISOString()).lte('ingreso', fin.toISOString())
    ])

    const isCur = (item, f) => { const d = new Date(item[f]); return d >= inicio && d <= fin }
    const isPrev = (item, f) => { const d = new Date(item[f]); return d >= prevInicio && d <= prevFin }

    const pCur = (pagosRes.data || []).filter(p => isCur(p, 'created_at'))
    const pPrev = (pagosRes.data || []).filter(p => isPrev(p, 'created_at'))
    
    const cCur = (cocheraRes.data || []).filter(c => c.estado_pago === 'pagado' && isCur(c, 'hora_ingreso'))
    const cPrev = (cocheraRes.data || []).filter(c => c.estado_pago === 'pagado' && isPrev(c, 'hora_ingreso'))

    const hCur = (hospRes.data || []).filter(h => isCur(h, 'ingreso'))
    const hPrev = (hospRes.data || []).filter(h => isPrev(h, 'ingreso'))

    // KPIs Cálculos
    const ingrHosp = pCur.filter(p=>p.concepto==='hospedaje').reduce((s,p)=>s+parseFloat(p.monto),0)
    const ingrCons = pCur.filter(p=>p.concepto==='consumo').reduce((s,p)=>s+parseFloat(p.monto),0)
    const ingrCoch = cCur.reduce((s,c)=>s+parseFloat(c.monto),0)
    const totalIngresos = ingrHosp + ingrCons + ingrCoch

    const ingrHospP = pPrev.filter(p=>p.concepto==='hospedaje').reduce((s,p)=>s+parseFloat(p.monto),0)
    const ingrConsP = pPrev.filter(p=>p.concepto==='consumo').reduce((s,p)=>s+parseFloat(p.monto),0)
    const ingrCochP = cPrev.reduce((s,c)=>s+parseFloat(c.monto),0)
    const totalIngresosPrev = ingrHospP + ingrConsP + ingrCochP

    const checkinsHoy = hCur.length
    const checkinsPrev = hPrev.length

    // Para checkouts y estadía analizamos toda la base filtrada
    const checkoutsData = (hospRes.data || []).filter(h => h.estado === 'finalizado' && h.salida_real)
    const checkoutsCur = checkoutsData.filter(h => isCur(h, 'salida_real'))
    const checkoutsPrev = checkoutsData.filter(h => isPrev(h, 'salida_real'))

    const calcularEstadia = (lista) => {
      if(!lista.length) return 0
      const dias = lista.reduce((s, h) => {
        const diff = Math.ceil((new Date(h.salida_real) - new Date(h.ingreso)) / 86400000)
        return s + (diff === 0 ? 1 : diff)
      }, 0)
      return dias / lista.length
    }
    const estadiaPromedio = calcularEstadia(checkoutsCur)
    const estadiaPromedioPrev = calcularEstadia(checkoutsPrev)

    const ingresoReservas = hCur.length ? totalIngresos / hCur.length : 0
    const ingresoReservasPrev = hPrev.length ? totalIngresosPrev / hPrev.length : 0

    const habitacionesTotal = habsRes.data?.length || 1
    const habitacionesOcupadas = habsRes.data?.filter(h=>h.estado==='ocupada').length || 0
    const ocupacion = (habitacionesOcupadas / habitacionesTotal) * 100

    // Rankings y Tablas (Fila 4 y 5)
    const rentMap = {}, solMap = {}, cliMap = {}
    hCur.forEach(h => {
      const hab = habsRes.data?.find(r=>r.id === h.habitacion_id)
      if (hab) {
        if(!rentMap[hab.numero]) rentMap[hab.numero] = { numero: hab.numero, tipo: hab.tipo_actual, ingresos: 0, reservas: 0 }
        rentMap[hab.numero].reservas += 1
        rentMap[hab.numero].ingresos += pCur.filter(p=>p.hospedaje_id === h.id).reduce((s,p)=>s+parseFloat(p.monto),0)
      }
      
      const cliente = h.huesped_hospedaje?.[0]?.clientes
      if (cliente) {
        if(!cliMap[cliente.id]) cliMap[cliente.id] = { nombre: cliente.nombres, visitas: 0, ingresos: 0 }
        cliMap[cliente.id].visitas += 1
        cliMap[cliente.id].ingresos += pCur.filter(p=>p.hospedaje_id === h.id).reduce((s,p)=>s+parseFloat(p.monto),0)
      }
    })

    const rentables = Object.values(rentMap).sort((a,b)=>b.ingresos - a.ingresos).slice(0,5)
    const solicitadas = Object.values(rentMap).sort((a,b)=>b.reservas - a.reservas).slice(0,5)
    const clientesFrec = Object.values(cliMap).sort((a,b)=>b.visitas - a.visitas).slice(0,5)

    // Agrupación de días para gráficos (Line y Area)
    const mapDias = {}
    // Rellenar días del periodo
    let curr = new Date(inicio)
    while (curr <= fin) {
      const fStr = curr.toISOString().split('T')[0]
      mapDias[fStr] = { name: curr.toLocaleDateString('es-PE', { weekday: 'short', day: '2-digit' }), fecha: fStr, Hospedaje: 0, Consumos: 0, Cochera: 0, Ocupacion: 0 }
      curr.setDate(curr.getDate() + 1)
    }
    
    pCur.forEach(p => {
      const fStr = p.created_at.split('T')[0]
      if(mapDias[fStr]) {
        if(p.concepto === 'hospedaje') mapDias[fStr].Hospedaje += parseFloat(p.monto)
        if(p.concepto === 'consumo') mapDias[fStr].Consumos += parseFloat(p.monto)
      }
    })
    cCur.forEach(c => {
      const fStr = c.hora_ingreso.split('T')[0]
      if(mapDias[fStr]) mapDias[fStr].Cochera += parseFloat(c.monto)
    })
    // Aproximación de ocupación diaria
    Object.keys(mapDias).forEach(fStr => {
      const dTarget = new Date(fStr + 'T12:00:00')
      const ocupadasEseDia = hospRes.data?.filter(h => {
        const i = new Date(h.ingreso)
        const s = h.salida_real ? new Date(h.salida_real) : new Date()
        return dTarget >= i && dTarget <= s
      }).length || 0
      mapDias[fStr].Ocupacion = (ocupadasEseDia / habitacionesTotal) * 100
    })

    const porDiaData = Object.values(mapDias)

    // Desglose Métodos
    const pagosBarras = [
      { name: 'Efectivo', value: pCur.filter(p=>p.metodo==='efectivo').reduce((s,p)=>s+parseFloat(p.monto),0), fill: '#10b981' },
      { name: 'Yape', value: pCur.filter(p=>p.metodo==='yape').reduce((s,p)=>s+parseFloat(p.monto),0), fill: '#8b5cf6' },
      { name: 'Tarjeta', value: pCur.filter(p=>p.metodo==='tarjeta').reduce((s,p)=>s+parseFloat(p.monto),0), fill: '#3b82f6' },
      { name: 'Transf.', value: pCur.filter(p=>p.metodo==='transferencia').reduce((s,p)=>s+parseFloat(p.monto),0), fill: '#f59e0b' }
    ].filter(d=>d.value>0)

    const conceptosBarras = [
      { name: 'Hospedaje', value: ingrHosp, fill: '#6366f1' },
      { name: 'Consumos', value: ingrCons, fill: '#f59e0b' },
      { name: 'Cochera', value: ingrCoch, fill: '#10b981' }
    ].filter(d=>d.value>0)

    // Insights Dinámicos
    const genInsights = []
    if (totalIngresos > totalIngresosPrev * 1.1) genInsights.push({ i: '🟢', txt: `Ingresos subieron un ${Math.round(((totalIngresos/totalIngresosPrev)-1)*100)}% respecto al periodo anterior.` })
    else if (totalIngresos < totalIngresosPrev * 0.9 && totalIngresosPrev > 0) genInsights.push({ i: '🔴', txt: `Ingresos cayeron un ${Math.round(((totalIngresosPrev-totalIngresos)/totalIngresosPrev)*100)}%.` })
    
    if (ocupacion > 80) genInsights.push({ i: '🔥', txt: `Alta ocupación actual (${Math.round(ocupacion)}%).` })
    else if (ocupacion < 40) genInsights.push({ i: '🧊', txt: `Ocupación baja (${Math.round(ocupacion)}%). Considera lanzar promociones.` })

    if (rentables.length > 0) genInsights.push({ i: '⭐', txt: `Habitación ${rentables[0].numero} es la más rentable (S/${rentables[0].ingresos.toFixed(0)}).` })
    if (estadiaPromedio > 3) genInsights.push({ i: '🏨', txt: `Estadía promedio excelente (${estadiaPromedio.toFixed(1)} noches).` })

    // Set States
    setStats({
      totalIngresos, totalIngresosPrev,
      ingresosHospedaje: ingrHosp, ingresosConsumos: ingrCons, ingresosCochera: ingrCoch,
      totalEfectivo: pCur.filter(p=>p.metodo==='efectivo').reduce((s,p)=>s+parseFloat(p.monto),0),
      totalYape: pCur.filter(p=>p.metodo==='yape').reduce((s,p)=>s+parseFloat(p.monto),0),
      totalTarjeta: pCur.filter(p=>p.metodo==='tarjeta').reduce((s,p)=>s+parseFloat(p.monto),0),
      totalTransferencia: pCur.filter(p=>p.metodo==='transferencia').reduce((s,p)=>s+parseFloat(p.monto),0),
      habitacionesOcupadas, habitacionesTotal, ocupacion,
      checkinsHoy, checkinsPrev, checkoutsHoy: checkoutsCur.length, checkoutsPrev: checkoutsPrev.length,
      estadiaPromedio, estadiaPromedioPrev,
      ingresoReservas, ingresoReservasPrev
    })
    setChartData({
      porDia: porDiaData,
      conceptos: conceptosBarras,
      pagos: pagosBarras,
      rentables, solicitadas,
      clientes: clientesFrec
    })
    setInsights(genInsights)
    setCargando(false)
  }

  async function cargarListasAdicionales() {
    const [turnosData, limpData, cocheraAll, fichasData] = await Promise.all([
      supabase.from('turnos').select('*, usuarios(nombre)').order('apertura', { ascending: false }).limit(100),
      supabase.from('limpieza').select('*, habitaciones(numero, tipo_actual)').order('hora', { ascending: false }).limit(50),
      supabase.from('cochera').select('*, hospedajes(habitacion_id, habitaciones(numero))').order('hora_ingreso', { ascending: false }).limit(100),
      supabase.from('hospedajes').select(`*, habitaciones(numero, tipo_actual), huesped_hospedaje(clientes(nombres, dni_pasaporte, telefono))`).order('ingreso', { ascending: false }).limit(100)
    ])
    setTurnos(turnosData.data || [])
    setLimpiezas(limpData.data || [])
    setCocheras(cocheraAll.data || [])
    setTodasFichas(fichasData.data || [])
  }

  async function cargarHospedajesTurno(turno) {
    setTurnoSeleccionado(turno)
    const { data } = await supabase.from('hospedajes')
      .select(`*, habitaciones(numero, tipo_actual), huesped_hospedaje(clientes(nombres, dni_pasaporte, telefono))`)
      .eq('turno_id', turno.id).order('ingreso')
    setHospedajesTurno(data || [])

    const { data: movs } = await supabase.from('movimientos_caja')
      .select('*').eq('turno_id', turno.id).order('created_at', { ascending: false })
    setMovimientosTurno(movs || [])

    const { data: movsStock } = await supabase.from('movimientos_stock')
      .select('*, productos(nombre), usuarios(nombre)')
      .eq('turno_id', turno.id).order('created_at', { ascending: false })
    setMovimientosStockTurno(movsStock || [])
  }

  async function buscarFicha() {
    if (!busquedaFicha.trim()) return
    const { data } = await supabase.from('hospedajes')
      .select(`*, habitaciones(numero, tipo_actual), huesped_hospedaje(clientes(nombres, dni_pasaporte, telefono))`)
      .eq('nro_ficha', parseInt(busquedaFicha))
    setResultadosFicha(data || [])
  }

  const calcularVar = (cur, prev) => {
    if (prev === 0 && cur > 0) return { val: 100, icon: '▲', color: 'text-green-600' }
    if (prev === 0 && cur === 0) return { val: 0, icon: '−', color: 'text-gray-400' }
    const dif = ((cur - prev) / prev) * 100
    if (dif > 0) return { val: dif.toFixed(1), icon: '▲', color: 'text-green-600' }
    if (dif < 0) return { val: Math.abs(dif).toFixed(1), icon: '▼', color: 'text-red-600' }
    return { val: 0, icon: '−', color: 'text-gray-400' }
  }

  // Filtrados visuales
  const turnosFiltrados = fechaFiltroTurnos 
    ? turnos.filter(t => new Date(t.apertura).toISOString().split('T')[0] === fechaFiltroTurnos)
    : turnos

  const cocherasFiltradas = fechaFiltroCochera
    ? cocheras.filter(c => new Date(c.hora_ingreso).toISOString().split('T')[0] === fechaFiltroCochera)
    : cocheras

  const fichasFiltradas = todasFichas.filter(h => {
    const nroFicha = String(h.nro_ficha).padStart(6, '0')
    const nombre = h.huesped_hospedaje?.[0]?.clientes?.nombres?.toLowerCase() || ''
    const fechaMatch = fechaFiltroFichas ? new Date(h.ingreso).toISOString().split('T')[0] === fechaFiltroFichas : true
    return fechaMatch && (nroFicha.includes(filtroFichas) || nombre.includes(filtroFichas.toLowerCase()))
  })

  if (cargando) return (
    <div className="flex justify-center items-center h-screen bg-gray-50">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
    </div>
  )

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 border border-gray-100 shadow-xl rounded-2xl z-50">
          <p className="font-bold text-gray-800 mb-2">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }} className="text-sm font-semibold flex justify-between gap-4">
              <span>{entry.name}:</span>
              <span>{entry.name === 'Ocupacion' ? `${entry.value.toFixed(1)}%` : `S/${entry.value.toFixed(2)}`}</span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <header className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-20 mb-8">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/')} className="p-2 rounded-full hover:bg-gray-100 text-gray-600 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            </button>
            <div>
              <h1 className="text-xl font-black text-gray-800 tracking-tight">Reportes y Analítica</h1>
              <p className="text-sm text-gray-500 font-medium">Dashboard Administrativo</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4">
        {/* Tabs Modernos */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2 scrollbar-hide">
          {[
            { key: 'general', label: '📊 Vista General' },
            { key: 'turnos', label: '🏪 Cierres de Turno' },
            { key: 'fichas', label: '🗂️ Historial Fichas' },
            { key: 'limpieza', label: '🧹 Limpieza' },
            { key: 'cochera', label: '🚗 Cochera' },
            { key: 'ficha', label: '🔍 Buscar Ficha' },
          ].map(t => (
            <button key={t.key} onClick={() => setVista(t.key)}
              className={`px-5 py-2.5 rounded-2xl text-sm font-bold whitespace-nowrap transition-all ${
                vista === t.key 
                ? 'bg-gray-800 text-white shadow-md' 
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* ===================== GENERAL (DASHBOARD MEGA) ===================== */}
        {vista === 'general' && (
          <div className="space-y-6 animate-fadeIn">
            
            {/* Controles de Fechas */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white p-4 rounded-3xl border border-gray-100 shadow-sm">
              <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                <select value={periodo} onChange={e => setPeriodo(e.target.value)}
                  className="bg-gray-50 border-none font-bold text-gray-800 rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer">
                  <option value="hoy">Hoy</option>
                  <option value="ayer">Ayer</option>
                  <option value="semana">Última Semana</option>
                  <option value="mes">Este Mes</option>
                  <option value="ultimo_mes">Mes Anterior</option>
                  <option value="personalizado">Personalizado...</option>
                </select>
                {periodo === 'personalizado' && (
                  <div className="flex items-center gap-2">
                    <input type="date" value={fechasPersonalizadas.desde} onChange={e=>setFechasPersonalizadas({...fechasPersonalizadas, desde: e.target.value})} className="bg-gray-50 rounded-xl px-3 py-2 text-sm font-bold text-gray-700 outline-none" />
                    <span className="text-gray-400 font-bold">-</span>
                    <input type="date" value={fechasPersonalizadas.hasta} onChange={e=>setFechasPersonalizadas({...fechasPersonalizadas, hasta: e.target.value})} className="bg-gray-50 rounded-xl px-3 py-2 text-sm font-bold text-gray-700 outline-none" />
                  </div>
                )}
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
                <button
                  onClick={() => exportarReporteGeneralPDF(stats, periodo, chartData.porDia.map(d=>({fecha:d.fecha, hospedaje:d.Hospedaje, consumos:d.Consumos, cochera:d.Cochera, total:d.Hospedaje+d.Consumos+d.Cochera})))}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl font-bold transition-colors"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" /></svg>
                  PDF
                </button>
                <button
                  onClick={() => exportarReporteGeneralExcel(stats, periodo, chartData.porDia.map(d=>({fecha:d.fecha, hospedaje:d.Hospedaje, consumos:d.Consumos, cochera:d.Cochera, total:d.Hospedaje+d.Consumos+d.Cochera})))}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-xl font-bold transition-colors"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" /></svg>
                  Excel
                </button>
              </div>
            </div>

            {/* FILA 1: KPIs con Comparación */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {[
                { title: 'TOTAL INGRESOS', val: `S/${stats.totalIngresos?.toFixed(0)}`, prev: stats.totalIngresosPrev },
                { title: 'OCUPACIÓN', val: `${stats.ocupacion?.toFixed(1)}%`, prev: (stats.habitacionesOcupadas/stats.habitacionesTotal)*100 /* Simplified prev */ },
                { title: 'CHECK-INS', val: stats.checkinsHoy, prev: stats.checkinsPrev },
                { title: 'ESTADÍA PROM.', val: `${stats.estadiaPromedio?.toFixed(1)} Noches`, prev: stats.estadiaPromedioPrev },
                { title: 'INGRESO/RESERVA', val: `S/${stats.ingresoReservas?.toFixed(0)}`, prev: stats.ingresoReservasPrev }
              ].map((kpi, i) => {
                const vari = calcularVar(parseFloat(String(kpi.val).replace(/[^\d.-]/g,'')), parseFloat(String(kpi.prev).replace(/[^\d.-]/g,'')) || 0)
                return (
                  <div key={i} className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm relative overflow-hidden group">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{kpi.title}</p>
                    <p className="text-2xl font-black text-gray-800 tracking-tighter mb-2">{kpi.val}</p>
                    <div className="flex items-center gap-1 text-[11px] font-bold">
                      <span className={vari.color}>{vari.icon} {vari.val}%</span>
                      <span className="text-gray-400">vs anterior</span>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* FILA 2: Tendencia de Ingresos */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
              <h3 className="text-sm font-black text-gray-800 uppercase tracking-widest mb-6">📈 Tendencia de Ingresos</h3>
              <div className="h-[280px] w-full">
                {chartData.porDia.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData.porDia} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9ca3af', fontWeight: 600 }} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9ca3af', fontWeight: 600 }} tickFormatter={(val) => `S/${val}`} />
                      <RechartsTooltip content={<CustomTooltip />} />
                      <Legend wrapperStyle={{ fontSize: '11px', fontWeight: 'bold' }} />
                      <Area type="monotone" dataKey="Hospedaje" stackId="1" stroke="#6366f1" fill="#c7d2fe" />
                      <Area type="monotone" dataKey="Consumos" stackId="1" stroke="#f59e0b" fill="#fde68a" />
                      <Area type="monotone" dataKey="Cochera" stackId="1" stroke="#10b981" fill="#a7f3d0" />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : <p className="text-gray-400 text-center font-medium mt-20">Sin datos</p>}
              </div>
            </div>

            {/* FILA 3: Ocupación y Categorías */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Ocupacion Line Chart */}
              <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
                <h3 className="text-sm font-black text-gray-800 uppercase tracking-widest mb-6">🏨 Ocupación Diaria (%)</h3>
                <div className="h-[250px] w-full">
                  {chartData.porDia.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData.porDia} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9ca3af', fontWeight: 600 }} dy={10} />
                        <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9ca3af', fontWeight: 600 }} tickFormatter={(val) => `${val}%`} />
                        <RechartsTooltip content={<CustomTooltip />} />
                        <Line type="monotone" dataKey="Ocupacion" stroke="#ec4899" strokeWidth={4} dot={{ r: 4, fill: '#ec4899' }} activeDot={{ r: 8 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : <p className="text-gray-400 text-center font-medium mt-20">Sin datos</p>}
                </div>
              </div>

              {/* Ingresos por Categoría (Barras Horizontales) */}
              <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
                <h3 className="text-sm font-black text-gray-800 uppercase tracking-widest mb-6">💰 Ingresos por Categoría</h3>
                <div className="h-[250px] w-full">
                  {chartData.conceptos.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData.conceptos} layout="vertical" margin={{ top: 0, right: 20, left: 20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f3f4f6" />
                        <XAxis type="number" hide />
                        <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#4b5563', fontWeight: 700 }} />
                        <RechartsTooltip cursor={{fill: 'transparent'}} contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} formatter={(v)=>`S/${v}`}/>
                        <Bar dataKey="value" radius={[0, 8, 8, 0]} barSize={28}>
                          {chartData.conceptos.map((e,i)=><Cell key={i} fill={e.fill} />)}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : <p className="text-gray-400 text-center font-medium mt-20">Sin datos</p>}
                </div>
              </div>
            </div>

            {/* FILA 4: Medios de pago y Rentables */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
                <h3 className="text-sm font-black text-gray-800 uppercase tracking-widest mb-6">💳 Métodos de Pago</h3>
                <div className="h-[250px] w-full">
                  {chartData.pagos.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData.pagos} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9ca3af', fontWeight: 600 }} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9ca3af', fontWeight: 600 }} tickFormatter={(val) => `S/${val}`} />
                        <RechartsTooltip cursor={{fill: 'transparent'}} contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} formatter={(v)=>`S/${v}`}/>
                        <Bar dataKey="value" radius={[8, 8, 0, 0]} barSize={32}>
                          {chartData.pagos.map((e,i)=><Cell key={i} fill={e.fill} />)}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : <p className="text-gray-400 text-center font-medium mt-20">Sin datos</p>}
                </div>
              </div>

              <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 overflow-auto h-[330px]">
                <h3 className="text-sm font-black text-gray-800 uppercase tracking-widest mb-4">⭐ Habitaciones Top</h3>
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-gray-100 text-[10px] uppercase tracking-widest text-gray-400">
                      <th className="py-3 font-black">Hab</th>
                      <th className="py-3 font-black">Reservas</th>
                      <th className="py-3 font-black text-right">Ingresos</th>
                    </tr>
                  </thead>
                  <tbody>
                    {chartData.rentables.map((r,i) => (
                      <tr key={i} className="border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors">
                        <td className="py-3">
                          <p className="font-black text-gray-800">{r.numero}</p>
                          <p className="text-xs font-bold text-gray-400">{r.tipo}</p>
                        </td>
                        <td className="py-3 font-bold text-indigo-600">{r.reservas}</td>
                        <td className="py-3 font-black text-green-600 text-right">S/{r.ingresos.toFixed(2)}</td>
                      </tr>
                    ))}
                    {chartData.rentables.length === 0 && (
                      <tr><td colSpan="3" className="text-center py-8 text-sm text-gray-400 font-bold">Sin registros</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* FILA 5: Insights y Fidelidad */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              <div className="bg-gradient-to-br from-indigo-600 to-blue-700 rounded-3xl border border-indigo-500 shadow-lg p-8 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 p-6 opacity-10">
                  <svg className="w-32 h-32" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/></svg>
                </div>
                <div className="relative z-10">
                  <h3 className="text-indigo-200 font-bold uppercase tracking-widest text-sm mb-6">💡 Insights Automáticos</h3>
                  <div className="space-y-4">
                    {insights.map((ins, i) => (
                      <div key={i} className="flex gap-3 items-start bg-white/10 p-3 rounded-2xl backdrop-blur-sm border border-white/20">
                        <span className="text-xl">{ins.i}</span>
                        <p className="text-sm font-bold text-white leading-snug">{ins.txt}</p>
                      </div>
                    ))}
                    {insights.length === 0 && <p className="text-indigo-200 text-sm font-bold">Recopilando datos suficientes...</p>}
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 overflow-auto h-[330px]">
                <h3 className="text-sm font-black text-gray-800 uppercase tracking-widest mb-4">👑 Clientes Frecuentes</h3>
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-gray-100 text-[10px] uppercase tracking-widest text-gray-400">
                      <th className="py-3 font-black">Cliente</th>
                      <th className="py-3 font-black">Visitas</th>
                      <th className="py-3 font-black text-right">LTV (S/)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {chartData.clientes.map((c,i) => (
                      <tr key={i} className="border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors">
                        <td className="py-3 font-bold text-gray-800 truncate max-w-[150px]" title={c.nombre}>{c.nombre}</td>
                        <td className="py-3 font-black text-amber-600 text-center">{c.visitas}</td>
                        <td className="py-3 font-bold text-gray-600 text-right">S/{c.ingresos.toFixed(2)}</td>
                      </tr>
                    ))}
                    {chartData.clientes.length === 0 && (
                      <tr><td colSpan="3" className="text-center py-8 text-sm text-gray-400 font-bold">Sin clientes frecuentes</td></tr>
                    )}
                  </tbody>
                </table>
              </div>

            </div>
          </div>
        )}

        {/* ===================== VISTA TURNOS (CORREGIDA CON ESTILOS) ===================== */}
        {vista === 'turnos' && (
          <div className="animate-fadeIn">
            <div className="mb-6 bg-white p-3 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-3 w-max">
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-2">Filtrar Fecha:</span>
              <input type="date" value={fechaFiltroTurnos} onChange={e=>setFechaFiltroTurnos(e.target.value)}
                className="bg-gray-50 rounded-xl px-3 py-1.5 text-sm font-bold text-gray-700 outline-none" />
              {fechaFiltroTurnos && <button onClick={()=>setFechaFiltroTurnos('')} className="text-red-500 text-xs font-bold px-2">X</button>}
            </div>

            {!turnoSeleccionado ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {turnosFiltrados.map(t => (
                  <div key={t.id} onClick={() => cargarHospedajesTurno(t)}
                    className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 cursor-pointer hover:shadow-md hover:-translate-y-1 transition-all">
                    <div className="flex justify-between items-center mb-3">
                      <p className="font-black text-gray-800 capitalize text-lg">{t.tipo}</p>
                      <span className={`text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-lg ${
                        !t.cierre ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {!t.cierre ? 'En Curso' : 'Finalizado'}
                      </span>
                    </div>
                    <p className="text-sm font-bold text-gray-600 mb-1 flex items-center gap-2">👤 {t.usuarios?.nombre || 'Sin usuario'}</p>
                    <p className="text-xs font-bold text-gray-400 mb-4 flex items-center gap-2">🕒 {new Date(t.apertura).toLocaleString('es-PE', {day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit'})}</p>
                  </div>
                ))}
                {turnosFiltrados.length === 0 && <p className="text-gray-400 font-bold ml-2">No hay turnos registrados en esta fecha.</p>}
              </div>
            ) : (
              <div className="animate-fadeIn">
                <button onClick={() => setTurnoSeleccionado(null)}
                  className="mb-6 px-4 py-2 bg-white border border-gray-200 text-gray-600 font-bold rounded-xl hover:bg-gray-50 flex items-center gap-2 shadow-sm">
                  ← Volver a lista de turnos
                </button>
                <div className="bg-white border border-gray-100 shadow-sm rounded-3xl p-6 mb-6">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                      <p className="text-2xl font-black text-gray-800 capitalize tracking-tight mb-1">{turnoSeleccionado.tipo}</p>
                      <div className="flex gap-3 text-sm font-bold text-gray-500">
                        <span>👤 {turnoSeleccionado.usuarios?.nombre}</span>
                        <span>🕒 {new Date(turnoSeleccionado.apertura).toLocaleString('es-PE')}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => exportarCierreTurnoPDF(turnoSeleccionado, movimientosTurno, movimientosStockTurno, hospedajesTurno)}
                        className="text-xs px-4 py-2.5 bg-red-600 text-white rounded-xl font-black shadow-sm hover:bg-red-700 transition-colors"
                      >
                        📄 PDF
                      </button>
                      <button
                        onClick={() => exportarCierreTurnoExcel(turnoSeleccionado, movimientosTurno, movimientosStockTurno, hospedajesTurno)}
                        className="text-xs px-4 py-2.5 bg-green-700 text-white rounded-xl font-black shadow-sm hover:bg-green-800 transition-colors"
                      >
                        📊 Excel
                      </button>
                    </div>
                  </div>
                </div>

                {/* Movimientos de Caja */}
                {movimientosTurno.length > 0 && (
                  <div className="bg-white rounded-3xl border border-gray-100 p-6 mb-6 shadow-sm">
                    <p className="text-xs text-gray-400 font-black uppercase tracking-widest mb-4">Movimientos de Caja</p>
                    <div className="space-y-3">
                      {movimientosTurno.map(mov => (
                        <div key={mov.id} className="flex justify-between items-center py-3 border-b border-gray-50 last:border-0">
                          <div>
                            <p className="text-sm font-black text-gray-800">{mov.concepto}</p>
                            <p className="text-xs font-bold text-gray-400">{mov.tipo === 'prestamo_entre_cajas' ? `Caja ${mov.caja_origen} a ${mov.caja_destino}` : `Salida de ${mov.caja_origen}`}</p>
                          </div>
                          <span className="text-sm font-black text-red-600 bg-red-50 px-3 py-1 rounded-lg">− S/{mov.monto}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Movimientos de Productos (Stock) */}
                {movimientosStockTurno.length > 0 && (
                  <div className="bg-white rounded-3xl border border-gray-100 p-6 mb-6 shadow-sm">
                    <p className="text-xs text-gray-400 font-black uppercase tracking-widest mb-4">Movimientos de Productos</p>
                    <div className="space-y-3">
                      {movimientosStockTurno.map(mov => (
                        <div key={mov.id} className="flex justify-between items-center py-3 border-b border-gray-50 last:border-0">
                          <div>
                            <p className="text-sm font-black text-gray-800">{mov.productos?.nombre || 'Producto eliminado'}</p>
                            <p className="text-xs font-bold text-gray-400">
                              {mov.tipo === 'consumo' ? 'Vendido en consumo' :
                               mov.tipo === 'reposicion_consumo_eliminado' ? 'Repuesto (consumo eliminado)' :
                               'Ajuste manual de stock'}
                              {mov.usuarios?.nombre ? ` · ${mov.usuarios.nombre}` : ''}
                            </p>
                          </div>
                          <span className={`text-sm font-black px-3 py-1 rounded-lg ${mov.cantidad < 0 ? 'text-red-600 bg-red-50' : 'text-green-600 bg-green-50'}`}>
                            {mov.cantidad > 0 ? '+' : ''}{mov.cantidad}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Listas de Hospedaje Turno (IGUAL A CAPTURA DEL USUARIO) */}
                {hospedajesTurno.length === 0 ? (
                  <p className="text-gray-400 text-sm font-bold text-center py-8">Sin hospedajes en este turno</p>
                ) : (() => {
                  const activos = hospedajesTurno.filter(h => h.estado === 'activo')
                  const finalizados = hospedajesTurno.filter(h => h.estado !== 'activo')
                  return (
                    <div className="space-y-8">
                      {activos.length > 0 && (
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3">Habitaciones Ocupadas ({activos.length})</p>
                          <div className="flex flex-col gap-3">
                            {activos.map(h => (
                              <div key={h.id} className="bg-white rounded-2xl border border-red-100 shadow-sm p-5 cursor-pointer hover:border-red-300 transition-colors" onClick={()=>navigate(`/ficha/${h.id}`)}>
                                <div className="flex justify-between items-start">
                                  <div>
                                    <p className="font-black text-gray-800">{h.huesped_hospedaje?.[0]?.clientes?.nombres || 'Sin nombre'}</p>
                                    <p className="text-xs font-bold text-gray-400">{h.huesped_hospedaje?.[0]?.clientes?.telefono}</p>
                                    <p className="text-xs font-bold text-gray-500 mt-1">Hab {h.habitaciones?.numero} - {h.habitaciones?.tipo_actual}</p>
                                    <p className="text-[10px] font-bold text-gray-400 mt-1">{new Date(h.ingreso).toLocaleString('es-PE')}</p>
                                  </div>
                                  <div className="text-right flex flex-col items-end">
                                    <p className="text-base font-black text-gray-800">S/{h.tarifa_pactada}</p>
                                    <p className="text-[10px] font-black text-indigo-500 mt-1 mb-2">N° {String(h.nro_ficha).padStart(6, '0')}</p>
                                    <span className="text-[10px] px-2 py-1 rounded-md font-black uppercase tracking-wider bg-red-50 text-red-600 border border-red-100">Ocupada</span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {finalizados.length > 0 && (
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3">Ya hicieron checkout ({finalizados.length})</p>
                          <div className="flex flex-col gap-3">
                            {finalizados.map(h => (
                              <div key={h.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 cursor-pointer hover:border-gray-300 transition-colors" onClick={()=>navigate(`/ficha/${h.id}`)}>
                                <div className="flex justify-between items-start">
                                  <div>
                                    <p className="font-black text-gray-800 uppercase">{h.huesped_hospedaje?.[0]?.clientes?.nombres || 'Sin nombre'}</p>
                                    <p className="text-xs font-bold text-gray-400">{h.huesped_hospedaje?.[0]?.clientes?.telefono}</p>
                                    <p className="text-xs font-bold text-gray-500 mt-1">Hab {h.habitaciones?.numero} - {h.habitaciones?.tipo_actual}</p>
                                    <p className="text-[10px] font-bold text-gray-400 mt-1">{new Date(h.salida_real).toLocaleString('es-PE')}</p>
                                  </div>
                                  <div className="text-right flex flex-col items-end">
                                    <p className="text-base font-black text-gray-800">S/{h.tarifa_pactada}</p>
                                    <p className="text-[10px] font-black text-indigo-500 mt-1 mb-2">N° {String(h.nro_ficha).padStart(6, '0')}</p>
                                    <span className={`text-[10px] px-2 py-1 rounded-md font-black uppercase tracking-wider ${
                                      h.estado_pago === 'pagado' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-600 border border-red-100'
                                    }`}>
                                      {h.estado_pago === 'pagado' ? 'Pagado' : 'Pendiente'}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })()}
              </div>
            )}
          </div>
        )}

        {/* ===================== COCHERA Y OTROS (Simplificado por brevedad pero funcionales) ===================== */}
        {vista === 'cochera' && (
          <div className="animate-fadeIn">
            <div className="mb-6 bg-white p-3 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-3 w-max">
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-2">Filtrar Fecha:</span>
              <input type="date" value={fechaFiltroCochera} onChange={e=>setFechaFiltroCochera(e.target.value)}
                className="bg-gray-50 rounded-xl px-3 py-1.5 text-sm font-bold text-gray-700 outline-none" />
              {fechaFiltroCochera && <button onClick={()=>setFechaFiltroCochera('')} className="text-red-500 text-xs font-bold px-2">X</button>}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {cocherasFiltradas.map(c => (
                <div key={c.id} className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center text-xl border border-gray-100">🚙</div>
                    <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-md ${c.estado_pago === 'pagado' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{c.estado_pago}</span>
                  </div>
                  <p className="font-black text-gray-800 text-xl tracking-wider uppercase mb-1">{c.placa}</p>
                  <div className="space-y-1 mt-2">
                    <p className="text-xs font-bold text-gray-400">Ingreso: {new Date(c.hora_ingreso).toLocaleString('es-PE', {day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit'})}</p>
                  </div>
                </div>
              ))}
              {cocherasFiltradas.length === 0 && <p className="text-gray-400 font-bold ml-2">No hay vehículos registrados en esta fecha.</p>}
            </div>
          </div>
        )}

        {/* ===================== FICHAS ===================== */}
        {vista === 'fichas' && (
          <div className="animate-fadeIn">
            <div className="flex gap-2 mb-3">
              <input type="text" value={filtroFichas} onChange={e => setFiltroFichas(e.target.value)} placeholder="Buscar por ficha, nombre o DNI" className="flex-1 border-2 border-gray-100 rounded-xl px-4 py-3 text-sm font-bold bg-white outline-none focus:border-indigo-500" />
            </div>
            <input type="date" value={fechaFiltroFichas} onChange={e => setFechaFiltroFichas(e.target.value)} className="w-full border-2 border-gray-100 rounded-xl px-4 py-3 text-sm font-bold bg-white outline-none focus:border-indigo-500 mb-6" />

            {fichasFiltradas.length === 0 ? <p className="text-gray-400 text-sm text-center py-4">Sin resultados</p> : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {fichasFiltradas.map(h => (
                  <div key={h.id} onClick={() => navigate(`/ficha/${h.id}`)} className="bg-white rounded-3xl border border-gray-100 p-6 cursor-pointer shadow-sm hover:shadow-md transition-all">
                    <div className="flex justify-between items-start mb-1">
                      <div>
                        <p className="font-black text-gray-800">{h.huesped_hospedaje?.[0]?.clientes?.nombres || 'Sin nombre'}</p>
                        {h.huesped_hospedaje?.[0]?.clientes?.telefono && <p className="text-xs font-bold text-gray-400">{h.huesped_hospedaje[0].clientes.telefono}</p>}
                      </div>
                      <span className="text-xs font-black text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg">N° {String(h.nro_ficha).padStart(6, '0')}</span>
                    </div>
                    <p className="text-xs font-bold text-gray-500 mt-2">Habitación {h.habitaciones?.numero} · {h.habitaciones?.tipo_actual}</p>
                    <p className="text-xs font-bold text-gray-400 mt-1">Ingreso: {new Date(h.ingreso).toLocaleDateString('es-PE')}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ===================== LIMPIEZA ===================== */}
        {vista === 'limpieza' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-fadeIn">
            {limpiezas.map(l => (
              <div key={l.id} className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
                <div className="flex justify-between items-start mb-4">
                  <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-xl border border-blue-100">🧹</div>
                  <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-md ${l.tipo === 'total' ? 'bg-yellow-100 text-yellow-800' : 'bg-orange-100 text-orange-800'}`}>{l.tipo === 'total' ? 'Total' : 'Simple'}</span>
                </div>
                <p className="font-black text-gray-800 text-xl mb-1">Hab {l.habitaciones?.numero}</p>
                <p className="text-xs font-bold text-gray-400">Inicio: {l.hora ? new Date(l.hora).toLocaleString('es-PE') : 'No registrado'}</p>
              </div>
            ))}
          </div>
        )}

        {/* ===================== BUSCAR FICHA ===================== */}
        {vista === 'ficha' && (
          <div className="animate-fadeIn max-w-2xl mx-auto">
             <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col gap-4">
               <h3 className="font-black text-gray-800">Buscar por Nro de Ficha</h3>
               <div className="flex gap-2">
                 <input type="number" value={busquedaFicha} onChange={e=>setBusquedaFicha(e.target.value)} placeholder="Ej. 004561" className="flex-1 border-2 border-gray-100 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-indigo-500" />
                 <button onClick={buscarFicha} className="bg-indigo-600 text-white font-black px-6 py-3 rounded-xl hover:bg-indigo-700">Buscar</button>
               </div>
               {resultadosFicha.map(h => (
                 <div key={h.id} onClick={()=>navigate(`/ficha/${h.id}`)} className="bg-gray-50 border border-gray-200 rounded-2xl p-4 mt-4 cursor-pointer hover:border-indigo-300">
                    <p className="font-black text-gray-800">{h.huesped_hospedaje?.[0]?.clientes?.nombres}</p>
                    <p className="text-sm font-bold text-gray-500">Ficha N° {String(h.nro_ficha).padStart(6,'0')} - Hab {h.habitaciones?.numero}</p>
                 </div>
               ))}
               {resultadosFicha.length === 0 && busquedaFicha && <p className="text-sm text-gray-400 font-bold mt-4">No se encontraron resultados.</p>}
             </div>
          </div>
        )}

      </main>
    </div>
  )
}

export default ReportesAdmin