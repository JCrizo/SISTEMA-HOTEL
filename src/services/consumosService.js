import { supabase } from '../lib/supabase'

export const consumosService = {
  async obtenerPorHospedaje(hospedajeId) {
    const { data, error } = await supabase
      .from('consumos')
      .select('*')
      .eq('hospedaje_id', hospedajeId)
    if (error) throw new Error(error.message)
    return data || []
  }
}
