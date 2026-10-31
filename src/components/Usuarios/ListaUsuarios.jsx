export default function ListaUsuarios({ usuarios, usuarioActualId, onEditar, onToggleActivo, onEliminar }) {
  if (usuarios.length === 0) {
    return (
      <div className="card p-12 text-center">
        <p className="text-gray-500 font-medium">No hay usuarios registrados en el sistema.</p>
      </div>
    )
  }

  const getRolBadge = (rol) => {
    switch (rol?.toLowerCase()) {
      case 'administrador':
        return 'badge-purple'
      case 'recepcionista':
        return 'badge-info'
      case 'limpieza':
        return 'badge-ok'
      default:
        return 'badge-muted'
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
      {usuarios.map(u => {
        const esUsuarioActual = usuarioActualId && (usuarioActualId === u.id || usuarioActualId === u.auth_id)

        return (
          <div key={u.id} className={`card p-4 sm:p-5 transition-all flex flex-col justify-between ${
            u.activo ? 'card-hover' : '!border-rose-100 !bg-rose-50/20'
          }`}>
            <div>
              <div className="flex justify-between items-start mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <div className={`w-2.5 h-2.5 rounded-full ${u.activo ? 'bg-emerald-500' : 'bg-rose-400'}`}></div>
                    <h4 className={`font-bold text-lg ${u.activo ? 'text-gray-800' : 'text-gray-500'}`}>
                      {u.nombre}
                    </h4>
                    {esUsuarioActual && (
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full border border-blue-200">
                        Tu cuenta
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-medium text-gray-500 flex items-center gap-1.5">
                    <span className="text-gray-400 font-normal">Usuario/Email:</span>
                    <span className="font-semibold text-gray-700">{u.email}</span>
                  </p>
                </div>
                <span className={`badge uppercase tracking-wide shrink-0 ${getRolBadge(u.rol)}`}>
                  {u.rol}
                </span>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100 mt-2">
                <button
                  onClick={() => onEditar(u)}
                  className="btn btn-secondary btn-sm"
                >
                  Editar
                </button>
                <button
                  onClick={() => onToggleActivo(u)}
                  className={`btn btn-sm ${
                    u.activo 
                      ? 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200/60' 
                      : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200/60'
                  }`}
                >
                  {u.activo ? 'Desactivar' : 'Activar'}
                </button>
                <button
                  onClick={() => onEliminar(u)}
                  className="btn btn-danger-soft btn-sm"
                  title="Eliminar usuario"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Eliminar
                </button>
              </div>
              
              {!u.activo && (
                <p className="text-xs font-medium text-rose-600 mt-3 text-center bg-rose-50 py-1.5 rounded-lg border border-rose-100">
                  Usuario inhabilitado para acceder al sistema
                </p>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
