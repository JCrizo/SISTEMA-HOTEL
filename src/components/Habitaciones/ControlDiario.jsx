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
    <div className="w-full">
      {/* Opcional: Info de fecha y turno */}
      <div className="flex justify-between items-center mb-4 px-2">
        <h3 className="text-lg font-bold text-gray-800">Control de Habitaciones</h3>
        <div className="flex gap-4 text-sm font-semibold text-gray-500">
          <span>{fechaStr}</span>
          <span>•</span>
          <span>Turno {nombreTurno}</span>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden overflow-x-auto w-full">
        <table className="w-full text-sm text-left whitespace-nowrap">
          <thead className="bg-gray-50/80 text-gray-500 font-semibold uppercase text-[10px] tracking-wider">
            <tr>
              <th className="px-4 py-4 min-w-[120px]">Tipo Habit.</th>
              <th className="px-4 py-4 text-center">N° Habit.</th>
              <th className="px-4 py-4 min-w-[300px] w-full">Descripción / Huésped</th>
              <th className="px-4 py-4 text-center min-w-[120px]">N° Ficha</th>
              <th className="px-4 py-4 text-right min-w-[100px]">Monto</th>
              <th className="px-4 py-4 text-center min-w-[120px]">Estado de Pago</th>
              <th className="px-4 py-4 text-center min-w-[120px]">Ingreso</th>
              <th className="px-4 py-4 text-center min-w-[120px]">Salida</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {habitaciones.map((hab) => {
              let descripcion = '';
              let badgeStatus = null;
              
              if (hab.estado === 'ocupada' && hab.datosHospedaje) {
                descripcion = hab.datosHospedaje.nombre || '';
              } else if (hab.estado === 'en_limpieza' || hab.estado === 'pendiente_limpieza' || hab.estado === 'limpieza_simple') {
                badgeStatus = 'Limpieza';
              } else if (hab.estado === 'mantenimiento') {
                badgeStatus = 'Mantenimiento';
              }

              const h = hab.datosHospedaje || {};
              
              let tipoPagoText = '';
              let badgePagoColor = '';
              
              if (hab.estado === 'ocupada' && h.estado_pago) {
                if (h.estado_pago === 'pendiente') {
                  tipoPagoText = 'Debe';
                  badgePagoColor = 'bg-red-50 text-red-600 border border-red-100';
                } else if (h.estado_pago === 'parcial') {
                  tipoPagoText = 'A cuenta';
                  badgePagoColor = 'bg-orange-50 text-orange-600 border border-orange-100';
                } else {
                  tipoPagoText = h.metodo_pago ? h.metodo_pago.charAt(0).toUpperCase() + h.metodo_pago.slice(1) : 'Pagado';
                  badgePagoColor = 'bg-emerald-50 text-emerald-600 border border-emerald-100';
                }
              }

              return (
                <tr key={hab.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-700">{hab.tipo_actual}</td>
                  <td className="px-4 py-3 text-center font-bold text-gray-900">{hab.numero}</td>
                  <td className="px-4 py-3">
                    {hab.estado === 'ocupada' ? (
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold">
                          {descripcion.charAt(0)}
                        </div>
                        <span className="font-semibold text-gray-800">{descripcion}</span>
                      </div>
                    ) : badgeStatus ? (
                      <span className="inline-block px-2.5 py-1 text-xs font-bold rounded-lg bg-gray-100 text-gray-600">
                        {badgeStatus}
                      </span>
                    ) : (
                      <span className="text-gray-400 italic text-xs">Disponible</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center text-gray-600 font-medium">
                    {h.nro_ficha ? `#${h.nro_ficha}` : '-'}
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-gray-700">
                    {hab.estado === 'ocupada' ? formatearMonto(h.tarifa_pactada) : '-'}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {tipoPagoText ? (
                      <span className={`inline-block px-3 py-1 rounded-full text-[11px] font-bold tracking-wide ${badgePagoColor}`}>
                        {tipoPagoText}
                      </span>
                    ) : '-'}
                  </td>
                  <td className="px-4 py-3 text-center text-gray-500 text-xs font-medium">
                    {formatoFecha(h.ingreso) || '-'}
                  </td>
                  <td className="px-4 py-3 text-center text-gray-500 text-xs font-medium">
                    {formatoFecha(h.salida_estimada) || '-'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Resumen de Caja */}
      <div className="mt-6 flex flex-wrap gap-4 items-center justify-between bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
        <div className="flex gap-8">
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase">Caja Anterior</p>
            <p className="text-lg font-black text-gray-800">{formatearMonto(turnoActivo?.caja_inicial)}</p>
          </div>
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase">Caja Actual</p>
            <p className="text-lg font-black text-blue-600">{formatearMonto(turnoActivo?.caja_principal_actual)}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs font-bold text-gray-400 uppercase">Responsable de Turno</p>
          <p className="text-sm font-bold text-gray-700 capitalize">{turnoActivo?.usuario_nombre || 'Sin usuario'}</p>
        </div>
      </div>
    </div>
  );
}
