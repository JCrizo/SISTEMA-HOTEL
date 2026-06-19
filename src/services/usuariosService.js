import { supabase } from '../lib/supabase'

export const usuariosService = {
  async obtenerUsuarios() {
    const { data, error } = await supabase
      .from('usuarios')
      .select('*')
      .order('nombre')
    
    if (error) throw new Error(error.message)
    return data || []
  },

  async crearUsuario(datos) {
    const { error } = await supabase.from('usuarios').insert({
      nombre: datos.nombre.trim(),
      email: datos.email.trim().toLowerCase(),
      password_hash: datos.password,
      rol: datos.rol,
      activo: true
    })
    if (error) throw new Error('Error al crear usuario — el email ya existe')
  },

  async actualizarUsuario(id, datos) {
    const { error } = await supabase
      .from('usuarios')
      .update(datos)
      .eq('id', id)
    
    if (error) throw new Error('Error al actualizar usuario')
  },

  async cambiarEstadoActivo(id, activoActual) {
    const { error } = await supabase
      .from('usuarios')
      .update({ activo: !activoActual })
      .eq('id', id)
    
    if (error) throw new Error('Error al cambiar estado del usuario')
  }
}
