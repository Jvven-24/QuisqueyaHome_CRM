import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { readFile } from 'node:fs/promises';
import type postgres from 'postgres';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { inventory } from './inventario.ts';
// @ts-expect-error The dispatched harness is native ESM, without a declaration file.
import { createBackfillHarness, replayBackfill, legacyManifest, safe } from './m40-backfill.mjs';

type Harness = { connection: postgres.Sql; db: Parameters<typeof migrate>[0]; close: () => Promise<void> };
let harness: Harness;
before(async () => { harness = await safe(createBackfillHarness); });
after(async () => { if (harness) await safe(harness.close); });

// Even failed assertions cannot serialize driver errors or real source rows.
async function rollback(operation: (tx: postgres.TransactionSql) => Promise<void>) {
  const sentinel = new Error('M40 synthetic rollback');
  await safe(async () => {
    try { await harness.connection.begin(async tx => { await operation(tx); throw sentinel; }); }
    catch (error) { if (error !== sentinel) throw error; }
  });
}
const codeIs = (expected: string) => (error: unknown) => typeof error === 'object' && error !== null &&
  'code' in error && error.code === expected;

async function syntheticSale(tx: postgres.TransactionSql, id = 8100001) {
  await tx`insert into users(id,role_id,full_name,email)
    select ${id},id,'M40 QA',${`m40-${id}@example.invalid`} from roles where slug='admin'`;
  await tx`insert into pipeline_stages(id,slug,name,position,kind) values(${id},${`m40-${id}`},'M40 QA',999,'won')`;
  await tx`insert into projects(id,name,slug) values(${id},'M40 QA',${`m40-${id}`})`;
  await tx`insert into contacts(id,full_name) values(${id},'M40 QA')`;
  await tx`insert into units(id,project_id,code,deleted_at) values(${id},${id},'QA-001','2026-10-01T00:00:00Z')`;
  await tx`insert into deals(id,contact_id,stage_id,created_by,deleted_at)
    values(${id},${id},${id},${id},'2026-10-01T00:00:00Z')`;
  const [sale] = await tx`insert into unit_sales(unit_id,deal_id,project_id,unit_code_normalized,created_by)
    values(${id},${id},${id},'QA-001',${id}) returning id`;
  return sale!.id as string;
}

test('TX-32 copia poblada con ventas reales: migrador oficial dos veces, originales intactos y cero huérfanos', async () => safe(async () => {
  const { connection, db } = harness;
  const before = await inventory(connection);
  const manifest = await legacyManifest(connection);
  assert.ok(Number(before.rows.unit_sales!.count) > 0, 'la prueba poblada exige ventas durables reales');
  await migrate(db, { migrationsFolder: 'drizzle' });
  const after = await inventory(connection);
  for (const [table, row] of Object.entries(before.rows)) {
    if (table === 'inventory_commitments' || table === 'audit_log' || table === 'units') continue;
    assert.equal(after.rows[table]?.fullHash, row.fullHash, `original intacto: ${table}`);
    assert.equal(after.rows[table]?.count, row.count, `conteo intacto: ${table}`);
  }
  assert.equal(after.rows.units?.count, before.rows.units?.count, 'conteo intacto: units');
  const [coverage] = await connection`select
    (select count(*)::int from unit_sales) as sales,
    count(*)::int as commitments,
    count(*) filter (where c.created_by<>s.created_by or c.created_at<>s.created_at or
      c.correlation_id<>s.id or c.source<>'m40:b1h:unit_sales:'||s.id::text)::int as provenance_errors
    from inventory_commitments c join unit_sales s on s.id=c.unit_sale_id
    and s.unit_id=c.unit_id and s.project_id=c.project_id and s.unit_code_normalized=c.unit_code_normalized
    where c.kind='sale' and c.status='active'`;
  assert.equal(coverage!.commitments, coverage!.sales);
  assert.equal(coverage!.provenance_errors, 0);
  const [invalid] = await connection`select count(*)::int as n from inventory_commitments c
    left join unit_sales s on s.id=c.unit_sale_id where c.kind='sale' and s.id is null`;
  assert.equal(invalid!.n, 0);
  const [duplicates] = await connection`select count(*)::int as n from
    (select unit_id from inventory_commitments where status='active' group by unit_id having count(*)>1
      union all select project_id from inventory_commitments where status='active'
      group by project_id,unit_code_normalized having count(*)>1) duplicated`;
  assert.equal(duplicates!.n, 0);
  assert.equal((await legacyManifest(connection)).sha256, manifest.sha256);
  assert.equal((await legacyManifest(connection)).wonWithoutDurableSale, manifest.wonWithoutDurableSale);
  const [financial] = await connection`select
    (select count(*)::int from reservations)+(select count(*)::int from payment_plans)+
    (select count(*)::int from payments)+(select count(*)::int from commission_entries)+
    (select count(*)::int from legacy_commission_links) as n`;
  assert.equal(financial!.n, 0, 'ninguna deuda, reserva, entrada ni evidencia inventada');
  const [attestations] = await connection`select count(*)::int as n,
    count(*) filter (where a.user_id is not null or a.new_value::jsonb->>'financial_evidence'<>'no_verificada'
      or a.new_value::jsonb->>'snapshot_sha256'<>
        encode(sha256(convert_to(to_jsonb(c)::text,'UTF8')),'hex'))::int as invalid
    from audit_log a join commissions c on c.id=a.entity_id
    where a.entity_type='commission' and a.action='importar' and a.user_agent='m40:b1h:0010'`;
  assert.equal(attestations!.n, manifest.commissions.length);
  assert.equal(attestations!.invalid, 0);
  await migrate(db, { migrationsFolder: 'drizzle' });
  assert.deepEqual(await inventory(connection), after, 'segunda migración sin efectos');
  console.log(`M40 POPULATED PASS: ${coverage!.sales} ventas/compromisos; ${manifest.commissions.length} comisiones sin recalcular; ${manifest.wonWithoutDurableSale} ganados sin venta preservados; anomalías=${JSON.stringify(manifest.anomalies)}.`);
}));

