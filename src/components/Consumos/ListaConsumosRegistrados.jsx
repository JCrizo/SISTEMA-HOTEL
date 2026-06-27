export default function ListaConsumosRegistrados({ consumos, eliminarConsumo }) {
  const totalConsumos = consumos.reduce((s, c) => s + parseFloat(c.precio_unitario) * c.cantidad, 0)

  if (consumos.length === 0) {
    return (
      <div className="bg-orange-50 border border-orange-100 rounded-2xl p-8 text-center h-full flex flex-col justify-center">
        <p className="text-orange-600 font-medium">No se han registrado consumos en esta habitación aún.</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col h-full">
      <div className="p-4 md:p-6 border-b border-gray-100">
        <h3 className="text-lg font-bold text-gray-800">Cuenta de la Habitación</h3>
        <p className="text-sm text-gray-500">Consumos cargados a la cuenta</p>
      </div>

      <div className="flex-1 overflow-y-auto p-3 md:p-6 space-y-2">
        {consumos.map(c => (
          <div
            key={c.id}
            className="flex items-center gap-3 py-3 px-3 border-b border-gray-50 last:border-0 bg-gray-50/50 rounded-xl"
          >
            {/* Cantidad badge */}
            <div className="w-9 h-9 flex-shrink-0 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center font-bold text-xs">
              {c.cantidad}x
            </div>

            {/* Nombre + precio unitario */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-gray-800 truncate">{c.productos?.nombre}</p>
              <p className="text-xs text-gray-400">S/{parseFloat(c.precio_unitario).toFixed(2)} c/u</p>
            </div>

            {/* Total + botón eliminar — siempre visibles */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="text-sm font-black text-gray-800">
                S/{(c.precio_unitario * c.cantidad).toFixed(2)}
              </span>
              <button
                onClick={() => eliminarConsumo(c)}
                className="w-9 h-9 flex items-center justify-center text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 rounded-full transition-colors active:scale-95"
                title="Eliminar consumo"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 md:p-6 bg-gray-50 rounded-b-2xl border-t border-gray-100">
        <div className="flex justify-between items-center">
          <span className="text-sm font-bold text-gray-500 uppercase tracking-widest">Total Consumos</span>
          <span className="text-2xl md:text-3xl font-black text-blue-900">S/{totalConsumos.toFixed(2)}</span>
        </div>
      </div>
    </div>
  )
}
