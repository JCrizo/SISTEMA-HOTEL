import { supabase } from '../lib/supabase'

export const limpiezaService = {
  async obtenerHabitacionesEnLimpieza() {
    const { data, error } = await supabase
      .from('habitaciones')
      .select('*')
      .in('estado', ['pendiente_limpieza', 'en_limpieza', 'limpieza_simple'])
      .order('numero')
    
    if (error) throw new Error(error.message)
    return data || []
  },

  async obtenerTodasLasHabitaciones() {
    const { data, error } = await supabase
      .from('habitaciones')
      .select(`
        *,
        hospedajes(id, ingreso, estado, huesped_hospedaje(clientes(nombres))),
        limpieza(id, estado, hora, observaciones)
      `)
      .order('numero')

    if (error) throw new Error(error.message)

    return (data || []).map(h => ({
      ...h,
      hospedajeActivo: h.hospedajes?.find(hh => hh.estado === 'activo') || null,
      limpiezaActiva: h.limpieza?.find(l => l.estado === 'en_proceso') || null
    }))
  },

  async registrarInicioLimpieza(datos) {
    const { habitacionId, usuarioId, tipo, tipoLimpiezaId, hora, observaciones } = datos
    const { data, error } = await supabase
      .from('limpieza')
      .insert({
        habitacion_id: habitacionId,
        usuario_id: usuarioId,
        tipo,
        tipo_limpieza_id: tipoLimpiezaId || null,
        estado: 'en_proceso',
        hora,
        observaciones
      })
      .select()
      .single()
    
    if (error) throw new Error(error.message)
    return data
  },

  async finalizarLimpieza(habitacionId, observaciones) {
    const { data, error } = await supabase
      .from('limpieza')
      .update({ estado: 'completada', observaciones })
      .eq('habitacion_id', habitacionId)
      .eq('estado', 'en_proceso')
      .select()
    
    if (error) throw new Error(error.message)
    return data
  },

  async obtenerHistorial(fechaFiltro) {
    let query = supabase
      .from('limpieza')
      .select('*, habitaciones(numero), usuarios(nombre), tipos_limpieza(nombre)')
      .order('created_at', { ascending: false })
      .limit(100)

    if (fechaFiltro) {
      const inicio = new Date(fechaFiltro + 'T00:00:00').toISOString()
      const fin = new Date(fechaFiltro + 'T23:59:59').toISOString()
      query = query.gte('created_at', inicio).lte('created_at', fin)
    }

    const { data, error } = await query
    if (error) throw new Error(error.message)
    return data || []
  }
}
