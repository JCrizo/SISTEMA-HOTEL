import { useState, useCallback } from 'react'
import { limpiezaService } from '../services/limpiezaService'
import { habitacionesService } from '../services/habitacionesService'

export function useLimpieza() {
  const [habitaciones, setHabitaciones] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)

  const cargarHabitaciones = useCallback(async () => {
    setCargando(true)
    setError(null)
    try {
      const data = await limpiezaService.obtenerHabitacionesEnLimpieza()
      setHabitaciones(data)
    } catch (err) {
      console.error(err)
      setError('Error al cargar habitaciones para limpieza.')
    } finally {
      setCargando(false)
    }
  }, [])

  const iniciarLimpieza = async (hab, usuarioId, personal, tipoSeleccionado, horaInicio) => {
    try {
      const tipo = hab.estado === 'limpieza_simple' ? 'simple' : tipoSeleccionado

      const ahora = new Date()
      const [horas, minutos] = horaInicio.split(':')
      ahora.setHours(parseInt(horas), parseInt(minutos), 0, 0)

      await limpiezaService.registrarInicioLimpieza({
        habitacionId: hab.id,
        usuarioId,
        tipo,
        hora: ahora.toISOString(),
        observaciones: personal ? `Personal: ${personal}` : null
      })

      await habitacionesService.actualizar(hab.id, { estado: 'en_limpieza' })
      
      await cargarHabitaciones()
      return true
    } catch (err) {
      console.error(err)
      setError('Error al iniciar la limpieza.')
      return false
    }
  }

  const habilitarHabitacion = async (hab, horaFin) => {
    try {
      await limpiezaService.finalizarLimpieza(hab.id, `Fin: ${horaFin}`)
      await habitacionesService.actualizar(hab.id, { estado: 'disponible' })
      
      await cargarHabitaciones()
      return true
    } catch (err) {
      console.error(err)
      setError('Error al habilitar la habitación.')
      return false
    }
  }

  return {
    habitaciones,
    cargando,
    error,
    cargarHabitaciones,
    iniciarLimpieza,
    habilitarHabitacion
  }
}
