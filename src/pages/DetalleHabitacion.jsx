import { useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTurnoActivo } from '../hooks/useTurnoActivo'
import { useDetalleHabitacion } from '../hooks/useDetalleHabitacion'
import { useLimpieza } from '../hooks/useLimpieza'
import { useAuth } from '../context/AuthContext'

import PanelHuespedActivo from '../components/DetalleHabitacion/PanelHuespedActivo'
import PanelLimpieza from '../components/DetalleHabitacion/PanelLimpieza'
import ConfigHabitacion from '../components/DetalleHabitacion/ConfigHabitacion'
import BloqueoTurnoAjeno from '../components/Compartido/BloqueoTurnoAjeno'
import EncabezadoPagina from '../components/Compartido/EncabezadoPagina'
import Icono from '../components/Compartido/Icono'

// Color solo como acento: un punto y un badge pequeño. Las superficies son neutras.
const estiloEstado = {
  disponible:         { badge: 'badge-ok',     punto: 'bg-emerald-500' },
  ocupada:            { badge: 'badge-info',   punto: 'bg-blue-500' },
  pendiente_limpieza: { badge: 'badge-warn',   punto: 'bg-amber-500' },
  en_limpieza:        { badge: 'badge-warn',   punto: 'bg-amber-500' },
  limpieza_simple:    { badge: 'badge-warn',   punto: 'bg-amber-500' },
  habilitada:         { badge: 'badge-ok',     punto: 'bg-emerald-500' },
  mantenimiento:      { badge: 'badge-muted',  punto: 'bg-gray-400' },
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
  const { turnoActivo, turnoAjeno } = useTurnoActivo()
  const { usuario } = useAuth()
  
  const {
    cargando, hab, hospedaje, huesped, pagos, consumos,
    hospedajeFinalizado, reservaPendiente, cargarDatos, registrarPago, registrarPenalidad,
    extenderEstadia, actualizarHabitacion, actualizarTarifaHospedaje,
    actualizarDatosHuesped, actualizarFechaIngreso, actualizarComprobante, hacerCheckout,
    registrarCobroAdicional, reabrirHospedaje, cambiarHabitacion
  } = useDetalleHabitacion()

  const {
    tiposLimpieza,
    iniciarLimpieza,
    habilitarHabitacion
  } = useLimpieza()

  useEffect(() => {
    cargarDatos(id)
  }, [id, cargarDatos])

  // Callback estable para que PanelLimpieza/TarjetaLimpieza recarguen esta página
  const handleRefresh = useCallback(() => {
    cargarDatos(id)
  }, [id, cargarDatos])

  async function cambiarEstadoHab(estado) {
    if (!confirm(`¿Cambiar estado a "${estado}"?`)) return
    await actualizarHabitacion({ estado })
  }

  if (cargando) return (
    <div className="flex flex-col justify-center items-center h-80 gap-3">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
      <span className="text-sm text-gray-400 font-semibold">Cargando habitación...</span>
    </div>
  )
  
  if (turnoAjeno) {
    return <BloqueoTurnoAjeno />
  }

  if (!hab) return (
    <div className="flex items-center justify-center p-4 py-16">
      <div className="bg-rose-50 text-rose-600 p-6 rounded-2xl border border-rose-200 text-center max-w-md">
        <span className="text-4xl mb-2 block"><Icono name="ban" className="w-10 h-10 inline-block shrink-0" /></span>
        <h2 className="text-lg font-black mb-1">Habitación no encontrada</h2>
        <button onClick={() => navigate('/')} className="btn btn-danger mt-4">Volver al inicio</button>
      </div>
    </div>
  )

  return (
    <div className="max-w-4xl mx-auto pb-12">
      <EncabezadoPagina
        titulo="Recepción de Habitación"
        onVolver={() => navigate('/')}
        tituloVolver="Volver al inicio"
      />

      <main>
        
        {/* CABECERA DE HABITACIÓN */}
        <div className="card p-4 sm:p-6 mb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <div className="w-16 h-16 sm:w-20 sm:h-20 shrink-0 rounded-2xl bg-gray-100 border border-gray-200 text-gray-900 flex items-center justify-center text-3xl sm:text-4xl font-black tracking-tight">
              {hab.numero}
            </div>
            <div className="min-w-0">
              <p className="label !mb-0.5">Habitación</p>
              <p className="text-lg font-black text-gray-800 truncate">{hab.tipo_actual}</p>
              <span className={`badge mt-1 ${(estiloEstado[hab.estado] || estiloEstado.mantenimiento).badge}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${(estiloEstado[hab.estado] || estiloEstado.mantenimiento).punto}`}></span>
                {etiquetas[hab.estado]}
              </span>
            </div>
          </div>

          <div className="sm:text-right border-t sm:border-t-0 border-gray-100 pt-3 sm:pt-0">
            <p className="label !mb-0.5">Tarifa</p>
            <p className="text-2xl font-black text-gray-800">S/ {hab.precio_actual}</p>
          </div>
        </div>

        {/* DISPONIBLE */}
        {hab.estado === 'disponible' && (
          <div className="card p-6 sm:p-8 text-center mb-5">
            <div className="w-14 h-14 bg-gray-100 text-gray-500 rounded-2xl flex items-center justify-center mx-auto mb-4"><Icono name="sparkles" className="w-7 h-7" /></div>
            <h3 className="text-xl font-black text-gray-800 mb-1">Habitación lista</h3>
            <p className="text-gray-500 mb-6">Esta habitación está limpia y lista para recibir nuevos huéspedes.</p>
            {reservaPendiente && (
              <div className="mb-6 p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-sm font-semibold flex items-center gap-2 justify-center">
                <span><Icono name="alert" className="w-4 h-4 inline-block shrink-0" /></span> Hay una reserva pendiente programada para hoy.
              </div>
            )}
            <button 
            onClick={async () => {
                if (reservaPendiente) {
                  const usarReserva = window.confirm(
                    `Esta habitación tiene una reserva para hoy (Cliente: ${reservaPendiente.clientes?.nombres || 'N/A'}).\n\nOK → Check-in con datos de la reserva\nCancelar → Ver opciones`
                  )
                  if (usarReserva) {
                    navigate(`/checkin/${hab.id}?reserva=${reservaPendiente.id}`)
                    return
                  }
                  // Bug 1+3 FIX: no silenciar la reserva — forzar anularla o cancelar
                  const anularYContinuar = window.confirm(
                    `¿Anular esa reserva y hacer check-in directo?\n\nOK → Anular y continuar\nCancelar → Volver sin hacer nada`
                  )
                  if (anularYContinuar) {
                    const { supabase: _sb } = await import('../lib/supabase')
                    await _sb.from('reservas').update({ estado: 'anulada' }).eq('id', reservaPendiente.id)
                    navigate(`/checkin/${hab.id}`)
                  }
                  return
                }
                navigate(`/checkin/${hab.id}`)
              }}
              className="btn btn-success w-full sm:w-auto !min-h-[52px] !px-8 !text-base mx-auto"
            >
              <Icono name="logout" className="w-5 h-5 rotate-180" />
              {reservaPendiente ? 'Check-In de Reserva' : 'Iniciar Check-In Directo'}
            </button>
          </div>
        )}

        {/* OCUPADA con hospedaje */}
        {hab.estado === 'ocupada' && hospedaje && (
          <div className="mb-5">
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
              actualizarComprobante={actualizarComprobante}
              actualizarFechaIngreso={actualizarFechaIngreso}
              cambiarHabitacion={cambiarHabitacion}
            />
          </div>
        )}

        {/* OCUPADA sin hospedaje = inconsistencia */}
        {hab.estado === 'ocupada' && !cargando && !hospedaje && (
          <div className="bg-rose-50 text-rose-700 rounded-2xl p-6 sm:p-8 border border-rose-200 text-center mb-5">
            <div className="w-14 h-14 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-4"><Icono name="alert" className="w-7 h-7" /></div>
            <h3 className="text-xl font-bold mb-2">Inconsistencia Detectada</h3>
            <p className="text-rose-600/80 mb-6 max-w-md mx-auto">
              La habitación figura como ocupada en el sistema, pero no se encontró el registro del check-in (probablemente fue eliminado manualmente).
            </p>
            <button 
              onClick={() => cambiarEstadoHab('disponible')}
              className="btn btn-danger"
            >
              Forzar Cambio a Disponible
            </button>
          </div>
        )}

        {/* LIMPIEZA */}
        {['pendiente_limpieza', 'en_limpieza', 'limpieza_simple'].includes(hab.estado) && (
          <div className="mb-5">
            <PanelLimpieza 
              hab={hab}
              hospedajeFinalizado={hospedajeFinalizado}
              turnoActivo={turnoActivo}
              registrarCobroAdicional={registrarCobroAdicional}
              reabrirHospedaje={reabrirHospedaje}
              tiposLimpieza={tiposLimpieza}
              iniciarLimpieza={iniciarLimpieza}
              habilitarHabitacion={habilitarHabitacion}
              onRefresh={handleRefresh}
            />
          </div>
        )}

        {/* MANTENIMIENTO */}
        {hab.estado === 'mantenimiento' && (
          <div className="card p-6 sm:p-8 text-center mb-5">
            <div className="w-14 h-14 bg-gray-100 text-gray-500 rounded-2xl flex items-center justify-center mx-auto mb-4"><Icono name="cog" className="w-7 h-7" /></div>
            <h3 className="text-xl font-black text-gray-800 mb-1">En mantenimiento</h3>
            <p className="text-gray-500">La habitación está bloqueada por mantenimiento o reparaciones.</p>
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
