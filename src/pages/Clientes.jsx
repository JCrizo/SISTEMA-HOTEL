import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { clientesService } from '../services/clientesService';

export default function Clientes() {
  const navigate = useNavigate();
  const [clientes, setClientes] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  
  const [busqueda, setBusqueda] = useState('');
  const [pagina, setPagina] = useState(0);
  const porPagina = 20;

  const [mostrarFormNuevo, setMostrarFormNuevo] = useState(false);
  const [editandoId, setEditandoId] = useState(null);

  // Form states
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

  const handleGuardarNuevo = async (e) => {
    e.preventDefault();
    if (!formData.nombres || !formData.dni_pasaporte) {
        alert('Nombre y DNI/Pasaporte son requeridos');
        return;
    }
    
    setGuardando(true);
    try {
      const { tipo_documento, ...datosParaGuardar } = formData;
      await clientesService.crearCliente({
        ...datosParaGuardar,
        tarifa_habitual: datosParaGuardar.tarifa_habitual ? parseFloat(datosParaGuardar.tarifa_habitual) : null
      });
      setMostrarFormNuevo(false);
      setFormData(initialFormState);
      setPagina(0);
      cargarClientes(busqueda, 0);
    } catch (error) {
      console.error('Error al guardar cliente:', error);
      alert('Error al guardar el cliente');
    } finally {
      setGuardando(false);
    }
  };

  const handleGuardarEdicion = async (e, id) => {
    e.preventDefault();
    setGuardando(true);
    try {
      const { tipo_documento, ...datosParaActualizar } = formData;
      await clientesService.actualizarCliente(id, {
        ...datosParaActualizar,
        tarifa_habitual: datosParaActualizar.tarifa_habitual ? parseFloat(datosParaActualizar.tarifa_habitual) : null
      });
      setEditandoId(null);
      setFormData(initialFormState);
      cargarClientes(busqueda, 0);
      setPagina(0);
    } catch (error) {
      console.error('Error al actualizar cliente:', error);
      alert('Error al actualizar el cliente');
    } finally {
      setGuardando(false);
    }
  };

  const iniciarEdicion = (cliente) => {
    setEditandoId(cliente.id);
    setFormData({
      tipo_documento: 'DNI',
      dni_pasaporte: cliente.dni_pasaporte || '',
      nombres: cliente.nombres || '',
      telefono: cliente.telefono || '',
      nacionalidad: cliente.nacionalidad || '',
      tarifa_habitual: cliente.tarifa_habitual || ''
    });
    setMostrarFormNuevo(false);
  };

  const cancelarEdicion = () => {
    setEditandoId(null);
    setFormData(initialFormState);
  };

  const handleEliminar = async (id, nombre) => {
    if (window.confirm(`¿Estás seguro de que deseas eliminar al cliente ${nombre}?`)) {
      try {
        await clientesService.eliminarCliente(id);
        cargarClientes(busqueda, 0);
        setPagina(0);
      } catch (error) {
        console.error('Error al eliminar cliente:', error);
        alert('Error al eliminar el cliente');
      }
    }
  };

  const renderForm = (isEdit = false, id = null) => (
    <form onSubmit={(e) => isEdit ? handleGuardarEdicion(e, id) : handleGuardarNuevo(e)} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 mb-6">
      <h3 className="text-lg font-bold text-gray-800 mb-4 tracking-tight">
        {isEdit ? 'Editar Cliente' : 'Nuevo Cliente'}
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Documento *</label>
          <div className="flex">
            <select
              name="tipo_documento"
              value={formData.tipo_documento}
              onChange={handleInputChange}
              className="bg-gray-50 border border-gray-300 border-r-0 text-gray-900 text-sm rounded-l-xl focus:ring-blue-500 focus:border-blue-500 block p-2.5"
            >
              <option value="DNI">DNI</option>
              <option value="Pasaporte">Pasap.</option>
              <option value="Otro">Otro</option>
            </select>
            <input
              type="text"
              name="dni_pasaporte"
              value={formData.dni_pasaporte}
              onChange={handleInputChange}
              required
              className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-r-xl focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
              placeholder="Número..."
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nombre Completo *</label>
          <input
            type="text"
            name="nombres"
            value={formData.nombres}
            onChange={handleInputChange}
            required
            className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-xl focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
            placeholder="Nombres y apellidos"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
          <input
            type="text"
            name="telefono"
            value={formData.telefono}
            onChange={handleInputChange}
            className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-xl focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
            placeholder="+54 9 11 1234-5678"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nacionalidad</label>
          <input
            type="text"
            name="nacionalidad"
            value={formData.nacionalidad}
            onChange={handleInputChange}
            className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-xl focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
            placeholder="Ej: Argentina, Brasil..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tarifa Habitual (S/)</label>
          <input
            type="number"
            inputMode="decimal"
            name="tarifa_habitual"
            value={formData.tarifa_habitual}
            onChange={handleInputChange}
            onWheel={(e) => e.target.blur()}
            onFocus={(e) => e.target.select()}
            className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-xl focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
            placeholder="0.00"
          />
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={isEdit ? cancelarEdicion : () => setMostrarFormNuevo(false)}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 focus:ring-4 focus:ring-gray-200"
          disabled={guardando}
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-xl hover:bg-green-700 focus:ring-4 focus:ring-green-300 disabled:opacity-50"
          disabled={guardando}
        >
          {guardando ? 'Guardando...' : (isEdit ? 'Guardar Cambios' : 'Guardar')}
        </button>
      </div>
    </form>
  );

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      <header className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-10 mb-6">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <button onClick={() => navigate('/')} className="p-2 rounded-full hover:bg-gray-100 text-gray-600 transition-colors" title="Volver">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <div>
            <h1 className="text-xl font-black text-gray-800 tracking-tight">Gestión de Clientes</h1>
            <p className="text-sm text-gray-500">Busca, registra y administra los datos de tus huéspedes</p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4">
        {/* Top Section */}
        <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center mb-6">
          <div className="relative w-full md:w-96">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="search"
              className="block w-full p-3 pl-10 text-sm text-gray-900 border border-gray-300 rounded-2xl bg-white focus:ring-blue-500 focus:border-blue-500 shadow-sm"
              placeholder="Buscar por nombre o DNI..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>
          
          <button
            onClick={() => {
              setFormData(initialFormState);
              setMostrarFormNuevo(!mostrarFormNuevo);
              setEditandoId(null);
            }}
            className="w-full md:w-auto px-5 py-3 bg-blue-600 text-white text-sm font-bold rounded-2xl shadow-sm hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 transition-colors"
          >
            + Nuevo Cliente
          </button>
        </div>

        {!loading && (
          <div className="mb-4 text-sm font-medium text-gray-500">
            {totalCount} cliente{totalCount !== 1 ? 's' : ''} encontrado{totalCount !== 1 ? 's' : ''}
          </div>
        )}

        {/* New Client Form */}
        {mostrarFormNuevo && !editandoId && renderForm()}

        {/* Loading State */}
        {loading && clientes.length === 0 ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : null}

        {/* Empty State */}
        {!loading && clientes.length === 0 && (
          <div className="text-center py-16 bg-white rounded-3xl border border-gray-100 shadow-sm">
            <span className="text-4xl block mb-3">🔍</span>
            <h3 className="text-lg font-bold text-gray-800 mb-1">No se encontraron clientes</h3>
            <p className="text-gray-500 text-sm">Intenta con otra búsqueda o crea un nuevo cliente.</p>
          </div>
        )}

        {/* List of Clients */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {clientes.map((cliente) => (
            editandoId === cliente.id ? (
              <div key={cliente.id} className="md:col-span-2">
                {renderForm(true, cliente.id)}
              </div>
            ) : (
              <div key={cliente.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-black text-gray-800 leading-tight">
                      {cliente.nombres}
                    </h3>
                    {cliente.lista_negra && (
                      <span className="bg-red-100 text-red-800 text-xs font-bold px-2 py-1 rounded-full whitespace-nowrap ml-2">
                        Lista Negra
                      </span>
                    )}
                  </div>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-sm text-gray-600">
                      <span className="bg-gray-100 text-gray-700 text-xs font-medium px-2 py-0.5 rounded border border-gray-200 mr-2">
                        {cliente.dni_pasaporte}
                      </span>
                    </div>
                    
                    {cliente.telefono && (
                      <div className="flex items-center text-sm text-gray-600">
                        <svg className="w-4 h-4 mr-1.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                        {cliente.telefono}
                      </div>
                    )}
                    
                    {cliente.nacionalidad && (
                      <div className="flex items-center text-sm text-gray-600">
                        <svg className="w-4 h-4 mr-1.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        {cliente.nacionalidad}
                      </div>
                    )}

                    <div className="flex flex-wrap gap-2 mt-2">
                      {cliente.tarifa_habitual != null && (
                        <span className="bg-green-50 text-green-700 text-xs font-medium px-2 py-1 rounded-md border border-green-100">
                          Tarifa habitual: S/{cliente.tarifa_habitual}
                        </span>
                      )}
                      
                      {cliente.deuda_pendiente > 0 && (
                        <span className="bg-orange-50 text-orange-700 text-xs font-medium px-2 py-1 rounded-md border border-orange-100">
                          Deuda: S/{cliente.deuda_pendiente}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-2 border-t border-gray-50 pt-3 mt-2">
                  <button
                    onClick={() => iniciarEdicion(cliente)}
                    className="px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleEliminar(cliente.id, cliente.nombres)}
                    className="px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            )
          ))}
        </div>

        {/* Load More Button */}
        {clientes.length < totalCount && (
          <div className="flex justify-center mt-8">
            <button
              onClick={handleCargarMas}
              disabled={loading}
              className="px-6 py-2.5 bg-white border border-gray-300 text-gray-700 text-sm font-bold rounded-xl shadow-sm hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              {loading ? 'Cargando...' : 'Cargar más'}
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
