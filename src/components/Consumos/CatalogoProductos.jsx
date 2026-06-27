export default function CatalogoProductos({ productos, agregarConsumo, guardando }) {
  if (productos.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center h-full flex flex-col justify-center">
        <p className="text-gray-500">No hay productos disponibles en el catálogo.</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 md:p-6 h-full flex flex-col">
      <div className="mb-4 flex-shrink-0">
        <h3 className="text-lg font-bold text-gray-800">Catálogo</h3>
        <p className="text-sm text-gray-500">Toca un producto para cargarlo a la cuenta</p>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2 md:gap-3 pb-2">
          {productos.map(prod => (
            <button
              key={prod.id}
              onClick={() => agregarConsumo(prod)}
              disabled={guardando || prod.stock <= 0}
              className="flex flex-col text-left border border-gray-100 rounded-2xl p-3 md:p-4 hover:border-blue-300 hover:shadow-md hover:bg-blue-50 active:scale-95 transition-all disabled:opacity-50 disabled:grayscale-[0.5] group"
            >
              <div className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm mb-2 group-hover:bg-blue-600 group-hover:text-white transition-colors flex-shrink-0">
                {prod.nombre.charAt(0).toUpperCase()}
              </div>
              <div className="text-xs md:text-sm font-bold text-gray-800 mb-1 leading-tight line-clamp-2 flex-1">
                {prod.nombre}
              </div>
              <div className="text-base md:text-lg font-black text-blue-700 mt-auto">
                S/{parseFloat(prod.precio).toFixed(2)}
              </div>
              <div className={`text-[10px] md:text-xs mt-1 font-semibold ${prod.stock <= 0 ? 'text-red-500 font-bold' : 'text-gray-400'}`}>
                {prod.stock <= 0 ? '✕ Agotado' : `Stock: ${prod.stock}`}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
