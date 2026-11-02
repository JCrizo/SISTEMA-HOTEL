import { useEffect } from 'react'
import { useReportes } from '../hooks/useReportes'

import MetricasPrincipales from '../components/Reportes/MetricasPrincipales'
import DesgloseIngresos from '../components/Reportes/DesgloseIngresos'
import DeudasPendientes from '../components/Reportes/DeudasPendientes'
import HospedajesActivos from '../components/Reportes/HospedajesActivos'

function Reportes() {
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
    <div className="max-w-7xl mx-auto space-y-5 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="page-title">Panel de Estadísticas</h1>
          <p className="page-sub">Visualiza el rendimiento de tu negocio</p>
        </div>

        <div className="flex items-center gap-2">
          <label className="label !mb-0">Periodo</label>
          <select
            value={periodo}
            onChange={e => setPeriodo(e.target.value)}
            className="input !w-auto !py-2 font-bold"
          >
            <option value="hoy">Hoy</option>
            <option value="semana">Últimos 7 días</option>
            <option value="mes">Este mes</option>
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