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
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border p-6 w-full max-w-sm">
        <h1 className="text-2xl font-bold mb-1">Sistema Hotel</h1>
        <p className="text-sm text-gray-500 mb-6">Inicia sesión para continuar</p>

        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="Correo electrónico"
          className="w-full border rounded-lg px-3 py-2 text-sm mb-3"
        />
        <input
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="Contraseña"
          className="w-full border rounded-lg px-3 py-2 text-sm mb-3"
          onKeyDown={e => e.key === 'Enter' && handleLogin()}
        />

        {error && <p className="text-red-500 text-sm mb-3">{error}</p>}

        <button
          onClick={handleLogin}
          disabled={cargando}
          className="w-full py-3 bg-green-600 text-white rounded-xl font-semibold disabled:opacity-50"
        >
          {cargando ? 'Entrando...' : 'Ingresar'}
        </button>
      </div>
    </div>
  )
}

export default Login