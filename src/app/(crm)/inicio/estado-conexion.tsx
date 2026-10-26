"use client";

import { useEffect, useState } from "react";

export function EstadoConexion() {
  const [sinConexion, setSinConexion] = useState(false);
  useEffect(() => {
    const actualizar = () => setSinConexion(!navigator.onLine);
    actualizar();
    window.addEventListener("online", actualizar);
    window.addEventListener("offline", actualizar);
    return () => {
      window.removeEventListener("online", actualizar);
      window.removeEventListener("offline", actualizar);
    };
  }, []);
  return sinConexion ? <p role="status" className="rounded-xl border border-warning/40 bg-warning-bg p-3 text-sm text-warning">Sin conexión a internet. Se muestran los últimos datos cargados; los cambios necesitan conexión para guardarse.</p> : null;
}
