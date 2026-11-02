import { useState, useEffect } from 'react'
import Icono from '../Compartido/Icono'

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
    <div className="card border-blue-100 p-4 sm:p-6">
      <div className="mb-4 flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-gray-100 text-gray-600 flex items-center justify-center shrink-0">
          <Icono name={editando ? 'pencil' : 'plus'} className="w-5 h-5" />
        </div>
        <div className="min-w-0">
          <h3 className="text-lg font-black text-gray-800 truncate">
            {editando ? `Editando: ${editando.nombre}` : 'Nuevo producto'}
          </h3>
          <p className="text-sm text-gray-500">Añade o modifica un artículo en el inventario.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <div className="lg:col-span-2">
          <label className="label">Nombre del producto</label>
          <input
            type="text"
            value={nombre}
            onChange={e => setNombre(e.target.value)}
            placeholder="Ej: Gaseosa Inka Cola 500ml"
            className="input"
          />
        </div>
        <div>
          <label className="label">Categoría</label>
          <select
            value={categoriaId}
            onChange={e => setCategoriaId(e.target.value)}
            className="input"
          >
            <option value="">Sin categoría</option>
            {categorias.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.nombre}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Precio (S/)</label>
          <input
            type="number"
            inputMode="decimal"
            value={precio}
            onChange={e => setPrecio(e.target.value)}
            onFocus={e => e.target.select()}
            onWheel={e => e.target.blur()}
            placeholder="0.00"
            className="input font-bold"
          />
        </div>
        <div className="lg:col-span-1">
          <label className="label">Stock inicial</label>
          <input
            type="number"
            inputMode="numeric"
            value={stock}
            onChange={e => setStock(e.target.value)}
            onFocus={e => e.target.select()}
            onWheel={e => e.target.blur()}
            placeholder="Cantidad"
            className="input"
          />
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-rose-50 text-rose-700 text-sm p-3 rounded-xl border border-rose-100 font-semibold mb-4">
          <Icono name="alert" className="w-4 h-4 shrink-0" /> {error}
        </div>
      )}

      <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 pt-3 border-t border-gray-100">
        <button onClick={onCancelar} className="btn btn-secondary sm:px-6">
          Cancelar
        </button>
        <button
          onClick={handleGuardar}
          disabled={guardando}
          className="btn btn-primary flex-1"
        >
          {guardando ? 'Guardando...' : editando ? 'Guardar cambios' : 'Registrar producto'}
        </button>
      </div>
    </div>
  )
}
