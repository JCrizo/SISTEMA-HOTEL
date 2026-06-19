import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useReportes } from '../hooks/useReportes'

import MetricasPrincipales from '../components/Reportes/MetricasPrincipales'
import DesgloseIngresos from '../components/Reportes/DesgloseIngresos'
import DeudasPendientes from '../components/Reportes/DeudasPendientes'
import HospedajesActivos from '../components/Reportes/HospedajesActivos'

function Reportes() {
  const navigate = useNavigate()
  
  const {
    cargando,
    periodo,
    setPeriodo,
    stats,
    hospedajesActivos,
    deudasPendientes,
    cargarDatos
  } = useReportes()

  useEffect(() => {
    cargarDatos()
  }, [cargarDatos])

  if (cargando) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-500 font-medium">Cargando métricas...</span>
      </div>
    )
  }

  const totalIngresos = stats.ingresosHospedaje + stats.ingresosConsumos + stats.ingresosCochera

  return (
    <div className="p-4 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/')} 
            className="p-2 rounded-full hover:bg-gray-100 text-gray-600 transition-colors"
            title="Volver"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <div>
            <h2 className="text-2xl font-black text-gray-800">Panel de Estadísticas</h2>
            <p className="text-sm text-gray-500 font-medium">Visualiza el rendimiento de tu negocio</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <label className="text-sm font-bold text-gray-500 uppercase tracking-widest">Periodo:</label>
          <select
            value={periodo}
            onChange={e => setPeriodo(e.target.value)}
            className="border-2 border-gray-200 rounded-xl px-4 py-2.5 text-sm font-bold text-gray-700 outline-none focus:border-blue-500 transition-colors bg-white shadow-sm"
          >
            <option value="hoy">📅 Hoy</option>
            <option value="semana">📆 Últimos 7 días</option>
            <option value="mes">📊 Este mes</option>
          </select>
        </div>
      </div>

      <MetricasPrincipales stats={stats} totalIngresos={totalIngresos} />

      <DeudasPendientes 
        deudasPendientes={deudasPendientes} 
        totalDeudas={stats.deudasPendientes} 
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DesgloseIngresos stats={stats} totalIngresos={totalIngresos} />
        <HospedajesActivos hospedajesActivos={hospedajesActivos} />
      </div>
    </div>
  )
}

export default Reportes