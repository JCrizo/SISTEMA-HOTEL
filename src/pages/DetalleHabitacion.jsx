import { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTurnoActivo } from '../hooks/useTurnoActivo'
import { useDetalleHabitacion } from '../hooks/useDetalleHabitacion'
import { useAuth } from '../context/AuthContext'

import PanelHuespedActivo from '../components/DetalleHabitacion/PanelHuespedActivo'
import PanelLimpieza from '../components/DetalleHabitacion/PanelLimpieza'
import ConfigHabitacion from '../components/DetalleHabitacion/ConfigHabitacion'

const colores = {
  disponible:         'from-green-500 to-emerald-600 shadow-green-200 text-white',
  ocupada:            'from-red-500 to-rose-600 shadow-red-200 text-white',
  pendiente_limpieza: 'from-amber-400 to-orange-500 shadow-amber-200 text-white',
  en_limpieza:        'from-yellow-400 to-amber-500 shadow-yellow-200 text-white',
  limpieza_simple:    'from-amber-400 to-orange-500 shadow-amber-200 text-white',
  habilitada:         'from-green-500 to-emerald-600 shadow-green-200 text-white',
  mantenimiento:      'from-gray-500 to-slate-600 shadow-gray-200 text-white',
}

const etiquetas = {
  disponible:         'Disponible',
  ocupada:            'Ocupada',
  pendiente_limpieza: 'Pendiente de Limpieza Total',
  en_limpieza:        'En Limpieza Actualmente',
  limpieza_simple:    'Limpieza Simple (Aspirado)',
  habilitada:         'Habilitada para Uso',
  mantenimiento:      'En Mantenimiento',
}

function DetalleHabitacion() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { turnoActivo } = useTurnoActivo()
  const { usuario } = useAuth()
  
  const {
    cargando, hab, hospedaje, huesped, pagos, consumos,
    hospedajeFinalizado, cargarDatos, registrarPago, registrarPenalidad,
    extenderEstadia, actualizarHabitacion, actualizarTarifaHospedaje,
    actualizarDatosHuesped, hacerCheckout,
    registrarCobroAdicional, reabrirHospedaje, cambiarHabitacion
  } = useDetalleHabitacion()

  useEffect(() => {
    cargarDatos(id)
  }, [id, cargarDatos])

  async function cambiarEstadoHab(estado) {
    if (!confirm(`¿Cambiar estado a "${estado}"?`)) return
    await actualizarHabitacion({ estado })
  }

  if (cargando) return (
    <div className="flex justify-center items-center h-screen bg-gray-50">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  )
  
  if (!hab) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-red-50 text-red-600 p-6 rounded-2xl border-2 border-red-200 text-center max-w-md">
        <span className="text-4xl mb-2 block">🚫</span>
        <h2 className="text-lg font-black mb-1">Habitación no encontrada</h2>
        <button onClick={() => navigate('/')} className="mt-4 bg-red-600 text-white px-6 py-2 rounded-xl font-bold">Volver al inicio</button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <header className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-10 mb-6">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <button 
            onClick={() => navigate('/')} 
            className="p-2 rounded-full hover:bg-gray-100 text-gray-600 transition-colors"
            title="Volver"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          </button>
          <h1 className="text-xl font-black text-gray-800 tracking-tight">Recepción de Habitación</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4">
        
        {/* CABECERA DE HABITACIÓN MODERNA */}
        <div className={`bg-gradient-to-r ${colores[hab.estado]} rounded-3xl p-8 mb-8 shadow-lg relative overflow-hidden`}>
          <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
            <svg className="w-32 h-32" fill="currentColor" viewBox="0 0 24 24"><path d="M19 7h-8v6h8V7zM19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-8 2h8v8h-8V5zm-6 0h4v14H5V5zm6 14v-4h8v4h-8z"/></svg>
          </div>
          
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
            <div>
              <p className="text-white/80 font-bold uppercase tracking-widest text-xs mb-1">Habitación Número</p>
              <div className="text-6xl font-black tracking-tighter leading-none mb-2">{hab.numero}</div>
              <div className="inline-block bg-white/20 backdrop-blur-md px-3 py-1 rounded-lg text-sm font-bold">
                {hab.tipo_actual}
              </div>
            </div>
            
            <div className="text-left md:text-right">
              <p className="text-white/80 font-bold uppercase tracking-widest text-xs mb-1">Estado Actual</p>
              <div className="text-2xl font-black mb-1">{etiquetas[hab.estado]}</div>
              <div className="text-lg font-bold bg-black/20 inline-block px-3 py-1 rounded-lg">
                Tarifa: S/{hab.precio_actual}
              </div>
            </div>
          </div>
        </div>

        {/* ACCIONES Y PANELES */}
        {hab.estado === 'disponible' && (
          <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm text-center mb-8">
            <div className="w-16 h-16 bg-green-50 text-green-500 rounded-full flex items-center justify-center text-3xl mx-auto mb-4">✨</div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Habitación Lista</h3>
            <p className="text-gray-500 mb-6">Esta habitación está limpia y lista para recibir nuevos huéspedes.</p>
            <button 
              onClick={() => navigate(`/checkin/${hab.id}`)}
              className="w-full md:w-auto px-8 py-4 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-2xl font-black text-lg shadow-lg shadow-green-200 transition-transform active:scale-95 flex items-center justify-center gap-2 mx-auto"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" /></svg>
              Iniciar Check-In
            </button>
          </div>
        )}

        {hab.estado === 'ocupada' && hospedaje && (
          <div className="mb-8">
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
              actualizarTarifaHospedaje={(nuevaTarifa) => actualizarTarifaHospedaje(nuevaTarifa, usuario?.nombre)}
              actualizarDatosHuesped={actualizarDatosHuesped}
              cambiarHabitacion={cambiarHabitacion}
            />
          </div>
        )}

        {['pendiente_limpieza', 'en_limpieza', 'limpieza_simple'].includes(hab.estado) && (
          <div className="mb-8">
            <PanelLimpieza 
              hab={hab}
              hospedajeFinalizado={hospedajeFinalizado}
              turnoActivo={turnoActivo}
              registrarCobroAdicional={registrarCobroAdicional}
              reabrirHospedaje={reabrirHospedaje}
            />
          </div>
        )}

        {hab.estado === 'mantenimiento' && (
          <div className="bg-gray-800 text-white rounded-3xl p-8 shadow-lg text-center mb-8">
            <div className="text-4xl mb-4">🔧</div>
            <h3 className="text-xl font-bold mb-2">En Mantenimiento</h3>
            <p className="text-gray-400">La habitación está bloqueada por mantenimiento o reparaciones.</p>
          </div>
        )}

        <ConfigHabitacion 
          hab={hab} 
          actualizarHabitacion={actualizarHabitacion} 
          cambiarEstadoHab={cambiarEstadoHab} 
        />
      </main>
    </div>
  )
}

export default DetalleHabitacion