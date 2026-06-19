import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTurnos } from '../hooks/useTurnos'

import ReporteTurnoAnterior from '../components/Turnos/ReporteTurnoAnterior'
import AbrirTurno from '../components/Turnos/AbrirTurno'
import TurnoActivo from '../components/Turnos/TurnoActivo'
import CerrarTurno from '../components/Turnos/CerrarTurno'

function Turnos() {
  const navigate = useNavigate()
  
  const {
    cargando,
    turnoActivo,
    turnoAnterior,
    movimientos,
    movimientosAnterior,
    pagosTurno,
    cargarDatos,
    abrirTurno,
    registrarMovimiento,
    cerrarTurno
  } = useTurnos()

  useEffect(() => {
    cargarDatos()
  }, [cargarDatos])

  if (cargando) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-500 font-medium">Cargando datos de caja...</span>
      </div>
    )
  }

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
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
          <h2 className="text-2xl font-black text-gray-800">Control de Caja y Turnos</h2>
          <p className="text-sm text-gray-500 font-medium">Gestiona el flujo de dinero durante tu jornada</p>
        </div>
      </div>

      <ReporteTurnoAnterior 
        turno={turnoAnterior} 
        movimientos={movimientosAnterior} 
      />

      {!turnoActivo ? (
        <AbrirTurno abrirTurno={abrirTurno} />
      ) : (
        <>
          <TurnoActivo 
            turno={turnoActivo} 
            pagosTurno={pagosTurno} 
            movimientos={movimientos} 
            registrarMovimiento={registrarMovimiento}
          />
          <CerrarTurno 
            cerrarTurno={cerrarTurno} 
          />
        </>
      )}
    </div>
  )
}

export default Turnos