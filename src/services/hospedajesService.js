import { supabase } from '../lib/supabase'

export const hospedajesService = {
  async crearCheckIn(datos) {
    const { 
      clienteId, 
      habitacionId, 
      turnoId, 
      reservaId, 
      ingreso, 
      salida_estimada, 
      tarifa_pactada, 
      metodo_pago, 
      estado_pago, 
      comprobante, 
      ruc, 
      observaciones, 
      monto_early,
      montoPagado,
      cajaTurnoActual,
      nroTicket
    } = datos

    // 1. Si viene de una reserva, actualizar estado
    if (reservaId) {
      const { error: errRes } = await supabase
        .from('reservas')
        .update({ estado: 'convertida' })
        .eq('id', reservaId)
      if (errRes) throw new Error('Error al actualizar reserva: ' + errRes.message)
    }

    // 2. Crear hospedaje
    const { data: hospedaje, error: errHosp } = await supabase
      .from('hospedajes')
      .insert({
        habitacion_id: habitacionId,
        turno_id: turnoId,
        ingreso,
        salida_estimada,
        tarifa_pactada,
        metodo_pago,
        estado_pago,
        comprobante,
        ruc,
        observaciones,
        estado: 'activo',
        early_checkin: monto_early > 0,
        monto_early
      })
      .select()
      .single()
    if (errHosp) throw new Error('Error al crear hospedaje: ' + errHosp.message)

    // 3. Vincular huésped
    const { error: errVinc } = await supabase.from('huesped_hospedaje').insert({
      hospedaje_id: hospedaje.id,
      cliente_id: clienteId,
      es_titular: true
    })
    if (errVinc) throw new Error('Error al vincular huésped: ' + errVinc.message)

    // 4. Registrar pago si hay
    if (montoPagado > 0) {
      const { error: errPago } = await supabase.from('pagos').insert({
        hospedaje_id: hospedaje.id,
        monto: montoPagado,
        metodo: metodo_pago,
        concepto: 'hospedaje',
        observaciones: nroTicket
      })
      if (errPago) throw new Error('Error al registrar pago: ' + errPago.message)

      // 5. Actualizar caja del turno activo
      const { error: errTurno } = await supabase
        .from('turnos')
        .update({
          caja_principal_actual: cajaTurnoActual + montoPagado
        })
        .eq('id', turnoId)
      if (errTurno) throw new Error('Error al actualizar caja: ' + errTurno.message)
    }

    // 6. Cambiar estado habitación
    const { error: errHab } = await supabase
      .from('habitaciones')
      .update({ estado: 'ocupada' })
      .eq('id', habitacionId)
    if (errHab) throw new Error('Error al actualizar habitación: ' + errHab.message)

    return hospedaje
  }
}
