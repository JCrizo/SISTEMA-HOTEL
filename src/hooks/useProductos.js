import { useState, useCallback } from 'react'
import { productosService } from '../services/productosService'
import { categoriasService } from '../services/categoriasService'

export function useProductos(turnoActivo, usuario) {
  const [productos, setProductos] = useState([])
  const [categorias, setCategorias] = useState([])
  const [cargando, setCargando] = useState(true)

  const cargarCategorias = useCallback(async () => {
    try {
      const data = await categoriasService.obtenerTodas()
      setCategorias(data)
    } catch (error) {
      console.error(error)
    }
  }, [])

  const cargarProductos = useCallback(async () => {
    setCargando(true)
    try {
      const data = await productosService.obtenerTodos()
      setProductos(data)
    } catch (error) {
      console.error(error)
    } finally {
      setCargando(false)
    }
  }, [])

  const inicializar = useCallback(async () => {
    await Promise.all([cargarCategorias(), cargarProductos()])
  }, [cargarCategorias, cargarProductos])

  const guardarCategoria = async (nombre, id = null) => {
    try {
      if (id) {
        await categoriasService.actualizarCategoria(id, nombre)
      } else {
        await categoriasService.crearCategoria(nombre)
      }
      await cargarCategorias()
      if (id) await cargarProductos()
      return { exito: true }
    } catch (error) {
      console.error(error)
      return { exito: false, error: error.message }
    }
  }

  const eliminarCategoria = async (cat) => {
    try {
      await categoriasService.eliminarCategoria(cat.id)
      await cargarCategorias()
      await cargarProductos()
      return { exito: true }
    } catch (error) {
      console.error(error)
      return { exito: false, error: error.message }
    }
  }

  const guardarProducto = async (datos, editando) => {
    try {
      if (editando) {
        await productosService.actualizarProducto(editando.id, datos)
      } else {
        await productosService.crearProducto(datos)
      }
      await cargarProductos()
      return { exito: true }
    } catch (error) {
      console.error(error)
      return { exito: false, error: error.message }
    }
  }

  const toggleActivo = async (p) => {
    try {
      await productosService.cambiarEstadoActivo(p.id, p.activo)
      await cargarProductos()
    } catch (error) {
      console.error(error)
    }
  }

  const ajustarStock = async (p, cantidad) => {
    try {
      await productosService.ajustarStock(p, cantidad, turnoActivo?.id, usuario?.id)
      await cargarProductos()
    } catch (error) {
      console.error(error)
    }
  }

  return {
    productos,
    categorias,
    cargando,
    inicializar,
    guardarCategoria,
    eliminarCategoria,
    guardarProducto,
    toggleActivo,
    ajustarStock
  }
}
