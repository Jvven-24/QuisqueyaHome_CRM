"use client";

export function ErrorG3({ reset }: { reset: () => void }) {
  return <div className="empty" role="alert">
    <strong>No se pudo cargar la información</strong>
    <p>Comprueba tu conexión e inténtalo de nuevo.</p>
    <button type="button" className="button secondary" onClick={reset}>Reintentar</button>
  </div>;
}
