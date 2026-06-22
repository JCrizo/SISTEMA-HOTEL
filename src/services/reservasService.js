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

  async cambiarHabitacion(reservaId, nuevaHabitacionId) {
    const { error } = await supabase
      .from('reservas')
      .update({ habitacion_id: nuevaHabitacionId })
      .eq('id', reservaId)

    if (error) throw new Error(error.message)
    return true
  },

  async obtenerPorId(id) {
    const { data, error } = await supabase
      .from('reservas')
      .select('*, clientes(*)')
      .eq('id', id)
      .single()
    
    // Si no la encuentra, puede devolver nulo en vez de fallar dependiendo del error
    if (error && error.code !== 'PGRST116') throw new Error(error.message)
    return data || null
  }
}
