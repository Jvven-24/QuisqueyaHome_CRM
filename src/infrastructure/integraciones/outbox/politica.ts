import { FalloCrm } from "../../../application/compartido/crm.ts";
import { ConflictError } from "../../../domain/errors.ts";
import type { ClaseFalloCrm } from "../../../application/compartido/crm.ts";

export const POLITICA_OUTBOX = { maxIntentos: 5, baseMs: 1_000, capMs: 60_000 } as const;

export function clasificarFallo(error: unknown): ClaseFalloCrm {
  if (error instanceof FalloCrm) return error.clase;
  if (error instanceof ConflictError) return "NON_RETRYABLE";
  // Incluye timeout de resultado desconocido: reconciliar antes de reenviar.
  return "HUMAN_REQUIRED";
}

export function decidirReintento(error: unknown, intento: number, random: () => number = Math.random):
  { clase: ClaseFalloCrm; esperaMs: number | null } {
  const clase = clasificarFallo(error);
  if (clase !== "RETRYABLE" || intento >= POLITICA_OUTBOX.maxIntentos) return { clase, esperaMs: null };
  const techo = Math.min(POLITICA_OUTBOX.capMs, POLITICA_OUTBOX.baseMs * 2 ** Math.max(0, intento - 1));
  const jitter = Math.floor(Math.max(0, Math.min(1, random())) * techo);
  const retryAfter = error instanceof FalloCrm && Number.isFinite(error.retryAfterMs)
    ? Math.max(0, error.retryAfterMs!) : 0;
  return { clase, esperaMs: Math.max(jitter, retryAfter) };
}
