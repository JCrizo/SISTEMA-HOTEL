import { supabase } from '../lib/supabase'

export const hospedajesService = {
  async crearCheckIn(datos) {
    const { 
      clienteId, habitacionId, turnoId, reservaId, ingreso, salida_estimada, 
      tarifa_pactada, metodo_pago, estado_pago, comprobante, ruc, observaciones, 
      monto_early, montoPagado, cajaTurnoActual, nroTicket
    } = datos

    // ── GUARD 1: verificar que la habitación sigue disponible ──────────────
    const { data: habActual, error: errHabCheck } = await supabase
      .from('habitaciones')
      .select('estado, numero')
      .eq('id', habitacionId)
      .single()
    if (errHabCheck) throw new Error('No se pudo verificar el estado de la habitación')
    if (habActual.estado !== 'disponible') {
      throw new Error(`La habitación ${habActual.numero} ya no está disponible (estado: ${habActual.estado}). Recarga la página e intenta de nuevo.`)
    }

    // ── GUARD 2: verificar que la reserva sigue pendiente (si aplica) ──────
    let nro_ficha = undefined
    if (reservaId) {
      const { data: resActual, error: errResCheck } = await supabase
        .from('reservas')
        .select('estado, nro_ficha')
        .eq('id', reservaId)
        .single()
      if (errResCheck) throw new Error('No se pudo verificar el estado de la reserva')
      if (!['pendiente', 'confirmada'].includes(resActual.estado)) {
        throw new Error(`Esta reserva ya fue procesada (estado: ${resActual.estado}). Recarga la página.`)
      }
      if (resActual.nro_ficha) {
        nro_ficha = resActual.nro_ficha
      }
    }

    // ── Crear hospedaje ────────────────────────────────────────────────────
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

    // ── Vincular titular ───────────────────────────────────────────────────
    const { error: errVinc } = await supabase.from('huesped_hospedaje').insert({
      hospedaje_id: hospedaje.id, cliente_id: clienteId, es_titular: true
    })
    if (errVinc) throw new Error('Error al vincular huésped titular: ' + errVinc.message)

    // ── Vincular acompañantes ──────────────────────────────────────────────
    if (datos.acompanantesIds && datos.acompanantesIds.length > 0) {
      const inserts = datos.acompanantesIds.map(acId => ({
        hospedaje_id: hospedaje.id, cliente_id: acId, es_titular: false
      }))
      const { error: errAcomp } = await supabase.from('huesped_hospedaje').insert(inserts)
      if (errAcomp) throw new Error('Error al vincular acompañantes: ' + errAcomp.message)
    }

    // ── Registrar pago inicial ─────────────────────────────────────────────
    if (montoPagado > 0) {
      const { error: errPago } = await supabase.from('pagos').insert({
        hospedaje_id: hospedaje.id, monto: montoPagado, metodo: metodo_pago,
        concepto: 'hospedaje', observaciones: nroTicket,
        turno_id: turnoId   // FIX: vincular pago al turno para que aparezca en detalle de caja
      })
      if (errPago) throw new Error('Error al registrar pago: ' + errPago.message)

      const { error: errTurno } = await supabase.from('turnos')
        .update({ caja_principal_actual: cajaTurnoActual + montoPagado })
        .eq('id', turnoId)
      if (errTurno) throw new Error('Error al actualizar caja: ' + errTurno.message)
    }

    // ── Marcar habitación como ocupada ─────────────────────────────────────
    const { error: errHab } = await supabase
      .from('habitaciones').update({ estado: 'ocupada' }).eq('id', habitacionId)
    if (errHab) throw new Error('Error al actualizar habitación: ' + errHab.message)

    // ── Marcar reserva como convertida AL FINAL (después de todo lo anterior) ──
    if (reservaId) {
      const { error: errRes } = await supabase
        .from('reservas').update({ estado: 'convertida' }).eq('id', reservaId)
      if (errRes) throw new Error('Error al actualizar reserva: ' + errRes.message)
    } else {
      // Bug 3 FIX: check-in directo sin reservaId — limpiar reservas huérfanas
      // Si hay una reserva pendiente/confirmada para esta habitación hoy, marcarla convertida
      const today = new Date().toISOString().split('T')[0]
      await supabase
        .from('reservas')
        .update({ estado: 'convertida' })
        .eq('habitacion_id', habitacionId)
        .in('estado', ['pendiente', 'confirmada'])
        .gte('fecha_llegada', today + 'T00:00:00')
        .lte('fecha_llegada', today + 'T23:59:59')
    }

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

  async actualizarFechaIngreso(hospedajeId, nuevaFechaIso) {
    const { error } = await supabase
      .from('hospedajes')
      .update({ ingreso: nuevaFechaIso })
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
    const { data: nuevaHab, error: errVerif } = await supabase
      .from('habitaciones')
      .select('estado, numero')
      .eq('id', newHabitacionId)
      .single()
    if (errVerif) throw new Error('No se pudo verificar el estado de la habitación')
    if (nuevaHab.estado !== 'disponible') {
      throw new Error(`La Hab ${nuevaHab.numero} ya no está disponible (estado actual: ${nuevaHab.estado}). Por favor elige otra.`)
    }

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

    const { error: errOldHab } = await supabase
      .from('habitaciones')
      .update({ estado: 'pendiente_limpieza' })
      .eq('id', oldHabitacionId)
    if (errOldHab) throw new Error('Error actualizando habitación anterior: ' + errOldHab.message)

    const { error: errNewHab } = await supabase
      .from('habitaciones')
      .update({ estado: 'ocupada' })
      .eq('id', newHabitacionId)
    if (errNewHab) throw new Error('Error ocupando nueva habitación: ' + errNewHab.message)

    return true
  }
}


