import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTurnoActivo } from '../hooks/useTurnoActivo'
import { useReservas } from '../hooks/useReservas'
import { useCalendario } from '../hooks/useCalendario'
import FormularioReserva from '../components/Reservas/FormularioReserva'
import CambiarHabitacionReservaModal from '../components/Reservas/CambiarHabitacionReservaModal'
import CalendarioReservas from '../components/Reservas/CalendarioReservas'
import BloqueoTurnoAjeno from '../components/Compartido/BloqueoTurnoAjeno'
import { supabase } from '../lib/supabase'
import EncabezadoPagina from '../components/Compartido/EncabezadoPagina'
import Icono from '../components/Compartido/Icono'

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

  async function convertirAHospedaje(reserva) {
    try {
      const { data: hab } = await supabase
        .from('habitaciones')
        .select('estado, numero')
        .eq('id', reserva.habitacion_id)
        .single()
      
      if (!hab || hab.estado !== 'disponible') {
        alert(`La habitación ${hab?.numero || ''} ya no está disponible (estado: ${hab?.estado || 'desconocido'}). Recarga la página.`)
        await cargarReservas()
        return
      }
    } catch (e) {
      console.error('Error verificando habitación:', e)
    }
    navigate(`/checkin/${reserva.habitacion_id}?reserva=${reserva.id}`)
  }

  // Reservas cuya llegada ya pasó (antes de hoy) y siguen sin atender
  const inicioHoy = new Date(); inicioHoy.setHours(0, 0, 0, 0)
  const esVencida = (r) => new Date(r.fecha_llegada) < inicioHoy
  const vencidas = reservas.filter(esVencida)

  if (cargandoRes && reservas.length === 0) return (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
    </div>
  )

  if (turnoAjeno) {
    return <BloqueoTurnoAjeno />
  }

  return (
    <div className="max-w-7xl mx-auto pb-12">
      <EncabezadoPagina
        titulo="Gestión de Reservas"
        subtitulo="Programa y administra las llegadas"
        onVolver={() => navigate('/')}
        tituloVolver="Volver al inicio"
      >
          <>
            {/* Selector de Vista */}
            <div className="bg-gray-100 p-1 rounded-xl flex items-center">
              <button
                onClick={() => setVistaActual('lista')}
                className={`px-4 min-h-[40px] rounded-lg text-sm font-bold transition-all ${vistaActual === 'lista' ? 'bg-white text-blue-700 shadow-xs' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Vista Lista
              </button>
              <button
                onClick={() => setVistaActual('calendario')}
                className={`px-4 min-h-[40px] rounded-lg text-sm font-bold transition-all ${vistaActual === 'calendario' ? 'bg-white text-blue-700 shadow-xs' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Calendario
              </button>
            </div>

            {turnoActivo && (
              <button
                onClick={() => setMostrarForm(!mostrarForm)}
                className={`btn ${mostrarForm ? 'btn-secondary' : 'btn-primary'}`}
              >
                {mostrarForm ? 'Cerrar Formulario' : (
                  <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4" /></svg> Nueva Reserva</>
                )}
              </button>
            )}
          </>
      </EncabezadoPagina>

      <main>
        {!cargandoTurno && !turnoActivo && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6 flex items-center justify-center gap-3">
            <span className="text-2xl"><Icono name="lock" className="w-6 h-6 inline-block shrink-0" /></span>
            <p className="text-sm font-bold text-amber-800">
              No hay un turno activo. Inicia turno para poder crear nuevas reservas.
            </p>
          </div>
        )}

        {errorRes && (
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 mb-6 flex items-center justify-center gap-3">
            <span className="text-2xl"><Icono name="alert" className="w-6 h-6 inline-block shrink-0" /></span>
            <p className="text-sm font-bold text-rose-800">{errorRes}</p>
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
            onCambiarHabitacion={setReservaACambiar}
          />
        ) : (
          /* Vista Lista Original */
          <>
            {vencidas.length > 0 && (
              <div className="mb-4 flex items-start gap-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-2xl px-4 py-3">
                <Icono name="alert" className="w-5 h-5 shrink-0 mt-0.5" />
                <p className="text-sm font-semibold">
                  {vencidas.length === 1 ? 'Hay 1 reserva' : `Hay ${vencidas.length} reservas`} con llegada anterior a hoy que no se {vencidas.length === 1 ? 'ha' : 'han'} atendido.
                  Conviértelas en check-in o anúlalas para mantener la lista al día.
                </p>
              </div>
            )}
            {reservas.length === 0 && !cargandoRes ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center shadow-sm flex flex-col items-center justify-center">
            <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center text-blue-300 text-4xl mb-4">
              <Icono name="calendar" className="w-4 h-4 inline-block shrink-0" />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-1">Sin Reservas Pendientes</h3>
            <p className="text-gray-500">Actualmente no hay reservas programadas.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {reservas.map(r => (
              <div key={r.id} className={`card card-hover overflow-hidden flex flex-col ${esVencida(r) ? '!border-amber-300' : ''}`}>
                <div className="p-6 flex-1">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className="text-lg font-black text-gray-800 line-clamp-1" title={r.clientes?.nombres}>
                        {r.clientes?.nombres}
                      </h4>
                      <p className="text-xs text-gray-500 font-medium">Doc: {r.clientes?.dni_pasaporte}</p>
                      {r.clientes?.telefono && (
                        <p className="text-xs text-gray-500 font-medium mt-0.5"><Icono name="phone" className="w-4 h-4 inline-block shrink-0" /> {r.clientes.telefono}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {r.nro_ficha && (
                        <span className="text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
                          N° {String(r.nro_ficha).padStart(6, '0')}
                        </span>
                      )}
                      {esVencida(r) && <span className="badge badge-warn">Vencida</span>}
                      <span className="badge badge-muted uppercase">
                        {r.estado}
                      </span>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 rounded-2xl p-4 mb-4">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-black">
                        {r.habitaciones?.numero}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Habitación</p>
                        <p className="text-sm font-bold text-gray-800">{r.habitaciones?.tipo_actual}</p>
                      </div>
                    </div>
                    
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Llegada Programada</p>
                      <p className="text-sm font-bold text-blue-700">
                        {new Date(r.fecha_llegada).toLocaleString('es-PE', { 
                          weekday: 'short', day: '2-digit', month: 'short', hour: '2-digit', minute:'2-digit' 
                        })}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-1 mb-4">
                    {r.tarifa_pactada > 0 && (
                      <p className="text-xs font-bold text-blue-700 flex justify-between bg-blue-50 px-3 py-2 rounded-lg">
                        <span>Tarifa pactada:</span>
                        <span>S/{r.tarifa_pactada}</span>
                      </p>
                    )}
                    {r.adelanto > 0 && (
                      <p className="text-xs font-bold text-emerald-700 flex justify-between bg-emerald-50 px-3 py-2 rounded-lg">
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
                    <div className="text-xs text-gray-600 font-medium p-3 bg-amber-50 rounded-xl border border-amber-100 mb-2">
                      <span className="font-bold text-amber-800">Obs:</span> {r.observaciones}
                    </div>
                  )}
                </div>

                  <div className="p-4 border-t border-gray-50 bg-gray-50/50 flex flex-wrap gap-3">
                  <button
                    onClick={() => convertirAHospedaje(r)}
                    className="flex-[2] py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-sm transition-transform active:scale-[0.98]"
                  >
                    Hacer Check-in
                  </button>
                  <button
                    onClick={() => setReservaACambiar(r)}
                    className="flex-1 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200 rounded-xl text-sm font-bold transition-colors"
                  >
                    Cambiar Hab
                  </button>
                  <button
                    onClick={() => handleAnularReserva(r)}
                    className="flex-1 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded-xl text-sm font-bold transition-colors"
                  >
                    Anular
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

          </>
        )}

        {reservaACambiar && (
          <CambiarHabitacionReservaModal
            reserva={reservaACambiar}
            onClose={() => {
              setReservaACambiar(null)
              if (vistaActual === 'calendario') cargarCalendario()
            }}
          />
        )}
      </main>
    </div>
  )
}