test('TX-32 replay explícito del SQL es idempotente, incluso repetido en una transacción', async () => {
  await rollback(async tx => {
    const [before] = await tx`select md5(coalesce(string_agg(row_to_json(c)::text,',' order by id),'')) as hash from inventory_commitments c`;
    const [auditBefore] = await tx`select md5(coalesce(string_agg(row_to_json(a)::text,',' order by id),'')) as hash from audit_log a`;
    await replayBackfill(tx);
    await replayBackfill(tx);
    const [after] = await tx`select md5(coalesce(string_agg(row_to_json(c)::text,',' order by id),'')) as hash from inventory_commitments c`;
    assert.equal(after!.hash, before!.hash);
    const [auditAfter] = await tx`select md5(coalesce(string_agg(row_to_json(a)::text,',' order by id),'')) as hash from audit_log a`;
    assert.equal(auditAfter!.hash, auditBefore!.hash);
  });
});

test('TX-32 control sintético: venta archivada adoptada, ganado sin venta sin compromiso ni deuda', async () => {
  await rollback(async tx => {
    const saleId = await syntheticSale(tx);
    await tx`insert into deals(id,contact_id,stage_id,created_by) values(8100002,8100001,8100001,8100001)`;
    await replayBackfill(tx);
    await tx`set constraints all immediate`;
    const [row] = await tx`select count(*)::int as n from inventory_commitments where unit_sale_id=${saleId}`;
    assert.equal(row!.n, 1);
    const [fake] = await tx`select count(*)::int as n from unit_sales where deal_id=8100002`;
    assert.equal(fake!.n, 0);
    const [reservation] = await tx`select count(*)::int as n from reservations where deal_id in (8100001,8100002)`;
    assert.equal(reservation!.n, 0);
    const [worklist] = await tx`select count(*)::int as n from audit_log where entity_type='deal'
      and entity_id=8100002 and user_agent='m40:b1h:0010'
      and new_value::jsonb->>'issue'='won_without_durable_sale'`;
    assert.equal(worklist!.n, 1, 'excepción atribuida al sistema y pendiente de saneamiento');
  });
});

test('TX-32 fallo de procedencia revierte también los compromisos y el reintento funciona', async () => {
  await rollback(async tx => {
    const saleId = await syntheticSale(tx);
    await tx`insert into deals(id,contact_id,stage_id,created_by) values(8100002,8100001,8100001,8100001)`;
    await tx.unsafe(`create function pg_temp.m40_fail_audit() returns trigger language plpgsql as $$
      begin raise exception using errcode='23514', message='QA audit failure'; end $$`);
    await tx.unsafe('create trigger m40_qa_audit_failure before insert on audit_log for each row execute function pg_temp.m40_fail_audit()');
    await assert.rejects(tx.savepoint(async nested => { await replayBackfill(nested); }), codeIs('23514'));
    const [partial] = await tx`select count(*)::int as n from inventory_commitments where unit_sale_id=${saleId}`;
    assert.equal(partial!.n, 0);
    await tx.unsafe('drop trigger m40_qa_audit_failure on audit_log');
    await replayBackfill(tx);
    const [retried] = await tx`select count(*)::int as n from inventory_commitments where unit_sale_id=${saleId}`;
    assert.equal(retried!.n, 1);
    await tx`set constraints all immediate`;
  });
});

