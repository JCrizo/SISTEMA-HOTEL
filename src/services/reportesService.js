import { supabase } from '../lib/supabase'

export const reportesService = {
  async obtenerEstadisticasGlobales(fechaInicioIso, hoyInicioIso) {
    // Habitaciones
    const { data: habs } = await supabase.from('habitaciones').select('estado')
    const habitacionesOcupadas = habs?.filter(h => h.estado === 'ocupada').length || 0
    const habitacionesTotal = habs?.length || 0

    // Pagos del periodo
    const { data: pagosData } = await supabase
      .from('pagos').select('monto, concepto, created_at')
      .gte('created_at', fechaInicioIso)

    const ingresosHospedaje = pagosData
      ?.filter(p => p.concepto === 'hospedaje')
      .reduce((s, p) => s + parseFloat(p.monto), 0) || 0

    const ingresosConsumos = pagosData
      ?.filter(p => p.concepto === 'consumo')
      .reduce((s, p) => s + parseFloat(p.monto), 0) || 0

    // Cochera
    const { data: cocheraData } = await supabase
      .from('cochera').select('monto')
      .eq('estado_pago', 'pagado')
      .gte('hora_ingreso', fechaInicioIso)
    const ingresosCochera = cocheraData
      ?.reduce((s, c) => s + parseFloat(c.monto), 0) || 0

    // Checkins y checkouts hoy
    const { data: checkinsData } = await supabase
      .from('hospedajes').select('id')
      .gte('ingreso', hoyInicioIso)
    const checkinsHoy = checkinsData?.length || 0

    const { data: checkoutsData } = await supabase
      .from('hospedajes').select('id')
      .eq('estado', 'finalizado')
      .gte('salida_real', hoyInicioIso)
    const checkoutsHoy = checkoutsData?.length || 0

    // Hospedajes activos con deuda
    const { data: hospActivos } = await supabase
      .from('hospedajes')
      .select(`
        id, tarifa_pactada, estado_pago, ingreso, salida_estimada,
        habitaciones(numero, tipo_actual),
        huesped_hospedaje(clientes(nombres)),
        pagos(monto, concepto)
      `)
      .eq('estado', 'activo')
      .order('ingreso', { ascending: false })

    const hospedajesActivos = hospActivos || []

    // FIX R1: calcular saldo real = tarifa - total_pagado (excluyendo penalidades)
    const deudas = hospedajesActivos
      .filter(h => h.estado_pago !== 'pagado')
      .map(h => {
        const totalPagado = (h.pagos || [])
          .filter(p => p.concepto !== 'penalidad')
          .reduce((s, p) => s + parseFloat(p.monto), 0)
        const saldoPendiente = Math.max(0, parseFloat(h.tarifa_pactada) - totalPagado)
        return { ...h, saldo_pendiente: saldoPendiente }
      })
      .filter(h => h.saldo_pendiente > 0)

    const totalDeudas = deudas.reduce((s, h) => s + h.saldo_pendiente, 0)

    return {
      stats: {
        habitacionesOcupadas,
        habitacionesTotal,
        ingresosHospedaje,
        ingresosConsumos,
        ingresosCochera,
        deudasPendientes: totalDeudas,
        checkinsHoy,
        checkoutsHoy,
      },
      hospedajesActivos,
      deudasPendientes: deudas
    }
  }
}
