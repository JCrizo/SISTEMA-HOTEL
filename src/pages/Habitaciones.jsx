import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

const colores = {
  disponible:         'bg-green-100 border-green-400 text-green-900',
  ocupada:            'bg-red-100 border-red-400 text-red-900',
  pendiente_limpieza: 'bg-yellow-100 border-yellow-400 text-yellow-900',
  en_limpieza:        'bg-yellow-100 border-yellow-400 text-yellow-900',
  limpieza_simple:    'bg-yellow-100 border-yellow-400 text-yellow-900',
  habilitada:         'bg-green-100 border-green-400 text-green-900',
  mantenimiento:      'bg-gray-100 border-gray-400 text-gray-700',
}

const etiquetas = {
  disponible:         'Disponible',
  ocupada:            'Ocupada',
  pendiente_limpieza: 'Pend. limpieza Total',
  en_limpieza:        'En limpieza',
  limpieza_simple:    'Limp. simple',
  habilitada:         'Habilitada',
  mantenimiento:      'Mantenimiento',
}

function Habitaciones() {
  const [habitaciones, setHabitaciones] = useState([])
  const [cargando, setCargando] = useState(true)
  const navigate = useNavigate()
  const { usuario, logout } = useAuth()

  useEffect(() => {
  async function cargar() {
    const { data, error } = await supabase
      .from('habitaciones')
      .select('*')
      .order('numero')

    if (error) console.error(error)
    else setHabitaciones(data)
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
    <div className="p-4 text-gray-500">Cargando habitaciones...</div>
  )

  return (
  <div className="p-4">
    <div className="flex justify-between items-center mb-2">
      <h2 className="text-xl font-semibold">Habitaciones</h2>
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
        className="text-xs px-3 py-1 bg-red-100 text-red-600 rounded-lg"
      >
        Salir
      </button>
    </div>
    <div className="flex gap-2 mb-4 flex-wrap">
      {(usuario?.rol === 'recepcionista' || usuario?.rol === 'administrador') && (
        <button
          onClick={() => navigate('/turnos')}
          className="text-sm px-4 py-2 bg-blue-600 text-white rounded-xl"
        >
          Turnos
        </button>
      )}
      {(usuario?.rol === 'recepcionista' || usuario?.rol === 'administrador') && (
        <button
          onClick={() => navigate('/cochera')}
          className="text-sm px-4 py-2 bg-gray-700 text-white rounded-xl"
        >
          Cochera
        </button>
      )}
      {usuario?.rol === 'administrador' && (
          <button
            onClick={() => navigate('/usuarios')}
            className="text-sm px-4 py-2 bg-gray-600 text-white rounded-xl"
          >
            Usuarios
          </button>
        )}
      {usuario?.rol === 'administrador' && (
        <button
          onClick={() => navigate('/reportes')}
          className="text-sm px-4 py-2 bg-purple-600 text-white rounded-xl"
        >
          Reportes
        </button>
      )}
      <button
        onClick={() => navigate('/limpieza')}
        className="text-sm px-4 py-2 bg-yellow-500 text-white rounded-xl"
      >
        Limpieza
      </button>
    </div>
    <div className="grid grid-cols-2 gap-3">
      {habitaciones.map(hab => (
        <div
          key={hab.id}
          onClick={() => navigate(`/habitacion/${hab.id}`)}
          className={`border rounded-xl p-3 cursor-pointer ${colores[hab.estado]}`}
        >
          <div className="text-2xl font-semibold">{hab.numero}</div>
          <div className="text-sm mt-1">{hab.tipo_actual} · S/{hab.precio_actual}</div>
          <div className="text-xs mt-2 font-medium">{etiquetas[hab.estado]}</div>
        </div>
      ))}
    </div>
  </div>
)
}

export default Habitaciones