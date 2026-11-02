import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Icono from '../components/Compartido/Icono'

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
    <div className="min-h-screen bg-gradient-to-br from-blue-950 to-blue-800 flex items-center justify-center p-4">
      
      <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-8 w-full max-w-md relative z-10 border border-white/20">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-tr from-blue-600 to-blue-700 rounded-2xl flex items-center justify-center text-white text-3xl font-black mx-auto mb-4 shadow-lg transform -rotate-6">
            H
          </div>
          <h1 className="text-3xl font-black text-gray-800 tracking-tight">Sistema Hotel</h1>
          <p className="text-sm text-gray-500 font-medium mt-1">Ingresa tus credenciales para continuar</p>
        </div>

        <form onSubmit={e => { e.preventDefault(); handleLogin(); }} className="space-y-4">
          <div>
            <label className="label">Usuario o Correo</label>
            <input
              type="text"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="admin o tu@correo.com"
              className="input !py-3"
            />
          </div>
          
          <div>
            <label className="label">Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              className="input !py-3"
            />
          </div>

          {error && (
            <div className="bg-rose-50 text-rose-600 text-sm p-3 rounded-xl border border-rose-100 font-medium text-center animate-pulse">
              <Icono name="alert" className="w-4 h-4 inline-block shrink-0" /> {error}
            </div>
          )}

          <button
            type="submit"
            disabled={cargando}
            className="btn btn-primary w-full !min-h-[52px] !text-base mt-2"
          >
            {cargando ? 'Verificando...' : 'Acceder al Sistema'}
          </button>
          
          <div className="pt-4 mt-2 border-t border-gray-100 text-center">
            <button
              type="button"
              onClick={() => navigate('/registro-empleado')}
              className="btn btn-ghost !text-sm"
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