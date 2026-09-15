/**
 * M13 · Papelera — mapa de tablas con borrado lógico (`docs/F2_ANALISIS_Y_PLAN.md`
 * paso 5). Separado de `restaurar/route.ts` porque un `route.ts` real de
 * Next.js solo puede exportar verbos HTTP y un puñado de nombres reservados
 * (`config`, `dynamic`, …) — cualquier otro export ahí rompe la validación de
 * tipos de `next build`, aunque funcione en `next dev`.
 */

import { contacts, deals, leads, projects, units, users } from "@/infrastructure/db/schema";

export const TABLAS_PAPELERA = {
  contact: contacts,
  lead: leads,
  deal: deals,
  project: projects,
  unit: units,
  user: users,
} as const;

export type EntidadPapelera = keyof typeof TABLAS_PAPELERA;
