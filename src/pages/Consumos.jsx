import { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTurnoActivo } from '../hooks/useTurnoActivo'
import { useConsumos } from '../hooks/useConsumos'

import AvisoSinTurno from '../components/AvisoSinTurno'
import CatalogoProductos from '../components/Consumos/CatalogoProductos'
import ListaConsumosRegistrados from '../components/Consumos/ListaConsumosRegistrados'

function Consumos() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { usuario } = useAuth()
  const { turnoActivo, cargandoTurno } = useTurnoActivo()
  
  const {
    cargando,
    hab,
    productos,
    consumos,
    guardando,
    cargarDatos,
    agregarConsumo,
    eliminarConsumo
  } = useConsumos(id, turnoActivo, usuario)

  useEffect(() => {
    cargarDatos()
  }, [cargarDatos])

  if (cargando || cargandoTurno) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-500 font-medium">Cargando datos...</span>
      </div>
    )
  }

  if (!turnoActivo) {
    return <AvisoSinTurno mensaje="Debes iniciar un turno antes de registrar consumos en la habitación." />
  }

  if (!hab) return null

  async function handleAgregarConsumo(producto) {
    const resultado = await agregarConsumo(producto)
    if (!resultado.exito) {
      alert(resultado.error || 'No se pudo registrar el consumo')
    }
  }

  return (
    <div className="p-4 max-w-7xl mx-auto h-[calc(100vh-6rem)] flex flex-col">
      <div className="flex items-center gap-4 mb-6">
        <button 
          onClick={() => navigate(`/habitacion/${id}`)} 
          className="p-2 rounded-full hover:bg-gray-100 text-gray-600 transition-colors"
          title="Volver"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </button>
        <div>
          <h2 className="text-2xl font-black text-gray-800">
            Punto de Venta <span className="text-blue-600">· Hab. {hab.numero}</span>
          </h2>
          <p className="text-sm text-gray-500 font-medium">Carga productos directamente a la cuenta del huésped</p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-0">
        <div className="flex-[2] min-h-0">
          <CatalogoProductos 
            productos={productos} 
            agregarConsumo={handleAgregarConsumo}
            guardando={guardando}
          />
        </div>
        
        <div className="flex-[1.2] min-h-0">
          <ListaConsumosRegistrados 
            consumos={consumos}
            eliminarConsumo={eliminarConsumo}
          />
        </div>
      </div>
    </div>
  )
}

export default Consumos