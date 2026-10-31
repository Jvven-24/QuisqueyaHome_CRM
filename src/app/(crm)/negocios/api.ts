/**
 * Cliente mínimo de las rutas de Negocios. Traduce cada respuesta a un mensaje
 * entendible y nunca lanza: el que llama decide qué conserva en pantalla.
 * El estado de la interfaz solo cambia cuando el servidor confirmó (`ok: true`).
 */
export type RespuestaApi = { ok: true } | { ok: false; estado: number; error: string; requisito?: boolean };

/**
 * Un 409 de versión («la etapa cambió desde que abriste el negocio») se
 * resuelve actualizando la página. Cualquier otro 409 es un requisito de la
 * etapa destino (actividad de contacto, próxima acción, propiedad, monto…) y
 * se resuelve completando ese dato en el negocio: actualizar no lo arregla.
 */
export function esConflictoDeVersion(mensajeServidor?: string): boolean {
  return /cambió desde que abriste|ya está cerrado|no existe en el embudo/i.test(mensajeServidor ?? "");
}

export function mensajeDeEstado(estado: number, mensajeServidor?: string): string {
  if (estado === 401) return "Tu sesión expiró. Vuelve a iniciar sesión; lo que escribiste en este formulario sigue aquí.";
  if (estado === 403) return "Tu rol no tiene permiso para esta acción.";
  if (estado === 404) return "El negocio ya no está disponible para ti. Actualiza la página.";
  if (estado === 409 && mensajeServidor && !esConflictoDeVersion(mensajeServidor)) return `${mensajeServidor} Abre el negocio, completa ese dato y vuelve a moverlo.`;
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
    const requisito = respuesta.status === 409 && Boolean(datos.error) && !esConflictoDeVersion(datos.error);
    return { ok: false, estado: respuesta.status, error: mensajeDeEstado(respuesta.status, datos.error), ...(requisito ? { requisito } : {}) };
  } catch {
    return { ok: false, estado: 0, error: "No se pudo contactar al servidor. No se confirmó ningún cambio; reintenta." };
  }
}
