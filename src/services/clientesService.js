import { supabase } from '../lib/supabase'

export const clientesService = {
  async buscarPorDniPasaporte(dniPasaporte) {
    const { data, error } = await supabase
      .from('clientes')
      .select(`
        *,
        huesped_hospedaje (
          hospedajes (
            tarifa_pactada,
            ingreso,
            habitaciones (numero)
          )
        )
      `)
      .eq('dni_pasaporte', dniPasaporte)
      .single()
    
    // Si no lo encuentra, devuelve nulo, no lanzamos error
    if (error && error.code !== 'PGRST116') {
      throw new Error(error.message)
    }
    return data || null
  },

  async listarClientes(busqueda = '', pagina = 0, porPagina = 20) {
    let query = supabase
      .from('clientes')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })

    if (busqueda.trim()) {
      // Buscar por nombre (parcial) o por DNI (exacto parcial)
      query = query.or(`nombres.ilike.%${busqueda.trim()}%,dni_pasaporte.ilike.%${busqueda.trim()}%`)
    }

    query = query.range(pagina * porPagina, (pagina + 1) * porPagina - 1)

    const { data, count, error } = await query
    if (error) throw new Error(error.message)
    return { data: data || [], count: count || 0 }
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
  },

  async eliminarCliente(id) {
    const { error } = await supabase
      .from('clientes')
      .delete()
      .eq('id', id)
    
    if (error) throw new Error(error.message)
    return true
  }
}
