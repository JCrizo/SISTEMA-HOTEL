import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

/**
 * Hook para saber si hay un turno de caja activo (sin cierre).
 *
 * Retorna:
 *  - turnoActivo: undefined mientras carga, null si no hay turno abierto,
 *    o el objeto del turno si existe uno activo.
 *  - cargandoTurno: true mientras se hace la consulta inicial.
 *  - turnoAjeno: true si el turno abierto pertenece a otro usuario.
 *
 * Se usa para bloquear acciones (check-in, consumos, pagos, cochera,
 * reservas) que no deberían registrarse sin un turno abierto, ya que
 * quedarían sin asociar a ninguna caja.
 */
export function useTurnoActivo() {
  const { usuario } = useAuth()
  const [turnoActivo, setTurnoActivo] = useState(undefined)
  const [cargandoTurno, setCargandoTurno] = useState(true)
  const [turnoAjeno, setTurnoAjeno] = useState(false)

  useEffect(() => {
    let activo = true

    async function verificar() {
      const { data } = await supabase
        .from('turnos')
        .select('*')
        .is('cierre', null)
        .order('apertura', { ascending: false })
        .limit(1)

      if (activo) {
        const turno = data?.[0] || null
        setTurnoActivo(turno)
        const userRole = (usuario?.rol || '').toLowerCase().trim()
        if (turno && usuario && turno.usuario_id !== usuario.id && !['administrador', 'limpieza'].includes(userRole)) {
          setTurnoAjeno(true)
        } else {
          setTurnoAjeno(false)
        }
        setCargandoTurno(false)
      }
    }

    // Only run when we have loaded the auth context properly
    if (usuario !== undefined) {
      verificar()
    }

    return () => { activo = false }
  }, [usuario])

  return { turnoActivo, cargandoTurno, turnoAjeno }
}
