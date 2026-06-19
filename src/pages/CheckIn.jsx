import { useEffect } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { useTurnoActivo } from '../hooks/useTurnoActivo'
import { useCheckIn } from '../hooks/useCheckIn'
import AvisoSinTurno from '../components/AvisoSinTurno'
import FormularioCheckIn from '../components/CheckIn/FormularioCheckIn'

export default function CheckIn() {
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const reservaId = searchParams.get('reserva')
  const navigate = useNavigate()

  const { turnoActivo, cargandoTurno } = useTurnoActivo()
  const { 
    hab, 
    datosIniciales, 
    cargando, 
    error, 
    setError, 
    cargarDatosCheckIn, 
    buscarCliente, 
    realizarCheckIn 
  } = useCheckIn()

  useEffect(() => {
    cargarDatosCheckIn(id, reservaId)
  }, [id, reservaId, cargarDatosCheckIn])

  if (cargandoTurno || (cargando && !hab)) {
    return <div className="p-4 text-gray-500">Cargando datos...</div>
  }

  if (!turnoActivo) {
    return <AvisoSinTurno mensaje="Debes iniciar un turno antes de registrar un check-in." />
  }

  if (!hab) {
    return <div className="p-4 text-red-500">Error: Habitación no encontrada</div>
  }

  return (
    <div className="p-4 max-w-3xl mx-auto">
      <button onClick={() => navigate(`/habitacion/${id}`)} className="mb-4 text-sm text-blue-600 hover:underline">
        ← Volver a la habitación
      </button>

      <h2 className="text-xl font-semibold mb-4 text-gray-800">
        Check-in · Hab {hab.numero}
      </h2>

      <FormularioCheckIn 
        hab={hab}
        datosIniciales={datosIniciales}
        turnoActivo={turnoActivo}
        cargando={cargando}
        error={error}
        setError={setError}
        buscarCliente={buscarCliente}
        realizarCheckIn={realizarCheckIn}
      />
    </div>
  )
}