import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';

const navIcons = {
  habitaciones: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  ),
  reservas: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  clientes: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  ),
  turnos: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  cochera: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 13l-1.5-4.5A2 2 0 0015.6 7H8.4a2 2 0 00-1.9 1.5L5 13m14 0v5a1 1 0 01-1 1h-1a1 1 0 01-1-1v-1H7v1a1 1 0 01-1 1H5a1 1 0 01-1-1v-5m14 0H5m3-3h.01M16 10h.01" />
    </svg>
  ),
  limpieza: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
    </svg>
  ),
  productos: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
    </svg>
  ),
  reportesRecepcion: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    </svg>
  ),
  reportesAdmin: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  ),
  usuarios: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  ),
  auditoria: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  ),
};

const navGroups = [
  {
    title: 'Principal',
    items: [
      { label: 'Habitaciones', iconKey: 'habitaciones', path: '/', roles: ['recepcionista', 'administrador', 'limpieza'] },
      { label: 'Reservas', iconKey: 'reservas', path: '/reservas', roles: ['recepcionista', 'administrador'] },
      { label: 'Clientes', iconKey: 'clientes', path: '/clientes', roles: ['recepcionista', 'administrador'] },
    ]
  },
  {
    title: 'Operaciones',
    items: [
      { label: 'Caja & Turnos', iconKey: 'turnos', path: '/turnos', roles: ['recepcionista', 'administrador'] },
      { label: 'Cochera', iconKey: 'cochera', path: '/cochera', roles: ['recepcionista', 'administrador'] },
      { label: 'Limpieza', iconKey: 'limpieza', path: '/limpieza', roles: ['recepcionista', 'administrador', 'limpieza'] },
      { label: 'Productos', iconKey: 'productos', path: '/productos', roles: ['recepcionista', 'administrador'] },
    ]
  },
  {
    title: 'Reportes',
    items: [
      { label: 'Reportes Recepción', iconKey: 'reportesRecepcion', path: '/reportes-recepcion', roles: ['recepcionista'] },
      { label: 'Reportes Admin', iconKey: 'reportesAdmin', path: '/reportes-admin', roles: ['administrador'] },
    ]
  },
  {
    title: 'Administración',
    items: [
      { label: 'Personal & Usuarios', iconKey: 'usuarios', path: '/usuarios', roles: ['administrador'] },
      { label: 'Auditoría', iconKey: 'auditoria', path: '/auditoria', roles: ['administrador'] },
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
    <div className="flex flex-col h-full bg-white border-r border-gray-100 shadow-2xs">
      {/* Brand Header */}
      <div className="p-5 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-blue-700 text-white flex items-center justify-center font-black text-xl shadow-sm">
            O
          </div>
          <div>
            <h2 className="text-lg font-black text-gray-800 tracking-tight leading-none">HOTEL OTI</h2>
            <span className="inline-block text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md mt-1 uppercase tracking-wider">
              {userRole}
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Groups */}
      <div className="flex-1 overflow-y-auto py-5 px-3 space-y-6 scrollbar-thin">
        {navGroups.map((group, idx) => {
          const visibleItems = group.items.filter(item => item.roles.includes(userRole));
          if (visibleItems.length === 0) return null;

          return (
            <div key={idx}>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-3">
                {group.title}
              </p>
              <ul className="space-y-1">
                {visibleItems.map(item => (
                  <li key={item.path}>
                    <NavLink
                      to={item.path}
                      onClick={() => setMobileOpen(false)}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-3 py-2.5 rounded-xl font-bold text-sm transition-all duration-150 ${
                          isActive 
                            ? 'bg-blue-50 text-blue-700 shadow-2xs' 
                            : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                        }`
                      }
                    >
                      <span className="opacity-90">{navIcons[item.iconKey]}</span>
                      <span className="truncate">{item.label}</span>
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>

      {/* User Profile Card & Sign out */}
      <div className="p-3 border-t border-gray-100 bg-gray-50/50">
        <div className="flex items-center justify-between p-2 rounded-xl bg-white border border-gray-100 shadow-2xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs shrink-0">
              {userName.charAt(0).toUpperCase()}
            </div>
            <div className="truncate">
              <p className="text-xs font-bold text-gray-800 truncate">{userName}</p>
              <p className="text-[10px] text-gray-400 truncate capitalize">{userRole}</p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors shrink-0"
            title="Cerrar sesión"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
          className="fixed inset-0 bg-gray-900/40 backdrop-blur-xs z-40 lg:hidden"
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
