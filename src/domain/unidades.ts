import { ValidationError } from "./errors.ts";

/** Porcentaje sobre el inventario real, acotado incluso ante datos inconsistentes. */
export function absorcionUnidades(total: number, disponibles: number): number {
  if (!Number.isFinite(total) || total <= 0 || !Number.isFinite(disponibles)) return 0;
  return Math.round(Math.min(1, Math.max(0, (total - disponibles) / total)) * 100);
}

/** S-303-N: identidad provisional compartida por cierre y backfill. */
export function normalizarCodigoUnidad(code: string): string {
  const resultado = code.normalize("NFKC").normalize("NFD").replace(/\p{M}/gu, "")
    .trim().toUpperCase().replace(/[\s_\-‐‑–—−]+/gu, "-");
  if (!resultado) throw new ValidationError("El código de unidad no puede estar en blanco.");
  return resultado;
}
