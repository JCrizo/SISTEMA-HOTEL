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

  // Cálculo del Efectivo Físico Real en la caja principal
  const salidasPrincipal = movimientos.filter(m => m.tipo === 'salida' && m.caja_origen === 'principal').reduce((s, m) => s + parseFloat(m.monto), 0)
  const prestamosSalida = movimientos.filter(m => m.tipo === 'prestamo_entre_cajas' && m.caja_origen === 'principal').reduce((s, m) => s + parseFloat(m.monto), 0)
  const prestamosEntrada = movimientos.filter(m => m.tipo === 'prestamo_entre_cajas' && m.caja_destino === 'principal').reduce((s, m) => s + parseFloat(m.monto), 0)
  
  const efectivoEnCaja = parseFloat(turno.caja_principal_anterior || 0) + efectivo - salidasPrincipal - prestamosSalida + prestamosEntrada

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
            <p className="text-xs text-gray-500 font-bold uppercase mb-1">Caja Inicial (Físico)</p>
            <p className="text-lg font-black text-gray-800">S/{turno.caja_principal_anterior}</p>
          </div>
          <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
            <p className="text-xs text-blue-600 font-bold uppercase mb-1" title="Incluye efectivo inicial + pagos efectivo + yape/tarjeta">Total Acumulado</p>
            <p className="text-xl font-black text-blue-900">S/{turno.caja_principal_actual}</p>
          </div>
          <div className="bg-green-50 rounded-xl p-4 border border-green-200 shadow-inner">
            <p className="text-xs text-green-700 font-bold uppercase mb-1">Efectivo en Caja</p>
            <p className="text-xl font-black text-green-900">S/{efectivoEnCaja.toFixed(2)}</p>
          </div>
          <div className="bg-orange-50 rounded-xl p-4 border border-orange-100">
            <p className="text-xs text-orange-600 font-bold uppercase mb-1">Caja Consumos</p>
            <p className="text-xl font-black text-orange-900">S/{turno.caja_consumos_actual}</p>
          </div>
        </div>

        <div className="border-t border-gray-100 pt-5">
          <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-3">Detalle de Ingresos (Este Turno)</p>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="flex flex-col text-sm bg-gray-50 p-3 rounded-lg border border-gray-100">
              <span className="text-gray-500 font-medium text-xs mb-1">💵 Efectivo</span>
              <span className="font-bold text-gray-800 text-lg">S/{efectivo.toFixed(2)}</span>
            </div>
            <div className={`flex flex-col text-sm bg-purple-50 p-3 rounded-lg border ${yape > 0 ? 'border-purple-200' : 'border-purple-50'}`}>
              <span className="text-purple-600 font-medium text-xs mb-1">📱 Yape/Plin</span>
              <span className="font-bold text-purple-900 text-lg">S/{yape.toFixed(2)}</span>
            </div>
            <div className={`flex flex-col text-sm bg-blue-50 p-3 rounded-lg border ${tarjeta > 0 ? 'border-blue-200' : 'border-blue-50'}`}>
              <span className="text-blue-600 font-medium text-xs mb-1">💳 Tarjeta</span>
              <span className="font-bold text-blue-900 text-lg">S/{tarjeta.toFixed(2)}</span>
            </div>
            <div className={`flex flex-col text-sm bg-teal-50 p-3 rounded-lg border ${transferencia > 0 ? 'border-teal-200' : 'border-teal-50'}`}>
              <span className="text-teal-600 font-medium text-xs mb-1">🏦 Transf.</span>
              <span className="font-bold text-teal-900 text-lg">S/{transferencia.toFixed(2)}</span>
            </div>
            {otros > 0 && (
              <div className="flex flex-col text-sm bg-gray-50 p-3 rounded-lg border border-gray-200">
                <span className="text-gray-600 font-medium text-xs mb-1">Otros</span>
                <span className="font-bold text-gray-800 text-lg">S/{otros.toFixed(2)}</span>
              </div>
            )}
          </div>
        </div>
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
