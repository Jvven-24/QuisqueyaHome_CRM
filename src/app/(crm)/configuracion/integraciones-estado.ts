import type { EstadoOutbox } from "../../../application/compartido/outbox-estado.ts";
export function estadoIntegracion(provider: string, status: string | undefined, outbox: EstadoOutbox | null): { texto: string; tono: "green" | "gold" | "neutral" | "red" } {
  if (provider === "outbox") {
    if (!outbox) return { texto: "No disponible", tono: "neutral" };
    if (outbox.fallidos > 0 || outbox.sinConsumidor > 0) return { texto: "Requiere atención", tono: "gold" };
    return { texto: "Cola disponible", tono: "neutral" };
  }
  if (!status || status === "disconnected") return { texto: "Sin configurar", tono: "neutral" };
  if (status === "connected") return { texto: "Cuenta registrada · sin verificar", tono: "neutral" };
  if (status === "pending") return { texto: "Pendiente", tono: "gold" };
  return { texto: "Con error", tono: "red" };
}
