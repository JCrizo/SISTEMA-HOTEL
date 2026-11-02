import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import Icono from '../Compartido/Icono'

export default function CalendarioReservas({ habitaciones, ocupaciones, cargando, onCambiarHabitacion }) {
  const navigate = useNavigate()
  const [fechaBase, setFechaBase] = useState(new Date())
  const [diasVentana, setDiasVentana] = useState(14) // 7, 14 o 30 días
  const [reservaSeleccionada, setReservaSeleccionada] = useState(null)

  const dias = useMemo(() => {
    const arr = []
    const inicio = new Date(fechaBase)
    // Empezar 2 días antes de la fecha base para tener contexto inmediato
    inicio.setDate(inicio.getDate() - 2)
    inicio.setHours(0, 0, 0, 0)
    
    for (let i = 0; i < diasVentana; i++) {
      const d = new Date(inicio)
      d.setDate(d.getDate() + i)
      arr.push(d)
    }
    return arr
  }, [fechaBase, diasVentana])

  const inicioVentana = dias[0]
  const finVentana = new Date(dias[diasVentana - 1])
  finVentana.setHours(23, 59, 59, 999)

  const moverVentana = (diasAvanzar) => {
    const nueva = new Date(fechaBase)
    nueva.setDate(nueva.getDate() + diasAvanzar)
    setFechaBase(nueva)
  }

  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)

  // Nombre del mes y año que abarca la ventana actual
  const tituloPeriodo = useMemo(() => {
    if (!inicioVentana || !finVentana) return ''
    const mesInicio = inicioVentana.toLocaleString('es-PE', { month: 'long' })
    const mesFin = finVentana.toLocaleString('es-PE', { month: 'long' })
    const anio = finVentana.getFullYear()

    if (mesInicio === mesFin) {
      return `${mesInicio.charAt(0).toUpperCase() + mesInicio.slice(1)} ${anio}`
    }
    return `${mesInicio.charAt(0).toUpperCase() + mesInicio.slice(1)} - ${mesFin.charAt(0).toUpperCase() + mesFin.slice(1)} ${anio}`
  }, [inicioVentana, finVentana])

  if (cargando) {
    return (
      <div className="flex flex-col justify-center items-center h-80 gap-3 bg-white rounded-2xl border border-gray-100 shadow-2xs">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="text-xs font-semibold text-gray-400">Cargando matriz de ocupación...</span>
      </div>
    )
  }

  // Filtrar ocupaciones relevantes a la ventana
  const ocupacionesVisibles = ocupaciones.filter(oc => {
    return oc.fin >= inicioVentana && oc.inicio <= finVentana
  })

  // Función para determinar el span de una ocupación en la ventana actual
  const calcularPosicionYAncho = (ocupacion) => {
    const start = Math.max(ocupacion.inicio.getTime(), inicioVentana.getTime())
    const end = Math.min(ocupacion.fin.getTime(), finVentana.getTime())
    
    const msPorDia = 24 * 60 * 60 * 1000
    const diffInicio = (start - inicioVentana.getTime()) / msPorDia
    const diffDuracion = (end - start) / msPorDia
    
    // Columna 1 es la de habitaciones, así que sumamos 2.
    const colStart = Math.floor(diffInicio) + 2 
    const span = Math.max(Math.ceil(diffDuracion), 1)

    return { colStart, span }
  }

  const obtenerColorBarra = (ocupacion) => {
    if (ocupacion.tipo === 'hospedaje') {
      return 'bg-emerald-50 border-emerald-200 text-emerald-800'
    }
    if (ocupacion.estado === 'confirmada') {
      return 'bg-blue-50 border-blue-200 text-blue-800'
    }
    return 'bg-amber-50 border-amber-200 text-amber-800' // pendiente
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-2xs overflow-hidden flex flex-col">
      {/* Barra de Controles y Filtros del Calendario */}
      <div className="p-3.5 sm:p-4 border-b border-gray-100 bg-gray-50/50 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3">
        {/* Navegación de Fechas */}
        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
          <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-gray-200 shadow-2xs">
            <button 
              onClick={() => moverVentana(-diasVentana)} 
              className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-600 transition-colors"
              title="Período anterior"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button 
              onClick={() => setFechaBase(new Date())} 
              className="px-3 py-1 text-xs font-bold text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Hoy
            </button>
            <button 
              onClick={() => moverVentana(diasVentana)} 
              className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-600 transition-colors"
              title="Período siguiente"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          <span className="text-xs font-black text-gray-700 bg-white px-3 py-1.5 rounded-xl border border-gray-200 shadow-2xs">
            <Icono name="calendar" className="w-4 h-4 inline-block shrink-0" /> {tituloPeriodo}
          </span>
        </div>

        {/* Selector de Rango (7, 14, 30 días) y Leyenda */}
        <div className="flex flex-wrap items-center justify-between gap-3 w-full lg:w-auto">
          {/* Selector de Días */}
          <div className="flex items-center bg-gray-200/80 p-0.5 rounded-xl text-xs font-bold shadow-inner">
            {[7, 14, 30].map(n => (
              <button
                key={n}
                onClick={() => setDiasVentana(n)}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  diasVentana === n ? 'bg-white text-blue-600 shadow-2xs' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {n}D
              </button>
            ))}
          </div>

          {/* Leyenda Visual */}
          <div className="flex items-center gap-2.5 text-[11px] font-bold text-gray-500">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full"></span> Hospedaje
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 bg-blue-600 rounded-full"></span> Confirmada
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 bg-amber-400 rounded-full"></span> Pendiente
            </span>
          </div>
        </div>
      </div>

      {/* Grilla Matriz Gantt */}
      <div className="overflow-x-auto pb-4 relative scrollbar-thin">
        <div className="min-w-max">
          {/* Cabecera de días */}
          <div 
            className="grid border-b border-gray-200 bg-white"
            style={{ gridTemplateColumns: `140px repeat(${diasVentana}, minmax(52px, 1fr))` }}
          >
            {/* Columna fija de Habitaciones */}
            <div className="p-3 font-black text-xs text-gray-400 uppercase tracking-wider border-r border-gray-200 bg-gray-50/90 backdrop-blur-xs sticky left-0 z-30 flex items-center">
              Habitación
            </div>

            {/* Días de la ventana */}
            {dias.map((d, i) => {
              const esHoy = d.getTime() === hoy.getTime()
              const diaSemanaNum = d.getDay()
              const esFinDeSemana = diaSemanaNum === 0 || diaSemanaNum === 6

              return (
                <div 
                  key={i} 
                  className={`p-2 text-center border-r border-gray-100 transition-colors ${
                    esHoy 
                      ? 'bg-blue-50/90 text-blue-800 font-bold' 
                      : esFinDeSemana 
                        ? 'bg-gray-50/60' 
                        : ''
                  }`}
                >
                  <div className={`text-[10px] font-black uppercase tracking-wider ${esHoy ? 'text-blue-600' : 'text-gray-400'}`}>
                    {d.toLocaleString('es-PE', { weekday: 'short' })}
                  </div>
                  <div className={`text-base font-black my-0.5 ${esHoy ? 'text-blue-700' : 'text-gray-800'}`}>
                    {d.getDate()}
                  </div>
                  <div className="text-[9px] font-semibold text-gray-400 uppercase">
                    {d.toLocaleString('es-PE', { month: 'short' })}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Filas de habitaciones */}
          <div className="relative">
            {/* Líneas de fondo de la grilla */}
            <div 
              className="absolute inset-0 grid pointer-events-none" 
              style={{ gridTemplateColumns: `140px repeat(${diasVentana}, minmax(52px, 1fr))` }}
            >
              <div className="border-r border-gray-200 bg-white"></div>
              {dias.map((d, i) => {
                const esHoy = d.getTime() === hoy.getTime()
                const esFinDeSemana = d.getDay() === 0 || d.getDay() === 6
                return (
                  <div 
                    key={i} 
                    className={`border-r border-gray-100 ${
                      esHoy ? 'bg-blue-50/25' : esFinDeSemana ? 'bg-gray-50/40' : ''
                    }`}
                  />
                )
              })}
            </div>

            {/* Contenido de cada habitación */}
            {habitaciones.map(hab => {
              const ocups = ocupacionesVisibles.filter(o => o.habitacion_id === hab.id)
              const piso = hab.numero?.charAt(0) || '1'
              
              return (
                <div 
                  key={hab.id} 
                  className="grid border-b border-gray-100 hover:bg-gray-50/40 transition-colors relative z-10"
                  style={{ gridTemplateColumns: `140px repeat(${diasVentana}, minmax(52px, 1fr))` }}
                >
                  {/* Celda Fija Izquierda */}
                  <div className="p-3 border-r border-gray-200 bg-white/95 backdrop-blur-xs sticky left-0 z-20 flex items-center justify-between">
                    <div>
                      <span className="font-black text-base text-gray-800 block leading-tight">{hab.numero}</span>
                      <span className="text-[10px] font-bold text-gray-400 uppercase truncate max-w-[85px] block">{hab.tipo_actual}</span>
                    </div>
                    <span className="text-[9px] font-bold text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded border border-gray-100">
                      P{piso}
                    </span>
                  </div>

                  {/* Celdas invisibles que marcan la altura */}
                  {dias.map((_, i) => <div key={i} className="h-14"></div>)}

                  {/* Barras de ocupación / Reserva */}
                  {ocups.map(oc => {
                    const { colStart, span } = calcularPosicionYAncho(oc)
                    
                    return (
                      <div 
                        key={oc.id}
                        onClick={() => setReservaSeleccionada(oc)}
                        className={`absolute top-2 bottom-2 rounded-xl border text-xs font-bold px-2.5 py-1 flex items-center shadow-2xs overflow-hidden cursor-pointer hover:scale-[1.01] hover:brightness-105 transition-all z-10 ${obtenerColorBarra(oc)}`}
                        style={{ 
                          gridColumn: `${colStart} / span ${span}`
                        }}
                        title={`${oc.nombre} (${oc.tipo}) - Click para ver detalles`}
                      >
                        <div className="flex items-center gap-1.5 truncate">
                          <span className="shrink-0"><Icono name={oc.tipo === 'hospedaje' ? 'user' : 'calendar'} className="w-3 h-3" /></span>
                          <span className="truncate font-bold">{oc.nombre}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* MODAL DE DETALLES RÁPIDOS AL CLICKEAR UNA RESERVA/HOSPEDAJE EN EL CALENDARIO */}
      {reservaSeleccionada && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-sm border border-gray-100 animate-scale-up">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
              <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                reservaSeleccionada.tipo === 'hospedaje'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-blue-50 text-blue-700 border border-blue-200'
              }`}>
                {reservaSeleccionada.tipo === 'hospedaje' ? 'Hospedaje Activo' : 'Reserva'}
              </span>
              <button 
                onClick={() => setReservaSeleccionada(null)}
                className="text-gray-400 hover:text-gray-600 font-bold p-1"
              >
                <Icono name="x" className="w-4 h-4 inline-block shrink-0" />
              </button>
            </div>

            <div className="space-y-3 mb-5">
              <div>
                <p className="text-xs text-gray-400 font-bold uppercase">Huésped</p>
                <p className="text-base font-black text-gray-800">{reservaSeleccionada.nombre}</p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-gray-50 p-2.5 rounded-xl">
                  <p className="text-gray-400 font-bold uppercase text-[10px]">Ingreso</p>
                  <p className="font-bold text-gray-700">
                    {reservaSeleccionada.inicio?.toLocaleDateString('es-PE', { day: '2-digit', month: 'short' })}
                  </p>
                </div>
                <div className="bg-gray-50 p-2.5 rounded-xl">
                  <p className="text-gray-400 font-bold uppercase text-[10px]">Salida</p>
                  <p className="font-bold text-gray-700">
                    {reservaSeleccionada.fin?.toLocaleDateString('es-PE', { day: '2-digit', month: 'short' })}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setReservaSeleccionada(null)}
                className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-xs transition-colors"
              >
                Cerrar
              </button>
              {reservaSeleccionada.tipo !== 'hospedaje' && onCambiarHabitacion && reservaSeleccionada.raw && (
                <button
                  onClick={() => {
                    const hab = habitaciones.find(h => h.id === reservaSeleccionada.habitacion_id)
                    onCambiarHabitacion({ ...reservaSeleccionada.raw, habitaciones: { numero: hab?.numero } })
                    setReservaSeleccionada(null)
                  }}
                  className="flex-1 py-2.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-bold rounded-xl text-xs transition-colors"
                >
                  Cambiar hab.
                </button>
              )}
              {reservaSeleccionada.tipo !== 'hospedaje' && (
                <button
                  onClick={() => {
                    const habId = reservaSeleccionada.habitacion_id
                    const resId = reservaSeleccionada.id
                    setReservaSeleccionada(null)
                    navigate(`/checkin/${habId}?reserva=${resId}`)
                  }}
                  className="flex-[2] py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-xs transition-all active:scale-95"
                >
                  Hacer Check-In
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
