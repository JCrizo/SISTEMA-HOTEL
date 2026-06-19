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
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!turnoActivo) {
    return <AvisoSinTurno mensaje="Debes iniciar un turno antes de registrar un check-in." />
  }

  if (!hab) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-red-50 text-red-600 p-6 rounded-2xl border-2 border-red-200 text-center max-w-md">
          <span className="text-4xl mb-2 block">🚫</span>
          <h2 className="text-lg font-black mb-1">Habitación no encontrada</h2>
          <p className="text-sm font-medium mb-4">No se pudo cargar la información.</p>
          <button onClick={() => navigate('/')} className="bg-red-600 text-white px-6 py-2 rounded-xl font-bold">Volver</button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <header className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-10 mb-8">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <button 
            onClick={() => navigate(`/habitacion/${id}`)} 
            className="p-2 rounded-full hover:bg-gray-100 text-gray-600 transition-colors flex-shrink-0"
            title="Volver a la habitación"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          </button>
          <div>
            <h1 className="text-xl font-black text-gray-800 tracking-tight">Proceso de Check-In</h1>
            <p className="text-sm text-gray-500 font-medium">Habitación {hab.numero}</p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4">
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