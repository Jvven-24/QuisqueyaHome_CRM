import assert from 'node:assert/strict';
import type postgres from 'postgres';

export const G12_TABLES = ['roles', 'users', 'broker_profiles', 'permissions', 'sessions', 'pipeline_stages', 'loss_reasons', 'lead_sources', 'zones', 'agencies', 'payment_methods', 'unit_inventory_states', 'marketing_campaigns', 'campaign_spend', 'projects', 'units', 'construction_phases', 'contacts', 'leads', 'deals', 'deal_properties', 'unit_sales', 'deal_stage_history', 'activities', 'activity_sync', 'goals', 'commissions', 'academy_items', 'academy_checklist_items', 'academy_progress', 'academy_checklist_progress', 'academy_review_requests', 'academy_certificates', 'message_templates', 'files', 'notifications', 'integration_accounts', 'audit_log', 'outbox', 'outbox_dead', 'external_refs', 'webhook_inbox'] as const;
export type OriginalColumn = { name: string; type: string; nullable: boolean };
export type ColumnManifest = Record<string, OriginalColumn[]>;
type CatalogColumn = OriginalColumn & { table: string };
type UniqueKey = { table: string; name: string; primary: boolean; valid: boolean; definition: string };
type ForeignKey = { table: string; name: string; targetSchema: string; target: string; sourceColumns: string[]; targetColumns: string[]; onDelete: string; onUpdate: string; validated: boolean };
export type Inventory = { manifest: ColumnManifest; uniques: UniqueKey[]; foreignKeys: ForeignKey[]; rows: Record<string, { count: string; originalHash: string; fullHash: string }> };

/** Solo metadatos y agregados: nunca salen filas ni valores de columnas de la base. */
export async function inventory(connection: postgres.Sql, namespace = 'public', originals?: ColumnManifest): Promise<Inventory> {
  return connection.begin('isolation level repeatable read read only', async tx => {
    await tx`set local timezone = 'UTC'`;
    await tx`set local datestyle = 'ISO, YMD'`;
    await tx`set local intervalstyle = 'postgres'`;
    await tx`set local extra_float_digits = 3`;
    const tables = await tx<{ name: string }[]>`select c.relname as name from pg_class c
      join pg_namespace n on n.oid=c.relnamespace where n.nspname=${namespace}
      and c.relkind in ('r','p') order by c.relname`;
    const columns = await tx<CatalogColumn[]>`select c.relname as table, a.attname as name,
      format_type(a.atttypid,a.atttypmod) as type, not a.attnotnull as nullable
      from pg_attribute a join pg_class c on c.oid=a.attrelid
      join pg_namespace n on n.oid=c.relnamespace where n.nspname=${namespace}
      and c.relkind in ('r','p') and a.attnum>0 and not a.attisdropped order by c.relname,a.attnum`;
    const manifest: ColumnManifest = Object.fromEntries(tables.map(t => [t.name, columns.filter(c => c.table === t.name).map(({ name, type, nullable }) => ({ name, type, nullable }))]));
    if (originals) validateProjection(originals, manifest);
    const uniques = await tx<UniqueKey[]>`select t.relname as table, i.relname as name,
      x.indisprimary as primary, x.indisvalid as valid, pg_get_indexdef(i.oid) as definition
      from pg_index x join pg_class t on t.oid=x.indrelid join pg_class i on i.oid=x.indexrelid
      join pg_namespace n on n.oid=t.relnamespace where n.nspname=${namespace} and x.indisunique
      order by t.relname,i.relname`;
    const foreignKeys = await tx<ForeignKey[]>`select s.relname as table, c.conname as name,
      nt.nspname as "targetSchema", t.relname as target,
      array(select a.attname::text from unnest(c.conkey) with ordinality k(num,pos)
        join pg_attribute a on a.attrelid=s.oid and a.attnum=k.num order by k.pos) as "sourceColumns",
      array(select a.attname::text from unnest(c.confkey) with ordinality k(num,pos)
        join pg_attribute a on a.attrelid=t.oid and a.attnum=k.num order by k.pos) as "targetColumns",
      c.confdeltype::text as "onDelete", c.confupdtype::text as "onUpdate", c.convalidated as validated
      from pg_constraint c join pg_class s on s.oid=c.conrelid join pg_namespace ns on ns.oid=s.relnamespace
      join pg_class t on t.oid=c.confrelid join pg_namespace nt on nt.oid=t.relnamespace
      where c.contype='f' and ns.nspname=${namespace} order by s.relname,c.conname`;
    const rows: Inventory['rows'] = {};
    for (const [table, projection] of Object.entries(originals ?? manifest)) {
      const names = projection.map(c => c.name);
      const [original] = await tx<{ count: string; hash: string }[]>`select count(*)::text as count,
        md5(coalesce(string_agg(h, ',' order by h collate "C"), '')) as hash
        from (select md5(row_to_json(p)::text) as h from
          (select ${tx(names)} from ${tx(namespace)}.${tx(table)}) p) hashes`;
      const [full] = await tx<{ hash: string }[]>`select md5(coalesce(string_agg(h, ',' order by h collate "C"), '')) as hash
        from (select md5(row_to_json(t)::text) as h from ${tx(namespace)}.${tx(table)} t) hashes`;
      assert.ok(original && full, 'agregado de inventario ausente');
      rows[table] = { count: original.count, originalHash: original.hash, fullHash: full.hash };
    }
    return { manifest, uniques, foreignKeys, rows };
  });
}

/** Manifiesto cerrado: ni intersecciones ni eliminación de columnas históricas. */
export function validateProjection(originals: ColumnManifest, current: ColumnManifest) {
  assert.ok(Object.keys(originals).length, 'manifiesto original vacío');
  for (const [table, columns] of Object.entries(originals)) {
    assert.ok(current[table], `tabla original ausente: ${table}`);
    assert.ok(columns.length && new Set(columns.map(c => c.name)).size === columns.length, 'proyección original inválida');
    for (const column of columns) {
      const actual: OriginalColumn | undefined = current[table]!.find(c => c.name === column.name);
      assert.ok(actual, `columna original ausente: ${table}.${column.name}`);
      assert.equal(actual.type, column.type, `tipo original alterado: ${table}.${column.name}`);
    }
  }
}
// Las 42 tablas inventariadas por G12 deben seguir existiendo; las fichas posteriores (M40, M42…) pueden añadir tablas
// nuevas sin romper esta comprobación (antes exigía igualdad exacta y tumbaba cualquier migración nueva).
export function assertG12Tables(manifest: ColumnManifest) {
  const faltan = [...G12_TABLES].filter((table) => !(table in manifest));
  assert.deepEqual(faltan, [], `faltan tablas inventariadas por G12: ${faltan.join(', ')}`);
}
export function assertOriginalsPreserved(before: Inventory, after: Inventory) {
  validateProjection(before.manifest, after.manifest);
  for (const [table, row] of Object.entries(before.rows)) {
    assert.equal(after.rows[table]?.count, row.count, `conteo original cambió: ${table}`);
    assert.equal(after.rows[table]?.originalHash, row.originalHash, `contenido original cambió: ${table}`);
  }
}
