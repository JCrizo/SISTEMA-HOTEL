import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function PanelLimpieza({ 
  hab, 
  hospedajeFinalizado, 
  turnoActivo, 
  registrarCobroAdicional, 
  reabrirHospedaje 
}) {
  const navigate = useNavigate()
  
  const [mostrarCobroAdicional, setMostrarCobroAdicional] = useState(false)
  const [montoCobroAdicional, setMontoCobroAdicional] = useState('')
  const [metodoCobroAdicional, setMetodoCobroAdicional] = useState('efectivo')
  const [conceptoCobroAdicional, setConceptoCobroAdicional] = useState('hospedaje')
  const [descCobroAdicional, setDescCobroAdicional] = useState('')
  const [guardandoCobroAdicional, setGuardandoCobroAdicional] = useState(false)

  async function handleRegistrarCobro() {
    if (!montoCobroAdicional || parseFloat(montoCobroAdicional) <= 0) return
    if (!descCobroAdicional.trim()) { alert('Ingresa una descripción del cobro'); return }
    if (!turnoActivo) { alert('No hay un turno activo. Debes iniciar turno antes de registrar un cobro.'); return }
    
    setGuardandoCobroAdicional(true)
    const exito = await registrarCobroAdicional(
      parseFloat(montoCobroAdicional),
      metodoCobroAdicional,
      conceptoCobroAdicional,
      descCobroAdicional
    )
    if (exito) {
      setMontoCobroAdicional('')
      setDescCobroAdicional('')
      setMostrarCobroAdicional(false)
    }
    setGuardandoCobroAdicional(false)
  }

  async function handleReabrir() {
    if (!confirm(`¿Reabrir el hospedaje de ${hospedajeFinalizado?.huesped_hospedaje?.[0]?.clientes?.nombres || 'este huésped'}? La habitación volverá a "Ocupada".`)) return
    await reabrirHospedaje()
  }

  return (
    <div className="bg-white rounded-xl border p-4 shadow-sm">
      <p className="text-gray-600 text-sm font-medium mb-3">
        {hab.estado === 'pendiente_limpieza' ? 'Pend. Limpieza Total' :
         hab.estado === 'en_limpieza' ? 'En limpieza' : 'Limpieza simple'}
      </p>
      <button 
        onClick={() => navigate('/limpieza')}
        className="w-full py-2 bg-yellow-500 text-white rounded-xl text-sm font-medium mb-3 hover:bg-yellow-600"
      >
        Ir a limpieza
      </button>

      {hospedajeFinalizado && (
        <>
          <div className="border-t pt-3 mt-1">
            <p className="text-xs text-gray-500 font-medium uppercase mb-1">Último huésped</p>
            <p className="text-sm font-semibold">{hospedajeFinalizado.huesped_hospedaje?.[0]?.clientes?.nombres || 'Sin nombre'}</p>
            {hospedajeFinalizado.huesped_hospedaje?.[0]?.clientes?.telefono && (
              <p className="text-xs text-gray-500 mt-0.5">📞 {hospedajeFinalizado.huesped_hospedaje[0].clientes.telefono}</p>
            )}
            <p className="text-xs text-gray-400 mb-3 mt-1">
              Ficha N° {String(hospedajeFinalizado.nro_ficha).padStart(6, '0')} · Checkout: {new Date(hospedajeFinalizado.salida_real).toLocaleString('es-PE')}
            </p>

            {mostrarCobroAdicional ? (
              <div className="bg-blue-50 rounded-xl p-3 mb-3 border border-blue-100">
                <p className="text-xs text-blue-800 font-medium uppercase mb-2">Cobro adicional (misma ficha)</p>
                <input 
                  type="number" 
                  value={montoCobroAdicional} 
                  onChange={e => setMontoCobroAdicional(e.target.value)}
                  placeholder="Monto (S/)" 
                  className="w-full border rounded-lg px-3 py-2 text-sm mb-2" 
                />
                <input 
                  type="text" 
                  value={descCobroAdicional} 
                  onChange={e => setDescCobroAdicional(e.target.value)}
                  placeholder="Descripción (ej: medio día extra)" 
                  className="w-full border rounded-lg px-3 py-2 text-sm mb-2" 
                />
                <select 
                  value={conceptoCobroAdicional} 
                  onChange={e => setConceptoCobroAdicional(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm mb-2"
                >
                  <option value="hospedaje">Hospedaje</option>
                  <option value="consumo">Consumos</option>
                  <option value="pago_penalidad">Cargo adicional</option>
                </select>
                <select 
                  value={metodoCobroAdicional} 
                  onChange={e => setMetodoCobroAdicional(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm mb-3"
                >
                  <option value="efectivo">Efectivo</option>
                  <option value="yape">Yape</option>
                  <option value="tarjeta">Tarjeta</option>
                  <option value="transferencia">Transferencia</option>
                </select>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setMostrarCobroAdicional(false)}
                    className="flex-1 py-2 border rounded-xl text-sm text-gray-600 bg-white hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                  <button 
                    onClick={handleRegistrarCobro} 
                    disabled={guardandoCobroAdicional}
                    className="flex-1 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium disabled:opacity-50 hover:bg-blue-700"
                  >
                    {guardandoCobroAdicional ? 'Guardando...' : 'Confirmar'}
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setMostrarCobroAdicional(true)}
                disabled={!turnoActivo}
                className="w-full py-2 bg-blue-600 text-white rounded-xl text-sm font-medium mb-2 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-blue-700"
              >
                💰 Cobro adicional (horas extra / consumo)
              </button>
            )}

            <button 
              onClick={handleReabrir}
              className="w-full py-2 bg-green-600 text-white rounded-xl text-sm font-medium hover:bg-green-700"
            >
              🔄 Reabrir hospedaje (se queda más noches)
            </button>
          </div>
        </>
      )}
    </div>
  )
}
