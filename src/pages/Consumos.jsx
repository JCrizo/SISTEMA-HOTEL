import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTurnoActivo } from '../hooks/useTurnoActivo'
import { useConsumos } from '../hooks/useConsumos'

import AvisoSinTurno from '../components/AvisoSinTurno'
import BloqueoTurnoAjeno from '../components/Compartido/BloqueoTurnoAjeno'
import CatalogoProductos from '../components/Consumos/CatalogoProductos'
import ListaConsumosRegistrados from '../components/Consumos/ListaConsumosRegistrados'

function Consumos() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { usuario } = useAuth()
  const { turnoActivo, cargandoTurno, turnoAjeno } = useTurnoActivo()
  const [tabActivo, setTabActivo] = useState('catalogo') // móvil: 'catalogo' | 'cuenta'

  const {
    cargando, hab, productos, consumos, guardando,
    cargarDatos, agregarConsumo, eliminarConsumo
  } = useConsumos(id, turnoActivo, usuario)

  useEffect(() => { cargarDatos() }, [cargarDatos])

  if (cargando || cargandoTurno) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-500 font-medium">Cargando datos...</span>
      </div>
    )
  }

  if (turnoAjeno) return <BloqueoTurnoAjeno />
  if (!turnoActivo) return <AvisoSinTurno mensaje="Debes iniciar un turno antes de registrar consumos en la habitación." />
  if (!hab) return null

  async function handleAgregarConsumo(producto) {
    const resultado = await agregarConsumo(producto)
    if (!resultado.exito) alert(resultado.error || 'No se pudo registrar el consumo')
    // Al agregar en móvil, cambiar tab a cuenta para ver el resultado
    else if (window.innerWidth < 1024) setTabActivo('cuenta')
  }

  const totalConsumos = consumos.reduce((s, c) => s + parseFloat(c.precio_unitario) * c.cantidad, 0)

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => navigate(`/habitacion/${id}`)}
            className="p-2 rounded-full hover:bg-gray-100 text-gray-600 transition-colors flex-shrink-0"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-black text-gray-800 truncate">
              Punto de Venta · <span className="text-blue-600">Hab. {hab.numero}</span>
            </h2>
            <p className="text-xs text-gray-500 font-medium hidden sm:block">Carga productos a la cuenta del huésped</p>
          </div>
          {/* Badge cuenta en móvil */}
          {consumos.length > 0 && (
            <div className="flex-shrink-0 lg:hidden">
              <span className="text-xs font-black bg-blue-600 text-white px-2.5 py-1 rounded-full">
                S/{totalConsumos.toFixed(2)}
              </span>
            </div>
          )}
        </div>

        {/* Tabs móvil */}
        <div className="lg:hidden flex border-t border-gray-100">
          <button
            onClick={() => setTabActivo('catalogo')}
            className={`flex-1 py-2.5 text-sm font-bold transition-colors ${
              tabActivo === 'catalogo'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            🏷️ Catálogo
          </button>
          <button
            onClick={() => setTabActivo('cuenta')}
            className={`flex-1 py-2.5 text-sm font-bold transition-colors relative ${
              tabActivo === 'cuenta'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            🧾 Cuenta
            {consumos.length > 0 && (
              <span className="absolute top-1.5 right-6 w-5 h-5 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center">
                {consumos.length}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* Contenido */}
      <div className="flex-1 max-w-7xl mx-auto w-full px-3 md:px-4 py-4">

        {/* Desktop: dos columnas */}
        <div className="hidden lg:flex gap-6 h-[calc(100vh-8rem)]">
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

        {/* Móvil: tabs */}
        <div className="lg:hidden">
          {tabActivo === 'catalogo' ? (
            <CatalogoProductos
              productos={productos}
              agregarConsumo={handleAgregarConsumo}
              guardando={guardando}
            />
          ) : (
            <ListaConsumosRegistrados
              consumos={consumos}
              eliminarConsumo={eliminarConsumo}
            />
          )}
        </div>
      </div>
    </div>
  )
}

export default Consumos
