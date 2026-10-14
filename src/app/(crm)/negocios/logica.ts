/**
 * Lógica pura de la vista de Negocios (sin React, sin red): agrupación por
 * etapa, totales por divisa, estado de contenido y datos del Análisis.
 * Solo trabaja con lo que el servidor ya entregó (DTO por rol): si un monto no
 * viene, aquí tampoco se inventa.
 */
import type { CatalogosNegocios, FilaNegocio, ResumenEtapaNegocio } from "@/application/pipeline/puertos";
import { diasEnEtapa } from "./antiguedad.ts";

export type Etapa = CatalogosNegocios["etapas"][number];
export type TotalDivisa = { currency: string; count: number; amountCents?: number };
export type ColumnaEtapa = {
  etapa: Etapa;
  /** Tarjetas realmente cargadas en esta página de resultados. */
  filas: FilaNegocio[];
  /** Total real de la etapa (resumen del servidor, con los mismos filtros). */
  total: number;
  totales: TotalDivisa[];
};

/** Tarjetas visibles por etapa antes de «Ver más». */
export const LIMITE_POR_ETAPA = 20;

export function totalesPorEtapa(resumen: ResumenEtapaNegocio[], etapaId: number): TotalDivisa[] {
  const mapa = new Map<string, TotalDivisa>();
  for (const r of resumen) {
    if (r.stageId !== etapaId) continue;
    const previo = mapa.get(r.currency) ?? { currency: r.currency, count: 0 };
    previo.count += r.count;
    if (r.amountCents !== undefined) previo.amountCents = (previo.amountCents ?? 0) + r.amountCents;
    mapa.set(r.currency, previo);
  }
  return [...mapa.values()];
}

export function armarColumnas(etapas: Etapa[], filas: FilaNegocio[], resumen: ResumenEtapaNegocio[]): ColumnaEtapa[] {
  return etapas.map((etapa) => {
    const totales = totalesPorEtapa(resumen, etapa.id);
    return {
      etapa,
      filas: filas.filter((f) => f.stageId === etapa.id),
      total: totales.reduce((suma, t) => suma + t.count, 0),
      totales,
    };
  });
}

/** Valor de los negocios activos (kind = open) por divisa; nunca mezcla monedas. */
export function valorActivoPorDivisa(resumen: ResumenEtapaNegocio[]): { currency: string; amountCents: number }[] {
  const mapa = new Map<string, number>();
  for (const r of resumen) {
    if (r.kind !== "open" || r.amountCents === undefined) continue;
    mapa.set(r.currency, (mapa.get(r.currency) ?? 0) + r.amountCents);
  }
  return [...mapa].map(([currency, amountCents]) => ({ currency, amountCents }));
}

export function totalNegocios(resumen: ResumenEtapaNegocio[]): number {
  return resumen.reduce((suma, r) => suma + r.count, 0);
}

export type EstadoContenido = "cartera-vacia" | "sin-resultados" | "con-datos";
/** Distingue una cartera sin negocios de unos filtros que no encuentran ninguno. */
export function estadoContenido(total: number, hayFiltros: boolean): EstadoContenido {
  if (total > 0) return "con-datos";
  return hayFiltros ? "sin-resultados" : "cartera-vacia";
}

/* ----------------------------- Análisis ----------------------------- */

export type PuntoConteo = { id: string; label: string; count: number };
export function conteoPorEtapa(etapas: Etapa[], resumen: ResumenEtapaNegocio[]): PuntoConteo[] {
  return etapas.map((e) => ({
    id: String(e.id),
    label: e.name,
    count: totalesPorEtapa(resumen, e.id).reduce((s, t) => s + t.count, 0),
  }));
}

export function monedasDelResumen(resumen: ResumenEtapaNegocio[]): string[] {
  return [...new Set(resumen.map((r) => r.currency))].sort();
}

