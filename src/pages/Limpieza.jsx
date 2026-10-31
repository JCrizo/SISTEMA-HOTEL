import { useEffect, useState } from 'react'
import { useLimpieza } from '../hooks/useLimpieza'
import { tiposLimpiezaService } from '../services/tiposLimpiezaService'
import TarjetaLimpieza from '../components/Limpieza/TarjetaLimpieza'
import Icono from '../components/Compartido/Icono'

function Limpieza() {
  const {
    habitaciones,
    tiposLimpieza,
    cargando,
    error,
    cargarHabitaciones,
    cargarTiposLimpieza,
    iniciarLimpieza,
    habilitarHabitacion
  } = useLimpieza()

  const [mostrarTipos, setMostrarTipos] = useState(false)
  const [nuevoTipo, setNuevoTipo] = useState('')
  const [editandoTipo, setEditandoTipo] = useState(null)
  const [nombreTipoEdit, setNombreTipoEdit] = useState('')

  useEffect(() => {
    cargarHabitaciones()
  }, [cargarHabitaciones])

  async function crearTipo() {
    if (!nuevoTipo.trim()) return
    await tiposLimpiezaService.crear(nuevoTipo.trim())
    setNuevoTipo('')
    cargarTiposLimpieza()
  }

  async function guardarTipo() {
    if (!nombreTipoEdit.trim()) return
    await tiposLimpiezaService.actualizar(editandoTipo, nombreTipoEdit.trim())
    setEditandoTipo(null)
    cargarTiposLimpieza()
  }

  async function eliminarTipo(t) {
    if (!confirm(`¿Eliminar el tipo "${t.nombre}"?`)) return
    await tiposLimpiezaService.eliminar(t.id)
    cargarTiposLimpieza()
  }

  if (cargando) {
    return (
      <div className="flex flex-col justify-center items-center h-80 gap-3">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
        <span className="text-sm text-gray-400 font-semibold">Cargando habitaciones...</span>
      </div>
    )
  }

  const pendientes = habitaciones.filter(h => ['pendiente_limpieza', 'en_limpieza', 'limpieza_simple'].includes(h.estado))
  const ocupadas = habitaciones.filter(h => h.estado === 'ocupada')
  const disponibles = habitaciones.filter(h => h.estado === 'disponible')
  const otras = habitaciones.filter(h => !['pendiente_limpieza', 'en_limpieza', 'limpieza_simple', 'ocupada', 'disponible'].includes(h.estado))

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="page-title">Módulo de Limpieza</h1>
          <p className="page-sub">Gestiona la limpieza de todas las habitaciones</p>
        </div>
        <button
          onClick={() => setMostrarTipos(!mostrarTipos)}
          className={`btn ${mostrarTipos ? 'bg-gray-900 text-white' : 'btn-secondary'}`}
        >
          <Icono name="sliders" className="w-4 h-4" /> Tipos de limpieza
        </button>
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="card p-3 sm:p-4">
          <p className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-wide">Pendientes</p>
          <p className="text-2xl font-black text-amber-600">{pendientes.length}</p>
        </div>
        <div className="card p-3 sm:p-4">
          <p className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-wide">Ocupadas</p>
          <p className="text-2xl font-black text-blue-600">{ocupadas.length}</p>
        </div>
        <div className="card p-3 sm:p-4">
          <p className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-wide">Disponibles</p>
          <p className="text-2xl font-black text-emerald-600">{disponibles.length}</p>
        </div>
        <div className="card p-3 sm:p-4">
          <p className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-wide">Otras</p>
          <p className="text-2xl font-black text-gray-600">{otras.length}</p>
        </div>
      </div>

      {mostrarTipos && (
        <div className="card p-4 sm:p-5">
          <p className="label">Gestionar tipos de limpieza</p>
          <div className="flex flex-col gap-2 mb-3">
            {tiposLimpieza.map(t => (
              <div key={t.id} className="flex items-center gap-2 bg-gray-50 p-2 rounded-xl border border-gray-100">
                {editandoTipo === t.id ? (
                  <>
                    <input
                      type="text"
                      value={nombreTipoEdit}
                      onChange={e => setNombreTipoEdit(e.target.value)}
                      className="input flex-1 !py-1.5"
                    />
                    <button onClick={guardarTipo} className="btn btn-success btn-sm">Guardar</button>
                    <button onClick={() => setEditandoTipo(null)} className="btn btn-secondary btn-sm">Cancelar</button>
                  </>
                ) : (
                  <>
                    <span className="flex-1 text-sm font-semibold text-gray-700 px-1 truncate">{t.nombre}</span>
                    <button onClick={() => { setEditandoTipo(t.id); setNombreTipoEdit(t.nombre) }}
                      className="btn btn-secondary btn-sm" title="Editar">
                      <Icono name="pencil" className="w-3.5 h-3.5" /><span className="hidden sm:inline">Editar</span>
                    </button>
                    <button onClick={() => eliminarTipo(t)}
                      className="btn btn-danger-soft btn-sm" title="Eliminar">
                      <Icono name="trash" className="w-3.5 h-3.5" /><span className="hidden sm:inline">Eliminar</span>
                    </button>
                  </>
                )}
              </div>
            ))}
          </div>
          <div className="flex gap-2 border-t border-gray-100 pt-3">
            <input
              type="text"
              value={nuevoTipo}
              onChange={e => setNuevoTipo(e.target.value)}
              placeholder="Nuevo tipo (ej: Cambio de toallas)"
              className="input flex-1"
              onKeyDown={e => e.key === 'Enter' && crearTipo()}
            />
            <button onClick={crearTipo} className="btn btn-success">
              <Icono name="plus" className="w-4 h-4" /> Agregar
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-100 text-rose-700 rounded-xl">
          <Icono name="alert" className="w-4 h-4 shrink-0" />
          <p className="font-semibold text-sm">{error}</p>
        </div>
      )}

      {pendientes.length > 0 && (
        <SeccionHabitaciones titulo={`Pendientes de limpieza (${pendientes.length})`}>
          {pendientes.map(hab => (
            <TarjetaLimpieza key={hab.id} hab={hab} tiposLimpieza={tiposLimpieza}
              onIniciarLimpieza={iniciarLimpieza} onHabilitar={habilitarHabitacion} onSuccess={cargarHabitaciones} />
          ))}
        </SeccionHabitaciones>
      )}

      {ocupadas.length > 0 && (
        <SeccionHabitaciones titulo={`Ocupadas (${ocupadas.length})`}>
          {ocupadas.map(hab => (
            <TarjetaLimpieza key={hab.id} hab={hab} tiposLimpieza={tiposLimpieza}
              onIniciarLimpieza={iniciarLimpieza} onHabilitar={habilitarHabitacion} onSuccess={cargarHabitaciones} />
          ))}
        </SeccionHabitaciones>
      )}

      {disponibles.length > 0 && (
        <SeccionHabitaciones titulo={`Disponibles (${disponibles.length})`}>
          {disponibles.map(hab => (
            <TarjetaLimpieza key={hab.id} hab={hab} tiposLimpieza={tiposLimpieza}
              onIniciarLimpieza={iniciarLimpieza} onHabilitar={habilitarHabitacion} onSuccess={cargarHabitaciones} />
          ))}
        </SeccionHabitaciones>
      )}

      {otras.length > 0 && (
        <SeccionHabitaciones titulo={`Otras (${otras.length})`}>
          {otras.map(hab => (
            <TarjetaLimpieza key={hab.id} hab={hab} tiposLimpieza={tiposLimpieza}
              onIniciarLimpieza={iniciarLimpieza} onHabilitar={habilitarHabitacion} onSuccess={cargarHabitaciones} />
          ))}
        </SeccionHabitaciones>
      )}

      {habitaciones.length === 0 && (
        <div className="card flex flex-col items-center justify-center text-center p-12">
          <Icono name="sparkles" className="w-10 h-10 text-gray-300 mb-2" />
          <h3 className="text-lg font-black text-gray-800">Sin habitaciones registradas</h3>
        </div>
      )}
    </div>
  )
}

function SeccionHabitaciones({ titulo, children }) {
  return (
    <section>
      <div className="flex items-center gap-3 mb-3">
        <h2 className="text-xs text-gray-500 font-bold uppercase tracking-widest">{titulo}</h2>
        <div className="h-px bg-gray-200 flex-1"></div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
        {children}
      </div>
    </section>
  )
}
