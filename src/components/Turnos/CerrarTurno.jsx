import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function CerrarTurno({ cerrarTurno }) {
  const navigate = useNavigate()
  const { logout } = useAuth()
  const [cajaPrincipalFinal, setCajaPrincipalFinal] = useState('')
  const [cajaConsumosFinal, setCajaConsumosFinal] = useState('')
  const [observaciones, setObservaciones] = useState('')
  const [guardando, setGuardando] = useState(false)

  async function handleCerrar() {
    if (!cajaPrincipalFinal) return
    if (!confirm('¿Confirmar cierre de turno? Se cerrará tu sesión automáticamente para entregar el turno.')) return
    
    setGuardando(true)
    const exito = await cerrarTurno(cajaPrincipalFinal, cajaConsumosFinal, observaciones)
    if (exito) {
      logout()
      navigate('/login')
    }
    setGuardando(false)
  }

  return (
    <div className="bg-red-50 rounded-2xl shadow-sm border border-red-100 p-6">
      <div className="mb-6">
        <h3 className="text-xl font-bold text-red-800">Cierre de Turno</h3>
        <p className="text-sm text-red-600/80">Declara el dinero físico antes de entregar la caja.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label className="text-xs font-bold text-red-700 uppercase block mb-1">Caja Principal Final (S/)</label>
          <input
            type="number"
            value={cajaPrincipalFinal}
            onChange={e => setCajaPrincipalFinal(e.target.value)}
            placeholder="Efectivo en caja"
            className="w-full border-2 border-red-200 rounded-xl px-4 py-3 text-lg font-bold focus:border-red-500 outline-none bg-white"
          />
        </div>
        <div>
          <label className="text-xs font-bold text-red-700 uppercase block mb-1">Caja Consumos Final (S/)</label>
          <input
            type="number"
            value={cajaConsumosFinal}
            onChange={e => setCajaConsumosFinal(e.target.value)}
            placeholder="Efectivo en caja"
            className="w-full border-2 border-red-200 rounded-xl px-4 py-3 text-lg font-bold focus:border-red-500 outline-none bg-white"
          />
        </div>
      </div>
      
      <div className="mb-6">
        <label className="text-xs font-bold text-red-700 uppercase block mb-1">Novedades u Observaciones</label>
        <textarea
          value={observaciones}
          onChange={e => setObservaciones(e.target.value)}
          placeholder="Ej: Faltan 10 soles en caja principal, dejé llave en recepción..."
          className="w-full border border-red-200 rounded-xl px-4 py-3 text-sm focus:border-red-500 outline-none min-h-[100px] resize-y bg-white"
        />
      </div>

      <button
        onClick={handleCerrar}
        disabled={guardando || !cajaPrincipalFinal}
        className="w-full py-4 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-xl text-lg font-black shadow-md transition-transform active:scale-[0.98] disabled:opacity-50"
      >
        {guardando ? 'Cerrando turno...' : 'Entregar Turno y Salir'}
      </button>
    </div>
  )
}
