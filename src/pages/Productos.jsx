import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useTurnoActivo } from '../hooks/useTurnoActivo'
import { useProductos } from '../hooks/useProductos'

import ListaCategorias from '../components/Productos/ListaCategorias'
import FormularioProducto from '../components/Productos/FormularioProducto'
import ListaProductos from '../components/Productos/ListaProductos'
import BloqueoTurnoAjeno from '../components/Compartido/BloqueoTurnoAjeno'
import Icono from '../components/Compartido/Icono'

function Productos() {
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
      <div className="flex flex-col justify-center items-center h-80 gap-3">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
        <span className="text-sm text-gray-400 font-semibold">Cargando inventario...</span>
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

  // Contadores para las pastillas de filtro (solo lectura, no alteran los datos)
  const totalPorCategoria = id => productos.filter(p => p.categoria_id === id).length
  const totalSinCategoria = productos.filter(p => !p.categoria_id).length
  const totalStockBajo = productos.filter(p => p.activo && p.stock <= 3).length

  return (
    <div className="max-w-6xl mx-auto space-y-5 pb-12">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="page-title">Inventario de Productos</h1>
          <p className="page-sub">
            {productos.length} productos
            {totalStockBajo > 0 && (
              <span className="ml-2 badge badge-warn">
                <Icono name="alert" className="w-3 h-3" /> {totalStockBajo} con stock bajo
              </span>
            )}
          </p>
        </div>

        <div className="grid grid-cols-2 sm:flex gap-2">
          <button
            onClick={() => setMostrarCategorias(!mostrarCategorias)}
            className={`btn ${mostrarCategorias ? 'bg-gray-900 text-white' : 'btn-secondary'}`}
          >
            <Icono name="tag" className="w-4 h-4" /> Categorías
          </button>
          {!mostrarForm && (
            <button
              onClick={() => { setEditando(null); setMostrarForm(true) }}
              className="btn btn-primary"
            >
              <Icono name="plus" className="w-4 h-4" /> Nuevo Producto
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

      {/* Filtros por categoría (con contadores) */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        <button
          onClick={() => setFiltroCategoria('todas')}
          className={`chip ${filtroCategoria === 'todas' ? 'chip-active' : ''}`}
        >
          Todos ({productos.length})
        </button>
        {categorias.map(cat => (
          <button
            key={cat.id}
            onClick={() => setFiltroCategoria(cat.id)}
            className={`chip ${filtroCategoria === cat.id ? '!bg-blue-600 !text-white !border-blue-600' : ''}`}
          >
            {cat.nombre} ({totalPorCategoria(cat.id)})
          </button>
        ))}
        <button
          onClick={() => setFiltroCategoria('sin_categoria')}
          className={`chip ${filtroCategoria === 'sin_categoria' ? '!bg-amber-500 !text-white !border-amber-500' : ''}`}
        >
          Sin categoría ({totalSinCategoria})
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
