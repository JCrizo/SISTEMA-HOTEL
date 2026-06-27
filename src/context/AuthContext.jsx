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
      // FIX R2: buscar usuario directamente por email, sin descargar toda la tabla
      const usernameBase = authUser.email.replace('@mihotel.com', '')

      const { data: byEmail } = await supabase
        .from('usuarios')
        .select('*')
        .or(`email.eq.${authUser.email},email.eq.${usernameBase}`)
        .limit(1)

      let match = byEmail?.[0] || null
      
      if (match) {
        // Fusionamos AuthUser + CustomUser
        // Normalizamos el rol a minúsculas para que las comparaciones
        // (usuario?.rol === 'recepcionista') funcionen sin importar
        // cómo esté guardado en la BD ('Recepcionista', 'RECEPCIONISTA', etc.)
        setUsuario({
          ...match,
          rol: (match.rol || '').toLowerCase().trim(),
          auth_id: authUser.id
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

