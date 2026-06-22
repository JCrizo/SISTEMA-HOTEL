import { useEffect, useState } from 'react'
import { useAuditoria } from '../hooks/useAuditoria'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'

export default function Auditoria() {
  const { logs, cargando, error, cargarLogs } = useAuditoria()
  const { usuario } = useAuth()
  const navigate = useNavigate()

  const [filtroModulo, setFiltroModulo] = useState('')
  const [filtroFecha, setFiltroFecha] = useState('')

  useEffect(() => {
    // Protección de ruta para administradores
    if (usuario && usuario.rol !== 'administrador') {
      navigate('/')
    }
  }, [usuario, navigate])

  useEffect(() => {
    if (usuario?.rol === 'administrador') {
      cargarLogs({ modulo: filtroModulo, fecha: filtroFecha })
    }
  }, [cargarLogs, filtroModulo, filtroFecha, usuario])

  const getBadgeColor = (accion) => {
    if (accion.includes('ELIMINAR') || accion.includes('ANULAR')) return 'bg-red-100 text-red-700 border-red-200'
    if (accion.includes('CREAR') || accion.includes('ABRIR')) return 'bg-green-100 text-green-700 border-green-200'
    if (accion.includes('EDITAR') || accion.includes('CAMBIAR')) return 'bg-blue-100 text-blue-700 border-blue-200'
    if (accion.includes('CERRAR')) return 'bg-orange-100 text-orange-700 border-orange-200'
    return 'bg-gray-100 text-gray-700 border-gray-200'
  }

  if (usuario?.rol !== 'administrador') return null

  return (
    <div className="space-y-6 animate-fadeIn pb-24">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-gray-800 tracking-tight flex items-center gap-3">
            <span className="text-3xl">🛡️</span> Log de Auditoría
          </h1>
          <p className="text-sm font-bold text-gray-500 mt-1">
            Registro inalterable de acciones críticas en el sistema.
          </p>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-2">Módulo</label>
            <select
              value={filtroModulo}
              onChange={(e) => setFiltroModulo(e.target.value)}
              className="w-full border-2 border-gray-100 rounded-xl px-4 py-3 text-sm font-bold text-gray-700 outline-none focus:border-indigo-500 transition-colors"
            >
              <option value="">Todos los módulos</option>
              <option value="Reservas">Reservas</option>
              <option value="Habitaciones">Habitaciones</option>
              <option value="Turnos">Turnos</option>
              <option value="Consumos">Consumos</option>
              <option value="Inventario">Inventario</option>
            </select>
          </div>
          <div className="flex-1">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-2">Fecha (Día)</label>
            <input
              type="date"
              value={filtroFecha}
              onChange={(e) => setFiltroFecha(e.target.value)}
              className="w-full border-2 border-gray-100 rounded-xl px-4 py-3 text-sm font-bold text-gray-700 outline-none focus:border-indigo-500 transition-colors"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={() => { setFiltroModulo(''); setFiltroFecha(''); }}
              className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-bold transition-colors h-[48px]"
            >
              Limpiar Filtros
            </button>
          </div>
        </div>
      </div>

      {/* Tabla/Lista de Logs */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        {cargando ? (
          <div className="p-10 flex flex-col justify-center items-center text-gray-400">
            <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
            <p className="font-bold">Cargando registros...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-red-500 font-bold bg-red-50">
            ⚠ Error al cargar logs: {error}
          </div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <span className="text-4xl mb-4 block opacity-50">📋</span>
            <p className="font-bold text-lg">No hay registros de auditoría</p>
            <p className="text-sm">Prueba ajustando los filtros.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            {/* Vista Desktop */}
            <table className="w-full text-left border-collapse hidden md:table">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100 text-xs uppercase tracking-wider text-gray-500">
                  <th className="p-4 font-black">Fecha/Hora</th>
                  <th className="p-4 font-black">Usuario</th>
                  <th className="p-4 font-black">Módulo</th>
                  <th className="p-4 font-black">Acción</th>
                  <th className="p-4 font-black">Detalle</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="p-4 text-sm font-bold text-gray-600 whitespace-nowrap">
                      {new Date(log.fecha).toLocaleString('es-PE', {
                        day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', second: '2-digit'
                      })}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-black text-xs">
                          {log.usuario_nombre.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-800">{log.usuario_nombre}</p>
                          <p className="text-xs text-gray-500">{log.usuario_rol}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-sm font-bold text-gray-600">
                      {log.modulo}
                    </td>
                    <td className="p-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-black border ${getBadgeColor(log.accion)}`}>
                        {log.accion.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-gray-600 max-w-xs">
                      {log.detalles}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Vista Mobile */}
            <div className="md:hidden divide-y divide-gray-100">
              {logs.map((log) => (
                <div key={log.id} className="p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <div className="flex gap-2 items-center">
                       <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-black text-xs">
                        {log.usuario_nombre.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-black text-gray-800">{log.usuario_nombre}</p>
                        <p className="text-[10px] text-gray-500 uppercase tracking-widest">{log.usuario_rol}</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-gray-400 text-right">
                      {new Date(log.fecha).toLocaleString('es-PE', {
                        day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
                      })}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md">
                      {log.modulo}
                    </span>
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-black border uppercase tracking-wider ${getBadgeColor(log.accion)}`}>
                      {log.accion.replace(/_/g, ' ')}
                    </span>
                  </div>

                  <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-xl border border-gray-100">
                    {log.detalles}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
