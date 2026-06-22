import { supabase } from '../lib/supabase'

export const habitacionesService = {
  async obtenerTodas() {
    const { data, error } = await supabase
      .from('habitaciones')
      .select('id, numero, tipo_actual, precio_actual, estado')
      .order('numero')
    if (error) throw new Error(error.message)
    return data || []
  },

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
  },

  async actualizar(id, updates) {
    if (Object.keys(updates).length === 0) return
    const { error } = await supabase
      .from('habitaciones')
      .update(updates)
      .eq('id', id)
    if (error) throw new Error(error.message)
  }
}
