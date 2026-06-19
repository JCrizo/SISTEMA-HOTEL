import { useState, useEffect } from 'react'

export default function FormularioProducto({ editando, categorias, onGuardar, onCancelar }) {
  const [nombre, setNombre] = useState('')
  const [precio, setPrecio] = useState('')
  const [stock, setStock] = useState('')
  const [categoriaId, setCategoriaId] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (editando) {
      setNombre(editando.nombre)
      setPrecio(editando.precio)
      setStock(editando.stock)
      setCategoriaId(editando.categoria_id || '')
    } else {
      setNombre('')
      setPrecio('')
      setStock('')
      setCategoriaId('')
    }
    setError('')
  }, [editando])

  async function handleGuardar() {
    setError('')
    if (!nombre.trim()) { setError('El nombre es obligatorio'); return }
    if (!precio) { setError('El precio es obligatorio'); return }
    
    setGuardando(true)
    const { exito, error: errMsg } = await onGuardar({
      nombre, precio, stock, categoriaId
    }, editando)
    
    if (!exito) {
      setError(errMsg || 'Error al guardar el producto')
    } else {
      onCancelar()
    }
    setGuardando(false)
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-blue-100 p-6 mb-6">
      <div className="mb-4">
        <h3 className="text-lg font-bold text-gray-800">
          {editando ? `✏️ Editando: ${editando.nombre}` : '✨ Nuevo Producto'}
        </h3>
        <p className="text-sm text-gray-500">Añade o modifica un artículo en el inventario.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <div className="lg:col-span-2">
          <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1.5">Nombre del Producto</label>
          <input
            type="text"
            value={nombre}
            onChange={e => setNombre(e.target.value)}
            placeholder="Ej: Gaseosa Inka Cola 500ml"
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-500 transition-colors"
          />
        </div>
        <div>
          <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1.5">Categoría</label>
          <select
            value={categoriaId}
            onChange={e => setCategoriaId(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-500 transition-colors bg-white"
          >
            <option value="">Sin categoría</option>
            {categorias.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.nombre}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1.5">Precio (S/)</label>
          <input
            type="number"
            value={precio}
            onChange={e => setPrecio(e.target.value)}
            placeholder="0.00"
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-500 transition-colors font-semibold text-blue-700"
          />
        </div>
        <div className="lg:col-span-1">
          <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1.5">Stock Inicial</label>
          <input
            type="number"
            value={stock}
            onChange={e => setStock(e.target.value)}
            placeholder="Cantidad"
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-500 transition-colors"
          />
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg border border-red-100 font-medium mb-4">
          ⚠ {error}
        </div>
      )}

      <div className="flex gap-3 pt-2 border-t border-gray-50">
        <button
          onClick={onCancelar}
          className="px-6 py-2.5 text-sm font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
        >
          Cancelar
        </button>
        <button
          onClick={handleGuardar}
          disabled={guardando}
          className="flex-1 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-sm font-bold shadow-sm transition-transform active:scale-[0.98] disabled:opacity-50"
        >
          {guardando ? 'Guardando...' : editando ? 'Guardar Cambios' : 'Registrar Producto'}
        </button>
      </div>
    </div>
  )
}
