import Icono from './Icono'

// Encabezado compacto para pantallas de detalle (Check-In, Habitación, Reservas, Ficha...).
// Reemplaza a la barra blanca con flecha: ya existe la barra superior global.
// children = acciones a la derecha (botones, selectores).
export default function EncabezadoPagina({ titulo, subtitulo, onVolver, tituloVolver = 'Volver', children }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        {onVolver && (
          <button
            onClick={onVolver}
            title={tituloVolver}
            aria-label={tituloVolver}
            className="btn btn-secondary !px-0 w-11 sm:w-10 !min-h-[44px] sm:!min-h-[40px] shrink-0"
          >
            <Icono name="chevronLeft" className="w-5 h-5" />
          </button>
        )}
        <div className="min-w-0">
          <h1 className="page-title truncate">{titulo}</h1>
          {subtitulo && <p className="page-sub truncate">{subtitulo}</p>}
        </div>
      </div>
      {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
    </div>
  )
}
