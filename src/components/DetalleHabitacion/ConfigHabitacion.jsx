import { useState } from 'react'

export default function ConfigHabitacion({ hab, actualizarHabitacion, cambiarEstadoHab }) {
  const [mostrarConfigHab, setMostrarConfigHab] = useState(false)
  const [nuevoTipo, setNuevoTipo] = useState('')
  const [nuevoPrecio, setNuevoPrecio] = useState('')

  async function handleActualizar() {
    const updates = {}
    if (nuevoTipo) updates.tipo_actual = nuevoTipo
    if (nuevoPrecio) updates.precio_actual = parseFloat(nuevoPrecio)
    
    if (Object.keys(updates).length > 0) {
      await actualizarHabitacion(updates)
    }
    
    setMostrarConfigHab(false)
    setNuevoTipo('')
    setNuevoPrecio('')
  }

  return (
    <div className="bg-white rounded-xl border p-4 mt-3">
      <div className="flex justify-between items-center">
        <p className="text-xs text-gray-500 font-medium uppercase">Configuración</p>
        <button
          onClick={() => setMostrarConfigHab(!mostrarConfigHab)}
          className="text-xs text-blue-600"
        >
          {mostrarConfigHab ? 'Cerrar' : 'Editar'}
        </button>
      </div>
      {mostrarConfigHab && (
        <div className="mt-3">
          <select
            value={nuevoTipo}
            onChange={e => setNuevoTipo(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-sm mb-2"
          >
            <option value="">Tipo actual: {hab.tipo_actual}</option>
            <option value="Matrimonial">Matrimonial</option>
            <option value="Queen">Queen</option>
            <option value="Doble">Doble</option>
            <option value="Doble 2">Doble 2</option>
            <option value="Familiar">Familiar</option>
          </select>
          <input
            type="number"
            value={nuevoPrecio}
            onChange={e => setNuevoPrecio(e.target.value)}
            placeholder={`Precio actual: S/${hab.precio_actual}`}
            className="w-full border rounded-lg px-3 py-2 text-sm mb-2"
          />
          <button
            onClick={handleActualizar}
            className="w-full py-2 bg-blue-600 text-white rounded-xl text-sm font-medium mb-2 hover:bg-blue-700"
          >
            Guardar cambios
          </button>
          <div className="flex gap-2 mt-1">
            {hab.estado !== 'mantenimiento' && (
              <button
                onClick={() => cambiarEstadoHab('mantenimiento')}
                className="flex-1 py-2 bg-gray-600 text-white rounded-xl text-sm hover:bg-gray-700"
              >
                Poner en mantenimiento
              </button>
            )}
            {hab.estado === 'mantenimiento' && (
              <button
                onClick={() => cambiarEstadoHab('disponible')}
                className="flex-1 py-2 bg-green-600 text-white rounded-xl text-sm hover:bg-green-700"
              >
                Marcar disponible
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
