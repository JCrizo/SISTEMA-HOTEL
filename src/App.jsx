import { Suspense, lazy } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Login from './pages/Login'
import Habitaciones from './pages/Habitaciones'
import DetalleHabitacion from './pages/DetalleHabitacion'
import CheckIn from './pages/CheckIn'
import Consumos from './pages/Consumos'
import Limpieza from './pages/Limpieza'
import Turnos from './pages/Turnos'
import Cochera from './pages/Cochera'
import Usuarios from './pages/Usuarios'
import Reservas from './pages/Reservas'
import Productos from './pages/Productos'
import ReportesRecepcion from './pages/ReportesRecepcion'
import FichaHospedaje from './pages/FichaHospedaje'
import Auditoria from './pages/Auditoria'

// Cargadas bajo demanda: incluyen recharts, jspdf y xlsx, que pesan bastante
// y solo se necesitan al entrar a reportes o exportar.
const Reportes = lazy(() => import('./pages/Reportes'))
const ReportesAdmin = lazy(() => import('./pages/ReportesAdmin'))

function CargandoPagina() {
  return <div className="p-4 text-gray-500">Cargando...</div>
}



function RutaProtegida({ children, roles }) {
  const { usuario } = useAuth()
  if (!usuario) return <Navigate to="/login" />
  if (roles && !roles.includes(usuario.rol)) return <Navigate to="/" />
  return children
}

function App() {
  const { usuario, cargando } = useAuth()

  if (cargando) return <div className="p-4 text-gray-500">Cargando...</div>

  return (
    <div className="min-h-screen bg-gray-100">
      <Routes>
        <Route path="/login" element={usuario ? <Navigate to="/" /> : <Login />} />
        <Route path="/" element={<RutaProtegida><Habitaciones /></RutaProtegida>} />
        <Route path="/habitacion/:id" element={<RutaProtegida><DetalleHabitacion /></RutaProtegida>} />
        <Route path="/checkin/:id" element={<RutaProtegida roles={['recepcionista','administrador']}><CheckIn /></RutaProtegida>} />
        <Route path="/consumos/:id" element={<RutaProtegida roles={['recepcionista','administrador']}><Consumos /></RutaProtegida>} />
        <Route path="/limpieza" element={<RutaProtegida><Limpieza /></RutaProtegida>} />
        <Route path="/turnos" element={<RutaProtegida roles={['recepcionista','administrador']}><Turnos /></RutaProtegida>} />
        <Route path="/cochera" element={<RutaProtegida roles={['recepcionista','administrador']}><Cochera /></RutaProtegida>} />
        <Route path="/reportes" element={<RutaProtegida roles={['administrador']}><Suspense fallback={<CargandoPagina />}><Reportes /></Suspense></RutaProtegida>} />
        <Route path="/usuarios" element={<RutaProtegida roles={['administrador']}><Usuarios /></RutaProtegida>} />
        <Route path="/reservas" element={<RutaProtegida roles={['recepcionista','administrador']}><Reservas /></RutaProtegida>} />
        <Route path="/productos" element={<RutaProtegida roles={['administrador', 'recepcionista']}><Productos /></RutaProtegida>} />
        <Route path="/reportes-recepcion" element={<RutaProtegida roles={['recepcionista','administrador']}><ReportesRecepcion /></RutaProtegida>} />
        <Route path="/ficha/:id" element={<RutaProtegida><FichaHospedaje /></RutaProtegida>} />
        <Route path="/reportes-admin" element={<RutaProtegida roles={['administrador']}><Suspense fallback={<CargandoPagina />}><ReportesAdmin /></Suspense></RutaProtegida>} />
        <Route path="/auditoria" element={<RutaProtegida roles={['administrador']}><Auditoria /></RutaProtegida>} />
      </Routes>
    </div>
  )
}

export default App