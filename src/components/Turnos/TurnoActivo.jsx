import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import Icono from '../Compartido/Icono'

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

  async function handleRegistrarMovimiento(e) {
    e.preventDefault()
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
    <div className="space-y-6 mb-6">
      {/* TARJETA PRINCIPAL DEL TURNO ACTIVO */}
      <div className="bg-white rounded-2xl shadow-2xs border border-gray-100 p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6 pb-4 border-b border-gray-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <h3 className="text-xl font-black text-gray-800">Turno en Curso</h3>
              <span className="text-xs font-bold px-3 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 uppercase tracking-wide">
                {turno.tipo}
              </span>
            </div>
            <p className="text-xs text-gray-400 font-medium mt-1">
              Aperturado el {new Date(turno.apertura).toLocaleString('es-PE')}
            </p>
          </div>

          <div className="text-xs text-gray-500 font-medium bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-100">
            Responsable: <strong className="text-gray-800 capitalize">{usuario?.nombre || 'Usuario'}</strong>
          </div>
        </div>
        
        {/* 4 Métricas Clave de la Caja */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
          {/* Caja Inicial */}
          <div className="bg-gray-50/70 rounded-2xl p-4 border border-gray-100 shadow-2xs">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider block mb-1">
              Caja Inicial (Físico)
            </span>
            <p className="text-xl sm:text-2xl font-black text-gray-800">
              S/ {parseFloat(turno.caja_principal_anterior || 0).toFixed(2)}
            </p>
            <span className="text-[11px] text-gray-400 block mt-1">Monto recibido</span>
          </div>

          {/* Total Acumulado */}
          <div className="bg-blue-50/50 rounded-2xl p-4 border border-blue-100/70 shadow-2xs">
            <span className="text-[10px] font-black text-blue-700 uppercase tracking-wider block mb-1" title="Incluye efectivo inicial + pagos efectivo + digitales">
              Total Recaudado
            </span>
            <p className="text-xl sm:text-2xl font-black text-blue-900">
              S/ {parseFloat(turno.caja_principal_actual || 0).toFixed(2)}
            </p>
            <span className="text-[11px] text-blue-600/70 block mt-1">Hospedajes y consumos</span>
          </div>

          {/* Efectivo en Caja (Real en mano) */}
          <div className="bg-emerald-50/50 rounded-2xl p-4 border border-emerald-200 shadow-2xs">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-black text-emerald-800 uppercase tracking-wider">
                Efectivo en Caja
              </span>
              <span className="text-[9px] font-bold bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded">
                En mano
              </span>
            </div>
            <p className="text-xl sm:text-2xl font-black text-emerald-950">
              S/ {efectivoEnCaja.toFixed(2)}
            </p>
            <span className="text-[11px] text-emerald-700/70 block mt-1">Billetes y monedas</span>
          </div>

          {/* Caja Consumos */}
          <div className="bg-amber-50/50 rounded-2xl p-4 border border-amber-100 shadow-2xs">
            <span className="text-[10px] font-black text-amber-800 uppercase tracking-wider block mb-1">
              Caja Consumos
            </span>
            <p className="text-xl sm:text-2xl font-black text-amber-900">
              S/ {parseFloat(turno.caja_consumos_actual || 0).toFixed(2)}
            </p>
            <span className="text-[11px] text-amber-700/70 block mt-1">Ventas de productos</span>
          </div>
        </div>

        {/* Desglose de Ingresos por Medio de Pago */}
        <div className="pt-4 border-t border-gray-100">
          <p className="text-[10px] text-gray-400 font-black uppercase tracking-wider mb-3">
            Ingresos por Medios de Pago en este turno
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-gray-50/60 p-3 rounded-xl border border-gray-100 flex flex-col justify-between">
              <div className="flex items-center justify-between text-xs text-gray-500 font-semibold mb-1">
                <span>Efectivo</span>
                <span className="text-[11px] text-emerald-600"><Icono name="cash" className="w-4 h-4 inline-block shrink-0" /></span>
              </div>
              <span className="font-black text-gray-800 text-base">S/ {efectivo.toFixed(2)}</span>
            </div>

            <div className={`p-3 rounded-xl border flex flex-col justify-between ${yape > 0 ? 'bg-purple-50/50 border-purple-100' : 'bg-gray-50/60 border-gray-100'}`}>
              <div className="flex items-center justify-between text-xs text-purple-700 font-semibold mb-1">
                <span>Yape / Plin</span>
                <span className="text-[11px]"><Icono name="phone" className="w-4 h-4 inline-block shrink-0" /></span>
              </div>
              <span className="font-black text-purple-900 text-base">S/ {yape.toFixed(2)}</span>
            </div>

            <div className={`p-3 rounded-xl border flex flex-col justify-between ${tarjeta > 0 ? 'bg-blue-50/50 border-blue-100' : 'bg-gray-50/60 border-gray-100'}`}>
              <div className="flex items-center justify-between text-xs text-blue-700 font-semibold mb-1">
                <span>Tarjeta (POS)</span>
                <span className="text-[11px]"><Icono name="cash" className="w-4 h-4 inline-block shrink-0" /></span>
              </div>
              <span className="font-black text-blue-900 text-base">S/ {tarjeta.toFixed(2)}</span>
            </div>

            <div className={`p-3 rounded-xl border flex flex-col justify-between ${transferencia > 0 ? 'bg-teal-50/50 border-teal-100' : 'bg-gray-50/60 border-gray-100'}`}>
              <div className="flex items-center justify-between text-xs text-teal-700 font-semibold mb-1">
                <span>Transferencia</span>
                <span className="text-[11px]"><Icono name="cash" className="w-4 h-4 inline-block shrink-0" /></span>
              </div>
              <span className="font-black text-teal-900 text-base">S/ {transferencia.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* SECCIÓN DE MOVIMIENTOS DE CAJA (EGRESOS / PRÉSTAMOS) */}
      <div className="bg-white rounded-2xl shadow-2xs border border-gray-100 p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
          <div>
            <h4 className="text-base font-black text-gray-800">Movimientos y Gastos de Caja</h4>
            <p className="text-xs text-gray-400 font-medium">Registra egresos, compras o transferencias entre cajas</p>
          </div>
          <button
            onClick={() => setMostrarMovimiento(!mostrarMovimiento)}
            className="w-full sm:w-auto px-4 py-2 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-xl transition-all border border-blue-100 flex items-center justify-center gap-1.5"
          >
            <span>{mostrarMovimiento ? 'Cerrar Formulario' : '+ Nuevo Movimiento / Gasto'}</span>
          </button>
        </div>

        {/* Formulario Desplegable */}
        {mostrarMovimiento && (
          <form onSubmit={handleRegistrarMovimiento} className="bg-gray-50/80 p-4 rounded-2xl border border-gray-200/80 mb-6 space-y-4 animate-fade-in">
            <h5 className="text-xs font-bold text-gray-700 uppercase tracking-wide">
              Registrar Movimiento en Caja
            </h5>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-gray-500 uppercase block mb-1">Tipo de Operación</label>
                <select
                  value={tipoMov}
                  onChange={e => setTipoMov(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs sm:text-sm font-semibold outline-none focus:border-blue-500"
                >
                  <option value="salida">Salida de caja (Gasto o Retiro)</option>
                  <option value="prestamo_entre_cajas">Préstamo entre cajas</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-gray-500 uppercase block mb-1">Caja Origen (Retiro)</label>
                <select
                  value={cajaOrigen}
                  onChange={e => setCajaOrigen(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs sm:text-sm font-semibold outline-none focus:border-blue-500"
                >
                  <option value="principal">Caja Principal</option>
                  <option value="consumos">Caja Consumos</option>
                </select>
              </div>

              {tipoMov === 'prestamo_entre_cajas' && (
                <div>
                  <label className="text-[11px] font-bold text-gray-500 uppercase block mb-1">Caja Destino (Ingreso)</label>
                  <select
                    value={cajaDestino}
                    onChange={e => setCajaDestino(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs sm:text-sm font-semibold outline-none focus:border-blue-500"
                  >
                    <option value="consumos">Caja Consumos</option>
                    <option value="principal">Caja Principal</option>
                  </select>
                </div>
              )}

              <div>
                <label className="text-[11px] font-bold text-gray-500 uppercase block mb-1">Monto (S/)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={montoMov}
                  onChange={e => setMontoMov(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs sm:text-sm font-bold outline-none focus:border-blue-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-[11px] font-bold text-gray-500 uppercase block mb-1">Concepto o Motivo *</label>
                <input
                  type="text"
                  required
                  value={conceptoMov}
                  onChange={e => setConceptoMov(e.target.value)}
                  placeholder="Ej: Compra de artículos de limpieza, pago de agua..."
                  className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs sm:text-sm outline-none focus:border-blue-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-[11px] font-bold text-gray-500 uppercase block mb-1">Autorizado por (Opcional)</label>
                <input
                  type="text"
                  value={autorizadoPor}
                  onChange={e => setAutorizadoPor(e.target.value)}
                  placeholder="Nombre de quien autoriza el egreso..."
                  className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs sm:text-sm outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2 border-t border-gray-200">
              <button
                type="button"
                onClick={() => setMostrarMovimiento(false)}
                className="flex-1 py-2 text-xs font-bold text-gray-600 hover:bg-gray-200 rounded-xl transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={guardando || !montoMov || !conceptoMov}
                className="flex-[2] py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors disabled:opacity-50"
              >
                {guardando ? 'Guardando...' : 'Confirmar Movimiento'}
              </button>
            </div>
          </form>
        )}

        {/* Lista de Movimientos */}
        <div className="space-y-2">
          {movimientos.length === 0 ? (
            <p className="text-xs text-gray-400 italic text-center py-6 bg-gray-50/50 rounded-xl border border-dashed border-gray-200">
              No hay egresos o préstamos registrados en este turno.
            </p>
          ) : (
            movimientos.map(mov => (
              <div key={mov.id} className="flex justify-between items-center py-2.5 px-3 bg-gray-50/60 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors">
                <div>
                  <p className="text-xs font-bold text-gray-800">{mov.concepto}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">
                    {mov.tipo === 'prestamo_entre_cajas'
                      ? `Préstamo: ${mov.caja_origen} → ${mov.caja_destino}`
                      : `Egreso de ${mov.caja_origen}`}
                    {mov.autorizado_por ? ` • Autorizado por ${mov.autorizado_por}` : ''}
                  </p>
                </div>
                <span className="text-xs font-black text-rose-600 bg-rose-50 border border-rose-100 px-2 py-0.5 rounded-lg whitespace-nowrap">
                  − S/ {parseFloat(mov.monto).toFixed(2)}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
