import { useNavigate } from 'react-router-dom'

export default function BloqueoTurnoAjeno() {
  const navigate = useNavigate()
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] bg-red-50 text-red-600 rounded-3xl m-4 p-8 text-center border-2 border-red-200 max-w-2xl mx-auto shadow-sm">
      <span className="text-6xl mb-6">⚠️</span>
      <h2 className="text-2xl md:text-3xl font-black mb-3 text-red-700">Turno Abierto por Otro Usuario</h2>
      <p className="font-medium text-red-800/80 mb-8 max-w-md mx-auto text-lg leading-relaxed">
        El turno actual pertenece a otra persona que olvidó cerrarlo. Para poder realizar operaciones, debes ir a Caja, hacer el arqueo y <strong className="font-bold">cerrar su turno</strong> antes de iniciar el tuyo.
      </p>
      <button 
        onClick={() => navigate('/turnos')}
        className="px-8 py-4 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-black shadow-lg shadow-red-200 transition-transform active:scale-95 flex items-center gap-2"
      >
        Ir a Control de Caja
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
      </button>
    </div>
  )
}
