// Marcador de carga con la forma de una pantalla (reemplaza el texto "Cargando...").
export default function EsqueletoPagina({ filas = 4 }) {
  return (
    <div className="max-w-6xl mx-auto p-4 animate-pulse" aria-busy="true" aria-label="Cargando">
      <div className="h-7 w-48 bg-gray-200 rounded-lg mb-2"></div>
      <div className="h-4 w-72 max-w-full bg-gray-100 rounded-lg mb-6"></div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-20 bg-gray-100 rounded-2xl"></div>)}
      </div>
      <div className="space-y-3">
        {Array.from({ length: filas }).map((_, i) => <div key={i} className="h-16 bg-gray-100 rounded-2xl"></div>)}
      </div>
    </div>
  )
}
