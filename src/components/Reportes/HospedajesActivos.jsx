export default function HospedajesActivos({ hospedajesActivos }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 h-full flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="text-lg font-bold text-gray-800">Hospedajes en Curso</h3>
          <p className="text-sm text-gray-500">Estado actual de las habitaciones</p>
        </div>
        <span className="text-sm font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
          {hospedajesActivos.length} activos
        </span>
      </div>

      {hospedajesActivos.length === 0 ? (
        <div className="flex-1 flex items-center justify-center border-2 border-dashed border-gray-100 rounded-xl p-6">
          <p className="text-sm text-gray-400 font-medium">No hay hospedajes activos en este momento.</p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto pr-2 space-y-3 max-h-[400px]">
          {hospedajesActivos.map(h => (
            <div key={h.id} className="flex justify-between items-center p-3 hover:bg-gray-50 border border-gray-50 rounded-xl transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-black text-sm">
                  {h.habitaciones?.numero}
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-800 line-clamp-1">
                    {h.huesped_hospedaje?.[0]?.clientes?.nombres || 'Huésped no registrado'}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {h.habitaciones?.tipo_actual}
                  </p>
                </div>
              </div>
              <div className="text-right flex flex-col items-end gap-1">
                <p className="text-sm font-black text-gray-800">S/{h.tarifa_pactada}</p>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                  h.estado_pago === 'pagado' ? 'bg-green-100 text-green-700' :
                  h.estado_pago === 'parcial' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  {h.estado_pago === 'pagado' ? 'Pagado' :
                   h.estado_pago === 'parcial' ? 'A cuenta' : 'Pendiente'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