export type PuntoValor = { id: string; label: string; unidades: number };
/** Valor (en unidades de la divisa, no centavos) por etapa para UNA divisa. `null` si el rol no recibe montos. */
export function valorPorEtapa(etapas: Etapa[], resumen: ResumenEtapaNegocio[], currency: string): PuntoValor[] | null {
  if (resumen.length > 0 && resumen.every((r) => r.amountCents === undefined)) return null;
  return etapas.map((e) => ({
    id: String(e.id),
    label: e.name,
    unidades: resumen.filter((r) => r.stageId === e.id && r.currency === currency)
      .reduce((s, r) => s + (r.amountCents ?? 0), 0) / 100,
  }));
}

export type Resultados = { abiertos: number; ganados: number; perdidos: number };
export function resultadosDelResumen(resumen: ResumenEtapaNegocio[]): Resultados {
  const out: Resultados = { abiertos: 0, ganados: 0, perdidos: 0 };
  for (const r of resumen) {
    if (r.kind === "open") out.abiertos += r.count;
    else if (r.kind === "won") out.ganados += r.count;
    else out.perdidos += r.count;
  }
  return out;
}

export type ResumenPonderado = {
  /** Suma de monto × probabilidad / 100, en unidades de la divisa. */
  unidades: number;
  considerados: number;
  sinProbabilidad: number;
  sinMonto: number;
};
/** Valor ponderado de negocios ABIERTOS de una divisa; excluye (y cuenta) los que no tienen dato. */
export function valorPonderado(filas: FilaNegocio[], currency: string): ResumenPonderado {
  const out: ResumenPonderado = { unidades: 0, considerados: 0, sinProbabilidad: 0, sinMonto: 0 };
  for (const f of filas) {
    if (f.stageKind !== "open" || f.currency !== currency) continue;
    if (f.amountCents === undefined || f.amountCents === null) { out.sinMonto += 1; continue; }
    if (f.probability === null) { out.sinProbabilidad += 1; continue; }
    out.unidades += (f.amountCents * f.probability) / 10000;
    out.considerados += 1;
  }
  return out;
}

export type PuntoAntiguedad = { id: string; label: string; dias: number | null; conFecha: number; sinFecha: number };
/** Días promedio en etapa por etapa abierta, solo con negocios que tienen stageChangedAt. */
export function antiguedadPorEtapa(etapas: Etapa[], filas: FilaNegocio[], ahora = new Date()): PuntoAntiguedad[] {
  return etapas.filter((e) => e.kind === "open").map((e) => {
    let suma = 0, conFecha = 0, sinFecha = 0;
    for (const f of filas) {
      if (f.stageId !== e.id) continue;
      const dias = diasEnEtapa(f.stageChangedAt, ahora);
      if (dias === null) sinFecha += 1; else { suma += dias; conFecha += 1; }
    }
    return { id: String(e.id), label: e.name, dias: conFecha ? Math.round((suma / conFecha) * 10) / 10 : null, conFecha, sinFecha };
  });
}

/* ------------------------------ Lista ------------------------------- */

export const CAMPOS_ORDEN = ["createdAt", "amountCents", "id"] as const;
export type CampoOrden = (typeof CAMPOS_ORDEN)[number];
export function siguienteOrden(
  actual: { campo: string; direccion: string },
  campo: CampoOrden,
): { campo: CampoOrden; direccion: "asc" | "desc" } {
  if (actual.campo === campo) return { campo, direccion: actual.direccion === "asc" ? "desc" : "asc" };
  return { campo, direccion: campo === "id" ? "asc" : "desc" };
}

/* Alias de tipos del DTO que consumen las piezas de la vista. */
export type MotivoPerdida = CatalogosNegocios["motivos"][number];
export type NegocioFila = FilaNegocio;
export type { InteresNegocio as PropiedadDeal, ProyectoDisponibleNegocio as ProyectoOpcion } from "@/application/pipeline/puertos";
