import { supabase } from '../lib/supabase'

export const cocheraService = {
  async obtenerPorHospedaje(hospedajeId) {
    const { data, error } = await supabase
      .from('cochera')
      .select('*')
      .eq('hospedaje_id', hospedajeId)
      .single()
    
    // PGRST116 is "No rows found", which is fine if they don't have cochera
    if (error && error.code !== 'PGRST116') throw new Error(error.message)
    return data || null
  }
}
