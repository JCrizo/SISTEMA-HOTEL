import { useState, useEffect } from 'react'
import { useHabitaciones } from '../../hooks/useHabitaciones'

export default function CambiarHabitacionHospedajeModal({ hab, cambiarHabitacionHospedaje, onClose }) {
  const { habitaciones, cargarDisponibles } = useHabitaciones()
  const [nuevaHabitacionId, setNuevaHabitacionId] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    cargarDisponibles()
  }, [cargarDisponibles])

  async function handleGuardar() {
    setError('')
    if (!nuevaHabitacionId) { setError('Selecciona una habitación'); return }

    const nuevaHab = habitaciones.find(h => h.id === nuevaHabitacionId)
    if (!confirm(`¿Mover al huésped de Hab ${hab.numero} a Hab ${nuevaHab?.numero}? La Hab ${hab.numero} quedará pendiente de limpieza.`)) return

    setGuardando(true)
    const resultado = await cambiarHabitacionHospedaje(nuevaHabitacionId)
    setGuardando(false)
    if (!resultado.exito) {
      setError(resultado.error || 'No se pudo cambiar la habitación')
    }
    // Si fue exitoso, el componente padre navega a la nueva habitación,
    // por lo que este modal desaparece junto con la pantalla actual.
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-gray-800">Cambiar Habitación</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">✕</button>
        </div>

        <p className="text-sm text-gray-500 mb-4">
          Mover al huésped actual desde <span className="font-bold text-gray-700">Hab {hab.numero}</span> a otra habitación disponible.
        </p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg p-3 mb-3">
            {error}
          </div>
        )}

        <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1.5">Nueva habitación (disponibles ahora)</label>
        <select
          value={nuevaHabitacionId}
          onChange={e => setNuevaHabitacionId(e.target.value)}
          className="w-full border-2 border-gray-100 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-500 bg-gray-50 focus:bg-white transition-colors"
        >
          <option value="">Seleccionar habitación...</option>
          {habitaciones.map(h => (
            <option key={h.id} value={h.id}>
              Hab {h.numero} — {h.tipo_actual} (S/{h.precio_actual})
            </option>
          ))}
        </select>

        {habitaciones.length === 0 && (
          <p className="text-xs text-amber-600 font-bold mt-1.5 bg-amber-50 px-3 py-2 rounded-lg">
            No hay habitaciones disponibles ahora mismo.
          </p>
        )}

        <div className="flex gap-3 mt-6">
          <button onClick={onClose}
            className="flex-1 py-3 border-2 border-gray-200 rounded-xl text-gray-600 font-bold hover:bg-gray-50 transition-colors">
            Cancelar
          </button>
          <button onClick={handleGuardar} disabled={guardando || habitaciones.length === 0}
            className="flex-[2] py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-md hover:bg-indigo-700 active:scale-[0.98] transition-transform disabled:opacity-50">
            {guardando ? 'Moviendo...' : 'Confirmar Cambio'}
          </button>
        </div>
      </div>
    </div>
  )
}
