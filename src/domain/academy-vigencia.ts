/**
 * M10 · Academy — Vigencia y recertificación de constancias.
 *
 * Lógica pura, sin base de datos. La constancia no guarda fecha de vencimiento:
 * se calcula a partir de `issued_at` y de la vigencia vigente. Así no hace falta
 * migración. Si la vigencia pasa a depender del curso, habrá que añadir la
 * columna y leerla aquí.
 *
 * Una constancia revocada nunca vuelve a vigente por el paso del tiempo.
 */

export const VIGENCIA_CONSTANCIA_MESES = 12;
export const VENTANA_RECERTIFICACION_DIAS = 60;

export type EstadoVigenciaConstancia = "vigente" | "por_vencer" | "vencida" | "revocada";

const MS_POR_DIA = 24 * 60 * 60 * 1000;

/** Fecha en la que la constancia deja de valer. Suma meses calendario en UTC. */
export function fechaVencimientoConstancia(
  emitidaEn: Date,
  meses: number = VIGENCIA_CONSTANCIA_MESES,
): Date {
  const vence = new Date(emitidaEn.getTime());
  vence.setUTCMonth(vence.getUTCMonth() + meses);
  return vence;
}

/**
 * Estado de una constancia en el instante `ahora`.
 * `por_vencer` cuando faltan `VENTANA_RECERTIFICACION_DIAS` o menos para vencer.
 */
export function estadoVigenciaConstancia(
  constancia: { status: "vigente" | "revocada"; issuedAt: Date },
  ahora: Date,
): EstadoVigenciaConstancia {
  if (constancia.status === "revocada") return "revocada";
  const vence = fechaVencimientoConstancia(constancia.issuedAt);
  if (ahora.getTime() >= vence.getTime()) return "vencida";
  const diasRestantes = (vence.getTime() - ahora.getTime()) / MS_POR_DIA;
  return diasRestantes <= VENTANA_RECERTIFICACION_DIAS ? "por_vencer" : "vigente";
}

/** Una constancia sirve como prueba de formación mientras no esté vencida ni revocada. */
export function constanciaAcreditaFormacion(estado: EstadoVigenciaConstancia): boolean {
  return estado === "vigente" || estado === "por_vencer";
}

/** Recertificar tiene sentido cuando la constancia vence pronto o ya venció. */
export function requiereRecertificacion(estado: EstadoVigenciaConstancia): boolean {
  return estado === "por_vencer" || estado === "vencida";
}
