import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

function Productos() {
  const navigate = useNavigate()
  const { usuario } = useAuth()
  const [productos, setProductos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [mostrarForm, setMostrarForm] = useState(false)
  const [editando, setEditando] = useState(null)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')

  const [nombre, setNombre] = useState('')
  const [precio, setPrecio] = useState('')
  const [stock, setStock] = useState('')
  const [ajusteStock, setAjusteStock] = useState({})

  useEffect(() => {
    cargarProductos()
  }, [])

  async function cargarProductos() {
    const { data } = await supabase
      .from('productos')
      .select('*')
      .order('nombre')
    setProductos(data || [])
    setCargando(false)
  }

  function abrirEditar(p) {
    setEditando(p)
    setNombre(p.nombre)
    setPrecio(p.precio)
    setStock(p.stock)
    setMostrarForm(true)
    setError('')
  }

  function cancelar() {
    setEditando(null)
    setNombre('')
    setPrecio('')
    setStock('')
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
        stock: parseInt(stock || 0)
      }).eq('id', editando.id)
    } else {
      await supabase.from('productos').insert({
        nombre: nombre.trim(),
        precio: parseFloat(precio),
        stock: parseInt(stock || 0),
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
    cargarProductos()
  }

  async function aplicarAjuste(p) {
    const cantidad = parseInt(ajusteStock[p.id] || 0)
    if (!cantidad) return
    await ajustarStock(p, cantidad)
    setAjusteStock(prev => ({ ...prev, [p.id]: '' }))
  }

  if (cargando) return <div className="p-4 text-gray-500">Cargando...</div>

  return (
    <div className="p-4">
      <button onClick={() => navigate('/')} className="mb-4 text-sm text-blue-600">
        ← Volver
      </button>

      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Productos</h2>
        {!mostrarForm && (
          <button
            onClick={() => { cancelar(); setMostrarForm(true) }}
            className="text-sm px-4 py-2 bg-green-600 text-white rounded-xl"
          >
            + Nuevo
          </button>
        )}
      </div>

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

      <div className="flex flex-col gap-3">
        {productos.map(p => (
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
  )
}

export default Productos