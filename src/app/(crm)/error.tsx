"use client";

import { useEffect } from "react";

/**
 * Estado de error genérico del grupo `(crm)` (T5). Cubre los doce módulos que
 * no tienen su propio `error.tsx` (agenda, tareas, propiedades, configuración,
 * etc.); los tres que sí lo tienen (contactos, leads, pipeline) lo sobreescriben
 * con uno más específico. Convención nativa de Next 15 (`error.tsx` es
 * obligatoriamente cliente): captura cualquier excepción no controlada al
 * renderizar el módulo y ofrece reintentar sin recargar toda la página.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="empty">
      <strong>No se pudo cargar esta sección</strong>
      <p>Ocurrió un error inesperado. Intenta de nuevo.</p>
      <p>
        <button className="button primary" type="button" onClick={() => reset()}>
          Reintentar
        </button>
      </p>
    </div>
  );
}
