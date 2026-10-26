"use client";

import { useEffect } from "react";

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
      <strong>No se pudo cargar Academy</strong>
      <p>Ocurrió un error inesperado al consultar la ruta de aprendizaje. Intenta de nuevo.</p>
      <p>
        <button
          className="button primary min-h-12 px-6 text-[13.5px] font-bold focus-visible:outline-2 focus-visible:outline-gold-700"
          type="button"
          onClick={() => reset()}
        >
          Reintentar
        </button>
      </p>
    </div>
  );
}
