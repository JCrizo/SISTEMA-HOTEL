import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function MigrarUsuarios() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [mostrarPassword, setMostrarPassword] = useState(false)
  
  const [mensajeExito, setMensajeExito] = useState(null)
  const [error, setError] = useState(null)
  const [cargando, setCargando] = useState(false)

  async function handleCrearPassword(e) {
    e.preventDefault()
    setError(null)
    setMensajeExito(null)

    const usuarioIngresado = email.trim().toLowerCase()
    if (!usuarioIngresado) {
      setError('Por favor, ingresa tu usuario o correo.')
      return
    }

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.')
      return
    }

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden. Verifícalas e intenta nuevamente.')
      return
    }

    setCargando(true)

    try {
      // 1. Normalizar el formato de correo para Supabase Auth
      let emailAUsar = usuarioIngresado
      if (!emailAUsar.includes('@')) {
        emailAUsar = `${emailAUsar}@mihotel.com`
      }
      const usernameBase = emailAUsar.replace('@mihotel.com', '')

      // 2. Verificar que el usuario exista y esté activo en la tabla 'usuarios'
      const { data: usuariosEncontrados, error: errConsulta } = await supabase
        .from('usuarios')
        .select('id, nombre, email, activo')
        .or(`email.eq.${emailAUsar},email.eq.${usernameBase}`)
        .limit(1)

      if (errConsulta) {
        throw new Error('Error al verificar tu usuario: ' + errConsulta.message)
      }

      const usuarioDb = usuariosEncontrados?.[0]

      if (!usuarioDb) {
        setError(`El usuario o correo "${usuarioIngresado}" no ha sido registrado. Solicita al Administrador que te dé de alta primero en el sistema.`)
        setCargando(false)
        return
      }

      if (!usuarioDb.activo) {
        setError('Tu usuario se encuentra inhabilitado en el sistema. Por favor, consulta con el Administrador.')
        setCargando(false)
        return
      }

      // 3. Crear o actualizar la cuenta en Supabase Auth
      const { data: authData, error: errAuth } = await supabase.auth.signUp({
        email: emailAUsar,
        password: password
      })

      if (errAuth) {
        if (errAuth.code === 'user_already_exists' || errAuth.message?.includes('already registered')) {
          setError('Este usuario ya tiene una contraseña creada anteriormente. Ya puedes iniciar sesión directamente.')
        } else {
          setError(errAuth.message || 'Error al crear la contraseña en el sistema.')
        }
        setCargando(false)
        return
      }

      // 4. Actualizar password_hash en la tabla 'usuarios' como respaldo
      await supabase
        .from('usuarios')
        .update({ password_hash: password })
        .eq('id', usuarioDb.id)

      // 5. Cerrar sesión por si signUp dejó una sesión temporal
      await supabase.auth.signOut()

      setMensajeExito({
        nombre: usuarioDb.nombre,
        email: usuarioIngresado
      })
    } catch (err) {
      console.error('Error al registrar contraseña:', err)
      setError(err.message || 'Ocurrió un error inesperado. Intenta de nuevo.')
    } finally {
      setCargando(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 to-indigo-900 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 pointer-events-none"></div>

      <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl p-8 w-full max-w-md relative z-10 border border-white/20">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center text-white text-3xl font-black mx-auto mb-4 shadow-lg transform -rotate-6">
            🔑
          </div>
          <h1 className="text-2xl font-black text-gray-800 tracking-tight">
            Crear mi Contraseña
          </h1>
          <p className="text-sm text-gray-500 font-medium mt-1">
            Activa tu cuenta de empleado con tu usuario asignado
          </p>
        </div>

        {mensajeExito ? (
          <div className="space-y-5 text-center animate-fade-in py-2">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-3xl mx-auto shadow-inner">
              ✓
            </div>
            
            <div>
              <h3 className="text-lg font-black text-gray-800">
                ¡Contraseña lista, {mensajeExito.nombre}!
              </h3>
              <p className="text-sm text-gray-600 mt-2">
                Tu clave ha sido configurada con éxito. Ya puedes ingresar al sistema utilizando tu usuario <strong className="text-blue-600 font-bold">{mensajeExito.email}</strong>.
              </p>
            </div>

            <button
              type="button"
              onClick={() => navigate('/login')}
              className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-bold text-base shadow-md transition-all active:scale-[0.98]"
            >
              Ir a Iniciar Sesión
            </button>
          </div>
        ) : (
          <form onSubmit={handleCrearPassword} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1.5">
                Usuario o Correo Asignado
              </label>
              <input 
                type="text" 
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="Ej: admin17, chris o correo@ejemplo.com"
                className="w-full border-2 border-gray-100 rounded-xl px-4 py-3 text-sm focus:border-blue-500 outline-none transition-colors bg-gray-50 focus:bg-white"
              />
              <span className="text-[11px] text-gray-400 mt-1 block">
                Ingresa exactamente el usuario que te dio el Administrador.
              </span>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                  Nueva Contraseña
                </label>
                <button
                  type="button"
                  onClick={() => setMostrarPassword(!mostrarPassword)}
                  className="text-xs text-blue-600 hover:text-blue-800 font-semibold"
                >
                  {mostrarPassword ? 'Ocultar' : 'Mostrar'}
                </button>
              </div>
              <input 
                type={mostrarPassword ? 'text' : 'password'} 
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                className="w-full border-2 border-gray-100 rounded-xl px-4 py-3 text-sm focus:border-blue-500 outline-none transition-colors bg-gray-50 focus:bg-white"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1.5">
                Confirmar Contraseña
              </label>
              <input 
                type={mostrarPassword ? 'text' : 'password'} 
                required
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Repite la contraseña"
                className="w-full border-2 border-gray-100 rounded-xl px-4 py-3 text-sm focus:border-blue-500 outline-none transition-colors bg-gray-50 focus:bg-white"
              />
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 text-sm p-3.5 rounded-xl border border-red-100 font-medium">
                ⚠️ {error}
              </div>
            )}

            <button 
              type="submit" 
              disabled={cargando}
              className="w-full py-3.5 mt-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-bold text-base shadow-md transition-all active:scale-[0.98] disabled:opacity-50"
            >
              {cargando ? 'Verificando y Creando...' : 'Crear mi Contraseña'}
            </button>
            
            <div className="pt-4 border-t border-gray-100 text-center">
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="text-sm font-bold text-gray-500 hover:text-blue-600 transition-colors"
              >
                ← Volver al Inicio de Sesión
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
