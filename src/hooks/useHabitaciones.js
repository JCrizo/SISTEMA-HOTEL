import { create } from 'zustand'
import { habitacionesService } from '../services/habitacionesService'

export const useHabitaciones = create((set) => ({
  habitaciones: [],
  cargando: false,
  error: null,

  cargarTodas: async () => {
    set({ cargando: true, error: null })
    try {
      const data = await habitacionesService.obtenerTodas()
      set({ habitaciones: data, cargando: false })
    } catch (error) {
      set({ error: error.message, cargando: false })
    }
  },

  cargarDisponibles: async () => {
    set({ cargando: true, error: null })
    try {
      const data = await habitacionesService.obtenerDisponibles()
      set({ habitaciones: data, cargando: false })
    } catch (error) {
      set({ error: error.message, cargando: false })
    }
  }
}))
