import { supabase } from '../lib/supabase'

export const consumosService = {
  async obtenerPorHospedaje(hospedajeId) {
    const { data, error } = await supabase
      .from('consumos')
      .select('*, productos(nombre)')
      .eq('hospedaje_id', hospedajeId)
      .order('created_at')
    if (error) throw new Error(error.message)
    return data || []
  },

  async agregarConsumo(hospedajeId, producto, cantidad, turnoId, usuarioId) {
    if (producto.stock < cantidad) {
      throw new Error(`No hay stock suficiente de "${producto.nombre}". Stock actual: ${producto.stock}`)
    }

    const { error: errorConsumo } = await supabase.from('consumos').insert({
      hospedaje_id: hospedajeId,
      producto_id: producto.id,
      cantidad: cantidad,
      precio_unitario: producto.precio,
      usuario_id: usuarioId || null
    })
    if (errorConsumo) throw new Error(errorConsumo.message)

    const nuevoStock = Math.max(0, producto.stock - cantidad)
    
    const { error: errorProd } = await supabase.from('productos')
      .update({ stock: nuevoStock })
      .eq('id', producto.id)
    if (errorProd) throw new Error(errorProd.message)

    const { error: errorMov } = await supabase.from('movimientos_stock').insert({
      producto_id: producto.id,
      turno_id: turnoId || null,
      tipo: 'consumo',
      cantidad: -cantidad,
      stock_resultante: nuevoStock,
      usuario_id: usuarioId || null
    })
    if (errorMov) throw new Error(errorMov.message)
  },

  async eliminarConsumo(consumo, turnoId, usuarioId) {
    const { error } = await supabase.from('consumos').delete().eq('id', consumo.id)
    if (error) throw new Error(error.message)

    // Reponer el stock del producto consumido
    const { data: producto, error: errorProd } = await supabase
      .from('productos')
      .select('stock')
      .eq('id', consumo.producto_id)
      .single()
    if (errorProd) throw new Error(errorProd.message)

    const nuevoStock = producto.stock + consumo.cantidad

    const { error: errorUpdate } = await supabase
      .from('productos')
      .update({ stock: nuevoStock })
      .eq('id', consumo.producto_id)
    if (errorUpdate) throw new Error(errorUpdate.message)

    const { error: errorMov } = await supabase.from('movimientos_stock').insert({
      producto_id: consumo.producto_id,
      turno_id: turnoId || null,
      tipo: 'reposicion_consumo_eliminado',
      cantidad: consumo.cantidad,
      stock_resultante: nuevoStock,
      usuario_id: usuarioId || null
    })
    if (errorMov) throw new Error(errorMov.message)
  }
}
