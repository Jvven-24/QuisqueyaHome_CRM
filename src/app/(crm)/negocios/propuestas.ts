/**
 * Ofertas, comparador y propuesta (UI-016), lógica pura.
 * Una propuesta congela precio y condiciones (snapshot); cambiar el precio de
 * lista no altera una versión emitida. No bloquea inventario ni sustituye un
 * contrato. Las estimaciones llevan origen y fecha.
 */

export const MAX_COMPARAR = 4;

export type PlanOrientativo = { separacionPct: number; construccionPct: number; entregaPct: number };

export type OpcionUnidad = {
  id: number;
  proyecto: string;
  unidad: string;
  tipo: string;
  m2: number;
  habitaciones: number;
  banos: number;
  piso: number;
  vista: string;
  moneda: string;
  precioCents: number;
  gastosCierreCents: number;
  mantenimientoMensualCents: number;
  entrega: string;
  disponible: boolean;
  plan: PlanOrientativo;
};

export type Seleccion = { ids: number[]; error: string | null };

export function alternarSeleccion(actual: number[], id: number): Seleccion {
  if (actual.includes(id)) return { ids: actual.filter((x) => x !== id), error: null };
  if (actual.length >= MAX_COMPARAR) return { ids: actual, error: `Puedes comparar hasta ${MAX_COMPARAR} opciones. Quita una para añadir otra.` };
  return { ids: [...actual, id], error: null };
}

export function precioPorM2(o: OpcionUnidad): number {
  return o.m2 > 0 ? Math.round(o.precioCents / o.m2) : 0;
}

/** Destacados del comparador. Solo compara opciones en la misma moneda; si hay mezcla, no elige «mejor». */
export function destacados(opciones: OpcionUnidad[]): { menorPrecio: number | null; menorPrecioM2: number | null; mayorSuperficie: number | null; monedasMezcladas: boolean } {
  const monedas = new Set(opciones.map((o) => o.moneda));
  if (opciones.length === 0 || monedas.size > 1) {
    return { menorPrecio: null, menorPrecioM2: null, mayorSuperficie: opciones.length ? [...opciones].sort((a, b) => b.m2 - a.m2)[0]!.id : null, monedasMezcladas: monedas.size > 1 };
  }
  const min = (f: (o: OpcionUnidad) => number) => [...opciones].sort((a, b) => f(a) - f(b))[0]!.id;
  return { menorPrecio: min((o) => o.precioCents), menorPrecioM2: min(precioPorM2), mayorSuperficie: [...opciones].sort((a, b) => b.m2 - a.m2)[0]!.id, monedasMezcladas: false };
}

export type Cuotas = { separacionCents: number; construccionCents: number; entregaCents: number; valido: boolean };

/** Reparto orientativo del precio. El último tramo absorbe el redondeo para que sume exacto. */
export function cuotasPlan(precioCents: number, plan: PlanOrientativo): Cuotas {
  const suma = plan.separacionPct + plan.construccionPct + plan.entregaPct;
  const separacionCents = Math.round((precioCents * plan.separacionPct) / 100);
  const construccionCents = Math.round((precioCents * plan.construccionPct) / 100);
  return { separacionCents, construccionCents, entregaCents: precioCents - separacionCents - construccionCents, valido: suma === 100 };
}

export type Vigencia = "vigente" | "por-vencer" | "vencida";

/** `validaHasta` y `hoy` en `YYYY-MM-DD`. Por vencer: 3 días o menos. */
export function estadoVigencia(validaHasta: string, hoy: string): Vigencia {
  if (validaHasta < hoy) return "vencida";
  const dias = (Date.parse(`${validaHasta}T00:00:00Z`) - Date.parse(`${hoy}T00:00:00Z`)) / 86_400_000;
  return dias <= 3 ? "por-vencer" : "vigente";
}

export type EstadoPropuesta = "borrador" | "emitida" | "enviada" | "vista" | "aceptada" | "vencida" | "sustituida";

export const ETIQUETA_ESTADO_PROPUESTA: Record<EstadoPropuesta, string> = {
  borrador: "Borrador",
  emitida: "Emitida",
  enviada: "Enviada",
  vista: "Vista por el cliente",
  aceptada: "Aceptada",
  vencida: "Vencida",
  sustituida: "Sustituida por otra versión",
};

export type VersionPropuesta = {
  version: number;
  estado: EstadoPropuesta;
  emitidaEl: string;
  validaHasta: string;
  idioma: "es" | "en";
  destinatario: string;
  opciones: { unidadId: number; precioCongeladoCents: number; moneda: string }[];
};

/** ¿El precio de lista actual difiere del congelado? La versión emitida no cambia; se avisa y se propone nueva versión. */
export function diferenciasDePrecio(version: VersionPropuesta, precioActual: (unidadId: number) => number | undefined): { unidadId: number; congelado: number; actual: number }[] {
  return version.opciones.flatMap((o) => {
    const actual = precioActual(o.unidadId);
    return actual !== undefined && actual !== o.precioCongeladoCents ? [{ unidadId: o.unidadId, congelado: o.precioCongeladoCents, actual }] : [];
  });
}
