export default function DesgloseIngresos({ stats, totalIngresos }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 h-full flex flex-col">
      <div className="mb-4">
        <h3 className="text-lg font-bold text-gray-800">Desglose de Ingresos</h3>
        <p className="text-sm text-gray-500">Distribución de las ganancias</p>
      </div>

      <div className="space-y-4 flex-1">
        <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm font-bold text-gray-600 flex items-center gap-2">🛏️ Hospedaje</span>
            <span className="font-black text-gray-800">S/{stats.ingresosHospedaje.toFixed(2)}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
            <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${totalIngresos > 0 ? (stats.ingresosHospedaje / totalIngresos) * 100 : 0}%` }}></div>
          </div>
        </div>

        <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm font-bold text-gray-600 flex items-center gap-2">🍔 Consumos</span>
            <span className="font-black text-gray-800">S/{stats.ingresosConsumos.toFixed(2)}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
            <div className="bg-orange-500 h-1.5 rounded-full" style={{ width: `${totalIngresos > 0 ? (stats.ingresosConsumos / totalIngresos) * 100 : 0}%` }}></div>
          </div>
        </div>

        <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm font-bold text-gray-600 flex items-center gap-2">🚗 Cochera</span>
            <span className="font-black text-gray-800">S/{stats.ingresosCochera.toFixed(2)}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
            <div className="bg-purple-500 h-1.5 rounded-full" style={{ width: `${totalIngresos > 0 ? (stats.ingresosCochera / totalIngresos) * 100 : 0}%` }}></div>
          </div>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center">
        <span className="text-sm font-bold text-gray-500 uppercase tracking-widest">Total</span>
        <span className="text-2xl font-black text-green-700">S/{totalIngresos.toFixed(2)}</span>
      </div>
    </div>
  )
}
