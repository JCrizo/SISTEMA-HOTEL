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
    }, usuario)
    setGuardando(false)
  }

  return (
    <div className="bg-white rounded-2xl shadow-2xs border border-gray-100 p-5 sm:p-6 mb-6">
      <div className="mb-5 pb-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
          <h3 className="text-lg font-black text-gray-800">Apertura de Turno de Caja</h3>
        </div>
        <p className="text-xs text-gray-400 font-medium mt-0.5">
          Inicia tu jornada registrando los saldos iniciales recibidos
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2 block">
            Selecciona el Turno
          </label>
          <div className="grid grid-cols-3 gap-2.5">
            {['mañana', 'tarde', 'noche'].map(t => (
              <label 
                key={t} 
                className={`cursor-pointer rounded-xl border-2 p-2.5 text-center transition-all flex flex-col items-center justify-center ${
                  tipoTurno === t 
                    ? 'border-blue-600 bg-blue-50/70 text-blue-700 font-bold shadow-2xs' 
                    : 'border-gray-100 bg-gray-50/60 text-gray-500 hover:border-gray-200'
                }`}
              >
                <input 
                  type="radio" 
                  name="tipoTurno" 
                  value={t} 
                  checked={tipoTurno === t}
                  onChange={() => setTipoTurno(t)}
                  className="hidden" 
                />
                <span className="capitalize text-xs sm:text-sm font-black">{t}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1 block">
              Caja Principal Inicial (S/) *
            </label>
            <input
              type="number"
              step="0.01"
              required
              value={cajaPrincipalInicial}
              onChange={e => setCajaPrincipalInicial(e.target.value)}
              placeholder="0.00"
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-base font-bold text-gray-800 focus:border-blue-500 focus:bg-white outline-none transition-colors"
            />
            <span className="text-[11px] text-gray-400 mt-1 block">Físico en caja para vuelto</span>
          </div>

          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1 block">
              Caja Consumos Inicial (S/)
            </label>
            <input
              type="number"
              step="0.01"
              value={cajaConsumosInicial}
              onChange={e => setCajaConsumosInicial(e.target.value)}
              placeholder="0.00"
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-base font-bold text-gray-800 focus:border-blue-500 focus:bg-white outline-none transition-colors"
            />
            <span className="text-[11px] text-gray-400 mt-1 block">Físico en cafetería o tienda</span>
          </div>
        </div>

        <button
          onClick={handleAbrir}
          disabled={guardando || !cajaPrincipalInicial}
          className="w-full py-3.5 mt-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-bold text-sm shadow-xs transition-all active:scale-[0.98] disabled:opacity-50"
        >
          {guardando ? 'Aperturando turno...' : 'Aperturar Turno de Caja'}
        </button>
      </div>
    </div>
  )
}
