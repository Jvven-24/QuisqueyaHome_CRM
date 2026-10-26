/**
 * Negociación y aprobación comercial (UI-017), lógica pura.
 *
 * - El descuento que se evalúa es el EFECTIVO: diferencia de precio más
 *   incentivos y extras regalados, no solo el porcentaje visible.
 * - El nivel de aprobación sale de umbrales por porcentaje efectivo.
 * - Nadie aprueba su propia solicitud ni una por encima de su nivel.
 * - Una aprobación queda fijada a unidad, comprador, moneda, precio y vigencia:
 *   usarla para otra cosa es un conflicto con motivo (la API futura devolverá 409).
 */

export type Incentivo = { concepto: string; montoCents: number };

export type Descuento = {
  /** Diferencia de precio de lista menos precio solicitado. */
  descuentoPrecioCents: number;
  incentivosCents: number;
  totalCents: number;
  /** Porcentaje visible: solo la rebaja de precio. */
  porcentajeVisible: number;
  /** Porcentaje efectivo: rebaja + incentivos, sobre el precio base. */
  porcentajeEfectivo: number;
};

const redondear2 = (n: number) => Math.round(n * 100) / 100;

export function descuentoEfectivo(precioBaseCents: number, precioSolicitadoCents: number, incentivos: Incentivo[] = []): Descuento {
  if (!Number.isFinite(precioBaseCents) || precioBaseCents <= 0) {
    return { descuentoPrecioCents: 0, incentivosCents: 0, totalCents: 0, porcentajeVisible: 0, porcentajeEfectivo: 0 };
  }
  const descuentoPrecioCents = Math.max(0, precioBaseCents - Math.max(0, precioSolicitadoCents));
  const incentivosCents = incentivos.reduce((s, i) => s + Math.max(0, i.montoCents), 0);
  const totalCents = descuentoPrecioCents + incentivosCents;
  return {
    descuentoPrecioCents,
    incentivosCents,
    totalCents,
    porcentajeVisible: redondear2((descuentoPrecioCents / precioBaseCents) * 100),
    porcentajeEfectivo: redondear2((totalCents / precioBaseCents) * 100),
  };
}

export const NIVELES = ["agente", "gerente", "director", "comite"] as const;
export type NivelAprobacion = (typeof NIVELES)[number];

export const ETIQUETA_NIVEL: Record<NivelAprobacion, string> = {
  agente: "Sin aprobación (dentro del margen del agente)",
  gerente: "Gerente comercial",
  director: "Dirección",
  comite: "Comité de precios",
};

/** Umbral superior (inclusive) de porcentaje efectivo que puede autorizar cada nivel. */
export type Umbrales = { agente: number; gerente: number; director: number };

export function nivelRequerido(porcentajeEfectivo: number, umbrales: Umbrales): NivelAprobacion {
  if (porcentajeEfectivo <= umbrales.agente) return "agente";
  if (porcentajeEfectivo <= umbrales.gerente) return "gerente";
  if (porcentajeEfectivo <= umbrales.director) return "director";
  return "comite";
}

export type ResultadoPermiso = { ok: true } | { ok: false; motivo: string };

export function puedeAprobar(params: {
  solicitanteId: number;
  aprobadorId: number;
  nivelAprobador: NivelAprobacion;
  requerido: NivelAprobacion;
}): ResultadoPermiso {
  if (params.solicitanteId === params.aprobadorId) return { ok: false, motivo: "Nadie puede aprobar su propia solicitud." };
  if (NIVELES.indexOf(params.nivelAprobador) < NIVELES.indexOf(params.requerido)) {
    return { ok: false, motivo: `Este descuento necesita aprobación de ${ETIQUETA_NIVEL[params.requerido].toLocaleLowerCase("es")}.` };
  }
  return { ok: true };
}

export type AprobacionFijada = {
  unitId: number;
  compradorId: number;
  moneda: string;
  precioAprobadoCents: number;
  /** `YYYY-MM-DD`, inclusive. */
  vigenteHasta: string;
};

export type UsoAprobacion = { unitId: number; compradorId: number; moneda: string; precioCents: number; fecha: string };

/** Una aprobación no se reutiliza para otra unidad, otro comprador, otra moneda, un precio menor ni fuera de vigencia. */
export function validarUsoAprobacion(a: AprobacionFijada, uso: UsoAprobacion): ResultadoPermiso {
  if (a.unitId !== uso.unitId) return { ok: false, motivo: "La aprobación es para otra unidad. Hace falta una nueva solicitud." };
  if (a.compradorId !== uso.compradorId) return { ok: false, motivo: "La aprobación es para otro comprador. Hace falta una nueva solicitud." };
  if (a.moneda !== uso.moneda) return { ok: false, motivo: "La aprobación está en otra moneda. Un cambio de moneda es un cambio material." };
  if (uso.precioCents < a.precioAprobadoCents) return { ok: false, motivo: "El precio es menor que el aprobado. Un cambio material obliga a nueva revisión." };
  if (uso.fecha > a.vigenteHasta) return { ok: false, motivo: "La aprobación venció. Solicita una nueva revisión." };
  return { ok: true };
}

export type EstadoSolicitud = "pendiente" | "aprobada" | "rechazada" | "retirada";

export const ETIQUETA_ESTADO_SOLICITUD: Record<EstadoSolicitud, string> = {
  pendiente: "Pendiente",
  aprobada: "Aprobada",
  rechazada: "Rechazada",
  retirada: "Retirada",
};

/** Solo una solicitud sin resolver puede retirarse, aprobarse o rechazarse. */
export function transicionSolicitud(actual: EstadoSolicitud, destino: Exclude<EstadoSolicitud, "pendiente">): ResultadoPermiso {
  if (actual !== "pendiente") return { ok: false, motivo: `La solicitud ya está ${ETIQUETA_ESTADO_SOLICITUD[actual].toLocaleLowerCase("es")}; no cambia de estado.` };
  return destino ? { ok: true } : { ok: false, motivo: "Estado inválido." };
}
