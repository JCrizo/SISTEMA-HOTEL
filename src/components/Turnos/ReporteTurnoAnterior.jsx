import { exportarCierreTurnoPDF, exportarCierreTurnoExcel } from '../../utils/exportReportes'

export default function ReporteTurnoAnterior({ turno, movimientos }) {
  if (!turno) return null

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-2xs mb-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-4 border-b border-gray-100">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-100">
              Turno Anterior
            </span>
            <span className="text-base font-black text-gray-800 capitalize">
              Turno {turno.tipo}
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-1 font-medium">
            Cerrado el {new Date(turno.cierre).toLocaleString('es-PE')} por <strong className="text-gray-700">{turno.usuarios?.nombre || 'Recepcionista'}</strong>
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => exportarCierreTurnoPDF(turno, movimientos, [], [])}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200/70 rounded-xl text-xs font-bold transition-all shadow-2xs"
            title="Exportar reporte en PDF"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span>PDF</span>
          </button>
          <button
            onClick={() => exportarCierreTurnoExcel(turno, movimientos, [], [])}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200/70 rounded-xl text-xs font-bold transition-all shadow-2xs"
            title="Exportar reporte en Excel"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span>Excel</span>
          </button>
        </div>
      </div>

      {/* Tarjetas de Físico Entregado */}
      <div className="grid grid-cols-2 gap-3 my-4">
        <div className="bg-gray-50/70 rounded-xl p-3 border border-gray-100">
          <p className="text-[11px] text-gray-500 font-bold uppercase tracking-wider mb-0.5">
            Físico Entregado (Principal)
          </p>
          <p className="text-xl font-black text-gray-800">
            S/ {parseFloat(turno.caja_principal_actual || 0).toFixed(2)}
          </p>
        </div>
        <div className="bg-gray-50/70 rounded-xl p-3 border border-gray-100">
          <p className="text-[11px] text-gray-500 font-bold uppercase tracking-wider mb-0.5">
            Físico Entregado (Consumos)
          </p>
          <p className="text-xl font-black text-gray-800">
            S/ {parseFloat(turno.caja_consumos_actual || 0).toFixed(2)}
          </p>
        </div>
      </div>

      {/* Desglose de Medios de Pago */}
      {turno.desglose_efectivo != null && (
        <div className="bg-gray-50/50 rounded-xl p-3.5 border border-gray-100 mb-3">
          <p className="text-[10px] text-gray-400 font-black uppercase tracking-wider mb-2">
            Desglose de medios de pago declarados
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <div className="flex justify-between items-center bg-white p-2 rounded-lg border border-gray-100">
              <span className="text-gray-500 font-semibold">Efectivo</span>
              <span className="font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                S/ {parseFloat(turno.desglose_efectivo || 0).toFixed(2)}
              </span>
            </div>
            {parseFloat(turno.desglose_yape || 0) > 0 && (
              <div className="flex justify-between items-center bg-white p-2 rounded-lg border border-gray-100">
                <span className="text-gray-500 font-semibold">Yape/Plin</span>
                <span className="font-bold text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded">
                  S/ {parseFloat(turno.desglose_yape).toFixed(2)}
                </span>
              </div>
            )}
            {parseFloat(turno.desglose_tarjeta || 0) > 0 && (
              <div className="flex justify-between items-center bg-white p-2 rounded-lg border border-gray-100">
                <span className="text-gray-500 font-semibold">Tarjeta</span>
                <span className="font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded">
                  S/ {parseFloat(turno.desglose_tarjeta).toFixed(2)}
                </span>
              </div>
            )}
            {parseFloat(turno.desglose_transferencia || 0) > 0 && (
              <div className="flex justify-between items-center bg-white p-2 rounded-lg border border-gray-100">
                <span className="text-gray-500 font-semibold">Transf.</span>
                <span className="font-bold text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded">
                  S/ {parseFloat(turno.desglose_transferencia).toFixed(2)}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Movimientos si hubo */}
      {movimientos.length > 0 && (
        <div className="bg-gray-50/50 rounded-xl p-3.5 border border-gray-100 mb-3">
          <p className="text-[10px] text-gray-400 font-black uppercase tracking-wider mb-2">
            Movimientos registrados ({movimientos.length})
          </p>
          <div className="space-y-2">
            {movimientos.map(mov => (
              <div key={mov.id} className="flex justify-between items-center bg-white p-2.5 rounded-lg border border-gray-100 text-xs">
                <div>
                  <p className="font-bold text-gray-800">{mov.concepto}</p>
                  <p className="text-[10px] text-gray-400">
                    {mov.tipo === 'prestamo_entre_cajas'
                      ? `Préstamo: ${mov.caja_origen} → ${mov.caja_destino}`
                      : `Salida de caja ${mov.caja_origen}`}
                  </p>
                </div>
                <span className="font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded">
                  − S/ {parseFloat(mov.monto).toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Observaciones */}
      {turno.observaciones && (
        <div className="bg-amber-50/70 rounded-xl p-3 border border-amber-200/60 text-xs text-amber-900">
          <strong className="block font-bold text-amber-800 mb-0.5">Observaciones de entrega:</strong>
          {turno.observaciones}
        </div>
      )}
    </div>
  )
}
