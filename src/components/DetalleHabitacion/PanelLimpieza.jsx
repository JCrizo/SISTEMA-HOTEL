import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import TarjetaLimpieza from '../Limpieza/TarjetaLimpieza'
import Icono from '../Compartido/Icono'

export default function PanelLimpieza({ 
  hab, 
  hospedajeFinalizado, 
  turnoActivo, 
  registrarCobroAdicional, 
  reabrirHospedaje,
  tiposLimpieza,
  iniciarLimpieza,
  habilitarHabitacion,
  onRefresh
}) {
  const navigate = useNavigate()
  const { usuario } = useAuth()
  
  const [mostrarCobroAdicional, setMostrarCobroAdicional] = useState(false)
  const [montoCobroAdicional, setMontoCobroAdicional] = useState('')
  const [metodoCobroAdicional, setMetodoCobroAdicional] = useState('efectivo')
  const [conceptoCobroAdicional, setConceptoCobroAdicional] = useState('hospedaje')
  const [descCobroAdicional, setDescCobroAdicional] = useState('')
  const [guardandoCobroAdicional, setGuardandoCobroAdicional] = useState(false)

  async function handleRegistrarCobro() {
    if (!montoCobroAdicional || parseFloat(montoCobroAdicional) <= 0) return
    if (!descCobroAdicional.trim()) { alert('Ingresa una descripción del cobro'); return }
    if (!turnoActivo) { alert('No hay un turno activo. Debes iniciar turno antes de registrar un cobro.'); return }
    
    setGuardandoCobroAdicional(true)
    const exito = await registrarCobroAdicional(
      parseFloat(montoCobroAdicional),
      metodoCobroAdicional,
      conceptoCobroAdicional,
      descCobroAdicional,
      usuario
    )
    if (exito) {
      setMontoCobroAdicional('')
      setDescCobroAdicional('')
      setMostrarCobroAdicional(false)
    }
    setGuardandoCobroAdicional(false)
  }

  async function handleReabrir() {
    if (!confirm(`¿Reabrir el hospedaje de ${hospedajeFinalizado?.huesped_hospedaje?.[0]?.clientes?.nombres || 'este huésped'}? La habitación volverá a "Ocupada".`)) return
    await reabrirHospedaje(usuario)
  }

  return (
    <div className="card p-4 sm:p-6">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 shrink-0 bg-gray-100 text-gray-600 rounded-xl flex items-center justify-center">
            <Icono name="broom" className="w-4 h-4 inline-block shrink-0" />
          </div>
          <div>
            <h3 className="text-base font-black text-gray-800 tracking-tight">Atención de Limpieza</h3>
            <p className="badge badge-warn mt-1">
              {hab.estado === 'pendiente_limpieza' ? 'Pendiente Limpieza Total' :
               hab.estado === 'en_limpieza' ? 'Limpieza en Progreso' : 'Limpieza Simple Requerida'}
            </p>
          </div>
        </div>
        <button 
          onClick={() => navigate('/limpieza')}
          className="btn btn-primary w-full md:w-auto"
        >
          Ir al Panel de Limpieza
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
        </button>
      </div>

      {hospedajeFinalizado && (
        <div className="mt-8 pt-6 border-t border-gray-100">
          <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            Acciones Post-Checkout
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">Último Huésped Registrado</p>
              <p className="text-lg font-black text-gray-800 mb-1">{hospedajeFinalizado.huesped_hospedaje?.[0]?.clientes?.nombres || 'Huésped no identificado'}</p>
              {hospedajeFinalizado.huesped_hospedaje?.[0]?.clientes?.telefono && (
                <p className="text-sm font-bold text-gray-500 mb-3 flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                  {hospedajeFinalizado.huesped_hospedaje[0].clientes.telefono}
                </p>
              )}
              
              <div className="bg-white rounded-xl p-3 border border-gray-200 mt-4 space-y-1">
                <div className="flex justify-between items-center text-xs font-bold text-gray-500">
                  <span>Nro Ficha</span>
                  <span className="text-gray-800">
                    {hospedajeFinalizado.nro_ficha != null
                      ? String(hospedajeFinalizado.nro_ficha).padStart(6, '0')
                      : '-'}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs font-bold text-gray-500">
                  <span>Checkout Realizado</span>
                  <span className="text-gray-800">{new Date(hospedajeFinalizado.salida_real).toLocaleString('es-PE', {day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit'})}</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {mostrarCobroAdicional ? (
                <div className="bg-gray-50 rounded-2xl p-5 border border-gray-200 shadow-sm animate-fadeIn">
                  <h4 className="text-sm font-black text-blue-900 mb-3 flex items-center gap-2">
                    <span><Icono name="cash" className="w-4 h-4 inline-block shrink-0" /></span> Registrar Cobro Excepcional
                  </h4>
                  
                  <div className="space-y-3">
                    <input 
                      type="number" 
                      value={montoCobroAdicional} 
                      onChange={e => setMontoCobroAdicional(e.target.value)}
                      placeholder="Monto a cobrar (S/)" 
                      className="w-full border border-blue-100 rounded-xl px-4 py-2.5 text-sm font-bold outline-none focus:border-blue-500 bg-white" 
                    />
                    <input 
                      type="text" 
                      value={descCobroAdicional} 
                      onChange={e => setDescCobroAdicional(e.target.value)}
                      placeholder="Ej: Consumo de minibar olvidado, Late checkout..." 
                      className="w-full border border-blue-100 rounded-xl px-4 py-2.5 text-sm font-bold outline-none focus:border-blue-500 bg-white" 
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <select 
                        value={conceptoCobroAdicional} 
                        onChange={e => setConceptoCobroAdicional(e.target.value)}
                        className="w-full border border-blue-100 rounded-xl px-3 py-2 text-sm font-bold outline-none focus:border-blue-500 bg-white"
                      >
                        <option value="hospedaje">Hospedaje</option>
                        <option value="consumo">Consumos</option>
                        <option value="pago_penalidad">Cargo extra</option>
                      </select>
                      <select 
                        value={metodoCobroAdicional} 
                        onChange={e => setMetodoCobroAdicional(e.target.value)}
                        className="w-full border border-blue-100 rounded-xl px-3 py-2 text-sm font-bold outline-none focus:border-blue-500 bg-white"
                      >
                        <option value="efectivo">Efectivo</option>
                        <option value="yape">Yape / Plin</option>
                        <option value="tarjeta">Tarjeta</option>
                        <option value="transferencia">Transf.</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="flex gap-2 mt-4">
                    <button 
                      onClick={() => setMostrarCobroAdicional(false)}
                      className="flex-1 py-2.5 border border-blue-200 rounded-xl text-sm font-bold text-blue-700 bg-white hover:bg-blue-50"
                    >
                      Cancelar
                    </button>
                    <button 
                      onClick={handleRegistrarCobro} 
                      disabled={guardandoCobroAdicional}
                      className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold shadow-sm hover:bg-blue-700 disabled:opacity-50"
                    >
                      {guardandoCobroAdicional ? 'Cargando...' : 'Cobrar Ahora'}
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setMostrarCobroAdicional(true)}
                  disabled={!turnoActivo}
                  className="w-full py-4 bg-white border border-blue-200 text-blue-700 rounded-2xl text-sm font-bold disabled:opacity-40 hover:bg-blue-50 hover:border-blue-300 transition-colors flex items-center justify-center gap-2 shadow-sm"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                  Agregar Cobro Post-Checkout
                </button>
              )}

              <button 
                onClick={handleReabrir}
                className="btn btn-secondary w-full"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                Revertir Checkout (Huésped se queda)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tarjeta de Limpieza Integrada */}
      <div className="mt-8 pt-6 border-t border-gray-100">
        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
          Ejecución de Limpieza
        </h4>
        <div className="max-w-2xl mx-auto">
          <TarjetaLimpieza 
            habitacion={hab}
            hab={hab}
            tiposLimpieza={tiposLimpieza}
            onIniciarLimpieza={iniciarLimpieza}
            onHabilitar={habilitarHabitacion}
            esVistaIntegrada={true}
            onSuccess={onRefresh}
          />
        </div>
      </div>
    </div>
  )
}
