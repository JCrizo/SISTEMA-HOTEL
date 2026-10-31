import { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useTurnoActivo } from '../hooks/useTurnoActivo'
import ControlDiario from '../components/Habitaciones/ControlDiario'

export default function Habitaciones() {
  const [habitaciones, setHabitaciones] = useState([])
  const [cargando, setCargando] = useState(true)
  const [vista, setVista] = useState('tarjetas') // 'tarjetas' o 'tabla'
  
  // Filtros y búsqueda
  const [filtroEstado, setFiltroEstado] = useState('todas') // 'todas', 'disponible', 'ocupada', 'limpieza', 'reserva'
  const [filtroPiso, setFiltroPiso] = useState('todos') // 'todos', '1', '2', '3', '4'
  const [busqueda, setBusqueda] = useState('')

  const navigate = useNavigate()
  const { usuario } = useAuth()
  const { turnoAjeno, turnoActivo } = useTurnoActivo()

  useEffect(() => {
    async function cargar() {
      const { data, error } = await supabase
        .from('habitaciones')
        .select('*')
        .order('numero')

      if (error) console.error(error)
      else {
        // Cargar reservas próximas (próximas 48 horas)
        const en48h = new Date()
        en48h.setHours(en48h.getHours() + 48)

        const { data: reservasData } = await supabase
          .from('reservas')
          .select('habitacion_id, fecha_llegada')
          .in('estado', ['pendiente', 'confirmada'])
          .lte('fecha_llegada', en48h.toISOString())

        const habsConReserva = new Set(reservasData?.map(r => r.habitacion_id) || [])

        // Cargar huéspedes activos
        const { data: hospedajesActivos } = await supabase
          .from('hospedajes')
          .select('habitacion_id, ingreso, salida_estimada, nro_ficha, tarifa_pactada, estado_pago, metodo_pago, huesped_hospedaje(clientes(nombres))')
          .eq('estado', 'activo')

        const mapHospedajes = {}
        hospedajesActivos?.forEach(h => {
          const nombreHuesped = h.huesped_hospedaje?.[0]?.clientes?.nombres;
          
          mapHospedajes[h.habitacion_id] = {
            nombre: nombreHuesped,
            salida_estimada: h.salida_estimada,
            ingreso: h.ingreso,
            nro_ficha: h.nro_ficha,
            tarifa_pactada: h.tarifa_pactada,
            estado_pago: h.estado_pago,
            metodo_pago: h.metodo_pago
          }
        })

        setHabitaciones(data.map(h => ({
          ...h,
          tieneReservaProxima: habsConReserva.has(h.id),
          huespedActivo: mapHospedajes[h.id]?.nombre || null,
          checkoutVencido: mapHospedajes[h.id]?.salida_estimada
            ? new Date(mapHospedajes[h.id].salida_estimada) < new Date()
            : false,
          datosHospedaje: mapHospedajes[h.id] || null
        })))
      }
      setCargando(false)
    }

    cargar()

    const canal = supabase
      .channel('habitaciones_cambios')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'habitaciones'
      }, () => cargar())
      .subscribe()

    return () => supabase.removeChannel(canal)
  }, [])

  // Métricas rápidas (KPIs)
  const metricas = useMemo(() => {
    const total = habitaciones.length
    const ocupadas = habitaciones.filter(h => h.estado === 'ocupada').length
    const disponibles = habitaciones.filter(h => h.estado === 'disponible' && !h.tieneReservaProxima).length
    const limpieza = habitaciones.filter(h => ['pendiente_limpieza', 'en_limpieza', 'limpieza_simple'].includes(h.estado)).length
    const conReserva = habitaciones.filter(h => h.tieneReservaProxima || h.estado === 'disponible_reserva').length
    const porcentajeOcupacion = total > 0 ? Math.round((ocupadas / total) * 100) : 0

    return { total, ocupadas, disponibles, limpieza, conReserva, porcentajeOcupacion }
  }, [habitaciones])

  // Filtrado reactivo de habitaciones
  const habitacionesFiltradas = useMemo(() => {
    return habitaciones.filter(h => {
      // 1. Filtro por piso (primer dígito del número de habitación)
      const piso = h.numero?.charAt(0) || '1'
      if (filtroPiso !== 'todos' && piso !== filtroPiso) return false

      // 2. Filtro por estado
      if (filtroEstado === 'disponible') {
        if (h.estado !== 'disponible' || h.tieneReservaProxima) return false
      } else if (filtroEstado === 'ocupada') {
        if (h.estado !== 'ocupada') return false
      } else if (filtroEstado === 'limpieza') {
        if (!['pendiente_limpieza', 'en_limpieza', 'limpieza_simple'].includes(h.estado)) return false
      } else if (filtroEstado === 'reserva') {
        if (!h.tieneReservaProxima && h.estado !== 'disponible_reserva') return false
      }

      // 3. Filtro por búsqueda
      if (busqueda.trim()) {
        const q = busqueda.toLowerCase().trim()
        const coincideNumero = h.numero?.toLowerCase().includes(q)
        const coincideHuesped = h.huespedActivo?.toLowerCase().includes(q)
        const coincideTipo = h.tipo_actual?.toLowerCase().includes(q)
        if (!coincideNumero && !coincideHuesped && !coincideTipo) return false
      }

      return true
    })
  }, [habitaciones, filtroPiso, filtroEstado, busqueda])

  // Lista de pisos disponibles dinámicamente
  const listaPisos = useMemo(() => {
    const pisosSet = new Set(habitaciones.map(h => h.numero?.charAt(0)).filter(Boolean))
    return Array.from(pisosSet).sort()
  }, [habitaciones])

  if (cargando) {
    return (
      <div className="flex flex-col justify-center items-center h-80 gap-3">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
        <p className="text-sm font-semibold text-gray-400">Cargando estado de habitaciones...</p>
      </div>
    )
  }

  return (
    <div className="pb-12 space-y-6">
      {/* Alerta de Turno Ajeno si existe */}
      {turnoAjeno && (
        <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm animate-pulse">
          <div className="flex items-center gap-3">
            <span className="text-3xl">⚠️</span>
            <div>
              <h3 className="text-red-800 font-black text-lg">Turno Abierto por Otro Usuario</h3>
              <p className="text-sm font-medium text-red-700">No podrás realizar operaciones hasta que entregues o cierres el turno en la caja.</p>
            </div>
          </div>
          <button 
            onClick={() => navigate('/turnos')}
            className="px-6 py-2 bg-red-600 text-white rounded-xl font-bold shadow-md hover:bg-red-700 transition-colors whitespace-nowrap"
          >
            Ir a Caja a Cerrar
          </button>
        </div>
      )}

      {/* BLOQUE DE KPIs / RESUMEN EJECUTIVO TIPO PMS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        {/* KPI 1: Ocupación */}
        <div 
          onClick={() => setFiltroEstado(filtroEstado === 'ocupada' ? 'todas' : 'ocupada')}
          className={`bg-white rounded-2xl p-4 border transition-all cursor-pointer shadow-2xs hover:shadow-sm ${
            filtroEstado === 'ocupada' ? 'border-blue-500 ring-2 ring-blue-100' : 'border-gray-100 hover:border-gray-200'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">Ocupación</span>
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-gray-800">{metricas.porcentajeOcupacion}%</span>
            <span className="text-xs font-semibold text-gray-500">({metricas.ocupadas}/{metricas.total})</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-1.5 mt-2.5 overflow-hidden">
            <div 
              className="bg-blue-600 h-1.5 rounded-full transition-all duration-500" 
              style={{ width: `${metricas.porcentajeOcupacion}%` }}
            />
          </div>
        </div>

        {/* KPI 2: Disponibles */}
        <div 
          onClick={() => setFiltroEstado(filtroEstado === 'disponible' ? 'todas' : 'disponible')}
          className={`bg-white rounded-2xl p-4 border transition-all cursor-pointer shadow-2xs hover:shadow-sm ${
            filtroEstado === 'disponible' ? 'border-emerald-500 ring-2 ring-emerald-100' : 'border-gray-100 hover:border-gray-200'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">Disponibles</span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-black text-emerald-600">{metricas.disponibles}</span>
            <span className="text-xs font-semibold text-gray-400">habs libres</span>
          </div>
          <p className="text-[11px] text-gray-400 mt-2 truncate">Listas para Check-In</p>
        </div>

        {/* KPI 3: Limpieza */}
        <div 
          onClick={() => setFiltroEstado(filtroEstado === 'limpieza' ? 'todas' : 'limpieza')}
          className={`bg-white rounded-2xl p-4 border transition-all cursor-pointer shadow-2xs hover:shadow-sm ${
            filtroEstado === 'limpieza' ? 'border-amber-500 ring-2 ring-amber-100' : 'border-gray-100 hover:border-gray-200'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">Limpieza</span>
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-black text-amber-600">{metricas.limpieza}</span>
            <span className="text-xs font-semibold text-gray-400">por habilitar</span>
          </div>
          <p className="text-[11px] text-gray-400 mt-2 truncate">Atención de mucama</p>
        </div>

        {/* KPI 4: Reservas Próximas */}
        <div 
          onClick={() => setFiltroEstado(filtroEstado === 'reserva' ? 'todas' : 'reserva')}
          className={`bg-white rounded-2xl p-4 border transition-all cursor-pointer shadow-2xs hover:shadow-sm ${
            filtroEstado === 'reserva' ? 'border-purple-500 ring-2 ring-purple-100' : 'border-gray-100 hover:border-gray-200'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">Reservadas</span>
            <span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-black text-purple-600">{metricas.conReserva}</span>
            <span className="text-xs font-semibold text-gray-400">programadas</span>
          </div>
          <p className="text-[11px] text-gray-400 mt-2 truncate">Llegadas próximas 48h</p>
        </div>
      </div>

      {/* BARRA DE HERRAMIENTAS: Búsqueda, Filtros de Estado/Piso y Switcher de Vista */}
      <div className="bg-white rounded-2xl border border-gray-100 p-3 sm:p-4 shadow-2xs space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Input de Búsqueda */}
          <div className="relative flex-1 max-w-md">
            <svg className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              placeholder="Buscar por N° habitación, huésped o tipo..."
              className="w-full bg-gray-50/80 border border-gray-200/80 rounded-xl pl-9 pr-8 py-2 text-xs sm:text-sm font-medium outline-none focus:border-blue-500 focus:bg-white transition-all"
            />
            {busqueda && (
              <button 
                onClick={() => setBusqueda('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs font-bold"
              >
                ✕
              </button>
            )}
          </div>

          {/* Selector de Vista (Tarjetas vs Control Diario) */}
          <div className="flex items-center gap-2 justify-between sm:justify-end">
            <div className="bg-gray-100 p-1 rounded-xl flex items-center shadow-inner">
              <button
                onClick={() => setVista('tarjetas')}
                className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                  vista === 'tarjetas' ? 'bg-white text-blue-600 shadow-2xs' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
                <span>Tarjetas</span>
              </button>
              <button
                onClick={() => setVista('tabla')}
                className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                  vista === 'tabla' ? 'bg-white text-blue-600 shadow-2xs' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <span>Control Diario</span>
              </button>
            </div>

            <span className="text-xs font-bold text-gray-500 bg-gray-50 px-2.5 py-1.5 rounded-lg border border-gray-100">
              {habitacionesFiltradas.length} habs
            </span>
          </div>
        </div>

        {/* Fila de Filtros: Estados y Pisos */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-gray-50">
          {/* Filtros de Estado */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none w-full sm:w-auto">
            <button
              onClick={() => setFiltroEstado('todas')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors whitespace-nowrap ${
                filtroEstado === 'todas' 
                  ? 'bg-gray-900 text-white' 
                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
              }`}
            >
              Todas ({metricas.total})
            </button>
            <button
              onClick={() => setFiltroEstado('disponible')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                filtroEstado === 'disponible' 
                  ? 'bg-emerald-600 text-white shadow-2xs' 
                  : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100/70 border border-emerald-100'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${filtroEstado === 'disponible' ? 'bg-white' : 'bg-emerald-500'}`}></span>
              Libres ({metricas.disponibles})
            </button>
            <button
              onClick={() => setFiltroEstado('ocupada')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                filtroEstado === 'ocupada' 
                  ? 'bg-blue-600 text-white shadow-2xs' 
                  : 'bg-blue-50 text-blue-700 hover:bg-blue-100/70 border border-blue-100'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${filtroEstado === 'ocupada' ? 'bg-white' : 'bg-blue-500'}`}></span>
              Ocupadas ({metricas.ocupadas})
            </button>
            <button
              onClick={() => setFiltroEstado('limpieza')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                filtroEstado === 'limpieza' 
                  ? 'bg-amber-600 text-white shadow-2xs' 
                  : 'bg-amber-50 text-amber-700 hover:bg-amber-100/70 border border-amber-100'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${filtroEstado === 'limpieza' ? 'bg-white' : 'bg-amber-500'}`}></span>
              Limpieza ({metricas.limpieza})
            </button>
            <button
              onClick={() => setFiltroEstado('reserva')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                filtroEstado === 'reserva' 
                  ? 'bg-purple-600 text-white shadow-2xs' 
                  : 'bg-purple-50 text-purple-700 hover:bg-purple-100/70 border border-purple-100'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${filtroEstado === 'reserva' ? 'bg-white' : 'bg-purple-500'}`}></span>
              Reservadas ({metricas.conReserva})
            </button>
          </div>

          {/* Filtro por Piso */}
          <div className="flex items-center gap-1 text-xs font-semibold text-gray-500 ml-auto">
            <span className="hidden md:inline mr-1 text-[11px] text-gray-400 uppercase font-bold">Piso:</span>
            <button
              onClick={() => setFiltroPiso('todos')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-colors ${
                filtroPiso === 'todos' ? 'bg-gray-800 text-white' : 'bg-gray-50 hover:bg-gray-100 text-gray-600'
              }`}
            >
              Todos
            </button>
            {listaPisos.map(p => (
              <button
                key={p}
                onClick={() => setFiltroPiso(p)}
                className={`px-2.5 py-1 rounded-lg font-bold transition-colors ${
                  filtroPiso === p ? 'bg-blue-600 text-white' : 'bg-gray-50 hover:bg-gray-100 text-gray-600'
                }`}
              >
                P{p}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* RACK DE HABITACIONES O TABLA */}
      {vista === 'tabla' ? (
        <ControlDiario 
          habitaciones={habitaciones} 
          turnoActivo={turnoAjeno ? null : (usuario && turnoActivo ? { ...turnoActivo, usuario_nombre: usuario.nombre } : null)} 
        />
      ) : (
        <>
          {habitacionesFiltradas.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center shadow-2xs">
              <span className="text-3xl block mb-2">🔍</span>
              <p className="text-sm font-bold text-gray-700">No se encontraron habitaciones con los filtros seleccionados</p>
              <button
                onClick={() => { setFiltroEstado('todas'); setFiltroPiso('todos'); setBusqueda(''); }}
                className="mt-3 px-4 py-1.5 bg-blue-50 text-blue-700 text-xs font-bold rounded-lg hover:bg-blue-100 transition-colors"
              >
                Limpiar filtros
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
              {habitacionesFiltradas.map(hab => {
                const tieneReserva = hab.tieneReservaProxima && hab.estado === 'disponible'
                const piso = hab.numero?.charAt(0) || '1'
                
                // Configuración de estilo según estado
                let cardBorders = 'border-gray-200 hover:border-gray-300 bg-white'
                let badgeColor = 'bg-gray-100 text-gray-600'
                let dotColor = 'bg-gray-400'
                let estadoTexto = 'Disponible'

                if (hab.estado === 'ocupada') {
                  cardBorders = 'border-blue-200/90 hover:border-blue-400 bg-gradient-to-b from-blue-50/25 to-white'
                  badgeColor = 'bg-blue-50 text-blue-700 border border-blue-100'
                  dotColor = 'bg-blue-600'
                  estadoTexto = 'Ocupada'
                } else if (tieneReserva) {
                  cardBorders = 'border-purple-200 hover:border-purple-400 bg-purple-50/20'
                  badgeColor = 'bg-purple-50 text-purple-700 border border-purple-100'
                  dotColor = 'bg-purple-600'
                  estadoTexto = 'Con Reserva'
                } else if (hab.estado === 'disponible') {
                  cardBorders = 'border-emerald-200/80 hover:border-emerald-400 bg-white'
                  badgeColor = 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                  dotColor = 'bg-emerald-500'
                  estadoTexto = 'Disponible'
                } else if (['pendiente_limpieza', 'en_limpieza', 'limpieza_simple'].includes(hab.estado)) {
                  cardBorders = 'border-amber-200 hover:border-amber-400 bg-amber-50/20'
                  badgeColor = 'bg-amber-50 text-amber-700 border border-amber-100'
                  dotColor = 'bg-amber-500'
                  estadoTexto = hab.estado === 'en_limpieza' ? 'En Limpieza' : 'Por Limpiar'
                } else if (hab.estado === 'mantenimiento') {
                  cardBorders = 'border-gray-200 bg-gray-50/60 opacity-80'
                  badgeColor = 'bg-gray-100 text-gray-600'
                  dotColor = 'bg-gray-400'
                  estadoTexto = 'Mantenimiento'
                }

                // Hora estimada de salida si está ocupada
                const salidaEstimada = hab.datosHospedaje?.salida_estimada 
                  ? new Date(hab.datosHospedaje.salida_estimada).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })
                  : null

                const estadoPago = hab.datosHospedaje?.estado_pago

                return (
                  <div
                    key={hab.id}
                    onClick={() => navigate(`/habitacion/${hab.id}`)}
                    className={`group relative rounded-2xl border-2 p-3 sm:p-4 cursor-pointer shadow-2xs transition-all duration-200 hover:-translate-y-1 hover:shadow-md active:scale-[0.98] flex flex-col justify-between min-h-[145px] sm:min-h-[160px] ${cardBorders}`}
                  >
                    {/* Floating Badges */}
                    {hab.checkoutVencido && (
                      <div className="absolute -top-2.5 -left-1.5 bg-red-600 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full shadow-xs animate-pulse z-10 flex items-center gap-1">
                        <span>⚠️</span> Checkout vencido
                      </div>
                    )}
                    {tieneReserva && (
                      <div className="absolute -top-2.5 -right-1.5 bg-purple-600 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full shadow-xs z-10">
                        📅 Reserva
                      </div>
                    )}

                    {/* Fila Superior: N° Habitación y Badge Estado */}
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <span className="text-2xl sm:text-3xl font-black text-gray-800 tracking-tight leading-none">
                            {hab.numero}
                          </span>
                          <span className="block text-[11px] font-bold text-gray-400 uppercase tracking-wide mt-0.5">
                            {hab.tipo_actual}
                          </span>
                        </div>

                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${badgeColor}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`}></span>
                          <span className="truncate max-w-[70px] sm:max-w-none">{estadoTexto}</span>
                        </span>
                      </div>

                      {/* Contenido Central Dinámico */}
                      {hab.estado === 'ocupada' && hab.huespedActivo ? (
                        <div className="my-2 bg-white/80 p-2 rounded-xl border border-gray-100 shadow-2xs">
                          <div className="flex items-center gap-1.5 mb-1">
                            <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[10px] font-bold shrink-0">
                              👤
                            </div>
                            <span className="text-xs font-bold text-gray-800 truncate" title={hab.huespedActivo}>
                              {hab.huespedActivo}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-[10px] text-gray-500 font-medium">
                            <span>Salida: {salidaEstimada || 'Hoy'}</span>
                            {estadoPago === 'pendiente' ? (
                              <span className="font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded">Debe</span>
                            ) : estadoPago === 'parcial' ? (
                              <span className="font-bold text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded">A cuenta</span>
                            ) : (
                              <span className="font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">Pagado</span>
                            )}
                          </div>
                        </div>
                      ) : ['pendiente_limpieza', 'en_limpieza', 'limpieza_simple'].includes(hab.estado) ? (
                        <div className="my-2 p-2 rounded-xl bg-amber-50/50 border border-amber-100/50">
                          <p className="text-xs font-bold text-amber-800 flex items-center gap-1">
                            <span>🧹</span> {hab.estado === 'en_limpieza' ? 'En aseo activo' : 'Esperando mucama'}
                          </p>
                        </div>
                      ) : (
                        <div className="my-2">
                          <span className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1">
                            <span>✓</span> Lista para Check-in
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Fila Inferior: Precio y Piso */}
                    <div className="flex items-center justify-between pt-2 border-t border-gray-100/80 text-xs mt-1">
                      <span className="font-black text-gray-700 text-sm">
                        S/{hab.precio_actual}
                      </span>
                      <span className="text-[10px] font-bold text-gray-400 bg-gray-50 px-2 py-0.5 rounded-md border border-gray-100">
                        Piso {piso}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}
    </div>
  )
}
