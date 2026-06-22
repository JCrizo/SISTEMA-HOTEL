import { useState, useEffect, useMemo } from 'react'

export default function CalendarioReservas({ habitaciones, ocupaciones, cargando }) {
  const [fechaBase, setFechaBase] = useState(new Date())

  // Configurar ventana de 30 días, empezando desde hace 3 días
  const diasVentana = 30
  
  const dias = useMemo(() => {
    const arr = []
    const inicio = new Date(fechaBase)
    inicio.setDate(inicio.getDate() - 3)
    inicio.setHours(0, 0, 0, 0)
    
    for (let i = 0; i < diasVentana; i++) {
      const d = new Date(inicio)
      d.setDate(d.getDate() + i)
      arr.push(d)
    }
    return arr
  }, [fechaBase])

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

  // Obtener porcentaje o columnas para CSS Grid
  // Usaremos un estilo de tabla tradicional para facilitar los colspans o absolute positioning.
  // Pero grid es mejor: grid-template-columns: 150px repeat(30, 1fr)

  if (cargando) {
    return (
      <div className="flex justify-center items-center h-64 bg-white rounded-3xl border border-gray-100">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
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
    
    // Diferencia en milisegundos a días
    const msPorDia = 24 * 60 * 60 * 1000
    
    // Offset desde el inicio de la ventana
    const diffInicio = (start - inicioVentana.getTime()) / msPorDia
    
    // Duración en días
    const diffDuracion = (end - start) / msPorDia
    
    // Devolvemos columnas (1-based index para CSS Grid)
    // Columna 1 es la de habitaciones, así que sumamos 2.
    const colStart = Math.floor(diffInicio) + 2 
    const span = Math.ceil(diffDuracion) || 1 // Mínimo 1 día de visualización

    return { colStart, span }
  }

  const obtenerColor = (ocupacion) => {
    if (ocupacion.tipo === 'hospedaje') return 'bg-emerald-500 border-emerald-600'
    if (ocupacion.estado === 'confirmada') return 'bg-indigo-500 border-indigo-600'
    return 'bg-amber-400 border-amber-500' // pendiente
  }

  return (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
      {/* Controles del calendario */}
      <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
        <div className="flex items-center gap-4">
          <button onClick={() => moverVentana(-7)} className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">
            &larr; -7 Días
          </button>
          <button onClick={() => setFechaBase(new Date())} className="px-4 py-2 bg-white border border-gray-200 rounded-lg font-bold hover:bg-gray-50">
            Hoy
          </button>
          <button onClick={() => moverVentana(7)} className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">
            +7 Días &rarr;
          </button>
        </div>
        <div className="flex items-center gap-4 text-xs font-bold text-gray-500">
          <div className="flex items-center gap-1"><span className="w-3 h-3 bg-emerald-500 rounded-sm"></span> Hospedaje</div>
          <div className="flex items-center gap-1"><span className="w-3 h-3 bg-indigo-500 rounded-sm"></span> Confirmada</div>
          <div className="flex items-center gap-1"><span className="w-3 h-3 bg-amber-400 rounded-sm"></span> Pendiente</div>
        </div>
      </div>

      {/* Grilla principal */}
      <div className="overflow-x-auto pb-4 relative">
        <div className="min-w-max">
          {/* Cabecera de días */}
          <div 
            className="grid border-b border-gray-200"
            style={{ gridTemplateColumns: `120px repeat(${diasVentana}, minmax(50px, 1fr))` }}
          >
            <div className="p-3 font-bold text-sm text-gray-500 border-r border-gray-200 bg-gray-50 sticky left-0 z-20">
              Habitación
            </div>
            {dias.map((d, i) => {
              const esHoy = d.getTime() === hoy.getTime()
              return (
                <div key={i} className={`p-2 text-center border-r border-gray-100 ${esHoy ? 'bg-blue-50' : ''}`}>
                  <div className={`text-[10px] font-bold uppercase ${esHoy ? 'text-blue-600' : 'text-gray-400'}`}>
                    {d.toLocaleString('es-PE', { weekday: 'short' })}
                  </div>
                  <div className={`text-lg font-black ${esHoy ? 'text-blue-700' : 'text-gray-700'}`}>
                    {d.getDate()}
                  </div>
                  <div className="text-[10px] text-gray-400">
                    {d.toLocaleString('es-PE', { month: 'short' })}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Filas de habitaciones */}
          <div className="relative">
            {/* Dibujar las líneas de la grilla de fondo */}
            <div className="absolute inset-0 grid pointer-events-none" style={{ gridTemplateColumns: `120px repeat(${diasVentana}, minmax(50px, 1fr))` }}>
              <div className="border-r border-gray-200 bg-white"></div>
              {dias.map((d, i) => (
                <div key={i} className={`border-r border-gray-100 ${d.getTime() === hoy.getTime() ? 'bg-blue-50/30' : ''}`}></div>
              ))}
            </div>

            {/* Contenido de cada habitación */}
            {habitaciones.map(hab => {
              const ocups = ocupacionesVisibles.filter(o => o.habitacion_id === hab.id)
              
              return (
                <div 
                  key={hab.id} 
                  className="grid border-b border-gray-100 hover:bg-gray-50/50 transition-colors relative z-10"
                  style={{ gridTemplateColumns: `120px repeat(${diasVentana}, minmax(50px, 1fr))` }}
                >
                  <div className="p-3 border-r border-gray-200 bg-white sticky left-0 z-20 flex flex-col justify-center">
                    <span className="font-black text-lg text-gray-800">{hab.numero}</span>
                    <span className="text-[10px] font-bold text-gray-400 uppercase truncate">{hab.tipo_actual}</span>
                  </div>

                  {/* Celdas vacías para mantener el layout del grid */}
                  {dias.map((_, i) => <div key={i} className="h-14"></div>)}

                  {/* Barras de ocupación superpuestas */}
                  {ocups.map(oc => {
                    const { colStart, span } = calcularPosicionYAncho(oc)
                    const title = `${oc.nombre} (${oc.tipo})`
                    
                    return (
                      <div 
                        key={oc.id}
                        className={`absolute top-2 bottom-2 rounded-lg border text-white text-xs font-bold px-2 py-1 flex items-center shadow-sm overflow-hidden cursor-pointer hover:opacity-90 transition-opacity ${obtenerColor(oc)}`}
                        style={{ 
                          gridColumn: `${colStart} / span ${span}`,
                          zIndex: 10
                        }}
                        title={title}
                      >
                        <span className="truncate">{oc.nombre}</span>
                      </div>
                    )
                  })}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
