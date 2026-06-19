import { supabase } from '../lib/supabase'

export const categoriasService = {
  async obtenerTodas() {
    const { data, error } = await supabase
      .from('categorias_producto')
      .select('*')
      .order('nombre')
    
    if (error) throw new Error(error.message)
    return data || []
  },

  async crearCategoria(nombre) {
    const { error } = await supabase.from('categorias_producto').insert({ 
      nombre: nombre.trim() 
    })
    if (error) throw new Error(error.message)
  },

  async actualizarCategoria(id, nombre) {
    const { error } = await supabase.from('categorias_producto')
      .update({ nombre: nombre.trim() })
      .eq('id', id)
    if (error) throw new Error(error.message)
  },

  async eliminarCategoria(id) {
    const { error } = await supabase.from('categorias_producto')
      .delete()
      .eq('id', id)
    if (error) throw new Error(error.message)
  }
}
