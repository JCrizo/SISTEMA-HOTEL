import { useState, useCallback } from 'react'
import { habitacionesService } from '../services/habitacionesService'
import { hospedajesService } from '../services/hospedajesService'
import { pagosService } from '../services/pagosService'
import { consumosService } from '../services/consumosService'
import { turnosService } from '../services/turnosService'

export function useDetalleHabitacion() {
  const [cargando, setCargando] = useState(true)
  const [hab, setHab] = useState(null)
  const [hospedaje, setHospedaje] = useState(null)
  const [huesped, setHuesped] = useState(null)
  const [pagos, setPagos] = useState([])
  const [consumos, setConsumos] = useState([])

  // Para estado "pendiente_limpieza"
  const [hospedajeFinalizado, setHospedajeFinalizado] = useState(null)
  const [pagosFinalizado, setPagosFinalizado] = useState([])

  const cargarDatos = useCallback(async (habitacionId) => {
    setCargando(true)
    try {
      const habData = await habitacionesService.obtenerPorId(habitacionId)
      setHab(habData)

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

  const hacerCheckout = async () => {
    if (!hospedaje) return false
    try {
      await hospedajesService.hacerCheckout(hospedaje.id, hab.id)
      return true
    } catch (error) {
      console.error(error)
      return false
    }
  }

  // Lógica para hospedaje finalizado
  const registrarCobroAdicional = async (monto, metodo, concepto, descripcion) => {
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
      await cargarDatos(hab.id)
      return true
    } catch (error) {
      console.error(error)
      return false
    }
  }

  const reabrirHospedaje = async () => {
    if (!hospedajeFinalizado) return false
    try {
      await hospedajesService.reabrirHospedaje(hospedajeFinalizado.id, hab.id)
      await cargarDatos(hab.id)
      return true
    } catch (error) {
      console.error(error)
      return false
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
    cargarDatos,
    registrarPago,
    registrarPenalidad,
    extenderEstadia,
    actualizarHabitacion,
    hacerCheckout,
    registrarCobroAdicional,
    reabrirHospedaje
  }
}
