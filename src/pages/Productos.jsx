import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTurnoActivo } from '../hooks/useTurnoActivo'
import { useProductos } from '../hooks/useProductos'

import ListaCategorias from '../components/Productos/ListaCategorias'
import FormularioProducto from '../components/Productos/FormularioProducto'
import ListaProductos from '../components/Productos/ListaProductos'
import BloqueoTurnoAjeno from '../components/Compartido/BloqueoTurnoAjeno'

function Productos() {
  const navigate = useNavigate()
  const { usuario } = useAuth()
  const { turnoActivo, turnoAjeno } = useTurnoActivo()
  
  const {
    productos,
    categorias,
    cargando,
    inicializar,
    guardarCategoria,
    eliminarCategoria,
    guardarProducto,
    toggleActivo,
    ajustarStock
  } = useProductos(turnoActivo, usuario)

  const [mostrarForm, setMostrarForm] = useState(false)
  const [mostrarCategorias, setMostrarCategorias] = useState(false)
  const [editando, setEditando] = useState(null)
  const [filtroCategoria, setFiltroCategoria] = useState('todas')

  useEffect(() => {
    inicializar()
  }, [inicializar])

  function abrirEditar(p) {
    setEditando(p)
    setMostrarForm(true)
  }

  function cerrarFormulario() {
    setEditando(null)
    setMostrarForm(false)
  }

  if (cargando) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-500 font-medium">Cargando inventario...</span>
      </div>
    )
  }

  if (turnoAjeno) {
    return <BloqueoTurnoAjeno />
  }

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
    <div className="p-4 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/')} 
            className="p-2 rounded-full hover:bg-gray-100 text-gray-600 transition-colors"
            title="Volver"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <div>
            <h2 className="text-2xl font-black text-gray-800">Inventario de Productos</h2>
            <p className="text-sm text-gray-500 font-medium">Gestiona tu catálogo y controla el stock</p>
          </div>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={() => setMostrarCategorias(!mostrarCategorias)}
            className={`px-5 py-2.5 rounded-xl text-sm font-bold shadow-sm transition-all ${
              mostrarCategorias 
                ? 'bg-gray-800 text-white' 
                : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            🏷️ Categorías
          </button>
          {!mostrarForm && (
            <button
              onClick={() => { setEditando(null); setMostrarForm(true) }}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-sm transition-transform active:scale-95"
            >
              + Nuevo Producto
            </button>
          )}
        </div>
      </div>

      {mostrarCategorias && (
        <ListaCategorias 
          categorias={categorias} 
          guardarCategoria={guardarCategoria}
          eliminarCategoria={eliminarCategoria}
        />
      )}

      {mostrarForm && (
        <FormularioProducto 
          editando={editando}
          categorias={categorias}
          onGuardar={guardarProducto}
          onCancelar={cerrarFormulario}
        />
      )}

      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        <button 
          onClick={() => setFiltroCategoria('todas')}
          className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-colors border ${
            filtroCategoria === 'todas' 
              ? 'bg-gray-800 text-white border-gray-800 shadow-md' 
              : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
          }`}
        >
          Ver Todos
        </button>
        {categorias.map(cat => (
          <button 
            key={cat.id} 
            onClick={() => setFiltroCategoria(cat.id)}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-colors border ${
              filtroCategoria === cat.id 
                ? 'bg-blue-600 text-white border-blue-600 shadow-md' 
                : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
            }`}
          >
            {cat.nombre}
          </button>
        ))}
        <button 
          onClick={() => setFiltroCategoria('sin_categoria')}
          className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-colors border ${
            filtroCategoria === 'sin_categoria' 
              ? 'bg-orange-500 text-white border-orange-500 shadow-md' 
              : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
          }`}
        >
          Sin categoría
        </button>
      </div>

      <ListaProductos 
        productosPorCategoria={productosPorCategoria}
        onEditar={abrirEditar}
        onToggleActivo={toggleActivo}
        onAjustarStock={ajustarStock}
      />
    </div>
  )
}

export default Productos