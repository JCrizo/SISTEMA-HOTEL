import Icono from '../Compartido/Icono'
export default function MetricasPrincipales({ stats, totalIngresos }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
      <div className="card p-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600"><Icono name="box" className="w-4 h-4" /></div>
          <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Ocupación</p>
        </div>
        <p className="text-2xl sm:text-3xl font-black text-gray-800">
          {stats.habitacionesOcupadas}
          <span className="text-sm text-gray-400 font-medium">/{stats.habitacionesTotal}</span>
        </p>
      </div>

      <div className="card p-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600"><Icono name="cash" className="w-4 h-4" /></div>
          <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Ingresos Totales</p>
        </div>
        <p className="text-2xl sm:text-3xl font-black text-emerald-700 leading-tight">
          S/{totalIngresos.toFixed(2)}
        </p>
      </div>

      <div className="card p-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600"><Icono name="download" className="w-4 h-4" /></div>
          <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Check-ins Hoy</p>
        </div>
        <p className="text-2xl sm:text-3xl font-black text-gray-800">{stats.checkinsHoy}</p>
      </div>

      <div className="card p-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-8 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600"><Icono name="logout" className="w-4 h-4" /></div>
          <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Check-outs Hoy</p>
        </div>
        <p className="text-2xl sm:text-3xl font-black text-gray-800">{stats.checkoutsHoy}</p>
      </div>
    </div>
  )
}
