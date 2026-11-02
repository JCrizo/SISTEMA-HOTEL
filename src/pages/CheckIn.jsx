import { useEffect } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { useTurnoActivo } from '../hooks/useTurnoActivo'
import { useCheckIn } from '../hooks/useCheckIn'
import AvisoSinTurno from '../components/AvisoSinTurno'
import BloqueoTurnoAjeno from '../components/Compartido/BloqueoTurnoAjeno'
import FormularioCheckIn from '../components/CheckIn/FormularioCheckIn'
import EncabezadoPagina from '../components/Compartido/EncabezadoPagina'
import Icono from '../components/Compartido/Icono'

export default function CheckIn() {
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const reservaId = searchParams.get('reserva')
  const navigate = useNavigate()

  const { turnoActivo, cargandoTurno, turnoAjeno } = useTurnoActivo()
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
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (turnoAjeno) {
    return <BloqueoTurnoAjeno />
  }

  if (!turnoActivo) {
    return <AvisoSinTurno mensaje="Debes iniciar un turno antes de registrar un check-in." />
  }

  if (!hab) {
    return (
      <div className="flex items-center justify-center p-4 py-16">
        <div className="bg-rose-50 text-rose-600 p-6 rounded-2xl border border-rose-200 text-center max-w-md">
          <Icono name="alert" className="w-10 h-10 mx-auto mb-2" />
          <h2 className="text-lg font-black mb-1">Habitación no encontrada</h2>
          <p className="text-sm font-medium mb-4">No se pudo cargar la información.</p>
          <button onClick={() => navigate('/')} className="btn btn-danger">Volver</button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto pb-12">
      <EncabezadoPagina
        titulo="Proceso de Check-In"
        subtitulo={`Habitación ${hab.numero}`}
        onVolver={() => navigate(`/habitacion/${id}`)}
        tituloVolver="Volver a la habitación"
      />

      <main>
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
      </main>
    </div>
  )
}