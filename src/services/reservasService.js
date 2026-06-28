import { supabase } from '../lib/supabase'

export const reservasService = {
  async obtenerReservasPendientes() {
    const { data, error } = await supabase
      .from('reservas')
      .select(`
        *,
        clientes(nombres, dni_pasaporte, telefono),
        habitaciones(numero, tipo_actual, precio_actual)
      `)
      .in('estado', ['pendiente', 'confirmada'])
      .order('fecha_llegada')
    
    if (error) throw new Error(error.message)
    return data || []
  },

  async obtenerReservaPendientePorHabitacionParaHoy(habitacionId) {
    const today = new Date().toISOString().split('T')[0]
    const { data, error } = await supabase
      .from('reservas')
      .select('*')
      .eq('habitacion_id', habitacionId)
      .in('estado', ['pendiente', 'confirmada'])
      .gte('fecha_llegada', `${today}T00:00:00`)
      .lte('fecha_llegada', `${today}T23:59:59`)
      .order('fecha_llegada', { ascending: true })
      .limit(1)
    
    if (error) throw new Error(error.message)
    return data && data.length > 0 ? data[0] : null
  },

  async crearReserva(reservaData) {
    const { data, error } = await supabase
      .from('reservas')
      .insert(reservaData)
      .select()
      .single()
    
    if (error) throw new Error(error.message)
    return data
  },

  async anularReserva(reservaId) {
    const { error } = await supabase
      .from('reservas')
      .update({ estado: 'anulada' })
      .eq('id', reservaId)
    
    if (error) throw new Error(error.message)
    return true
  },

  async actualizarHabitacion(reservaId, habitacionId) {
    const { error } = await supabase
      .from('reservas')
      .update({ habitacion_id: habitacionId })
      .eq('id', reservaId)
    
    if (error) throw new Error(error.message)
    return true
  },

  async obtenerPorId(id) {
    const { data, error } = await supabase
      .from('reservas')
      .select(`
        *,
        clientes(id, nombres, dni_pasaporte, telefono, nacionalidad, tarifa_habitual, lista_negra, deuda_pendiente)
      `)
      .eq('id', id)
      .single()
    
    if (error && error.code !== 'PGRST116') throw new Error(error.message)
    return data || null
  }
}
