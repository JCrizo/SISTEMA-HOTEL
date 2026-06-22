import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useTurnoActivo } from '../hooks/useTurnoActivo'

const estilosHabitacion = {
  disponible:         'bg-green-100 border-green-300 hover:bg-green-200 hover:border-green-400 hover:shadow-green-200 text-green-900',
  disponible_reserva: 'bg-indigo-100 border-indigo-300 hover:bg-indigo-200 hover:border-indigo-400 hover:shadow-indigo-200 text-indigo-900',
  ocupada:            'bg-red-100 border-red-300 hover:bg-red-200 hover:border-red-400 hover:shadow-red-200 text-red-900',
  pendiente_limpieza: 'bg-yellow-100 border-yellow-300 hover:bg-yellow-200 hover:border-yellow-500 hover:shadow-yellow-200 text-yellow-900',
  en_limpieza:        'bg-yellow-200 border-yellow-400 hover:bg-yellow-300 hover:border-yellow-600 hover:shadow-yellow-300 text-yellow-900',
  limpieza_simple:    'bg-amber-100 border-amber-300 hover:bg-amber-200 hover:border-amber-500 hover:shadow-amber-200 text-amber-900',
  habilitada:         'bg-emerald-100 border-emerald-300 hover:bg-emerald-200 hover:border-emerald-400 hover:shadow-emerald-200 text-emerald-900',
  mantenimiento:      'bg-gray-200 border-gray-400 hover:bg-gray-300 hover:border-gray-500 hover:shadow-gray-300 text-gray-900 opacity-90',
}

const etiquetas = {
  disponible:         'Disponible',
  ocupada:            'Ocupada',
  pendiente_limpieza: 'Limpieza Total',
  en_limpieza:        'En Limpieza',
  limpieza_simple:    'Limpieza Simple',
  habilitada:         'Habilitada',
  mantenimiento:      'Mantenimiento',
}

