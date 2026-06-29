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
    const { hospedajeId, monto, metodo, concepto, observaciones, turnoId } = datos

    // Si no se pasa turnoId, lo buscamos del turno activo para que el pago
    // quede vinculado al turno y aparezca en el detalle de caja
    let turno_id = turnoId ?? null
    if (!turno_id) {
      const { data: turnoData } = await supabase
        .from('turnos')
        .select('id')
        .is('cierre', null)
        .order('apertura', { ascending: false })
        .limit(1)
      turno_id = turnoData?.[0]?.id ?? null
    }

    const { data, error } = await supabase
      .from('pagos')
      .insert({
        hospedaje_id: hospedajeId,
        monto: parseFloat(monto),
        metodo,
        concepto,
        observaciones,
        turno_id
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
