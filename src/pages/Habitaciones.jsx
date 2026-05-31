import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

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
      <h2 className="text-xl font-semibold mb-4">Habitaciones</h2>
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