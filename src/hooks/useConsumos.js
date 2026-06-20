import { useState, useCallback } from 'react'
import { habitacionesService } from '../services/habitacionesService'
import { hospedajesService } from '../services/hospedajesService'
import { productosService } from '../services/productosService'
import { consumosService } from '../services/consumosService'

export function useConsumos(habitacionId, turnoActivo, usuario) {
  const [cargando, setCargando] = useState(true)
  const [hab, setHab] = useState(null)
  const [hospedaje, setHospedaje] = useState(null)
  const [productos, setProductos] = useState([])
  const [consumos, setConsumos] = useState([])
  const [guardando, setGuardando] = useState(false)

  const cargarDatos = useCallback(async () => {
    setCargando(true)
    try {
      const habData = await habitacionesService.obtenerPorId(habitacionId)
      setHab(habData)

      const hospData = await hospedajesService.obtenerActivoPorHabitacion(habitacionId)
      setHospedaje(hospData)

      const prodData = await productosService.obtenerTodos()
      setProductos(prodData.filter(p => p.activo))

      if (hospData) {
        const consData = await consumosService.obtenerPorHospedaje(hospData.id)
        setConsumos(consData.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)))
      }
    } catch (error) {
      console.error(error)
    } finally {
      setCargando(false)
    }
  }, [habitacionId])

  const agregarConsumo = async (producto) => {
    if (!hospedaje || !turnoActivo) return { exito: false, error: 'No hay turno activo' }
    setGuardando(true)
    try {
      await consumosService.agregarConsumo(hospedaje.id, producto, turnoActivo.id, usuario?.id)
      await cargarDatos()
      return { exito: true }
    } catch (error) {
      console.error(error)
      return { exito: false, error: error.message }
    } finally {
      setGuardando(false)
    }
  }

  const eliminarConsumo = async (consumo) => {
    try {
      await consumosService.eliminarConsumo(consumo, turnoActivo?.id, usuario?.id)
      await cargarDatos()
    } catch (error) {
      console.error(error)
    }
  }

  return {
    cargando,
    hab,
    hospedaje,
    productos,
    consumos,
    guardando,
    cargarDatos,
    agregarConsumo,
    eliminarConsumo
  }
}
