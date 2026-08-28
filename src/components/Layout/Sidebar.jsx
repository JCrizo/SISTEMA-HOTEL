import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTurnoActivo } from '../../hooks/useTurnoActivo';
import { supabase } from '../../lib/supabase';

const navGroups = [
  {
    title: 'Dashboard',
    items: [
      { label: 'Habitaciones', icon: '🛌', path: '/', roles: ['recepcionista', 'administrador', 'limpieza'] },
      { label: 'Reservas', icon: '📅', path: '/reservas', roles: ['recepcionista', 'administrador'] },
      { label: 'Clientes', icon: '👤', path: '/clientes', roles: ['recepcionista', 'administrador'] },
    ]
  },
  {
    title: 'Operaciones',
    items: [
      { label: 'Turnos', icon: '🏪', path: '/turnos', roles: ['recepcionista', 'administrador'] },
      { label: 'Cochera', icon: '🚗', path: '/cochera', roles: ['recepcionista', 'administrador'] },
      { label: 'Limpieza', icon: '🧹', path: '/limpieza', roles: ['recepcionista', 'administrador', 'limpieza'] },
      { label: 'Productos', icon: '🏷️', path: '/productos', roles: ['recepcionista', 'administrador'] },
    ]
  },
  {
    title: 'Reportes',
    items: [
      { label: 'Reportes Recepción', icon: '📈', path: '/reportes-recepcion', roles: ['recepcionista'] },
      { label: 'Reportes Admin', icon: '📊', path: '/reportes-admin', roles: ['administrador'] },
    ]
  },
  {
    title: 'Administración',
    items: [
      { label: 'Usuarios', icon: '👥', path: '/usuarios', roles: ['administrador'] },
      { label: 'Auditoría', icon: '🛡️', path: '/auditoria', roles: ['administrador'] },
    ]
  }
];

export default function Sidebar({ mobileOpen, setMobileOpen }) {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    if (usuario?.rol !== 'administrador') {
      const { data: turnos } = await supabase
        .from('turnos').select('id, usuario_id').is('cierre', null).limit(1);
      if (turnos?.length > 0 && turnos[0].usuario_id === usuario.id) {
        alert('Tienes un turno activo. Debes entregar el turno antes de salir.');
        return;
      }
    }
    logout();
    navigate('/login');
  };

  const userRole = (usuario?.rol || 'limpieza').toLowerCase().trim();
  const userName = usuario?.nombre?.split(' ')[0] || 'Usuario';

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white border-r border-gray-200">
      {/* Header Sidebar */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-xl shadow-sm">
            O
          </div>
          <div>
            <h2 className="text-xl font-black text-gray-800 tracking-tight leading-none">HOTEL OTI</h2>
            <p className="text-xs font-semibold text-blue-600 mt-1 uppercase tracking-wider">{userRole}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-6 px-4 space-y-8 scrollbar-hide">
        {navGroups.map((group, idx) => {
          const visibleItems = group.items.filter(item => item.roles.includes(userRole));
          if (visibleItems.length === 0) return null;

          return (
            <div key={idx}>
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3 px-3">
                {group.title}
              </p>
              <ul className="space-y-1">
                {visibleItems.map(item => (
                  <li key={item.path}>
                    <NavLink
                      to={item.path}
                      onClick={() => setMobileOpen(false)}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-3 py-2.5 rounded-xl font-bold transition-all duration-200 ${
                          isActive 
                            ? 'bg-blue-50 text-blue-700 shadow-sm' 
                            : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                        }`
                      }
                    >
                      <span className="text-lg">{item.icon}</span>
                      <span>{item.label}</span>
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>

      {/* Footer User Profile & Logout */}
      <div className="p-4 border-t border-gray-100">
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-bold">
              {userName.charAt(0)}
            </div>
            <span className="font-bold text-gray-700">{userName}</span>
          </div>
          <button 
            onClick={handleLogout}
            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Cerrar sesión"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block fixed inset-y-0 left-0 w-64 z-30">
        {sidebarContent}
      </aside>

      {/* Mobile Sidebar Overlay */}
      {mobileOpen && (
        <div 
          className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <aside className={`fixed inset-y-0 left-0 w-64 z-50 transform transition-transform duration-300 lg:hidden ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        {sidebarContent}
      </aside>
    </>
  );
}
