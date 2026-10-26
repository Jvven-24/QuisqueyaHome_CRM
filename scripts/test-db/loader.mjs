// Solo para node --test: resuelve los imports de Next sin alterar producto.
import { registerHooks } from 'node:module';
import { existsSync, readFileSync } from 'node:fs';

const root = new URL('../../', import.meta.url);
export function mutate(source, mutation) {
  if (mutation === 'negocios-join') {
    const before = 'const PROJECT_FILTER_MODE: string = "exists";';
    if (source.split(before).length !== 2) throw new Error('Mutación rechazada: sitio no único');
    return source.replace(before, 'const PROJECT_FILTER_MODE: string = "join";');
  }
  const before = mutation === 'alias'
    ? 'left join contacts on contacts.id = l.contact_id and'
    : 'const attributableSpend = scope === "all" && q.brokerId === undefined && q.projectId === undefined ? sql`true` : sql`false`;';
  const after = mutation === 'alias'
    ? 'left join contacts c on c.id = l.contact_id and'
    : 'const attributableSpend = scope === "all" && q.brokerId === undefined && q.projectId === undefined;';
  if (!source.includes(before) || source.split(before).length !== 2) throw new Error('Mutación rechazada: sitio no único');
  // Mantener las referencias SELECT válidas: el defecto está en visibleRows.
  return mutation === 'alias'
    ? source.replace(before, after).replace('coalesce(contacts.full_name,', 'coalesce(c.full_name,')
    : source.replace(before, after);
}

registerHooks({
  resolve(specifier, context, nextResolve) {
    let candidate;
    if (specifier.startsWith('@/')) candidate = new URL(`src/${specifier.slice(2)}`, root);
    else if (specifier.startsWith('.') && context.parentURL?.startsWith(root.href)) candidate = new URL(specifier, context.parentURL);
    if (candidate && !/\.[a-z]+$/i.test(candidate.pathname) && existsSync(new URL(`${candidate.href}.ts`))) {
      return nextResolve(`${candidate.href}.ts`, context);
    }
    return nextResolve(specifier, context);
  },
  load(url, context, nextLoad) {
    const mutation = globalThis[Symbol.for('qh.test-db')]?.mutation;
    const target = mutation === 'alias' ? 'dashboard' : mutation === 'negocios-join' ? 'pipeline-lectura' : 'reportes';
    if (mutation && mutation !== 'venta-unica' && url === new URL(`src/infrastructure/db/repos/${target}.ts`, root).href) {
      return { format: 'module-typescript', source: mutate(readFileSync(new URL(url), 'utf8'), mutation), shortCircuit: true };
    }
    return nextLoad(url, context);
  },
});
