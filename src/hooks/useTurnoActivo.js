import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

/**
 * Hook para saber si hay un turno de caja activo (sin cierre).
 *
 * Retorna:
 *  - turnoActivo: undefined mientras carga, null si no hay turno abierto,
 *    o el objeto del turno si existe uno activo.
 *  - cargandoTurno: true mientras se hace la consulta inicial.
 *
 * Se usa para bloquear acciones (check-in, consumos, pagos, cochera,
 * reservas) que no deberían registrarse sin un turno abierto, ya que
 * quedarían sin asociar a ninguna caja.
 */
export function useTurnoActivo() {
  const [turnoActivo, setTurnoActivo] = useState(undefined)
  const [cargandoTurno, setCargandoTurno] = useState(true)

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
        setTurnoActivo(data?.[0] || null)
        setCargandoTurno(false)
      }
    }

    verificar()
    return () => { activo = false }
  }, [])

  return { turnoActivo, cargandoTurno }
}
