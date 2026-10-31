import React, { useState, useEffect, useCallback } from 'react';
import { clientesService } from '../services/clientesService';
import Icono from '../components/Compartido/Icono'

export default function Clientes() {
  const [clientes, setClientes] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  
  const [busqueda, setBusqueda] = useState('');
  const [pagina, setPagina] = useState(0);
  const porPagina = 20;

  // Vista: 'tabla' o 'tarjetas'
  const [vista, setVista] = useState('tabla');

  // Modal de creación / edición
  const [modalAbierto, setModalAbierto] = useState(false);
  const [editandoCliente, setEditandoCliente] = useState(null);

  const initialFormState = {
    tipo_documento: 'DNI',
    dni_pasaporte: '',
    nombres: '',
    telefono: '',
    nacionalidad: '',
    tarifa_habitual: ''
  };
  const [formData, setFormData] = useState(initialFormState);
  const [guardando, setGuardando] = useState(false);
  const [errorForm, setErrorForm] = useState('');

  const cargarClientes = useCallback(async (busquedaActual, paginaActual, append = false) => {
    try {
      setLoading(!append);
      const res = await clientesService.listarClientes(busquedaActual, paginaActual, porPagina);
      if (res) {
        if (append) {
          setClientes(prev => [...prev, ...(res.data || [])]);
        } else {
          setClientes(res.data || []);
        }
        setTotalCount(res.count || 0);
      }
    } catch (error) {
      console.error('Error al cargar clientes:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      setPagina(0);
      cargarClientes(busqueda, 0);
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [busqueda, cargarClientes]);

  const handleCargarMas = () => {
    const nuevaPagina = pagina + 1;
    setPagina(nuevaPagina);
    cargarClientes(busqueda, nuevaPagina, true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const abrirModalNuevo = () => {
    setEditandoCliente(null);
    setFormData(initialFormState);
    setErrorForm('');
    setModalAbierto(true);
  };

  const abrirModalEditar = (cliente) => {
    setEditandoCliente(cliente);
    setFormData({
      tipo_documento: 'DNI',
      dni_pasaporte: cliente.dni_pasaporte || '',
      nombres: cliente.nombres || '',
      telefono: cliente.telefono || '',
      nacionalidad: cliente.nacionalidad || '',
      tarifa_habitual: cliente.tarifa_habitual != null ? String(cliente.tarifa_habitual) : ''
    });
    setErrorForm('');
    setModalAbierto(true);
  };

  const cerrarModal = () => {
    setModalAbierto(false);
    setEditandoCliente(null);
    setFormData(initialFormState);
    setErrorForm('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorForm('');

    if (!formData.nombres.trim() || !formData.dni_pasaporte.trim()) {
      setErrorForm('El nombre y el DNI/Pasaporte son obligatorios');
      return;
    }
    
    setGuardando(true);
    try {
      const { tipo_documento, ...datosParaGuardar } = formData;
      const payload = {
        ...datosParaGuardar,
        nombres: datosParaGuardar.nombres.trim(),
        dni_pasaporte: datosParaGuardar.dni_pasaporte.trim(),
        telefono: datosParaGuardar.telefono.trim() || null,
        nacionalidad: datosParaGuardar.nacionalidad.trim() || null,
        tarifa_habitual: datosParaGuardar.tarifa_habitual ? parseFloat(datosParaGuardar.tarifa_habitual) : null
      };

      if (editandoCliente) {
        await clientesService.actualizarCliente(editandoCliente.id, payload);
      } else {
        await clientesService.crearCliente(payload);
      }

      cerrarModal();
      setPagina(0);
      cargarClientes(busqueda, 0);
    } catch (error) {
      console.error('Error al guardar cliente:', error);
      setErrorForm(error.message || 'Error al guardar los datos del cliente');
    } finally {
      setGuardando(false);
    }
  };

  const handleEliminar = async (id, nombre) => {
    if (window.confirm(`¿Estás seguro de que deseas eliminar al huésped "${nombre}"? Esta acción no se puede deshacer.`)) {
      try {
        await clientesService.eliminarCliente(id);
        setPagina(0);
        cargarClientes(busqueda, 0);
      } catch (error) {
        console.error('Error al eliminar cliente:', error);
        alert('No se pudo eliminar el cliente. Es posible que tenga registros o reservas asociadas.');
      }
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Encabezado Principal Integrado */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-800 tracking-tight">Directorio de Huéspedes</h1>
          <p className="text-xs sm:text-sm text-gray-500 font-medium">Gestiona el padrón de clientes, documentos y tarifas preferenciales</p>
        </div>

        <button
          onClick={abrirModalNuevo}
          className="w-full sm:w-auto px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold rounded-xl shadow-xs transition-all active:scale-95 flex items-center justify-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
          </svg>
          <span>Nuevo Huésped</span>
        </button>
      </div>

      {/* Barra de Búsqueda y Switcher de Vistas */}
      <div className="bg-white rounded-2xl border border-gray-100 p-3 sm:p-4 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Buscador */}
          <div className="relative w-full sm:w-96">
            <svg className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="search"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar por nombre, DNI o pasaporte..."
              className="w-full bg-gray-50/80 border border-gray-200/80 rounded-xl pl-9 pr-8 py-2 text-xs sm:text-sm font-medium outline-none focus:border-blue-500 focus:bg-white transition-all"
            />
            {busqueda && (
              <button 
                onClick={() => setBusqueda('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs font-bold"
              >
                <Icono name="x" className="w-4 h-4 inline-block shrink-0" />
              </button>
            )}
          </div>

          {/* Selector de Vista (Tabla vs Tarjetas) */}
          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
            <div className="bg-gray-100 p-1 rounded-xl flex items-center shadow-inner">
              <button
                onClick={() => setVista('tabla')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                  vista === 'tabla' ? 'bg-white text-blue-600 shadow-2xs' : 'text-gray-500 hover:text-gray-700'
                }`}
                title="Vista tabla de datos"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
                <span>Tabla</span>
              </button>
              <button
                onClick={() => setVista('tarjetas')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                  vista === 'tarjetas' ? 'bg-white text-blue-600 shadow-2xs' : 'text-gray-500 hover:text-gray-700'
                }`}
                title="Vista tarjetas"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
                <span>Tarjetas</span>
              </button>
            </div>

            <span className="text-xs font-bold text-gray-500 bg-gray-50 px-2.5 py-1.5 rounded-lg border border-gray-100 whitespace-nowrap">
              {totalCount} huéspedes
            </span>
          </div>
        </div>
      </div>

      {/* Contenido: Tabla o Tarjetas */}
      {loading && clientes.length === 0 ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-sm text-gray-400 font-semibold">Cargando directorio...</span>
        </div>
      ) : clientes.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100 shadow-2xs">
          <span className="text-4xl block mb-2"><Icono name="user" className="w-10 h-10 inline-block shrink-0" /></span>
          <h3 className="text-base font-bold text-gray-800 mb-1">No se encontraron huéspedes</h3>
          <p className="text-gray-400 text-xs mb-4">No hay resultados que coincidan con "{busqueda}".</p>
          <button
            onClick={() => setBusqueda('')}
            className="px-4 py-2 bg-blue-50 text-blue-700 text-xs font-bold rounded-xl hover:bg-blue-100 transition-colors"
          >
            Ver todos los clientes
          </button>
        </div>
      ) : vista === 'tabla' ? (
        /* VISTA TABLA DATA-TABLE MODERNA */
        <div className="bg-white rounded-2xl border border-gray-100 shadow-2xs overflow-hidden overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-gray-50/80 text-gray-400 font-bold uppercase text-[10px] tracking-wider border-b border-gray-100">
              <tr>
                <th className="py-3 px-4">Huésped</th>
                <th className="py-3 px-4">Documento</th>
                <th className="py-3 px-4">Contacto</th>
                <th className="py-3 px-4">Nacionalidad</th>
                <th className="py-3 px-4 text-right">Tarifa Habitual</th>
                <th className="py-3 px-4 text-center">Estado</th>
                <th className="py-3 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-700 font-medium">
              {clientes.map(c => {
                const inicial = (c.nombres || 'C').charAt(0).toUpperCase();

                return (
                  <tr key={c.id} className="hover:bg-gray-50/60 transition-colors">
                    {/* Nombre y Avatar */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                          {inicial}
                        </div>
                        <span className="font-bold text-gray-800 text-xs sm:text-sm">{c.nombres}</span>
                      </div>
                    </td>

                    {/* DNI */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="font-semibold text-gray-700 bg-gray-50 px-2 py-0.5 rounded border border-gray-100 text-xs">
                        {c.dni_pasaporte}
                      </span>
                    </td>

                    {/* Teléfono */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      {c.telefono ? (
                        <div className="flex items-center gap-1.5 text-xs text-gray-600">
                          <span><Icono name="phone" className="w-4 h-4 inline-block shrink-0" /> {c.telefono}</span>
                          <a
                            href={`https://wa.me/51${c.telefono.replace(/\D/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-emerald-600 hover:text-emerald-700 font-bold ml-1"
                            title="Abrir chat de WhatsApp"
                          >
                            WhatsApp
                          </a>
                        </div>
                      ) : (
                        <span className="text-gray-400 italic text-xs">Sin teléfono</span>
                      )}
                    </td>

                    {/* Nacionalidad */}
                    <td className="py-3 px-4 text-xs text-gray-600 whitespace-nowrap">
                      {c.nacionalidad ? (
                        <span className="flex items-center gap-1">
                          <span><Icono name="globe" className="w-4 h-4 inline-block shrink-0" /></span> {c.nacionalidad}
                        </span>
                      ) : '-'}
                    </td>

                    {/* Tarifa habitual */}
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      {c.tarifa_habitual != null ? (
                        <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 text-xs">
                          S/ {parseFloat(c.tarifa_habitual).toFixed(2)}
                        </span>
                      ) : (
                        <span className="text-gray-400 text-xs">-</span>
                      )}
                    </td>

                    {/* Estado / Lista negra */}
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      {c.lista_negra ? (
                        <span className="bg-rose-50 text-rose-600 text-[10px] font-bold px-2 py-0.5 rounded-full border border-rose-200">
                          Lista Negra
                        </span>
                      ) : c.deuda_pendiente > 0 ? (
                        <span className="bg-amber-50 text-amber-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-200">
                          Debe S/ {c.deuda_pendiente}
                        </span>
                      ) : (
                        <span className="text-emerald-600 text-xs font-semibold">● Activo</span>
                      )}
                    </td>

                    {/* Acciones */}
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => abrirModalEditar(c)}
                          className="px-2.5 py-1 text-xs font-bold text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleEliminar(c.id, c.nombres)}
                          className="px-2.5 py-1 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        >
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        /* VISTA TARJETAS COMPACTAS (2-3 Columnas) */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {clientes.map(c => {
            const inicial = (c.nombres || 'C').charAt(0).toUpperCase();

            return (
              <div 
                key={c.id}
                className="bg-white rounded-2xl border border-gray-100 p-4 shadow-2xs hover:shadow-sm transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                        {inicial}
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-bold text-gray-800 text-sm truncate leading-snug">{c.nombres}</h3>
                        <p className="text-[11px] font-medium text-gray-400">Doc: {c.dni_pasaporte}</p>
                      </div>
                    </div>

                    {c.lista_negra && (
                      <span className="bg-rose-100 text-rose-700 text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0">
                        Alerta
                      </span>
                    )}
                  </div>

                  <div className="space-y-1 my-3 text-xs text-gray-600">
                    {c.telefono && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400">Tel:</span>
                        <div className="flex items-center gap-1 font-semibold">
                          <span>{c.telefono}</span>
                          <a
                            href={`https://wa.me/51${c.telefono.replace(/\D/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-emerald-600 font-bold ml-1 hover:underline text-[11px]"
                          >
                            WhatsApp
                          </a>
                        </div>
                      </div>
                    )}
                    {c.nacionalidad && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400">País:</span>
                        <span className="font-medium">{c.nacionalidad}</span>
                      </div>
                    )}
                    {c.tarifa_habitual != null && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400">Tarifa habitual:</span>
                        <span className="font-bold text-emerald-700">S/ {parseFloat(c.tarifa_habitual).toFixed(2)}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
                  <button
                    onClick={() => abrirModalEditar(c)}
                    className="px-3 py-1 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleEliminar(c.id, c.nombres)}
                    className="px-3 py-1 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Botón Cargar Más */}
      {clientes.length < totalCount && (
        <div className="flex justify-center pt-4">
          <button
            onClick={handleCargarMas}
            disabled={loading}
            className="px-6 py-2 bg-white border border-gray-200 text-gray-700 text-xs font-bold rounded-xl shadow-2xs hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            {loading ? 'Cargando más...' : `Cargar más (${clientes.length} de ${totalCount})`}
          </button>
        </div>
      )}

      {/* MODAL LIMPIO DE CREACIÓN / EDICIÓN */}
      {modalAbierto && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-100 animate-scale-up">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-lg font-black text-gray-800">
                  {editandoCliente ? 'Editar Huésped' : 'Nuevo Huésped'}
                </h3>
                <p className="text-xs text-gray-400 font-medium">Ingresa los datos para el registro en el sistema</p>
              </div>
              <button 
                onClick={cerrarModal}
                className="text-gray-400 hover:text-gray-600 font-bold text-lg p-1"
              >
                <Icono name="x" className="w-4 h-4 inline-block shrink-0" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1">
                    Documento (DNI/Pasaporte) *
                  </label>
                  <input
                    type="text"
                    name="dni_pasaporte"
                    required
                    value={formData.dni_pasaporte}
                    onChange={handleInputChange}
                    placeholder="Número de documento..."
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm font-semibold outline-none focus:border-blue-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1">
                    Nombres y Apellidos *
                  </label>
                  <input
                    type="text"
                    name="nombres"
                    required
                    value={formData.nombres}
                    onChange={handleInputChange}
                    placeholder="Nombre completo..."
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm font-semibold outline-none focus:border-blue-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1">
                    Teléfono / WhatsApp
                  </label>
                  <input
                    type="text"
                    name="telefono"
                    value={formData.telefono}
                    onChange={handleInputChange}
                    placeholder="Ej: 994611683"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-blue-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1">
                    Nacionalidad
                  </label>
                  <input
                    type="text"
                    name="nacionalidad"
                    value={formData.nacionalidad}
                    onChange={handleInputChange}
                    placeholder="Ej: Peruana, Argentina..."
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-blue-500 focus:bg-white"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-1">
                    Tarifa Habitual / Preferencial (S/)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    name="tarifa_habitual"
                    value={formData.tarifa_habitual}
                    onChange={handleInputChange}
                    placeholder="Ej: 80.00 (Opcional)"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-blue-500 focus:bg-white"
                  />
                  <span className="text-[11px] text-gray-400 mt-0.5 block">Se sugerirá automáticamente durante el Check-In si se define.</span>
                </div>
              </div>

              {errorForm && (
                <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-xs text-rose-600 font-bold">
                  <Icono name="alert" className="w-4 h-4 inline-block shrink-0" /> {errorForm}
                </div>
              )}

              <div className="flex gap-2 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={cerrarModal}
                  disabled={guardando}
                  className="flex-1 py-2.5 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardando}
                  className="flex-1 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all active:scale-[0.98] disabled:opacity-50"
                >
                  {guardando ? 'Guardando...' : editandoCliente ? 'Guardar Cambios' : 'Registrar Huésped'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
