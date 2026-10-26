import type { CrmPort, RefExterna } from "../../../application/compartido/crm.ts";

/** Fila reclamada de la cola; el manejador recibe solo esto, nunca la conexión. */
export type PendienteOutbox = {
  eventId: string; eventType: string; aggregateId: number; payload: unknown;
  version: number; correlationId: string; idempotencyKey: string; attempts: number;
};

/** Dependencias que el worker entrega a los manejadores. Un destino nuevo amplía este tipo, no el worker. */
export type ContextoConsumo = { crm: CrmPort };
export type ResultadoConsumo = { ref: RefExterna; entityType: string; localId: number };

/**
 * Procesa un evento de un tipo. Lanza `FalloCrm` (o cualquier error) si falla: el worker clasifica,
 * reintenta con backoff y solo al agotar reintentos (o fallo no reintentable) lo manda a la cola muerta.
 */
export type Manejador = (evento: PendienteOutbox, contexto: ContextoConsumo) => Promise<ResultadoConsumo>;

/** Un destino declara los tipos de evento que consume: tipo -> manejador. */
export type ConsumidorOutbox = { destino: string; manejadores: Readonly<Record<string, Manejador>> };

export interface RegistroConsumidores {
  /** Tipos con manejador; es lo único que la cola puede reclamar. */
  tipos(): readonly string[];
  manejadorDe(tipo: string): Manejador | undefined;
}

/**
 * Un tipo solo puede tener un consumidor: la fila del outbox no guarda estado por destino todavía
 * (ver I00), así que repartir un tipo entre dos destinos lo marcaría enviado a medias.
 */
export function crearRegistro(consumidores: readonly ConsumidorOutbox[]): RegistroConsumidores {
  const mapa = new Map<string, { destino: string; manejador: Manejador }>();
  for (const consumidor of consumidores) {
    for (const [tipo, manejador] of Object.entries(consumidor.manejadores)) {
      const previo = mapa.get(tipo);
      if (previo) throw new Error(`Tipo de evento "${tipo}" declarado por dos consumidores (${previo.destino} y ${consumidor.destino}).`);
      mapa.set(tipo, { destino: consumidor.destino, manejador });
    }
  }
  const tipos = Object.freeze([...mapa.keys()].sort());
  return { tipos: () => tipos, manejadorDe: (tipo) => mapa.get(tipo)?.manejador };
}
