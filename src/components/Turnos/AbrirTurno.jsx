import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'

export default function AbrirTurno({ abrirTurno }) {
  const { usuario } = useAuth()
  const [tipoTurno, setTipoTurno] = useState('mañana')
  const [cajaPrincipalInicial, setCajaPrincipalInicial] = useState('')
  const [cajaConsumosInicial, setCajaConsumosInicial] = useState('')
  const [guardando, setGuardando] = useState(false)

  async function handleAbrir() {
    if (!cajaPrincipalInicial) return
    setGuardando(true)
    await abrirTurno({
      tipo: tipoTurno,
      usuarioId: usuario?.id,
      cajaPrincipalInicial,
      cajaConsumosInicial: cajaConsumosInicial || 0
    })
    setGuardando(false)
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
      <div className="mb-6">
        <h3 className="text-xl font-bold text-gray-800">Apertura de Turno</h3>
        <p className="text-sm text-gray-500">Inicia tu jornada registrando los saldos iniciales.</p>
      </div>

      <div className="space-y-5">
        <div>
          <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2 block">
            Turno
          </label>
          <div className="flex gap-3">
            {['mañana', 'tarde', 'noche'].map(t => (
              <label key={t} className={`flex-1 cursor-pointer rounded-xl border-2 p-3 text-center transition-all ${
                tipoTurno === t 
                  ? 'border-blue-500 bg-blue-50 text-blue-700 font-bold' 
                  : 'border-gray-100 bg-white text-gray-500 hover:border-gray-200'
              }`}>
                <input 
                  type="radio" 
                  name="tipoTurno" 
                  value={t} 
                  checked={tipoTurno === t}
                  onChange={() => setTipoTurno(t)}
                  className="hidden" 
                />
                <span className="capitalize">{t}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2 block">
              Caja Principal Inicial (S/)
            </label>
            <input
              type="number"
              value={cajaPrincipalInicial}
              onChange={e => setCajaPrincipalInicial(e.target.value)}
              placeholder="0.00"
              className="w-full border-2 border-gray-100 rounded-xl px-4 py-3 text-lg font-semibold focus:ring-0 focus:border-blue-500 outline-none transition-colors"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2 block">
              Caja Consumos Inicial (S/)
            </label>
            <input
              type="number"
              value={cajaConsumosInicial}
              onChange={e => setCajaConsumosInicial(e.target.value)}
              placeholder="0.00"
              className="w-full border-2 border-gray-100 rounded-xl px-4 py-3 text-lg font-semibold focus:ring-0 focus:border-blue-500 outline-none transition-colors"
            />
          </div>
        </div>

        <button
          onClick={handleAbrir}
          disabled={guardando || !cajaPrincipalInicial}
          className="w-full py-4 mt-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-bold text-lg shadow-sm transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {guardando ? 'Iniciando...' : 'Abrir Turno'}
        </button>
      </div>
    </div>
  )
}
