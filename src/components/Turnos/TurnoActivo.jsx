import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'

export default function TurnoActivo({ turno, pagosTurno, movimientos, registrarMovimiento }) {
  const [mostrarMovimiento, setMostrarMovimiento] = useState(false)
  const [tipoMov, setTipoMov] = useState('salida')
  const [cajaOrigen, setCajaOrigen] = useState('principal')
  const [cajaDestino, setCajaDestino] = useState('consumos')
  const [montoMov, setMontoMov] = useState('')
  const [conceptoMov, setConceptoMov] = useState('')
  const [autorizadoPor, setAutorizadoPor] = useState('')
  const [guardando, setGuardando] = useState(false)
  const { usuario } = useAuth()

  const efectivo = pagosTurno.filter(p => p.metodo === 'efectivo').reduce((s, p) => s + parseFloat(p.monto), 0)
  const yape = pagosTurno.filter(p => p.metodo === 'yape').reduce((s, p) => s + parseFloat(p.monto), 0)
  const tarjeta = pagosTurno.filter(p => p.metodo === 'tarjeta').reduce((s, p) => s + parseFloat(p.monto), 0)
  const transferencia = pagosTurno.filter(p => p.metodo === 'transferencia').reduce((s, p) => s + parseFloat(p.monto), 0)
  const otros = pagosTurno.filter(p => !['efectivo','yape','tarjeta','transferencia'].includes(p.metodo)).reduce((s, p) => s + parseFloat(p.monto), 0)

  async function handleRegistrarMovimiento() {
    if (!montoMov || !conceptoMov) return
    setGuardando(true)
    const exito = await registrarMovimiento({
      tipo: tipoMov,
      cajaOrigen,
      cajaDestino,
      monto: montoMov,
      concepto: conceptoMov,
      autorizadoPor
    }, usuario)
    if (exito) {
      setMontoMov('')
      setConceptoMov('')
      setAutorizadoPor('')
      setMostrarMovimiento(false)
    }
    setGuardando(false)
  }

  return (
    <div className="space-y-4 mb-6">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-xl font-bold text-gray-800">Turno Activo</h3>
            <p className="text-sm text-gray-500 mt-1">Abierto: {new Date(turno.apertura).toLocaleString('es-PE')}</p>
          </div>
          <span className="text-sm font-bold px-4 py-1.5 rounded-full bg-green-100 text-green-800 uppercase tracking-wide">
            {turno.tipo}
          </span>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
            <p className="text-xs text-gray-500 font-bold uppercase mb-1">Caja Inicial</p>
            <p className="text-lg font-black text-gray-800">S/{turno.caja_principal_anterior}</p>
          </div>
          <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
            <p className="text-xs text-blue-600 font-bold uppercase mb-1">Caja Principal</p>
            <p className="text-xl font-black text-blue-900">S/{turno.caja_principal_actual}</p>
          </div>
          <div className="bg-orange-50 rounded-xl p-4 border border-orange-100">
            <p className="text-xs text-orange-600 font-bold uppercase mb-1">Caja Consumos</p>
            <p className="text-xl font-black text-orange-900">S/{turno.caja_consumos_actual}</p>
          </div>
          <div className="bg-green-50 rounded-xl p-4 border border-green-100">
            <p className="text-xs text-green-600 font-bold uppercase mb-1">Ingresos Efectivo</p>
            <p className="text-lg font-black text-green-900">S/{efectivo.toFixed(2)}</p>
          </div>
        </div>

        {pagosTurno.length > 0 && (
          <div className="border-t border-gray-100 pt-5">
            <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-3">Medios de pago (solo ingresos)</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {yape > 0 && (
                <div className="flex justify-between text-sm items-center bg-gray-50 p-2 rounded-lg">
                  <span className="text-gray-600 flex items-center gap-2">📱 Yape</span>
                  <span className="font-bold text-gray-800">S/{yape.toFixed(2)}</span>
                </div>
              )}
              {tarjeta > 0 && (
                <div className="flex justify-between text-sm items-center bg-gray-50 p-2 rounded-lg">
                  <span className="text-gray-600 flex items-center gap-2">💳 Tarjeta</span>
                  <span className="font-bold text-gray-800">S/{tarjeta.toFixed(2)}</span>
                </div>
              )}
              {transferencia > 0 && (
                <div className="flex justify-between text-sm items-center bg-gray-50 p-2 rounded-lg">
                  <span className="text-gray-600 flex items-center gap-2">🏦 Transf.</span>
                  <span className="font-bold text-gray-800">S/{transferencia.toFixed(2)}</span>
                </div>
              )}
              {otros > 0 && (
                <div className="flex justify-between text-sm items-center bg-gray-50 p-2 rounded-lg">
                  <span className="text-gray-600 flex items-center gap-2">Otros</span>
                  <span className="font-bold text-gray-800">S/{otros.toFixed(2)}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex justify-between items-center mb-4">
          <h4 className="text-lg font-bold text-gray-800">Movimientos de Caja</h4>
          <button
            onClick={() => setMostrarMovimiento(!mostrarMovimiento)}
            className="text-sm font-bold text-blue-600 bg-blue-50 px-4 py-2 rounded-xl hover:bg-blue-100 transition-colors"
          >
            + Registrar Movimiento
          </button>
        </div>

        {mostrarMovimiento && (
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 mb-6 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Tipo de Operación</label>
                <select
                  value={tipoMov}
                  onChange={e => setTipoMov(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500"
                >
                  <option value="salida">Salida de caja (Gasto)</option>
                  <option value="prestamo_entre_cajas">Préstamo entre cajas</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Caja Origen (Retiro)</label>
                <select
                  value={cajaOrigen}
                  onChange={e => setCajaOrigen(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500"
                >
                  <option value="principal">Caja Principal</option>
                  <option value="consumos">Caja Consumos</option>
                </select>
              </div>
              {tipoMov === 'prestamo_entre_cajas' && (
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Caja Destino (Ingreso)</label>
                  <select
                    value={cajaDestino}
                    onChange={e => setCajaDestino(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500"
                  >
                    <option value="consumos">Caja Consumos</option>
                    <option value="principal">Caja Principal</option>
                  </select>
                </div>
              )}
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Monto S/</label>
                <input
                  type="number"
                  value={montoMov}
                  onChange={e => setMontoMov(e.target.value)}
                  placeholder="0.00"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500"
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Concepto / Motivo</label>
              <input
                type="text"
                value={conceptoMov}
                onChange={e => setConceptoMov(e.target.value)}
                placeholder="Ej: Compra de útiles de aseo"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Autorizado por (Opcional)</label>
              <input
                type="text"
                value={autorizadoPor}
                onChange={e => setAutorizadoPor(e.target.value)}
                placeholder="Nombre del administrador"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500"
              />
            </div>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setMostrarMovimiento(false)}
                className="flex-1 py-2 text-sm font-bold text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleRegistrarMovimiento}
                disabled={guardando || !montoMov || !conceptoMov}
                className="flex-[2] py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-lg shadow-sm transition-colors disabled:opacity-50"
              >
                {guardando ? 'Guardando...' : 'Confirmar Operación'}
              </button>
            </div>
          </div>
        )}

        <div className="space-y-2">
          {movimientos.length === 0 ? (
             <p className="text-sm text-gray-400 italic text-center py-4">No se han registrado movimientos de caja.</p>
          ) : (
            movimientos.map(mov => (
              <div key={mov.id} className="flex justify-between items-start py-3 border-b border-gray-50 last:border-0 last:pb-0">
                <div>
                  <p className="text-sm font-bold text-gray-800">{mov.concepto}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {mov.tipo === 'prestamo_entre_cajas'
                      ? `🔄 Préstamo: ${mov.caja_origen} → ${mov.caja_destino}`
                      : `💸 Salida: ${mov.caja_origen}`}
                  </p>
                  {mov.autorizado_por && (
                    <p className="text-xs text-gray-400 font-medium">🛡️ Autorizado: {mov.autorizado_por}</p>
                  )}
                </div>
                <span className="text-sm font-bold text-red-600 bg-red-50 px-2 py-1 rounded-lg">− S/{parseFloat(mov.monto).toFixed(2)}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
