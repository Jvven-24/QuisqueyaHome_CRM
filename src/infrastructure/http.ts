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
