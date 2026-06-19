import { useState, useCallback } from 'react'
import { hospedajesService } from '../services/hospedajesService'
import { habitacionesService } from '../services/habitacionesService'
import { pagosService } from '../services/pagosService'
import { consumosService } from '../services/consumosService'
import { cocheraService } from '../services/cocheraService'

export function useFichaHospedaje() {
  const [cargando, setCargando] = useState(true)
  const [hospedaje, setHospedaje] = useState(null)
  const [huesped, setHuesped] = useState(null)
  const [habitacion, setHabitacion] = useState(null)
  const [pagos, setPagos] = useState([])
  const [consumos, setConsumos] = useState([])
  const [cochera, setCochera] = useState(null)

  const cargarDatos = useCallback(async (hospedajeId) => {
    setCargando(true)
    try {
      const hospData = await hospedajesService.obtenerPorId(hospedajeId)
      
      if (hospData) {
        setHospedaje(hospData)
        setHuesped(hospData.huesped_hospedaje?.[0]?.clientes)

        const habData = await habitacionesService.obtenerPorId(hospData.habitacion_id)
        setHabitacion(habData)

        const pagosData = await pagosService.obtenerPorHospedaje(hospedajeId)
        setPagos(pagosData)

        const consumosData = await consumosService.obtenerPorHospedaje(hospedajeId)
        setConsumos(consumosData)

        const cocheraData = await cocheraService.obtenerPorHospedaje(hospedajeId)
        setCochera(cocheraData)
      } else {
        setHospedaje(null)
      }
    } catch (error) {
      console.error(error)
      setHospedaje(null)
    } finally {
      setCargando(false)
    }
  }, [])

  return {
    cargando,
    hospedaje,
    huesped,
    habitacion,
    pagos,
    consumos,
    cochera,
    cargarDatos
  }
}
