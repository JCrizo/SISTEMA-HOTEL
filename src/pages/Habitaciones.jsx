import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useTurnoActivo } from '../hooks/useTurnoActivo'
import ControlDiario from '../components/Habitaciones/ControlDiario'

const estilosHabitacion = {
  disponible:         'bg-blue-50 border-blue-100 hover:bg-blue-100 hover:border-blue-200 text-blue-700',
  disponible_reserva: 'bg-purple-50 border-purple-100 hover:bg-purple-100 hover:border-purple-200 text-purple-700',
  ocupada:            'bg-blue-900 border-blue-900 hover:bg-blue-800 text-white shadow-md',
  pendiente_limpieza: 'bg-orange-50 border-orange-100 hover:bg-orange-100 hover:border-orange-200 text-orange-700',
  en_limpieza:        'bg-yellow-50 border-yellow-100 hover:bg-yellow-100 hover:border-yellow-200 text-yellow-700',
  limpieza_simple:    'bg-teal-50 border-teal-100 hover:bg-teal-100 hover:border-teal-200 text-teal-700',
  habilitada:         'bg-emerald-50 border-emerald-100 hover:bg-emerald-100 hover:border-emerald-200 text-emerald-700',
  mantenimiento:      'bg-gray-50 border-gray-200 hover:bg-gray-100 text-gray-500 opacity-90',
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
  const [vista, setVista] = useState('tarjetas') // 'tarjetas' o 'tabla'
  const navigate = useNavigate()
  const { usuario, logout } = useAuth()
  const { turnoAjeno, turnoActivo } = useTurnoActivo()

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
          .select('habitacion_id, ingreso, salida_estimada, nro_ficha, tarifa_pactada, estado_pago, metodo_pago, huesped_hospedaje(clientes(nombres))')
          .eq('estado', 'activo')

        const mapHospedajes = {}
        hospedajesActivos?.forEach(h => {
          // Extraer el nombre del primer huésped (titular)
          const nombreHuesped = h.huesped_hospedaje?.[0]?.clientes?.nombres;
          
          mapHospedajes[h.habitacion_id] = {
            nombre: nombreHuesped,
            salida_estimada: h.salida_estimada,
            ingreso: h.ingreso,
            nro_ficha: h.nro_ficha,
            tarifa_pactada: h.tarifa_pactada,
            estado_pago: h.estado_pago,
            metodo_pago: h.metodo_pago
          }
        })

        setHabitaciones(data.map(h => ({
          ...h,
          tieneReservaProxima: habsConReserva.has(h.id),
          huespedActivo: mapHospedajes[h.id]?.nombre || null,
          checkoutVencido: mapHospedajes[h.id]?.salida_estimada
            ? new Date(mapHospedajes[h.id].salida_estimada) < new Date()
            : false,
          datosHospedaje: mapHospedajes[h.id] || null
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

  return (
    <div className="pb-12">
      <main className="w-full">
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

        <div className="mb-4 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
          <div>
            <h2 className="text-xl font-bold text-gray-800">Estado de Habitaciones</h2>
            <p className="text-sm text-gray-500">Selecciona una habitación para gestionarla</p>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex bg-gray-200 p-1 rounded-xl shadow-inner">
              <button
                onClick={() => setVista('tarjetas')}
                className={`px-4 py-1.5 text-sm font-bold rounded-lg transition-all ${vista === 'tarjetas' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Tarjetas
              </button>
              <button
                onClick={() => setVista('tabla')}
                className={`px-4 py-1.5 text-sm font-bold rounded-lg transition-all ${vista === 'tabla' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Control Diario
              </button>
            </div>
            <div className="text-sm font-bold text-gray-400 bg-white px-3 py-1.5 rounded-xl border border-gray-200 shadow-sm">
              {habitaciones.length} Total
            </div>
          </div>
        </div>

        {vista === 'tabla' ? (
          <ControlDiario habitaciones={habitaciones} turnoActivo={turnoAjeno ? null : (usuario && turnoActivo ? { ...turnoActivo, usuario_nombre: usuario.nombre } : null)} />
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {habitaciones.map(hab => {
            const estiloClave = hab.tieneReservaProxima && hab.estado === 'disponible' 
              ? 'disponible_reserva' 
              : hab.estado
            
            return (
              <div
                key={hab.id}
                onClick={() => navigate(`/habitacion/${hab.id}`)}
                className={`group relative border-2 rounded-2xl p-3 md:p-5 cursor-pointer shadow-sm transition-all duration-200 hover:-translate-y-1 active:scale-95 ${estilosHabitacion[estiloClave]}`}
              >
                <div className="flex justify-between items-start mb-3">
                  <span className="text-2xl md:text-3xl font-black tracking-tighter">
                    {hab.numero}
                  </span>
                  <span className="text-[10px] font-black text-gray-800 uppercase tracking-wider px-2 py-1 rounded-lg bg-white/60 max-w-[80px] truncate leading-tight">
                    {etiquetas[hab.estado]}
                  </span>
                </div>
                
                <div className="flex flex-col gap-1">
                  <p className="text-sm font-semibold opacity-70">{hab.tipo_actual}</p>
                  <div className="flex justify-between items-end">
                    <p className="text-lg font-black">S/{hab.precio_actual}</p>
                    {hab.estado === 'ocupada' && hab.huespedActivo && (
                      <p className="text-xs font-bold truncate max-w-[100px] bg-black/20 px-2 py-0.5 rounded-md" title={hab.huespedActivo}>
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
        )}
      </main>
    </div>
  )
}

export default Habitaciones
