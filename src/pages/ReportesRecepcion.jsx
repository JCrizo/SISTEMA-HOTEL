import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import Icono from '../components/Compartido/Icono'

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
        huesped_hospedaje(clientes(nombres, dni_pasaporte, telefono))
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
    const telefono = h.huesped_hospedaje?.[0]?.clientes?.telefono || ''
    const fechaMatch = fechaFiltro
      ? new Date(h.ingreso).toISOString().split('T')[0] === fechaFiltro
      : true
    return (
      fechaMatch &&
      (nroFicha.includes(busqueda) ||
       nombre.includes(busqueda.toLowerCase()) ||
       dni.includes(busqueda) ||
       telefono.includes(busqueda))
    )
  })

  if (cargando) return (
    <div className="flex flex-col justify-center items-center h-80 gap-3">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
      <span className="text-sm text-gray-400 font-semibold">Cargando reportes...</span>
    </div>
  )

  return (
    <div className="max-w-4xl mx-auto space-y-5 pb-12">
      <div>
        <h1 className="page-title">Reportes</h1>
        <p className="page-sub">Consulta fichas de hospedaje y registros de limpieza</p>
      </div>

      <div className="bg-gray-100 p-1 rounded-xl grid grid-cols-2 gap-1">
        <button
          onClick={() => setVista('hospedajes')}
          className={`min-h-[44px] sm:min-h-[38px] rounded-lg text-sm font-bold transition-all ${
            vista === 'hospedajes' ? 'bg-white text-blue-700 shadow-xs' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Fichas de hospedaje
        </button>
        <button
          onClick={() => setVista('limpieza')}
          className={`min-h-[44px] sm:min-h-[38px] rounded-lg text-sm font-bold transition-all ${
            vista === 'limpieza' ? 'bg-white text-amber-700 shadow-xs' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Limpieza
        </button>
      </div>

      {vista === 'hospedajes' && (
        <>
          <div className="card p-3 sm:p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="relative">
              <Icono name="search" className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={busqueda}
                onChange={e => setBusqueda(e.target.value)}
                placeholder="Buscar por ficha, nombre o DNI"
                className="input !pl-10"
              />
            </div>
            <input
              type="date"
              value={fechaFiltro}
              onChange={e => setFechaFiltro(e.target.value)}
              className="input"
            />
          </div>

          {hospedajesFiltrados.length === 0 ? (
            <div className="card flex flex-col items-center text-center p-10 text-gray-500">
              <Icono name="search" className="w-9 h-9 text-gray-300 mb-2" />
              <p className="text-sm font-bold text-gray-600">Sin resultados</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {hospedajesFiltrados.map(h => (
                <div
                  key={h.id}
                  onClick={() => navigate(`/ficha/${h.id}`)}
                  className="card card-hover p-4 cursor-pointer active:scale-[0.99]"
                >
                  <div className="flex justify-between items-start gap-3 mb-2">
                    <div className="min-w-0">
                      <p className="font-bold text-gray-800 truncate">
                        {h.huesped_hospedaje?.[0]?.clientes?.nombres || 'Sin nombre'}
                      </p>
                      {h.huesped_hospedaje?.[0]?.clientes?.telefono && (
                        <p className="text-xs text-gray-500">{h.huesped_hospedaje[0].clientes.telefono}</p>
                      )}
                    </div>
                    <span className="badge badge-info shrink-0">
                      N° {String(h.nro_ficha).padStart(6, '0')}
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-gray-500">
                    Hab {h.habitaciones?.numero} · {h.habitaciones?.tipo_actual}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                    <Icono name="calendar" className="w-3 h-3" /> Ingreso: {new Date(h.ingreso).toLocaleDateString('es-PE')}
                  </p>
                  <div className="flex justify-between mt-3 pt-3 border-t border-gray-50">
                    <span className={`badge ${
                      h.estado === 'activo' ? 'badge-ok' :
                      h.estado === 'finalizado' ? 'badge-muted' :
                      'badge-danger'
                    }`}>
                      {h.estado === 'activo' ? 'Activo' :
                       h.estado === 'finalizado' ? 'Finalizado' : 'Cancelado'}
                    </span>
                    <span className={`badge ${
                      h.estado_pago === 'pagado' ? 'badge-ok' :
                      h.estado_pago === 'parcial' ? 'badge-warn' :
                      'badge-danger'
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
        <>
          {limpiezas.length === 0 ? (
            <div className="card flex flex-col items-center text-center p-10 text-gray-500">
              <Icono name="sparkles" className="w-9 h-9 text-gray-300 mb-2" />
              <p className="text-sm font-bold text-gray-600">Sin registros de limpieza</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {limpiezas.map(l => (
                <div key={l.id} className="card p-4">
                  <div className="flex justify-between items-start mb-2">
                    <p className="font-black text-gray-800 text-lg">Hab {l.habitaciones?.numero}</p>
                    <span className={`badge ${l.tipo === 'total' ? 'badge-warn' : 'badge-info'}`}>
                      {l.tipo === 'total' ? 'Limpieza total' : 'Limpieza simple'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 flex items-center gap-1">
                    <Icono name="clock" className="w-3 h-3" /> Inicio: {l.hora ? new Date(l.hora).toLocaleString('es-PE') : 'No registrado'}
                  </p>
                  {l.observaciones && (
                    <p className="text-xs text-gray-500 mt-1.5 bg-gray-50 rounded-lg p-2">{l.observaciones}</p>
                  )}
                  <span className={`badge mt-3 ${l.estado === 'completada' ? 'badge-ok' : 'badge-info'}`}>
                    {l.estado === 'completada' ? 'Completada' : 'En proceso'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default ReportesRecepcion
