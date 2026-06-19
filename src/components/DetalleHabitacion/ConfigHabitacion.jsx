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
    <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm mt-8">
      <div className="flex justify-between items-center cursor-pointer" onClick={() => setMostrarConfigHab(!mostrarConfigHab)}>
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
          <h4 className="text-sm font-bold text-gray-600 uppercase tracking-widest">Configuración de Habitación</h4>
        </div>
        <button
          className="text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors"
        >
          {mostrarConfigHab ? 'Cerrar Panel' : 'Modificar Datos'}
        </button>
      </div>
      
      {mostrarConfigHab && (
        <div className="mt-6 pt-6 border-t border-gray-100 animate-fadeIn">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1.5">Tipo de Habitación</label>
              <select
                value={nuevoTipo}
                onChange={e => setNuevoTipo(e.target.value)}
                className="w-full border-2 border-gray-100 rounded-xl px-4 py-2.5 text-sm font-bold outline-none focus:border-blue-500 transition-colors bg-white"
              >
                <option value="">Mantener actual: {hab.tipo_actual}</option>
                <option value="Matrimonial">Matrimonial</option>
                <option value="Queen">Queen</option>
                <option value="Doble">Doble</option>
                <option value="Doble 2">Doble 2</option>
                <option value="Familiar">Familiar</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1.5">Precio por Noche (S/)</label>
              <input
                type="number"
                value={nuevoPrecio}
                onChange={e => setNuevoPrecio(e.target.value)}
                placeholder={`Actual: S/${hab.precio_actual}`}
                className="w-full border-2 border-gray-100 rounded-xl px-4 py-2.5 text-sm font-bold outline-none focus:border-blue-500 transition-colors bg-white"
              />
            </div>
          </div>
          
          <button
            onClick={handleActualizar}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-sm transition-colors mb-4"
          >
            Guardar Cambios de Configuración
          </button>
          
          <div className="border-t border-gray-100 pt-4">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 text-center">Acciones de Mantenimiento</p>
            {hab.estado !== 'mantenimiento' && (
              <button
                onClick={() => cambiarEstadoHab('mantenimiento')}
                className="w-full py-3 bg-gray-800 text-white rounded-xl text-sm font-bold hover:bg-black transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                Bloquear Habitación (Mantenimiento)
              </button>
            )}
            {hab.estado === 'mantenimiento' && (
              <button
                onClick={() => cambiarEstadoHab('disponible')}
                className="w-full py-3 bg-green-600 text-white rounded-xl text-sm font-bold hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                Habilitar Habitación (Disponible)
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
