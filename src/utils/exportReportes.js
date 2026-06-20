import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import * as XLSX from 'xlsx'

const NOMBRES_PERIODO = {
  hoy: 'Hoy',
  semana: 'Últimos 7 días',
  mes: 'Este mes',
}

/**
 * Agrupa los pagos e ingresos de cochera por día (fecha local, YYYY-MM-DD).
 * Devuelve un array ordenado de más reciente a más antiguo:
 * [{ fecha, hospedaje, consumos, cochera, total }]
 */
export function agruparIngresosPorDia(pagosDetalle, cocheraDetalle) {
  const dias = {}

  function asegurarDia(fechaIso) {
    const fecha = fechaIso.split('T')[0]
    if (!dias[fecha]) {
      dias[fecha] = { fecha, hospedaje: 0, consumos: 0, cochera: 0 }
    }
    return dias[fecha]
  }

  pagosDetalle.forEach(p => {
    const dia = asegurarDia(p.created_at)
    const monto = parseFloat(p.monto) || 0
    if (p.concepto === 'hospedaje') dia.hospedaje += monto
    else if (p.concepto === 'consumo') dia.consumos += monto
  })

  cocheraDetalle.forEach(c => {
    const dia = asegurarDia(c.hora_ingreso)
    dia.cochera += parseFloat(c.monto) || 0
  })

  return Object.values(dias)
    .map(d => ({ ...d, total: d.hospedaje + d.consumos + d.cochera }))
    .sort((a, b) => b.fecha.localeCompare(a.fecha))
}

function formatearFecha(fechaIso) {
  return new Date(fechaIso + 'T00:00:00').toLocaleDateString('es-PE', {
    weekday: 'short', day: '2-digit', month: 'short', year: 'numeric'
  })
}

function etiquetaTipoMovimientoStock(tipo) {
  if (tipo === 'consumo') return 'Consumo'
  if (tipo === 'reposicion_consumo_eliminado') return 'Repuesto (consumo eliminado)'
  return 'Ajuste manual'
}

/* ---------------------------------------------------------------------- */
/* Reporte General (resumen del período + desglose por día)                */
/* ---------------------------------------------------------------------- */

export function exportarReporteGeneralPDF(stats, periodo, ingresosPorDia) {
  const doc = new jsPDF()
  const fechaGeneracion = new Date().toLocaleString('es-PE')

  doc.setFontSize(16)
  doc.text('Reporte General del Hotel', 14, 18)
  doc.setFontSize(10)
  doc.setTextColor(100)
  doc.text(`Período: ${NOMBRES_PERIODO[periodo] || periodo}  ·  Generado: ${fechaGeneracion}`, 14, 25)

  autoTable(doc, {
    startY: 32,
    head: [['Concepto', 'Monto (S/)']],
    body: [
      ['Hospedaje', stats.ingresosHospedaje?.toFixed(2) || '0.00'],
      ['Consumos', stats.ingresosConsumos?.toFixed(2) || '0.00'],
      ['Cochera', stats.ingresosCochera?.toFixed(2) || '0.00'],
      ['Total', stats.totalIngresos?.toFixed(2) || '0.00'],
    ],
    theme: 'grid',
    headStyles: { fillColor: [37, 99, 235] },
  })

  autoTable(doc, {
    startY: doc.lastAutoTable.finalY + 8,
    head: [['Medio de pago', 'Monto (S/)']],
    body: [
      ['Efectivo', stats.totalEfectivo?.toFixed(2) || '0.00'],
      ['Yape', stats.totalYape?.toFixed(2) || '0.00'],
      ['Tarjeta', stats.totalTarjeta?.toFixed(2) || '0.00'],
      ['Transferencia', stats.totalTransferencia?.toFixed(2) || '0.00'],
    ],
    theme: 'grid',
    headStyles: { fillColor: [37, 99, 235] },
  })

  autoTable(doc, {
    startY: doc.lastAutoTable.finalY + 8,
    head: [['Fecha', 'Hospedaje', 'Consumos', 'Cochera', 'Total']],
    body: ingresosPorDia.map(d => [
      formatearFecha(d.fecha),
      `S/${d.hospedaje.toFixed(2)}`,
      `S/${d.consumos.toFixed(2)}`,
      `S/${d.cochera.toFixed(2)}`,
      `S/${d.total.toFixed(2)}`,
    ]),
    theme: 'grid',
    headStyles: { fillColor: [22, 163, 74] },
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 4) {
        data.cell.styles.fontStyle = 'bold'
      }
    },
  })

  doc.save(`reporte-general-${periodo}-${new Date().toISOString().split('T')[0]}.pdf`)
}

