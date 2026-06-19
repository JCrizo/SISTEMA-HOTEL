import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

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
  hacerCheckout
}) {
  const navigate = useNavigate()

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
    }
  }

  async function handleExtenderEstadia() {
    if (!fechaExtension) return

    const nuevaFecha = new Date(fechaExtension)
    nuevaFecha.setHours(12, 0, 0, 0)

    const checkoutActual = new Date(hospedaje.salida_estimada)
    const diffMs = nuevaFecha - checkoutActual
    const noches = Math.round(diffMs / (1000 * 60 * 60 * 24))

    if (noches === 0) {
      alert('La nueva fecha debe ser diferente al checkout actual')
      return
    }

    const costoExtension = noches * parseFloat(hospedaje.tarifa_pactada)
    const mensaje = noches > 0
      ? `Se agregarán ${noches} noche(s) por S/${Math.abs(costoExtension).toFixed(2)}. ¿Confirmar?`
      : `Se reducirá la estadía en ${Math.abs(noches)} noche(s). ¿Confirmar?`

    if (!confirm(mensaje)) return

    const exito = await extenderEstadia(nuevaFecha.toISOString(), costoExtension, noches)
    if (exito) {
      setFechaExtension('')
      setMostrarExtension(false)
    }
  }

  async function handleCheckout() {
    if (saldo > 0) {
      if (!confirm(`El huésped tiene un saldo pendiente de S/${saldo.toFixed(2)}. ¿Confirmar checkout de todas formas?`)) return
    } else {
      if (!confirm('¿Confirmar checkout?')) return
    }

    const exito = await hacerCheckout()
    if (exito) {
      navigate('/')
    }
  }

  return (
    <>
      {/* Huésped */}
      <div className="bg-white rounded-xl border p-4 mb-3 shadow-sm">
        <div className="flex justify-between items-center mb-2">
          <p className="text-xs text-gray-500 font-medium uppercase">Huésped</p>
          <p className="text-xs font-medium text-blue-600">Ficha N° {String(hospedaje.nro_ficha).padStart(6, '0')}</p>
        </div>
        <p className="font-semibold">{huesped?.nombres || 'Sin nombre'}</p>
        <p className="text-sm text-gray-500">{huesped?.dni_pasaporte}</p>
        {huesped?.telefono && <p className="text-sm text-gray-500 mt-0.5">📞 {huesped.telefono}</p>}
        
        <p className="text-xs text-gray-400 mt-2">Ingreso: {new Date(hospedaje.ingreso).toLocaleString('es-PE')}</p>
        <p className="text-xs text-gray-400">Checkout: {new Date(hospedaje.salida_estimada).toLocaleString('es-PE')}</p>
        
        {hospedaje.observaciones && (
          <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-xs text-yellow-800 font-medium">Observaciones</p>
            <p className="text-xs text-yellow-700 mt-1">{hospedaje.observaciones}</p>
          </div>
        )}
        
        {hospedaje.comprobante && hospedaje.comprobante !== 'ninguno' && (
          <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-xs text-blue-800 font-medium capitalize">
              Requiere {hospedaje.comprobante}
              {hospedaje.comprobante === 'factura' && hospedaje.ruc ? ` — RUC: ${hospedaje.ruc}` : ''}
            </p>
          </div>
        )}
      </div>

      {/* Cuenta */}
      <div className="bg-white rounded-xl border p-4 mb-3 shadow-sm">
        <p className="text-xs text-gray-500 font-medium uppercase mb-2">Cuenta</p>
        <div className="flex justify-between text-sm py-1">
          <span>Hospedaje</span><span>S/{hospedaje.tarifa_pactada}</span>
        </div>
        {totalConsumos > 0 && (
          <div className="flex justify-between text-sm py-1">
            <span>Consumos</span><span>S/{totalConsumos.toFixed(2)}</span>
          </div>
        )}
        {totalPenalidades > 0 && (
          <div className="flex justify-between text-sm py-1 text-purple-700">
            <span>Cargos adicionales</span><span>S/{totalPenalidades.toFixed(2)}</span>
          </div>
        )}
        <div className="flex justify-between text-sm py-1 font-medium border-t mt-1 pt-1">
          <span>Total</span>
          <span>S/{(parseFloat(hospedaje.tarifa_pactada) + totalConsumos + totalPenalidades).toFixed(2)}</span>
        </div>
        <div className="border-t mt-2 pt-1">
          {pagosHospedaje > 0 && (
            <div className="flex justify-between text-sm py-1 text-green-700">
              <span>Pagado hospedaje</span><span>− S/{pagosHospedaje.toFixed(2)}</span>
            </div>
          )}
          {pagosConsumo > 0 && (
            <div className="flex justify-between text-sm py-1 text-green-700">
              <span>Pagado consumos</span><span>− S/{pagosConsumo.toFixed(2)}</span>
            </div>
          )}
          {pagosPenalidad > 0 && (
            <div className="flex justify-between text-sm py-1 text-green-700">
              <span>Pagado cargos adicionales</span><span>− S/{pagosPenalidad.toFixed(2)}</span>
            </div>
          )}
        </div>
        <div className="flex justify-between font-semibold py-1 border-t mt-1">
          <span>Saldo pendiente</span>
          <span className={saldo > 0 ? 'text-red-600' : 'text-green-600'}>S/{Math.max(0, saldo).toFixed(2)}</span>
        </div>
      </div>

      {/* Pagos / Penalidades */}
      {mostrarPago ? (
        <div className="bg-white rounded-xl border p-4 mb-3 shadow-sm border-blue-200">
          <p className="text-xs text-gray-500 font-medium uppercase mb-2">Registrar pago</p>
          <input type="number" value={montoPago} onChange={e => setMontoPago(e.target.value)}
            placeholder="Monto (S/)" className="w-full border rounded-lg px-3 py-2 text-sm mb-2" />
          <select value={conceptoPago} onChange={e => setConceptoPago(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-sm mb-2">
            <option value="hospedaje">Hospedaje</option>
            <option value="consumo">Consumos</option>
            <option value="pago_penalidad">Cargo adicional / Penalidad</option>
          </select>
          <select value={metodoPago} onChange={e => setMetodoPago(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-sm mb-2">
            <option value="efectivo">Efectivo</option>
            <option value="yape">Yape</option>
            <option value="tarjeta">Tarjeta</option>
            <option value="transferencia">Transferencia</option>
          </select>
          {metodoPago === 'tarjeta' && (
            <input type="text" value={nroTicket} onChange={e => setNroTicket(e.target.value)}
              placeholder="Nro de ticket (opcional)" className="w-full border rounded-lg px-3 py-2 text-sm mb-2" />
          )}
          <div className="flex gap-2 mt-2">
            <button onClick={() => setMostrarPago(false)}
              className="flex-1 py-2 border rounded-xl text-sm text-gray-600 hover:bg-gray-50">Cancelar</button>
            <button onClick={handleRegistrarPago} disabled={guardandoPago}
              className="flex-1 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium disabled:opacity-50 hover:bg-blue-700">
              {guardandoPago ? 'Guardando...' : 'Confirmar pago'}
            </button>
          </div>
        </div>
      ) : (
        <>
          {mostrarPenalidad && (
            <div className="bg-white rounded-xl border p-4 mb-3 shadow-sm border-purple-200">
              <p className="text-xs text-gray-500 font-medium uppercase mb-3">Cargos adicionales / Penalidades</p>
              {pagos.filter(p => p.concepto === 'penalidad').length > 0 ? (
                <div className="mb-3">
                  {pagos.filter(p => p.concepto === 'penalidad').map(p => (
                    <div key={p.id} className="flex justify-between items-start py-2 border-b last:border-0">
                      <div>
                        <p className="text-sm font-medium">{p.observaciones || 'Sin descripción'}</p>
                        <p className="text-xs text-gray-400">{new Date(p.created_at).toLocaleString('es-PE')}</p>
                      </div>
                      <span className="text-sm font-medium text-purple-700">S/{parseFloat(p.monto).toFixed(2)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between text-sm font-semibold pt-2 mt-1">
                    <span>Total cargos</span>
                    <span className="text-purple-700">S/{totalPenalidades.toFixed(2)}</span>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-400 mb-3">Sin cargos registrados</p>
              )}
              <div className="border-t pt-3 mt-2">
                <p className="text-xs text-gray-500 font-medium mb-2">Agregar cargo</p>
                <input type="number" value={montoPenalidad} onChange={e => setMontoPenalidad(e.target.value)}
                  placeholder="Monto (S/)" className="w-full border rounded-lg px-3 py-2 text-sm mb-2" />
                <input type="text" value={descPenalidad} onChange={e => setDescPenalidad(e.target.value)}
                  placeholder="Descripción (ej: manchó la sábana)" className="w-full border rounded-lg px-3 py-2 text-sm mb-3" />
                <div className="flex gap-2">
                  <button onClick={() => setMostrarPenalidad(false)}
                    className="flex-1 py-2 border rounded-xl text-sm text-gray-600 hover:bg-gray-50">Cerrar</button>
                  <button onClick={handleRegistrarPenalidad}
                    className="flex-1 py-2 bg-purple-600 text-white rounded-xl text-sm font-medium hover:bg-purple-700">Agregar</button>
                </div>
              </div>
            </div>
          )}
          
          <div className="grid grid-cols-2 gap-2 mb-3">
            <button onClick={() => navigate(`/consumos/${hab.id}`)}
              className="py-2.5 bg-orange-500 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-1.5 hover:bg-orange-600 transition-colors">
              🛒 Consumos
            </button>
            <button
              onClick={() => setMostrarPenalidad(!mostrarPenalidad)}
              disabled={!turnoActivo}
              className="py-2.5 bg-purple-600 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-purple-700 transition-colors"
            >
              ⚠️ Cargo extra
            </button>
            <button
              onClick={() => setMostrarPago(true)}
              disabled={!turnoActivo}
              className="py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors"
            >
              💰 Registrar pago
            </button>
            <button
              onClick={() => setMostrarExtension(true)}
              className="py-2.5 bg-green-700 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-1.5 hover:bg-green-800 transition-colors"
            >
              📅 Cambiar checkout
            </button>
          </div>
          
          {!turnoActivo && (
            <p className="text-xs text-yellow-700 bg-yellow-50 border border-yellow-200 rounded-lg p-2 mb-3 text-center">
              🔒 Sin turno activo: no se pueden registrar pagos ni cargos hasta iniciar turno.
            </p>
          )}
        </>
      )}

      {/* Extensión */}
      {mostrarExtension && (
        <div className="bg-white rounded-xl border p-4 mb-3 shadow-sm border-green-200">
          <p className="text-xs text-gray-500 font-medium uppercase mb-2">Cambiar fecha de checkout</p>
          <p className="text-xs text-gray-400 mb-2">
            Checkout actual: {new Date(hospedaje.salida_estimada).toLocaleString('es-PE')}
          </p>
          <label className="text-xs text-gray-500 mb-1 block">Nueva fecha de salida</label>
          <input
            type="date"
            value={fechaExtension}
            onChange={e => setFechaExtension(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-sm mb-3"
          />
          <div className="flex gap-2 mt-2">
            <button onClick={() => setMostrarExtension(false)}
              className="flex-1 py-2 border rounded-xl text-sm text-gray-600 hover:bg-gray-50">Cancelar</button>
            <button onClick={handleExtenderEstadia}
              className="flex-1 py-2 bg-green-600 text-white rounded-xl text-sm font-medium hover:bg-green-700">Confirmar</button>
          </div>
        </div>
      )}

      <button onClick={handleCheckout}
        className="w-full py-3 bg-red-600 text-white rounded-xl font-semibold shadow-sm hover:bg-red-700 transition-colors">
        Hacer checkout
      </button>
    </>
  )
}
