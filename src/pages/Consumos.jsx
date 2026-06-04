import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

function Consumos() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [hospedaje, setHospedaje] = useState(null)
  const [hab, setHab] = useState(null)
  const [productos, setProductos] = useState([])
  const [consumos, setConsumos] = useState([])
  const [guardando, setGuardando] = useState(false)

  useEffect(() => {
    cargarDatos()
  }, [id])

  async function cargarDatos() {
    const { data: habData } = await supabase
      .from('habitaciones')
      .select('*')
      .eq('id', id)
      .single()
    setHab(habData)

    const { data: hospData } = await supabase
      .from('hospedajes')
      .select('*')
      .eq('habitacion_id', id)
      .eq('estado', 'activo')
      .single()
    setHospedaje(hospData)

    const { data: prodData } = await supabase
      .from('productos')
      .select('*')
      .eq('activo', true)
      .order('nombre')
    setProductos(prodData || [])

    if (hospData) {
      const { data: consData } = await supabase
        .from('consumos')
        .select('*, productos(*)')
        .eq('hospedaje_id', hospData.id)
        .order('created_at', { ascending: false })
      setConsumos(consData || [])
    }
  }

  async function agregarConsumo(producto) {
    if (!hospedaje) return
    setGuardando(true)

    await supabase.from('consumos').insert({
      hospedaje_id: hospedaje.id,
      producto_id: producto.id,
      cantidad: 1,
      precio_unitario: producto.precio
      
    })

    await supabase.from('productos')
    .update({ stock: Math.max(0, producto.stock - 1) })
    .eq('id', producto.id)

    cargarDatos()
    setGuardando(false)
  }

  async function eliminarConsumo(consumoId) {
    if (!confirm('¿Eliminar este consumo?')) return
    await supabase.from('consumos').delete().eq('id', consumoId)
    cargarDatos()
  }

  const totalConsumos = consumos.reduce((s, c) => s + parseFloat(c.precio_unitario) * c.cantidad, 0)

  if (!hab) return <div className="p-4 text-gray-500">Cargando...</div>

  return (
    <div className="p-4">
      <button onClick={() => navigate(`/habitacion/${id}`)} className="mb-4 text-sm text-blue-600">
        ← Volver
      </button>

      <h2 className="text-xl font-semibold mb-4">Consumos · Hab {hab.numero}</h2>

      {/* Productos disponibles */}
      <div className="bg-white rounded-xl border p-4 mb-3">
        <p className="text-xs text-gray-500 font-medium uppercase mb-3">Agregar producto</p>
        {productos.length === 0 ? (
          <p className="text-sm text-gray-400">No hay productos registrados</p>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {productos.map(prod => (
              <button
                key={prod.id}
                onClick={() => agregarConsumo(prod)}
                disabled={guardando}
                className="border rounded-xl p-3 text-left hover:bg-green-50 hover:border-green-400 disabled:opacity-50"
              >
                <div className="text-sm font-medium">{prod.nombre}</div>
                <div className="text-xs text-gray-500 mt-1">S/{prod.precio}</div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Consumos registrados */}
      <div className="bg-white rounded-xl border p-4 mb-3">
        <p className="text-xs text-gray-500 font-medium uppercase mb-3">
          Consumos registrados
        </p>
        {consumos.length === 0 ? (
          <p className="text-sm text-gray-400">Sin consumos aún</p>
        ) : (
          <>
            {consumos.map(c => (
              <div key={c.id} className="flex justify-between items-center py-2 border-b last:border-0">
                <div>
                  <p className="text-sm font-medium">{c.productos?.nombre}</p>
                  <p className="text-xs text-gray-400">x{c.cantidad} · S/{c.precio_unitario}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium">S/{(c.precio_unitario * c.cantidad).toFixed(2)}</span>
                  <button
                    onClick={() => eliminarConsumo(c.id)}
                    className="text-red-400 text-xs"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
            <div className="flex justify-between font-semibold pt-2 mt-1">
              <span>Total consumos</span>
              <span>S/{totalConsumos.toFixed(2)}</span>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default Consumos