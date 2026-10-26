"use client";

import { useEffect, useState } from "react";

/** Conserva la pantalla al intentar navegar sin red, incluso desde el shell. */
export function EstadoConexion() {
  const [sinConexion, setSinConexion] = useState(false);
  useEffect(() => {
    const actualizar = () => setSinConexion(!navigator.onLine);
    const protegerNavegacion = (event: MouseEvent) => {
      const enlace = event.target instanceof Element ? event.target.closest("a[href]") : null;
      if (!navigator.onLine && enlace && !enlace.getAttribute("href")?.startsWith("#")) {
        event.preventDefault();
        event.stopPropagation();
        setSinConexion(true);
      }
    };
    actualizar();
    window.addEventListener("offline", actualizar);
    window.addEventListener("online", actualizar);
    document.addEventListener("click", protegerNavegacion, true);
    return () => {
      window.removeEventListener("offline", actualizar);
      window.removeEventListener("online", actualizar);
      document.removeEventListener("click", protegerNavegacion, true);
    };
  }, []);
  if (!sinConexion) return null;
  return <div role="status" className="mb-4 rounded-xl border border-amber-300 bg-amber-50 p-4 text-amber-950">
    <strong>Sin conexión</strong>
    <p>Conservamos la última pantalla. Comprueba tu conexión antes de continuar.</p>
    <button type="button" className="button secondary" onClick={() => setSinConexion(!navigator.onLine)}>Comprobar conexión</button>
  </div>;
}
