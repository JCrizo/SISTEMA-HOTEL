export default function MetricasPrincipales({ stats, totalIngresos }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <div className="bg-white rounded-2xl shadow-sm border border-blue-50 p-5">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">🛏️</div>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Ocupación</p>
        </div>
        <p className="text-3xl font-black text-gray-800">
          {stats.habitacionesOcupadas}
          <span className="text-sm text-gray-400 font-medium">/{stats.habitacionesTotal}</span>
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-green-50 p-5">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600">💰</div>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Ingresos Totales</p>
        </div>
        <p className="text-3xl font-black text-green-700 leading-tight">
          S/{totalIngresos.toFixed(2)}
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-orange-50 p-5">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-600">📥</div>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Check-ins Hoy</p>
        </div>
        <p className="text-3xl font-black text-gray-800">{stats.checkinsHoy}</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-purple-50 p-5">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">📤</div>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Check-outs Hoy</p>
        </div>
        <p className="text-3xl font-black text-gray-800">{stats.checkoutsHoy}</p>
      </div>
    </div>
  )
}
