import { useState, useMemo } from 'react'

export default function CatalogoProductos({ productos, agregarConsumo, guardando }) {
  const [busqueda, setBusqueda] = useState('')
  const [categoriaActiva, setCategoriaActiva] = useState('todas')
  const [prodSel, setProdSel] = useState(null)
  const [cantidad, setCantidad] = useState(1)

  const categorias = useMemo(() => {
    const cats = new Set()
    productos.forEach(p => {
      if (p.categorias_producto?.nombre) cats.add(p.categorias_producto.nombre)
    })
    return ['todas', ...Array.from(cats)]
  }, [productos])

  const filtrados = useMemo(() => {
    return productos.filter(p => {
      const matchBusqueda = p.nombre.toLowerCase().includes(busqueda.toLowerCase())
      const matchCat = categoriaActiva === 'todas' || p.categorias_producto?.nombre === categoriaActiva
      return matchBusqueda && matchCat
    })
  }, [productos, busqueda, categoriaActiva])

  const handleSeleccionar = (prod) => {
    if (prod.stock <= 0 || guardando) return
    if (prodSel === prod.id) {
      setProdSel(null)
    } else {
      setProdSel(prod.id)
      setCantidad(1)
    }
  }

  const handleAgregar = async (prod, e) => {
    e.stopPropagation()
    const cant = parseInt(cantidad) || 1
    if (cant < 1 || cant > prod.stock) return
    await agregarConsumo(prod, cant)
    setProdSel(null)
  }

  const handleCantidadChange = (e) => {
    const val = e.target.value
    if (val === '') {
      setCantidad('')
    } else {
      setCantidad(parseInt(val) || 1)
    }
  }

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
        <h3 className="text-lg font-bold text-gray-800 mb-3">Catálogo</h3>
        
        <div className="space-y-3">
          <input
            type="text"
            placeholder="🔍 Buscar producto..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full border-2 border-gray-100 rounded-xl px-4 py-2 text-sm outline-none focus:border-blue-500 transition-colors bg-gray-50 focus:bg-white"
          />
          
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {categorias.map(cat => (
              <button
                key={cat}
                onClick={() => setCategoriaActiva(cat)}
                className={`whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-bold transition-colors ${
                  categoriaActiva === cat
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {cat === 'todas' ? 'Todos' : cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2 md:gap-3 pb-2">
          {filtrados.map(prod => {
            const isSel = prodSel === prod.id
            return (
              <div
                key={prod.id}
                onClick={() => handleSeleccionar(prod)}
                className={`relative flex flex-col text-left border rounded-2xl p-3 md:p-4 transition-all cursor-pointer select-none
                  ${isSel ? 'border-blue-500 ring-2 ring-blue-100 bg-blue-50/50' : 'border-gray-100 hover:border-blue-300 hover:bg-blue-50'}
                  ${prod.stock <= 0 ? 'opacity-50 grayscale cursor-not-allowed' : ''}
                `}
              >
                <div className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm mb-2 flex-shrink-0">
                  {prod.nombre.charAt(0).toUpperCase()}
                </div>
                <div className="text-xs md:text-sm font-bold text-gray-800 mb-1 leading-tight line-clamp-2 flex-1">
                  {prod.nombre}
                </div>
                
                {!isSel ? (
                  <>
                    <div className="text-base md:text-lg font-black text-blue-700 mt-auto">
                      S/{parseFloat(prod.precio).toFixed(2)}
                    </div>
                    <div className={`text-[10px] md:text-xs mt-1 font-semibold ${prod.stock <= 0 ? 'text-red-500 font-bold' : 'text-gray-400'}`}>
                      {prod.stock <= 0 ? '✕ Agotado' : `Stock: ${prod.stock}`}
                    </div>
                  </>
                ) : (
                  <div className="mt-auto pt-2" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center justify-between bg-white rounded-lg border border-blue-200 overflow-hidden mb-2">
                      <button 
                        onClick={() => setCantidad(Math.max(1, (parseInt(cantidad)||1) - 1))}
                        className="px-3 py-1.5 text-blue-600 hover:bg-blue-50 font-bold"
                      >−</button>
                      <input 
                        type="number"
                        inputMode="numeric"
                        value={cantidad}
                        onChange={handleCantidadChange}
                        onFocus={e => e.target.select()}
                        onWheel={e => e.target.blur()}
                        className="w-12 text-center text-sm font-bold outline-none text-blue-900 bg-transparent"
                      />
                      <button 
                        onClick={() => setCantidad(Math.min(prod.stock, (parseInt(cantidad)||1) + 1))}
                        className="px-3 py-1.5 text-blue-600 hover:bg-blue-50 font-bold"
                      >+</button>
                    </div>
                    <button
                      onClick={(e) => handleAgregar(prod, e)}
                      disabled={guardando || !cantidad || cantidad < 1 || cantidad > prod.stock}
                      className="w-full py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white rounded-lg text-xs font-bold shadow-sm transition-colors"
                    >
                      {guardando ? 'Agregando...' : `Añadir (S/${(prod.precio * (parseInt(cantidad)||1)).toFixed(2)})`}
                    </button>
                  </div>
                )}
              </div>
            )
          })}
          {filtrados.length === 0 && (
            <div className="col-span-full py-8 text-center text-gray-400 text-sm font-semibold">
              No se encontraron productos.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
