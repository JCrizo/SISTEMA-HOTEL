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
      password_hash: datos.password || null,
      rol: datos.rol,
      activo: true
    })
    if (error) throw new Error('Error al crear usuario — el usuario o correo ya existe')
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
  },

  async eliminarUsuario(id) {
    const { error } = await supabase
      .from('usuarios')
      .delete()
      .eq('id', id)
    
    if (error) {
      if (error.code === '23503' || error.message?.includes('foreign key') || error.message?.includes('violates foreign key')) {
        throw new Error('No se puede eliminar este usuario porque tiene registros históricos asociados (turnos, consumos o limpiezas). Puedes desactivarlo en su lugar para impedir su acceso.')
      }
      throw new Error(error.message || 'Error al eliminar usuario')
    }
  }
}
