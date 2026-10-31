import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import Icono from '../Compartido/Icono'

export default function CerrarTurno({ cerrarTurno }) {
  const navigate = useNavigate()
  const { logout, usuario } = useAuth()
  const [cajaPrincipalFinal, setCajaPrincipalFinal] = useState('')
  const [cajaConsumosFinal, setCajaConsumosFinal] = useState('')
  const [observaciones, setObservaciones] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')

  async function handleCerrar() {
    if (!cajaPrincipalFinal) return
    if (!confirm('¿Confirmar cierre de turno? Se cerrará tu sesión automáticamente para entregar la caja al siguiente turno.')) return
    
    setError('')
    setGuardando(true)
    const exito = await cerrarTurno(cajaPrincipalFinal, cajaConsumosFinal, observaciones, usuario)
    if (exito) {
      logout()
      navigate('/login')
    } else {
      setError('Error al cerrar el turno. Verifica que tengas los permisos correspondientes o que la conexión esté activa.')
    }
    setGuardando(false)
  }

  return (
    <div className="bg-white rounded-2xl shadow-2xs border border-rose-100 p-5 sm:p-6">
      <div className="mb-5 pb-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
          <h3 className="text-lg font-black text-gray-800">Cierre y Entrega de Turno</h3>
        </div>
        <p className="text-xs text-gray-400 font-medium mt-0.5">
          Declara el conteo de dinero físico que dejas físicamente en la gaveta
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="text-xs font-bold text-gray-600 uppercase tracking-wide block mb-1">
            Caja Principal Final (S/) *
          </label>
          <input
            type="number"
            step="0.01"
            required
            value={cajaPrincipalFinal}
            onChange={e => setCajaPrincipalFinal(e.target.value)}
            placeholder="0.00"
            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-lg font-black text-gray-800 focus:border-rose-500 focus:bg-white outline-none transition-colors"
          />
          <span className="text-[11px] text-gray-400 mt-1 block">Efectivo total en billetes/monedas</span>
        </div>

        <div>
          <label className="text-xs font-bold text-gray-600 uppercase tracking-wide block mb-1">
            Caja Consumos Final (S/)
          </label>
          <input
            type="number"
            step="0.01"
            value={cajaConsumosFinal}
            onChange={e => setCajaConsumosFinal(e.target.value)}
            placeholder="0.00"
            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-lg font-black text-gray-800 focus:border-rose-500 focus:bg-white outline-none transition-colors"
          />
          <span className="text-[11px] text-gray-400 mt-1 block">Efectivo de ventas de cafetería/tienda</span>
        </div>
      </div>
      
      <div className="mb-5">
        <label className="text-xs font-bold text-gray-600 uppercase tracking-wide block mb-1">
          Novedades u Observaciones de Entrega
        </label>
        <textarea
          value={observaciones}
          onChange={e => setObservaciones(e.target.value)}
          placeholder="Ej: Faltan S/ 5 en caja chica, dejé llave de habitación 204 en recepción..."
          className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-xs sm:text-sm focus:border-rose-500 focus:bg-white outline-none min-h-[80px] resize-y"
        />
      </div>

      {error && (
        <div className="mb-5 bg-rose-50 border border-rose-200 text-rose-700 p-3.5 rounded-xl text-xs font-bold">
          <Icono name="alert" className="w-4 h-4 inline-block shrink-0" /> {error}
        </div>
      )}

      <button
        onClick={handleCerrar}
        disabled={guardando || !cajaPrincipalFinal}
        className="w-full py-3.5 bg-gradient-to-r from-rose-600 to-rose-600 hover:from-rose-700 hover:to-rose-700 text-white rounded-xl text-sm font-bold shadow-xs transition-all active:scale-[0.98] disabled:opacity-50"
      >
        {guardando ? 'Cerrando turno y sesión...' : 'Entregar Turno y Cerrar Sesión'}
      </button>
    </div>
  )
}
