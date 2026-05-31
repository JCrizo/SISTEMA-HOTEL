import { Routes, Route } from 'react-router-dom'
import Habitaciones from './pages/Habitaciones'
import DetalleHabitacion from './pages/DetalleHabitacion'
import CheckIn from './pages/CheckIn'
import Consumos from './pages/Consumos'


function App() {
  return (
    <div className="min-h-screen bg-gray-100">
      <Routes>
        <Route path="/" element={<Habitaciones />} />
        <Route path="/habitacion/:id" element={<DetalleHabitacion />} />
        <Route path="/checkin/:id" element={<CheckIn />} />
        <Route path="/consumos/:id" element={<Consumos />} />
      </Routes>
    </div>
  )
}


export default App