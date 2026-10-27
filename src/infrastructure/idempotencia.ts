/**
 * Idempotencia HTTP genérica para escrituras de la UI (auditoría 27/10/2026:
 * comisiones y metas enviaban `Idempotency-Key` y el servidor lo ignoraba).
 *
 * Usa `transaction_commands` (clave única por actor + operación + clave). Un
 * reintento con la misma clave y el mismo cuerpo devuelve `{ ok, replayed }` sin
 * repetir la escritura; con otro cuerpo, 409. Si la operación falla se libera
 * la clave para poder reintentar.
 */

import { createHash } from "node:crypto";

export type EstadoComando = { status: "processing" | "completed"; requestHash: string };

export interface AlmacenIdempotencia {
  /** `null` si se reservó la clave; si ya existía, su estado. */
  reservar(actorId: number, operation: string, key: string, requestHash: string): Promise<EstadoComando | null>;
  completar(actorId: number, operation: string, key: string, httpStatus: number): Promise<void>;
  liberar(actorId: number, operation: string, key: string): Promise<void>;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function claveIdempotencia(request: Request): string | null {
  const valor = request.headers.get("idempotency-key") ?? request.headers.get("x-idempotency-key");
  return valor && UUID.test(valor.trim()) ? valor.trim().toLowerCase() : null;
}

export function hashPeticion(operation: string, cuerpo: string): string {
  return createHash("sha256").update(operation).update("\n").update(cuerpo).digest("hex");
}

export async function ejecutarIdempotente(
  almacen: AlmacenIdempotencia,
  params: { actorId: number; operation: string; key: string | null; cuerpo: string },
  ejecutar: () => Promise<Response>,
): Promise<Response> {
  const { actorId, operation, key } = params;
  if (!key) return ejecutar();
  const hash = hashPeticion(operation, params.cuerpo);
  const existente = await almacen.reservar(actorId, operation, key, hash);
  if (existente) {
    if (existente.requestHash !== hash) {
      return Response.json({ error: "Clave de idempotencia ya utilizada con un contenido distinto." }, { status: 409 });
    }
    if (existente.status === "processing") {
      return Response.json({ error: "Esta operación ya se está procesando. Espera un momento." }, { status: 409 });
    }
    return Response.json({ ok: true, replayed: true });
  }
  let respuesta: Response;
  try {
    respuesta = await ejecutar();
  } catch (error) {
    await almacen.liberar(actorId, operation, key);
    throw error;
  }
  if (respuesta.ok) await almacen.completar(actorId, operation, key, respuesta.status);
  else await almacen.liberar(actorId, operation, key);
  return respuesta;
}
