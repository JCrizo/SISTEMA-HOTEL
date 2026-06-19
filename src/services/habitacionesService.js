import { supabase } from '../lib/supabase'

export const habitacionesService = {
  async obtenerDisponibles() {
    const { data, error } = await supabase
      .from('habitaciones')
      .select('id, numero, tipo_actual, precio_actual')
      .eq('estado', 'disponible')
      .order('numero')
    
    if (error) throw new Error(error.message)
    return data || []
  },

  async obtenerPorId(id) {
    const { data, error } = await supabase
      .from('habitaciones')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) throw new Error(error.message)
    return data
  }
}
