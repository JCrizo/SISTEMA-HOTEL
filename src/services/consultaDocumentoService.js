import { supabase } from '../lib/supabase'
import { separarNombre } from '../utils/nombres'

export const consultaDocumentoService = {
  // Devuelve { dni, apellidos, nombres } o null si no hay datos / el servicio no está disponible.
  async consultarDni(dni) {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const r = await fetch('/api/consultar-dni', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token || ''}`,
        },
        body: JSON.stringify({ dni }),
      })
      if (!r.ok) {
        const cuerpo = await r.json().catch(() => null)
        console.warn('Consulta de DNI no disponible:', r.status, cuerpo?.error || '(sin detalle)')
        return null
      }
      const d = await r.json()
      let { apellidos = '', nombres = '' } = d
      if (!apellidos && !nombres && d.completo) ({ apellidos, nombres } = separarNombre(d.completo))
      return { dni: d.dni, apellidos, nombres }
    } catch {
      return null
    }
  },
}
