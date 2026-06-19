import { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTurnoActivo } from '../hooks/useTurnoActivo'
import { useDetalleHabitacion } from '../hooks/useDetalleHabitacion'

import PanelHuespedActivo from '../components/DetalleHabitacion/PanelHuespedActivo'
import PanelLimpieza from '../components/DetalleHabitacion/PanelLimpieza'
import ConfigHabitacion from '../components/DetalleHabitacion/ConfigHabitacion'

const colores = {
  disponible:         'bg-green-100 border-green-400 text-green-900',
  ocupada:            'bg-red-100 border-red-400 text-red-900',
  pendiente_limpieza: 'bg-yellow-100 border-yellow-400 text-yellow-900',
  en_limpieza:        'bg-yellow-100 border-yellow-400 text-yellow-900',
  limpieza_simple:    'bg-yellow-100 border-yellow-400 text-yellow-900',
  habilitada:         'bg-green-100 border-green-400 text-green-900',
  mantenimiento:      'bg-gray-100 border-gray-400 text-gray-700',
}

const etiquetas = {
  disponible:         'Disponible',
  ocupada:            'Ocupada',
  pendiente_limpieza: 'Pend. limpieza Total',
  en_limpieza:        'En limpieza',
  limpieza_simple:    'Limp. simple',
  habilitada:         'Habilitada',
  mantenimiento:      'Mantenimiento',
}

function DetalleHabitacion() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { turnoActivo } = useTurnoActivo()
  
  const {
    cargando, hab, hospedaje, huesped, pagos, consumos,
    hospedajeFinalizado, cargarDatos, registrarPago, registrarPenalidad,
    extenderEstadia, actualizarHabitacion, hacerCheckout,
    registrarCobroAdicional, reabrirHospedaje
  } = useDetalleHabitacion()

  useEffect(() => {
    cargarDatos(id)
  }, [id, cargarDatos])

  async function cambiarEstadoHab(estado) {
    if (!confirm(`¿Cambiar estado a "${estado}"?`)) return
    await actualizarHabitacion({ estado })
  }

  if (cargando) return <div className="p-4 text-gray-500">Cargando datos de la habitación...</div>
  if (!hab) return <div className="p-4 text-red-500">Habitación no encontrada</div>

  return (
    <div className="p-4 max-w-3xl mx-auto">
      <button onClick={() => navigate('/')} className="mb-4 text-sm text-blue-600 hover:underline">
        ← Volver
      </button>

      <div className={`border rounded-xl p-4 mb-4 shadow-sm ${colores[hab.estado]}`}>
        <div className="text-3xl font-bold">Hab {hab.numero}</div>
        <div className="text-sm mt-1">{hab.tipo_actual} · S/{hab.precio_actual}</div>
        <div className="text-xs mt-2 font-medium">{etiquetas[hab.estado]}</div>
      </div>

      {hab.estado === 'disponible' && (
        <button onClick={() => navigate(`/checkin/${hab.id}`)}
          className="w-full py-3 bg-green-600 text-white rounded-xl font-semibold shadow-sm hover:bg-green-700 transition-colors">
          Nuevo check-in
        </button>
      )}

      {hab.estado === 'ocupada' && hospedaje && (
        <PanelHuespedActivo 
          hab={hab}
          hospedaje={hospedaje}
          huesped={huesped}
          pagos={pagos}
          consumos={consumos}
          turnoActivo={turnoActivo}
          registrarPago={registrarPago}
          registrarPenalidad={registrarPenalidad}
          extenderEstadia={extenderEstadia}
          hacerCheckout={hacerCheckout}
        />
      )}

      {['pendiente_limpieza', 'en_limpieza', 'limpieza_simple'].includes(hab.estado) && (
        <PanelLimpieza 
          hab={hab}
          hospedajeFinalizado={hospedajeFinalizado}
          turnoActivo={turnoActivo}
          registrarCobroAdicional={registrarCobroAdicional}
          reabrirHospedaje={reabrirHospedaje}
        />
      )}

      {hab.estado === 'mantenimiento' && (
        <div className="bg-white rounded-xl border p-4 shadow-sm">
          <p className="text-gray-600 text-sm font-medium">En mantenimiento</p>
        </div>
      )}

      <ConfigHabitacion 
        hab={hab} 
        actualizarHabitacion={actualizarHabitacion} 
        cambiarEstadoHab={cambiarEstadoHab} 
      />
    </div>
  )
}

export default DetalleHabitacion