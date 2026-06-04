import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

function Limpieza() {
  const navigate = useNavigate()
  const { usuario } = useAuth()
  const [habitaciones, setHabitaciones] = useState([])
  const [cargando, setCargando] = useState(true)
  const [horasInicio, setHorasInicio] = useState({})
  const [horasFin, setHorasFin] = useState({})
  const [personalLimpieza, setPersonalLimpieza] = useState({})

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
    const horaInicio = horasInicio[hab.id] || new Date().toTimeString().slice(0, 5)

    await supabase
      .from('habitaciones')
      .update({ estado: 'en_limpieza' })
      .eq('id', hab.id)

    const ahora = new Date()
    const [horas, minutos] = horaInicio.split(':')
    ahora.setHours(parseInt(horas), parseInt(minutos), 0, 0)

    await supabase.from('limpieza').insert
    ( 
      {
      habitacion_id: hab.id,
      usuario_id: usuario?.id || null,
      tipo: hab.estado === 'limpieza_simple' ? 'simple' : 'total',
      estado: 'en_proceso',
      hora: ahora.toISOString(),
      observaciones: personalLimpieza[hab.id] ? `Personal: ${personalLimpieza[hab.id]}` : null
       }
    )

    cargarDatos()
  }

  async function habilitarHabitacion(hab) {
    if (!confirm(`¿Marcar Hab ${hab.numero} como habilitada?`)) return

    const horaFin = horasFin[hab.id] || new Date().toTimeString().slice(0, 5)
    const ahora = new Date()
    const [horas, minutos] = horaFin.split(':')
    ahora.setHours(parseInt(horas), parseInt(minutos), 0, 0)

    await supabase
      .from('habitaciones')
      .update({ estado: 'disponible' })
      .eq('id', hab.id)

    await supabase
      .from('limpieza')
      .update({ estado: 'completada', observaciones: `Fin: ${horaFin}` })
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
                   hab.estado === 'en_limpieza' ? 'En limpieza' : 'Limp. simple'}
                </span>
              </div>

              {(hab.estado === 'pendiente_limpieza' || hab.estado === 'limpieza_simple') && (
                <div className="mb-2">
                  <label className="text-xs text-gray-500 mb-1 block">Personal de limpieza</label>
                    <input
                      type="text"
                      value={personalLimpieza[hab.id] || ''}
                      onChange={e => setPersonalLimpieza(prev => ({ ...prev, [hab.id]: e.target.value }))}
                      placeholder="Nombre de quien limpia"
                      className="w-full border rounded-lg px-3 py-2 text-sm mb-2"
                    />
                  <label className="text-xs text-gray-500 mb-1 block">Hora de inicio</label>
                  <input
                    type="time"
                    value={horasInicio[hab.id] || new Date().toTimeString().slice(0, 5)}
                    onChange={e => setHorasInicio(prev => ({ ...prev, [hab.id]: e.target.value }))}
                    className="w-full border rounded-lg px-3 py-2 text-sm mb-2"
                  />
                  <button
                    onClick={() => iniciarLimpieza(hab)}
                    className={`w-full py-2 text-white rounded-xl text-sm font-medium ${
                      hab.estado === 'limpieza_simple' ? 'bg-orange-500' : 'bg-yellow-500'
                    }`}
                  >
                    {hab.estado === 'limpieza_simple' ? 'Iniciar limpieza simple' : 'Iniciar limpieza'}
                  </button>
                </div>
              )}

              {hab.estado === 'en_limpieza' && (
                <div className="mb-2">
                  <label className="text-xs text-gray-500 mb-1 block">Hora de finalización</label>
                  <input
                    type="time"
                    value={horasFin[hab.id] || new Date().toTimeString().slice(0, 5)}
                    onChange={e => setHorasFin(prev => ({ ...prev, [hab.id]: e.target.value }))}
                    className="w-full border rounded-lg px-3 py-2 text-sm mb-2"
                  />
                  <button
                    onClick={() => habilitarHabitacion(hab)}
                    className="w-full py-2 bg-green-600 text-white rounded-xl text-sm font-medium"
                  >
                    Marcar como habilitada
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default Limpieza