function Habitaciones() {
  const [habitaciones, setHabitaciones] = useState([])
  const [cargando, setCargando] = useState(true)
  const navigate = useNavigate()
  const { usuario, logout } = useAuth()
  const { turnoAjeno } = useTurnoActivo()

  useEffect(() => {
    async function cargar() {
      const { data, error } = await supabase
        .from('habitaciones')
        .select('*')
        .order('numero')

      if (error) console.error(error)
      else {
        // Cargar reservas próximas (próximas 48 horas)
        const en48h = new Date()
        en48h.setHours(en48h.getHours() + 48)

        const { data: reservasData } = await supabase
          .from('reservas')
          .select('habitacion_id, fecha_llegada')
          .in('estado', ['pendiente', 'confirmada'])
          .lte('fecha_llegada', en48h.toISOString())

        const habsConReserva = new Set(reservasData?.map(r => r.habitacion_id) || [])

        // Cargar huéspedes activos
        const { data: hospedajesActivos } = await supabase
          .from('hospedajes')
          .select('habitacion_id, salida_estimada, clientes(nombres)')
          .eq('estado', 'activo')

        const mapHospedajes = {}
        hospedajesActivos?.forEach(h => {
          mapHospedajes[h.habitacion_id] = {
            nombre: h.clientes?.nombres,
            salida_estimada: h.salida_estimada
          }
        })

        setHabitaciones(data.map(h => ({
          ...h,
          tieneReservaProxima: habsConReserva.has(h.id),
          huespedActivo: mapHospedajes[h.id]?.nombre || null,
          checkoutVencido: mapHospedajes[h.id]?.salida_estimada
            ? new Date(mapHospedajes[h.id].salida_estimada) < new Date()
            : false
        })))
      }
      setCargando(false)
    }

    cargar()

    const canal = supabase
      .channel('habitaciones_cambios')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'habitaciones'
      }, () => cargar())
      .subscribe()

    return () => supabase.removeChannel(canal)
  }, [])
  

  if (cargando) return (
    <div className="flex justify-center items-center h-screen bg-gray-50">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
    </div>
  )

  const navButtons = [
    { label: 'Turnos', icon: '🏪', path: '/turnos', roles: ['recepcionista', 'administrador'], color: 'bg-blue-600 hover:bg-blue-700' },
    { label: 'Cochera', icon: '🚗', path: '/cochera', roles: ['recepcionista', 'administrador'], color: 'bg-gray-700 hover:bg-gray-800' },
    { label: 'Reservas', icon: '📅', path: '/reservas', roles: ['recepcionista', 'administrador'], color: 'bg-indigo-600 hover:bg-indigo-700' },
    { label: 'Limpieza', icon: '🧹', path: '/limpieza', roles: ['recepcionista', 'administrador', 'limpieza'], color: 'bg-yellow-500 hover:bg-yellow-600' },
    { label: 'Productos', icon: '🏷️', path: '/productos', roles: ['recepcionista', 'administrador'], color: 'bg-teal-600 hover:bg-teal-700' },
    { label: 'Reportes', icon: '📈', path: '/reportes-recepcion', roles: ['recepcionista'], color: 'bg-cyan-600 hover:bg-cyan-700' },
    { label: 'Reportes Admin', icon: '📊', path: '/reportes-admin', roles: ['administrador'], color: 'bg-purple-600 hover:bg-purple-700' },
    { label: 'Usuarios', icon: '👥', path: '/usuarios', roles: ['administrador'], color: 'bg-gray-800 hover:bg-black' },
    { label: 'Auditoría', icon: '🛡️', path: '/auditoria', roles: ['administrador'], color: 'bg-red-800 hover:bg-red-900' },
  ]

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <header className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-black text-gray-800 tracking-tight">Panel Principal</h1>
            <p className="text-sm text-gray-500 font-medium">¡Hola, {usuario?.nombre?.split(' ')[0] || 'Usuario'}!</p>
          </div>
          <button
            onClick={async () => {
              if (usuario?.rol !== 'administrador') {
                const { data: turnos } = await supabase
                  .from('turnos').select('id').is('cierre', null).limit(1)
                if (turnos?.length > 0) {
                  alert('Tienes un turno activo. Debes entregar el turno antes de salir.')
                  return
                }
              }
              logout()
              navigate('/login')
            }}
            className="flex items-center gap-2 text-sm px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 font-bold rounded-xl transition-colors"
          >
            <span>Salir</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 mt-6">
        {turnoAjeno && (
          <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-4 mb-6 flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm animate-pulse">
            <div className="flex items-center gap-3">
              <span className="text-3xl">⚠️</span>
              <div>
                <h3 className="text-red-800 font-black text-lg">Turno Abierto por Otro Usuario</h3>
                <p className="text-sm font-medium text-red-700">No podrás realizar operaciones hasta que cierres el turno en la caja.</p>
              </div>
            </div>
            <button 
              onClick={() => navigate('/turnos')}
              className="px-6 py-2 bg-red-600 text-white rounded-xl font-bold shadow-md hover:bg-red-700 transition-colors whitespace-nowrap"
            >
              Ir a Caja a Cerrar
            </button>
          </div>
        )}

        <div className="mb-8">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Accesos Rápidos</p>
          <div className="flex gap-3 flex-nowrap overflow-x-auto pb-2 scrollbar-hide">
            {navButtons.filter(btn => btn.roles.includes(usuario?.rol || 'limpieza')).map(btn => (
              <button
                key={btn.path}
                onClick={() => navigate(btn.path)}
                className={`flex items-center gap-2 px-5 py-3 ${btn.color} text-white rounded-2xl shadow-sm transition-transform active:scale-95 whitespace-nowrap font-bold`}
              >
                <span className="text-lg">{btn.icon}</span>
                <span>{btn.label}</span>
              </button>
            ))}
          </div>
        </div>
        
        <div className="mb-4 flex justify-between items-end">
          <div>
            <h2 className="text-xl font-bold text-gray-800">Estado de Habitaciones</h2>
            <p className="text-sm text-gray-500">Selecciona una habitación para gestionarla</p>
          </div>
          <div className="text-sm font-bold text-gray-400 bg-white px-3 py-1 rounded-full border border-gray-200">
            {habitaciones.length} Total
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {habitaciones.map(hab => {
            const estiloClave = hab.tieneReservaProxima && hab.estado === 'disponible' 
              ? 'disponible_reserva' 
              : hab.estado
            
            return (
              <div
                key={hab.id}
                onClick={() => navigate(`/habitacion/${hab.id}`)}
                className={`group relative border-2 rounded-2xl p-5 cursor-pointer shadow-sm transition-all duration-200 hover:-translate-y-1 ${estilosHabitacion[estiloClave]}`}
              >
                <div className="flex justify-between items-start mb-3">
                  <span className="text-3xl font-black tracking-tighter">
                    {hab.numero}
                  </span>
                  <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg bg-white/60`}>
                    {etiquetas[hab.estado]}
                  </span>
                </div>
                
                <div className="flex flex-col gap-1">
                  <p className="text-sm font-semibold opacity-70">{hab.tipo_actual}</p>
                  <div className="flex justify-between items-end">
                    <p className="text-lg font-black">S/{hab.precio_actual}</p>
                    {hab.estado === 'ocupada' && hab.huespedActivo && (
                      <p className="text-xs font-bold truncate max-w-[100px] bg-red-800/10 px-2 py-0.5 rounded-md" title={hab.huespedActivo}>
                        👤 {hab.huespedActivo.split(' ')[0]}
                      </p>
                    )}
                  </div>
                </div>

                {hab.tieneReservaProxima && hab.estado === 'disponible' && (
                  <div className="absolute -top-3 -right-3 bg-indigo-600 text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-md animate-pulse">
                    Reserva Próxima
                  </div>
                )}
                {hab.checkoutVencido && (
                  <div className="absolute -top-3 -left-3 bg-orange-500 text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-md animate-pulse">
                    ⚠ Checkout vencido
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </main>
    </div>
  )
}

export default Habitaciones