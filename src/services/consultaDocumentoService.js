import { supabase } from '../lib/supabase'

export const consultaDocumentoService = {
  // Devuelve { dni, nombres } o null si no hay datos / el servicio no está disponible.
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
      return await r.json()
    } catch {
      return null
    }
  },
}
