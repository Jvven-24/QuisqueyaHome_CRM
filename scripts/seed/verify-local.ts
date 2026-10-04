/** Verificación local con salidas redactadas y respaldo fuera del repositorio. */
import { spawnSync } from 'node:child_process';
import { mkdtempSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import postgres from 'postgres';
import { localDatabaseUrl, assertLocalDestination, safeFailure } from './local.ts';

async function main() {
  const url = localDatabaseUrl(); const u = assertLocalDestination(url);
  const connection = postgres(url, { prepare: false, max: 1, connect_timeout: 5 });
  try {
    const [target] = await connection`select current_database() as name, inet_server_addr()::text as host, current_setting('server_version_num')::int as version`;
    if (target?.name !== 'quisqueyahome_crm' || !['127.0.0.1', '::1'].includes(String(target?.host).split('/')[0]!)) throw new Error('Destino no autorizado');
    console.log(JSON.stringify({ database: target.name, host: target.host, version: target.version }));
    const mode = process.argv[2];
    if (mode === 'preflight') {
      const counts = await connection`select (select count(*)::int from leads) as leads, (select count(*)::int from deals) as deals, (select count(*)::int from projects) as projects, (select count(*)::int from units) as units, (select count(*)::int from contacts) as contacts`;
      const checks = await connection`select count(*)::int as invalid_budgets from leads where budget_min_cents < 0 or budget_max_cents < 0 or budget_min_cents > budget_max_cents`;
      const rls = await connection`select count(*)::int as tables, count(*) filter (where relrowsecurity)::int as with_rls from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relkind='r'`;
      console.log(JSON.stringify({ counts, checks, rls })); return;
    }
    const password = decodeURIComponent(u.password);
    const safeOutput = (output: string) => {
      if (output.includes(url) || password.length > 3 && output.includes(password)) throw Object.assign(new Error('Salida bloqueada por secreto; detener la tarea'), { code: 'SECRET_IN_TOOL_OUTPUT' });
      console.log(output.trim());
    };
    if (mode === 'backup') {
      const directory = mkdtempSync(join(tmpdir(), 'vre-d11-backup-'));
      const file = join(directory, 'pre-d11.dump');
      const tool = 'C:/Program Files/PostgreSQL/15/bin/pg_dump.exe';
      const result = spawnSync(tool, ['--host', u.hostname, '--port', u.port, '--username', decodeURIComponent(u.username), '--dbname', u.pathname.slice(1), '--format=custom', '--no-password', '--file', file], { encoding: 'utf8', env: { ...process.env, PGPASSWORD: password }, windowsHide: true });
      if (result.status !== 0) throw new Error('Respaldo falló; no ejecutar migración');
      safeOutput(result.stdout + result.stderr);
      const inventory = spawnSync('C:/Program Files/PostgreSQL/15/bin/pg_restore.exe', ['--list', file], { encoding: 'utf8', windowsHide: true });
      if (inventory.status !== 0 || !inventory.stdout.includes('TABLE DATA public leads')) throw new Error('Archivo de respaldo no verificable');
      console.log(JSON.stringify({ backup: file, bytes: statSync(file).size, archiveReadable: true, restoreRehearsed: false })); return;
    }
    if (mode !== 'migrate' && mode !== 'seed') throw new Error('Modo desconocido');
    // npm CLI por Node: no shell ni interpolación de configuración.
    const result = spawnSync(process.execPath, [join(dirname(process.execPath), 'node_modules/npm/bin/npm-cli.js'), 'run', mode === 'migrate' ? 'db:migrate' : 'db:seed'], { encoding: 'utf8', windowsHide: true, maxBuffer: 8 * 1024 * 1024 });
    if (result.error) throw result.error;
    safeOutput((result.stdout ?? '') + (result.stderr ?? ''));
    if (result.status !== 0) throw new Error('Comando local falló');
    if (mode === 'migrate') {
      const tables = await connection`select c.relname as name, c.relrowsecurity as rls from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relname in ('agencies','zones','payment_methods','unit_inventory_states','marketing_campaigns','campaign_spend') order by c.relname`;
      if (tables.length !== 6 || tables.some(t => !t.rls)) throw new Error('Migración no verificada');
      console.log(JSON.stringify({ migratedTables: tables }));
    }
  } finally { await connection.end({ timeout: 5 }); }
}
await main().catch(safeFailure);
