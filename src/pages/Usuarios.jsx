import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useUsuarios } from '../hooks/useUsuarios'

import FormularioUsuario from '../components/Usuarios/FormularioUsuario'
import ListaUsuarios from '../components/Usuarios/ListaUsuarios'
import Icono from '../components/Compartido/Icono'

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
      <div className="flex flex-col justify-center items-center h-80 gap-3">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
        <span className="text-sm text-gray-400 font-semibold">Cargando personal...</span>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto space-y-5 pb-12">
      {/* Alerta general (por ejemplo si intenta autoeliminarse) */}
      {mensajeAlerta && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Icono name="alert" className="w-5 h-5 text-amber-600 shrink-0" />
            <p className="text-sm font-semibold">{mensajeAlerta}</p>
          </div>
          <button 
            onClick={() => setMensajeAlerta('')} 
            className="text-amber-600 hover:text-amber-900 p-2 rounded-lg hover:bg-amber-100"
            aria-label="Cerrar aviso"
          >
            <Icono name="x" className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="page-title">Personal y Usuarios</h1>
          <p className="page-sub">Gestiona accesos, roles y personal del hotel</p>
        </div>

        {!mostrarForm && (
          <button
            onClick={() => { setEditando(null); setMostrarForm(true); }}
            className="btn btn-primary"
          >
            <Icono name="plus" className="w-4 h-4" /> Nuevo personal
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
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white rounded-t-3xl sm:rounded-2xl max-w-md w-full p-6 shadow-xl">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mb-4 mx-auto">
              <Icono name="trash" className="w-6 h-6" />
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
              <div className="mb-5 flex items-center gap-2 bg-rose-50 border border-rose-100 text-rose-700 p-3 rounded-xl text-xs font-semibold">
                <Icono name="alert" className="w-4 h-4 shrink-0" /> {errorEliminar}
              </div>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setUsuarioAEliminar(null)}
                disabled={eliminando}
                className="btn btn-secondary flex-1"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmarEliminacion}
                disabled={eliminando}
                className="btn btn-danger flex-1"
              >
                {eliminando ? 'Eliminando...' : 'Sí, eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Usuarios