test('TX-32 conflicto histórico aborta todo y permite reintentar sin efecto parcial', async () => {
  await rollback(async tx => {
    const saleId = await syntheticSale(tx);
    await replayBackfill(tx);
    await tx`update inventory_commitments set status='resolved',resolved_at=clock_timestamp(),
      resolution_reason='QA conflicto',row_version=row_version+1 where unit_sale_id=${saleId}`;
    const otherSale = await syntheticSale(tx, 8100003);
    await assert.rejects(tx.savepoint(async nested => { await replayBackfill(nested); }), codeIs('23514'));
    const [partial] = await tx`select count(*)::int as n from inventory_commitments where unit_sale_id=${otherSale}`;
    assert.equal(partial!.n, 0, 'no se adopta parcialmente la venta siguiente');
  });
  // Outer rollback restores the conflict; a fresh retry must succeed.
  await rollback(async tx => { await replayBackfill(tx); await tx`set constraints all immediate`; });
});

test('TX-32 snapshot textual conserva paid/approved/pending, BigInt y anomalías sin legitimarlos', async () => {
  await rollback(async tx => {
    await syntheticSale(tx);
    await tx`insert into commissions(deal_id,broker_id,currency,status,sale_amount_cents,
      commission_basis_points,total_commission_cents,broker_amount_cents,agency_amount_cents)
      values(8100001,8100001,'USD','paid',9223372036854775807,450,9007199254740993,9007199254740992,1)`;
    let manifest = await legacyManifest(tx);
    let row = manifest.commissions.find((item: { deal_id: number }) => item.deal_id === 8100001);
    assert.equal(row.broker_amount_cents, '9007199254740992');
    assert.equal(row.total_commission_cents, '9007199254740993');
    assert.equal(row.sale_amount_cents, '9223372036854775807');
    assert.equal(manifest.financialEvidence, 'no_verificada');
    for (const state of ['pending', 'approved', 'paid', 'void']) {
      await tx`update commissions set status=${state} where deal_id=8100001`;
      manifest = await legacyManifest(tx);
      row = manifest.commissions.find((item: { deal_id: number }) => item.deal_id === 8100001);
      assert.equal(row.status, state);
      assert.equal(row.total_commission_cents, '9007199254740993');
    }
    const baseline = manifest.anomalies;
    await tx`update commissions set currency='ZZZ',broker_amount_cents=-1,status='desconocido' where deal_id=8100001`;
    manifest = await legacyManifest(tx);
    assert.equal(manifest.anomalies.currency, baseline.currency + 1);
    assert.equal(manifest.anomalies.negative, baseline.negative + 1);
    assert.equal(manifest.anomalies.split, baseline.split + 1);
    assert.equal(manifest.anomalies.status, baseline.status + 1);
    await assert.rejects(tx.savepoint(async nested => {
      await nested`update commissions set total_commission_cents=9223372036854775808 where deal_id=8100001`;
    }), codeIs('22003'));
    await replayBackfill(tx);
    const [entries] = await tx`select count(*)::int as n from commission_entries`;
    assert.equal(entries!.n, 0);
  });
});

test('TX-32 metadatos generados: snapshot sin DDL y cadena 0009 → 0010 coherente', async () => {
  const previous = JSON.parse(await readFile('drizzle/meta/0009_snapshot.json', 'utf8'));
  const next = JSON.parse(await readFile('drizzle/meta/0010_snapshot.json', 'utf8'));
  assert.equal(next.prevId, previous.id);
  assert.notEqual(next.id, previous.id);
  const { id: _a, prevId: _b, ...previousSchema } = previous;
  const { id: _c, prevId: _d, ...nextSchema } = next;
  assert.deepEqual(nextSchema, previousSchema);
  const journal = JSON.parse(await readFile('drizzle/meta/_journal.json', 'utf8'));
  const entry0010 = journal.entries.find((entry: { tag: string }) => entry.tag === '0010_m40_backfill_legado');
  assert.ok(entry0010, '0010_m40_backfill_legado presente en _journal.json');
  assert.equal(journal.entries[entry0010.idx - 1]?.tag, '0009_m40_comisiones_liquidaciones');
  assert.equal(journal.entries[entry0010.idx + 1]?.tag, '0011_m40_outbox_tipos');
});
