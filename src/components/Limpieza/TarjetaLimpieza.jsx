import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'

export default function TarjetaLimpieza({ hab, tiposLimpieza, onIniciarLimpieza, onHabilitar, esVistaIntegrada, onSuccess }) {
  const { usuario } = useAuth()
  const [personal, setPersonal] = useState('')
  const [tipoSeleccionado, setTipoSeleccionado] = useState('total')
  const [tipoLimpiezaId, setTipoLimpiezaId] = useState('')
  const [horaInicio, setHoraInicio] = useState(new Date().toTimeString().slice(0, 5))
  const [horaFin, setHoraFin] = useState(new Date().toTimeString().slice(0, 5))
  const [guardando, setGuardando] = useState(false)
  const [mostrarForm, setMostrarForm] = useState(false)
  const [limpiezaIniciada, setLimpiezaIniciada] = useState(false)

  const esPostCheckout = ['pendiente_limpieza', 'limpieza_simple'].includes(hab.estado)
  const limpiezaActiva = hab.limpiezaActiva

  async function handleIniciar() {
    if (!tipoLimpiezaId) { alert('Selecciona un tipo de limpieza'); return }
    setGuardando(true)
    const exito = await onIniciarLimpieza(hab, usuario?.id, personal, tipoSeleccionado, tipoLimpiezaId, horaInicio)
    setGuardando(false)
    if (exito) {
      setLimpiezaIniciada(true)
      if (onSuccess) onSuccess()
    }
  }

  async function handleHabilitar() {
    const mensaje = esPostCheckout || hab.estado === 'en_limpieza'
      ? `¿Marcar Hab ${hab.numero} como disponible?`
      : `¿Marcar la limpieza de mantenimiento de Hab ${hab.numero} como finalizada?`
    if (!confirm(mensaje)) return
    setGuardando(true)
    const exito = await onHabilitar(hab, horaFin)
    setMostrarForm(false)
    setGuardando(false)
    if (exito && onSuccess) onSuccess()
  }

  const badgeColors = {
    pendiente_limpieza: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    en_limpieza: 'bg-blue-100 text-blue-800 border-blue-200',
    limpieza_simple: 'bg-orange-100 text-orange-800 border-orange-200',
    ocupada: 'bg-red-100 text-red-700 border-red-200',
    disponible: 'bg-green-100 text-green-700 border-green-200',
    mantenimiento: 'bg-gray-100 text-gray-600 border-gray-200'
  }

  const badgeLabels = {
    pendiente_limpieza: 'Limpieza Total Pendiente',
    en_limpieza: 'En Limpieza',
    limpieza_simple: 'Limpieza Simple Pendiente',
    ocupada: 'Ocupada',
    disponible: 'Disponible',
    mantenimiento: 'Mantenimiento'
  }

  const esLimpiezaMantenimiento = limpiezaActiva && (hab.estado === 'ocupada' || hab.estado === 'disponible')

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow">
      {!esVistaIntegrada && (
        <div className="flex justify-between items-start mb-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-2xl text-gray-800">Hab {hab.numero}</h3>
            </div>
            <p className="text-sm text-gray-500 font-medium">{hab.tipo_actual}</p>
            {hab.hospedajeActivo?.huesped_hospedaje?.[0]?.clientes?.nombres && (
              <p className="text-xs text-gray-400 mt-0.5">👤 {hab.hospedajeActivo.huesped_hospedaje[0].clientes.nombres}</p>
            )}
          </div>
          <span className={`text-xs font-bold px-3 py-1.5 rounded-lg border ${badgeColors[hab.estado] || badgeColors.disponible}`}>
            {badgeLabels[hab.estado] || hab.estado}
          </span>
        </div>
      )}

      {/* Flujo post-checkout: pendiente_limpieza / limpieza_simple → mostrar formulario de inicio */}
      {esPostCheckout && !limpiezaIniciada && (
        <FormularioLimpieza
          tiposLimpieza={tiposLimpieza}
          personal={personal} setPersonal={setPersonal}
          tipoSeleccionado={tipoSeleccionado} setTipoSeleccionado={setTipoSeleccionado}
          tipoLimpiezaId={tipoLimpiezaId} setTipoLimpiezaId={setTipoLimpiezaId}
          horaInicio={horaInicio} setHoraInicio={setHoraInicio}
          guardando={guardando}
          onIniciar={handleIniciar}
          mostrarTipoSimpleTotal={hab.estado === 'pendiente_limpieza'}
        />
      )}

      {/* Feedback tras iniciar limpieza en vista integrada (antes de que onSuccess recargue) */}
      {limpiezaIniciada && hab.estado !== 'en_limpieza' && (
        <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 text-center">
          <p className="text-sm text-blue-800 font-bold flex items-center justify-center gap-2">
            <span className="animate-pulse">⏳</span> Limpieza registrada. Recargando...
          </p>
        </div>
      )}

      {/* En proceso de limpieza: mostrar si hay limpiezaActiva (panel general) O si el estado ya es en_limpieza (vista integrada) */}
      {(limpiezaActiva || hab.estado === 'en_limpieza') && !esPostCheckout && !limpiezaIniciada && (
        <PanelFinalizar horaFin={horaFin} setHoraFin={setHoraFin} guardando={guardando} onHabilitar={handleHabilitar} mantenimiento={esLimpiezaMantenimiento} />
      )}

      {/* Cuando limpiezaIniciada=true y el estado ya es en_limpieza (acaba de iniciar en esta sesión) */}
      {limpiezaIniciada && hab.estado === 'en_limpieza' && (
        <PanelFinalizar horaFin={horaFin} setHoraFin={setHoraFin} guardando={guardando} onHabilitar={handleHabilitar} mantenimiento={false} />
      )}

      {/* Habitaciones ocupadas o disponibles: limpieza de mantenimiento opcional */}
      {!esPostCheckout && !limpiezaActiva && (hab.estado === 'ocupada' || hab.estado === 'disponible') && (
        mostrarForm ? (
          <FormularioLimpieza
            tiposLimpieza={tiposLimpieza}
            personal={personal} setPersonal={setPersonal}
            tipoSeleccionado={tipoSeleccionado} setTipoSeleccionado={setTipoSeleccionado}
            tipoLimpiezaId={tipoLimpiezaId} setTipoLimpiezaId={setTipoLimpiezaId}
            horaInicio={horaInicio} setHoraInicio={setHoraInicio}
            guardando={guardando}
            onIniciar={handleIniciar}
            mostrarTipoSimpleTotal={false}
          />
        ) : (
          <button
            onClick={() => setMostrarForm(true)}
            className="w-full py-2.5 border-2 border-dashed border-gray-200 text-gray-500 rounded-xl text-sm font-semibold hover:border-blue-300 hover:text-blue-600 transition-colors"
          >
            + Registrar limpieza de mantenimiento
          </button>
        )
      )}
    </div>
  )
}

