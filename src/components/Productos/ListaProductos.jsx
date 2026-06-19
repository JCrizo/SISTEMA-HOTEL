import { useState } from 'react'

export default function ListaProductos({ productosPorCategoria, onEditar, onToggleActivo, onAjustarStock }) {
  const [ajusteStock, setAjusteStock] = useState({})

  function handleAjustar(p, cantidad) {
    onAjustarStock(p, cantidad)
    if (cantidad === 0) return // Solo para aplicar manual
    setAjusteStock(prev => ({ ...prev, [p.id]: '' }))
  }

  function handleAplicarAjuste(p) {
    const cantidad = parseInt(ajusteStock[p.id] || 0)
    if (!cantidad) return
    onAjustarStock(p, cantidad)
    setAjusteStock(prev => ({ ...prev, [p.id]: '' }))
  }

  if (Object.keys(productosPorCategoria).length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center mt-6">
        <p className="text-gray-500">No hay productos en esta vista.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 mt-6">
      {Object.entries(productosPorCategoria).map(([nombreCategoria, productosCat]) => (
        <div key={nombreCategoria}>
          <div className="flex items-center gap-3 mb-3">
            <h4 className="text-sm font-bold text-gray-500 uppercase tracking-widest">{nombreCategoria}</h4>
            <div className="h-px bg-gray-200 flex-1"></div>
            <span className="text-xs font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{productosCat.length}</span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {productosCat.map(p => (
              <div key={p.id} className={`bg-white rounded-2xl border shadow-sm p-5 transition-all ${!p.activo ? 'opacity-60 grayscale-[0.5]' : 'hover:shadow-md'}`}>
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h5 className="font-bold text-gray-800 text-lg leading-tight">{p.nombre}</h5>
                    <p className="font-black text-blue-700 text-lg mt-0.5">S/{parseFloat(p.precio).toFixed(2)}</p>
                  </div>
                </div>

                <div className="flex justify-between items-center bg-gray-50 p-2.5 rounded-xl border border-gray-100 mb-4">
                  <span className="text-xs font-bold text-gray-500 uppercase">Stock actual</span>
                  <div className="flex items-center gap-2">
                    <span className={`text-lg font-black ${p.stock <= 3 ? 'text-red-600' : 'text-gray-800'}`}>
                      {p.stock}
                    </span>
                    <span className="text-xs text-gray-500 font-medium">unds</span>
                  </div>
                </div>

                {p.stock <= 3 && p.activo && (
                  <p className="text-xs font-bold text-red-600 bg-red-50 p-1.5 rounded-lg text-center mb-3">
                    ⚠ Stock bajo, requiere reposición
                  </p>
                )}

                <div className="flex flex-col gap-2">
                  <div className="flex gap-1.5 bg-gray-100 p-1 rounded-xl">
                    <button 
                      onClick={() => handleAjustar(p, -1)}
                      className="px-3 py-1.5 bg-white text-gray-700 hover:text-red-600 font-bold rounded-lg shadow-sm transition-colors"
                      title="Restar 1"
                    >−</button>
                    <input
                      type="number"
                      value={ajusteStock[p.id] || ''}
                      onChange={e => setAjusteStock(prev => ({ ...prev, [p.id]: e.target.value }))}
                      placeholder="Cant."
                      className="flex-1 w-full text-center text-sm font-bold bg-white border-none rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                    <button 
                      onClick={() => handleAplicarAjuste(p)}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-sm transition-colors"
                      title="Aplicar ajuste"
                    >✓</button>
                    <button 
                      onClick={() => handleAjustar(p, 1)}
                      className="px-3 py-1.5 bg-white text-gray-700 hover:text-green-600 font-bold rounded-lg shadow-sm transition-colors"
                      title="Sumar 1"
                    >+</button>
                  </div>
                  
                  <div className="flex gap-2 mt-1 border-t border-gray-50 pt-3">
                    <button 
                      onClick={() => onEditar(p)}
                      className="flex-1 text-xs px-3 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 font-bold rounded-lg transition-colors border border-gray-100"
                    >
                      Editar
                    </button>
                    <button 
                      onClick={() => onToggleActivo(p)}
                      className={`flex-[1.5] text-xs px-3 py-2 font-bold rounded-lg transition-colors border ${
                        p.activo 
                          ? 'bg-red-50 hover:bg-red-100 text-red-600 border-red-100' 
                          : 'bg-green-50 hover:bg-green-100 text-green-700 border-green-100'
                      }`}
                    >
                      {p.activo ? 'Desactivar' : 'Reactivar'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
