export default function DeudasPendientes({ deudasPendientes, totalDeudas }) {
  if (deudasPendientes.length === 0) return null

  return (
    <div className="bg-red-50 rounded-2xl shadow-sm border border-red-100 p-6 mb-6">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="text-lg font-bold text-red-800 flex items-center gap-2">
            ⚠️ Deudas Pendientes
          </h3>
          <p className="text-sm text-red-600">Hospedajes activos por cobrar</p>
        </div>
        <span className="text-xl font-black text-red-700 bg-red-100 px-4 py-1.5 rounded-full">
          S/{totalDeudas.toFixed(2)}
        </span>
      </div>

      <div className="space-y-2">
        {deudasPendientes.map(h => (
          <div key={h.id} className="flex justify-between items-center bg-white p-3 rounded-xl border border-red-100 shadow-sm">
            <div>
              <p className="text-sm font-bold text-gray-800">
                Hab {h.habitaciones?.numero} <span className="text-gray-400 font-normal ml-1">— {h.huesped_hospedaje?.[0]?.clientes?.nombres || 'Sin nombre'}</span>
              </p>
              <p className="text-xs text-red-500 font-medium mt-0.5 flex items-center gap-1">
                📅 Vence: {new Date(h.salida_estimada).toLocaleDateString('es-PE')}
              </p>
            </div>
            <div className="text-right">
              <span className="text-sm font-black text-red-600">S/{h.tarifa_pactada}</span>
              <p className="text-[10px] font-bold text-red-400 uppercase tracking-wider mt-0.5">
                {h.estado_pago === 'parcial' ? 'Pago Incompleto' : 'Sin Pagar'}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
