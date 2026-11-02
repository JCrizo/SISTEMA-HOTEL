// En la base de datos el huésped sigue guardándose en UNA sola columna (`nombres`),
// con el orden de RENIEC: "APELLIDOS NOMBRES". Estas funciones convierten entre ese
// texto y los dos campos de la pantalla. Unir→separar→unir nunca altera el texto guardado.

export function unirNombre(apellidos = '', nombres = '') {
  return `${apellidos} ${nombres}`.replace(/\s+/g, ' ').trim()
}

// Separación aproximada para datos antiguos (solo para rellenar los campos; el usuario puede corregir).
export function separarNombre(completo = '') {
  const t = String(completo || '').trim().split(/\s+/).filter(Boolean)
  if (t.length === 0) return { apellidos: '', nombres: '' }
  if (t.length === 1) return { apellidos: t[0], nombres: '' }
  if (t.length === 2) return { apellidos: t[0], nombres: t[1] }
  return { apellidos: t.slice(0, 2).join(' '), nombres: t.slice(2).join(' ') }
}
