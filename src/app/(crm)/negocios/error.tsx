"use client";

import { useEffect } from "react";

/**
 * Estado de error de Negocios (T5).
 * Captura cualquier excepción no controlada al renderizar y ofrece reintentar.
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
    <div className="empty" role="alert">
      <strong>No se pudieron cargar los negocios</strong>
      <p>Ocurrió un error inesperado. Intenta de nuevo.</p>
      <p>
        <button
          className="button primary min-h-[48px] px-6 text-sm font-semibold cursor-pointer"
          type="button"
          onClick={() => reset()}
        >
          Reintentar
        </button>
      </p>
    </div>
  );
}
