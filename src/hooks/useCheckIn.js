import { useState, useCallback } from 'react'
import { hospedajesService } from '../services/hospedajesService'
import { clientesService } from '../services/clientesService'
import { habitacionesService } from '../services/habitacionesService'
import { reservasService } from '../services/reservasService'

export function useCheckIn() {
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState(null)
  const [hab, setHab] = useState(null)
  const [datosIniciales, setDatosIniciales] = useState(null)

  const cargarDatosCheckIn = useCallback(async (habitacionId, reservaId) => {
    setCargando(true)
    setError(null)
    try {
      const habData = await habitacionesService.obtenerPorId(habitacionId)
      
      // BUG A FIX: bloquear acceso al formulario si la habitación ya no está disponible
      if (habData && habData.estado !== 'disponible') {
        setHab(habData)
        setError(`La habitación ${habData.numero} no está disponible (estado actual: ${habData.estado}). No se puede realizar el check-in.`)
        setCargando(false)
        return
      }

      setHab(habData)

      let reservaData = null
      if (reservaId) {
        reservaData = await reservasService.obtenerPorId(reservaId)
        // BUG B FIX: verificar que la reserva sigue pendiente al cargar el formulario
        if (reservaData && !['pendiente', 'confirmada'].includes(reservaData.estado)) {
          setError(`Esta reserva ya fue procesada (estado: ${reservaData.estado}). Recarga la página.`)
          setCargando(false)
          return
        }
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

      const acompanantesIds = []
      for (const ac of acompanantes) {
        if (!ac.dni.trim() || !ac.nombres.trim()) continue
        
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

      // crearCheckIn ahora hace la doble verificación interna (hab disponible + reserva pendiente)
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