export function exportarReporteGeneralExcel(stats, periodo, ingresosPorDia) {
  const wb = XLSX.utils.book_new()

  const resumenData = [
    ['Reporte General del Hotel'],
    [`Período: ${NOMBRES_PERIODO[periodo] || periodo}`],
    [`Generado: ${new Date().toLocaleString('es-PE')}`],
    [],
    ['Concepto', 'Monto (S/)'],
    ['Hospedaje', stats.ingresosHospedaje || 0],
    ['Consumos', stats.ingresosConsumos || 0],
    ['Cochera', stats.ingresosCochera || 0],
    ['Total', stats.totalIngresos || 0],
    [],
    ['Medio de pago', 'Monto (S/)'],
    ['Efectivo', stats.totalEfectivo || 0],
    ['Yape', stats.totalYape || 0],
    ['Tarjeta', stats.totalTarjeta || 0],
    ['Transferencia', stats.totalTransferencia || 0],
  ]
  const wsResumen = XLSX.utils.aoa_to_sheet(resumenData)
  XLSX.utils.book_append_sheet(wb, wsResumen, 'Resumen')

  const diasData = [
    ['Fecha', 'Hospedaje (S/)', 'Consumos (S/)', 'Cochera (S/)', 'Total (S/)'],
    ...ingresosPorDia.map(d => [
      formatearFecha(d.fecha), d.hospedaje, d.consumos, d.cochera, d.total
    ])
  ]
  const wsDias = XLSX.utils.aoa_to_sheet(diasData)
  XLSX.utils.book_append_sheet(wb, wsDias, 'Ingresos por día')

  XLSX.writeFile(wb, `reporte-general-${periodo}-${new Date().toISOString().split('T')[0]}.xlsx`)
}

/* ---------------------------------------------------------------------- */
/* Cierre de turno (detalle de caja + movimientos)                         */
/* ---------------------------------------------------------------------- */

export function exportarCierreTurnoPDF(turno, movimientosCaja, movimientosStock, hospedajesTurno) {
  const doc = new jsPDF()

  doc.setFontSize(16)
  doc.text('Cierre de Turno', 14, 18)
  doc.setFontSize(10)
  doc.setTextColor(100)
  doc.text(
    `Turno: ${turno.tipo}  ·  Responsable: ${turno.usuarios?.nombre || '-'}`,
    14, 25
  )
  doc.text(
    `Apertura: ${new Date(turno.apertura).toLocaleString('es-PE')}` +
    (turno.cierre ? `  ·  Cierre: ${new Date(turno.cierre).toLocaleString('es-PE')}` : ''),
    14, 30
  )

  autoTable(doc, {
    startY: 37,
    head: [['Caja', 'Monto inicial', 'Monto final']],
    body: [
      ['Principal', `S/${parseFloat(turno.caja_principal_anterior || 0).toFixed(2)}`, `S/${parseFloat(turno.caja_principal_actual || 0).toFixed(2)}`],
      ['Consumos', `S/${parseFloat(turno.caja_consumos_anterior || 0).toFixed(2)}`, `S/${parseFloat(turno.caja_consumos_actual || 0).toFixed(2)}`],
    ],
    theme: 'grid',
    headStyles: { fillColor: [37, 99, 235] },
  })

  if (movimientosCaja.length > 0) {
    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 8,
      head: [['Movimientos de caja', 'Detalle', 'Monto']],
      body: movimientosCaja.map(m => [
        m.concepto || '-',
        m.tipo === 'prestamo_entre_cajas' ? `${m.caja_origen} → ${m.caja_destino}` : `Salida ${m.caja_origen}`,
        `-S/${parseFloat(m.monto).toFixed(2)}`
      ]),
      theme: 'grid',
      headStyles: { fillColor: [220, 38, 38] },
    })
  }

  if (movimientosStock.length > 0) {
    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 8,
      head: [['Producto', 'Tipo', 'Cantidad']],
      body: movimientosStock.map(m => [
        m.productos?.nombre || 'Producto eliminado',
        etiquetaTipoMovimientoStock(m.tipo),
        m.cantidad > 0 ? `+${m.cantidad}` : `${m.cantidad}`
      ]),
      theme: 'grid',
      headStyles: { fillColor: [234, 88, 12] },
    })
  }

  if (hospedajesTurno.length > 0) {
    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 8,
      head: [['N° Ficha', 'Huésped', 'Habitación', 'Estado', 'Monto']],
      body: hospedajesTurno.map(h => [
        String(h.nro_ficha).padStart(6, '0'),
        h.huesped_hospedaje?.[0]?.clientes?.nombres || '-',
        h.habitaciones?.numero || '-',
        h.estado === 'activo' ? 'Ocupada' : 'Checkout',
        `S/${parseFloat(h.tarifa_pactada || 0).toFixed(2)}`
      ]),
      theme: 'grid',
      headStyles: { fillColor: [22, 163, 74] },
    })
  }

  const fechaArchivo = turno.cierre
    ? new Date(turno.cierre).toISOString().split('T')[0]
    : new Date(turno.apertura).toISOString().split('T')[0]
  doc.save(`cierre-turno-${turno.tipo}-${fechaArchivo}.pdf`)
}

