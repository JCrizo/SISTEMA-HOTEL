import { useState, useCallback } from 'react'
import { hospedajesService } from '../services/hospedajesService'
import { clientesService } from '../services/clientesService'
import { habitacionesService } from '../services/habitacionesService'
import { reservasService } from '../services/reservasService'

export function useCheckIn() {
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState(null)
  const [hab, setHab] = useState(null)
  
  // Estados iniciales para el formulario extraídos de la BD
  const [datosIniciales, setDatosIniciales] = useState(null)

  const cargarDatosCheckIn = useCallback(async (habitacionId, reservaId) => {
    setCargando(true)
    setError(null)
    try {
      const habData = await habitacionesService.obtenerPorId(habitacionId)
      setHab(habData)

      let reservaData = null
      if (reservaId) {
        reservaData = await reservasService.obtenerPorId(reservaId)
      }

      setDatosIniciales({
        habitacion: habData,
        reserva: reservaData
      })
    } catch (err) {
      setError(err.message)
    } finally {
      setCargando(false)
    }
  }, [])

  const buscarCliente = async (dniPasaporte) => {
    try {
      return await clientesService.buscarPorDniPasaporte(dniPasaporte)
    } catch (err) {
      console.error(err)
      return null
    }
  }

  const realizarCheckIn = async (datosTransaccion, clienteDatos) => {
    setCargando(true)
    setError(null)
    try {
      let clienteId = clienteDatos.id
      
      // Crear o actualizar cliente
      if (clienteId) {
        await clientesService.actualizarCliente(clienteId, {
          nombres: clienteDatos.nombres,
          telefono: clienteDatos.telefono,
          nacionalidad: clienteDatos.nacionalidad
        })
      } else {
        const nuevo = await clientesService.crearCliente({
          dni_pasaporte: clienteDatos.dni_pasaporte,
          nombres: clienteDatos.nombres,
          telefono: clienteDatos.telefono,
          nacionalidad: clienteDatos.nacionalidad
        })
        clienteId = nuevo.id
      }

      // Ejecutar la transacción de hospedaje
      await hospedajesService.crearCheckIn({
        ...datosTransaccion,
        clienteId
      })

      setCargando(false)
      return true
    } catch (err) {
      setError(err.message)
      setCargando(false)
      return false
    }
  }

  return {
    hab,
    datosIniciales,
    cargando,
    error,
    setError,
    cargarDatosCheckIn,
    buscarCliente,
    realizarCheckIn
  }
}
