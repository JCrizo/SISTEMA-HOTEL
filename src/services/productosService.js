import { supabase } from '../lib/supabase'

export const productosService = {
  async obtenerTodos() {
    const { data, error } = await supabase
      .from('productos')
      .select('*, categorias_producto(id, nombre)')
      .order('nombre')
    
    if (error) throw new Error(error.message)
    return data || []
  },

  async crearProducto(datos) {
    const { error } = await supabase.from('productos').insert({
      nombre: datos.nombre.trim(),
      precio: parseFloat(datos.precio),
      stock: parseInt(datos.stock || 0),
      categoria_id: datos.categoriaId || null,
      activo: true
    })
    if (error) throw new Error(error.message)
  },

  async actualizarProducto(id, datos) {
    const { error } = await supabase.from('productos').update({
      nombre: datos.nombre.trim(),
      precio: parseFloat(datos.precio),
      stock: parseInt(datos.stock || 0),
      categoria_id: datos.categoriaId || null
    }).eq('id', id)
    if (error) throw new Error(error.message)
  },

  async cambiarEstadoActivo(id, activoActual) {
    const { error } = await supabase
      .from('productos')
      .update({ activo: !activoActual })
      .eq('id', id)
    if (error) throw new Error(error.message)
  },

  async ajustarStock(producto, cantidad, turnoId, usuarioId) {
    const nuevoStock = Math.max(0, producto.stock + cantidad)
    
    const { error: errorProd } = await supabase
      .from('productos')
      .update({ stock: nuevoStock })
      .eq('id', producto.id)
    if (errorProd) throw new Error(errorProd.message)

    const { error: errorMov } = await supabase
      .from('movimientos_stock')
      .insert({
        producto_id: producto.id,
        turno_id: turnoId || null,
        tipo: 'ajuste_manual',
        cantidad,
        stock_resultante: nuevoStock,
        usuario_id: usuarioId || null
      })
    if (errorMov) throw new Error(errorMov.message)
  }
}
