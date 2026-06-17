import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

function Turnos() {
  const navigate = useNavigate()
  const [turnoActivo, setTurnoActivo] = useState(null)
  const [turnoAnterior, setTurnoAnterior] = useState(null)
  const [cargando, setCargando] = useState(true)
  const { logout, usuario } = useAuth()
  

  // Apertura de turno
  const [tipoTurno, setTipoTurno] = useState('mañana')
  const [cajaPrincipalInicial, setCajaPrincipalInicial] = useState('')
  const [cajaConsumosInicial, setCajaConsumosInicial] = useState('')

  // Cierre de turno
  const [cajaPrincipalFinal, setCajaPrincipalFinal] = useState('')
  const [cajaConsumosFinal, setCajaConsumosFinal] = useState('')
  const [observaciones, setObservaciones] = useState('')

  // Movimientos de caja
  const [movimientos, setMovimientos] = useState([])
  const [mostrarMovimiento, setMostrarMovimiento] = useState(false)
  const [tipoMov, setTipoMov] = useState('salida')
  const [cajaOrigen, setCajaOrigen] = useState('principal')
  const [cajaDestino, setCajaDestino] = useState('consumos')
  const [montoMov, setMontoMov] = useState('')
  const [conceptoMov, setConceptoMov] = useState('')
  const [autorizadoPor, setAutorizadoPor] = useState('')

  const [guardando, setGuardando] = useState(false)
  const [pagosTurno, setPagosTurno] = useState([])
  const [movimientosAnterior, setMovimientosAnterior] = useState([])

  useEffect(() => {
    cargarDatos()
  }, [])

  async function cargarDatos() {
    // Turno activo
    const { data: activo } = await supabase
      .from('turnos')
      .select('*')
      .is('cierre', null)
      .order('apertura', { ascending: false })
      .limit(1)
      .single()
    setTurnoActivo(activo || null)

    // Turno anterior (ya cerrado)
    const { data: anterior } = await supabase
      .from('turnos')
      .select('*, usuarios(nombre)')
      .not('cierre', 'is', null)
      .order('cierre', { ascending: false })
      .limit(1)
      .single()
    setTurnoAnterior(anterior || null)

    // Movimientos de caja del turno anterior
    if (anterior) {
      const { data: movsAnterior } = await supabase
        .from('movimientos_caja')
        .select('*')
        .eq('turno_id', anterior.id)
        .order('created_at', { ascending: false })
      setMovimientosAnterior(movsAnterior || [])
    }

    // Movimientos del turno activo
    if (activo) {
      const { data: movs } = await supabase
        .from('movimientos_caja')
        .select('*')
        .eq('turno_id', activo.id)
        .order('created_at', { ascending: false })
      setMovimientos(movs || [])

      // Pagos del turno para desglose efectivo vs otros
      const { data: pagosDelTurno } = await supabase
        .from('pagos')
        .select('monto, metodo, concepto, created_at')
        .gte('created_at', activo.apertura)
      setPagosTurno(pagosDelTurno || [])
    }

    setCargando(false)
  }

  async function abrirTurno()
  {
    if (!cajaPrincipalInicial) return
    setGuardando(true)

    await supabase.from('turnos').insert({
      tipo: tipoTurno,
      usuario_id: usuario.id,
      caja_principal_anterior: parseFloat(cajaPrincipalInicial),
      caja_consumos_anterior: parseFloat(cajaConsumosInicial || 0),
      caja_principal_actual: parseFloat(cajaPrincipalInicial),
      caja_consumos_actual: parseFloat(cajaConsumosInicial || 0),
    })

    setGuardando(false)
    cargarDatos()
  }

  async function registrarMovimiento() {
  if (!montoMov || !conceptoMov) return
  setGuardando(true)

  await supabase.from('movimientos_caja').insert({
    turno_id: turnoActivo.id,
    tipo: tipoMov,
    caja_origen: cajaOrigen,
    caja_destino: tipoMov === 'prestamo_entre_cajas' ? cajaDestino : null,
    monto: parseFloat(montoMov),
    concepto: conceptoMov,
    autorizado_por: autorizadoPor
  })

  // Actualizar cajas según tipo de movimiento
  let updates = {}
  if (tipoMov === 'salida') {
    if (cajaOrigen === 'principal') {
      updates.caja_principal_actual = turnoActivo.caja_principal_actual - parseFloat(montoMov)
    } else {
      updates.caja_consumos_actual = turnoActivo.caja_consumos_actual - parseFloat(montoMov)
    }
  } else if (tipoMov === 'prestamo_entre_cajas') {
    if (cajaOrigen === 'principal') {
      updates.caja_principal_actual = turnoActivo.caja_principal_actual - parseFloat(montoMov)
      updates.caja_consumos_actual = turnoActivo.caja_consumos_actual + parseFloat(montoMov)
    } else {
      updates.caja_consumos_actual = turnoActivo.caja_consumos_actual - parseFloat(montoMov)
      updates.caja_principal_actual = turnoActivo.caja_principal_actual + parseFloat(montoMov)
    }
  }

  if (Object.keys(updates).length > 0) {
    await supabase.from('turnos').update(updates).eq('id', turnoActivo.id)
  }

  setMontoMov('')
  setConceptoMov('')
  setAutorizadoPor('')
  setMostrarMovimiento(false)
  setGuardando(false)
  cargarDatos()
}

  async function cerrarTurno() 
  {
    if (!cajaPrincipalFinal) return
    if (!confirm('¿Confirmar cierre de turno? Se cerrará tu sesión automáticamente.')) return
    setGuardando(true)

    // Calcular desglose por medio de pago
    const efectivo = pagosTurno.filter(p => p.metodo === 'efectivo').reduce((s, p) => s + parseFloat(p.monto), 0)
    const yape = pagosTurno.filter(p => p.metodo === 'yape').reduce((s, p) => s + parseFloat(p.monto), 0)
    const tarjeta = pagosTurno.filter(p => p.metodo === 'tarjeta').reduce((s, p) => s + parseFloat(p.monto), 0)
    const transferencia = pagosTurno.filter(p => p.metodo === 'transferencia').reduce((s, p) => s + parseFloat(p.monto), 0)

    await supabase
      .from('turnos')
      .update({
        cierre: new Date().toISOString(),
        caja_principal_actual: parseFloat(cajaPrincipalFinal),
        caja_consumos_actual: parseFloat(cajaConsumosFinal || 0),
        observaciones,
        desglose_efectivo: efectivo,
        desglose_yape: yape,
        desglose_tarjeta: tarjeta,
        desglose_transferencia: transferencia,
      })
      .eq('id', turnoActivo.id)

    setGuardando(false)
    logout()
    navigate('/login')
  }

  if (cargando) return <div className="p-4 text-gray-500">Cargando...</div>

  return (
    <div className="p-4">
      <button onClick={() => navigate('/')} className="mb-4 text-sm text-blue-600">
        ← Volver
      </button>
      <h2 className="text-xl font-semibold mb-4">Turnos y caja</h2>

      {/* Reporte turno anterior */}
      {turnoAnterior && (        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
          <p className="text-xs font-medium text-blue-800 uppercase mb-2">Reporte turno anterior</p>
          <p className="text-sm text-blue-700 font-medium capitalize">{turnoAnterior.tipo}</p>
          <p className="text-xs text-blue-600 mt-1">
            Cerrado: {new Date(turnoAnterior.cierre).toLocaleString('es-PE')}
          </p>
          <p className="text-xs text-blue-600 mt-1" >
              Recepcionista: {turnoAnterior.usuarios?.nombre || 'No registrado'}
          </p>
          <div className="grid grid-cols-2 gap-2 mt-3">
            <div className="bg-white rounded-lg p-2">
              <p className="text-xs text-gray-500">Caja principal</p>
              <p className="font-semibold">S/{turnoAnterior.caja_principal_actual}</p>
            </div>
            <div className="bg-white rounded-lg p-2">
              <p className="text-xs text-gray-500">Caja consumos</p>
              <p className="font-semibold">S/{turnoAnterior.caja_consumos_actual}</p>
            </div>
          </div>
          {turnoAnterior.desglose_efectivo != null && (
            <div className="mt-3 bg-white rounded-lg p-3">
              <p className="text-xs text-gray-500 font-medium uppercase mb-2">Desglose medios de pago</p>
              <div className="flex justify-between text-sm py-1">
                <span className="text-gray-600">💵 Efectivo</span>
                <span className="font-semibold text-green-700">S/{parseFloat(turnoAnterior.desglose_efectivo || 0).toFixed(2)}</span>
              </div>
              {parseFloat(turnoAnterior.desglose_yape || 0) > 0 && (
                <div className="flex justify-between text-sm py-1">
                  <span className="text-gray-500">📱 Yape</span>
                  <span className="font-medium">S/{parseFloat(turnoAnterior.desglose_yape).toFixed(2)}</span>
                </div>
              )}
              {parseFloat(turnoAnterior.desglose_tarjeta || 0) > 0 && (
                <div className="flex justify-between text-sm py-1">
                  <span className="text-gray-500">💳 Tarjeta</span>
                  <span className="font-medium">S/{parseFloat(turnoAnterior.desglose_tarjeta).toFixed(2)}</span>
                </div>
              )}
              {parseFloat(turnoAnterior.desglose_transferencia || 0) > 0 && (
                <div className="flex justify-between text-sm py-1">
                  <span className="text-gray-500">🏦 Transferencia</span>
                  <span className="font-medium">S/{parseFloat(turnoAnterior.desglose_transferencia).toFixed(2)}</span>
                </div>
              )}
            </div>
          )}
          {movimientosAnterior.length > 0 && (
            <div className="mt-3 bg-white rounded-lg p-3">
              <p className="text-xs text-gray-500 font-medium uppercase mb-2">Movimientos de caja</p>
              {movimientosAnterior.map(mov => (
                <div key={mov.id} className="flex justify-between items-start py-1.5 border-b last:border-0">
                  <div>
                    <p className="text-sm font-medium text-gray-700">{mov.concepto}</p>
                    <p className="text-xs text-gray-400">
                      {mov.tipo === 'prestamo_entre_cajas'
                        ? `Préstamo: ${mov.caja_origen} → ${mov.caja_destino}`
                        : `Salida de caja ${mov.caja_origen}`}
                    </p>
                    {mov.autorizado_por && (
                      <p className="text-xs text-gray-400">Autorizado: {mov.autorizado_por}</p>
                    )}
                  </div>
                  <span className="text-sm font-medium text-red-600">− S/{mov.monto}</span>
                </div>
              ))}
            </div>
          )}
          {turnoAnterior.observaciones && (
            <div className="mt-3 bg-white rounded-lg p-2">
              <p className="text-xs text-gray-500 mb-1">Observaciones</p>
              <p className="text-sm text-gray-700">{turnoAnterior.observaciones}</p>
            </div>
          )}
        </div>
      )}

      {/* Sin turno activo — abrir turno */}
      {!turnoActivo && (
        <div className="bg-white rounded-xl border p-4 mb-4">
          <p className="text-xs text-gray-500 font-medium uppercase mb-3">Abrir turno</p>
          <select
            value={tipoTurno}
            onChange={e => setTipoTurno(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-sm mb-2"
          >
            <option value="mañana">Mañana</option>
            <option value="tarde">Tarde</option>
            <option value="noche">Noche</option>
          </select>
          <input
            type="number"
            value={cajaPrincipalInicial}
            onChange={e => setCajaPrincipalInicial(e.target.value)}
            placeholder="Caja principal inicial (S/)"
            className="w-full border rounded-lg px-3 py-2 text-sm mb-2"
          />
          <input
            type="number"
            value={cajaConsumosInicial}
            onChange={e => setCajaConsumosInicial(e.target.value)}
            placeholder="Caja consumos inicial (S/)"
            className="w-full border rounded-lg px-3 py-2 text-sm mb-3"
          />
          <button
            onClick={abrirTurno}
            disabled={guardando}
            className="w-full py-3 bg-green-600 text-white rounded-xl font-semibold disabled:opacity-50"
          >
            Abrir turno
          </button>
        </div>
      )}

      {/* Turno activo */}
      {turnoActivo && (
        <>
          {/* Turno activo */}
          <div className="bg-white rounded-xl border p-4 mb-3">
            <div className="flex justify-between items-center mb-3">
              <p className="text-xs text-gray-500 font-medium uppercase">Turno activo</p>
              <span className="text-xs font-medium px-3 py-1 rounded-full bg-green-100 text-green-800 capitalize">
                {turnoActivo.tipo}
              </span>
            </div>
            <p className="text-xs text-gray-400">
              Abierto: {new Date(turnoActivo.apertura).toLocaleString('es-PE')}
            </p>
            <p className="text-xs text-gray-400">
              Por: {usuario?.nombre}
            </p>
            <div className="grid grid-cols-2 gap-2 mt-3">
              <div className="bg-gray-50 rounded-lg p-2">
                <p className="text-xs text-gray-500">Caja inicial</p>
                <p className="font-semibold">S/{turnoActivo.caja_principal_anterior}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-2">
                <p className="text-xs text-gray-500">Caja actual</p>
                <p className="font-semibold">S/{turnoActivo.caja_principal_actual}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-2">
                <p className="text-xs text-gray-500">Caja consumos</p>
                <p className="font-semibold">S/{turnoActivo.caja_consumos_actual}</p>
              </div>
            </div>

            {/* Desglose por medio de pago */}
            {pagosTurno.length > 0 && (() => {
              const efectivo = pagosTurno.filter(p => p.metodo === 'efectivo').reduce((s, p) => s + parseFloat(p.monto), 0)
              const otros = pagosTurno.filter(p => p.metodo !== 'efectivo').reduce((s, p) => s + parseFloat(p.monto), 0)
              const yape = pagosTurno.filter(p => p.metodo === 'yape').reduce((s, p) => s + parseFloat(p.monto), 0)
              const tarjeta = pagosTurno.filter(p => p.metodo === 'tarjeta').reduce((s, p) => s + parseFloat(p.monto), 0)
              const transferencia = pagosTurno.filter(p => p.metodo === 'transferencia').reduce((s, p) => s + parseFloat(p.monto), 0)
              return (
                <div className="mt-3 border-t pt-3">
                  <p className="text-xs text-gray-500 font-medium uppercase mb-2">Ingresos por medio de pago</p>
                  <div className="flex justify-between text-sm py-1">
                    <span className="text-gray-600">💵 Efectivo</span>
                    <span className="font-semibold text-green-700">S/{efectivo.toFixed(2)}</span>
                  </div>
                  {yape > 0 && (
                    <div className="flex justify-between text-sm py-1">
                      <span className="text-gray-500">📱 Yape</span>
                      <span className="font-medium">S/{yape.toFixed(2)}</span>
                    </div>
                  )}
                  {tarjeta > 0 && (
                    <div className="flex justify-between text-sm py-1">
                      <span className="text-gray-500">💳 Tarjeta</span>
                      <span className="font-medium">S/{tarjeta.toFixed(2)}</span>
                    </div>
                  )}
                  {transferencia > 0 && (
                    <div className="flex justify-between text-sm py-1">
                      <span className="text-gray-500">🏦 Transferencia</span>
                      <span className="font-medium">S/{transferencia.toFixed(2)}</span>
                    </div>
                  )}
                  {otros > 0 && (
                    <div className="flex justify-between text-sm py-1 border-t mt-1 pt-1">
                      <span className="text-gray-500">Otros medios (total)</span>
                      <span className="font-medium text-blue-700">S/{otros.toFixed(2)}</span>
                    </div>
                  )}
                </div>
              )
            })()}
          </div>

          {/* Movimientos */}
          <div className="bg-white rounded-xl border p-4 mb-3">
            <div className="flex justify-between items-center mb-3">
              <p className="text-xs text-gray-500 font-medium uppercase">Movimientos de caja</p>
              <button
                onClick={() => setMostrarMovimiento(!mostrarMovimiento)}
                className="text-xs text-blue-600 font-medium"
              >
                + Agregar
              </button>
            </div>

            {mostrarMovimiento && (
              <div className="mb-3 flex flex-col gap-2">
                <select
                  value={tipoMov}
                  onChange={e => setTipoMov(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                >
                  <option value="salida">Salida de caja</option>
                  <option value="prestamo_entre_cajas">Préstamo entre cajas</option>
                </select>
                <select
                  value={cajaOrigen}
                  onChange={e => setCajaOrigen(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                >
                  <option value="principal">Caja principal</option>
                  <option value="consumos">Caja consumos</option>
                </select>
                {tipoMov === 'prestamo_entre_cajas' && (
                  <select
                    value={cajaDestino}
                    onChange={e => setCajaDestino(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 text-sm"
                  >
                    <option value="consumos">Caja consumos</option>
                    <option value="principal">Caja principal</option>
                  </select>
                )}
                <input
                  type="number"
                  value={montoMov}
                  onChange={e => setMontoMov(e.target.value)}
                  placeholder="Monto (S/)"
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                />
                <input
                  type="text"
                  value={conceptoMov}
                  onChange={e => setConceptoMov(e.target.value)}
                  placeholder="Concepto (ej: compra detergente)"
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                />
                <input
                  type="text"
                  value={autorizadoPor}
                  onChange={e => setAutorizadoPor(e.target.value)}
                  placeholder="Autorizado por (opcional)"
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => setMostrarMovimiento(false)}
                    className="flex-1 py-2 border rounded-xl text-sm text-gray-600"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={registrarMovimiento}
                    disabled={guardando}
                    className="flex-1 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium disabled:opacity-50"
                  >
                    Guardar
                  </button>
                </div>
              </div>
            )}

            {movimientos.length === 0 ? (
              <p className="text-sm text-gray-400">Sin movimientos aún</p>
            ) : (
              movimientos.map(mov => (
                <div key={mov.id} className="flex justify-between items-start py-2 border-b last:border-0">
                  <div>
                    <p className="text-sm font-medium">{mov.concepto}</p>
                    <p className="text-xs text-gray-400">
                      {mov.tipo === 'prestamo_entre_cajas'
                        ? `Préstamo: ${mov.caja_origen} → ${mov.caja_destino}`
                        : `Salida de caja ${mov.caja_origen}`}
                    </p>
                    {mov.autorizado_por && (
                      <p className="text-xs text-gray-400">Autorizado: {mov.autorizado_por}</p>
                    )}
                  </div>
                  <span className="text-sm font-medium text-red-600">− S/{mov.monto}</span>
                </div>
              ))
            )}
          </div>

          {/* Cierre de turno */}
          <div className="bg-white rounded-xl border p-4 mb-4">
            <p className="text-xs text-gray-500 font-medium uppercase mb-3">Cerrar turno</p>
            <input
              type="number"
              value={cajaPrincipalFinal}
              onChange={e => setCajaPrincipalFinal(e.target.value)}
              placeholder="Caja principal final (S/)"
              className="w-full border rounded-lg px-3 py-2 text-sm mb-2"
            />
            <input
              type="number"
              value={cajaConsumosFinal}
              onChange={e => setCajaConsumosFinal(e.target.value)}
              placeholder="Caja consumos final (S/)"
              className="w-full border rounded-lg px-3 py-2 text-sm mb-2"
            />
            <textarea
              value={observaciones}
              onChange={e => setObservaciones(e.target.value)}
              placeholder="Observaciones para el siguiente turno..."
              className="w-full border rounded-lg px-3 py-2 text-sm mb-3 h-20 resize-none"
            />
            <button
              onClick={cerrarTurno}
              disabled={guardando}
              className="w-full py-3 bg-red-600 text-white rounded-xl font-semibold disabled:opacity-50"
            >
              Entregar turno
            </button>
          </div>
        </>
      )}
    </div>
  )
}

export default Turnos