import { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useFichaHospedaje } from '../hooks/useFichaHospedaje'

function FichaHospedaje() {
  const { id } = useParams()
  const navigate = useNavigate()
  
  const {
    cargando,
    hospedaje,
    huesped,
    habitacion,
    pagos,
    consumos,
    cochera,
    cargarDatos
  } = useFichaHospedaje()

  useEffect(() => {
    cargarDatos(id)
  }, [id, cargarDatos])

  if (cargando) return <div className="p-4 text-gray-500">Cargando ficha de hospedaje...</div>
  if (!hospedaje) return <div className="p-4 text-red-500">Ficha no encontrada</div>

  const totalConsumos = consumos.reduce((s, c) => s + parseFloat(c.precio_unitario) * c.cantidad, 0)
  const totalPenalidades = pagos.filter(p => p.concepto === 'penalidad').reduce((s, p) => s + parseFloat(p.monto), 0)
  const totalPagado = pagos.filter(p => p.concepto !== 'penalidad').reduce((s, p) => s + parseFloat(p.monto), 0)
  const totalGeneral = parseFloat(hospedaje.tarifa_pactada) + totalConsumos + totalPenalidades

  return (
    <div className="p-4 max-w-3xl mx-auto">
      <button onClick={() => navigate(-1)} className="mb-4 text-sm text-blue-600 hover:underline">
        ← Volver
      </button>

      {/* Encabezado */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-3 shadow-sm">
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
      <div className="bg-white rounded-xl border p-4 mb-3 shadow-sm">
        <p className="text-xs text-gray-500 font-medium uppercase mb-2">Huésped</p>
        <p className="font-semibold">{huesped?.nombres || 'Sin nombre'}</p>
        <p className="text-sm text-gray-500">{huesped?.dni_pasaporte}</p>
        <p className="text-sm text-gray-500">{huesped?.telefono}</p>
        <p className="text-sm text-gray-500">{huesped?.nacionalidad}</p>
        <div className="mt-3 grid grid-cols-2 gap-2 bg-gray-50 p-2 rounded-lg border">
          <div>
            <p className="text-xs text-gray-400">Ingreso</p>
            <p className="text-xs font-medium text-gray-700">{new Date(hospedaje.ingreso).toLocaleString('es-PE')}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Checkout</p>
            <p className="text-xs font-medium text-gray-700">{new Date(hospedaje.salida_estimada).toLocaleString('es-PE')}</p>
          </div>
          {hospedaje.salida_real && (
            <div className="col-span-2 pt-2 border-t mt-1">
              <p className="text-xs text-gray-400">Salida real</p>
              <p className="text-xs font-medium text-gray-700">{new Date(hospedaje.salida_real).toLocaleString('es-PE')}</p>
            </div>
          )}
        </div>
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
        <div className="flex justify-between text-sm py-1 font-semibold border-t mt-1 pt-1">
          <span>Total general</span><span>S/{totalGeneral.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-sm py-1 text-green-700">
          <span>Abonado</span><span>− S/{totalPagado.toFixed(2)}</span>
        </div>
        <div className="flex justify-between font-bold py-2 border-t mt-1 bg-gray-50 px-2 rounded-lg">
          <span>Saldo final</span>
          <span className={(totalGeneral - totalPagado) > 0 ? 'text-red-600' : 'text-green-600'}>
            S/{Math.max(0, totalGeneral - totalPagado).toFixed(2)}
          </span>
        </div>
      </div>

      {/* Pagos */}
      {pagos.filter(p => p.concepto !== 'penalidad').length > 0 && (
        <div className="bg-white rounded-xl border p-4 mb-3 shadow-sm">
          <p className="text-xs text-gray-500 font-medium uppercase mb-2">Historial de pagos</p>
          {pagos.filter(p => p.concepto !== 'penalidad').map(p => (
            <div key={p.id} className="flex justify-between items-start py-2 border-b last:border-0">
              <div>
                <p className="text-sm capitalize font-medium text-gray-800">{p.concepto} · {p.metodo}</p>
                <p className="text-xs text-gray-400">{new Date(p.created_at).toLocaleString('es-PE')}</p>
                {p.observaciones && <p className="text-xs text-gray-500 mt-0.5">Ticket: {p.observaciones}</p>}
              </div>
              <span className="text-sm font-semibold text-green-700">S/{parseFloat(p.monto).toFixed(2)}</span>
            </div>
          ))}
        </div>
      )}

      {/* Consumos */}
      {consumos.length > 0 && (
        <div className="bg-white rounded-xl border p-4 mb-3 shadow-sm">
          <p className="text-xs text-gray-500 font-medium uppercase mb-2">Consumos</p>
          {consumos.map(c => (
            <div key={c.id} className="flex justify-between items-start py-2 border-b last:border-0">
              <div>
                <p className="text-sm font-medium text-gray-800">{c.productos?.nombre}</p>
                <p className="text-xs text-gray-500">x{c.cantidad} · {new Date(c.created_at).toLocaleString('es-PE')}</p>
              </div>
              <span className="text-sm font-medium text-gray-700">S/{(c.precio_unitario * c.cantidad).toFixed(2)}</span>
            </div>
          ))}
          <div className="flex justify-between font-semibold pt-2 mt-2 border-t">
            <span className="text-gray-700">Total consumos</span>
            <span>S/{totalConsumos.toFixed(2)}</span>
          </div>
        </div>
      )}

      {/* Cargos adicionales */}
      {pagos.filter(p => p.concepto === 'penalidad').length > 0 && (
        <div className="bg-white rounded-xl border p-4 mb-3 shadow-sm">
          <p className="text-xs text-gray-500 font-medium uppercase mb-2">Cargos adicionales</p>
          {pagos.filter(p => p.concepto === 'penalidad').map(p => (
            <div key={p.id} className="flex justify-between items-start py-2 border-b last:border-0">
              <div>
                <p className="text-sm font-medium text-gray-800">{p.observaciones || 'Sin descripción'}</p>
                <p className="text-xs text-gray-400">{new Date(p.created_at).toLocaleString('es-PE')}</p>
              </div>
              <span className="text-sm font-medium text-purple-700">S/{parseFloat(p.monto).toFixed(2)}</span>
            </div>
          ))}
        </div>
      )}

      {/* Cochera */}
      {cochera && (
        <div className="bg-white rounded-xl border p-4 mb-3 shadow-sm">
          <p className="text-xs text-gray-500 font-medium uppercase mb-2">Cochera</p>
          <p className="text-sm font-medium text-gray-800">{cochera.placa}</p>
          <p className="text-xs text-gray-500 mt-1">Ingreso: {new Date(cochera.hora_ingreso).toLocaleString('es-PE')}</p>
          {cochera.hora_salida && (
            <p className="text-xs text-gray-500">Salida: {new Date(cochera.hora_salida).toLocaleString('es-PE')}</p>
          )}
          {cochera.monto > 0 && (
            <div className="mt-2 pt-2 border-t flex justify-between items-center">
              <span className="text-sm text-gray-700">Monto: S/{cochera.monto}</span>
              <span className={`text-xs px-2 py-1 rounded-lg ${cochera.estado_pago === 'pagado' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                {cochera.estado_pago === 'pagado' ? '✓ Pagado' : 'Pendiente'}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default FichaHospedaje