"use client";
import { useOnline } from "../_ui/analytics-state";
export default function ErrorConfiguracion({ reset }: { reset: () => void }) {
  const online = useOnline();
  return <section role="alert"><h1>{online ? "No se pudo cargar la configuración" : "Sin conexión"}</h1><p>{online ? "Inténtalo de nuevo. Si el problema continúa, contacta al administrador." : "Conéctate a internet para volver a cargar los ajustes."}</p><button type="button" onClick={reset} disabled={!online} title={!online ? "Conéctate para volver a intentar." : undefined}>Reintentar</button><a href="/inicio">Volver al inicio</a></section>;
}
