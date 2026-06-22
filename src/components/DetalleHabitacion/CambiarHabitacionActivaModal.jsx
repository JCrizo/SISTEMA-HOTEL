import { useState, useEffect } from 'react'
import { useHabitaciones } from '../../hooks/useHabitaciones'

export default function CambiarHabitacionActivaModal({ hospedaje, habActual, cambiarHabitacion, onClose }) {
  const { habitaciones, cargarDisponibles } = useHabitaciones()
  const [nuevaHabitacionId, setNuevaHabitacionId] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    cargarDisponibles()
  }, [cargarDisponibles])

  async function handleGuardar() {
    if (!nuevaHabitacionId) return
    if (nuevaHabitacionId === habActual.id) {
      onClose()
      return
    }

    if (!confirm('¿Confirma que desea mover a este huésped a una nueva habitación? La cuenta y consumos se trasladarán.')) return

    setGuardando(true)
    const exito = await cambiarHabitacion(nuevaHabitacionId)
    setGuardando(false)
    
    if (exito) {
      // Reload the page or close modal, DetalleHabitacion needs to redirect or update
      // Since the guest is moved to a new room, we should redirect to the home page or new room
      window.location.href = `/checkin/${nuevaHabitacionId}`
    } else {
      setError('Error al cambiar la habitación')
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-fadeIn">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <h3 className="font-black text-gray-800 text-lg">Cambiar Habitación Actual</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 bg-white hover:bg-gray-100 rounded-full p-2 transition-colors">
            ✕
          </button>
        </div>

        <div className="p-6">
          <div className="mb-6 bg-blue-50 p-4 rounded-2xl border border-blue-100">
            <p className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-1">Mover a</p>
            <p className="text-base font-black text-blue-900">{hospedaje.huesped_hospedaje?.[0]?.clientes?.nombres}</p>
            <p className="text-xs font-bold text-blue-600 mt-2">Sale de: Habitación {habActual.numero}</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-2">
                Seleccione la nueva habitación (Disponibles)
              </label>
              <select
                value={nuevaHabitacionId}
                onChange={e => setNuevaHabitacionId(e.target.value)}
                className="w-full border-2 border-gray-100 rounded-xl px-4 py-3 text-sm font-bold text-gray-700 outline-none focus:border-blue-500 bg-gray-50 transition-colors"
              >
                <option value="">-- Seleccionar --</option>
                {habitaciones.map(h => (
                  <option key={h.id} value={h.id}>
                    Hab {h.numero} — {h.tipo_actual} (S/{h.precio_actual})
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
            onClick={handleGuardar}
            disabled={guardando || !nuevaHabitacionId}
            className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-sm disabled:opacity-50 transition-colors"
          >
            {guardando ? 'Guardando...' : 'Mover Huésped'}
          </button>
        </div>
      </div>
    </div>
  )
}
