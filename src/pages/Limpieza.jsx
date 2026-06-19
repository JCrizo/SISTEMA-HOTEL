import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLimpieza } from '../hooks/useLimpieza'
import TarjetaLimpieza from '../components/Limpieza/TarjetaLimpieza'

function Limpieza() {
  const navigate = useNavigate()
  
  const {
    habitaciones,
    cargando,
    error,
    cargarHabitaciones,
    iniciarLimpieza,
    habilitarHabitacion
  } = useLimpieza()

  useEffect(() => {
    cargarHabitaciones()
  }, [cargarHabitaciones])

  if (cargando) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-500 font-medium">Cargando habitaciones...</span>
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
          <h2 className="text-2xl font-bold text-gray-800">Módulo de Limpieza</h2>
          <p className="text-sm text-gray-500">Gestiona el estado de las habitaciones pendientes</p>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl">
          <p className="font-medium text-sm">⚠ {error}</p>
        </div>
      )}

      {habitaciones.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
          <div className="text-5xl mb-4">✨</div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">¡Todo limpio!</h3>
          <p className="text-gray-500">No hay habitaciones pendientes de limpieza en este momento.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {habitaciones.map(hab => (
            <TarjetaLimpieza 
              key={hab.id}
              hab={hab}
              iniciarLimpieza={iniciarLimpieza}
              habilitarHabitacion={habilitarHabitacion}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default Limpieza