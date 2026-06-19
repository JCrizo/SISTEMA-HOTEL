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

  async obtenerTurnoAnterior() {
    const { data, error } = await supabase
      .from('turnos')
      .select('*, usuarios(nombre)')
      .not('cierre', 'is', null)
      .order('cierre', { ascending: false })
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
  },

  async actualizarCajas(turnoId, updates) {
    if (Object.keys(updates).length === 0) return
    const { error } = await supabase
      .from('turnos')
      .update(updates)
      .eq('id', turnoId)
    if (error) throw new Error(error.message)
  },

  async abrirTurno(datos) {
    const { tipo, usuarioId, cajaPrincipalInicial, cajaConsumosInicial } = datos
    const { data, error } = await supabase
      .from('turnos')
      .insert({
        tipo,
        usuario_id: usuarioId,
        caja_principal_anterior: parseFloat(cajaPrincipalInicial),
        caja_consumos_anterior: parseFloat(cajaConsumosInicial || 0),
        caja_principal_actual: parseFloat(cajaPrincipalInicial),
        caja_consumos_actual: parseFloat(cajaConsumosInicial || 0),
      })
      .select()
      .single()
    if (error) throw new Error(error.message)
    return data
  },

  async cerrarTurno(turnoId, datos) {
    const { error } = await supabase
      .from('turnos')
      .update({
        cierre: new Date().toISOString(),
        ...datos
      })
      .eq('id', turnoId)
    
    if (error) throw new Error(error.message)
  }
}
