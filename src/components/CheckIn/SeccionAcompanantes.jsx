export default function SeccionAcompanantes({
  acompanantes, agregarAcompanante, eliminarAcompanante,
  actualizarAcompanante, buscarAcompanante
}) {
  return (
    <div className="mt-6">
      <div className="flex justify-between items-center mb-4">
        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
          Acompañantes ({acompanantes.length})
        </h4>
        <button
          onClick={agregarAcompanante}
          className="text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-xl transition-colors flex items-center gap-1"
        >
          + Agregar persona
        </button>
      </div>

      {acompanantes.length > 0 && (
        <div className="space-y-4">
          {acompanantes.map((ac, idx) => (
            <div key={idx} className="bg-white border-2 border-gray-100 p-4 rounded-2xl relative shadow-sm">
              <button
                onClick={() => eliminarAcompanante(idx)}
                className="absolute -top-3 -right-3 w-8 h-8 bg-red-100 text-red-600 rounded-full flex items-center justify-center hover:bg-red-200 transition-colors shadow-sm"
                title="Eliminar acompañante"
              >
                ✕
              </button>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide block mb-1">Documento</label>
                  <div className="flex gap-2">
                    <select
                      value={ac.tipoDoc}
                      onChange={e => {
                        actualizarAcompanante(idx, 'tipoDoc', e.target.value)
                        actualizarAcompanante(idx, 'dni', '')
                      }}
                      className="w-1/3 border-2 border-gray-200 rounded-xl px-2 py-2 text-sm outline-none focus:border-blue-500 bg-white transition-colors font-medium"
                    >
                      <option value="dni">DNI</option>
                      <option value="pasaporte">Pasap</option>
                      <option value="otro">Otro</option>
                    </select>
                    <input
                      type="text"
                      value={ac.dni}
                      onChange={e => {
                        const val = e.target.value.replace(/\D/g, '')
                        if (ac.tipoDoc === 'dni') {
                          if (val.length <= 8) actualizarAcompanante(idx, 'dni', val)
                        } else actualizarAcompanante(idx, 'dni', e.target.value)
                      }}
                      onBlur={() => buscarAcompanante(idx)}
                      placeholder={ac.tipoDoc === 'dni' ? '8 dígitos' : 'Número'}
                      className="flex-1 border-2 border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-blue-500 bg-white transition-colors"
                      maxLength={ac.tipoDoc === 'dni' ? 8 : 20}
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide block mb-1">Nombre Completo</label>
                  <input
                    type="text"
                    value={ac.nombres}
                    onChange={e => actualizarAcompanante(idx, 'nombres', e.target.value)}
                    placeholder="Nombre del acompañante"
                    className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-blue-500 bg-white transition-colors"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
