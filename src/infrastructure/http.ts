/**
 * Traducción de errores de dominio a respuestas HTTP (T4).
 *
 * Es el único lugar donde el dominio se convierte en códigos de estado. Un
 * route handler hace `try { … } catch (e) { return errorResponse(e) }` y no
 * decide nada por su cuenta.
 */

import { z } from "zod";
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
  ValidationError,
} from "@/domain/errors";

/**
 * Uno o dos ids de la URL (`/recurso/[id]` o `/recurso/[id]/hijo/[hijoId]`),
 * ya validados como enteros positivos, o 404 (hallazgo del ponytail-audit:
 * este parseo estaba repetido en tres route handlers).
 *
 * El segundo id es opcional porque `api/proyectos/[id]/fases/route.ts` solo
 * necesita el primero (`POST` bajo un proyecto, sin `faseId` en la ruta); ahí
 * se devuelve `NaN` sin validar, igual que antes de compartir este parseo.
 */
export function idsDeRuta(idParam: string, hijoIdParam?: string): [number, number] {
  const id = Number(idParam);
  if (!Number.isInteger(id) || id <= 0) throw new NotFoundError();
  if (hijoIdParam === undefined) return [id, NaN];

  const hijoId = Number(hijoIdParam);
  if (!Number.isInteger(hijoId) || hijoId <= 0) throw new NotFoundError();
  return [id, hijoId];
}

/**
 * "" desde un formulario que se vació equivale a `null` (borrar el campo),
 * no a un valor literal vacío. `campos` es la lista de claves donde el
 * handler de edición permite ese borrado (hallazgo del ponytail-audit: esta
 * función estaba repetida idéntica en siete route handlers, solo cambiaba la
 * lista de campos).
 */
export function vaciosANull(cuerpo: unknown, campos: string[]): unknown {
  if (typeof cuerpo !== "object" || cuerpo === null) return cuerpo;
  const copia: Record<string, unknown> = { ...(cuerpo as Record<string, unknown>) };
  for (const campo of campos) {
    if (copia[campo] === "") copia[campo] = null;
  }
  return copia;
}

export function errorResponse(error: unknown): Response {
  if (error instanceof ValidationError) {
    return json(400, { error: error.message, fields: error.fields });
  }
  if (error instanceof UnauthorizedError) {
    return json(401, { error: error.message });
  }
  if (error instanceof ForbiddenError) {
    return json(403, { error: error.message });
  }
  if (error instanceof NotFoundError) {
    return json(404, { error: error.message });
  }
  if (error instanceof ConflictError) {
    return json(409, { error: error.message, details: error.details });
  }

  // Un error no previsto no se le enseña al usuario: puede llevar la cadena de
  // conexión o el SQL. Se registra completo y se responde genérico.
  console.error("Error no controlado:", error);
  return json(500, { error: "Ocurrió un error inesperado." });
}

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

/**
 * Valida la entrada de un caso de uso. Toda escritura pasa por aquí: sin esto,
 * cada módulo inventaría su propia forma de comprobar los datos y ninguna
 * sería revisable.
 */
export function parseInput<T>(schema: z.ZodType<T>, input: unknown): T {
  const result = schema.safeParse(input);
  if (result.success) return result.data;

  const fields: Record<string, string> = {};
  for (const issue of result.error.issues) {
    const key = issue.path.join(".") || "_";
    fields[key] ??= issue.message;
  }
  throw new ValidationError("Revisa los datos enviados.", fields);
}
