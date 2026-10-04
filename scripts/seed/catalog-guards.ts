import type * as schema from '../../src/infrastructure/db/schema.ts';
import { BASE_ID, SOURCE_SLUGS, LOSS_SLUGS, STAGES } from './catalog.ts';

type CatalogRow = { id: number; slug: string; name: string; isActive: boolean; position: number };
export type CatalogReferences = {
  brokerRoleId: number;
  leadSources: CatalogRow[];
  lossReasons: CatalogRow[];
  pipelineStages: (CatalogRow & Pick<typeof schema.pipelineStages.$inferSelect, 'kind' | 'defaultProbability'>)[];
};
export function resolveCatalogs(input: CatalogReferences): CatalogReferences {
  function required<T extends CatalogRow>(rows: T[], slugs: readonly string[], label: string): T[] {
    return [...new Set(slugs)].map(slug => {
      const matches = rows.filter(row => row.slug === slug);
      if (matches.length !== 1 || !Number.isSafeInteger(matches[0]!.id) || matches[0]!.id <= 0 || matches[0]!.id >= BASE_ID) throw new Error(`Catálogo canónico ausente o ambiguo: ${label}.${slug}`);
      return matches[0]!;
    });
  }
  if (!Number.isSafeInteger(input.brokerRoleId) || input.brokerRoleId <= 0 || input.brokerRoleId >= BASE_ID) throw new Error('Rol broker canónico inválido');
  const pipelineStages = required(input.pipelineStages, STAGES.map(s => s.slug), 'pipelineStages');
  pipelineStages.forEach((row, i) => {
    if (!row.isActive || row.kind !== STAGES[i]!.kind || row.defaultProbability === null || row.defaultProbability < 0 || row.defaultProbability > 100) throw new Error('Etapa canónica incompatible');
  });
  return { brokerRoleId: input.brokerRoleId, pipelineStages, leadSources: required(input.leadSources, SOURCE_SLUGS, 'leadSources'), lossReasons: required(input.lossReasons, LOSS_SLUGS, 'lossReasons') };
}

const normalized = (name: string) => name.normalize('NFKC').trim().toLocaleLowerCase('es');
/** Se aplica solo a filas pendientes de INSERT; relecturas idénticas son idempotentes. */
export function assertCatalogInsertSafe(pending: readonly { slug: string; name: string }[], existing: readonly { slug: string; name: string }[]) {
  const slugs = new Set(existing.map(row => row.slug));
  const names = new Set(existing.map(row => normalized(row.name)));
  for (const row of pending) {
    if (slugs.has(row.slug) || names.has(normalized(row.name))) throw new Error('Catálogo duplicado por slug o nombre visible; INSERT rechazado');
    slugs.add(row.slug); names.add(normalized(row.name));
  }
}
