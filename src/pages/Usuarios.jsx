import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

function Usuarios() {
  const navigate = useNavigate()
  const { usuario } = useAuth()
  const [usuarios, setUsuarios] = useState([])
  const [cargando, setCargando] = useState(true)
  const [mostrarForm, setMostrarForm] = useState(false)
  const [editando, setEditando] = useState(null)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')

  const [nombre, setNombre] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rol, setRol] = useState('recepcionista')

  useEffect(() => {
    if (usuario?.rol !== 'administrador') {
      navigate('/')
      return
    }
    cargarUsuarios()
  }, [])

  async function cargarUsuarios() {
    const { data } = await supabase
      .from('usuarios')
      .select('*')
      .order('nombre')
    setUsuarios(data || [])
    setCargando(false)
  }

  function abrirEditar(u) {
    setEditando(u)
    setNombre(u.nombre)
    setEmail(u.email)
    setPassword('')
    setRol(u.rol)
    setMostrarForm(true)
    setError('')
  }

  function cancelar() {
    setEditando(null)
    setNombre('')
    setEmail('')
    setPassword('')
    setRol('recepcionista')
    setMostrarForm(false)
    setError('')
  }

  async function guardarUsuario() {
    setError('')
    if (!nombre.trim() || !email.trim()) {
      setError('Nombre y email son obligatorios')
      return
    }
    if (!editando && !password.trim()) {
      setError('La contraseña es obligatoria')
      return
    }
    setGuardando(true)

    if (editando) {
      const updates = {
        nombre: nombre.trim(),
        email: email.trim().toLowerCase(),
        rol
      }
      if (password.trim()) updates.password_hash = password

      const { error: err } = await supabase
        .from('usuarios')
        .update(updates)
        .eq('id', editando.id)

      if (err) { setError('Error al actualizar usuario'); setGuardando(false); return }
    } else {
      const { error: err } = await supabase.from('usuarios').insert({
        nombre: nombre.trim(),
        email: email.trim().toLowerCase(),
        password_hash: password,
        rol,
        activo: true
      })
      if (err) { setError('Error al crear usuario — el email ya existe'); setGuardando(false); return }
    }

    cancelar()
    setGuardando(false)
    cargarUsuarios()
  }

  async function toggleActivo(u) {
    await supabase
      .from('usuarios')
      .update({ activo: !u.activo })
      .eq('id', u.id)
    cargarUsuarios()
  }

  if (cargando) return <div className="p-4 text-gray-500">Cargando...</div>

  return (
    <div className="p-4">
      <button onClick={() => navigate('/')} className="mb-4 text-sm text-blue-600">
        ← Volver
      </button>

      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Usuarios</h2>
        {!mostrarForm && (
          <button
            onClick={() => { cancelar(); setMostrarForm(true) }}
            className="text-sm px-4 py-2 bg-green-600 text-white rounded-xl"
          >
            + Nuevo
          </button>
        )}
      </div>

      {mostrarForm && (
        <div className="bg-white rounded-xl border p-4 mb-4">
          <p className="text-xs text-gray-500 font-medium uppercase mb-3">
            {editando ? `Editando: ${editando.nombre}` : 'Nuevo usuario'}
          </p>
          <input
            type="text"
            value={nombre}
            onChange={e => setNombre(e.target.value)}
            placeholder="Nombre"
            className="w-full border rounded-lg px-3 py-2 text-sm mb-2"
          />
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="Correo electrónico"
            className="w-full border rounded-lg px-3 py-2 text-sm mb-2"
          />
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder={editando ? 'Nueva contraseña (dejar vacío para no cambiar)' : 'Contraseña'}
            className="w-full border rounded-lg px-3 py-2 text-sm mb-2"
          />
          <select
            value={rol}
            onChange={e => setRol(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-sm mb-3"
          >
            <option value="recepcionista">Recepcionista</option>
            <option value="administrador">Administrador</option>
          </select>

          {error && <p className="text-red-500 text-sm mb-2">{error}</p>}

          <div className="flex gap-2">
            <button
              onClick={cancelar}
              className="flex-1 py-2 border rounded-xl text-sm text-gray-600"
            >
              Cancelar
            </button>
            <button
              onClick={guardarUsuario}
              disabled={guardando}
              className="flex-1 py-2 bg-green-600 text-white rounded-xl text-sm font-medium disabled:opacity-50"
            >
              {guardando ? 'Guardando...' : editando ? 'Guardar cambios' : 'Crear usuario'}
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-3">
        {usuarios.map(u => (
          <div key={u.id} className="bg-white rounded-xl border p-4">
            <div className="flex justify-between items-start mb-2">
              <div>
                <p className="font-semibold">{u.nombre}</p>
                <p className="text-xs text-gray-500 mt-1">{u.email}</p>
                <span className={`text-xs px-2 py-0.5 rounded-full mt-1 inline-block ${
                  u.rol === 'administrador' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                }`}>
                  {u.rol}
                </span>
              </div>
              <div className="flex flex-col gap-2 items-end">
                <button
                  onClick={() => abrirEditar(u)}
                  className="text-xs px-3 py-1 bg-blue-100 text-blue-600 rounded-lg font-medium"
                >
                  Editar
                </button>
                <button
                  onClick={() => toggleActivo(u)}
                  className={`text-xs px-3 py-1 rounded-lg font-medium ${
                    u.activo ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'
                  }`}
                >
                  {u.activo ? 'Desactivar' : 'Activar'}
                </button>
              </div>
            </div>
            {!u.activo && (
              <p className="text-xs text-red-400 mt-1">Usuario desactivado</p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export default Usuarios