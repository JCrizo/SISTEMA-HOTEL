import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

function ReportesRecepcion() {
  const navigate = useNavigate()
  const [hospedajes, setHospedajes] = useState([])
  const [limpiezas, setLimpiezas] = useState([])
  const [cargando, setCargando] = useState(true)
  const [vista, setVista] = useState('hospedajes')
  const [busqueda, setBusqueda] = useState('')
  const [fechaFiltro, setFechaFiltro] = useState('')

  useEffect(() => {
    cargarDatos()
  }, [])

  async function cargarDatos() {
    const { data: hospData } = await supabase
      .from('hospedajes')
      .select(`
        *,
        habitaciones(numero, tipo_actual),
        huesped_hospedaje(clientes(nombres, dni_pasaporte))
      `)
      .order('ingreso', { ascending: false })
      .limit(50)
    setHospedajes(hospData || [])

    const { data: limpData } = await supabase
      .from('limpieza')
      .select(`*, habitaciones(numero, tipo_actual)`)
      .order('hora', { ascending: false })
      .limit(50)
    setLimpiezas(limpData || [])

    setCargando(false)
  }

  const hospedajesFiltrados = hospedajes.filter(h => {
    const nroFicha = String(h.nro_ficha).padStart(6, '0')
    const nombre = h.huesped_hospedaje?.[0]?.clientes?.nombres?.toLowerCase() || ''
    const dni = h.huesped_hospedaje?.[0]?.clientes?.dni_pasaporte || ''
    const fechaMatch = fechaFiltro
      ? new Date(h.ingreso).toISOString().split('T')[0] === fechaFiltro
      : true
    return (
      fechaMatch &&
      (nroFicha.includes(busqueda) ||
       nombre.includes(busqueda.toLowerCase()) ||
       dni.includes(busqueda))
    )
  })

  if (cargando) return <div className="p-4 text-gray-500">Cargando...</div>

  return (
    <div className="p-4">
      <button onClick={() => navigate('/')} className="mb-4 text-sm text-blue-600">← Volver</button>
      <h2 className="text-xl font-semibold mb-4">Mis Reportes</h2>

      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setVista('hospedajes')}
          className={`flex-1 py-2 rounded-xl text-sm font-medium ${
            vista === 'hospedajes' ? 'bg-blue-600 text-white' : 'bg-white border text-gray-600'
          }`}
        >
          Fichas hospedaje
        </button>
        <button
          onClick={() => setVista('limpieza')}
          className={`flex-1 py-2 rounded-xl text-sm font-medium ${
            vista === 'limpieza' ? 'bg-yellow-500 text-white' : 'bg-white border text-gray-600'
          }`}
        >
          Limpieza
        </button>
      </div>

      {vista === 'hospedajes' && (
        <>
          <div className="flex gap-2 mb-3">
            <input
              type="text"
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              placeholder="Buscar por ficha, nombre o DNI"
              className="flex-1 border rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <input
            type="date"
            value={fechaFiltro}
            onChange={e => setFechaFiltro(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-sm mb-3"
          />

          {hospedajesFiltrados.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-4">Sin resultados</p>
          ) : (
            <div className="flex flex-col gap-3">
              {hospedajesFiltrados.map(h => (
                <div
                  key={h.id}
                  onClick={() => navigate(`/ficha/${h.id}`)}
                  className="bg-white rounded-xl border p-4 cursor-pointer"
                >
                  <div className="flex justify-between items-start mb-1">
                    <p className="font-semibold">
                      {h.huesped_hospedaje?.[0]?.clientes?.nombres || 'Sin nombre'}
                    </p>
                    <span className="text-xs font-medium text-blue-600">
                      N° {String(h.nro_ficha).padStart(6, '0')}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">
                    Hab {h.habitaciones?.numero} · {h.habitaciones?.tipo_actual}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Ingreso: {new Date(h.ingreso).toLocaleDateString('es-PE')}
                  </p>
                  <div className="flex justify-between mt-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      h.estado === 'activo' ? 'bg-green-100 text-green-800' :
                      h.estado === 'finalizado' ? 'bg-gray-100 text-gray-600' :
                      'bg-red-100 text-red-600'
                    }`}>
                      {h.estado === 'activo' ? 'Activo' :
                       h.estado === 'finalizado' ? 'Finalizado' : 'Cancelado'}
                    </span>
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
              ))}
            </div>
          )}
        </>
      )}

      {vista === 'limpieza' && (
        <div className="flex flex-col gap-3">
          {limpiezas.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-4">Sin registros de limpieza</p>
          ) : (
            limpiezas.map(l => (
              <div key={l.id} className="bg-white rounded-xl border p-4">
                <div className="flex justify-between items-start mb-1">
                  <p className="font-semibold">Hab {l.habitaciones?.numero}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    l.tipo === 'total' ? 'bg-yellow-100 text-yellow-800' : 'bg-orange-100 text-orange-800'
                  }`}>
                    {l.tipo === 'total' ? 'Limpieza total' : 'Limpieza simple'}
                  </span>
                </div>
                <p className="text-xs text-gray-400">
                  Inicio: {l.hora ? new Date(l.hora).toLocaleString('es-PE') : 'No registrado'}
                </p>
                {l.observaciones && (
                  <p className="text-xs text-gray-500 mt-1">{l.observaciones}</p>
                )}
                <span className={`text-xs px-2 py-0.5 rounded-full mt-2 iFnline-block ${
                  l.estado === 'completada' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                }`}>
                  {l.estado === 'completada' ? 'Completada' : 'En proceso'}
                </span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}

export default ReportesRecepcion