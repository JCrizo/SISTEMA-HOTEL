import { Routes, Route } from 'react-router-dom'
import Habitaciones from './pages/Habitaciones'
import DetalleHabitacion from './pages/DetalleHabitacion'
import CheckIn from './pages/CheckIn'
import Consumos from './pages/Consumos'
import Limpieza from './pages/Limpieza'
import Turnos from './pages/Turnos'
import Cochera from './pages/Cochera'


function App() {
  return (
    <div className="min-h-screen bg-gray-100">
      <Routes>
        <Route path="/" element={<Habitaciones />} />
        <Route path="/habitacion/:id" element={<DetalleHabitacion />} />
        <Route path="/checkin/:id" element={<CheckIn />} />
        <Route path="/consumos/:id" element={<Consumos />} />
        <Route path="/limpieza" element={<Limpieza />} />
        <Route path="/turnos" element={<Turnos />} />
        <Route path="/cochera" element={<Cochera />} />
      </Routes>
    </div>
  )
}


export default App