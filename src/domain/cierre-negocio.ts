/**
 * Cálculos puros del cierre transaccional (M3b, `MAPEO_FRONTEND_CRM.md` §10.2).
 *
 * Igual que `rbac.ts` y `transicion-etapa.ts`: sin importar nada de
 * `infrastructure/`, ni Drizzle ni Next — se prueba entero con `node --test`.
 * El route handler (`app/api/pipeline/[id]/etapa/_cierre.ts`) hace las
 * consultas y escrituras; este archivo solo calcula dos cosas que alguien
 * podría romper sin darse cuenta si vivieran sueltas dentro del route
 * handler: el reparto de una comisión en dinero real, y el nivel de un broker.
 */

import type { BrokerLevel } from "./catalogs.ts";

/**
 * Reparto por defecto broker/agencia cuando el negocio no trae el suyo.
 *
 * `deals` no tiene columnas de reparto propias (solo `commissions` las tiene,
 * con `default(5000)` en `db/schema.ts`) — así que "el negocio no trae el
 * suyo" es, en la práctica, siempre, hasta que un caso de uso futuro permita
 * fijar un reparto distinto por negocio. Estos valores están duplicados a
 * propósito (no importados desde el esquema): el cálculo en JavaScript
 * necesita conocer el número para repartir los centavos *antes* de insertar,
 * no puede confiar en que Postgres complete un valor por defecto que todavía
 * no existe en la fila. Si se cambia el default en `db/schema.ts`, hay que
 * cambiar este también — el esquema está congelado, así que no debería pasar
 * sin una migración revisada aparte (§18.1).
 */
export const DEFAULT_BROKER_SHARE_BASIS_POINTS = 5000;
export const DEFAULT_AGENCY_SHARE_BASIS_POINTS = 5000;

export type CalculoComision = {
  totalCommissionCents: number;
  brokerAmountCents: number;
  agencyAmountCents: number;
};

/**
 * Reparte una comisión en centavos enteros, sin coma flotante en el resultado
 * final: la comisión es dinero que se le paga a una persona, y un error de
 * redondeo de un centavo es una disputa real, no un detalle académico.
 *
 * - `totalCommissionCents` se redondea una vez, con `Math.round`, sobre
 *   `saleAmountCents * commissionBasisPoints / 10000` (puntos básicos: 450 =
 *   4,5 %, igual que documenta `deals.commission_basis_points`).
 * - `brokerAmountCents` se redondea de la misma forma sobre el total ya
 *   redondeado.
 * - `agencyAmountCents` **no** se redondea por separado: es el total menos lo
 *   del broker. Redondear los dos lados de forma independiente puede dejar
 *   `broker + agencia !== total` por un centavo (dos `.round()` a la vez no
 *   garantizan que sumen exacto); restar en vez de redondear dos veces hace
 *   que la suma cuadre siempre, al centavo.
 */
export function calcularComision({
  saleAmountCents,
  commissionBasisPoints,
  brokerShareBasisPoints = DEFAULT_BROKER_SHARE_BASIS_POINTS,
  agencyShareBasisPoints = DEFAULT_AGENCY_SHARE_BASIS_POINTS,
}: {
  saleAmountCents: number;
  commissionBasisPoints: number;
  brokerShareBasisPoints?: number;
  agencyShareBasisPoints?: number;
}): CalculoComision {
  void agencyShareBasisPoints; // ver nota de `agencyAmountCents` arriba: no se usa para calcular, solo lo trae quien llama por completitud del reparto declarado.

  const totalCommissionCents = Math.round(
    (saleAmountCents * commissionBasisPoints) / 10_000,
  );
  const brokerAmountCents = Math.round(
    (totalCommissionCents * brokerShareBasisPoints) / 10_000,
  );
  const agencyAmountCents = totalCommissionCents - brokerAmountCents;

  return { totalCommissionCents, brokerAmountCents, agencyAmountCents };
}

/**
 * Umbrales de venta anual (en centavos) para cada nivel de `BROKER_LEVELS`.
 *
 * **Provisional**, documentado explícitamente porque no hay una fuente
 * oficial de estos números en ningún archivo del repositorio salvo uno:
 * `referencia-prototipo/app/page.tsx` (`PipelineView`/Inicio) trae dos pistas
 * consistentes entre sí para el corte Junior → Senior:
 *
 *   - "Mi nivel: Junior — US$415K para Senior"
 *   - "US$85,000 de US$500,000 para nivel Senior"
 *
 * 85 000 + 415 000 = 500 000: las dos cifras describen el mismo umbral desde
 * dos brokers de ejemplo distintos, así que **US$500 000 para Senior es un
 * dato real del prototipo**, no inventado.
 *
 * Los tres cortes siguientes (Senior+, Top Producer, Top Leader) no aparecen
 * en ningún sitio del repo con una cifra — solo el orden de la escala
 * (`Junior → Senior → Senior+ → Top Producer → Top Leader`, §4 "06 · Brokers"
 * de `MAPEO_FRONTEND_CRM.md`) y un dato suelto de contexto: el broker de
 * ejemplo con nivel "Top Producer" en ese mismo archivo trae
 * `US$1,240,000` de ventas anuales. Se define aquí una progresión creciente
 * razonable que dobla aproximadamente cada corte y deja a ese broker de
 * ejemplo dentro de su nivel — **sin más respaldo que ese criterio** — hasta
 * que el negocio confirme la escala real. Cambiar estos números no toca el
 * esquema (`broker_profiles.level` ya admite los cinco valores): es una
 * constante de este archivo.
 */
const BROKER_LEVEL_THRESHOLDS: readonly { level: BrokerLevel; minAnnualSalesCents: number }[] = [
  { level: "junior", minAnnualSalesCents: 0 },
  // Confirmado por el prototipo (ver docblock de arriba).
  { level: "senior", minAnnualSalesCents: 500_000_00 },
  // Provisional.
  { level: "senior_plus", minAnnualSalesCents: 900_000_00 },
  // Provisional; deja a "US$1,240,000" (ejemplo del prototipo) en este nivel.
  { level: "top_producer", minAnnualSalesCents: 1_200_000_00 },
  // Provisional.
  { level: "top_leader", minAnnualSalesCents: 2_000_000_00 },
];

/**
 * Nivel que corresponde a un total de ventas anuales, según los umbrales de
 * arriba. Siempre devuelve algo — `annualSalesCents` negativo (no debería
 * ocurrir, pero esta función no confía en quien la llama) cae en `junior`,
 * el primer umbral, que es 0.
 */
export function evaluarNivelBroker(annualSalesCents: number): BrokerLevel {
  let nivel: BrokerLevel = BROKER_LEVEL_THRESHOLDS[0]!.level;
  for (const corte of BROKER_LEVEL_THRESHOLDS) {
    if (annualSalesCents >= corte.minAnnualSalesCents) nivel = corte.level;
  }
  return nivel;
}

/** Etiqueta en español de cada `BrokerLevel` (M7 Brokers, M8 Metas). */
export const BROKER_LEVEL_LABELS: Record<BrokerLevel, string> = {
  junior: "Junior",
  senior: "Senior",
  senior_plus: "Senior+",
  top_producer: "Top Producer",
  top_leader: "Top Leader",
};
