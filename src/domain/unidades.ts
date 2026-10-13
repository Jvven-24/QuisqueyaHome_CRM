import { ValidationError } from "./errors.ts";

/** S-303-N: identidad provisional compartida por cierre y backfill. */
export function normalizarCodigoUnidad(code: string): string {
  const resultado = code.normalize("NFKC").normalize("NFD").replace(/\p{M}/gu, "")
    .trim().toUpperCase().replace(/[\s_\-‐‑–—−]+/gu, "-");
  if (!resultado) throw new ValidationError("El código de unidad no puede estar en blanco.");
  return resultado;
}
