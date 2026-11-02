import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import Icono from '../Compartido/Icono'

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
    pendiente_limpieza: 'badge-warn',
    en_limpieza: 'badge-info',
    limpieza_simple: 'badge-warn',
    ocupada: 'badge-danger',
    disponible: 'badge-ok',
    mantenimiento: 'badge-muted'
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
    <div className="card card-hover p-4 sm:p-5">
      {!esVistaIntegrada && (
        <div className="flex justify-between items-start mb-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-black text-2xl text-gray-800 tracking-tight">Hab {hab.numero}</h3>
            </div>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-wide">{hab.tipo_actual}</p>
            {hab.hospedajeActivo?.huesped_hospedaje?.[0]?.clientes?.nombres && (
              <p className="text-xs text-gray-500 font-medium mt-1 flex items-center gap-1"><Icono name="user" className="w-3 h-3" /> {hab.hospedajeActivo.huesped_hospedaje[0].clientes.nombres}</p>
            )}
          </div>
          <span className={`badge shrink-0 ${badgeColors[hab.estado] || badgeColors.disponible}`}>
            {badgeLabels[hab.estado] || hab.estado}
          </span>
        </div>
      )}

      {/* Flujo post-checkout con limpieza activa: mostrar panel finalizar */}
      {esPostCheckout && limpiezaActiva && !limpiezaIniciada && (
        <PanelFinalizar horaFin={horaFin} setHoraFin={setHoraFin} guardando={guardando} onHabilitar={handleHabilitar} mantenimiento={false} />
      )}

      {/* Flujo post-checkout sin limpieza activa: formulario para iniciarla O bypass directo */}
      {esPostCheckout && !limpiezaActiva && !limpiezaIniciada && (
        <div className="space-y-3">
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
          {/* Bypass: marcar disponible directamente sin registrar limpieza */}
          <button
            onClick={handleHabilitar}
            disabled={guardando}
            className="btn w-full border-2 border-dashed border-emerald-300 text-emerald-700 hover:bg-emerald-50 !whitespace-normal text-center"
          >
            {guardando ? 'Guardando...' : (<><Icono name="check" className="w-4 h-4 shrink-0" /> Marcar como disponible (sin registrar limpieza)</>)}
          </button>
        </div>
      )}

      {/* Feedback tras iniciar limpieza (antes de que onSuccess recargue) */}
      {limpiezaIniciada && hab.estado !== 'en_limpieza' && (
        <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 text-center">
          <p className="text-sm text-blue-800 font-bold flex items-center justify-center gap-2">
            <Icono name="clock" className="w-4 h-4 animate-pulse" /> Limpieza registrada. Recargando...
          </p>
        </div>
      )}

      {/* En proceso de limpieza (panel general o vista integrada) */}
      {(limpiezaActiva || hab.estado === 'en_limpieza') && !esPostCheckout && !limpiezaIniciada && (
        <PanelFinalizar horaFin={horaFin} setHoraFin={setHoraFin} guardando={guardando} onHabilitar={handleHabilitar} mantenimiento={esLimpiezaMantenimiento} />
      )}

      {/* Acaba de iniciar limpieza en esta sesión */}
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
            className="btn w-full border-2 border-dashed border-gray-200 text-gray-500 hover:border-blue-300 hover:text-blue-600"
          >
            <Icono name="plus" className="w-4 h-4" /> Registrar limpieza de mantenimiento
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
        <label className="label">
          Personal asignado
        </label>
        <input
          type="text"
          value={personal}
          onChange={e => setPersonal(e.target.value)}
          placeholder="Nombre del personal"
          className="input"
        />
      </div>

      {mostrarTipoSimpleTotal && (
        <div>
          <label className="label">
            Alcance de la limpieza
          </label>
          <div className="flex gap-2">
            <button
              onClick={() => setTipoSeleccionado('total')}
              className={`btn flex-1 border ${
                tipoSeleccionado === 'total'
                  ? 'bg-amber-50 text-amber-700 border-amber-500'
                  : 'bg-white text-gray-500 border-gray-100 hover:border-gray-200'
              }`}
            >
              <Icono name="broom" className="w-4 h-4" /> Total
            </button>
            <button
              onClick={() => setTipoSeleccionado('simple')}
              className={`btn flex-1 border ${
                tipoSeleccionado === 'simple'
                  ? 'bg-blue-50 text-blue-700 border-blue-500'
                  : 'bg-white text-gray-500 border-gray-100 hover:border-gray-200'
              }`}
            >
              <Icono name="sparkles" className="w-4 h-4" /> Simple
            </button>
          </div>
        </div>
      )}

      <div>
        <label className="label">
          Tipo de limpieza
        </label>
        <select
          value={tipoLimpiezaId}
          onChange={e => setTipoLimpiezaId(e.target.value)}
          className="input"
        >
          <option value="">Selecciona un tipo...</option>
          {tiposLimpieza.map(t => (
            <option key={t.id} value={t.id}>{t.nombre}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="label">
          Hora de inicio
        </label>
        <input
          type="time"
          value={horaInicio}
          onChange={e => setHoraInicio(e.target.value)}
          className="input"
        />
      </div>

      <button
        onClick={onIniciar}
        disabled={guardando}
        className="btn btn-primary w-full"
      >
        {guardando ? 'Guardando...' : 'Iniciar limpieza'}
      </button>
    </div>
  )
}

function PanelFinalizar({ horaFin, setHoraFin, guardando, onHabilitar, mantenimiento }) {
  return (
    <div className="space-y-4">
      <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
        <p className="text-sm text-blue-800 flex items-center gap-2 font-medium">
          <Icono name="clock" className="w-4 h-4 animate-pulse" /> Limpieza en progreso...
        </p>
      </div>
      <div>
        <label className="label">
          Hora de finalización
        </label>
        <input
          type="time"
          value={horaFin}
          onChange={e => setHoraFin(e.target.value)}
          className="input"
        />
      </div>
      <button
        onClick={onHabilitar}
        disabled={guardando}
        className="btn btn-success w-full"
      >
        {guardando ? 'Guardando...' : (<><Icono name="check" className="w-4 h-4" /> {mantenimiento ? 'Marcar limpieza finalizada' : 'Marcar como disponible'}</>)}
      </button>
    </div>
  )
}

