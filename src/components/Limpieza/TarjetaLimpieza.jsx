import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'

export default function TarjetaLimpieza({ hab, iniciarLimpieza, habilitarHabitacion }) {
  const { usuario } = useAuth()
  const [personal, setPersonal] = useState('')
  const [tipoSeleccionado, setTipoSeleccionado] = useState('total')
  const [horaInicio, setHoraInicio] = useState(new Date().toTimeString().slice(0, 5))
  const [horaFin, setHoraFin] = useState(new Date().toTimeString().slice(0, 5))
  const [guardando, setGuardando] = useState(false)

  async function handleIniciar() {
    setGuardando(true)
    await iniciarLimpieza(hab, usuario?.id, personal, tipoSeleccionado, horaInicio)
    setGuardando(false)
  }

  async function handleHabilitar() {
    if (!confirm(`¿Marcar Hab ${hab.numero} como disponible?`)) return
    setGuardando(true)
    await habilitarHabitacion(hab, horaFin)
    setGuardando(false)
  }

  const badgeColors = {
    pendiente_limpieza: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    en_limpieza: 'bg-blue-100 text-blue-800 border-blue-200',
    limpieza_simple: 'bg-orange-100 text-orange-800 border-orange-200'
  }

  const badgeLabels = {
    pendiente_limpieza: 'Limpieza Total Pendiente',
    en_limpieza: 'En Limpieza',
    limpieza_simple: 'Limpieza Simple Pendiente'
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-2xl text-gray-800">Hab {hab.numero}</h3>
          </div>
          <p className="text-sm text-gray-500 font-medium">{hab.tipo_actual}</p>
        </div>
        <span className={`text-xs font-bold px-3 py-1.5 rounded-lg border ${badgeColors[hab.estado]}`}>
          {badgeLabels[hab.estado]}
        </span>
      </div>

      {(hab.estado === 'pendiente_limpieza' || hab.estado === 'limpieza_simple') && (
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

          {hab.estado === 'pendiente_limpieza' && (
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">
                Tipo de limpieza
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
              <p className="text-xs text-gray-400 mt-2 italic">
                {tipoSeleccionado === 'total'
                  ? 'Limpieza profunda tras checkout.'
                  : 'Orden rápido, el huésped sigue alojado.'}
              </p>
            </div>
          )}

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
            onClick={handleIniciar}
            disabled={guardando}
            className={`w-full py-3 rounded-xl text-sm font-bold text-white shadow-sm transition-transform active:scale-[0.98] disabled:opacity-50 ${
              hab.estado === 'limpieza_simple' || tipoSeleccionado === 'simple'
                ? 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700'
                : 'bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700'
            }`}
          >
            {guardando ? 'Guardando...' : '▶ Iniciar Limpieza'}
          </button>
        </div>
      )}

      {hab.estado === 'en_limpieza' && (
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
            onClick={handleHabilitar}
            disabled={guardando}
            className="w-full py-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-xl text-sm font-bold shadow-sm transition-transform active:scale-[0.98] disabled:opacity-50"
          >
            {guardando ? 'Guardando...' : '✓ Marcar como Disponible'}
          </button>
        </div>
      )}
    </div>
  )
}
