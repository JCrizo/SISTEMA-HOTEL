import { useState, useCallback } from 'react'
import { productosService } from '../services/productosService'
import { categoriasService } from '../services/categoriasService'
import { auditoriaService } from '../services/auditoriaService'

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
      
      if (usuario) {
        await auditoriaService.registrarAccion(
          usuario,
          id ? 'EDITAR_CATEGORIA' : 'CREAR_CATEGORIA',
          'Inventario',
          `${id ? 'Editó' : 'Creó'} la categoría: ${nombre}`
        )
      }

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
      
      if (usuario) {
        await auditoriaService.registrarAccion(
          usuario,
          'ELIMINAR_CATEGORIA',
          'Inventario',
          `Eliminó la categoría: ${cat.nombre}`
        )
      }

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
      
      if (usuario) {
        await auditoriaService.registrarAccion(
          usuario,
          editando ? 'EDITAR_PRODUCTO' : 'CREAR_PRODUCTO',
          'Inventario',
          `${editando ? 'Editó' : 'Creó'} el producto: ${datos.nombre}`
        )
      }

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
      
      if (usuario) {
        await auditoriaService.registrarAccion(
          usuario,
          p.activo ? 'DESACTIVAR_PRODUCTO' : 'ACTIVAR_PRODUCTO',
          'Inventario',
          `Cambió estado del producto ${p.nombre} a ${p.activo ? 'inactivo' : 'activo'}`
        )
      }
    } catch (error) {
      console.error(error)
    }
  }

  const ajustarStock = async (p, cantidad) => {
    try {
      await productosService.ajustarStock(p, cantidad, turnoActivo?.id, usuario?.id)
      await cargarProductos()
      
      if (usuario) {
        await auditoriaService.registrarAccion(
          usuario,
          'AJUSTE_STOCK',
          'Inventario',
          `Ajustó stock de ${p.nombre}. Cambio: ${cantidad > 0 ? '+' : ''}${cantidad}`
        )
      }
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
