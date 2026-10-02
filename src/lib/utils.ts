import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combina clases condicionales (`clsx`) y resuelve conflictos entre utilidades
 * de Tailwind (`twMerge`): `cn("px-2", cond && "px-4")` deja solo `px-4`.
 * Es la función que usan todas las primitivas de shadcn/ui para aceptar un
 * `className` externo sin que se pisen las clases base.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
