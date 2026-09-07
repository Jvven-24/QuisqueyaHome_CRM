/**
 * Errores del dominio (T4). Sin dependencias: se lanzan desde reglas de negocio
 * y casos de uso, y cada adaptador decide cómo presentarlos.
 *
 * La regla: un caso de uso lanza uno de estos, nunca un `Error` genérico ni un
 * objeto `{ ok: false }`. Así el adaptador de entrada traduce una sola vez y
 * ningún módulo inventa su propio formato de error.
 */

export class DomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}

/** La entrada no cumple el contrato. `fields` alimenta el error por campo en el formulario. */
export class ValidationError extends DomainError {
  // Campo declarado aparte y no como propiedad de parámetro: el dominio se
  // ejecuta con el borrado de tipos de Node (`npm test`), que no admite esa
  // forma de TypeScript.
  fields: Record<string, string>;

  constructor(message: string, fields: Record<string, string> = {}) {
    super(message);
    this.fields = fields;
  }
}

/** Hay sesión, pero el permiso no alcanza. Criterio de terminado #1: se decide en servidor. */
export class ForbiddenError extends DomainError {
  constructor(message = "No tienes permiso para esta acción.") {
    super(message);
  }
}

/** No hay sesión, o expiró. */
export class UnauthorizedError extends DomainError {
  constructor(message = "Necesitas iniciar sesión.") {
    super(message);
  }
}

/**
 * El registro no existe **o** existe y el alcance del usuario no lo alcanza.
 * Los dos casos devuelven lo mismo a propósito: distinguirlos le confirmaría a
 * un broker que el negocio de otro broker existe.
 */
export class NotFoundError extends DomainError {
  constructor(message = "No se encontró el registro.") {
    super(message);
  }
}

/**
 * La operación choca con el estado actual: duplicado, transición de etapa
 * inválida. `details` es opcional y libre a propósito: el primer caso (M1,
 * duplicados de contacto) necesita devolver la lista de candidatos junto al
 * mensaje, y M2 reutiliza esta misma clase para lo mismo con leads
 * (`docs/contexto/decisiones.md` #19) — forzar aquí una forma fija de
 * "candidatos" acoplaría el dominio a un solo caso de uso.
 */
export class ConflictError extends DomainError {
  details?: unknown;

  constructor(message: string, details?: unknown) {
    super(message);
    this.details = details;
  }
}
