/**
 * Cliente mínimo de las rutas de Negocios. Traduce cada respuesta a un mensaje
 * entendible y nunca lanza: el que llama decide qué conserva en pantalla.
 * El estado de la interfaz solo cambia cuando el servidor confirmó (`ok: true`).
 */
export type RespuestaApi = { ok: true } | { ok: false; estado: number; error: string };

export function mensajeDeEstado(estado: number, mensajeServidor?: string): string {
  if (estado === 401) return "Tu sesión expiró. Vuelve a iniciar sesión; lo que escribiste en este formulario sigue aquí.";
  if (estado === 403) return "Tu rol no tiene permiso para esta acción.";
  if (estado === 404) return "El negocio ya no está disponible para ti. Actualiza la página.";
  if (estado === 409) return `${mensajeServidor ?? "La operación entra en conflicto con el estado actual."} Actualiza la página para ver el estado vigente antes de reintentar.`;
  if (estado === 400) return mensajeServidor ?? "Revisa los datos enviados.";
  return "Ocurrió un error inesperado. Reintenta en unos segundos.";
}

/** `ruta` es relativa al módulo, p. ej. `12/etapa`. */
export async function enviarJson(ruta: string, metodo: "PATCH" | "POST" | "DELETE", cuerpo: unknown): Promise<RespuestaApi> {
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    return { ok: false, estado: 0, error: "Sin conexión a internet. No se envió nada; lo que escribiste sigue aquí." };
  }
  try {
    const respuesta = await fetch(`/api/pipeline/${ruta}`, {
      method: metodo,
      headers: { "content-type": "application/json" },
      body: JSON.stringify(cuerpo),
    });
    if (respuesta.ok) return { ok: true };
    const datos = (await respuesta.json().catch(() => ({}))) as { error?: string };
    return { ok: false, estado: respuesta.status, error: mensajeDeEstado(respuesta.status, datos.error) };
  } catch {
    return { ok: false, estado: 0, error: "No se pudo contactar al servidor. No se confirmó ningún cambio; reintenta." };
  }
}
