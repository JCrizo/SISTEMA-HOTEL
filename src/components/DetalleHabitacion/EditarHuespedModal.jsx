import { useState } from 'react'

export default function EditarHuespedModal({
  huesped,
  hospedaje,
  actualizarTarifaHospedaje,
  actualizarDatosHuesped,
  actualizarFechaIngreso,
  onClose
}) {
  const ingreso = new Date(hospedaje.ingreso)
  const salida = new Date(hospedaje.salida_estimada)
  const nochesTotales = Math.max(1, Math.round((salida - ingreso) / (1000 * 60 * 60 * 24)))
  const tarifaPorNocheActual = (parseFloat(hospedaje.tarifa_pactada) / nochesTotales).toFixed(2)

  // fecha-hora local en formato datetime-local (YYYY-MM-DDTHH:mm)
  const toLocalDatetimeValue = (isoStr) => {
    const d = new Date(isoStr)
    const pad = n => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
  }

  const [nombres, setNombres] = useState(huesped?.nombres || '')
  const [dni, setDni] = useState(huesped?.dni_pasaporte || '')
  const [telefono, setTelefono] = useState(huesped?.telefono || '')
  const [tarifaPorNoche, setTarifaPorNoche] = useState(tarifaPorNocheActual)
  const [fechaIngreso, setFechaIngreso] = useState(toLocalDatetimeValue(hospedaje.ingreso))
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')

  const nuevaTarifaPactada = (parseFloat(tarifaPorNoche || 0) * nochesTotales).toFixed(2)
  const tarifaCambio = parseFloat(tarifaPorNoche || 0) !== parseFloat(tarifaPorNocheActual)

  async function handleGuardar() {
    setError('')
    if (!nombres.trim()) { setError('El nombre es obligatorio'); return }
    if (!tarifaPorNoche || parseFloat(tarifaPorNoche) <= 0) { setError('La tarifa por noche debe ser mayor a 0'); return }

    setGuardando(true)

    const datosCambiaron = nombres !== huesped?.nombres || dni !== huesped?.dni_pasaporte || telefono !== (huesped?.telefono || '')
    if (datosCambiaron) {
      const exito = await actualizarDatosHuesped({
        nombres: nombres.trim(),
        dni_pasaporte: dni.trim(),
        telefono: telefono.trim() || null
      })
      if (!exito) {
        setError('No se pudo actualizar los datos del huésped')
        setGuardando(false)
        return
      }
    }

    if (tarifaCambio) {
      const exito = await actualizarTarifaHospedaje(parseFloat(tarifaPorNoche))
      if (!exito) {
        setError('No se pudo actualizar la tarifa')
        setGuardando(false)
        return
      }
    }

    const ingresoOriginal = toLocalDatetimeValue(hospedaje.ingreso)
    if (fechaIngreso !== ingresoOriginal && actualizarFechaIngreso) {
      const nuevaFechaIso = new Date(fechaIngreso).toISOString()
      const exito = await actualizarFechaIngreso(nuevaFechaIso)
      if (!exito) {
        setError('No se pudo actualizar la fecha de ingreso')
        setGuardando(false)
        return
      }
    }

    setGuardando(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-gray-800">Editar Huésped</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">✕</button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg p-3 mb-3">
            {error}
          </div>
        )}

        <div className="space-y-3">
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1">Nombre completo</label>
            <input
              type="text"
              value={nombres}
              onChange={e => setNombres(e.target.value)}
              className="w-full border-2 border-gray-100 rounded-xl px-4 py-2.5 text-sm font-medium outline-none focus:border-blue-400"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1">DNI / Pasaporte</label>
            <input
              type="text"
              value={dni}
              onChange={e => setDni(e.target.value)}
              className="w-full border-2 border-gray-100 rounded-xl px-4 py-2.5 text-sm font-medium outline-none focus:border-blue-400"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1">Teléfono</label>
            <input
              type="text"
              value={telefono}
              onChange={e => setTelefono(e.target.value)}
              className="w-full border-2 border-gray-100 rounded-xl px-4 py-2.5 text-sm font-medium outline-none focus:border-blue-400"
            />
          </div>

          <div className="pt-2 border-t border-gray-100">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1">Tarifa por noche (S/)</label>
            <input
              type="number"
              inputMode="decimal"
              value={tarifaPorNoche}
              onChange={e => setTarifaPorNoche(e.target.value)}
              onFocus={e => e.target.select()}
              onWheel={e => e.target.blur()}
              className="w-full border-2 border-gray-100 rounded-xl px-4 py-2.5 text-sm font-bold outline-none focus:border-blue-400"
            />
            <p className="text-xs text-gray-400 mt-1">
              {nochesTotales} noche(s) · Total pactado: <span className="font-bold text-gray-600">S/{nuevaTarifaPactada}</span>
              {tarifaCambio && <span className="text-orange-500"> (antes S/{hospedaje.tarifa_pactada})</span>}
            </p>
          </div>

          <div className="pt-2 border-t border-gray-100">
            <label className="text-xs font-bold text-orange-600 uppercase tracking-wide block mb-1">⚠ Fecha y Hora de Ingreso Real</label>
            <input
              type="datetime-local"
              value={fechaIngreso}
              onChange={e => setFechaIngreso(e.target.value)}
              className="w-full border-2 border-orange-100 rounded-xl px-4 py-2.5 text-sm font-medium outline-none focus:border-orange-400"
            />
            <p className="text-xs text-orange-400 mt-1">Solo modifica si el ingreso fue registrado en un horario incorrecto.</p>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={onClose}
            className="flex-1 py-3 border-2 border-gray-200 rounded-xl text-gray-600 font-bold hover:bg-gray-50 transition-colors">
            Cancelar
          </button>
          <button onClick={handleGuardar} disabled={guardando}
            className="flex-[2] py-3 bg-blue-600 text-white rounded-xl font-bold shadow-md hover:bg-blue-700 active:scale-[0.98] transition-transform disabled:opacity-50">
            {guardando ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </div>
      </div>
    </div>
  )
}
