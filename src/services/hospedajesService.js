import { supabase } from '../lib/supabase'

export const hospedajesService = {
  async crearCheckIn(datos) {
    const { 
      clienteId, habitacionId, turnoId, reservaId, ingreso, salida_estimada, 
      tarifa_pactada, metodo_pago, estado_pago, comprobante, ruc, observaciones, 
      monto_early, montoPagado, cajaTurnoActual, nroTicket
    } = datos

    if (reservaId) {
      const { error: errRes } = await supabase.from('reservas').update({ estado: 'convertida' }).eq('id', reservaId)
      if (errRes) throw new Error('Error al actualizar reserva: ' + errRes.message)
    }

    const { data: hospedaje, error: errHosp } = await supabase
      .from('hospedajes')
      .insert({
        habitacion_id: habitacionId, turno_id: turnoId, ingreso, salida_estimada, tarifa_pactada,
        metodo_pago, estado_pago, comprobante, ruc, observaciones, estado: 'activo',
        early_checkin: monto_early > 0, monto_early
      })
      .select().single()
    if (errHosp) throw new Error('Error al crear hospedaje: ' + errHosp.message)

    const { error: errVinc } = await supabase.from('huesped_hospedaje').insert({
      hospedaje_id: hospedaje.id, cliente_id: clienteId, es_titular: true
    })
    if (errVinc) throw new Error('Error al vincular huésped: ' + errVinc.message)

    if (montoPagado > 0) {
      const { error: errPago } = await supabase.from('pagos').insert({
        hospedaje_id: hospedaje.id, monto: montoPagado, metodo: metodo_pago, concepto: 'hospedaje', observaciones: nroTicket
      })
      if (errPago) throw new Error('Error al registrar pago: ' + errPago.message)

      const { error: errTurno } = await supabase.from('turnos')
        .update({ caja_principal_actual: cajaTurnoActual + montoPagado })
        .eq('id', turnoId)
      if (errTurno) throw new Error('Error al actualizar caja: ' + errTurno.message)
    }

    const { error: errHab } = await supabase.from('habitaciones').update({ estado: 'ocupada' }).eq('id', habitacionId)
    if (errHab) throw new Error('Error al actualizar habitación: ' + errHab.message)

    return hospedaje
  },

  async obtenerActivoPorHabitacion(habitacionId) {
    const { data, error } = await supabase
      .from('hospedajes')
      .select('*, huesped_hospedaje(*, clientes(*))')
      .eq('habitacion_id', habitacionId)
      .eq('estado', 'activo')
      .single()
    
    if (error && error.code !== 'PGRST116') throw new Error(error.message)
    return data || null
  },

  async obtenerUltimoFinalizadoPorHabitacion(habitacionId) {
    const { data, error } = await supabase
      .from('hospedajes')
      .select('*, huesped_hospedaje(clientes(nombres, dni_pasaporte, telefono))')
      .eq('habitacion_id', habitacionId)
      .eq('estado', 'finalizado')
      .order('salida_real', { ascending: false })
      .limit(1)
      .single()
    
    if (error && error.code !== 'PGRST116') throw new Error(error.message)
    return data || null
  },

  async actualizarEstadoPago(hospedajeId, estadoPago) {
    const { error } = await supabase
      .from('hospedajes')
      .update({ estado_pago: estadoPago })
      .eq('id', hospedajeId)
    if (error) throw new Error(error.message)
  },

  async actualizarSalidaEstimada(hospedajeId, nuevaFecha) {
    const { error } = await supabase
      .from('hospedajes')
      .update({ salida_estimada: nuevaFecha })
      .eq('id', hospedajeId)
    if (error) throw new Error(error.message)
  },

  async hacerCheckout(hospedajeId, habitacionId) {
    const { error: errHosp } = await supabase
      .from('hospedajes')
      .update({ estado: 'finalizado', salida_real: new Date().toISOString() })
      .eq('id', hospedajeId)
    if (errHosp) throw new Error(errHosp.message)

    const { error: errHab } = await supabase
      .from('habitaciones')
      .update({ estado: 'pendiente_limpieza' })
      .eq('id', habitacionId)
    if (errHab) throw new Error(errHab.message)

    // Actualizar cochera si aplica (ignorar si no encuentra)
    await supabase.from('cochera')
      .update({ hora_salida: new Date().toISOString() })
      .eq('hospedaje_id', hospedajeId)
      .is('hora_salida', null)
  },

  async reabrirHospedaje(hospedajeId, habitacionId) {
    const { error: errHosp } = await supabase
      .from('hospedajes')
      .update({ estado: 'activo', salida_real: null })
      .eq('id', hospedajeId)
    if (errHosp) throw new Error(errHosp.message)

    const { error: errHab } = await supabase
      .from('habitaciones')
      .update({ estado: 'ocupada' })
      .eq('id', habitacionId)
    if (errHab) throw new Error(errHab.message)
  },

  async obtenerPorId(hospedajeId) {
    const { data, error } = await supabase
      .from('hospedajes')
      .select('*, huesped_hospedaje(clientes(*))')
      .eq('id', hospedajeId)
      .single()
    if (error) throw new Error(error.message)
    return data
  },

}
