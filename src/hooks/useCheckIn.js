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

  const realizarCheckIn = async (datosTransaccion, clienteDatos, acompanantes = []) => {
    setCargando(true)
    setError(null)
    try {
      let clienteId = clienteDatos.id
      
      // Crear o actualizar cliente titular
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

      // Crear o recuperar acompañantes
      const acompanantesIds = []
      for (const ac of acompanantes) {
        if (!ac.dni.trim() || !ac.nombres.trim()) continue // Skip inestables
        
        let acId = ac.clienteId
        if (acId) {
          await clientesService.actualizarCliente(acId, {
            nombres: ac.nombres,
            telefono: ac.telefono,
            nacionalidad: ac.nacionalidad
          })
          acompanantesIds.push(acId)
        } else {
          const nuevo = await clientesService.crearCliente({
            dni_pasaporte: ac.dni,
            nombres: ac.nombres,
            telefono: ac.telefono,
            nacionalidad: ac.nacionalidad
          })
          acompanantesIds.push(nuevo.id)
        }
      }

      // Ejecutar la transacción de hospedaje
      await hospedajesService.crearCheckIn({
        ...datosTransaccion,
        clienteId,
        acompanantesIds
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
