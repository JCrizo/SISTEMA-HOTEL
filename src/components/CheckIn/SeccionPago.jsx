export default function SeccionPago({
  tarifa, tarifaPorNoche, noches,
  modalPago, setModalPago,
  metodoPago, setMetodoPago,
  nroTicket, setNroTicket,
  adelanto, setAdelanto,
  comprobante, setComprobante,
  ruc, setRuc,
  observaciones, setObservaciones
}) {
  return (
    <section>
      <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
        <span className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-gray-600">3</span>
        Facturación y Cobro
      </h3>

      <div className="bg-gray-50 border border-gray-100 rounded-2xl p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 pb-6 border-b border-gray-200 gap-4">
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Monto Total a Pagar</p>
            <p className="text-4xl font-black text-gray-800 tracking-tighter">
              S/{parseFloat(tarifa || 0).toFixed(2)}
            </p>
            {noches > 1 && (
              <p className="text-xs font-bold text-blue-600 mt-1 bg-blue-50 px-2 py-0.5 rounded inline-block">
                S/{tarifaPorNoche || 0} × {noches} noches
              </p>
            )}
          </div>

          <div className="flex bg-white rounded-xl border-2 border-gray-100 p-1">
            {[
              { value: 'al_salir', label: 'Al Salir' },
              { value: 'adelanto', label: 'Adelanto' },
              { value: 'completo', label: 'Completo' },
            ].map(op => (
              <button
                key={op.value}
                onClick={() => setModalPago(op.value)}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                  modalPago === op.value
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-gray-500 hover:bg-gray-50'
                }`}
              >
                {op.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            {modalPago !== 'al_salir' && (
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-2">Medio de Pago</label>
                <select
                  value={metodoPago}
                  onChange={e => setMetodoPago(e.target.value)}
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-500 bg-white transition-colors font-medium"
                >
                  <option value="efectivo">💵 Efectivo</option>
                  <option value="yape">📱 Yape / Plin</option>
                  <option value="tarjeta">💳 Tarjeta (POS)</option>
                  <option value="transferencia">🏦 Transferencia</option>
                </select>
                {metodoPago === 'tarjeta' && (
                  <input
                    type="text" value={nroTicket} onChange={e => setNroTicket(e.target.value)}
                    placeholder="Nro de ticket (opcional)"
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-500 bg-white transition-colors mt-2"
                  />
                )}
              </div>
            )}

            {modalPago === 'adelanto' && (
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-2 text-blue-700">
                  Monto del Adelanto (S/)
                </label>
                <input
                  type="number" value={adelanto} onChange={e => setAdelanto(e.target.value)}
                  placeholder="0.00"
                  className="w-full border-2 border-blue-200 rounded-xl px-4 py-2.5 text-lg font-bold text-blue-900 outline-none focus:border-blue-500 bg-blue-50 transition-colors"
                />
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-2">Comprobante a emitir</label>
              <div className="flex bg-white rounded-xl border-2 border-gray-100 p-1">
                {['ninguno', 'boleta', 'factura'].map(op => (
                  <button
                    key={op}
                    onClick={() => setComprobante(op)}
                    className={`flex-1 px-2 py-2 rounded-lg text-sm font-bold capitalize transition-all ${
                      comprobante === op
                        ? 'bg-gray-800 text-white shadow-md'
                        : 'text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    {op}
                  </button>
                ))}
              </div>
              {comprobante === 'factura' && (
                <input
                  type="text" value={ruc} onChange={e => setRuc(e.target.value)}
                  placeholder="Ingrese RUC (11 dígitos)"
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-500 bg-white transition-colors mt-2"
                />
              )}
            </div>

            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1.5">Observaciones</label>
              <textarea
                value={observaciones} onChange={e => setObservaciones(e.target.value)}
                placeholder="Algún requerimiento especial..."
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-500 bg-white transition-colors h-12 resize-none"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
