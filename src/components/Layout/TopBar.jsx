import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTurnoActivo } from '../../hooks/useTurnoActivo';

export default function TopBar({ setMobileOpen }) {
  const { usuario } = useAuth();
  const { turnoActivo, cargandoTurno } = useTurnoActivo();
  const navigate = useNavigate();
  const [hora, setHora] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setHora(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const fechaFormateada = hora.toLocaleDateString('es-PE', {
    weekday: 'short',
    day: 'numeric',
    month: 'short'
  });

  const horaFormateada = hora.toLocaleTimeString('es-PE', {
    hour: '2-digit',
    minute: '2-digit'
  });

  const cajaMonto = turnoActivo?.caja_principal_actual != null
    ? `S/ ${parseFloat(turnoActivo.caja_principal_actual).toFixed(2)}`
    : 'S/ 0.00';

  return (
    <header className="bg-white border-b border-gray-100 sticky top-0 z-20 shadow-xs">
      <div className="px-4 md:px-8 py-2.5 flex items-center justify-between gap-3">
        {/* Left: Mobile Toggle + Logo / Live Date */}
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setMobileOpen(true)}
            className="lg:hidden p-2 -ml-1 text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
            title="Abrir menú"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          {/* Desktop Live Date & Time Clock */}
          <div className="hidden sm:flex items-center gap-2 text-xs font-semibold text-gray-500 bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-100">
            <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="capitalize">{fechaFormateada}</span>
            <span className="text-gray-300">•</span>
            <span className="font-bold text-gray-700">{horaFormateada}</span>
          </div>

          <div className="sm:hidden flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-sm">
              O
            </div>
            <span className="font-black text-gray-800 text-sm tracking-tight">HOTEL OTI</span>
          </div>
        </div>

        {/* Right: Turno & Caja Status + Quick Actions + User Profile */}
        <div className="flex items-center gap-2 md:gap-3">
          {/* Turno & Caja Live Pill */}
          {cargandoTurno ? (
            <div className="h-7 w-24 bg-gray-100 rounded-full animate-pulse"></div>
          ) : turnoActivo ? (
            <button
              onClick={() => navigate('/turnos')}
              className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-200/70 text-emerald-800 rounded-full text-xs font-bold transition-all shadow-2xs group"
              title="Click para ver arqueo y movimientos del turno"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="hidden sm:inline capitalize font-semibold">{turnoActivo.tipo}:</span>
              <span className="text-emerald-950 font-black tracking-tight">{cajaMonto}</span>
            </button>
          ) : (
            <button
              onClick={() => navigate('/turnos')}
              className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-700 rounded-full text-xs font-bold transition-all"
              title="Click para aperturar turno de caja"
            >
              <span className="w-2 h-2 rounded-full bg-amber-400"></span>
              <span>Sin Turno</span>
            </button>
          )}

          {/* Quick Action Button (Desktop/Tablet) */}
          <button
            onClick={() => navigate('/reservas')}
            className="hidden md:flex items-center gap-1 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200/50 rounded-xl text-xs font-bold transition-colors shadow-2xs"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
            <span>Nueva Reserva</span>
          </button>

          {/* User profile pill */}
          <div className="hidden lg:flex items-center gap-2 pl-3 border-l border-gray-100">
            <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center text-xs font-bold shadow-2xs">
              {(usuario?.nombre || 'U').charAt(0).toUpperCase()}
            </div>
            <div className="text-left leading-tight">
              <p className="text-xs font-bold text-gray-800 max-w-[110px] truncate">{usuario?.nombre || 'Usuario'}</p>
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">{usuario?.rol || 'Personal'}</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
