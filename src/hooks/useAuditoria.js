import { useState, useCallback } from 'react'
import { auditoriaService } from '../services/auditoriaService'

export function useAuditoria() {
  const [logs, setLogs] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)

  const cargarLogs = useCallback(async (filtros = {}) => {
    setCargando(true)
    setError(null)
    try {
      const data = await auditoriaService.obtenerLogs(filtros)
      setLogs(data || [])
    } catch (err) {
      console.error('Error al cargar logs de auditoría:', err)
      setError(err.message)
    } finally {
      setCargando(false)
    }
  }, [])

  return {
    logs,
    cargando,
    error,
    cargarLogs
  }
}
