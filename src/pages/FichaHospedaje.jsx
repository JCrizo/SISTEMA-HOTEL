import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

function FichaHospedaje() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [hospedaje, setHospedaje] = useState(null)
  const [huesped, setHuesped] = useState(null)
  const [habitacion, setHabitacion] = useState(null)
  const [pagos, setPagos] = useState([])
  const [consumos, setConsumos] = useState([])
  const [cochera, setCochera] = useState(null)
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    cargarDatos()
  }, [id])

  async function cargarDatos() {
    const { data: hospData } = await supabase
      .from('hospedajes').select('*').eq('id', id).single()
    setHospedaje(hospData)

    if (hospData) {
      const { data: habData } = await supabase
        .from('habitaciones').select('*').eq('id', hospData.habitacion_id).single()
      setHabitacion(habData)

      const { data: huespedData } = await supabase
        .from('huesped_hospedaje').select('*, clientes(*)')
        .eq('hospedaje_id', id).eq('es_titular', true).single()
      setHuesped(huespedData?.clientes)

      const { data: pagosData } = await supabase
        .from('pagos').select('*').eq('hospedaje_id', id)
        .order('created_at')
      setPagos(pagosData || [])

      const { data: consumosData } = await supabase
        .from('consumos').select('*, productos(nombre)')
        .eq('hospedaje_id', id).order('created_at')
      setConsumos(consumosData || [])

      const { data: cocheraData } = await supabase
        .from('cochera').select('*').eq('hospedaje_id', id).single()
      setCochera(cocheraData || null)
    }
    setCargando(false)
  }

  if (cargando) return <div className="p-4 text-gray-500">Cargando...</div>
  if (!hospedaje) return <div className="p-4 text-red-500">Ficha no encontrada</div>

  const totalConsumos = consumos.reduce((s, c) => s + parseFloat(c.precio_unitario) * c.cantidad, 0)
  const totalPenalidades = pagos.filter(p => p.concepto === 'penalidad').reduce((s, p) => s + parseFloat(p.monto), 0)
  const totalPagado = pagos.filter(p => p.concepto !== 'penalidad').reduce((s, p) => s + parseFloat(p.monto), 0)
  const totalGeneral = parseFloat(hospedaje.tarifa_pactada) + totalConsumos + totalPenalidades

  return (
    <div className="p-4">
      <button onClick={() => navigate(-1)} className="mb-4 text-sm text-blue-600">← Volver</button>

      {/* Encabezado */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-3">
        <div className="flex justify-between items-center mb-1">
          <p className="font-bold text-lg text-blue-900">
            Ficha N° {String(hospedaje.nro_ficha).padStart(6, '0')}
          </p>
          <span className={`text-xs px-2 py-1 rounded-full font-medium ${
            hospedaje.estado === 'activo' ? 'bg-green-100 text-green-800' :
            hospedaje.estado === 'finalizado' ? 'bg-gray-100 text-gray-700' :
            'bg-red-100 text-red-700'
          }`}>
            {hospedaje.estado === 'activo' ? 'Activo' :
             hospedaje.estado === 'finalizado' ? 'Finalizado' : 'Cancelado'}
          </span>
        </div>
        <p className="text-sm text-blue-700">Hab {habitacion?.numero} · {habitacion?.tipo_actual}</p>
      </div>

      {/* Datos del huésped */}
      <div className="bg-white rounded-xl border p-4 mb-3">
        <p className="text-xs text-gray-500 font-medium uppercase mb-2">Huésped</p>
        <p className="font-semibold">{huesped?.nombres || 'Sin nombre'}</p>
        <p className="text-sm text-gray-500">{huesped?.dni_pasaporte}</p>
        <p className="text-sm text-gray-500">{huesped?.telefono}</p>
        <p className="text-sm text-gray-500">{huesped?.nacionalidad}</p>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <div>
            <p className="text-xs text-gray-400">Ingreso</p>
            <p className="text-xs font-medium">{new Date(hospedaje.ingreso).toLocaleString('es-PE')}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Checkout</p>
            <p className="text-xs font-medium">{new Date(hospedaje.salida_estimada).toLocaleString('es-PE')}</p>
          </div>
          {hospedaje.salida_real && (
            <div>
              <p className="text-xs text-gray-400">Salida real</p>
              <p className="text-xs font-medium">{new Date(hospedaje.salida_real).toLocaleString('es-PE')}</p>
            </div>
          )}
        </div>
        {hospedaje.observaciones && (
          <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
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
      <div className="bg-white rounded-xl border p-4 mb-3">
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
        <div className="flex justify-between text-sm py-1 font-semibold border-t mt-1 pt-1">
          <span>Total</span><span>S/{totalGeneral.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-sm py-1 text-green-700">
          <span>Pagado</span><span>− S/{totalPagado.toFixed(2)}</span>
        </div>
        <div className="flex justify-between font-bold py-1 border-t mt-1">
          <span>Saldo</span>
          <span className={(totalGeneral - totalPagado) > 0 ? 'text-red-600' : 'text-green-600'}>
            S/{(totalGeneral - totalPagado).toFixed(2)}
          </span>
        </div>
      </div>

      {/* Pagos */}
      {pagos.filter(p => p.concepto !== 'penalidad').length > 0 && (
        <div className="bg-white rounded-xl border p-4 mb-3">
          <p className="text-xs text-gray-500 font-medium uppercase mb-2">Historial de pagos</p>
          {pagos.filter(p => p.concepto !== 'penalidad').map(p => (
            <div key={p.id} className="flex justify-between items-start py-2 border-b last:border-0">
              <div>
                <p className="text-sm capitalize">{p.concepto} · {p.metodo}</p>
                <p className="text-xs text-gray-400">{new Date(p.created_at).toLocaleString('es-PE')}</p>
                {p.observaciones && <p className="text-xs text-gray-400">Ticket: {p.observaciones}</p>}
              </div>
              <span className="text-sm font-medium text-green-700">S/{parseFloat(p.monto).toFixed(2)}</span>
            </div>
          ))}
        </div>
      )}

      {/* Consumos */}
      {consumos.length > 0 && (
        <div className="bg-white rounded-xl border p-4 mb-3">
          <p className="text-xs text-gray-500 font-medium uppercase mb-2">Consumos</p>
          {consumos.map(c => (
            <div key={c.id} className="flex justify-between items-start py-2 border-b last:border-0">
              <div>
                <p className="text-sm">{c.productos?.nombre}</p>
                <p className="text-xs text-gray-400">x{c.cantidad} · {new Date(c.created_at).toLocaleString('es-PE')}</p>
              </div>
              <span className="text-sm font-medium">S/{(c.precio_unitario * c.cantidad).toFixed(2)}</span>
            </div>
          ))}
          <div className="flex justify-between font-semibold pt-2 mt-1">
            <span>Total consumos</span>
            <span>S/{totalConsumos.toFixed(2)}</span>
          </div>
        </div>
      )}

      {/* Cargos adicionales */}
      {pagos.filter(p => p.concepto === 'penalidad').length > 0 && (
        <div className="bg-white rounded-xl border p-4 mb-3">
          <p className="text-xs text-gray-500 font-medium uppercase mb-2">Cargos adicionales</p>
          {pagos.filter(p => p.concepto === 'penalidad').map(p => (
            <div key={p.id} className="flex justify-between items-start py-2 border-b last:border-0">
              <div>
                <p className="text-sm font-medium">{p.observaciones || 'Sin descripción'}</p>
                <p className="text-xs text-gray-400">{new Date(p.created_at).toLocaleString('es-PE')}</p>
              </div>
              <span className="text-sm font-medium text-purple-700">S/{parseFloat(p.monto).toFixed(2)}</span>
            </div>
          ))}
        </div>
      )}

      {/* Cochera */}
      {cochera && (
        <div className="bg-white rounded-xl border p-4 mb-3">
          <p className="text-xs text-gray-500 font-medium uppercase mb-2">Cochera</p>
          <p className="text-sm font-medium">{cochera.placa}</p>
          <p className="text-xs text-gray-400">Ingreso: {new Date(cochera.hora_ingreso).toLocaleString('es-PE')}</p>
          {cochera.hora_salida && (
            <p className="text-xs text-gray-400">Salida: {new Date(cochera.hora_salida).toLocaleString('es-PE')}</p>
          )}
          {cochera.monto > 0 && (
            <p className="text-sm mt-1">Monto: S/{cochera.monto} — {cochera.estado_pago === 'pagado' ? '✓ Pagado' : 'Pendiente'}</p>
          )}
        </div>
      )}
    </div>
  )
}

export default FichaHospedaje