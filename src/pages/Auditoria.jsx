import { useEffect, useState } from 'react'
import { useAuditoria } from '../hooks/useAuditoria'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import Icono from '../components/Compartido/Icono'

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
    if (accion.includes('ELIMINAR') || accion.includes('ANULAR')) return 'badge-danger'
    if (accion.includes('CREAR') || accion.includes('ABRIR')) return 'badge-ok'
    if (accion.includes('EDITAR') || accion.includes('CAMBIAR')) return 'badge-info'
    if (accion.includes('CERRAR')) return 'badge-warn'
    return 'badge-muted'
  }

  if (usuario?.rol !== 'administrador') return null

  return (
    <div className="space-y-5 pb-12">
      {/* Header */}
      <div>
        <h1 className="page-title">Log de Auditoría</h1>
        <p className="page-sub">Registro inalterable de acciones críticas en el sistema.</p>
      </div>

      {/* Filtros */}
      <div className="card p-4 sm:p-5">
        <div className="flex flex-col md:flex-row gap-3 sm:gap-4">
          <div className="flex-1">
            <label className="label">Módulo</label>
            <select
              value={filtroModulo}
              onChange={(e) => setFiltroModulo(e.target.value)}
              className="input"
            >
              <option value="">Todos los módulos</option>
              <option value="Reservas">Reservas</option>
              <option value="Habitaciones">Habitaciones</option>
              <option value="Turnos">Turnos</option>
              <option value="Consumos">Consumos</option>
              <option value="Inventario">Inventario</option>
              <option value="Limpieza">Limpieza</option>
              <option value="Cochera">Cochera</option>
              <option value="Productos">Productos</option>
              <option value="Clientes">Clientes</option>
            </select>
          </div>
          <div className="flex-1">
            <label className="label">Fecha (día)</label>
            <input
              type="date"
              value={filtroFecha}
              onChange={(e) => setFiltroFecha(e.target.value)}
              className="input"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={() => { setFiltroModulo(''); setFiltroFecha(''); }}
              className="btn btn-secondary w-full md:w-auto"
            >
              Limpiar filtros
            </button>
          </div>
        </div>
      </div>

      {/* Tabla/Lista de Logs */}
      <div className="card overflow-hidden">
        {cargando ? (
          <div className="p-10 flex flex-col justify-center items-center text-gray-400">
            <div className="w-10 h-10 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin mb-4"></div>
            <p className="font-bold">Cargando registros...</p>
          </div>
        ) : error ? (
          <div className="p-8 flex items-center justify-center gap-2 text-rose-600 font-bold bg-rose-50">
            <Icono name="alert" className="w-5 h-5" /> Error al cargar logs: {error}
          </div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <Icono name="box" className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="font-bold text-lg">No hay registros de auditoría</p>
            <p className="text-sm">Prueba ajustando los filtros.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            {/* Vista Desktop */}
            <table className="w-full text-left border-collapse hidden md:table">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-[11px] uppercase tracking-wide text-gray-500">
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
                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-black text-xs">
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
                      <span className={`badge ${getBadgeColor(log.accion)}`}>
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
                       <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-black text-xs">
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
                    <span className={`badge uppercase tracking-wide ${getBadgeColor(log.accion)}`}>
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