function FormularioLimpieza({
  tiposLimpieza, personal, setPersonal, tipoSeleccionado, setTipoSeleccionado,
  tipoLimpiezaId, setTipoLimpiezaId, horaInicio, setHoraInicio, guardando, onIniciar,
  mostrarTipoSimpleTotal
}) {
  return (
    <div className="space-y-4">
      <div>
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">
          Personal asignado
        </label>
        <input
          type="text"
          value={personal}
          onChange={e => setPersonal(e.target.value)}
          placeholder="Nombre del personal"
          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
        />
      </div>

      {mostrarTipoSimpleTotal && (
        <div>
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">
            Alcance de la limpieza
          </label>
          <div className="flex gap-2">
            <button
              onClick={() => setTipoSeleccionado('total')}
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all border-2 ${
                tipoSeleccionado === 'total'
                  ? 'bg-yellow-50 text-yellow-700 border-yellow-500'
                  : 'bg-white text-gray-500 border-gray-100 hover:border-gray-200'
              }`}
            >
              🧹 Total
            </button>
            <button
              onClick={() => setTipoSeleccionado('simple')}
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all border-2 ${
                tipoSeleccionado === 'simple'
                  ? 'bg-orange-50 text-orange-700 border-orange-500'
                  : 'bg-white text-gray-500 border-gray-100 hover:border-gray-200'
              }`}
            >
              🧺 Simple
            </button>
          </div>
        </div>
      )}

      <div>
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">
          Tipo de limpieza
        </label>
        <select
          value={tipoLimpiezaId}
          onChange={e => setTipoLimpiezaId(e.target.value)}
          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
        >
          <option value="">Selecciona un tipo...</option>
          {tiposLimpieza.map(t => (
            <option key={t.id} value={t.id}>{t.nombre}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">
          Hora de inicio
        </label>
        <input
          type="time"
          value={horaInicio}
          onChange={e => setHoraInicio(e.target.value)}
          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
        />
      </div>

      <button
        onClick={onIniciar}
        disabled={guardando}
        className="w-full py-3 rounded-xl text-sm font-bold text-white shadow-sm transition-transform active:scale-[0.98] disabled:opacity-50 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700"
      >
        {guardando ? 'Guardando...' : '▶ Iniciar Limpieza'}
      </button>
    </div>
  )
}

function PanelFinalizar({ horaFin, setHoraFin, guardando, onHabilitar, mantenimiento }) {
  return (
    <div className="space-y-4">
      <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
        <p className="text-sm text-blue-800 flex items-center gap-2 font-medium">
          <span className="animate-pulse">⏳</span> Limpieza en progreso...
        </p>
      </div>
      <div>
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">
          Hora de finalización
        </label>
        <input
          type="time"
          value={horaFin}
          onChange={e => setHoraFin(e.target.value)}
          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all"
        />
      </div>
      <button
        onClick={onHabilitar}
        disabled={guardando}
        className="w-full py-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-xl text-sm font-bold shadow-sm transition-transform active:scale-[0.98] disabled:opacity-50"
      >
        {guardando ? 'Guardando...' : mantenimiento ? '✓ Marcar Limpieza Finalizada' : '✓ Marcar como Disponible'}
      </button>
    </div>
  )
}
