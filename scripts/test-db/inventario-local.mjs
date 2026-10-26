import assert from 'node:assert/strict';
import { writeFileSync } from 'node:fs';
import postgres from 'postgres';
import { localDatabaseUrl, safeFailure } from '../seed/local.ts';
import { inventory, assertG12Tables, assertOriginalsPreserved } from './inventario.ts';
async function main() {
  const connection = postgres(localDatabaseUrl(), { prepare: false, max: 1, connect_timeout: 5, connection: { default_transaction_read_only: 'on' } });
  try {
    const [id] = await connection`select current_database() as name,inet_server_addr()::text as host,inet_server_port() as port`;
    assert.equal(id.name, 'quisqueyahome_crm');
    assert.equal(id.port, 5432);
    assert.ok(['127.0.0.1','::1'].includes(id.host.split('/')[0]));
    const before = await inventory(connection);
    assertG12Tables(before.manifest);
    const after = await inventory(connection, 'public', before.manifest);
    assertOriginalsPreserved(before, after);
    assert.deepEqual(after, before);
    // Artefacto cerrado de columnas/DDL/conteos; las huellas se comparan y quedan en memoria.
    const report = { observedAt: new Date().toISOString(), destination: { name: id.name, host: id.host, port: id.port }, manifest: before.manifest, uniques: before.uniques, foreignKeys: before.foreignKeys,
      rows: Object.fromEntries(Object.entries(before.rows).map(([table, row]) => [table, { count: row.count, originalHashEqual: after.rows[table].originalHash === row.originalHash, fullHashEqual: after.rows[table].fullHash === row.fullHash }])) };
    writeFileSync(new URL('./g12-inventario.json', import.meta.url), JSON.stringify(report, null, 2) + '\n');
    console.log(`G12 INVENTORY PASS: ${Object.keys(report.manifest).length} tablas, ${report.uniques.length} índices únicos, ${report.foreignKeys.length} FK; conteos y ambas huellas idénticos; ninguna fila exportada.`);
  } finally { await connection.end({ timeout: 5 }); }
}
await main().catch(safeFailure);
