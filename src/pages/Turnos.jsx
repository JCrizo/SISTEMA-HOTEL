import { useEffect } from 'react'
import { useTurnos } from '../hooks/useTurnos'

import ReporteTurnoAnterior from '../components/Turnos/ReporteTurnoAnterior'
import AbrirTurno from '../components/Turnos/AbrirTurno'
import TurnoActivo from '../components/Turnos/TurnoActivo'
import CerrarTurno from '../components/Turnos/CerrarTurno'

export default function Turnos() {
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
      <div className="flex flex-col justify-center items-center h-80 gap-3">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
        <span className="text-sm text-gray-400 font-semibold">Cargando datos de caja...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header Integrado sin botón 'Volver' redundante */}
      <div>
        <h1 className="text-2xl font-black text-gray-800 tracking-tight">Control de Caja y Turnos</h1>
        <p className="text-xs sm:text-sm text-gray-500 font-medium">
          Supervisa el flujo de dinero, apertura y cierre de jornada, y desglose de pagos
        </p>
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
