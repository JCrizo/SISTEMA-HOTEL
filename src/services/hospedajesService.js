import { supabase } from '../lib/supabase'

export const hospedajesService = {
  async crearCheckIn(datos) {
    const { 
      clienteId, habitacionId, turnoId, reservaId, ingreso, salida_estimada, 
      tarifa_pactada, metodo_pago, estado_pago, comprobante, ruc, observaciones, 
      monto_early, montoPagado, cajaTurnoActual, nroTicket
    } = datos

    let nro_ficha = undefined
    if (reservaId) {
      const { data: resData } = await supabase.from('reservas').select('nro_ficha').eq('id', reservaId).single()
      if (resData && resData.nro_ficha) {
        nro_ficha = resData.nro_ficha
      }

      const { error: errRes } = await supabase.from('reservas').update({ estado: 'convertida' }).eq('id', reservaId)
      if (errRes) throw new Error('Error al actualizar reserva: ' + errRes.message)
    }

    const insertData = {
      habitacion_id: habitacionId, turno_id: turnoId, ingreso, salida_estimada, tarifa_pactada,
      metodo_pago, estado_pago, comprobante, ruc, observaciones, estado: 'activo',
      early_checkin: monto_early > 0, monto_early
    }
    if (nro_ficha) {
      insertData.nro_ficha = nro_ficha
    }

    const { data: hospedaje, error: errHosp } = await supabase
      .from('hospedajes')
      .insert(insertData)
      .select().single()
    if (errHosp) throw new Error('Error al crear hospedaje: ' + errHosp.message)

    // Insertar titular
    const { error: errVinc } = await supabase.from('huesped_hospedaje').insert({
      hospedaje_id: hospedaje.id, cliente_id: clienteId, es_titular: true
    })
    if (errVinc) throw new Error('Error al vincular huésped titular: ' + errVinc.message)

    // Insertar acompañantes
    if (datos.acompanantesIds && datos.acompanantesIds.length > 0) {
      const inserts = datos.acompanantesIds.map(acId => ({
        hospedaje_id: hospedaje.id, cliente_id: acId, es_titular: false
      }))
      const { error: errAcomp } = await supabase.from('huesped_hospedaje').insert(inserts)
      if (errAcomp) throw new Error('Error al vincular acompañantes: ' + errAcomp.message)
    }

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
      .order('ingreso', { ascending: false })
      .limit(1)
    
    if (error) throw new Error(error.message)
    return data && data.length > 0 ? data[0] : null
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

  async actualizarTarifa(hospedajeId, nuevaTarifaPactada, observacionesActuales, usuarioNombre) {
    const fecha = new Date().toLocaleString('es-PE')
    const nota = `[${fecha}] Tarifa actualizada a S/${nuevaTarifaPactada.toFixed(2)} por ${usuarioNombre || 'usuario'}.`
    const nuevasObservaciones = observacionesActuales
      ? `${observacionesActuales}\n${nota}`
      : nota

    const { error } = await supabase
      .from('hospedajes')
      .update({ tarifa_pactada: nuevaTarifaPactada, observaciones: nuevasObservaciones })
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

  async cambiarHabitacion(hospedajeId, oldHabitacionId, newHabitacionId, observacionesActuales, usuarioNombre) {
    // 0. Re-verificar en el momento exacto que la nueva habitación sigue disponible
    // (protección contra condición de carrera si dos usuarios actúan al mismo tiempo)
    const { data: nuevaHab, error: errVerif } = await supabase
      .from('habitaciones')
      .select('estado, numero')
      .eq('id', newHabitacionId)
      .single()
    if (errVerif) throw new Error('No se pudo verificar el estado de la habitación')
    if (nuevaHab.estado !== 'disponible') {
      throw new Error(`La Hab ${nuevaHab.numero} ya no está disponible (estado actual: ${nuevaHab.estado}). Por favor elige otra.`)
    }

    // 1. Mover el hospedaje a la nueva habitación dejando registro del cambio
    const fecha = new Date().toLocaleString('es-PE')
    const nota = `[${fecha}] Cambio de habitación por ${usuarioNombre || 'usuario'}.`
    const nuevasObservaciones = observacionesActuales
      ? `${observacionesActuales}\n${nota}`
      : nota

    const { error: errHosp } = await supabase
      .from('hospedajes')
      .update({ habitacion_id: newHabitacionId, observaciones: nuevasObservaciones })
      .eq('id', hospedajeId)
    if (errHosp) throw new Error('Error actualizando hospedaje: ' + errHosp.message)

    // 2. La habitación anterior pasa a pendiente de limpieza
    const { error: errOldHab } = await supabase
      .from('habitaciones')
      .update({ estado: 'pendiente_limpieza' })
      .eq('id', oldHabitacionId)
    if (errOldHab) throw new Error('Error actualizando habitación anterior: ' + errOldHab.message)

    // 3. La nueva habitación pasa a ocupada
    const { error: errNewHab } = await supabase
      .from('habitaciones')
      .update({ estado: 'ocupada' })
      .eq('id', newHabitacionId)
    if (errNewHab) throw new Error('Error ocupando nueva habitación: ' + errNewHab.message)

    return true
  }

}
