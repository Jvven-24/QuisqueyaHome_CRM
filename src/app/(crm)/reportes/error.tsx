"use client";
import { useEffect, useState } from "react";
export default function ErrorState({ reset }: { reset: () => void }) {
  const [online, setOnline] = useState(true);
  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => { window.removeEventListener("online", update); window.removeEventListener("offline", update); };
  }, []);
  return <div className="empty" role="alert">
    <strong>{online ? "No se pudieron cargar los datos" : "Sin conexión"}</strong>
    <p>{online ? "No hay métricas disponibles. Reintenta la consulta." : "Revisa la conexión y vuelve a intentar."}</p>
    <button className="button primary" type="button" onClick={reset}>Reintentar</button>
  </div>;
}

