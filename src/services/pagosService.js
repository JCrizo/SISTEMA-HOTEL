import { supabase } from '../lib/supabase'

export const pagosService = {
  async obtenerPorHospedaje(hospedajeId) {
    const { data, error } = await supabase
      .from('pagos')
      .select('*')
      .eq('hospedaje_id', hospedajeId)
      .order('created_at')
    if (error) throw new Error(error.message)
    return data || []
  },

  async registrarPago(datos) {
    const { hospedajeId, monto, metodo, concepto, observaciones } = datos
    const { data, error } = await supabase
      .from('pagos')
      .insert({
        hospedaje_id: hospedajeId,
        monto: parseFloat(monto),
        metodo,
        concepto,
        observaciones
      })
      .select()
      .single()
    
    if (error) throw new Error(error.message)
    return data
  },

  async obtenerDesdeFecha(fechaDesde) {
    const { data, error } = await supabase
      .from('pagos')
      .select('monto, metodo, concepto, created_at')
      .gte('created_at', fechaDesde)
    if (error) throw new Error(error.message)
    return data || []
  }
}
