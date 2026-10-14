/**
 * M03 §7 · Antigüedad de un negocio en su etapa actual a partir de stageChangedAt.
 * Diferencia temporal en días completos; nulo muestra «Sin fecha de etapa»,
 * fecha futura inconsistente se señala.
 */
export type TipoAntiguedad = "sin-fecha" | "futura" | "dias";

export function tipoAntiguedad(
  fechaIso: string | Date | null | undefined,
  ahora = new Date(),
): TipoAntiguedad {
  if (!fechaIso) return "sin-fecha";
  const fecha = typeof fechaIso === "string" ? new Date(fechaIso) : fechaIso;
  if (Number.isNaN(fecha.getTime())) return "sin-fecha";
  return fecha.getTime() > ahora.getTime() ? "futura" : "dias";
}

export function diasEnEtapa(
  fechaIso: string | Date | null | undefined,
  ahora = new Date(),
): number | null {
  if (tipoAntiguedad(fechaIso, ahora) !== "dias") return null;
  const fecha = typeof fechaIso === "string" ? new Date(fechaIso) : (fechaIso as Date);
  return Math.floor((ahora.getTime() - fecha.getTime()) / (1000 * 60 * 60 * 24));
}

export function calcularAntiguedad(
  fechaIso: string | Date | null | undefined,
  ahora = new Date(),
): string {
  const tipo = tipoAntiguedad(fechaIso, ahora);
  if (tipo === "sin-fecha") return "Sin fecha de etapa";
  if (tipo === "futura") return "Fecha futura";
  const dias = diasEnEtapa(fechaIso, ahora) as number;
  if (dias === 0) return "Hoy";
  if (dias === 1) return "1 día";
  return `${dias} días`;
}
