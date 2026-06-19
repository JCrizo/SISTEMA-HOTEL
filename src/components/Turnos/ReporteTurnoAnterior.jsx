import { exportarCierreTurnoPDF, exportarCierreTurnoExcel } from '../../utils/exportReportes'

export default function ReporteTurnoAnterior({ turno, movimientos }) {
  if (!turno) return null

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl p-5 mb-6 shadow-sm">
      <div className="flex justify-between items-start mb-4">
        <div>
          <p className="text-xs font-bold text-blue-800 uppercase tracking-widest mb-1">Reporte Turno Anterior</p>
          <p className="text-xl font-black text-blue-900 capitalize">{turno.tipo}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => exportarCierreTurnoPDF(turno, movimientos, [], [])}
            className="flex items-center gap-1 text-xs px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded-lg font-bold transition-colors shadow-sm"
          >
            📄 PDF
          </button>
          <button
            onClick={() => exportarCierreTurnoExcel(turno, movimientos, [], [])}
            className="flex items-center gap-1 text-xs px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold transition-colors shadow-sm"
          >
            📊 Excel
          </button>
        </div>
      </div>
      
      <div className="flex flex-col gap-1 mb-4 text-sm text-blue-800">
        <p><span className="font-semibold opacity-75">Cierre:</span> {new Date(turno.cierre).toLocaleString('es-PE')}</p>
        <p><span className="font-semibold opacity-75">Recepcionista:</span> {turno.usuarios?.nombre || 'No registrado'}</p>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-white/80 backdrop-blur-sm rounded-xl p-3 border border-blue-50 shadow-sm">
          <p className="text-xs text-blue-600/70 font-bold uppercase mb-1">Caja Principal</p>
          <p className="text-lg font-black text-blue-900">S/{turno.caja_principal_actual}</p>
        </div>
        <div className="bg-white/80 backdrop-blur-sm rounded-xl p-3 border border-blue-50 shadow-sm">
          <p className="text-xs text-blue-600/70 font-bold uppercase mb-1">Caja Consumos</p>
          <p className="text-lg font-black text-blue-900">S/{turno.caja_consumos_actual}</p>
        </div>
      </div>

      {turno.desglose_efectivo != null && (
        <div className="bg-white rounded-xl p-4 border border-blue-50 shadow-sm mb-4">
          <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-3">Medios de pago</p>
          <div className="space-y-2">
            <div className="flex justify-between text-sm items-center">
              <span className="text-gray-600 flex items-center gap-2">💵 Efectivo</span>
              <span className="font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded">S/{parseFloat(turno.desglose_efectivo || 0).toFixed(2)}</span>
            </div>
            {parseFloat(turno.desglose_yape || 0) > 0 && (
              <div className="flex justify-between text-sm items-center">
                <span className="text-gray-600 flex items-center gap-2">📱 Yape</span>
                <span className="font-bold text-gray-800">S/{parseFloat(turno.desglose_yape).toFixed(2)}</span>
              </div>
            )}
            {parseFloat(turno.desglose_tarjeta || 0) > 0 && (
              <div className="flex justify-between text-sm items-center">
                <span className="text-gray-600 flex items-center gap-2">💳 Tarjeta</span>
                <span className="font-bold text-gray-800">S/{parseFloat(turno.desglose_tarjeta).toFixed(2)}</span>
              </div>
            )}
            {parseFloat(turno.desglose_transferencia || 0) > 0 && (
              <div className="flex justify-between text-sm items-center">
                <span className="text-gray-600 flex items-center gap-2">🏦 Transf.</span>
                <span className="font-bold text-gray-800">S/{parseFloat(turno.desglose_transferencia).toFixed(2)}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {movimientos.length > 0 && (
        <div className="bg-white rounded-xl p-4 border border-blue-50 shadow-sm mb-4">
          <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-3">Movimientos</p>
          <div className="space-y-3">
            {movimientos.map(mov => (
              <div key={mov.id} className="flex justify-between items-start pb-2 border-b border-gray-50 last:border-0 last:pb-0">
                <div>
                  <p className="text-sm font-semibold text-gray-800">{mov.concepto}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {mov.tipo === 'prestamo_entre_cajas'
                      ? `Préstamo: ${mov.caja_origen} → ${mov.caja_destino}`
                      : `Salida de caja ${mov.caja_origen}`}
                  </p>
                </div>
                <span className="text-sm font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded">− S/{mov.monto}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {turno.observaciones && (
        <div className="bg-yellow-50 rounded-xl p-3 border border-yellow-100">
          <p className="text-xs text-yellow-800 font-bold uppercase mb-1">Observaciones</p>
          <p className="text-sm text-yellow-900">{turno.observaciones}</p>
        </div>
      )}
    </div>
  )
}
