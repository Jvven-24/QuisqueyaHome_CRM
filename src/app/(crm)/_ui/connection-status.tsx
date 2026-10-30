"use client";
import { useState } from "react";
import { Wifi, WifiOff } from "lucide-react";
import { useOnline } from "./analytics-state";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export function ConnectionStatus() {
  const online = useOnline();
  const [checked, setChecked] = useState(false);
  // Con red no se pinta nada: la franja «Red disponible» ocupaba una fila en
  // cada pantalla sin aportar. Solo aparece cuando el dispositivo pierde red.
  if (online) return null;
  return <div className={online ? "private-connection" : "private-connection is-offline"}>
    <span role="status">{online ? <Wifi className="size-4" aria-hidden /> : <WifiOff className="size-4" aria-hidden />}{online ? "Red disponible" : "Sin conexión · las acciones requieren servidor"}</span>
    <Dialog><DialogTrigger asChild><button type="button">Sincronización</button></DialogTrigger><DialogContent><DialogHeader><DialogTitle>Estado de sincronización</DialogTitle><DialogDescription>El indicador refleja la conexión del dispositivo; no garantiza que el servidor esté disponible.</DialogDescription></DialogHeader><div className="space-y-3 text-sm"><p><strong>{online ? "Dispositivo conectado" : "Dispositivo sin conexión"}</strong></p><p>Vista previa · falta: cola persistente de operaciones, reintentos y resolución de conflictos. No hay operaciones almacenadas para enviar sin conexión.</p><p>Los cambios solo se confirman tras la respuesta del servidor. Si una operación falló, revisa el registro antes de repetirla.</p><button type="button" className="button" onClick={() => setChecked(true)}>Revisar estado del dispositivo</button>{checked && <p role="status">{online ? "El navegador informa que hay red disponible." : "El navegador sigue sin conexión. Revisa tu red y vuelve a intentarlo."}</p>}</div></DialogContent></Dialog>
  </div>;
}
