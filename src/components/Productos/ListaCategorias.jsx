import { useState } from 'react'

export default function ListaCategorias({ categorias, guardarCategoria, eliminarCategoria }) {
  const [nuevaCategoria, setNuevaCategoria] = useState('')
  const [editandoCategoria, setEditandoCategoria] = useState(null)
  const [nombreCategoriaEdit, setNombreCategoriaEdit] = useState('')
  const [guardando, setGuardando] = useState(false)

  async function handleCrear() {
    if (!nuevaCategoria.trim()) return
    setGuardando(true)
    await guardarCategoria(nuevaCategoria)
    setNuevaCategoria('')
    setGuardando(false)
  }

  async function handleGuardarEdicion() {
    if (!nombreCategoriaEdit.trim()) return
    setGuardando(true)
    await guardarCategoria(nombreCategoriaEdit, editandoCategoria)
    setEditandoCategoria(null)
    setNombreCategoriaEdit('')
    setGuardando(false)
  }

  function handleEliminar(cat) {
    if (!confirm(`¿Eliminar la categoría "${cat.nombre}"? Los productos quedarán sin categoría.`)) return
    eliminarCategoria(cat)
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-gray-800">Gestionar Categorías</h3>
          <p className="text-sm text-gray-500">Agrupa tus productos (ej: Bebidas, Snacks)</p>
        </div>
      </div>
      
      <div className="flex flex-col gap-2 mb-4 max-h-48 overflow-y-auto pr-2">
        {categorias.length === 0 ? (
          <p className="text-sm text-gray-400 italic">No hay categorías registradas.</p>
        ) : (
          categorias.map(cat => (
            <div key={cat.id} className="flex items-center gap-2 bg-gray-50 p-2 rounded-xl border border-gray-100">
              {editandoCategoria === cat.id ? (
                <>
                  <input
                    type="text"
                    value={nombreCategoriaEdit}
                    onChange={e => setNombreCategoriaEdit(e.target.value)}
                    className="flex-1 border-2 border-blue-500 rounded-lg px-3 py-1.5 text-sm outline-none"
                    autoFocus
                  />
                  <button 
                    onClick={handleGuardarEdicion}
                    disabled={guardando}
                    className="text-xs px-3 py-1.5 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    Guardar
                  </button>
                  <button 
                    onClick={() => setEditandoCategoria(null)}
                    className="text-xs px-3 py-1.5 bg-gray-200 text-gray-700 font-bold rounded-lg hover:bg-gray-300"
                  >
                    Cancelar
                  </button>
                </>
              ) : (
                <>
                  <span className="flex-1 text-sm font-semibold text-gray-700 px-2">{cat.nombre}</span>
                  <button 
                    onClick={() => {
                      setEditandoCategoria(cat.id)
                      setNombreCategoriaEdit(cat.nombre)
                    }}
                    className="text-xs px-3 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold rounded-lg transition-colors"
                  >
                    Editar
                  </button>
                  <button 
                    onClick={() => handleEliminar(cat)}
                    className="text-xs px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 font-bold rounded-lg transition-colors"
                  >
                    Eliminar
                  </button>
                </>
              )}
            </div>
          ))
        )}
      </div>

      <div className="flex gap-2 pt-3 border-t border-gray-100">
        <input
          type="text"
          value={nuevaCategoria}
          onChange={e => setNuevaCategoria(e.target.value)}
          placeholder="Nueva categoría..."
          className="flex-1 border-2 border-gray-200 focus:border-green-500 rounded-xl px-4 py-2 text-sm outline-none transition-colors"
          onKeyDown={e => e.key === 'Enter' && handleCrear()}
        />
        <button 
          onClick={handleCrear}
          disabled={guardando || !nuevaCategoria.trim()}
          className="px-5 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-bold shadow-sm disabled:opacity-50 transition-colors"
        >
          Agregar
        </button>
      </div>
    </div>
  )
}
