/**
 * M8 · Metas por alcance — cálculos puros: desglose de lo logrado por moneda,
 * avance de metas de proyecto/equipo y forma de la regla de atribución.
 * Sin base de datos: lo prueban `metas-alcances.test.ts`.
 */

export const ALCANCES_META = ["project", "team"] as const;
export type AlcanceMeta = (typeof ALCANCES_META)[number];

export const MONEDAS_META = ["USD", "DOP"] as const;
export type MonedaMeta = (typeof MONEDAS_META)[number];

export type LogroPorMoneda = { currency: string; deals: number; amountCents: number };

/**
 * Agrupa negocios ganados por moneda. Un negocio sin monto cuenta como cierre
 * pero no suma dinero. Nunca se mezclan monedas: cada una lleva su total.
 * Orden estable: USD, DOP y luego el resto alfabético.
 */
export function agruparLogroPorMoneda(
  negocios: readonly { currency: string | null; amountCents: number | null }[],
): LogroPorMoneda[] {
  const mapa = new Map<string, LogroPorMoneda>();
  for (const n of negocios) {
    const moneda = (n.currency ?? "USD").toUpperCase();
    const actual = mapa.get(moneda) ?? { currency: moneda, deals: 0, amountCents: 0 };
    actual.deals += 1;
    actual.amountCents += n.amountCents ?? 0;
    mapa.set(moneda, actual);
  }
  const orden = (m: string) => {
    const i = (MONEDAS_META as readonly string[]).indexOf(m);
    return i === -1 ? MONEDAS_META.length : i;
  };
  return [...mapa.values()].sort((a, b) => orden(a.currency) - orden(b.currency) || a.currency.localeCompare(b.currency));
}

/** Monto logrado en la moneda de la meta (las demás monedas no se convierten). */
export function logradoEnMoneda(desglose: readonly LogroPorMoneda[], moneda: string): number {
  return desglose.find((d) => d.currency === moneda)?.amountCents ?? 0;
}

/** Porcentaje de un objetivo de monto; `null` si no hay objetivo positivo. */
export function cumplimientoMonto(logradoCents: number, objetivoCents: number | null): number | null {
  if (objetivoCents == null || objetivoCents <= 0) return null;
  return Math.round((logradoCents / objetivoCents) * 100);
}

/** Estado legible del avance de una meta de cierres. */
export function estadoAvance(logrados: number, objetivo: number): "sin_meta" | "cumplida" | "en_curso" {
  if (objetivo <= 0) return "sin_meta";
  return logrados >= objetivo ? "cumplida" : "en_curso";
}

/** `"Equipo Punta Cana"` → `"equipo-punta-cana"`. */
export function slugEquipo(nombre: string): string {
  return nombre
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

/** Configuración que aplica el cierre al congelar la atribución. */
export const REGLA_PROYECTO = ["propiedad_principal"] as const;
export const REGLA_EQUIPO = ["equipo_del_broker_al_cierre", "sin_equipo"] as const;
export type ConfigAtribucion = {
  proyecto: (typeof REGLA_PROYECTO)[number];
  equipo: (typeof REGLA_EQUIPO)[number];
  conteo: "una_vez_por_negocio";
  periodo: "mes_de_cierre_santo_domingo";
};

export const CONFIG_ATRIBUCION_V1: ConfigAtribucion = {
  proyecto: "propiedad_principal",
  equipo: "equipo_del_broker_al_cierre",
  conteo: "una_vez_por_negocio",
  periodo: "mes_de_cierre_santo_domingo",
};

/** Lee una configuración guardada (jsonb); lo desconocido cae a la v1. */
export function leerConfigAtribucion(valor: unknown): ConfigAtribucion {
  const v = (valor ?? {}) as Record<string, unknown>;
  return {
    proyecto: "propiedad_principal",
    equipo: v.equipo === "sin_equipo" ? "sin_equipo" : "equipo_del_broker_al_cierre",
    conteo: "una_vez_por_negocio",
    periodo: "mes_de_cierre_santo_domingo",
  };
}

/** Siguiente versión de la regla: nunca reutiliza un número. */
export function siguienteVersion(versiones: readonly number[]): number {
  return versiones.length ? Math.max(...versiones) + 1 : 1;
}
