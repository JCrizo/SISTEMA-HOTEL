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
      <div className="p-6 border-b border-gray-100">
        <h3 className="text-lg font-bold text-gray-800">Cuenta de la Habitación</h3>
        <p className="text-sm text-gray-500">Consumos cargados a la cuenta</p>
      </div>
      
      <div className="flex-1 overflow-y-auto p-6 space-y-3">
        {consumos.map(c => (
          <div key={c.id} className="flex justify-between items-center py-3 border-b border-gray-50 last:border-0 hover:bg-gray-50 px-2 rounded-xl transition-colors group">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center font-bold text-xs">
                {c.cantidad}x
              </div>
              <div>
                <p className="text-sm font-bold text-gray-800">{c.productos?.nombre}</p>
                <p className="text-xs text-gray-500 mt-0.5">S/{parseFloat(c.precio_unitario).toFixed(2)} c/u</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <span className="text-sm font-black text-gray-800">
                S/{(c.precio_unitario * c.cantidad).toFixed(2)}
              </span>
              <button
                onClick={() => eliminarConsumo(c)}
                className="w-8 h-8 flex items-center justify-center text-red-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors opacity-0 group-hover:opacity-100"
                title="Eliminar consumo"
              >
                ✕
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="p-6 bg-gray-50 rounded-b-2xl border-t border-gray-100">
        <div className="flex justify-between items-center">
          <span className="text-sm font-bold text-gray-500 uppercase tracking-widest">Total Consumos</span>
          <span className="text-3xl font-black text-blue-900">S/{totalConsumos.toFixed(2)}</span>
        </div>
      </div>
    </div>
  )
}
