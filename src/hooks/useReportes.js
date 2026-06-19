import { useState, useCallback } from 'react'
import { reportesService } from '../services/reportesService'

export function useReportes() {
  const [cargando, setCargando] = useState(true)
  const [periodo, setPeriodo] = useState('hoy')

  const [stats, setStats] = useState({
    habitacionesOcupadas: 0,
    habitacionesTotal: 0,
    ingresosHospedaje: 0,
    ingresosConsumos: 0,
    ingresosCochera: 0,
    deudasPendientes: 0,
    checkinsHoy: 0,
    checkoutsHoy: 0,
  })
  const [hospedajesActivos, setHospedajesActivos] = useState([])
  const [deudasPendientes, setDeudasPendientes] = useState([])

  const cargarDatos = useCallback(async () => {
    setCargando(true)
    try {
      const ahora = new Date()
      let fechaInicio = new Date()

      if (periodo === 'hoy') {
        fechaInicio.setHours(0, 0, 0, 0)
      } else if (periodo === 'semana') {
        fechaInicio.setDate(ahora.getDate() - 7)
      } else if (periodo === 'mes') {
        fechaInicio.setDate(1)
        fechaInicio.setHours(0, 0, 0, 0)
      }

      const hoyInicio = new Date()
      hoyInicio.setHours(0, 0, 0, 0)

      const resultados = await reportesService.obtenerEstadisticasGlobales(
        fechaInicio.toISOString(),
        hoyInicio.toISOString()
      )

      setStats(resultados.stats)
      setHospedajesActivos(resultados.hospedajesActivos)
      setDeudasPendientes(resultados.deudasPendientes)
    } catch (error) {
      console.error(error)
    } finally {
      setCargando(false)
    }
  }, [periodo])

  return {
    cargando,
    periodo,
    setPeriodo,
    stats,
    hospedajesActivos,
    deudasPendientes,
    cargarDatos
  }
}
