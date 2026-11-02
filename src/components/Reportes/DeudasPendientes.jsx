import Icono from '../Compartido/Icono'
export default function DeudasPendientes({ deudasPendientes, totalDeudas }) {
  if (deudasPendientes.length === 0) return null

  return (
    <div className="bg-rose-50 rounded-2xl border border-rose-100 p-4 sm:p-6">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="text-lg font-bold text-rose-800 flex items-center gap-2">
            <Icono name="alert" className="w-5 h-5" /> Deudas pendientes
          </h3>
          <p className="text-sm text-rose-600">Hospedajes activos por cobrar</p>
        </div>
        <span className="text-xl font-black text-rose-700 bg-rose-100 px-4 py-1.5 rounded-full">
          S/{totalDeudas.toFixed(2)}
        </span>
      </div>

      <div className="space-y-2">
        {deudasPendientes.map(h => (
          <div key={h.id} className="flex justify-between items-center bg-white p-3 rounded-xl border border-rose-100 shadow-sm">
            <div>
              <p className="text-sm font-bold text-gray-800">
                Hab {h.habitaciones?.numero} <span className="text-gray-400 font-normal ml-1">— {h.huesped_hospedaje?.[0]?.clientes?.nombres || 'Sin nombre'}</span>
              </p>
              <p className="text-xs text-rose-500 font-medium mt-0.5 flex items-center gap-1">
                <Icono name="calendar" className="w-3.5 h-3.5" /> Vence: {new Date(h.salida_estimada).toLocaleDateString('es-PE')}
              </p>
            </div>
            <div className="text-right">
              <span className="text-sm font-black text-rose-600">S/{h.tarifa_pactada}</span>
              <p className="text-[10px] font-bold text-rose-400 uppercase tracking-wider mt-0.5">
                {h.estado_pago === 'parcial' ? 'Pago Incompleto' : 'Sin Pagar'}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
