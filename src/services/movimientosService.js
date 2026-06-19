import { supabase } from '../lib/supabase'

export const movimientosService = {
  async obtenerPorTurno(turnoId) {
    const { data, error } = await supabase
      .from('movimientos_caja')
      .select('*')
      .eq('turno_id', turnoId)
      .order('created_at', { ascending: false })
    
    if (error) throw new Error(error.message)
    return data || []
  },

  async registrarMovimiento(datos) {
    const { turnoId, tipo, cajaOrigen, cajaDestino, monto, concepto, autorizadoPor } = datos
    const { data, error } = await supabase
      .from('movimientos_caja')
      .insert({
        turno_id: turnoId,
        tipo,
        caja_origen: cajaOrigen,
        caja_destino: tipo === 'prestamo_entre_cajas' ? cajaDestino : null,
        monto: parseFloat(monto),
        concepto,
        autorizado_por: autorizadoPor
      })
      .select()
      .single()
    
    if (error) throw new Error(error.message)
    return data
  }
}
