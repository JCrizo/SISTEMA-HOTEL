import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useUsuarios } from '../hooks/useUsuarios'

import FormularioUsuario from '../components/Usuarios/FormularioUsuario'
import ListaUsuarios from '../components/Usuarios/ListaUsuarios'

function Usuarios() {
  const navigate = useNavigate()
  const { usuario } = useAuth()
  
  const {
    usuarios,
    cargando,
    cargarUsuarios,
    guardarUsuario,
    toggleActivo,
    eliminarUsuario
  } = useUsuarios()

  const [mostrarForm, setMostrarForm] = useState(false)
  const [editando, setEditando] = useState(null)
  
  // Estado para modal de confirmación de eliminación
  const [usuarioAEliminar, setUsuarioAEliminar] = useState(null)
  const [eliminando, setEliminando] = useState(false)
  const [errorEliminar, setErrorEliminar] = useState('')
  const [mensajeAlerta, setMensajeAlerta] = useState('')

  useEffect(() => {
    if (usuario?.rol !== 'administrador') {
      navigate('/')
      return
    }
    cargarUsuarios()
  }, [usuario, navigate, cargarUsuarios])

  function abrirEditar(u) {
    setEditando(u)
    setMostrarForm(true)
    setErrorEliminar('')
    setMensajeAlerta('')
  }

  function cerrarFormulario() {
    setEditando(null)
    setMostrarForm(false)
  }

  function solicitarEliminar(u) {
    setErrorEliminar('')
    setMensajeAlerta('')

    // Validar que no se elimine a sí mismo
    const esMismoUsuario = usuario?.id === u.id || (usuario?.email && usuario.email.toLowerCase() === u.email.toLowerCase())
    if (esMismoUsuario) {
      setMensajeAlerta('No puedes eliminar tu propia cuenta mientras tengas la sesión activa.')
      return
    }

    setUsuarioAEliminar(u)
  }

  async function confirmarEliminacion() {
    if (!usuarioAEliminar) return

    setEliminando(true)
    setErrorEliminar('')

    const { exito, error } = await eliminarUsuario(usuarioAEliminar.id)
    if (exito) {
      setUsuarioAEliminar(null)
    } else {
      setErrorEliminar(error || 'Ocurrió un error al intentar eliminar el usuario.')
    }
    setEliminando(false)
  }

  if (cargando) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-500 font-medium">Cargando personal...</span>
      </div>
    )
  }

  return (
    <div className="p-4 max-w-5xl mx-auto">
      {/* Alerta general (por ejemplo si intenta autoeliminarse) */}
      {mensajeAlerta && (
        <div className="mb-4 bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-2xl flex items-center justify-between shadow-sm animate-fade-in">
          <div className="flex items-center gap-3">
            <span className="text-xl">⚠️</span>
            <p className="text-sm font-semibold">{mensajeAlerta}</p>
          </div>
          <button 
            onClick={() => setMensajeAlerta('')} 
            className="text-amber-600 hover:text-amber-900 font-bold text-sm px-2 py-1 rounded-lg hover:bg-amber-100"
          >
            ✕
          </button>
        </div>
      )}

      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/')} 
            className="p-2 rounded-full hover:bg-gray-100 text-gray-600 transition-colors"
            title="Volver"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <div>
            <h2 className="text-2xl font-black text-gray-800">Personal y Usuarios</h2>
            <p className="text-sm text-gray-500 font-medium">Gestiona accesos, roles y personal del hotel</p>
          </div>
        </div>
        
        {!mostrarForm && (
          <button
            onClick={() => { setEditando(null); setMostrarForm(true); }}
            className="px-5 py-2.5 bg-gray-900 hover:bg-black text-white rounded-xl text-sm font-bold shadow-sm transition-transform active:scale-95 flex items-center gap-2"
          >
            <span>+</span> Nuevo Personal
          </button>
        )}
      </div>

      {mostrarForm && (
        <FormularioUsuario 
          editando={editando} 
          onGuardar={guardarUsuario} 
          onCancelar={cerrarFormulario} 
        />
      )}

      <ListaUsuarios 
        usuarios={usuarios}
        usuarioActualId={usuario?.id}
        onEditar={abrirEditar} 
        onToggleActivo={toggleActivo}
        onEliminar={solicitarEliminar}
      />

      {/* Modal de confirmación para eliminar usuario */}
      {usuarioAEliminar && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-100 animate-scale-up">
            <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center text-2xl mb-4 mx-auto">
              🗑️
            </div>
            
            <h3 className="text-xl font-black text-gray-800 text-center mb-2">
              ¿Eliminar usuario?
            </h3>
            
            <p className="text-sm text-gray-600 text-center mb-4">
              Estás a punto de eliminar a <strong className="text-gray-900">{usuarioAEliminar.nombre}</strong> (<em>{usuarioAEliminar.email}</em>).
            </p>

            <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 text-xs text-amber-800 mb-5">
              <p>
                <strong>Nota:</strong> Si este usuario ya tiene historial o turnos registrados en el sistema, no podrá ser eliminado por integridad contable. En ese caso, la opción recomendada es <strong>Desactivarlo</strong>.
              </p>
            </div>

            {errorEliminar && (
              <div className="mb-5 bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl text-xs font-semibold">
                ⚠️ {errorEliminar}
              </div>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setUsuarioAEliminar(null)}
                disabled={eliminando}
                className="flex-1 py-2.5 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-sm transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmarEliminacion}
                disabled={eliminando}
                className="flex-1 py-2.5 px-4 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-sm shadow-md transition-all disabled:opacity-50"
              >
                {eliminando ? 'Eliminando...' : 'Sí, Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Usuarios
