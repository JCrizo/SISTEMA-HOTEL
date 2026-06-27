import { useState, useCallback, useEffect } from 'react'
import { limpiezaService } from '../services/limpiezaService'
import { habitacionesService } from '../services/habitacionesService'
import { tiposLimpiezaService } from '../services/tiposLimpiezaService'

export function useLimpieza() {
  const [habitaciones, setHabitaciones] = useState([])
  const [tiposLimpieza, setTiposLimpieza] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)

  const cargarTiposLimpieza = useCallback(async () => {
    try {
      const data = await tiposLimpiezaService.obtenerTodos()
      setTiposLimpieza(data)
    } catch (err) {
      console.error(err)
    }
  }, [])

  useEffect(() => {
    cargarTiposLimpieza()
  }, [cargarTiposLimpieza])

  const cargarHabitaciones = useCallback(async () => {
    setCargando(true)
    setError(null)
    try {
      const data = await limpiezaService.obtenerTodasLasHabitaciones()
      setHabitaciones(data)
    } catch (err) {
      console.error(err)
      setError('Error al cargar habitaciones para limpieza.')
    } finally {
      setCargando(false)
    }
  }, [])

  const iniciarLimpieza = async (hab, usuarioId, personal, tipoSeleccionado, tipoLimpiezaId, horaInicio) => {
    try {
      const esPostCheckout = ['pendiente_limpieza', 'limpieza_simple'].includes(hab.estado)
      const tipo = hab.estado === 'limpieza_simple' ? 'simple' : tipoSeleccionado

      const ahora = new Date()
      const [horas, minutos] = horaInicio.split(':')
      ahora.setHours(parseInt(horas), parseInt(minutos), 0, 0)

      await limpiezaService.registrarInicioLimpieza({
        habitacionId: hab.id,
        usuarioId,
        tipo,
        tipoLimpiezaId,
        hora: ahora.toISOString(),
        observaciones: personal ? `Personal: ${personal}` : null
      })

      // Si la habitación estaba ocupada (limpieza de mantenimiento), no se cambia
      // su estado: el huésped sigue dentro. Solo se actualiza el estado para el
      // flujo post-checkout, que sí debe reflejar que está siendo limpiada.
      if (esPostCheckout) {
        await habitacionesService.actualizar(hab.id, { estado: 'en_limpieza' })
      }

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

      // Solo liberar la habitación (ponerla disponible) si estaba en el flujo
      // post-checkout. Si era limpieza de mantenimiento en una habitación
      // ocupada, su estado no cambió y no hace falta tocarlo.
      // FIX L1: también liberar si estaba en limpieza_simple (antes solo liberaba 'en_limpieza')
      if (['en_limpieza', 'limpieza_simple'].includes(hab.estado)) {
        await habitacionesService.actualizar(hab.id, { estado: 'disponible' })
      }

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
    tiposLimpieza,
    cargando,
    error,
    cargarHabitaciones,
    cargarTiposLimpieza,
    iniciarLimpieza,
    habilitarHabitacion
  }
}

