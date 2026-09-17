/**
 * M8 · Metas — cálculos puros sobre `goals` (`docs/F3_ANALISIS_Y_PLAN.md` §4.1).
 *
 * El resto del módulo (consultas, `ON CONFLICT`) vive en `app/api/metas/route.ts`
 * y en `app/(crm)/metas/page.tsx`; aquí solo lo que vale la pena probar sin base
 * de datos: qué periodo mira la pantalla por defecto, y cuándo un objetivo
 * cuenta como cumplido.
 */

import { fechaSantoDomingo } from "./zona-horaria.ts";

export type Periodo = { year: number; month: number };

/**
 * `periodo` viene de `?periodo=AAAA-MM` (texto libre desde la URL). Si falta o
 * no cumple ese formato, el mes actual en Santo Domingo (issue #24: nunca la
 * hora del servidor) — un valor raro en la URL no debe tumbar la página, solo
 * ignorarse.
 */
export function parsearPeriodo(periodo: string | undefined, ahora: Date = new Date()): Periodo {
  const match = periodo?.match(/^(\d{4})-(\d{2})$/);
  if (match) {
    const year = Number(match[1]);
    const month = Number(match[2]);
    if (month >= 1 && month <= 12) return { year, month };
  }
  const [year, month] = fechaSantoDomingo(ahora).split("-").map(Number) as [number, number];
  return { year, month };
}

/** `AAAA-MM` de un periodo, para armar el `?periodo=` del selector. */
export function formatoPeriodo({ year, month }: Periodo): string {
  return `${year}-${String(month).padStart(2, "0")}`;
}

/**
 * Porcentaje de cumplimiento, redondeado al entero más cercano. `targetDeals`
 * en 0 (sin meta fijada todavía — el valor con el que nace la fila en
 * `incrementarMeta`) nunca divide entre cero: devuelve `null` para que la
 * vista pinte "sin meta fijada" en vez de un `0%` o `Infinity%` engañoso.
 */
export function cumplimientoPorcentaje(achievedDeals: number, targetDeals: number): number | null {
  if (targetDeals <= 0) return null;
  return Math.round((achievedDeals / targetDeals) * 100);
}

/** Regla del `hit` del gráfico anual (§4.1): meta cumplida, y con meta fijada. */
export function esMetaCumplida(achievedDeals: number, targetDeals: number): boolean {
  return targetDeals > 0 && achievedDeals >= targetDeals;
}
