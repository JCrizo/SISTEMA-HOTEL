import { Suspense, lazy } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Login from './pages/Login'
import Habitaciones from './pages/Habitaciones'

// Carga diferida: estas páginas solo se descargan cuando el usuario
// navega a ellas, reduciendo el bundle inicial significativamente.
// Login y Habitaciones (dashboard) cargan siempre de inmediato.
const DetalleHabitacion  = lazy(() => import('./pages/DetalleHabitacion'))
const CheckIn            = lazy(() => import('./pages/CheckIn'))
const Consumos           = lazy(() => import('./pages/Consumos'))
const Limpieza           = lazy(() => import('./pages/Limpieza'))
const Turnos             = lazy(() => import('./pages/Turnos'))
const Cochera            = lazy(() => import('./pages/Cochera'))
const Reportes           = lazy(() => import('./pages/Reportes'))
const ReportesAdmin      = lazy(() => import('./pages/ReportesAdmin'))
const ReportesRecepcion  = lazy(() => import('./pages/ReportesRecepcion'))
const Usuarios           = lazy(() => import('./pages/Usuarios'))
const Reservas           = lazy(() => import('./pages/Reservas'))
const Productos          = lazy(() => import('./pages/Productos'))
const FichaHospedaje     = lazy(() => import('./pages/FichaHospedaje'))
const Auditoria          = lazy(() => import('./pages/Auditoria'))
const MigrarUsuarios     = lazy(() => import('./pages/MigrarUsuarios'))

function CargandoPagina() {
  return <div className="p-4 text-gray-500">Cargando...</div>
}

function L({ children }) {
  return <Suspense fallback={<CargandoPagina />}>{children}</Suspense>
}



function RutaProtegida({ children, roles }) {
  const { usuario } = useAuth()
  if (!usuario) return <Navigate to="/login" />
  
  if (roles) {
    const rolUsuario = (usuario.rol || '').toLowerCase().trim()
    if (!roles.includes(rolUsuario)) {
      return <Navigate to="/" />
    }
  }
  
  return children
}

function App() {
  const { usuario, cargando } = useAuth()

  if (cargando) return <div className="p-4 text-gray-500">Cargando...</div>

  return (
    <div className="min-h-screen bg-gray-100">
      <Routes>
        <Route path="/registro-empleado" element={<RutaProtegida roles={['administrador']}><L><MigrarUsuarios /></L></RutaProtegida>} />
        <Route path="/login" element={usuario ? <Navigate to="/" /> : <Login />} />
        <Route path="/" element={<RutaProtegida><Habitaciones /></RutaProtegida>} />
        <Route path="/habitacion/:id" element={<RutaProtegida><L><DetalleHabitacion /></L></RutaProtegida>} />
        <Route path="/checkin/:id" element={<RutaProtegida roles={['recepcionista','administrador']}><L><CheckIn /></L></RutaProtegida>} />
        <Route path="/consumos/:id" element={<RutaProtegida roles={['recepcionista','administrador']}><L><Consumos /></L></RutaProtegida>} />
        <Route path="/limpieza" element={<RutaProtegida><L><Limpieza /></L></RutaProtegida>} />
        <Route path="/turnos" element={<RutaProtegida roles={['recepcionista','administrador']}><L><Turnos /></L></RutaProtegida>} />
        <Route path="/cochera" element={<RutaProtegida roles={['recepcionista','administrador']}><L><Cochera /></L></RutaProtegida>} />
        <Route path="/reportes" element={<RutaProtegida roles={['administrador']}><L><Reportes /></L></RutaProtegida>} />
        <Route path="/usuarios" element={<RutaProtegida roles={['administrador']}><L><Usuarios /></L></RutaProtegida>} />
        <Route path="/reservas" element={<RutaProtegida roles={['recepcionista','administrador']}><L><Reservas /></L></RutaProtegida>} />
        <Route path="/productos" element={<RutaProtegida roles={['administrador', 'recepcionista']}><L><Productos /></L></RutaProtegida>} />
        <Route path="/reportes-recepcion" element={<RutaProtegida roles={['recepcionista','administrador']}><L><ReportesRecepcion /></L></RutaProtegida>} />
        <Route path="/ficha/:id" element={<RutaProtegida><L><FichaHospedaje /></L></RutaProtegida>} />
        <Route path="/reportes-admin" element={<RutaProtegida roles={['administrador']}><L><ReportesAdmin /></L></RutaProtegida>} />
        <Route path="/auditoria" element={<RutaProtegida roles={['administrador']}><L><Auditoria /></L></RutaProtegida>} />
      </Routes>
    </div>
  )
}

export default App