"use client";
import { useEffect, useState } from "react";
export function EstadoConexion() {
  const [offline, setOffline] = useState(false);
  useEffect(() => {
    const actualizar = () => setOffline(!navigator.onLine);
    actualizar(); window.addEventListener("online", actualizar); window.addEventListener("offline", actualizar);
    return () => { window.removeEventListener("online", actualizar); window.removeEventListener("offline", actualizar); };
  }, []);
  return offline ? <p role="status" className="panel p-3 mb-4">Sin conexión. Conserva esta pantalla y vuelve a intentarlo cuando recuperes la conexión.</p> : null;
}
