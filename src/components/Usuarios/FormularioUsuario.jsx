import { useState, useEffect } from 'react'

export default function FormularioUsuario({ editando, onGuardar, onCancelar }) {
  const [nombre, setNombre] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rol, setRol] = useState('recepcionista')
  const [error, setError] = useState('')
  const [guardando, setGuardando] = useState(false)

  useEffect(() => {
    if (editando) {
      setNombre(editando.nombre)
      setEmail(editando.email)
      setPassword('')
      setRol(editando.rol)
    } else {
      setNombre('')
      setEmail('')
      setPassword('')
      setRol('recepcionista')
    }
    setError('')
  }, [editando])

  async function handleGuardar() {
    setError('')
    if (!nombre.trim() || !email.trim()) {
      setError('Nombre y usuario/email son obligatorios')
      return
    }

    setGuardando(true)
    const { exito, error: errMsg } = await onGuardar({ nombre, email, rol }, editando)
    if (!exito) {
      setError(errMsg || 'Error al guardar usuario')
    } else {
      onCancelar() // Cierra el form
    }
    setGuardando(false)
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-blue-100 p-6 mb-6">
      <div className="mb-4">
        <h3 className="text-lg font-bold text-gray-800">
          {editando ? `✏️ Editando: ${editando.nombre}` : '✨ Nuevo Usuario'}
        </h3>
        <p className="text-sm text-gray-500">Completa los datos del personal.</p>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1.5">Nombre Completo</label>
            <input
              type="text"
              value={nombre}
              onChange={e => setNombre(e.target.value)}
              placeholder="Ej: Juan Pérez"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-500 transition-colors"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1.5">Correo Electrónico</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="correo@ejemplo.com"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-500 transition-colors"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1.5">Rol del Sistema</label>
            <select
              value={rol}
              onChange={e => setRol(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-500 transition-colors bg-white"
            >
              <option value="recepcionista">Recepcionista</option>
              <option value="administrador">Administrador</option>
            </select>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg border border-red-100 font-medium">
            ⚠ {error}
          </div>
        )}

        <div className="flex gap-3 pt-2 border-t border-gray-50">
          <button
            onClick={onCancelar}
            className="px-6 py-2.5 text-sm font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleGuardar}
            disabled={guardando}
            className="flex-1 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-sm font-bold shadow-sm transition-transform active:scale-[0.98] disabled:opacity-50"
          >
            {guardando ? 'Guardando...' : editando ? 'Guardar Cambios' : 'Crear Usuario'}
          </button>
        </div>
      </div>
    </div>
  )
}
