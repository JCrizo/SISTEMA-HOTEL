import { supabase } from '../lib/supabase'

export const auditoriaService = {
  /**
   * Registra una acción crítica en el historial de auditoría.
   * 
   * @param {Object} usuario - El objeto del usuario actual (debe contener id y nombre)
   * @param {string} accion - El nombre de la acción (ej: 'ANULAR_RESERVA', 'ELIMINAR_CONSUMO')
   * @param {string} modulo - El módulo donde ocurrió (ej: 'Reservas', 'Consumos', 'Caja')
   * @param {string} detalles - Descripción detallada de lo que ocurrió
   */
  async registrarAccion(usuario, accion, modulo, detalles) {
    if (!usuario) {
      console.warn('Auditoría: Intento de registrar acción sin usuario', { accion, modulo, detalles })
      return false
    }

    try {
      const { error } = await supabase
        .from('auditoria')
        .insert({
          usuario_id: usuario.id,
          usuario_nombre: usuario.nombre || 'Desconocido',
          accion,
          modulo,
          detalles: typeof detalles === 'string' ? detalles : JSON.stringify(detalles)
        })

      if (error) {
        console.error('Error al registrar auditoría:', error)
        return false
      }
      
      return true
    } catch (error) {
      console.error('Excepción al registrar auditoría:', error)
      return false
    }
  },

  /**
   * Obtiene los registros de auditoría más recientes con filtros
   */
  async obtenerLogs(filtros = {}) {
    let query = supabase
      .from('auditoria')
      .select('*')
      .order('fecha', { ascending: false })
      .limit(200)

    if (filtros.modulo) {
      query = query.eq('modulo', filtros.modulo)
    }

    if (filtros.fecha) {
      // Filtrar por fecha exacta en formato YYYY-MM-DD comparando con fecha (timestamp)
      const inicio = new Date(filtros.fecha)
      inicio.setHours(0, 0, 0, 0)
      
      const fin = new Date(filtros.fecha)
      fin.setHours(23, 59, 59, 999)
      
      query = query
        .gte('fecha', inicio.toISOString())
        .lte('fecha', fin.toISOString())
    }

    const { data, error } = await query

    if (error) throw new Error(error.message)
    
    // Suponemos que también queremos el rol del usuario, si auditoria no lo tiene lo podemos traer después, 
    // pero en el componente Auditoria lo estamos pintando como log.usuario_rol.
    // Para simplificar, obtenemos los roles de supabase 'usuarios' si hace falta.
    // De momento devolvemos la data tal cual
    return data || []
  }
}
