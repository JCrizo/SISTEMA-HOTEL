import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null)
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    const guardado = localStorage.getItem('hotel_usuario')
    if (guardado) setUsuario(JSON.parse(guardado))
    setCargando(false)
  }, [])

  /*async function login(email, password) {
    const { data, error } = await supabase
      .from('usuarios')
      .select('*')
      .eq('email', email.trim().toLowerCase())
      .eq('activo', true)
      .single()

    if (error || !data) return { error: 'Usuario no encontrado' }
    if (data.password_hash !== password) return { error: 'Contraseña incorrecta' }

    localStorage.setItem('hotel_usuario', JSON.stringify(data))
    setUsuario(data)
    return { ok: true }
  }*/
 async function login(email, password) {
  const { data, error } = await supabase
      .from('usuarios')
      .select('*')
      .eq('email', email.trim().toLowerCase())
      .eq('activo', true)
      .single()

    console.log('DATA:', data)
    console.log('ERROR:', error)

    if (error || !data) return { error: 'Usuario no encontrado' }

    console.log('Password BD:', data.password_hash)
    console.log('Password ingresado:', password)

    if (data.password_hash !== password) {
      return { error: 'Contraseña incorrecta' }
    }

    localStorage.setItem('hotel_usuario', JSON.stringify(data))
    setUsuario(data)
    return { ok: true }
  }
  function logout() {
    localStorage.removeItem('hotel_usuario')
    setUsuario(null)
  }

  return (
    <AuthContext.Provider value={{ usuario, login, logout, cargando }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
