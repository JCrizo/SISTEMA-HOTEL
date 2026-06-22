import { useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export function useCalendario() {
  const [habitaciones, setHabitaciones] = useState([])
  const [ocupaciones, setOcupaciones] = useState([]) // Mezcla de reservas y hospedajes
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)

  const cargarDatos = useCallback(async (fechaInicio, fechaFin) => {
    setCargando(true)
    setError(null)
    try {
      // 1. Cargar habitaciones
      const { data: habData, error: habError } = await supabase
        .from('habitaciones')
        .select('id, numero, tipo_actual, estado')
        .order('numero')
      if (habError) throw habError

      // 2. Cargar Reservas activas en el rango (fecha_llegada <= fechaFin AND fecha_salida_estimada >= fechaInicio)
      // Como no tenemos fecha_salida en la BD para reservas en este momento (depende de cómo esté la DB).
      // Veamos si reservas tiene salida, si no usamos fecha_llegada + dias
      // Vamos a traer todas las reservas pendientes/confirmadas
      const { data: resData, error: resError } = await supabase
        .from('reservas')
        .select(`
          id,
          habitacion_id,
          fecha_llegada,
          fecha_salida,
          estado,
          adelanto,
          clientes (nombres)
        `)
        .in('estado', ['pendiente', 'confirmada'])
      if (resError) throw resError

      // 3. Cargar Hospedajes activos
      const { data: hospData, error: hospError } = await supabase
        .from('hospedajes')
        .select(`
          id,
          habitacion_id,
          ingreso,
          salida_estimada,
          estado,
          huesped_hospedaje ( clientes ( nombres ) )
        `)
        .eq('estado', 'activo')
      if (hospError) throw hospError

      // Unificar ocupaciones
      const unificados = []

      resData.forEach(r => {
        const fechaInicio = new Date(r.fecha_llegada)
        let fechaFin
        if (r.fecha_salida) {
          fechaFin = new Date(r.fecha_salida)
        } else {
          fechaFin = new Date(fechaInicio)
          fechaFin.setDate(fechaFin.getDate() + 1) // Default to 1 day if no fecha_salida
        }

        unificados.push({
          id: `res-${r.id}`,
          tipo: 'reserva',
          habitacion_id: r.habitacion_id,
          inicio: fechaInicio,
          fin: fechaFin,
          estado: r.estado,
          nombre: r.clientes?.nombres || 'Desconocido',
          raw: r
        })
      })

      hospData.forEach(h => {
        const fechaIngreso = new Date(h.ingreso)
        let fechaFinEstimada = new Date(h.salida_estimada)
        const ahora = new Date()

        // SOLUCIÓN PARA ESTADÍAS INDEFINIDAS O VENCIDAS
        // Si el hospedaje sigue "activo" pero la salida estimada ya pasó,
        // visualmente extendemos la barra hasta mañana para que siempre se vea ocupada
        if (h.estado === 'activo' && fechaFinEstimada < ahora) {
          fechaFinEstimada = new Date(ahora)
          fechaFinEstimada.setDate(fechaFinEstimada.getDate() + 1)
        }

        unificados.push({
          id: `hosp-${h.id}`,
          tipo: 'hospedaje',
          habitacion_id: h.habitacion_id,
          inicio: fechaIngreso,
          fin: fechaFinEstimada,
          estado: h.estado,
          nombre: h.huesped_hospedaje?.[0]?.clientes?.nombres || 'Huésped',
          raw: h
        })
      })

      setHabitaciones(habData)
      setOcupaciones(unificados)
    } catch (err) {
      console.error(err)
      setError(err.message)
    } finally {
      setCargando(false)
    }
  }, [])

  return {
    habitaciones,
    ocupaciones,
    cargando,
    error,
    cargarDatos
  }
}
