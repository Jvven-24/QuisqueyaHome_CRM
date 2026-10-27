/**
 * Destino del guardado del modal de cita (revisión cruzada d7c592f). Si un POST
 * anterior ya creó la cita (p. ej. falló solo la sincronización con Google), el
 * siguiente guardado es un PATCH sobre ese id: nunca un segundo POST que
 * duplique la cita.
 */
export function destinoGuardadoCita(
  citaId: number | null | undefined,
  idCreado: number | null,
): { url: string; method: "POST" | "PATCH"; id: number | null } {
  const id = citaId != null && citaId > 0 ? citaId : idCreado;
  return id != null ? { url: `/api/actividades/${id}`, method: "PATCH", id } : { url: "/api/actividades", method: "POST", id: null };
}

/** Id de la actividad creada en la respuesta de `POST /api/actividades`, o `null`. */
export function idActividadCreada(cuerpo: unknown): number | null {
  const id = (cuerpo as { actividad?: { id?: unknown } } | null)?.actividad?.id;
  return typeof id === "number" && Number.isSafeInteger(id) && id > 0 ? id : null;
}
