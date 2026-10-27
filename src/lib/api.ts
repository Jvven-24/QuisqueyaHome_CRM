/**
 * Cliente de API tipado para los componentes de cliente (R5.1, etapa B).
 *
 * Por qué existe: hoy cada vista hace su propio `fetch('/api…')` y parsea el
 * error a su manera (`cuerpo.error ?? "No se pudo…"`, `cuerpo.fields ?? {…}`,
 * `cuerpo.details?.candidatos`). Si `errorResponse`
 * (`src/infrastructure/http.ts`) cambia la forma del error, habría que
 * perseguir el cambio en una veintena de archivos. Aquí se traduce UNA vez:
 *
 * - 400 → `{ error, fields }`   (`fields`: mensaje por campo, de Zod)
 * - 401/403/404/500 → `{ error }`
 * - 409 → `{ error, details }`  (`details` es libre; p. ej. `{ candidatos }`)
 *
 * y cualquier otra cosa (cuerpo que no es JSON, respuesta vacía, corte de red)
 * se vuelve también un `ErrorDeApi`, con el `status` real y un mensaje en
 * español, en vez de un `SyntaxError` confuso.
 *
 * No importa nada de `src/infrastructure/` ni de `next/headers`: es código de
 * navegador.
 *
 * Uso:
 *   try { await post<Contacto>("/api/contactos", datos); router.refresh(); }
 *   catch (e) { if (e instanceof ErrorDeApi) setErrores(e.fields ?? { _: e.mensaje }); }
 */

/** Error de una llamada a la API. `status` 0 significa que no hubo respuesta (red caída). */
export class ErrorDeApi extends Error {
  readonly status: number;
  readonly mensaje: string;
  /** Mensaje por campo; solo en 400 (`ValidationError`). */
  readonly fields?: Record<string, string>;
  /** Datos libres del conflicto; solo en 409 (`ConflictError`). */
  readonly details?: unknown;

  constructor(
    status: number,
    mensaje: string,
    extra: { fields?: Record<string, string>; details?: unknown } = {},
  ) {
    super(mensaje);
    this.name = "ErrorDeApi";
    this.status = status;
    this.mensaje = mensaje;
    this.fields = extra.fields;
    this.details = extra.details;
  }
}

const MENSAJE_GENERICO = "No se pudo completar la operación. Inténtalo de nuevo.";

function esObjeto(valor: unknown): valor is Record<string, unknown> {
  return typeof valor === "object" && valor !== null && !Array.isArray(valor);
}

function camposValidos(valor: unknown): Record<string, string> | undefined {
  if (!esObjeto(valor)) return undefined;
  const campos: Record<string, string> = {};
  for (const [clave, mensaje] of Object.entries(valor)) {
    if (typeof mensaje === "string") campos[clave] = mensaje;
  }
  return campos;
}

const VACIO = Symbol("vacio");
const INVALIDO = Symbol("invalido");

/** Lee el cuerpo como JSON; distingue "vacío" de "no es JSON". */
async function leerJson(respuesta: Response): Promise<unknown | typeof VACIO | typeof INVALIDO> {
  const texto = await respuesta.text().catch(() => "");
  if (!texto.trim()) return VACIO;
  try {
    return JSON.parse(texto);
  } catch {
    return INVALIDO;
  }
}

async function pedir<T>(
  metodo: "GET" | "POST" | "PATCH" | "DELETE",
  url: string,
  cuerpo?: unknown,
): Promise<T> {
  let respuesta: Response;
  try {
    respuesta = await fetch(url, {
      method: metodo,
      headers: cuerpo === undefined ? undefined : { "content-type": "application/json" },
      body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo),
    });
  } catch {
    throw new ErrorDeApi(0, "No hay conexión con el servidor. Revisa tu red e inténtalo de nuevo.");
  }

  const json = await leerJson(respuesta);

  if (!respuesta.ok) {
    if (esObjeto(json) && typeof json.error === "string") {
      throw new ErrorDeApi(respuesta.status, json.error, {
        fields: respuesta.status === 400 ? camposValidos(json.fields) : undefined,
        details: respuesta.status === 409 ? json.details : undefined,
      });
    }
    throw new ErrorDeApi(respuesta.status, MENSAJE_GENERICO);
  }

  // Éxito sin cuerpo (204, o un DELETE que no devuelve nada): no es un error.
  // Un cuerpo presente pero que no es JSON sí lo es: el contrato se rompió.
  if (json === VACIO) return undefined as T;
  if (json === INVALIDO) {
    throw new ErrorDeApi(respuesta.status, "El servidor respondió con un formato inesperado.");
  }
  return json as T;
}

/** `GET`. `T` es la forma de la respuesta de éxito. */
export function get<T>(url: string): Promise<T> {
  return pedir<T>("GET", url);
}

/** `POST` con cuerpo JSON opcional. */
export function post<T = void>(url: string, cuerpo?: unknown): Promise<T> {
  return pedir<T>("POST", url, cuerpo);
}

/** `PATCH` con cuerpo JSON. */
export function patch<T = void>(url: string, cuerpo: unknown): Promise<T> {
  return pedir<T>("PATCH", url, cuerpo);
}

/** `DELETE` (se llama `del` porque `delete` es palabra reservada). */
export function del<T = void>(url: string): Promise<T> {
  return pedir<T>("DELETE", url);
}
