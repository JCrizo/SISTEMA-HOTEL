import { supabase } from '../lib/supabase'

export const clientesService = {
  async buscarPorDniPasaporte(dniPasaporte) {
    const { data, error } = await supabase
      .from('clientes')
      .select('*')
      .eq('dni_pasaporte', dniPasaporte)
      .single()
    
    // Si no lo encuentra, devuelve nulo, no lanzamos error
    if (error && error.code !== 'PGRST116') {
      throw new Error(error.message)
    }
    return data || null
  },

  async crearCliente(clienteData) {
    const { data, error } = await supabase
      .from('clientes')
      .insert(clienteData)
      .select()
      .single()
    
    if (error) throw new Error(error.message)
    return data
  },

  async actualizarCliente(id, clienteData) {
    const { error } = await supabase
      .from('clientes')
      .update(clienteData)
      .eq('id', id)
    
    if (error) throw new Error(error.message)
    return true
  }
}
