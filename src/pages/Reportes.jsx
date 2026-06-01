import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

function Reportes() {
  const navigate = useNavigate()
  const [cargando, setCargando] = useState(true)
  const [periodo, setPeriodo] = useState('hoy')

  const [stats, setStats] = useState({
    habitacionesOcupadas: 0,
    habitacionesTotal: 0,
    ingresosHospedaje: 0,
    ingresosConsumos: 0,
    ingresosCochera: 0,
    deudasPendientes: 0,
    checkinsHoy: 0,
    checkoutsHoy: 0,
  })
  const [hospedajesActivos, setHospedajesActivos] = useState([])
  const [deudasPendientes, setDeudasPendientes] = useState([])

  useEffect(() => {
    cargarDatos()
  }, [periodo])

  async function cargarDatos() {
    setCargando(true)

    const ahora = new Date()
    let fechaInicio = new Date()

    if (periodo === 'hoy') {
      fechaInicio.setHours(0, 0, 0, 0)
    } else if (periodo === 'semana') {
      fechaInicio.setDate(ahora.getDate() - 7)
    } else if (periodo === 'mes') {
      fechaInicio.setDate(1)
      fechaInicio.setHours(0, 0, 0, 0)
    }

    // Habitaciones
    const { data: habs } = await supabase
      .from('habitaciones').select('estado')
    const ocupadas = habs?.filter(h => h.estado === 'ocupada').length || 0

    // Pagos del periodo
    const { data: pagosData } = await supabase
      .from('pagos').select('monto, concepto, created_at')
      .gte('created_at', fechaInicio.toISOString())

    const ingresosHospedaje = pagosData
      ?.filter(p => p.concepto === 'hospedaje')
      .reduce((s, p) => s + parseFloat(p.monto), 0) || 0

    const ingresosConsumos = pagosData
      ?.filter(p => p.concepto === 'consumo')
      .reduce((s, p) => s + parseFloat(p.monto), 0) || 0

    // Cochera
    const { data: cocheraData } = await supabase
      .from('cochera').select('monto')
      .eq('estado_pago', 'pagado')
      .gte('hora_ingreso', fechaInicio.toISOString())
    const ingresosCochera = cocheraData
      ?.reduce((s, c) => s + parseFloat(c.monto), 0) || 0

    // Checkins y checkouts hoy
    const hoyInicio = new Date()
    hoyInicio.setHours(0, 0, 0, 0)

    const { data: checkinsData } = await supabase
      .from('hospedajes').select('id')
      .gte('ingreso', hoyInicio.toISOString())
    const { data: checkoutsData } = await supabase
      .from('hospedajes').select('id')
      .eq('estado', 'finalizado')
      .gte('salida_real', hoyInicio.toISOString())

    // Hospedajes activos con deuda
    const { data: hospActivos } = await supabase
      .from('hospedajes')
      .select(`
        id, tarifa_pactada, estado_pago, ingreso, salida_estimada,
        habitaciones(numero, tipo_actual),
        huesped_hospedaje(clientes(nombres))
      `)
      .eq('estado', 'activo')
      .order('ingreso', { ascending: false })
    setHospedajesActivos(hospActivos || [])

    const deudas = hospActivos?.filter(h => h.estado_pago !== 'pagado') || []
    const totalDeudas = deudas.reduce((s, h) => s + parseFloat(h.tarifa_pactada), 0)

    setDeudasPendientes(deudas)
    setStats({
      habitacionesOcupadas: ocupadas,
      habitacionesTotal: habs?.length || 0,
      ingresosHospedaje,
      ingresosConsumos,
      ingresosCochera,
      deudasPendientes: totalDeudas,
      checkinsHoy: checkinsData?.length || 0,
      checkoutsHoy: checkoutsData?.length || 0,
    })

    setCargando(false)
  }

  if (cargando) return <div className="p-4 text-gray-500">Cargando reportes...</div>

  const totalIngresos = stats.ingresosHospedaje + stats.ingresosConsumos + stats.ingresosCochera

  return (
    <div className="p-4">
      <button onClick={() => navigate('/')} className="mb-4 text-sm text-blue-600">
        ← Volver
      </button>

      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Reportes</h2>
        <select
          value={periodo}
          onChange={e => setPeriodo(e.target.value)}
          className="border rounded-lg px-3 py-2 text-sm"
        >
          <option value="hoy">Hoy</option>
          <option value="semana">Últimos 7 días</option>
          <option value="mes">Este mes</option>
        </select>
      </div>

      {/* Stats principales */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-white rounded-xl border p-3">
          <p className="text-xs text-gray-500">Habitaciones ocupadas</p>
          <p className="text-2xl font-bold mt-1">{stats.habitacionesOcupadas}<span className="text-sm text-gray-400">/{stats.habitacionesTotal}</span></p>
        </div>
        <div className="bg-white rounded-xl border p-3">
          <p className="text-xs text-gray-500">Total ingresos</p>
          <p className="text-2xl font-bold mt-1 text-green-700">S/{totalIngresos.toFixed(2)}</p>
        </div>
        <div className="bg-white rounded-xl border p-3">
          <p className="text-xs text-gray-500">Check-ins hoy</p>
          <p className="text-2xl font-bold mt-1">{stats.checkinsHoy}</p>
        </div>
        <div className="bg-white rounded-xl border p-3">
          <p className="text-xs text-gray-500">Check-outs hoy</p>
          <p className="text-2xl font-bold mt-1">{stats.checkoutsHoy}</p>
        </div>
      </div>

      {/* Desglose ingresos */}
      <div className="bg-white rounded-xl border p-4 mb-4">
        <p className="text-xs text-gray-500 font-medium uppercase mb-3">Desglose ingresos</p>
        <div className="flex justify-between text-sm py-2 border-b">
          <span>Hospedaje</span>
          <span className="font-medium">S/{stats.ingresosHospedaje.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-sm py-2 border-b">
          <span>Consumos</span>
          <span className="font-medium">S/{stats.ingresosConsumos.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-sm py-2 border-b">
          <span>Cochera</span>
          <span className="font-medium">S/{stats.ingresosCochera.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-sm py-2 font-semibold">
          <span>Total</span>
          <span className="text-green-700">S/{totalIngresos.toFixed(2)}</span>
        </div>
      </div>

      {/* Deudas pendientes */}
      {deudasPendientes.length > 0 && (
        <div className="bg-white rounded-xl border p-4 mb-4">
          <p className="text-xs text-gray-500 font-medium uppercase mb-3">
            Deudas pendientes — S/{stats.deudasPendientes.toFixed(2)}
          </p>
          {deudasPendientes.map(h => (
            <div key={h.id} className="flex justify-between items-start py-2 border-b last:border-0">
              <div>
                <p className="text-sm font-medium">
                  Hab {h.habitaciones?.numero} — {h.huesped_hospedaje?.[0]?.clientes?.nombres || 'Sin nombre'}
                </p>
                <p className="text-xs text-gray-400">
                  Checkout: {new Date(h.salida_estimada).toLocaleDateString('es-PE')}
                </p>
              </div>
              <span className="text-sm font-medium text-red-600">S/{h.tarifa_pactada}</span>
            </div>
          ))}
        </div>
      )}

      {/* Hospedajes activos */}
      <div className="bg-white rounded-xl border p-4">
        <p className="text-xs text-gray-500 font-medium uppercase mb-3">
          Hospedajes activos ({hospedajesActivos.length})
        </p>
        {hospedajesActivos.length === 0 ? (
          <p className="text-sm text-gray-400">Sin hospedajes activos</p>
        ) : (
          hospedajesActivos.map(h => (
            <div key={h.id} className="flex justify-between items-start py-2 border-b last:border-0">
              <div>
                <p className="text-sm font-medium">
                  Hab {h.habitaciones?.numero} · {h.habitaciones?.tipo_actual}
                </p>
                <p className="text-xs text-gray-400">
                  {h.huesped_hospedaje?.[0]?.clientes?.nombres || 'Sin nombre'}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium">S/{h.tarifa_pactada}</p>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  h.estado_pago === 'pagado' ? 'bg-green-100 text-green-800' :
                  h.estado_pago === 'parcial' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {h.estado_pago === 'pagado' ? 'Pagado' :
                   h.estado_pago === 'parcial' ? 'Parcial' : 'Pendiente'}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default Reportes