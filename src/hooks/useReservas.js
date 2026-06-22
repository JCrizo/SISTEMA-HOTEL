import { create } from 'zustand'
import { reservasService } from '../services/reservasService'
import { clientesService } from '../services/clientesService'
import { auditoriaService } from '../services/auditoriaService'

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

  crearReserva: async (reservaData, clienteParams, usuario) => {
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
      const nuevaReserva = await reservasService.crearReserva({
        ...reservaData,
        cliente_id: clienteId
      })

      // Auditoría
      if (usuario) {
        await auditoriaService.registrarAccion(
          usuario,
          'CREAR_RESERVA',
          'Reservas',
          `Creó reserva para ${clienteParams.nombres} con adelanto de S/${reservaData.adelanto || 0}`
        )
      }

      // Recargar las reservas
      await get().cargarReservas()
      return true
    } catch (error) {
      set({ error: error.message })
      return false
    }
  },

  anularReserva: async (reserva, usuario) => {
    try {
      await reservasService.anularReserva(reserva.id)
      
      // Auditoría
      if (usuario) {
        await auditoriaService.registrarAccion(
          usuario,
          'ANULAR_RESERVA',
          'Reservas',
          `Anuló reserva de ${reserva.clientes?.nombres} (Adelanto: S/${reserva.adelanto || 0})`
        )
      }

      await get().cargarReservas()
      return true
    } catch (error) {
      set({ error: error.message })
      return false
    }
  },

  actualizarHabitacionReserva: async (reserva, habitacionId, usuario) => {
    try {
      await reservasService.actualizarHabitacion(reserva.id, habitacionId)
      
      // Auditoría
      if (usuario) {
        await auditoriaService.registrarAccion(
          usuario,
          'MODIFICAR_RESERVA',
          'Reservas',
          `Cambió la habitación de la reserva de ${reserva.clientes?.nombres} (ID Habitación: ${habitacionId})`
        )
      }

      await get().cargarReservas()
      return true
    } catch (error) {
      set({ error: error.message })
      return false
    }
  }
}))
