import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

function Limpieza() {
  const navigate = useNavigate()
  const [habitaciones, setHabitaciones] = useState([])
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    cargarDatos()
  }, [])

  async function cargarDatos() {
    const { data } = await supabase
      .from('habitaciones')
      .select('*')
      .in('estado', ['pendiente_limpieza', 'en_limpieza', 'limpieza_simple'])
      .order('numero')
    setHabitaciones(data || [])
    setCargando(false)
  }

  async function iniciarLimpieza(hab) {
    await supabase
      .from('habitaciones')
      .update({ estado: 'en_limpieza' })
      .eq('id', hab.id)

    await supabase.from('limpieza').insert({
      habitacion_id: hab.id,
      tipo: hab.estado === 'limpieza_simple' ? 'simple' : 'total',
      estado: 'en_proceso'
    })

    cargarDatos()
  }

  async function habilitarHabitacion(hab) {
    if (!confirm(`¿Marcar Hab ${hab.numero} como habilitada?`)) return

    await supabase
      .from('habitaciones')
      .update({ estado: 'disponible' })
      .eq('id', hab.id)

    await supabase
      .from('limpieza')
      .update({ estado: 'completada' })
      .eq('habitacion_id', hab.id)
      .eq('estado', 'en_proceso')

    cargarDatos()
  }

  if (cargando) return <div className="p-4 text-gray-500">Cargando...</div>

  return (
    <div className="p-4">
      <button onClick={() => navigate('/')} className="mb-4 text-sm text-blue-600">
        ← Volver
      </button>

      <h2 className="text-xl font-semibold mb-4">Limpieza</h2>

      {habitaciones.length === 0 ? (
        <div className="bg-white rounded-xl border p-6 text-center">
          <p className="text-gray-500">No hay habitaciones pendientes de limpieza</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {habitaciones.map(hab => (
            <div key={hab.id} className="bg-white rounded-xl border p-4">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <p className="font-semibold text-lg">Hab {hab.numero}</p>
                  <p className="text-sm text-gray-500">{hab.tipo_actual}</p>
                </div>
                <span className={`text-xs font-medium px-3 py-1 rounded-full ${
                  hab.estado === 'pendiente_limpieza' ? 'bg-yellow-100 text-yellow-800' :
                  hab.estado === 'en_limpieza' ? 'bg-blue-100 text-blue-800' :
                  'bg-orange-100 text-orange-800'
                }`}>
                  {hab.estado === 'pendiente_limpieza' ? 'Pend. Limpieza Total' :
                   hab.estado === 'en_limpieza' ? 'En limpieza' :
                   'Limp. simple'}
                </span>
              </div>

              {hab.estado === 'pendiente_limpieza' && (
                <button
                  onClick={() => iniciarLimpieza(hab)}
                  className="w-full py-2 bg-yellow-500 text-white rounded-xl text-sm font-medium"
                >
                  Iniciar limpieza
                </button>
              )}

              {hab.estado === 'limpieza_simple' && (
                <button
                  onClick={() => iniciarLimpieza(hab)}
                  className="w-full py-2 bg-orange-500 text-white rounded-xl text-sm font-medium"
                >
                  Iniciar limpieza simple
                </button>
              )}

              {hab.estado === 'en_limpieza' && (
                <button
                  onClick={() => habilitarHabitacion(hab)}
                  className="w-full py-2 bg-green-600 text-white rounded-xl text-sm font-medium"
                >
                  Marcar como habilitada
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default Limpieza