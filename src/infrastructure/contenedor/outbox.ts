import type { EstadoOutbox } from "@/application/compartido/outbox-estado";
import { getDb } from "@/infrastructure/db/client";
import { consultarEstadoOutbox } from "@/infrastructure/integraciones/outbox/estado";

/** Conteos reales de la cola para la pantalla de Integraciones (solo lectura). */
export function estadoOutbox(): Promise<EstadoOutbox> {
  return consultarEstadoOutbox(getDb());
}
