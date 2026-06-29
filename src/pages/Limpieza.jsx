import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLimpieza } from '../hooks/useLimpieza'
import { tiposLimpiezaService } from '../services/tiposLimpiezaService'
import TarjetaLimpieza from '../components/Limpieza/TarjetaLimpieza'

function Limpieza() {
  const navigate = useNavigate()

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
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-500 font-medium">Cargando habitaciones...</span>
      </div>
    )
  }

  const pendientes = habitaciones.filter(h => ['pendiente_limpieza', 'en_limpieza', 'limpieza_simple'].includes(h.estado))
  const ocupadas = habitaciones.filter(h => h.estado === 'ocupada')
  const disponibles = habitaciones.filter(h => h.estado === 'disponible')
  const otras = habitaciones.filter(h => !['pendiente_limpieza', 'en_limpieza', 'limpieza_simple', 'ocupada', 'disponible'].includes(h.estado))

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
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
            <p className="text-sm text-gray-500">Gestiona la limpieza de todas las habitaciones</p>
          </div>
        </div>
        <button
          onClick={() => setMostrarTipos(!mostrarTipos)}
          className="text-sm px-4 py-2 bg-gray-600 text-white rounded-xl font-semibold"
        >
          Tipos de limpieza
        </button>
      </div>

      {mostrarTipos && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-6">
          <p className="text-xs text-gray-500 font-semibold uppercase mb-3">Gestionar tipos de limpieza</p>
          <div className="flex flex-col gap-2 mb-3">
            {tiposLimpieza.map(t => (
              <div key={t.id} className="flex items-center gap-2">
                {editandoTipo === t.id ? (
                  <>
                    <input
                      type="text"
                      value={nombreTipoEdit}
                      onChange={e => setNombreTipoEdit(e.target.value)}
                      className="flex-1 border rounded-lg px-3 py-1.5 text-sm"
                    />
                    <button onClick={guardarTipo} className="text-xs px-3 py-1.5 bg-green-600 text-white rounded-lg">Guardar</button>
                    <button onClick={() => setEditandoTipo(null)} className="text-xs px-3 py-1.5 border rounded-lg text-gray-600">Cancelar</button>
                  </>
                ) : (
                  <>
                    <span className="flex-1 text-sm">{t.nombre}</span>
                    <button onClick={() => { setEditandoTipo(t.id); setNombreTipoEdit(t.nombre) }}
                      className="text-xs px-3 py-1.5 bg-blue-100 text-blue-600 rounded-lg">Editar</button>
                    <button onClick={() => eliminarTipo(t)}
                      className="text-xs px-3 py-1.5 bg-red-100 text-red-600 rounded-lg">Eliminar</button>
                  </>
                )}
              </div>
            ))}
          </div>
          <div className="flex gap-2 border-t pt-3">
            <input
              type="text"
              value={nuevoTipo}
              onChange={e => setNuevoTipo(e.target.value)}
              placeholder="Nuevo tipo (ej: Cambio de toallas)"
              className="flex-1 border rounded-lg px-3 py-2 text-sm"
              onKeyDown={e => e.key === 'Enter' && crearTipo()}
            />
            <button onClick={crearTipo} className="px-4 py-2 bg-green-600 text-white rounded-xl text-sm font-medium">
              Agregar
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl">
          <p className="font-medium text-sm">⚠ {error}</p>
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
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
          <div className="text-5xl mb-4">✨</div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">Sin habitaciones registradas</h3>
        </div>
      )}
    </div>
  )
}

function SeccionHabitaciones({ titulo, children }) {
  return (
    <div className="mb-8">
      <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-3">{titulo}</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {children}
      </div>
    </div>
  )
}

export default Limpieza