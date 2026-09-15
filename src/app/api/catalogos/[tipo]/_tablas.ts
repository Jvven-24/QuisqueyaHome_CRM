/**
 * M13 · Catálogos — mapa compartido por alta y edición
 * (`docs/F2_ANALISIS_Y_PLAN.md` paso 5).
 *
 * Motivos de pérdida y canales de captación tienen la forma exacta
 * (`slug`, `name`, `position`, `isActive`) — un solo par de route handlers
 * parametrizados por `[tipo]`, no dos casi idénticos.
 */

import { leadSources, lossReasons } from "@/infrastructure/db/schema";
import type { EntityType } from "@/domain/catalogs";

export const TABLAS_CATALOGO = {
  "motivos-perdida": { tabla: lossReasons, entidad: "loss_reason" as EntityType },
  canales: { tabla: leadSources, entidad: "lead_source" as EntityType },
} as const;

export type TipoCatalogo = keyof typeof TABLAS_CATALOGO;

export function resolverCatalogo(tipo: string) {
  return Object.hasOwn(TABLAS_CATALOGO, tipo) ? TABLAS_CATALOGO[tipo as TipoCatalogo] : undefined;
}
