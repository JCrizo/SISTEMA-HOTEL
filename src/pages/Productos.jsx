import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useTurnoActivo } from '../hooks/useTurnoActivo'

function Productos() {
  const navigate = useNavigate()
  const { usuario } = useAuth()
  const { turnoActivo } = useTurnoActivo()
  const [productos, setProductos] = useState([])
  const [categorias, setCategorias] = useState([])
  const [cargando, setCargando] = useState(true)
  const [mostrarForm, setMostrarForm] = useState(false)
  const [editando, setEditando] = useState(null)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')

  const [nombre, setNombre] = useState('')
  const [precio, setPrecio] = useState('')
  const [stock, setStock] = useState('')
  const [categoriaId, setCategoriaId] = useState('')
  const [ajusteStock, setAjusteStock] = useState({})

  const [filtroCategoria, setFiltroCategoria] = useState('todas')

  // Gestión de categorías
  const [mostrarCategorias, setMostrarCategorias] = useState(false)
  const [nuevaCategoria, setNuevaCategoria] = useState('')
  const [editandoCategoria, setEditandoCategoria] = useState(null)
  const [nombreCategoriaEdit, setNombreCategoriaEdit] = useState('')

  useEffect(() => {
    cargarProductos()
    cargarCategorias()
  }, [])

  async function cargarCategorias() {
    const { data } = await supabase
      .from('categorias_producto')
      .select('*')
      .order('nombre')
    setCategorias(data || [])
  }

  async function crearCategoria() {
    if (!nuevaCategoria.trim()) return
    await supabase.from('categorias_producto').insert({ nombre: nuevaCategoria.trim() })
    setNuevaCategoria('')
    cargarCategorias()
  }

  function abrirEditarCategoria(cat) {
    setEditandoCategoria(cat.id)
    setNombreCategoriaEdit(cat.nombre)
  }

  async function guardarCategoria() {
    if (!nombreCategoriaEdit.trim()) return
    await supabase.from('categorias_producto')
      .update({ nombre: nombreCategoriaEdit.trim() })
      .eq('id', editandoCategoria)
    setEditandoCategoria(null)
    setNombreCategoriaEdit('')
    cargarCategorias()
    cargarProductos()
  }

  async function eliminarCategoria(cat) {
    if (!confirm(`¿Eliminar la categoría "${cat.nombre}"? Los productos de esta categoría quedarán sin categoría.`)) return
    await supabase.from('categorias_producto').delete().eq('id', cat.id)
    cargarCategorias()
    cargarProductos()
  }

  async function cargarProductos() {
    const { data } = await supabase
      .from('productos')
      .select('*, categorias_producto(id, nombre)')
      .order('nombre')
    setProductos(data || [])
    setCargando(false)
  }

  function abrirEditar(p) {
    setEditando(p)
    setNombre(p.nombre)
    setPrecio(p.precio)
    setStock(p.stock)
    setCategoriaId(p.categoria_id || '')
    setMostrarForm(true)
    setError('')
  }

  function cancelar() {
    setEditando(null)
    setNombre('')
    setPrecio('')
    setStock('')
    setCategoriaId('')
    setMostrarForm(false)
    setError('')
  }

  async function guardarProducto() {
    setError('')
    if (!nombre.trim()) { setError('El nombre es obligatorio'); return }
    if (!precio) { setError('El precio es obligatorio'); return }
    setGuardando(true)

    if (editando) {
      await supabase.from('productos').update({
        nombre: nombre.trim(),
        precio: parseFloat(precio),
        stock: parseInt(stock || 0),
        categoria_id: categoriaId || null
      }).eq('id', editando.id)
    } else {
      await supabase.from('productos').insert({
        nombre: nombre.trim(),
        precio: parseFloat(precio),
        stock: parseInt(stock || 0),
        categoria_id: categoriaId || null,
        activo: true
      })
    }

    cancelar()
    setGuardando(false)
    cargarProductos()
  }

  async function toggleActivo(p) {
    await supabase.from('productos')
      .update({ activo: !p.activo }).eq('id', p.id)
    cargarProductos()
  }

  async function ajustarStock(p, cantidad) {
    const nuevoStock = Math.max(0, p.stock + cantidad)
    await supabase.from('productos')
      .update({ stock: nuevoStock }).eq('id', p.id)

    await supabase.from('movimientos_stock').insert({
      producto_id: p.id,
      turno_id: turnoActivo?.id || null,
      tipo: 'ajuste_manual',
      cantidad,
      stock_resultante: nuevoStock,
      usuario_id: usuario?.id || null
    })

    cargarProductos()
  }

  async function aplicarAjuste(p) {
    const cantidad = parseInt(ajusteStock[p.id] || 0)
    if (!cantidad) return
    await ajustarStock(p, cantidad)
    setAjusteStock(prev => ({ ...prev, [p.id]: '' }))
  }

  if (cargando) return <div className="p-4 text-gray-500">Cargando...</div>

  const productosFiltrados = filtroCategoria === 'todas'
    ? productos
    : filtroCategoria === 'sin_categoria'
      ? productos.filter(p => !p.categoria_id)
      : productos.filter(p => p.categoria_id === filtroCategoria)

  const productosPorCategoria = {}
  productosFiltrados.forEach(p => {
    const clave = p.categorias_producto?.nombre || 'Sin categoría'
    if (!productosPorCategoria[clave]) productosPorCategoria[clave] = []
    productosPorCategoria[clave].push(p)
  })

  return (
    <div className="p-4">
      <button onClick={() => navigate('/')} className="mb-4 text-sm text-blue-600">
        ← Volver
      </button>

      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Productos</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setMostrarCategorias(!mostrarCategorias)}
            className="text-sm px-4 py-2 bg-gray-600 text-white rounded-xl"
          >
            Categorías
          </button>
          {!mostrarForm && (
            <button
              onClick={() => { cancelar(); setMostrarForm(true) }}
              className="text-sm px-4 py-2 bg-green-600 text-white rounded-xl"
            >
              + Nuevo
            </button>
          )}
        </div>
      </div>

      {mostrarCategorias && (
        <div className="bg-white rounded-xl border p-4 mb-4">
          <p className="text-xs text-gray-500 font-medium uppercase mb-3">Gestionar categorías</p>
          <div className="flex flex-col gap-2 mb-3">
            {categorias.map(cat => (
              <div key={cat.id} className="flex items-center gap-2">
                {editandoCategoria === cat.id ? (
                  <>
                    <input
                      type="text"
                      value={nombreCategoriaEdit}
                      onChange={e => setNombreCategoriaEdit(e.target.value)}
                      className="flex-1 border rounded-lg px-3 py-1.5 text-sm"
                    />
                    <button onClick={guardarCategoria}
                      className="text-xs px-3 py-1.5 bg-green-600 text-white rounded-lg">Guardar</button>
                    <button onClick={() => setEditandoCategoria(null)}
                      className="text-xs px-3 py-1.5 border rounded-lg text-gray-600">Cancelar</button>
                  </>
                ) : (
                  <>
                    <span className="flex-1 text-sm">{cat.nombre}</span>
                    <button onClick={() => abrirEditarCategoria(cat)}
                      className="text-xs px-3 py-1.5 bg-blue-100 text-blue-600 rounded-lg">Editar</button>
                    <button onClick={() => eliminarCategoria(cat)}
                      className="text-xs px-3 py-1.5 bg-red-100 text-red-600 rounded-lg">Eliminar</button>
                  </>
                )}
              </div>
            ))}
          </div>
          <div className="flex gap-2 border-t pt-3">
            <input
              type="text"
              value={nuevaCategoria}
              onChange={e => setNuevaCategoria(e.target.value)}
              placeholder="Nueva categoría (ej: Bebidas)"
              className="flex-1 border rounded-lg px-3 py-2 text-sm"
              onKeyDown={e => e.key === 'Enter' && crearCategoria()}
            />
            <button onClick={crearCategoria}
              className="px-4 py-2 bg-green-600 text-white rounded-xl text-sm font-medium">
              Agregar
            </button>
          </div>
        </div>
      )}

      {mostrarForm && (
        <div className="bg-white rounded-xl border p-4 mb-4">
          <p className="text-xs text-gray-500 font-medium uppercase mb-3">
            {editando ? `Editando: ${editando.nombre}` : 'Nuevo producto'}
          </p>
          <input
            type="text"
            value={nombre}
            onChange={e => setNombre(e.target.value)}
            placeholder="Nombre del producto"
            className="w-full border rounded-lg px-3 py-2 text-sm mb-2"
          />
          <input
            type="number"
            value={precio}
            onChange={e => setPrecio(e.target.value)}
            placeholder="Precio (S/)"
            className="w-full border rounded-lg px-3 py-2 text-sm mb-2"
          />
          <select
            value={categoriaId}
            onChange={e => setCategoriaId(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-sm mb-2"
          >
            <option value="">Sin categoría</option>
            {categorias.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.nombre}</option>
            ))}
          </select>
          <input
            type="number"
            value={stock}
            onChange={e => setStock(e.target.value)}
            placeholder="Stock inicial"
            className="w-full border rounded-lg px-3 py-2 text-sm mb-3"
          />
          {error && <p className="text-red-500 text-sm mb-2">{error}</p>}
          <div className="flex gap-2">
            <button onClick={cancelar}
              className="flex-1 py-2 border rounded-xl text-sm text-gray-600">Cancelar</button>
            <button onClick={guardarProducto} disabled={guardando}
              className="flex-1 py-2 bg-green-600 text-white rounded-xl text-sm font-medium disabled:opacity-50">
              {guardando ? 'Guardando...' : editando ? 'Guardar' : 'Crear'}
            </button>
          </div>
        </div>
      )}

      <div className="flex gap-2 mb-3 overflow-x-auto pb-1">
        <button onClick={() => setFiltroCategoria('todas')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap ${
            filtroCategoria === 'todas' ? 'bg-blue-600 text-white' : 'bg-white border text-gray-600'
          }`}>
          Todas
        </button>
        {categorias.map(cat => (
          <button key={cat.id} onClick={() => setFiltroCategoria(cat.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap ${
              filtroCategoria === cat.id ? 'bg-blue-600 text-white' : 'bg-white border text-gray-600'
            }`}>
            {cat.nombre}
          </button>
        ))}
        <button onClick={() => setFiltroCategoria('sin_categoria')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap ${
            filtroCategoria === 'sin_categoria' ? 'bg-blue-600 text-white' : 'bg-white border text-gray-600'
          }`}>
          Sin categoría
        </button>
      </div>

      {Object.keys(productosPorCategoria).length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-4">Sin productos en esta categoría</p>
      ) : (
        Object.entries(productosPorCategoria).map(([nombreCategoria, productosCat]) => (
          <div key={nombreCategoria} className="mb-4">
            <p className="text-xs text-gray-500 font-medium uppercase mb-2">{nombreCategoria}</p>
            <div className="flex flex-col gap-3">
              {productosCat.map(p => (
                <div key={p.id} className={`bg-white rounded-xl border p-4 ${!p.activo ? 'opacity-50' : ''}`}>
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-semibold">{p.nombre}</p>
                      <p className="text-sm text-gray-500">S/{p.precio}</p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => abrirEditar(p)}
                        className="text-xs px-3 py-1 bg-blue-100 text-blue-600 rounded-lg">Editar</button>
                      <button onClick={() => toggleActivo(p)}
                        className={`text-xs px-3 py-1 rounded-lg ${p.activo ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                        {p.activo ? 'Desactivar' : 'Activar'}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mt-2">
                    <p className="text-xs text-gray-500">Stock:</p>
                    <span className={`text-sm font-semibold ${p.stock <= 3 ? 'text-red-600' : 'text-gray-800'}`}>
                      {p.stock} unidades
                    </span>
                    {p.stock <= 3 && <span className="text-xs text-red-500">⚠ Stock bajo</span>}
                  </div>

                  <div className="flex gap-2 mt-2">
                    <button onClick={() => ajustarStock(p, -1)}
                      className="px-3 py-1 border rounded-lg text-sm font-medium">−</button>
                    <input
                      type="number"
                      value={ajusteStock[p.id] || ''}
                      onChange={e => setAjusteStock(prev => ({ ...prev, [p.id]: e.target.value }))}
                      placeholder="Cantidad"
                      className="flex-1 border rounded-lg px-3 py-1 text-sm text-center"
                    />
                    <button onClick={() => aplicarAjuste(p)}
                      className="px-3 py-1 bg-blue-600 text-white rounded-lg text-sm">+</button>
                    <button onClick={() => ajustarStock(p, 1)}
                      className="px-3 py-1 border rounded-lg text-sm font-medium">+1</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  )
}

export default Productos