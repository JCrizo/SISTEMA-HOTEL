import { create } from 'zustand'
import { reservasService } from '../services/reservasService'
import { clientesService } from '../services/clientesService'

export const useReservas = create((set, get) => ({
  reservas: [],
  cargando: false,
  error: null,

  cargarReservas: async () => {
    set({ cargando: true, error: null })
    try {
      const data = await reservasService.obtenerReservasPendientes()
      set({ reservas: data, cargando: false })
    } catch (error) {
      set({ error: error.message, cargando: false })
    }
  },

  crearReserva: async (reservaData, clienteParams) => {
    set({ error: null })
    try {
      let clienteId = clienteParams.clienteId

      // Si no hay clienteId, significa que debemos crear o actualizar el cliente primero
      if (clienteId) {
        // Actualizamos los datos del cliente por si cambiaron (nombres o teléfono)
        await clientesService.actualizarCliente(clienteId, {
          nombres: clienteParams.nombres,
          telefono: clienteParams.telefono
        })
      } else {
        const nuevoCliente = await clientesService.crearCliente({
          dni_pasaporte: clienteParams.dni_pasaporte,
          nombres: clienteParams.nombres,
          telefono: clienteParams.telefono
        })
        clienteId = nuevoCliente.id
      }

      // Crear la reserva con el clienteId
      await reservasService.crearReserva({
        ...reservaData,
        cliente_id: clienteId
      })

      // Recargar las reservas
      await get().cargarReservas()
      return true
    } catch (error) {
      set({ error: error.message })
      return false
    }
  },

  anularReserva: async (reservaId) => {
    try {
      await reservasService.anularReserva(reservaId)
      await get().cargarReservas()
      return true
    } catch (error) {
      set({ error: error.message })
      return false
    }
  },

  cambiarHabitacionReserva: async (reservaId, nuevaHabitacionId) => {
    try {
      await reservasService.cambiarHabitacion(reservaId, nuevaHabitacionId)
      await get().cargarReservas()
      return true
    } catch (error) {
      set({ error: error.message })
      return false
    }
  }
}))
