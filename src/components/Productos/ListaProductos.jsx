import { useState } from 'react'
import Icono from '../Compartido/Icono'

// Semáforo de stock. Umbral idéntico al original: 3 o menos = bajo.
function estadoStock(p) {
  if (p.stock <= 0) return { texto: 'Agotado', clase: 'badge-danger', numero: 'text-rose-600' }
  if (p.stock <= 3) return { texto: 'Stock bajo', clase: 'badge-warn', numero: 'text-amber-600' }
  return { texto: 'Stock normal', clase: 'badge-ok', numero: 'text-gray-800' }
}

export default function ListaProductos({ productosPorCategoria, onEditar, onToggleActivo, onAjustarStock }) {
  // Id del producto cuyo ajuste de stock está abierto (el producto se busca en cada render
  // para que el modal muestre siempre el stock actualizado).
  const [ajustandoId, setAjustandoId] = useState(null)
  const [cantidadManual, setCantidadManual] = useState('')

  const todos = Object.values(productosPorCategoria).flat()
  const ajustando = todos.find(p => p.id === ajustandoId) || null

  function abrirAjuste(p) {
    setCantidadManual('')
    setAjustandoId(p.id)
  }

  function cerrarAjuste() {
    setAjustandoId(null)
    setCantidadManual('')
  }

  function handleAjustar(p, cantidad) {
    onAjustarStock(p, cantidad)
  }

  function handleAplicarAjuste(p) {
    const cantidad = parseInt(cantidadManual || 0)
    if (!cantidad) return
    onAjustarStock(p, cantidad)
    setCantidadManual('')
  }

  if (Object.keys(productosPorCategoria).length === 0) {
    return (
      <div className="card flex flex-col items-center justify-center text-center p-12 text-gray-500">
        <Icono name="box" className="w-10 h-10 text-gray-300 mb-2" />
        <p className="text-sm font-bold text-gray-600">No hay productos en esta vista</p>
        <p className="text-xs text-gray-400 mt-1">Prueba con otra categoría o registra un producto nuevo.</p>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-6">
        {Object.entries(productosPorCategoria).map(([nombreCategoria, productosCat]) => (
          <section key={nombreCategoria}>
            <div className="flex items-center gap-3 mb-3">
              <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest">{nombreCategoria}</h2>
              <div className="h-px bg-gray-200 flex-1"></div>
              <span className="text-[11px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{productosCat.length}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
              {productosCat.map(p => {
                const est = estadoStock(p)
                return (
                  <article
                    key={p.id}
                    className={`card card-hover p-4 flex flex-col gap-3 ${!p.activo ? 'opacity-60 grayscale-[0.5]' : ''}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 shrink-0 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                        <Icono name="box" className="w-5 h-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-bold text-gray-800 leading-tight truncate" title={p.nombre}>{p.nombre}</h3>
                        <p className="font-black text-blue-700 text-lg leading-tight mt-0.5">S/ {parseFloat(p.precio).toFixed(2)}</p>
                      </div>
                      {!p.activo && <span className="badge badge-muted">Inactivo</span>}
                    </div>

                    <div className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded-xl border border-gray-100">
                      <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Stock</p>
                        <p className={`text-xl font-black leading-none ${est.numero}`}>
                          {p.stock} <span className="text-xs font-semibold text-gray-400">unds</span>
                        </p>
                      </div>
                      {p.activo && <span className={`badge ${est.clase}`}>{est.texto}</span>}
                    </div>

                    <button onClick={() => abrirAjuste(p)} className="btn btn-soft btn-sm w-full">
                      <Icono name="sliders" className="w-3.5 h-3.5" /> Ajustar stock
                    </button>

                    <div className="flex gap-2 pt-3 border-t border-gray-50 mt-auto">
                      <button onClick={() => onEditar(p)} className="btn btn-secondary btn-sm flex-1">
                        <Icono name="pencil" className="w-3.5 h-3.5" /> Editar
                      </button>
                      <button
                        onClick={() => onToggleActivo(p)}
                        className={`btn btn-sm flex-1 ${p.activo ? 'btn-danger-soft' : 'bg-emerald-50 text-emerald-700 border border-emerald-100 hover:bg-emerald-100'}`}
                      >
                        {p.activo ? 'Desactivar' : 'Reactivar'}
                      </button>
                    </div>
                  </article>
                )
              })}
            </div>
          </section>
        ))}
      </div>

      {/* Ventana de ajuste de stock */}
      {ajustando && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-gray-900/40 p-0 sm:p-4"
          onClick={cerrarAjuste}
        >
          <div
            className="bg-white w-full sm:max-w-sm rounded-t-3xl sm:rounded-2xl shadow-xl p-5 space-y-4"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="font-black text-gray-800 truncate">{ajustando.nombre}</h3>
                <p className="text-xs text-gray-500 font-medium">Ajuste de inventario</p>
              </div>
              <button onClick={cerrarAjuste} className="btn btn-ghost btn-sm !px-2" aria-label="Cerrar">
                <Icono name="x" className="w-4 h-4" />
              </button>
            </div>

            <div className="text-center bg-gray-50 border border-gray-100 rounded-2xl py-3">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Stock actual</p>
              <p className={`text-4xl font-black ${estadoStock(ajustando).numero}`}>{ajustando.stock}</p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => handleAjustar(ajustando, -1)} className="btn btn-secondary">
                <Icono name="minus" className="w-4 h-4" /> Restar 1
              </button>
              <button onClick={() => handleAjustar(ajustando, 1)} className="btn btn-secondary">
                <Icono name="plus" className="w-4 h-4" /> Sumar 1
              </button>
            </div>

            <div>
              <label className="label">Entrada / salida de mercadería</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  inputMode="numeric"
                  value={cantidadManual}
                  onChange={e => setCantidadManual(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAplicarAjuste(ajustando)}
                  placeholder="Ej: 12 o -3"
                  className="input flex-1"
                />
                <button onClick={() => handleAplicarAjuste(ajustando)} className="btn btn-primary">
                  <Icono name="check" className="w-4 h-4" /> Aplicar
                </button>
              </div>
              <p className="text-[11px] text-gray-400 mt-1.5">Usa un número negativo para descontar.</p>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
