// Función de servidor (Vercel). El token del proveedor vive SOLO aquí, en la variable
// de entorno CONSULTASPERU_TOKEN; el navegador nunca lo ve.
const URL_PROVEEDOR = 'https://api.consultasperu.com/api/v1/query'

async function sesionValida(authHeader) {
  const url = process.env.VITE_SUPABASE_URL
  const anon = process.env.VITE_SUPABASE_ANON_KEY
  if (!url || !anon || !authHeader?.startsWith('Bearer ')) return false
  const r = await fetch(`${url}/auth/v1/user`, {
    headers: { apikey: anon, Authorization: authHeader },
  })
  return r.ok
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' })

  // Solo usuarios con sesión iniciada en el sistema pueden gastar la cuota del proveedor.
  if (!(await sesionValida(req.headers.authorization))) {
    return res.status(401).json({ error: 'Sesión no válida' })
  }

  const token = process.env.CONSULTASPERU_TOKEN
  if (!token) return res.status(500).json({ error: 'Falta configurar CONSULTASPERU_TOKEN' })

  const dni = String(req.body?.dni ?? '').trim()
  if (!/^\d{8}$/.test(dni)) return res.status(400).json({ error: 'El DNI debe tener 8 dígitos' })

  try {
    const r = await fetch(URL_PROVEEDOR, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, type_document: 'dni', document_number: dni }),
    })
    const json = await r.json().catch(() => null)
    if (r.status === 404 || json?.message === 'No data found') {
      return res.status(404).json({ error: 'No se encontraron datos para ese DNI' })
    }
    if (!r.ok || !json?.success) {
      return res.status(502).json({ error: 'El proveedor no pudo atender la consulta' })
    }
    const d = json.data || {}
    // Solo devolvemos lo necesario (no la dirección ni la fecha de nacimiento).
    return res.status(200).json({ dni: d.number || dni, nombres: d.full_name || '' })
  } catch {
    return res.status(502).json({ error: 'No se pudo contactar al proveedor' })
  }
}
