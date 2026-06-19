import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTurnoActivo } from '../hooks/useTurnoActivo'
import { useReservas } from '../hooks/useReservas'
import FormularioReserva from '../components/Reservas/FormularioReserva'

export default function Reservas() {
  const navigate = useNavigate()
  const { turnoActivo, cargandoTurno } = useTurnoActivo()
  const { reservas, cargando, error, cargarReservas, anularReserva } = useReservas()
  
  const [mostrarForm, setMostrarForm] = useState(false)

  useEffect(() => {
    cargarReservas()
  }, [cargarReservas])

  async function handleAnularReserva(reserva) {
    if (!confirm(`¿Anular reserva de ${reserva.clientes?.nombres}?`)) return
    await anularReserva(reserva.id)
  }

  function convertirAHospedaje(reserva) {
    navigate(`/checkin/${reserva.habitacion_id}?reserva=${reserva.id}`)
  }

  if (cargando && reservas.length === 0) return <div className="p-4 text-gray-500">Cargando...</div>

  return (
    <div className="p-4">
      <button onClick={() => navigate('/')} className="mb-4 text-sm text-blue-600">
        ← Volver
      </button>

      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Reservas</h2>
        {turnoActivo && (
          <button
            onClick={() => setMostrarForm(!mostrarForm)}
            className="text-sm px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700"
          >
            {mostrarForm ? 'Cerrar Formulario' : '+ Nueva Reserva'}
          </button>
        )}
      </div>

      {!cargandoTurno && !turnoActivo && (
        <div className="bg-yellow-50 border border-yellow-300 rounded-xl p-4 mb-4 text-center">
          <p className="text-sm text-yellow-800">
            🔒 No hay un turno activo. Inicia turno para poder crear nuevas reservas.
          </p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-300 rounded-xl p-4 mb-4 text-center">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {mostrarForm && (
        <FormularioReserva 
          turnoActivo={turnoActivo} 
          onCancel={() => setMostrarForm(false)} 
        />
      )}

      {reservas.length === 0 && !cargando ? (
        <div className="bg-white rounded-xl border p-6 text-center shadow-sm">
          <p className="text-gray-500">No hay reservas pendientes</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {reservas.map(r => (
            <div key={r.id} className="bg-white rounded-xl border p-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="font-semibold">{r.clientes?.nombres}</p>
                  <p className="text-xs text-gray-500">{r.clientes?.dni_pasaporte}</p>
                  {r.clientes?.telefono && (
                    <p className="text-xs text-gray-500 mt-0.5">📞 {r.clientes.telefono}</p>
                  )}
                </div>
                <span className="text-xs font-medium px-2 py-1 rounded-full bg-blue-100 text-blue-800">
                  {r.estado}
                </span>
              </div>
              <div className="text-sm text-gray-600 mb-1">
                Hab {r.habitaciones?.numero} — {r.habitaciones?.tipo_actual}
              </div>
              <div className="text-xs text-gray-400 mb-1">
                Llegada: {new Date(r.fecha_llegada).toLocaleString('es-PE')}
              </div>
              {r.adelanto > 0 && (
                <div className="text-xs text-green-700 mb-1">
                  Adelanto: S/{r.adelanto}
                </div>
              )}
              {r.monto_early > 0 && (
                <div className="text-xs text-blue-700 mb-1">
                  Early check-in: S/{r.monto_early}
                </div>
              )}
              {r.observaciones && (
                <div className="text-xs text-gray-500 mb-2 p-2 bg-gray-50 rounded">
                  <span className="font-medium">Obs:</span> {r.observaciones}
                </div>
              )}
              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => convertirAHospedaje(r)}
                  className="flex-1 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700"
                >
                  Check-in
                </button>
                <button
                  onClick={() => handleAnularReserva(r)}
                  className="flex-1 py-2 bg-red-50 text-red-600 border border-red-100 rounded-lg text-sm font-medium hover:bg-red-100"
                >
                  Anular
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}