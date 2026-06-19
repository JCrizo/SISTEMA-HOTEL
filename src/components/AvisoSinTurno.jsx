import { useNavigate } from 'react-router-dom'

/**
 * Aviso bloqueante que se muestra en lugar del formulario/contenido
 * cuando se intenta hacer una acción sin tener un turno de caja abierto.
 */
function AvisoSinTurno({ mensaje }) {
  const navigate = useNavigate()

  return (
    <div className="p-4">
      <button onClick={() => navigate('/')} className="mb-4 text-sm text-blue-600">
        ← Volver
      </button>
      <div className="bg-yellow-50 border border-yellow-300 rounded-xl p-5 text-center">
        <p className="text-3xl mb-2">🔒</p>
        <p className="font-semibold text-yellow-900 mb-1">No hay un turno activo</p>
        <p className="text-sm text-yellow-700 mb-4">
          {mensaje || 'Debes iniciar un turno antes de poder continuar con esta acción.'}
        </p>
        <button
          onClick={() => navigate('/turnos')}
          className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold"
        >
          Ir a Turnos
        </button>
      </div>
    </div>
  )
}

export default AvisoSinTurno
