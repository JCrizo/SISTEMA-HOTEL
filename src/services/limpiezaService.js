import { supabase } from '../lib/supabase'

export const limpiezaService = {
  async obtenerHabitacionesEnLimpieza() {
    const { data, error } = await supabase
      .from('habitaciones')
      .select('*')
      .in('estado', ['pendiente_limpieza', 'en_limpieza', 'limpieza_simple'])
      .order('numero')
    
    if (error) throw new Error(error.message)
    return data || []
  },

  async registrarInicioLimpieza(datos) {
    const { habitacionId, usuarioId, tipo, hora, observaciones } = datos
    const { data, error } = await supabase
      .from('limpieza')
      .insert({
        habitacion_id: habitacionId,
        usuario_id: usuarioId,
        tipo,
        estado: 'en_proceso',
        hora,
        observaciones
      })
      .select()
      .single()
    
    if (error) throw new Error(error.message)
    return data
  },

  async finalizarLimpieza(habitacionId, observaciones) {
    const { data, error } = await supabase
      .from('limpieza')
      .update({ estado: 'completada', observaciones })
      .eq('habitacion_id', habitacionId)
      .eq('estado', 'en_proceso')
      .select()
    
    if (error) throw new Error(error.message)
    return data
  }
}
