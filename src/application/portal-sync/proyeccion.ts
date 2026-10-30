/** Proyección pública de un proyecto y su huella (hash canónico) para decidir si el portal está al día. */
import { createHash } from "node:crypto";
import type { EstadoUnidadPublico, ProyectoPublico, UnidadPublica } from "./tipos.ts";

export type FilaProyecto = {
  slug: string; name: string; zone: string | null; projectType: string; operationType: string; developer: string | null;
  description: string | null; estimatedDeliveryDate: string | null; progressPercent: number; currency: string;
  publicRangeMinCents: number | null; publicRangeMaxCents: number | null; videoUrl: string | null;
};
export type FilaUnidad = {
  code: string; unitType: string | null; bedrooms: number | null; bathrooms: number | null; builtAreaM2: number | null;
  floorLevel: number | null; tower: string | null; status: string; publicRangeMinCents: number | null; publicRangeMaxCents: number | null;
};

/** `sold` y `unavailable` no se distinguen hacia fuera: el portal solo promete lo que está libre. */
export const estadoPublico = (s: string): EstadoUnidadPublico => (s === "available" ? "available" : s === "reserved" ? "reserved" : "unavailable");

export function proyectarProyecto(p: FilaProyecto, unidades: FilaUnidad[]): ProyectoPublico {
  // Lista blanca explícita: un campo nuevo de la tabla no llega al portal por accidente.
  const units: UnidadPublica[] = unidades.map((u) => ({
    code: u.code, unitType: u.unitType, bedrooms: u.bedrooms, bathrooms: u.bathrooms, builtAreaM2: u.builtAreaM2, floorLevel: u.floorLevel,
    tower: u.tower, status: estadoPublico(u.status), publicPriceMinCents: u.publicRangeMinCents, publicPriceMaxCents: u.publicRangeMaxCents,
  })).sort((a, b) => a.code.localeCompare(b.code, "es", { numeric: true }));
  return {
    slug: p.slug, name: p.name, zone: p.zone, projectType: p.projectType, operationType: p.operationType, developer: p.developer,
    description: p.description, estimatedDeliveryDate: p.estimatedDeliveryDate, progressPercent: p.progressPercent, currency: p.currency,
    publicRangeMinCents: p.publicRangeMinCents, publicRangeMaxCents: p.publicRangeMaxCents, videoUrl: p.videoUrl, units,
  };
}

/** JSON con las claves ordenadas: misma información, misma huella. */
export function canonico(v: unknown): string {
  if (Array.isArray(v)) return `[${v.map(canonico).join(",")}]`;
  if (v && typeof v === "object") return `{${Object.keys(v).sort().map((k) => `${JSON.stringify(k)}:${canonico((v as Record<string, unknown>)[k])}`).join(",")}}`;
  return JSON.stringify(v ?? null);
}
export const huellaDe = (p: ProyectoPublico): string => createHash("sha256").update(canonico(p)).digest("hex");
