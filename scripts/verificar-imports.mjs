// Falla el build si un import relativo apunta a un archivo o export inexistente
// (evita errores como React #306 por un 'export default' perdido).
import fs from 'node:fs'
import path from 'node:path'

const walk = d => fs.readdirSync(d, { withFileTypes: true }).flatMap(e =>
  e.isDirectory() ? walk(path.join(d, e.name)) : /\.(jsx?|mjs)$/.test(e.name) ? [path.join(d, e.name)] : [])
const resolver = (base, imp) => {
  const p = path.normalize(path.join(path.dirname(base), imp))
  for (const e of ['', '.js', '.jsx', '/index.js', '/index.jsx']) {
    if (fs.existsSync(p + e) && fs.statSync(p + e).isFile()) return p + e
  }
}
const errores = []
for (const f of walk('src')) {
  const s = fs.readFileSync(f, 'utf8')
  const re = /import\s+(?:(\w+)\s*,?\s*)?(?:\{([^}]*)\})?\s*from\s*['"](\.[^'"]+)['"]/g
  let m
  while ((m = re.exec(s))) {
    const [, def, named, imp] = m
    const t = resolver(f, imp)
    if (!t) { errores.push(`${f}: no existe ${imp}`); continue }
    if (!/\.jsx?$/.test(t)) continue
    const ts = fs.readFileSync(t, 'utf8')
    if (def && !/export\s+default/.test(ts)) errores.push(`${f}: ${t} no tiene export default`)
    for (let n of (named || '').split(',')) {
      n = n.trim().split(/\s+as\s+/)[0].trim()
      if (n && !new RegExp(`export\\s+(const|function|let|class|async function)\\s+${n}\\b|export\\s*\\{[^}]*\\b${n}\\b`).test(ts))
        errores.push(`${f}: ${t} no exporta "${n}"`)
    }
  }
  const lazyRe = /import\(\s*['"](\.[^'"]+)['"]\s*\)/g
  while ((m = lazyRe.exec(s))) {
    const t = resolver(f, m[1])
    if (!t) errores.push(`${f}: no existe ${m[1]}`)
    else if (!/export\s+default/.test(fs.readFileSync(t, 'utf8')) && /lazy\(/.test(s.slice(Math.max(0, m.index - 40), m.index)))
      errores.push(`${f}: la página ${t} no tiene export default`)
  }
}
if (errores.length) { console.error('\n✖ Verificación de imports falló:\n' + errores.map(e => ' - ' + e).join('\n')); process.exit(1) }
console.log('✔ Imports verificados')
