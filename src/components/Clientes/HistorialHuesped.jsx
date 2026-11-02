import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

// Ventana de solo lectura con las estadías anteriores de un huésped.
export default function HistorialHuesped({ cliente, onCerrar }) {
  const [filas, setFilas] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let activo = true
    ;(async () => {
      const { data, error: err } = await supabase
        .from('huesped_hospedaje')
        .select('es_titular, hospedajes(id, ingreso, salida_estimada, tarifa_pactada, estado, habitaciones(numero))')
        .eq('cliente_id', cliente.id)
      if (!activo) return
      if (err) setError('No se pudo cargar el historial.')
      else {
        const lista = (data || [])
          .map(d => ({ ...d.hospedajes, es_titular: d.es_titular }))
          .filter(h => h && h.id)
          .sort((a, b) => new Date(b.ingreso) - new Date(a.ingreso))
        setFilas(lista)
      }
      setCargando(false)
    })()
    return () => { activo = false }
  }, [cliente.id])

  const fecha = (f) => f ? new Date(f).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'
  const total = filas.length
  const conteo = {}
  filas.forEach(h => { const n = h.habitaciones?.numero; if (n) conteo[n] = (conteo[n] || 0) + 1 })
  const favorita = Object.entries(conteo).sort((a, b) => b[1] - a[1])[0]

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onCerrar}>
      <div className="bg-white w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl border border-gray-100 max-h-[85vh] flex flex-col animate-scale-up" onClick={e => e.stopPropagation()}>
        <div className="p-4 sm:p-6 border-b border-gray-100 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-lg font-black text-gray-800 truncate">{cliente.nombres}</h3>
            <p className="text-xs text-gray-500 font-medium">Historial de estadías</p>
          </div>
          <button onClick={onCerrar} className="btn btn-secondary btn-sm shrink-0">Cerrar</button>
        </div>

        <div className="p-4 sm:p-6 overflow-y-auto">
          {cargando ? (
            <p className="text-sm text-gray-400 text-center py-8">Cargando historial...</p>
          ) : error ? (
            <p className="text-sm text-rose-600 text-center py-8">{error}</p>
          ) : total === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">Este huésped aún no tiene estadías registradas.</p>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Visitas</p>
                  <p className="text-xl font-black text-gray-800">{total}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Hab. favorita</p>
                  <p className="text-xl font-black text-gray-800">{favorita ? favorita[0] : '—'}</p>
                </div>
              </div>
              <ul className="space-y-2">
                {filas.map(h => (
                  <li key={h.id} className="flex items-center justify-between gap-3 border border-gray-100 rounded-xl px-3 py-2.5">
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-gray-800">Hab. {h.habitaciones?.numero || '—'}
                        {!h.es_titular && <span className="badge badge-muted ml-2">Acompañante</span>}
                      </p>
                      <p className="text-xs text-gray-500">{fecha(h.ingreso)} → {fecha(h.salida_estimada)}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-black text-gray-800">S/ {h.tarifa_pactada ?? '—'}</p>
                      <p className="text-[10px] font-bold text-gray-400 uppercase">{h.estado}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
