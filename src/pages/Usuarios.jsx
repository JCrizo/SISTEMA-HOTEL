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
    toggleActivo
  } = useUsuarios()

  const [mostrarForm, setMostrarForm] = useState(false)
  const [editando, setEditando] = useState(null)

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
  }

  function cerrarFormulario() {
    setEditando(null)
    setMostrarForm(false)
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
            <p className="text-sm text-gray-500 font-medium">Gestiona accesos y roles del sistema</p>
          </div>
        </div>
        
        {!mostrarForm && (
          <button
            onClick={() => { setEditando(null); setMostrarForm(true); }}
            className="px-5 py-2.5 bg-gray-900 hover:bg-black text-white rounded-xl text-sm font-bold shadow-sm transition-transform active:scale-95"
          >
            + Nuevo Personal
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
        onEditar={abrirEditar} 
        onToggleActivo={toggleActivo} 
      />
    </div>
  )
}

export default Usuarios