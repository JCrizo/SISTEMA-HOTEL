export default function SeccionEstadia({
  noches, actualizarNoches, fechaSalida, actualizarFechaSalida,
  tarifaPorNoche, setTarifaPorNoche, tarifa, montoEarly, setMontoEarly,
  fechaIngreso, setFechaIngreso
}) {
  return (
    <section>
      <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
        <span className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-gray-600">2</span>
        Datos de Estadía
      </h3>

      {/* Fecha y hora de ingreso real — obligatoria */}
      <div className="bg-green-50 border-2 border-green-200 rounded-2xl p-5 mb-4">
        <label className="text-xs font-bold text-green-800 uppercase tracking-wide block mb-2">
          🕐 Fecha y Hora de Ingreso Real <span className="text-red-500">*</span>
        </label>
        <input
          type="datetime-local"
          value={fechaIngreso}
          onChange={e => setFechaIngreso(e.target.value)}
          required
          className="w-full border-2 border-green-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-green-500 bg-white transition-colors text-gray-800"
        />
        <p className="text-xs text-green-700 font-medium mt-1.5">
          Pre-llenada con la hora actual. Corrígela si el huésped ingresó antes.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5">
          <label className="text-xs font-bold text-blue-800 uppercase tracking-wide block mb-2">Noches a hospedarse</label>
          <input
            type="number"
            inputMode="numeric"
            min="1"
            value={noches}
            onChange={e => actualizarNoches(e.target.value)}
            onFocus={e => e.target.select()}
            onWheel={e => e.target.blur()}
            className="w-full border-2 border-white rounded-xl px-4 py-3 text-lg font-black text-blue-900 bg-white outline-none focus:border-blue-500 shadow-sm text-center"
          />
        </div>

        <div className="bg-gray-50 border border-gray-100 rounded-2xl p-5 md:col-span-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
          <div className="flex-1">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-2">Fecha de salida</label>
            <input
              type="date"
              value={fechaSalida}
              onChange={e => actualizarFechaSalida(e.target.value)}
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-500 bg-white transition-colors font-bold text-gray-700"
            />
          </div>
          <div className="hidden sm:block w-px h-12 bg-gray-200"></div>
          <div className="flex-1">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-2">Tarifa por Noche (S/)</label>
            <input
              type="number"
              inputMode="decimal"
              value={tarifaPorNoche}
              onChange={e => setTarifaPorNoche(e.target.value)}
              onFocus={e => e.target.select()}
              onWheel={e => e.target.blur()}
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-500 bg-white transition-colors font-bold text-gray-700"
            />
          </div>
        </div>
      </div>

      {/* Early check-in */}
      <div className="mt-4 bg-amber-50 border border-amber-100 rounded-2xl p-4">
        <label className="text-xs font-bold text-amber-800 uppercase tracking-wide block mb-2">
          Early Check-In (cargo adicional opcional)
        </label>
        <input
          type="number"
          inputMode="decimal"
          value={montoEarly}
          onChange={e => setMontoEarly(e.target.value)}
          onFocus={e => e.target.select()}
          onWheel={e => e.target.blur()}
          placeholder="S/0.00 si no aplica"
          className="w-full md:w-1/3 border-2 border-amber-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-amber-500 bg-white transition-colors"
        />
        {parseFloat(montoEarly || 0) > 0 && (
          <p className="text-xs text-amber-700 font-bold mt-1">
            Se cobrará S/{montoEarly} adicional por ingreso anticipado.
          </p>
        )}
      </div>

      {noches > 1 && tarifaPorNoche && (
        <p className="mt-3 text-sm text-blue-700 font-bold bg-blue-50 px-4 py-2 rounded-xl inline-block">
          S/{tarifaPorNoche} × {noches} noches = S/{parseFloat(tarifa || 0).toFixed(2)} total
        </p>
      )}
    </section>
  )
}
