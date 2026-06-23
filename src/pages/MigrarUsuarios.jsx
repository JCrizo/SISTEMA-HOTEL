import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function MigrarUsuarios() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mensaje, setMensaje] = useState(null)
  const [error, setError] = useState(null)
  const [cargando, setCargando] = useState(false)

  async function handleMigrar(e) {
    e.preventDefault()
    setCargando(true)
    setError(null)
    setMensaje(null)

    // Si no tiene @, le agregamos @mihotel.com
    let emailAUsar = email.trim().toLowerCase()
    if (!emailAUsar.includes('@')) {
      emailAUsar = `${emailAUsar}@mihotel.com`
    }

    const { data, error: errAuth } = await supabase.auth.signUp({
      email: emailAUsar,
      password: password
    })

    if (errAuth) {
      setError(errAuth.message)
    } else {
      setMensaje(`¡Contraseña creada con éxito! Ya puedes iniciar sesión con tu usuario.`)
      setEmail('')
      setPassword('')
    }
    setCargando(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-md border border-gray-100">
        <h2 className="text-2xl font-black text-gray-800 mb-2">Crear mi Contraseña</h2>
        <p className="text-sm text-gray-500 mb-6">
          Bienvenido. Crea tu contraseña de acceso. Ingresa exactamente el <strong>Nombre de Usuario</strong> (ej. admin) que te proporcionó el Administrador.
        </p>

        <form onSubmit={handleMigrar} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1">Usuario o Correo</label>
            <input 
              type="text" 
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="admin o correo@ejemplo.com"
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1">Contraseña</label>
            <input 
              type="text" 
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres"
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-blue-500"
            />
          </div>

          {error && <p className="text-sm font-bold text-red-600 bg-red-50 p-3 rounded-xl">{error}</p>}
          {mensaje && <p className="text-sm font-bold text-green-600 bg-green-50 p-3 rounded-xl">{mensaje}</p>}

          <button 
            type="submit" 
            disabled={cargando}
            className="w-full py-3 bg-gray-800 text-white font-bold rounded-xl hover:bg-gray-900 transition-colors disabled:opacity-50"
          >
            {cargando ? 'Registrando...' : 'Crear mi Contraseña'}
          </button>
        </form>
        
        <div className="mt-6 text-center">
          <a href="/login" className="text-sm font-bold text-blue-600 hover:text-blue-800">
            ← Volver al Login
          </a>
        </div>
      </div>
    </div>
  )
}
