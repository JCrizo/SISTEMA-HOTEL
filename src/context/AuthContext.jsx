import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null)
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    // 1. Obtener sesión actual al cargar
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        cargarPerfilUsuario(session.user)
      } else {
        setCargando(false)
      }
    })

    // 2. Escuchar cambios en la sesión (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        cargarPerfilUsuario(session.user)
      } else {
        setUsuario(null)
        setCargando(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  // Carga los datos extra (rol, nombre) desde la tabla 'usuarios'
  async function cargarPerfilUsuario(authUser) {
    if (!authUser || !authUser.email) {
      setCargando(false)
      return
    }

    try {
      // Intentamos buscar por el email completo (@mihotel.com) o por el nombre de usuario (sin el @mihotel.com)
      const usernameBase = authUser.email.replace('@mihotel.com', '')
      
      const { data: allUsers, error } = await supabase
        .from('usuarios')
        .select('*')

      let match = null
      if (!error && allUsers) {
        match = allUsers.find(u => {
          const uEmail = (u.email || '').toLowerCase().trim()
          return uEmail === authUser.email || uEmail === usernameBase
        })
      }
      
      if (match) {
        // Fusionamos AuthUser + CustomUser
        setUsuario({
          ...match, // Trae id, nombre, email, rol de la BD
          auth_id: authUser.id // Guardamos el ID de Supabase Auth
        })
      } else {
        // Si no está en la tabla usuarios, solo seteamos el de auth (o lo deslogueamos)
        setUsuario({ email: authUser.email, auth_id: authUser.id })
      }
    } catch (err) {
      console.error('Error al cargar perfil:', err)
    } finally {
      setCargando(false)
    }
  }

  async function login(username, password) {
    // No usamos setCargando(true) aquí porque desmontaría el componente Login en App.jsx
    
    // Si no tiene @, asumimos que es un nombre de usuario y le agregamos el dominio falso
    let email = username.trim().toLowerCase()
    if (!email.includes('@')) {
      email = `${email}@mihotel.com`
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) {
      let msg = error.message
      if (msg === 'Invalid login credentials') msg = 'Usuario o contraseña incorrectos'
      return { error: msg }
    }

    return { ok: true }
  }

  async function logout() {
    await supabase.auth.signOut()
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
