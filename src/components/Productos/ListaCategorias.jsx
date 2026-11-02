import { useState } from 'react'
import Icono from '../Compartido/Icono'

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
    <div className="card p-4 sm:p-6">
      <div className="mb-4">
        <h3 className="text-lg font-black text-gray-800">Gestionar categorías</h3>
        <p className="text-sm text-gray-500">Agrupa tus productos (ej: Bebidas, Snacks)</p>
      </div>
      
      <div className="flex flex-col gap-2 mb-4 max-h-56 overflow-y-auto pr-1">
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
                    className="input flex-1 !py-1.5"
                    autoFocus
                  />
                  <button
                    onClick={handleGuardarEdicion}
                    disabled={guardando}
                    className="btn btn-primary btn-sm"
                  >
                    Guardar
                  </button>
                  <button
                    onClick={() => setEditandoCategoria(null)}
                    className="btn btn-secondary btn-sm"
                  >
                    Cancelar
                  </button>
                </>
              ) : (
                <>
                  <Icono name="tag" className="w-4 h-4 text-gray-400 ml-1 shrink-0" />
                  <span className="flex-1 text-sm font-semibold text-gray-700 truncate">{cat.nombre}</span>
                  <button
                    onClick={() => {
                      setEditandoCategoria(cat.id)
                      setNombreCategoriaEdit(cat.nombre)
                    }}
                    className="btn btn-secondary btn-sm"
                    title="Editar categoría"
                  >
                    <Icono name="pencil" className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Editar</span>
                  </button>
                  <button
                    onClick={() => handleEliminar(cat)}
                    className="btn btn-danger-soft btn-sm"
                    title="Eliminar categoría"
                  >
                    <Icono name="trash" className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Eliminar</span>
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
          className="input flex-1"
          onKeyDown={e => e.key === 'Enter' && handleCrear()}
        />
        <button
          onClick={handleCrear}
          disabled={guardando || !nuevaCategoria.trim()}
          className="btn btn-success"
        >
          <Icono name="plus" className="w-4 h-4" /> Agregar
        </button>
      </div>
    </div>
  )
}
