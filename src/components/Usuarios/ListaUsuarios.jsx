export default function ListaUsuarios({ usuarios, onEditar, onToggleActivo }) {
  if (usuarios.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
        <p className="text-gray-500">No hay usuarios registrados en el sistema.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {usuarios.map(u => (
        <div key={u.id} className={`bg-white rounded-2xl border shadow-sm p-5 transition-all ${
          u.activo ? 'border-gray-100 hover:shadow-md' : 'border-red-100 bg-red-50/30'
        }`}>
          <div className="flex justify-between items-start mb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className={`w-2.5 h-2.5 rounded-full ${u.activo ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' : 'bg-red-400'}`}></div>
                <h4 className={`font-bold text-lg ${u.activo ? 'text-gray-800' : 'text-gray-500'}`}>
                  {u.nombre}
                </h4>
              </div>
              <p className="text-sm text-gray-500">{u.email}</p>
            </div>
            <span className={`text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide ${
              u.rol === 'administrador' 
                ? 'bg-purple-100 text-purple-700' 
                : 'bg-blue-100 text-blue-700'
            }`}>
              {u.rol}
            </span>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-gray-50">
            <button
              onClick={() => onEditar(u)}
              className="text-xs font-bold px-4 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-lg transition-colors"
            >
              Editar
            </button>
            <button
              onClick={() => onToggleActivo(u)}
              className={`text-xs font-bold px-4 py-2 rounded-lg transition-colors ${
                u.activo 
                  ? 'bg-red-50 text-red-600 hover:bg-red-100' 
                  : 'bg-green-50 text-green-700 hover:bg-green-100'
              }`}
            >
              {u.activo ? 'Desactivar' : 'Activar'}
            </button>
          </div>
          
          {!u.activo && (
            <p className="text-xs font-medium text-red-500 mt-3 text-center bg-red-50 py-1.5 rounded-lg">
              Usuario inhabilitado para acceder al sistema
            </p>
          )}
        </div>
      ))}
    </div>
  )
}
