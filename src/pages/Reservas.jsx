import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTurnoActivo } from '../hooks/useTurnoActivo'
import { useReservas } from '../hooks/useReservas'
import { useCalendario } from '../hooks/useCalendario'
import FormularioReserva from '../components/Reservas/FormularioReserva'
import CambiarHabitacionReservaModal from '../components/Reservas/CambiarHabitacionReservaModal'
import CalendarioReservas from '../components/Reservas/CalendarioReservas'
import BloqueoTurnoAjeno from '../components/Compartido/BloqueoTurnoAjeno'

export default function Reservas() {
  const navigate = useNavigate()
  const { turnoActivo, cargandoTurno, turnoAjeno } = useTurnoActivo()
  const { reservas, cargando: cargandoRes, error: errorRes, cargarReservas, anularReserva } = useReservas()
  const { habitaciones, ocupaciones, cargando: cargandoCal, cargarDatos: cargarCalendario } = useCalendario()
  
  const [mostrarForm, setMostrarForm] = useState(false)
  const [reservaACambiar, setReservaACambiar] = useState(null)
  const [vistaActual, setVistaActual] = useState('lista') // 'lista' o 'calendario'

  useEffect(() => {
    cargarReservas()
  }, [cargarReservas])

  useEffect(() => {
    if (vistaActual === 'calendario') {
      cargarCalendario()
    }
  }, [vistaActual, cargarCalendario])

  async function handleAnularReserva(reserva) {
    if (!confirm('¿Seguro que deseas anular esta reserva?')) return
    await anularReserva(reserva, null) // Si hay contexto de usuario, pasarlo
  }

  function convertirAHospedaje(reserva) {
    navigate(`/checkin/${reserva.habitacion_id}?reserva=${reserva.id}`)
  }

  if (cargandoRes && reservas.length === 0) return (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
    </div>
  )

  if (turnoAjeno) {
    return <BloqueoTurnoAjeno />
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <header className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-10 mb-6">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/')} 
              className="p-2 rounded-full hover:bg-gray-100 text-gray-600 transition-colors"
              title="Volver"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            </button>
            <div>
              <h1 className="text-2xl font-black text-gray-800 tracking-tight">Gestión de Reservas</h1>
              <p className="text-sm text-gray-500 font-medium">Programa y administra las llegadas</p>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            {/* Selector de Vista */}
            <div className="bg-gray-100 p-1 rounded-xl flex items-center">
              <button
                onClick={() => setVistaActual('lista')}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${vistaActual === 'lista' ? 'bg-white text-indigo-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Vista Lista
              </button>
              <button
                onClick={() => setVistaActual('calendario')}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${vistaActual === 'calendario' ? 'bg-white text-indigo-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Calendario
              </button>
            </div>

            {turnoActivo && (
              <button
                onClick={() => setMostrarForm(!mostrarForm)}
                className={`text-sm px-5 py-2.5 font-bold rounded-xl transition-all shadow-sm flex items-center gap-2 ${
                  mostrarForm 
                    ? 'bg-gray-200 text-gray-700 hover:bg-gray-300' 
                    : 'bg-indigo-600 text-white hover:bg-indigo-700'
                }`}
              >
                {mostrarForm ? 'Cerrar Formulario' : (
                  <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4" /></svg> Nueva Reserva</>
                )}
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4">
        {!cargandoTurno && !turnoActivo && (
          <div className="bg-yellow-50 border-2 border-yellow-200 rounded-2xl p-4 mb-6 flex items-center justify-center gap-3">
            <span className="text-2xl">🔒</span>
            <p className="text-sm font-bold text-yellow-800">
              No hay un turno activo. Inicia turno para poder crear nuevas reservas.
            </p>
          </div>
        )}

        {errorRes && (
          <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-4 mb-6 flex items-center justify-center gap-3">
            <span className="text-2xl">⚠️</span>
            <p className="text-sm font-bold text-red-800">{errorRes}</p>
          </div>
        )}

        {mostrarForm && (
          <div className="mb-8">
            <FormularioReserva 
              turnoActivo={turnoActivo} 
              onCancel={() => setMostrarForm(false)} 
            />
          </div>
        )}

        {vistaActual === 'calendario' ? (
          <CalendarioReservas 
            habitaciones={habitaciones} 
            ocupaciones={ocupaciones} 
            cargando={cargandoCal} 
          />
        ) : (
          /* Vista Lista Original */
          <>
            {reservas.length === 0 && !cargandoRes ? (
          <div className="bg-white rounded-3xl border border-gray-100 p-12 text-center shadow-sm flex flex-col items-center justify-center">
            <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-300 text-4xl mb-4">
              📅
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-1">Sin Reservas Pendientes</h3>
            <p className="text-gray-500">Actualmente no hay reservas programadas.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {reservas.map(r => (
              <div key={r.id} className="bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-lg hover:border-indigo-100 transition-all overflow-hidden flex flex-col">
                <div className="p-6 flex-1">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className="text-lg font-black text-gray-800 line-clamp-1" title={r.clientes?.nombres}>
                        {r.clientes?.nombres}
                      </h4>
                      <p className="text-xs text-gray-500 font-medium">Doc: {r.clientes?.dni_pasaporte}</p>
                      {r.clientes?.telefono && (
                        <p className="text-xs text-gray-500 font-medium mt-0.5">📞 {r.clientes.telefono}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {r.nro_ficha && (
                        <span className="text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
                          N° {String(r.nro_ficha).padStart(6, '0')}
                        </span>
                      )}
                      <span className="text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                        {r.estado}
                      </span>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 rounded-2xl p-4 mb-4">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center font-black">
                        {r.habitaciones?.numero}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Habitación</p>
                        <p className="text-sm font-bold text-gray-800">{r.habitaciones?.tipo_actual}</p>
                      </div>
                    </div>
                    
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Llegada Programada</p>
                      <p className="text-sm font-bold text-indigo-700">
                        {new Date(r.fecha_llegada).toLocaleString('es-PE', { 
                          weekday: 'short', day: '2-digit', month: 'short', hour: '2-digit', minute:'2-digit' 
                        })}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-1 mb-4">
                    {r.adelanto > 0 && (
                      <p className="text-xs font-bold text-green-700 flex justify-between bg-green-50 px-3 py-2 rounded-lg">
                        <span>Adelanto pagado:</span>
                        <span>S/{r.adelanto}</span>
                      </p>
                    )}
                    {r.monto_early > 0 && (
                      <p className="text-xs font-bold text-blue-700 flex justify-between bg-blue-50 px-3 py-2 rounded-lg">
                        <span>Early Check-in:</span>
                        <span>S/{r.monto_early}</span>
                      </p>
                    )}
                  </div>

                  {r.observaciones && (
                    <div className="text-xs text-gray-600 font-medium p-3 bg-yellow-50 rounded-xl border border-yellow-100 mb-2">
                      <span className="font-bold text-yellow-800">Obs:</span> {r.observaciones}
                    </div>
                  )}
                </div>

                  <div className="p-4 border-t border-gray-50 bg-gray-50/50 flex flex-wrap gap-3">
                  <button
                    onClick={() => convertirAHospedaje(r)}
                    className="flex-[2] py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-bold shadow-sm transition-transform active:scale-[0.98]"
                  >
                    Hacer Check-in
                  </button>
                  <button
                    onClick={() => setReservaACambiar(r)}
                    className="flex-1 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 border border-indigo-200 rounded-xl text-sm font-bold transition-colors"
                  >
                    Cambiar Hab
                  </button>
                  <button
                    onClick={() => handleAnularReserva(r)}
                    className="flex-1 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-xl text-sm font-bold transition-colors"
                  >
                    Anular
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {reservaACambiar && (
          <CambiarHabitacionReservaModal
            reserva={reservaACambiar}
            onClose={() => setReservaACambiar(null)}
          />
        )}
          </>
        )}
      </main>
    </div>
  )
}