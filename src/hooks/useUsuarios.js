import { useState, useCallback } from 'react'
import { usuariosService } from '../services/usuariosService'

export function useUsuarios() {
  const [usuarios, setUsuarios] = useState([])
  const [cargando, setCargando] = useState(true)

  const cargarUsuarios = useCallback(async () => {
    setCargando(true)
    try {
      const data = await usuariosService.obtenerUsuarios()
      setUsuarios(data)
    } catch (error) {
      console.error(error)
    } finally {
      setCargando(false)
    }
  }, [])

  const guardarUsuario = async (datos, editando) => {
    try {
      if (editando) {
        const updates = {
          nombre: datos.nombre.trim(),
          email: datos.email.trim().toLowerCase(),
          rol: datos.rol
        }
        if (datos.password?.trim()) updates.password_hash = datos.password

        await usuariosService.actualizarUsuario(editando.id, updates)
      } else {
        await usuariosService.crearUsuario(datos)
      }
      await cargarUsuarios()
      return { exito: true }
    } catch (error) {
      console.error(error)
      return { exito: false, error: error.message }
    }
  }

  const toggleActivo = async (u) => {
    try {
      await usuariosService.cambiarEstadoActivo(u.id, u.activo)
      await cargarUsuarios()
    } catch (error) {
      console.error(error)
    }
  }

  return {
    usuarios,
    cargando,
    cargarUsuarios,
    guardarUsuario,
    toggleActivo
  }
}
