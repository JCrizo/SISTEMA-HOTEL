import { supabase } from '../lib/supabase'

export const tiposLimpiezaService = {
  async obtenerTodos() {
    const { data, error } = await supabase
      .from('tipos_limpieza')
      .select('*')
      .order('nombre')

    if (error) throw new Error(error.message)
    return data || []
  },

  async crear(nombre) {
    const { error } = await supabase.from('tipos_limpieza').insert({
      nombre: nombre.trim()
    })
    if (error) throw new Error(error.message)
  },

  async actualizar(id, nombre) {
    const { error } = await supabase.from('tipos_limpieza')
      .update({ nombre: nombre.trim() })
      .eq('id', id)
    if (error) throw new Error(error.message)
  },

  async eliminar(id) {
    const { error } = await supabase.from('tipos_limpieza')
      .delete()
      .eq('id', id)
    if (error) throw new Error(error.message)
  }
}
