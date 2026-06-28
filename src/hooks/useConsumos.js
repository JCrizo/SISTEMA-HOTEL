import { useState, useCallback } from 'react'
import { habitacionesService } from '../services/habitacionesService'
import { hospedajesService } from '../services/hospedajesService'
import { productosService } from '../services/productosService'
import { consumosService } from '../services/consumosService'

import { auditoriaService } from '../services/auditoriaService'

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

  const agregarConsumo = async (producto, cantidad = 1) => {
    if (!hospedaje || !turnoActivo) return { exito: false, error: 'No hay turno activo' }
    setGuardando(true)
    try {
      await consumosService.agregarConsumo(hospedaje.id, producto, cantidad, turnoActivo.id, usuario?.id)
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
    // FIX CO2: confirmar antes de eliminar para evitar borrados accidentales
    const nombreProducto = consumo.productos?.nombre || 'este producto'
    if (!confirm(`¿Eliminar consumo de ${nombreProducto} (S/${consumo.precio_unitario})? Se repondrá el stock.`)) return
    try {
      await consumosService.eliminarConsumo(consumo, turnoActivo?.id, usuario?.id)
      
      // Auditoría
      await auditoriaService.registrarAccion(
        usuario,
        'ELIMINAR_CONSUMO',
        'Consumos',
        `Eliminó ${consumo.cantidad}x ${consumo.productos?.nombre} (S/${consumo.precio_unitario}) de la habitación ${hab?.numero}`
      )

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