export function exportarCierreTurnoExcel(turno, movimientosCaja, movimientosStock, hospedajesTurno) {
  const wb = XLSX.utils.book_new()

  const resumenData = [
    ['Cierre de Turno'],
    [`Turno: ${turno.tipo}`],
    [`Responsable: ${turno.usuarios?.nombre || '-'}`],
    [`Apertura: ${new Date(turno.apertura).toLocaleString('es-PE')}`],
    [turno.cierre ? `Cierre: ${new Date(turno.cierre).toLocaleString('es-PE')}` : 'Turno aún abierto'],
    [],
    ['Caja', 'Monto inicial (S/)', 'Monto final (S/)'],
    ['Principal', parseFloat(turno.caja_principal_anterior || 0), parseFloat(turno.caja_principal_actual || 0)],
    ['Consumos', parseFloat(turno.caja_consumos_anterior || 0), parseFloat(turno.caja_consumos_actual || 0)],
  ]
  const wsResumen = XLSX.utils.aoa_to_sheet(resumenData)
  XLSX.utils.book_append_sheet(wb, wsResumen, 'Resumen')

  if (movimientosCaja.length > 0) {
    const movData = [
      ['Concepto', 'Detalle', 'Monto (S/)'],
      ...movimientosCaja.map(m => [
        m.concepto || '-',
        m.tipo === 'prestamo_entre_cajas' ? `${m.caja_origen} → ${m.caja_destino}` : `Salida ${m.caja_origen}`,
        -parseFloat(m.monto)
      ])
    ]
    const wsMov = XLSX.utils.aoa_to_sheet(movData)
    XLSX.utils.book_append_sheet(wb, wsMov, 'Movimientos caja')
  }

  if (movimientosStock.length > 0) {
    const stockData = [
      ['Producto', 'Tipo', 'Cantidad'],
      ...movimientosStock.map(m => [
        m.productos?.nombre || 'Producto eliminado',
        etiquetaTipoMovimientoStock(m.tipo),
        m.cantidad
      ])
    ]
    const wsStock = XLSX.utils.aoa_to_sheet(stockData)
    XLSX.utils.book_append_sheet(wb, wsStock, 'Movimientos stock')
  }

  if (hospedajesTurno.length > 0) {
    const fichasData = [
      ['N° Ficha', 'Huésped', 'Habitación', 'Estado', 'Monto (S/)'],
      ...hospedajesTurno.map(h => [
        String(h.nro_ficha).padStart(6, '0'),
        h.huesped_hospedaje?.[0]?.clientes?.nombres || '-',
        h.habitaciones?.numero || '-',
        h.estado === 'activo' ? 'Ocupada' : 'Checkout',
        parseFloat(h.tarifa_pactada || 0)
      ])
    ]
    const wsFichas = XLSX.utils.aoa_to_sheet(fichasData)
    XLSX.utils.book_append_sheet(wb, wsFichas, 'Hospedajes')
  }

  const fechaArchivo = turno.cierre
    ? new Date(turno.cierre).toISOString().split('T')[0]
    : new Date(turno.apertura).toISOString().split('T')[0]
  XLSX.writeFile(wb, `cierre-turno-${turno.tipo}-${fechaArchivo}.xlsx`)
}
