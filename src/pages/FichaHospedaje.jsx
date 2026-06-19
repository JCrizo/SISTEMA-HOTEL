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

  if (cargando) return (
    <div className="flex justify-center items-center h-screen bg-gray-50">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
    </div>
  )
  
  if (!hospedaje) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-red-50 text-red-600 p-6 rounded-3xl border-2 border-red-200 text-center max-w-md shadow-sm">
        <span className="text-4xl mb-2 block">🚫</span>
        <h2 className="text-xl font-black mb-1">Ficha no encontrada</h2>
        <p className="text-sm font-medium mb-4">No se pudo cargar la información de este hospedaje.</p>
        <button onClick={() => navigate(-1)} className="bg-red-600 text-white px-6 py-2.5 rounded-xl font-bold shadow-sm">Regresar</button>
      </div>
    </div>
  )

  const totalConsumos = consumos.reduce((s, c) => s + parseFloat(c.precio_unitario) * c.cantidad, 0)
  const totalPenalidades = pagos.filter(p => p.concepto === 'penalidad').reduce((s, p) => s + parseFloat(p.monto), 0)
  const totalPagado = pagos.filter(p => p.concepto !== 'penalidad').reduce((s, p) => s + parseFloat(p.monto), 0)
  const totalGeneral = parseFloat(hospedaje.tarifa_pactada) + totalConsumos + totalPenalidades

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      {/* Header Fijo */}
      <header className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-10 mb-8">
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate(-1)} 
              className="p-2 rounded-full hover:bg-gray-100 text-gray-600 transition-colors"
              title="Volver"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            </button>
            <div>
              <h1 className="text-xl font-black text-gray-800 tracking-tight">Ficha de Hospedaje</h1>
              <p className="text-sm text-gray-500 font-medium">Historial detallado</p>
            </div>
          </div>
          <button onClick={() => window.print()} className="p-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-colors font-bold text-sm flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
            <span className="hidden sm:inline">Imprimir</span>
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* COLUMNA IZQUIERDA (Info Principal) */}
        <div className="md:col-span-2 space-y-6">
          
          {/* Tarjeta Principal Ficha */}
          <div className="bg-gradient-to-br from-indigo-600 to-blue-700 rounded-3xl p-8 text-white shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 p-6 opacity-10">
              <svg className="w-32 h-32" fill="currentColor" viewBox="0 0 24 24"><path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/></svg>
            </div>
            
            <div className="relative z-10 flex flex-wrap justify-between items-start gap-4">
              <div>
                <p className="text-indigo-200 font-bold uppercase tracking-widest text-xs mb-1">Ficha Número</p>
                <div className="text-4xl font-black tracking-tighter mb-2">{String(hospedaje.nro_ficha).padStart(6, '0')}</div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs px-3 py-1 rounded-lg font-bold uppercase tracking-wider shadow-sm ${
                    hospedaje.estado === 'activo' ? 'bg-green-500 text-white' :
                    hospedaje.estado === 'finalizado' ? 'bg-gray-800 text-gray-200' :
                    'bg-red-500 text-white'
                  }`}>
                    {hospedaje.estado}
                  </span>
                  <span className="text-sm font-bold bg-white/20 px-3 py-1 rounded-lg backdrop-blur-sm">
                    Habitación {habitacion?.numero} ({habitacion?.tipo_actual})
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Datos del huésped */}
          <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
              Información del Huésped
            </h3>
            
            <div className="mb-6 pb-6 border-b border-gray-100 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
              <div>
                <p className="text-2xl font-black text-gray-800">{huesped?.nombres || 'Sin nombre'}</p>
                <div className="flex flex-wrap items-center gap-3 mt-2 text-sm font-bold text-gray-500">
                  <span className="bg-gray-100 px-2 py-1 rounded-md">{huesped?.dni_pasaporte}</span>
                  {huesped?.telefono && <span>📞 {huesped?.telefono}</span>}
                  {huesped?.nacionalidad && <span>🌍 {huesped?.nacionalidad}</span>}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Check-in</p>
                <p className="text-sm font-bold text-gray-800">{new Date(hospedaje.ingreso).toLocaleString('es-PE', {day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit'})}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Check-out (Estimado)</p>
                <p className="text-sm font-bold text-indigo-700">{new Date(hospedaje.salida_estimada).toLocaleString('es-PE', {day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit'})}</p>
              </div>
              {hospedaje.salida_real && (
                <div className="bg-green-50 p-4 rounded-2xl border border-green-100">
                  <p className="text-[10px] font-bold text-green-600 uppercase tracking-wider mb-1">Salida Real</p>
                  <p className="text-sm font-bold text-green-800">{new Date(hospedaje.salida_real).toLocaleString('es-PE', {day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit'})}</p>
                </div>
              )}
            </div>

            {hospedaje.observaciones && (
              <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-2xl">
                <p className="text-xs font-black text-yellow-800 uppercase tracking-widest mb-1">Observaciones</p>
                <p className="text-sm font-medium text-yellow-700">{hospedaje.observaciones}</p>
              </div>
            )}
            
            {hospedaje.comprobante && hospedaje.comprobante !== 'ninguno' && (
              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-2xl flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                </div>
                <div>
                  <p className="text-xs font-black text-blue-800 uppercase tracking-widest capitalize">Comprobante: {hospedaje.comprobante}</p>
                  {hospedaje.comprobante === 'factura' && hospedaje.ruc && (
                    <p className="text-sm font-bold text-blue-600">RUC: {hospedaje.ruc}</p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Consumos */}
          {consumos.length > 0 && (
            <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <span className="text-lg">🍔</span> Consumos (Room Service)
              </h3>
              <div className="space-y-3">
                {consumos.map(c => (
                  <div key={c.id} className="flex justify-between items-center p-3 hover:bg-gray-50 rounded-xl transition-colors">
                    <div>
                      <p className="text-sm font-bold text-gray-800">{c.productos?.nombre}</p>
                      <p className="text-xs font-bold text-gray-400">Cant: {c.cantidad} · {new Date(c.created_at).toLocaleString('es-PE', {day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit'})}</p>
                    </div>
                    <span className="text-sm font-black text-gray-800 bg-gray-100 px-3 py-1.5 rounded-lg">
                      S/{(c.precio_unitario * c.cantidad).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
              <div className="flex justify-between font-black pt-4 mt-4 border-t border-gray-100 text-lg">
                <span className="text-gray-500">Total Consumos</span>
                <span className="text-gray-800">S/{totalConsumos.toFixed(2)}</span>
              </div>
            </div>
          )}

          {/* Cochera */}
          {cochera && (
            <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <span className="text-lg">🚗</span> Estacionamiento Registrado
              </h3>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 bg-gray-50 rounded-2xl border border-gray-100 gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-black text-gray-500 uppercase tracking-widest">Placa</span>
                    <span className="text-lg font-black text-gray-800 bg-white px-2 py-0.5 rounded shadow-sm border border-gray-200">{cochera.placa}</span>
                  </div>
                  <p className="text-xs font-bold text-gray-500">
                    Ingreso: {new Date(cochera.hora_ingreso).toLocaleString('es-PE', {day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit'})}
                  </p>
                  {cochera.hora_salida && (
                    <p className="text-xs font-bold text-gray-500 mt-0.5">
                      Salida: {new Date(cochera.hora_salida).toLocaleString('es-PE', {day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit'})}
                    </p>
                  )}
                </div>
                {cochera.monto > 0 && (
                  <div className="text-right">
                    <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-md mb-1 inline-block ${
                      cochera.estado_pago === 'pagado' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {cochera.estado_pago === 'pagado' ? '✓ Pagado' : 'Pendiente'}
                    </span>
                    <p className="text-xl font-black text-gray-800">S/{cochera.monto}</p>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>

        {/* COLUMNA DERECHA (Finanzas) */}
        <div className="space-y-6">
          
          {/* Resumen de Cuenta */}
          <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm sticky top-24">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2">
              <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              Resumen de Cuenta
            </h3>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="font-bold text-gray-600">Hospedaje</span>
                <span className="font-black text-gray-800">S/{hospedaje.tarifa_pactada}</span>
              </div>
              {totalConsumos > 0 && (
                <div className="flex justify-between items-center text-sm">
                  <span className="font-bold text-gray-600">Consumos</span>
                  <span className="font-black text-gray-800">S/{totalConsumos.toFixed(2)}</span>
                </div>
              )}
              {totalPenalidades > 0 && (
                <div className="flex justify-between items-center text-sm">
                  <span className="font-bold text-purple-600">Cargos Extras</span>
                  <span className="font-black text-purple-700">S/{totalPenalidades.toFixed(2)}</span>
                </div>
              )}
              
              <div className="border-t-2 border-dashed border-gray-200 pt-3 my-2">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-gray-400 uppercase tracking-wider text-[10px]">Total Facturado</span>
                  <span className="font-black text-xl text-gray-800">
                    S/{totalGeneral.toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="flex justify-between items-center text-sm text-green-600 bg-green-50 p-3 rounded-xl border border-green-100">
                <span className="font-bold">Total Abonado</span>
                <span className="font-black">− S/{totalPagado.toFixed(2)}</span>
              </div>

              <div className={`mt-4 rounded-2xl p-5 border-2 flex flex-col items-center justify-center text-center ${
                (totalGeneral - totalPagado) > 0 ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'
              }`}>
                <span className={`font-bold uppercase tracking-widest text-xs mb-1 ${
                  (totalGeneral - totalPagado) > 0 ? 'text-red-500' : 'text-gray-500'
                }`}>
                  {(totalGeneral - totalPagado) > 0 ? 'Saldo Deudor' : 'Cuenta Saldada'}
                </span>
                <span className={`font-black text-3xl ${
                  (totalGeneral - totalPagado) > 0 ? 'text-red-600' : 'text-gray-400'
                }`}>
                  S/{Math.max(0, totalGeneral - totalPagado).toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Historial de Pagos */}
          {pagos.filter(p => p.concepto !== 'penalidad').length > 0 && (
            <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <span className="text-lg">💵</span> Historial de Pagos
              </h3>
              <div className="space-y-3">
                {pagos.filter(p => p.concepto !== 'penalidad').map(p => (
                  <div key={p.id} className="p-3 bg-gray-50 rounded-xl border border-gray-100 flex flex-col gap-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[10px] font-black text-gray-500 uppercase tracking-wider bg-white px-2 py-0.5 rounded shadow-sm border border-gray-100">{p.concepto}</span>
                        <p className="text-sm font-bold text-gray-800 capitalize mt-1">{p.metodo}</p>
                      </div>
                      <span className="text-sm font-black text-green-600">S/{parseFloat(p.monto).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-gray-400">{new Date(p.created_at).toLocaleString('es-PE', {day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit'})}</span>
                      {p.observaciones && <span className="font-bold text-gray-500 bg-gray-200 px-2 py-0.5 rounded">Tck: {p.observaciones}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Cargos Adicionales */}
          {pagos.filter(p => p.concepto === 'penalidad').length > 0 && (
            <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <span className="text-lg">⚠️</span> Cargos Adicionales
              </h3>
              <div className="space-y-3">
                {pagos.filter(p => p.concepto === 'penalidad').map(p => (
                  <div key={p.id} className="p-3 bg-purple-50 rounded-xl border border-purple-100 flex flex-col gap-2">
                    <div className="flex justify-between items-start">
                      <p className="text-sm font-bold text-purple-900">{p.observaciones || 'Sin descripción'}</p>
                      <span className="text-sm font-black text-purple-700">S/{parseFloat(p.monto).toFixed(2)}</span>
                    </div>
                    <p className="text-xs font-bold text-purple-400">{new Date(p.created_at).toLocaleString('es-PE', {day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit'})}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  )
}

export default FichaHospedaje