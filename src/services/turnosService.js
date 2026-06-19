import { supabase } from '../lib/supabase'

export const turnosService = {
  async obtenerTurnoActivo() {
    const { data, error } = await supabase
      .from('turnos')
      .select('*')
      .is('cierre', null)
      .order('apertura', { ascending: false })
      .limit(1)
    
    if (error) throw new Error(error.message)
    return data?.[0] || null
  },

  async sumarACaja(monto, tipoCaja = 'principal') {
    const turnoActivo = await this.obtenerTurnoActivo()
    if (!turnoActivo) return

    const campo = tipoCaja === 'consumos' ? 'caja_consumos_actual' : 'caja_principal_actual'
    const valorActual = turnoActivo[campo] || 0
    
    const { error } = await supabase
      .from('turnos')
      .update({ [campo]: valorActual + monto })
      .eq('id', turnoActivo.id)
    
    if (error) throw new Error(error.message)
  }
}
