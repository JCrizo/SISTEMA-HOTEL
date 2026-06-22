import { useState, useCallback } from 'react'
import { turnosService } from '../services/turnosService'
import { movimientosService } from '../services/movimientosService'
import { pagosService } from '../services/pagosService'
import { auditoriaService } from '../services/auditoriaService'

export function useTurnos() {
  const [cargando, setCargando] = useState(true)
  const [turnoActivo, setTurnoActivo] = useState(null)
  const [turnoAnterior, setTurnoAnterior] = useState(null)
  const [movimientos, setMovimientos] = useState([])
  const [movimientosAnterior, setMovimientosAnterior] = useState([])
  const [pagosTurno, setPagosTurno] = useState([])

  const cargarDatos = useCallback(async () => {
    setCargando(true)
    try {
      const activo = await turnosService.obtenerTurnoActivo()
      setTurnoActivo(activo)

      const anterior = await turnosService.obtenerTurnoAnterior()
      setTurnoAnterior(anterior)

      if (anterior) {
        const movsAnt = await movimientosService.obtenerPorTurno(anterior.id)
        setMovimientosAnterior(movsAnt)
      }

      if (activo) {
        const movs = await movimientosService.obtenerPorTurno(activo.id)
        setMovimientos(movs)

        const pagos = await pagosService.obtenerDesdeFecha(activo.apertura)
        setPagosTurno(pagos)
      }
    } catch (error) {
      console.error(error)
    } finally {
      setCargando(false)
    }
  }, [])

  const abrirTurno = async (datos, usuario) => {
    try {
      await turnosService.abrirTurno(datos)
      
      if (usuario) {
        await auditoriaService.registrarAccion(
          usuario,
          'ABRIR_CAJA',
          'Turnos',
          `Abrió caja con inicial de S/${datos.caja_principal_anterior || 0}`
        )
      }

      await cargarDatos()
      return true
    } catch (error) {
      console.error(error)
      return false
    }
  }

  const registrarMovimiento = async (datos, usuario) => {
    if (!turnoActivo) return false
    try {
      await movimientosService.registrarMovimiento({
        ...datos,
        turnoId: turnoActivo.id
      })

      // Update turnos cache locally and in DB
      let updates = {}
      if (datos.tipo === 'salida') {
        if (datos.cajaOrigen === 'principal') {
          updates.caja_principal_actual = turnoActivo.caja_principal_actual - parseFloat(datos.monto)
        } else {
          updates.caja_consumos_actual = turnoActivo.caja_consumos_actual - parseFloat(datos.monto)
        }
      } else if (datos.tipo === 'prestamo_entre_cajas') {
        if (datos.cajaOrigen === 'principal') {
          updates.caja_principal_actual = turnoActivo.caja_principal_actual - parseFloat(datos.monto)
          updates.caja_consumos_actual = turnoActivo.caja_consumos_actual + parseFloat(datos.monto)
        } else {
          updates.caja_consumos_actual = turnoActivo.caja_consumos_actual - parseFloat(datos.monto)
          updates.caja_principal_actual = turnoActivo.caja_principal_actual + parseFloat(datos.monto)
        }
      }

      await turnosService.actualizarCajas(turnoActivo.id, updates)
      
      if (usuario) {
        const tipoLog = datos.tipo === 'salida' ? 'SALIDA_DINERO' : 'PRESTAMO_CAJAS'
        await auditoriaService.registrarAccion(
          usuario,
          tipoLog,
          'Turnos',
          `Registró ${datos.tipo} por S/${datos.monto}. Motivo: ${datos.concepto}`
        )
      }

      await cargarDatos()
      return true
    } catch (error) {
      console.error(error)
      return false
    }
  }

  const cerrarTurno = async (cajaPrincipalFinal, cajaConsumosFinal, observaciones, usuario) => {
    if (!turnoActivo) return false
    try {
      const efectivo = pagosTurno.filter(p => p.metodo === 'efectivo').reduce((s, p) => s + parseFloat(p.monto), 0)
      const yape = pagosTurno.filter(p => p.metodo === 'yape').reduce((s, p) => s + parseFloat(p.monto), 0)
      const tarjeta = pagosTurno.filter(p => p.metodo === 'tarjeta').reduce((s, p) => s + parseFloat(p.monto), 0)
      const transferencia = pagosTurno.filter(p => p.metodo === 'transferencia').reduce((s, p) => s + parseFloat(p.monto), 0)

      await turnosService.cerrarTurno(turnoActivo.id, {
        caja_principal_actual: parseFloat(cajaPrincipalFinal),
        caja_consumos_actual: parseFloat(cajaConsumosFinal || 0),
        observaciones,
        desglose_efectivo: efectivo,
        desglose_yape: yape,
        desglose_tarjeta: tarjeta,
        desglose_transferencia: transferencia,
      })
      
      if (usuario) {
        await auditoriaService.registrarAccion(
          usuario,
          'CERRAR_CAJA',
          'Turnos',
          `Cerró caja declarando S/${cajaPrincipalFinal} en principal y S/${cajaConsumosFinal} en consumos`
        )
      }

      return true
    } catch (error) {
      console.error(error)
      return false
    }
  }

  return {
    cargando,
    turnoActivo,
    turnoAnterior,
    movimientos,
    movimientosAnterior,
    pagosTurno,
    cargarDatos,
    abrirTurno,
    registrarMovimiento,
    cerrarTurno
  }
}
