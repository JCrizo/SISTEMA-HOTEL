import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import EditarHuespedModal from './EditarHuespedModal'
import CambiarHabitacionActivaModal from './CambiarHabitacionActivaModal'
import { useAuth } from '../../context/AuthContext'
import Icono from '../Compartido/Icono'

export default function PanelHuespedActivo({
  hab,
  hospedaje,
  huesped,
  pagos,
  consumos,
  turnoActivo,
  registrarPago,
  registrarPenalidad,
  extenderEstadia,
  hacerCheckout,
  actualizarTarifaHospedaje,
  actualizarDatosHuesped,
  actualizarFechaIngreso,
  actualizarComprobante,
  cambiarHabitacion
}) {
  const navigate = useNavigate()
  const { usuario } = useAuth()

  const [mostrarEditar, setMostrarEditar] = useState(false)
  const [mostrarCambioHab, setMostrarCambioHab] = useState(false)

  const [mostrarPago, setMostrarPago] = useState(false)
  const [montoPago, setMontoPago] = useState('')
  const [metodoPago, setMetodoPago] = useState('efectivo')
  const [conceptoPago, setConceptoPago] = useState('hospedaje')
  const [nroTicket, setNroTicket] = useState('')
  const [guardandoPago, setGuardandoPago] = useState(false)

  const [mostrarPenalidad, setMostrarPenalidad] = useState(false)
  const [montoPenalidad, setMontoPenalidad] = useState('')
  const [descPenalidad, setDescPenalidad] = useState('')

  const [mostrarExtension, setMostrarExtension] = useState(false)
  const [fechaExtension, setFechaExtension] = useState('')
  const [metodoPagoExtension, setMetodoPagoExtension] = useState('efectivo')

  const totalConsumos = consumos.reduce((s, c) => s + parseFloat(c.precio_unitario) * c.cantidad, 0)
  const totalPenalidades = pagos.filter(p => p.concepto === 'penalidad').reduce((s, p) => s + parseFloat(p.monto), 0)
  const pagosHospedaje = pagos.filter(p => p.concepto === 'hospedaje').reduce((s, p) => s + parseFloat(p.monto), 0)
  const pagosConsumo = pagos.filter(p => p.concepto === 'consumo').reduce((s, p) => s + parseFloat(p.monto), 0)
  const pagosPenalidad = pagos.filter(p => p.concepto === 'pago_penalidad').reduce((s, p) => s + parseFloat(p.monto), 0)
  const totalPagadoReal = pagosHospedaje + pagosConsumo + pagosPenalidad
  const saldo = parseFloat(hospedaje.tarifa_pactada) + totalConsumos + totalPenalidades - totalPagadoReal

  async function handleRegistrarPago() {
    if (!montoPago || parseFloat(montoPago) <= 0) return
    if (!turnoActivo) { alert('No hay un turno activo. Debes iniciar turno antes de registrar un pago.'); return }
    
    setGuardandoPago(true)
    const exito = await registrarPago(parseFloat(montoPago), metodoPago, conceptoPago, nroTicket)
    if (exito) {
      setMontoPago('')
      setNroTicket('')
      setConceptoPago('hospedaje')
      setMostrarPago(false)
    } else {
      alert('No se pudo registrar el pago. Verifica la conexión e intenta nuevamente.')
    }
    setGuardandoPago(false)
  }

  async function handleRegistrarPenalidad() {
    if (!montoPenalidad || parseFloat(montoPenalidad) <= 0) return
    if (!descPenalidad.trim()) return
    if (!turnoActivo) { alert('No hay un turno activo. Debes iniciar turno antes de registrar un cargo.'); return }

    const exito = await registrarPenalidad(parseFloat(montoPenalidad), descPenalidad)
    if (exito) {
      setMontoPenalidad('')
      setDescPenalidad('')
      setMostrarPenalidad(false)
    } else {
      alert('No se pudo registrar el cargo. Verifica la conexión e intenta nuevamente.')
    }
  }

  async function handleExtenderEstadia() {
    if (!fechaExtension) return

    const nuevaFecha = new Date(fechaExtension)
    // Checkout a las 10:00 AM (horario del establecimiento)
    nuevaFecha.setHours(10, 0, 0, 0)

    const ingreso = new Date(hospedaje.ingreso)
    if (nuevaFecha < ingreso) {
      alert('La fecha de checkout no puede ser anterior a la fecha de ingreso del huésped (' + ingreso.toLocaleDateString('es-PE') + ').')
      return
    }

    const checkoutActual = new Date(hospedaje.salida_estimada)
    const diffMs = nuevaFecha - checkoutActual
    const noches = Math.round(diffMs / (1000 * 60 * 60 * 24))

    if (noches === 0) {
      alert('La nueva fecha debe ser diferente al checkout actual')
      return
    }

    // Tarifa por noche = tarifa total / noches originales
    const nochesOriginales = Math.max(1, Math.round((checkoutActual - ingreso) / (1000 * 60 * 60 * 24)))
    const tarifaPorNoche = parseFloat(hospedaje.tarifa_pactada) / nochesOriginales
    const costoExtension = noches * tarifaPorNoche
    const mensaje = noches > 0
      ? `Se agregarán ${noches} noche(s) por S/${Math.abs(costoExtension).toFixed(2)}. ¿Confirmar?`
      : `Se reducirá la estadía en ${Math.abs(noches)} noche(s). ¿Confirmar?`

    if (!confirm(mensaje)) return

    const exito = await extenderEstadia(nuevaFecha.toISOString(), costoExtension, noches, metodoPagoExtension)
    if (exito) {
      setFechaExtension('')
      setMostrarExtension(false)
    } else {
      alert('No se pudo actualizar el checkout. Verifica la conexión e intenta nuevamente.')
    }
  }

  async function handleCheckout() {
    if (saldo > 0) {
      if (!confirm(`El huésped tiene un saldo pendiente de S/${saldo.toFixed(2)}. ¿Confirmar checkout de todas formas?`)) return
    } else {
      if (!confirm('¿Confirmar checkout?')) return
    }

    const exito = await hacerCheckout(usuario)
    if (exito) {
      navigate('/')
    } else {
      alert('No se pudo completar el checkout. Verifica la conexión e intenta nuevamente.')
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      
      {/* COLUMNA IZQUIERDA: Info y Acciones Rápidas */}
      <div className="space-y-6">
        {/* Huésped Card */}
        <div className="card p-4 sm:p-6">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
              Datos del Huésped
            </h3>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <span className="badge badge-muted justify-center !text-xs">
                Ficha N° {String(hospedaje.nro_ficha ?? 0).padStart(6, '0')}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setMostrarEditar(true)}
                  className="btn btn-secondary btn-sm flex-1 sm:flex-none"
                  title="Editar datos del huésped y tarifa"
                >
                  <Icono name="pencil" className="w-4 h-4 inline-block shrink-0" /> Editar
                </button>
                <button
                  onClick={() => setMostrarCambioHab(true)}
                  className="btn btn-secondary btn-sm flex-1 sm:flex-none"
                  title="Mover huésped a otra habitación"
                >
                  Mover
                </button>
              </div>
            </div>
          </div>
          
          <div className="mb-4">
            <p className="text-xl font-black text-gray-800">{huesped?.nombres || 'Sin nombre'} <span className="text-sm font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded ml-2">Titular</span></p>
            <div className="flex items-center gap-4 mt-1">
              <p className="text-sm font-bold text-gray-500">{huesped?.dni_pasaporte}</p>
              {huesped?.telefono && <p className="text-sm font-bold text-gray-500"><Icono name="phone" className="w-4 h-4 inline-block shrink-0" /> {huesped.telefono}</p>}
            </div>

            {/* ACOMPAÑANTES */}
            {hospedaje.huesped_hospedaje && hospedaje.huesped_hospedaje.filter(h => !h.es_titular).length > 0 && (
              <div className="mt-3 pt-3 border-t border-gray-100">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Acompañantes</p>
                <div className="space-y-1.5">
                  {hospedaje.huesped_hospedaje.filter(h => !h.es_titular).map((ac, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-gray-300"></span>
                      <p className="text-sm font-bold text-gray-700">{ac.clientes?.nombres}</p>
                      <span className="text-xs font-bold text-gray-400">({ac.clientes?.dni_pasaporte})</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          <div className="grid grid-cols-2 gap-4 bg-gray-50 rounded-2xl p-4">
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Ingreso</p>
              <p className="text-sm font-bold text-gray-700">{new Date(hospedaje.ingreso).toLocaleString('es-PE', {day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit'})}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Checkout</p>
              {new Date(hospedaje.salida_estimada) < new Date() ? (
                <>
                  <p className="text-sm font-bold text-amber-600">{new Date(hospedaje.salida_estimada).toLocaleString('es-PE', {day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit'})}</p>
                  <p className="badge badge-warn mt-1">
                    <Icono name="alert" className="w-4 h-4 inline-block shrink-0" /> Checkout vencido
                  </p>
                </>
              ) : (
                <p className="text-sm font-bold text-gray-700">{new Date(hospedaje.salida_estimada).toLocaleString('es-PE', {day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit'})}</p>
              )}
            </div>
          </div>
          
          {hospedaje.observaciones && (
            <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-xl">
              <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-1">Observaciones</p>
              <p className="text-sm font-medium text-gray-700">{hospedaje.observaciones}</p>
            </div>
          )}
          
          {hospedaje.comprobante && hospedaje.comprobante !== 'ninguno' && (
            <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-xl flex items-center gap-2">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
              <div>
                <p className="text-[11px] font-bold text-gray-600 uppercase tracking-wide capitalize">Requiere {hospedaje.comprobante}</p>
                {hospedaje.comprobante === 'factura' && hospedaje.ruc && (
                  <p className="text-sm font-bold text-gray-700">RUC: {hospedaje.ruc}</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Acciones Rápidas */}
        <div className="grid grid-cols-2 gap-3">
          <button onClick={() => navigate(`/consumos/${hab.id}`)}
            className="btn btn-secondary !h-auto !flex-col !py-3 gap-1 group text-gray-700">
            <span className="text-gray-500 group-hover:text-blue-600 transition-colors"><Icono name="receipt" className="w-6 h-6 inline-block shrink-0" /></span>
            Punto de Venta
          </button>
          <button
            onClick={() => setMostrarPenalidad(!mostrarPenalidad)}
            disabled={!turnoActivo}
            className="btn btn-secondary !h-auto !flex-col !py-3 gap-1 group text-gray-700"
          >
            <span className="text-gray-500 group-hover:text-blue-600 transition-colors"><Icono name="alert" className="w-6 h-6 inline-block shrink-0" /></span>
            Cargos Extras
          </button>
          <button
            onClick={() => setMostrarPago(true)}
            disabled={!turnoActivo}
            className="btn btn-secondary !h-auto !flex-col !py-3 gap-1 group text-gray-700"
          >
            <span className="text-gray-500 group-hover:text-blue-600 transition-colors"><Icono name="cash" className="w-6 h-6 inline-block shrink-0" /></span>
            Abonar Pago
          </button>
          <button
            onClick={() => setMostrarExtension(true)}
            className="btn btn-secondary !h-auto !flex-col !py-3 gap-1 group text-gray-700"
          >
            <span className="text-gray-500 group-hover:text-blue-600 transition-colors"><Icono name="calendar" className="w-6 h-6 inline-block shrink-0" /></span>
            Modificar Fechas
          </button>
        </div>

        {!turnoActivo && (
          <div className="bg-gray-50 border border-gray-200 rounded-2xl p-3 text-center">
            <p className="text-sm font-semibold text-gray-600 flex items-center justify-center gap-2">
              <span><Icono name="lock" className="w-4 h-4 inline-block shrink-0" /></span> Sin turno activo: opciones de caja bloqueadas.
            </p>
          </div>
        )}
      </div>

      {/* COLUMNA DERECHA: Cuenta y Modales */}
      <div className="space-y-6">
        {/* Cuenta Resumen */}
        <div className="card p-4 sm:p-6">
          <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-5 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            Estado de Cuenta
          </h3>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center text-sm">
              <span className="font-bold text-gray-600">Hospedaje</span>
              <span className="font-black text-gray-800">S/{hospedaje.tarifa_pactada}</span>
            </div>
            {totalConsumos > 0 && (
              <div className="flex justify-between items-center text-sm">
                <span className="font-bold text-gray-600">Consumos (Room Service)</span>
                <span className="font-black text-gray-800">S/{totalConsumos.toFixed(2)}</span>
              </div>
            )}
            {totalPenalidades > 0 && (
              <div className="flex justify-between items-center text-sm text-gray-700">
                <span className="font-bold">Cargos Adicionales / Penalidades</span>
                <span className="font-black">S/{totalPenalidades.toFixed(2)}</span>
              </div>
            )}
            
            <div className="border-t border-dashed border-gray-200 pt-3 my-2">
              <div className="flex justify-between items-center">
                <span className="font-bold text-gray-400 uppercase tracking-wider text-xs">Total Facturado</span>
                <span className="font-black text-lg text-gray-800">
                  S/{(parseFloat(hospedaje.tarifa_pactada) + totalConsumos + totalPenalidades).toFixed(2)}
                </span>
              </div>
            </div>

            <div className="bg-gray-50 rounded-xl p-4 space-y-2 border border-gray-200">
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Abonos realizados</p>
              {pagosHospedaje > 0 && (
                <div className="flex justify-between text-sm text-gray-700">
                  <span className="font-bold">Pago Hospedaje</span><span className="font-black">− S/{pagosHospedaje.toFixed(2)}</span>
                </div>
              )}
              {pagosConsumo > 0 && (
                <div className="flex justify-between text-sm text-gray-700">
                  <span className="font-bold">Pago Consumos</span><span className="font-black">− S/{pagosConsumo.toFixed(2)}</span>
                </div>
              )}
              {pagosPenalidad > 0 && (
                <div className="flex justify-between text-sm text-gray-700">
                  <span className="font-bold">Pago Cargos Extras</span><span className="font-black">− S/{pagosPenalidad.toFixed(2)}</span>
                </div>
              )}
              {totalPagadoReal === 0 && (
                <p className="text-sm font-medium text-gray-400 italic">Sin abonos registrados</p>
              )}
            </div>

            <div className={`rounded-2xl p-5 border flex justify-between items-center ${saldo > 0 ? 'bg-white border-gray-300' : 'bg-gray-50 border-gray-200'}`}>
              <span className={`font-bold uppercase tracking-widest text-xs text-gray-500`}>
                {saldo > 0 ? 'Saldo a Cobrar' : 'Cuenta Saldada'}
              </span>
              <span className={`font-black text-2xl ${saldo > 0 ? 'text-rose-600' : 'text-gray-400'}`}>
                S/{Math.max(0, saldo).toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Modal de Pago */}
        {mostrarPago && (
          <div className="card p-4 sm:p-6 animate-fadeIn">
            <h4 className="text-lg font-black text-gray-800 mb-4 flex items-center gap-2">
              <span><Icono name="cash" className="w-4 h-4 inline-block shrink-0" /></span> Registrar Nuevo Abono
            </h4>
            
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1.5">Monto (S/)</label>
                <input type="number" value={montoPago} onChange={e => setMontoPago(e.target.value)}
                  placeholder="0.00" className="w-full border border-gray-100 rounded-xl px-4 py-3 text-lg font-bold outline-none focus:border-blue-500 bg-gray-50 focus:bg-white transition-colors" />
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1.5">Concepto</label>
                  <select value={conceptoPago} onChange={e => setConceptoPago(e.target.value)}
                    className="w-full border border-gray-100 rounded-xl px-3 py-2.5 text-sm font-bold outline-none focus:border-blue-500 bg-gray-50 transition-colors">
                    <option value="hospedaje">Hospedaje</option>
                    <option value="consumo">Consumos</option>
                    <option value="pago_penalidad">Cargo Adicional</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1.5">Método</label>
                  <select value={metodoPago} onChange={e => setMetodoPago(e.target.value)}
                    className="w-full border border-gray-100 rounded-xl px-3 py-2.5 text-sm font-bold outline-none focus:border-blue-500 bg-gray-50 transition-colors">
                    <option value="efectivo">Efectivo</option>
                    <option value="yape">Yape / Plin</option>
                    <option value="tarjeta">Tarjeta</option>
                    <option value="transferencia">Transferencia</option>
                  </select>
                </div>
              </div>
              
              {metodoPago === 'tarjeta' && (
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1.5">Nro. de Operación / Ticket</label>
                  <input type="text" value={nroTicket} onChange={e => setNroTicket(e.target.value)}
                    placeholder="Opcional" className="w-full border border-gray-100 rounded-xl px-4 py-2.5 text-sm font-bold outline-none focus:border-blue-500 bg-gray-50 transition-colors" />
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => setMostrarPago(false)}
                className="flex-1 py-3 border border-gray-200 rounded-xl text-gray-600 font-bold hover:bg-gray-50 transition-colors">Cancelar</button>
              <button onClick={handleRegistrarPago} disabled={guardandoPago}
                className="flex-[2] py-3 bg-blue-600 text-white rounded-xl font-bold shadow-sm hover:bg-blue-700 active:scale-[0.98] transition-transform disabled:opacity-50">
                {guardandoPago ? 'Procesando...' : 'Confirmar Pago'}
              </button>
            </div>
          </div>
        )}

        {/* Modal de Penalidades */}
        {mostrarPenalidad && (
          <div className="card p-4 sm:p-6 animate-fadeIn">
             <h4 className="text-lg font-black text-gray-800 mb-4 flex items-center gap-2">
              <span><Icono name="alert" className="w-4 h-4 inline-block shrink-0" /></span> Agregar Cargo Extra
            </h4>
            
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1.5">Monto del cargo (S/)</label>
                <input type="number" value={montoPenalidad} onChange={e => setMontoPenalidad(e.target.value)}
                  placeholder="0.00" className="w-full border border-gray-100 rounded-xl px-4 py-3 text-lg font-bold outline-none focus:border-gray-200 bg-gray-50 focus:bg-white transition-colors" />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1.5">Motivo / Descripción</label>
                <input type="text" value={descPenalidad} onChange={e => setDescPenalidad(e.target.value)}
                  placeholder="Ej: Sábana manchada, llave perdida..." className="w-full border border-gray-100 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-gray-200 bg-gray-50 focus:bg-white transition-colors" />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => setMostrarPenalidad(false)}
                className="flex-1 py-3 border border-gray-200 rounded-xl text-gray-600 font-bold hover:bg-gray-50 transition-colors">Cancelar</button>
              <button onClick={handleRegistrarPenalidad}
                className="flex-[2] py-3 bg-blue-600 text-white rounded-xl font-bold shadow-xs hover:bg-blue-700 active:scale-[0.98] transition-transform">
                Aplicar Cargo a la Cuenta
              </button>
            </div>
          </div>
        )}

        {/* Modal Extension */}
        {mostrarExtension && (
          <div className="card p-4 sm:p-6 animate-fadeIn">
            <h4 className="text-lg font-black text-gray-800 mb-2 flex items-center gap-2">
              <span><Icono name="calendar" className="w-4 h-4 inline-block shrink-0" /></span> Modificar Fechas
            </h4>
            <p className="text-sm font-bold text-gray-500 mb-4">
              Checkout actual: {new Date(hospedaje.salida_estimada).toLocaleString('es-PE', {day:'2-digit', month:'short'})} a las 12:00 PM
            </p>
            
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1.5">Nueva fecha de salida</label>
                <input
                  type="date"
                  value={fechaExtension}
                  onChange={e => setFechaExtension(e.target.value)}
                  min={new Date(hospedaje.ingreso).toISOString().split('T')[0]}
                  className="w-full border border-gray-100 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-blue-500 bg-gray-50 focus:bg-white transition-colors"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1.5">Método de Pago de la Extensión</label>
                <div className="grid grid-cols-2 gap-2">
                  {[['efectivo','Efectivo'],['yape','Yape/Plin'],['tarjeta','Tarjeta'],['transferencia','Transf.']].map(([val, label]) => (
                    <button key={val} onClick={() => setMetodoPagoExtension(val)}
                      className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                        metodoPagoExtension === val ? 'bg-blue-50 border-blue-400 text-blue-700' : 'bg-white border-gray-100 text-gray-400 hover:border-gray-200'
                      }`}>{label}</button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => setMostrarExtension(false)}
                className="flex-1 py-3 border border-gray-200 rounded-xl text-gray-600 font-bold hover:bg-gray-50 transition-colors">Cancelar</button>
              <button onClick={handleExtenderEstadia}
                className="flex-[2] py-3 bg-blue-600 text-white rounded-xl font-bold shadow-xs hover:bg-blue-700 active:scale-[0.98] transition-transform">
                Guardar Cambios
              </button>
            </div>
          </div>
        )}

        <button onClick={handleCheckout}
          className="btn w-full !min-h-[52px] !text-base mt-2 bg-gray-900 text-white hover:bg-black shadow-xs">
          <Icono name="logout" className="w-5 h-5" />
          Finalizar hospedaje (checkout)
        </button>

      </div>

      {mostrarEditar && (
        <EditarHuespedModal
          huesped={huesped}
          hospedaje={hospedaje}
          actualizarTarifaHospedaje={actualizarTarifaHospedaje}
          actualizarDatosHuesped={actualizarDatosHuesped}
          actualizarFechaIngreso={actualizarFechaIngreso}
          actualizarComprobante={actualizarComprobante}
          onClose={() => setMostrarEditar(false)}
        />
      )}

      {mostrarCambioHab && (
        <CambiarHabitacionActivaModal
          hospedaje={hospedaje}
          habActual={hab}
          cambiarHabitacion={cambiarHabitacion}
          onClose={() => setMostrarCambioHab(false)}
        />
      )}
    </div>
  )
}

