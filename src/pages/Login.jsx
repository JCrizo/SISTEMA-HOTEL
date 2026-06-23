import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(false)

  async function handleLogin() {
    if (!email || !password) { setError('Completa todos los campos'); return }
    setCargando(true)
    setError('')
    const result = await login(email, password)
    if (result.error) {
      setError(result.error)
      setCargando(false)
    } else {
      navigate('/')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 to-indigo-900 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 pointer-events-none"></div>
      
      <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl p-8 w-full max-w-md relative z-10 border border-white/20">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center text-white text-3xl font-black mx-auto mb-4 shadow-lg transform -rotate-6">
            H
          </div>
          <h1 className="text-3xl font-black text-gray-800 tracking-tight">Sistema Hotel</h1>
          <p className="text-sm text-gray-500 font-medium mt-1">Ingresa tus credenciales para continuar</p>
        </div>

        <form onSubmit={e => { e.preventDefault(); handleLogin(); }} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1.5">Usuario o Correo</label>
            <input
              type="text"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="admin o tu@correo.com"
              className="w-full border-2 border-gray-100 rounded-xl px-4 py-3 text-sm focus:border-blue-500 outline-none transition-colors bg-gray-50 focus:bg-white"
            />
          </div>
          
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1.5">Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full border-2 border-gray-100 rounded-xl px-4 py-3 text-sm focus:border-blue-500 outline-none transition-colors bg-gray-50 focus:bg-white"
            />
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 text-sm p-3 rounded-xl border border-red-100 font-medium text-center animate-pulse">
              ⚠️ {error}
            </div>
          )}

          <button
            type="submit"
            disabled={cargando}
            className="w-full py-3.5 mt-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-bold text-lg shadow-md transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {cargando ? 'Verificando...' : 'Acceder al Sistema'}
          </button>
          
          <div className="pt-4 mt-2 border-t border-gray-100 text-center">
            <button
              type="button"
              onClick={() => navigate('/registro-empleado')}
              className="text-sm font-bold text-gray-500 hover:text-blue-600 transition-colors"
            >
              ¿Soy nuevo empleado? Crear contraseña
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default Login