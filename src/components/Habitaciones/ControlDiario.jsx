import React from 'react';

export default function ControlDiario({ habitaciones, turnoActivo }) {
  const formatoFecha = (isoString) => {
    if (!isoString) return '';
    const d = new Date(isoString);
    const dia = String(d.getDate()).padStart(2, '0');
    const mes = String(d.getMonth() + 1).padStart(2, '0');
    
    let hora = d.getHours();
    const min = String(d.getMinutes()).padStart(2, '0');
    const ampm = hora >= 12 ? 'pm' : 'am';
    hora = hora % 12;
    hora = hora ? hora : 12; // el 0 debe ser 12

    return `${dia}-${mes} ${hora}:${min}${ampm}`;
  };

  const formatearMonto = (monto) => {
    if (monto == null) return '';
    return `S/ ${parseFloat(monto).toFixed(2)}`;
  };

  const fechaActual = new Date();
  const fechaStr = `${String(fechaActual.getDate()).padStart(2, '0')} / ${String(fechaActual.getMonth() + 1).padStart(2, '0')} / ${String(fechaActual.getFullYear()).slice(2)}`;

  // Determinar el turno según la hora actual
  const horaActual = fechaActual.getHours();
  let nombreTurno = 'Mañana';
  if (horaActual >= 14 && horaActual < 22) {
    nombreTurno = 'Tarde';
  } else if (horaActual >= 22 || horaActual < 6) {
    nombreTurno = 'Noche';
  }

  return (
    <div className="w-full overflow-x-auto pb-4">
      <div className="bg-white p-4 sm:p-8 rounded-none border border-gray-300 shadow-sm min-w-[800px] mx-auto font-sans" style={{ maxWidth: '210mm' }}>
      
      {/* Cabecera Tipo Papel */}
      <div className="flex justify-between items-center mb-6 border-b-2 border-blue-900 pb-4">
        <div className="flex items-center gap-4">
          <div className="text-blue-900 font-black text-4xl tracking-tighter">
            O T I <br/>
            <span className="text-sm font-bold tracking-widest uppercase">Hotel</span>
          </div>
        </div>
        
        <div className="text-center">
          <h1 className="text-blue-900 font-black text-2xl tracking-widest uppercase">Control Diario</h1>
          <p className="text-xs text-blue-900 font-medium">Email: hoteloticajamarca@gmail.com</p>
        </div>

        <div className="text-right text-xs text-blue-900 font-medium">
          <p>Av. Miguel Grau N° 307</p>
          <p>Cel: (+51) 994 611 683</p>
          <p>Telf: (+51) 076-603 808</p>
        </div>
      </div>

      <div className="flex justify-between mb-4 text-sm font-bold text-blue-900 px-2">
        <p>FECHA: <span className="font-normal underline decoration-dashed underline-offset-4">{fechaStr}</span></p>
        <p>TURNO: <span className="font-normal underline decoration-dashed underline-offset-4">{nombreTurno}</span></p>
      </div>

      {/* Tabla */}
      <table className="w-full border-collapse border border-gray-800 text-xs mb-8">
        <thead>
          <tr className="bg-blue-50 text-blue-900">
            <th className="border border-gray-800 p-2 text-center w-24">Tipo Habit.</th>
            <th className="border border-gray-800 p-2 text-center w-16">N° Habit.</th>
            <th className="border border-gray-800 p-2 text-left">Descripción</th>
            <th className="border border-gray-800 p-2 text-center w-20">N° Ficha</th>
            <th className="border border-gray-800 p-2 text-right w-24">Monto</th>
            <th className="border border-gray-800 p-2 text-center w-24">Tipo de Pag</th>
            <th className="border border-gray-800 p-2 text-center w-24">F. Ingreso</th>
            <th className="border border-gray-800 p-2 text-center w-24">F. Salida</th>
          </tr>
        </thead>
        <tbody>
          {habitaciones.map((hab) => {
            let descripcion = '';
            if (hab.estado === 'ocupada' && hab.datosHospedaje) {
              descripcion = `Ocupado / ${hab.datosHospedaje.nombre || ''}`;
            } else if (hab.estado === 'en_limpieza' || hab.estado === 'pendiente_limpieza' || hab.estado === 'limpieza_simple') {
              descripcion = 'Limpieza';
            } else if (hab.estado === 'mantenimiento') {
              descripcion = 'Mantenimiento';
            }

            const h = hab.datosHospedaje || {};
            
            let tipoPagoText = '';
            let tipoPagoColor = 'text-gray-800';
            
            if (hab.estado === 'ocupada' && h.estado_pago) {
              if (h.estado_pago === 'pendiente') {
                tipoPagoText = 'Debe';
                tipoPagoColor = 'text-red-600 font-bold';
              } else if (h.estado_pago === 'parcial') {
                tipoPagoText = 'A cuenta';
                tipoPagoColor = 'text-orange-600 font-bold';
              } else {
                tipoPagoText = h.metodo_pago ? h.metodo_pago.charAt(0).toUpperCase() + h.metodo_pago.slice(1) : 'Pagado';
                tipoPagoColor = 'text-gray-800';
              }
            }

            return (
              <tr key={hab.id} className="hover:bg-gray-50 h-8">
                <td className="border border-gray-800 px-2 py-1 text-center font-medium">{hab.tipo_actual}</td>
                <td className="border border-gray-800 px-2 py-1 text-center font-bold bg-gray-50">{hab.numero}</td>
                <td className="border border-gray-800 px-2 py-1 font-medium">{descripcion}</td>
                <td className="border border-gray-800 px-2 py-1 text-center font-medium">{h.nro_ficha || ''}</td>
                <td className="border border-gray-800 px-2 py-1 text-right font-medium">{hab.estado === 'ocupada' ? formatearMonto(h.tarifa_pactada) : ''}</td>
                <td className={`border border-gray-800 px-2 py-1 text-center ${tipoPagoColor}`}>{tipoPagoText}</td>
                <td className="border border-gray-800 px-2 py-1 text-center whitespace-nowrap">{formatoFecha(h.ingreso)}</td>
                <td className="border border-gray-800 px-2 py-1 text-center whitespace-nowrap">{formatoFecha(h.salida_estimada)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Pie de página (Caja y Firmas) */}
      <div className="text-sm font-medium text-blue-900 mt-8 px-4">
        <div className="flex flex-wrap gap-x-8 gap-y-4 items-end justify-between mb-8">
          <div>
            <span className="font-bold">Caja Anterior: </span>
            <span className="underline decoration-dashed underline-offset-4 inline-block w-24 text-center text-gray-800">
              {formatearMonto(turnoActivo?.caja_inicial)}
            </span>
          </div>
          <div>
            <span className="font-bold">Caja Actual: </span>
            <span className="underline decoration-dashed underline-offset-4 inline-block w-24 text-center text-gray-800">
              {formatearMonto(turnoActivo?.caja_principal_actual)}
            </span>
          </div>
          <div>
            <span className="font-bold">Responsable: </span>
            <span className="underline decoration-dashed underline-offset-4 inline-block w-48 text-center text-gray-800 capitalize">
              {turnoActivo?.usuario_nombre || ''}
            </span>
          </div>
          <div className="flex gap-2 items-end">
            <span className="font-bold">Firma: </span>
            <div className="border-b-2 border-blue-900 border-dashed w-48 h-8"></div>
          </div>
        </div>

        <div className="space-y-4">
          <p className="font-bold">Notas:</p>
          <div className="w-full border-b border-gray-400 border-dashed h-6"></div>
          <div className="w-full border-b border-gray-400 border-dashed h-6"></div>
          <div className="w-full border-b border-gray-400 border-dashed h-6"></div>
        </div>
      </div>
      </div>
    </div>
  );
}
