import { useState, useCallback } from 'react'
import { habitacionesService } from '../services/habitacionesService'
import { hospedajesService } from '../services/hospedajesService'
import { pagosService } from '../services/pagosService'
import { consumosService } from '../services/consumosService'
import { turnosService } from '../services/turnosService'
import { clientesService } from '../services/clientesService'
import { auditoriaService } from '../services/auditoriaService'
import { reservasService } from '../services/reservasService'

export function useDetalleHabitacion() {
  const [cargando, setCargando] = useState(true)
  const [hab, setHab] = useState(null)
  const [hospedaje, setHospedaje] = useState(null)
  const [huesped, setHuesped] = useState(null)
  const [pagos, setPagos] = useState([])
  const [consumos, setConsumos] = useState([])
  const [reservaPendiente, setReservaPendiente] = useState(null)

  // Para estado "pendiente_limpieza"
  const [hospedajeFinalizado, setHospedajeFinalizado] = useState(null)
  const [pagosFinalizado, setPagosFinalizado] = useState([])

  const cargarDatos = useCallback(async (habitacionId) => {
    setCargando(true)
    try {
      const habData = await habitacionesService.obtenerPorId(habitacionId)
      setHab(habData)

      // Reserva pendiente solo aplica cuando la habitación está disponible
      if (habData?.estado === 'disponible') {
        const reservaData = await reservasService.obtenerReservaPendientePorHabitacionParaHoy(habitacionId)
        setReservaPendiente(reservaData)
      } else {
        setReservaPendiente(null)
      }

      if (habData?.estado === 'ocupada') {
        const hospData = await hospedajesService.obtenerActivoPorHabitacion(habitacionId)
        if (hospData) {
          setHospedaje(hospData)
          setHuesped(hospData.huesped_hospedaje?.[0]?.clientes)

          const pagosData = await pagosService.obtenerPorHospedaje(hospData.id)
          setPagos(pagosData)

          const consumosData = await consumosService.obtenerPorHospedaje(hospData.id)
          setConsumos(consumosData)
        }
      } else if (['pendiente_limpieza', 'en_limpieza', 'limpieza_simple'].includes(habData?.estado)) {
        const hospFin = await hospedajesService.obtenerUltimoFinalizadoPorHabitacion(habitacionId)
        setHospedajeFinalizado(hospFin)
        if (hospFin) {
          const pagosFin = await pagosService.obtenerPorHospedaje(hospFin.id)
          setPagosFinalizado(pagosFin)
        }
      }
    } catch (error) {
      console.error(error)
    } finally {
      setCargando(false)
    }
  }, [])

  const registrarPago = async (monto, metodo, concepto, nroTicket) => {
    if (!hospedaje) return false
    try {
      await pagosService.registrarPago({
        hospedajeId: hospedaje.id,
        monto,
        metodo,
        concepto,
        observaciones: nroTicket
      })

      const pagosActualizados = [...pagos, { concepto, monto }]
      const totalPagado = pagosActualizados
        .filter(p => p.concepto !== 'penalidad')
        .reduce((s, p) => s + parseFloat(p.monto), 0)
      
      const nuevoEstadoPago = totalPagado >= parseFloat(hospedaje.tarifa_pactada) ? 'pagado' : 'parcial'
      await hospedajesService.actualizarEstadoPago(hospedaje.id, nuevoEstadoPago)
      
      const tipoCaja = concepto === 'consumo' ? 'consumos' : 'principal'
      await turnosService.sumarACaja(parseFloat(monto), tipoCaja)
      
      await cargarDatos(hab.id)
      return true
    } catch (error) {
      console.error(error)
      return false
    }
  }

  const registrarPenalidad = async (monto, descripcion) => {
    if (!hospedaje) return false
    try {
      await pagosService.registrarPago({
        hospedajeId: hospedaje.id,
        monto,
        metodo: 'efectivo',
        concepto: 'penalidad',
        observaciones: descripcion
      })
      await cargarDatos(hab.id)
      return true
    } catch (error) {
      console.error(error)
      return false
    }
  }

  const extenderEstadia = async (nuevaFechaIso, costoExtra, noches) => {
    if (!hospedaje) return false
    try {
      await hospedajesService.actualizarSalidaEstimada(hospedaje.id, nuevaFechaIso)
      if (noches > 0) {
        await pagosService.registrarPago({
          hospedajeId: hospedaje.id,
          monto: costoExtra,
          metodo: 'efectivo',
          concepto: 'penalidad',
          observaciones: `Extensión de estadía: ${noches} noche(s) adicional(es)`
        })
      }
      await cargarDatos(hab.id)
      return true
    } catch (error) {
      console.error(error)
      return false
    }
  }

  const actualizarHabitacion = async (updates) => {
    try {
      await habitacionesService.actualizar(hab.id, updates)
      await cargarDatos(hab.id)
      return true
    } catch (error) {
      console.error(error)
      return false
    }
  }

  const actualizarTarifaHospedaje = async (nuevaTarifaPorNoche, usuarioNombre) => {
    if (!hospedaje) return false
    try {
      const ingreso = new Date(hospedaje.ingreso)
      const salida = new Date(hospedaje.salida_estimada)
      const nochesTotales = Math.max(1, Math.round((salida - ingreso) / (1000 * 60 * 60 * 24)))
      const nuevaTarifaPactada = parseFloat(nuevaTarifaPorNoche) * nochesTotales

      await hospedajesService.actualizarTarifa(
        hospedaje.id,
        nuevaTarifaPactada,
        hospedaje.observaciones,
        usuarioNombre
      )
      await cargarDatos(hab.id)
      return true
    } catch (error) {
      console.error(error)
      return false
    }
  }

  const actualizarDatosHuesped = async (datosCliente) => {
    if (!huesped) return false
    try {
      await clientesService.actualizarCliente(huesped.id, datosCliente)
      await cargarDatos(hab.id)
      return true
    } catch (error) {
      console.error(error)
      return false
    }
  }

  const actualizarFechaIngreso = async (nuevaFechaIso) => {
    if (!hospedaje) return false
    try {
      await hospedajesService.actualizarFechaIngreso(hospedaje.id, nuevaFechaIso)
      await cargarDatos(hab.id)
      return true
    } catch (error) {
      console.error(error)
      return false
    }
  }

  const hacerCheckout = async (usuario) => {
    if (!hospedaje) return false
    try {
      await hospedajesService.hacerCheckout(hospedaje.id, hab.id)
      
      if (usuario) {
        await auditoriaService.registrarAccion(
          usuario,
          'CHECKOUT',
          'Habitaciones',
          `Realizó Checkout de la habitación ${hab.numero}`
        )
      }

      return true
    } catch (error) {
      console.error(error)
      return false
    }
  }

  const registrarCobroAdicional = async (monto, metodo, concepto, descripcion, usuario) => {
    if (!hospedajeFinalizado) return false
    try {
      await pagosService.registrarPago({
        hospedajeId: hospedajeFinalizado.id,
        monto,
        metodo,
        concepto,
        observaciones: descripcion
      })
      const tipoCaja = concepto === 'consumo' ? 'consumos' : 'principal'
      await turnosService.sumarACaja(parseFloat(monto), tipoCaja)
      
      if (usuario) {
        await auditoriaService.registrarAccion(
          usuario,
          'COBRO_ADICIONAL_POST_CHECKOUT',
          'Habitaciones',
          `Cobró S/${monto} extra a habitación ${hab.numero}. Motivo: ${concepto}`
        )
      }

      await cargarDatos(hab.id)
      return true
    } catch (error) {
      console.error(error)
      return false
    }
  }

  const reabrirHospedaje = async (usuario) => {
    if (!hospedajeFinalizado) return false
    try {
      await hospedajesService.reabrirHospedaje(hospedajeFinalizado.id, hab.id)
      
      if (usuario) {
        await auditoriaService.registrarAccion(
          usuario,
          'REABRIR_HOSPEDAJE',
          'Habitaciones',
          `Reabrió el hospedaje (deshizo checkout) de la habitación ${hab.numero}`
        )
      }

      await cargarDatos(hab.id)
      return true
    } catch (error) {
      console.error(error)
      return false
    }
  }

  const cambiarHabitacion = async (nuevaHabitacionId, usuario) => {
    if (!hospedaje || !hab) return { exito: false, error: 'Datos incompletos' }
    try {
      await hospedajesService.cambiarHabitacion(
        hospedaje.id,
        hab.id,
        nuevaHabitacionId,
        hospedaje.observaciones,
        usuario?.nombre
      )

      if (usuario) {
        await auditoriaService.registrarAccion(
          usuario,
          'CAMBIAR_HABITACION',
          'Habitaciones',
          `Movió al huésped de Hab ${hab.numero} a habitación ID: ${nuevaHabitacionId}`
        )
      }

      return { exito: true, nuevaHabitacionId }
    } catch (error) {
      console.error(error)
      return { exito: false, error: error.message }
    }
  }

  return {
    cargando,
    hab,
    hospedaje,
    huesped,
    pagos,
    consumos,
    hospedajeFinalizado,
    pagosFinalizado,
    reservaPendiente,
    cargarDatos,
    registrarPago,
    registrarPenalidad,
    extenderEstadia,
    actualizarHabitacion,
    actualizarTarifaHospedaje,
    actualizarDatosHuesped,
    actualizarFechaIngreso,
    hacerCheckout,
    registrarCobroAdicional,
    reabrirHospedaje,
    cambiarHabitacion
  }
}
