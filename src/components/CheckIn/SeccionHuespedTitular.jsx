export default function SeccionHuespedTitular({
  tipoDoc, setTipoDoc, dni, setDni, onBuscar,
  cliente, nombres, setNombres, telefono, setTelefono,
  nacionalidad, setNacionalidad
}) {
  return (
    <section>
      <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
        <span className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-gray-600">1</span>
        Huésped Titular
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50 p-6 rounded-2xl border border-gray-100">
        <div>
          <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1.5">Documento</label>
          <div className="flex gap-2">
            <select
              value={tipoDoc}
              onChange={e => { setTipoDoc(e.target.value); setDni('') }}
              className="w-1/3 border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-blue-500 bg-white transition-colors font-medium"
            >
              <option value="dni">DNI</option>
              <option value="pasaporte">Pasaporte</option>
              <option value="otro">Otro</option>
            </select>
            <input
              type="text"
              value={dni}
              onChange={e => {
                const val = e.target.value.replace(/\D/g, '')
                if (tipoDoc === 'dni') { if (val.length <= 8) setDni(val) }
                else setDni(e.target.value)
              }}
              onBlur={onBuscar}
              placeholder={tipoDoc === 'dni' ? '8 dígitos' : 'Número'}
              className="flex-1 border-2 border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-500 bg-white transition-colors"
              maxLength={tipoDoc === 'dni' ? 8 : 20}
            />
            <button
              onClick={onBuscar}
              className="px-4 py-2.5 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-xl text-sm font-bold transition-colors"
            >
              Buscar
            </button>
          </div>
          {tipoDoc === 'dni' && dni.length > 0 && dni.length < 8 && (
            <p className="text-xs text-red-500 font-bold mt-1.5">El DNI debe tener 8 dígitos</p>
          )}

          {cliente && (
            <div className="mt-3 p-3 bg-blue-50 border border-blue-100 rounded-xl space-y-2">
              <p className="text-xs font-bold text-blue-800 flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
                Cliente frecuente
              </p>
              {cliente.tarifa_habitual && (
                <p className="text-xs text-blue-700 font-medium">
                  Tarifa habitual: S/{cliente.tarifa_habitual}
                </p>
              )}
              {cliente.lista_negra && (
                <p className="text-xs text-red-600 font-black mt-2 bg-red-100 px-2 py-1 rounded inline-block">
                  ⚠ EN LISTA NEGRA
                </p>
              )}
              {cliente.deuda_pendiente > 0 && (
                <p className="text-xs text-orange-600 font-bold mt-2 bg-orange-100 px-2 py-1 rounded inline-block">
                  ⚠ Deuda: S/{cliente.deuda_pendiente}
                </p>
              )}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1.5">Nombre Completo</label>
            <input
              type="text" value={nombres} onChange={e => setNombres(e.target.value)}
              placeholder="Ej: Juan Pérez"
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-500 bg-white transition-colors"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1.5">Teléfono</label>
              <input
                type="text" value={telefono} onChange={e => setTelefono(e.target.value)}
                placeholder="Opcional"
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-500 bg-white transition-colors"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1.5">Nacionalidad</label>
              <input
                type="text" value={nacionalidad} onChange={e => setNacionalidad(e.target.value)}
                placeholder="Ej: Peruana"
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-500 bg-white transition-colors"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
