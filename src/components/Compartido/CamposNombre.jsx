// Dos campos: Apellidos y Nombres. onChange(campo, valor) con campo = 'apellidos' | 'nombres'.
export default function CamposNombre({ apellidos, nombres, onChange, compacto = false }) {
  const lbl = compacto
    ? 'text-[10px] font-bold text-gray-400 uppercase tracking-wide block mb-1'
    : 'label'
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <div>
        <label className={lbl}>Apellidos</label>
        <input
          type="text"
          value={apellidos}
          onChange={e => onChange('apellidos', e.target.value)}
          placeholder="Ej: Pérez Quispe"
          className="input"
        />
      </div>
      <div>
        <label className={lbl}>Nombres</label>
        <input
          type="text"
          value={nombres}
          onChange={e => onChange('nombres', e.target.value)}
          placeholder="Ej: Juan Carlos"
          className="input"
        />
      </div>
    </div>
  )
}
