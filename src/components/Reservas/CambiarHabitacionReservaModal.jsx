import { useState, useEffect } from 'react'
import { habitacionesService } from '../../services/habitacionesService'
import { useReservas } from '../../hooks/useReservas'
import { useAuth } from '../../context/AuthContext'

export default function CambiarHabitacionReservaModal({ reserva, onClose }) {
  const [habitacionesDisponibles, setHabitacionesDisponibles] = useState([])
  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [nuevaHabitacionId, setNuevaHabitacionId] = useState('')
  const [error, setError] = useState('')
  const { actualizarHabitacionReserva } = useReservas()
  const { usuario } = useAuth()

  useEffect(() => {
    async function cargarHabitaciones() {
      const todas = await habitacionesService.obtenerTodas()
      // Filtramos las que NO están ocupadas, ni en limpieza profunda, ni mantenimiento, etc.
      // Puedes adaptar el filtro según tu lógica de negocio.
      const disponibles = todas.filter(h => h.estado !== 'ocupada' && h.estado !== 'mantenimiento')
      setHabitacionesDisponibles(disponibles)
      setCargando(false)
    }
    cargarHabitaciones()
  }, [])

  async function handleConfirmar() {
    if (!nuevaHabitacionId) return
    setGuardando(true)
    const exito = await actualizarHabitacionReserva(reserva, nuevaHabitacionId, usuario)
    setGuardando(false)
    if (exito) {
      onClose()
    } else {
      setError('Error al cambiar la habitación')
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-fadeIn">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <h3 className="font-black text-gray-800 text-lg">Cambiar Habitación</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 bg-white hover:bg-gray-100 rounded-full p-2 transition-colors">
            ✕
          </button>
        </div>

        <div className="p-6">
          <div className="mb-6 bg-indigo-50 p-4 rounded-2xl border border-indigo-100">
            <p className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-1">Reserva de</p>
            <p className="text-base font-black text-indigo-900">{reserva.clientes?.nombres}</p>
            <p className="text-xs font-bold text-indigo-600 mt-2">Habitación actual: {reserva.habitaciones?.numero}</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-2">
                Nueva Habitación (Para reserva a futuro)
              </label>
              <select
                value={nuevaHabitacionId}
                onChange={e => setNuevaHabitacionId(e.target.value)}
                className="w-full border-2 border-gray-100 rounded-xl px-4 py-3 text-sm font-bold text-gray-700 outline-none focus:border-indigo-500 bg-gray-50 transition-colors"
              >
                <option value="">Selecciona una habitación</option>
                {habitacionesDisponibles.map(h => (
                  <option key={h.id} value={h.id}>
                    Hab {h.numero} — {h.tipo_actual} (S/{h.precio_actual}) - {h.estado}
                  </option>
                ))}
              </select>
            </div>

            {error && <p className="text-sm font-bold text-red-500">{error}</p>}
          </div>
        </div>

        <div className="px-6 py-5 bg-gray-50 border-t border-gray-100 flex gap-3">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl text-gray-600 font-bold hover:bg-gray-200 transition-colors">
            Cancelar
          </button>
          <button 
            onClick={handleConfirmar}
            disabled={guardando || !nuevaHabitacionId}
            className="flex-1 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-sm disabled:opacity-50 transition-colors"
          >
            {guardando ? 'Guardando...' : 'Confirmar'}
          </button>
        </div>
      </div>
    </div>
  )
}
