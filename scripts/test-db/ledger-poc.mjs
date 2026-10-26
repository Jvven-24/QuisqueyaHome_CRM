// b1g/M40: arnés desechable. Nunca conecta a la base comercial.
// Configuración leída en runtime; no imprime URL, usuario ni errores sin depurar.
import assert from 'node:assert/strict';
import { randomBytes, randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { databaseUrl } from '../../src/infrastructure/env.ts';
import { crearLibroPgledger, decimalDesdeCentavos } from '../../src/infrastructure/integraciones/ledger/pgledger.ts';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { sql } from 'drizzle-orm';

for (const f of ['.env.local', '.env']) { try { process.loadEnvFile(f); } catch {} }
const started = performance.now();
let endpoint;
try { endpoint = new URL(databaseUrl()); }
catch { console.error('PoC rechazada: configuraci?n no disponible o inv?lida.'); process.exit(1); }
if (!['127.0.0.1', 'localhost', '[::1]'].includes(endpoint.hostname)) {
  throw new Error('PoC rechazada: se exige loopback.');
}
const database = 'm40_poc_' + randomBytes(8).toString('hex');
assert.match(database, /^m40_poc_[a-f0-9]{16}$/);
const roles = { owner: database + '_owner', a: database + '_a', b: database + '_b' };
const ident = (x) => { assert.match(x, /^m40_poc_[a-f0-9]{16}(?:_(?:owner|a|b))?$/); return '"' + x + '"'; };
endpoint.pathname = '/postgres';
const options = { prepare: false, max: 16, connect_timeout: 5, idle_timeout: 5,
  connection: { statement_timeout: 10000, lock_timeout: 8000 }, onnotice: () => {} };
const admin = postgres(endpoint.href, { ...options, max: 1 });
let client;
let created = false;
const madeRoles = [];
let checks = 0;
const ids = new Set();
const code = (e) => {
  const c = e?.code ?? e?.cause?.code;
  return typeof c === 'string' && /^[A-Z0-9_]{3,40}$/.test(c) ? c : 'ASSERT_OR_RUNTIME';
};
async function run(name, fn) {
  try { await fn(); checks++; console.log('PASS ' + name); }
  catch (e) { console.log('FAIL ' + name + ' [' + code(e) + ']'); throw e; }
}
async function rejected(fn, expected) {
  try { await fn(); } catch (e) { if (code(e) !== expected) console.log('INFO rechazo esperado=' + expected + '; observado=' + code(e)); assert.equal(code(e), expected); return; }
  assert.fail('Se esperaba rechazo SQL ' + expected);
}
function barrier(n) {
  let ready = 0, release;
  const wait = new Promise((r) => { release = r; });
  return async () => { if (++ready === n) release(); await wait; };
}
async function actor(who, fn, gate) {
  return drizzle(client).transaction(async (tx) => {
    await tx.execute(sql.raw('SET LOCAL SESSION AUTHORIZATION ' + ident(roles[who])));
    const [connection] = await tx.execute(sql`select pg_backend_pid() as pid`);
    ids.add(connection.pid);
    if (gate) await gate();
    return fn(tx, crearLibroPgledger(tx));
  });
}
const move = (from, to, cents = '100', extra = {}) => ({
  clave: randomUUID(), origen: randomUUID(), desde: from, hasta: to,
  moneda: 'USD', centavos: cents, ...extra,
});
async function book(tx, libro, m, failure) {
  await tx.execute(sql`insert into ledger_poc.pagos(id,importe)
    values (${m.origen}::uuid,${decimalDesdeCentavos(m.centavos)}::numeric)
    on conflict (id) do nothing`);
  const result = await libro.registrar(failure === 'libro' ? { ...m, moneda: 'EUR' } : m);
  await tx.execute(sql`insert into ledger_poc.auditoria(id) values
    (${failure === 'auditoria' ? null : m.origen}::uuid) on conflict (id) do nothing`);
  await tx.execute(sql`insert into ledger_poc.outbox(id) values
    (${failure === 'outbox' ? null : m.origen}::uuid) on conflict (id) do nothing`);
  return result;
}
try {
  const [server] = await admin`select current_setting('server_version') as version`;
  console.log('PostgreSQL ' + server.version + '; destino=' + database + '; plantilla=template0');
  await admin.unsafe('CREATE DATABASE ' + ident(database) + ' TEMPLATE template0');
  created = true;
  endpoint.pathname = '/' + database;
  client = postgres(endpoint.href, options);
  for (const role of Object.values(roles)) {
    await admin.unsafe('CREATE ROLE ' + ident(role) + ' NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOBYPASSRLS');
    madeRoles.push(role);
  }
  await client.unsafe('GRANT CREATE ON DATABASE ' + ident(database) + ' TO ' + ident(roles.owner));
  const source = (await readFile(new URL('../../src/infrastructure/integraciones/ledger/poc.sql', import.meta.url), 'utf8')).replace(/^\uFEFF/, '');
  await client.begin(async (s) => {
    await s.unsafe('SET LOCAL ROLE ' + ident(roles.owner));
    await s.unsafe(source);
    for (const table of ['pagos', 'auditoria', 'outbox']) {
      await s.unsafe('CREATE TABLE ledger_poc.' + table + ' (id uuid PRIMARY KEY, propietario name NOT NULL DEFAULT session_user, importe ledger_poc.importe NOT NULL DEFAULT 0, xid bigint NOT NULL DEFAULT txid_current())');
      await s.unsafe('ALTER TABLE ledger_poc.' + table + ' ENABLE ROW LEVEL SECURITY');
      await s.unsafe('ALTER TABLE ledger_poc.' + table + ' FORCE ROW LEVEL SECURITY');
      await s.unsafe('CREATE POLICY identidad ON ledger_poc.' + table + ' USING (propietario=session_user) WITH CHECK (propietario=session_user)');
    }
    for (const role of [roles.a, roles.b]) {
      await s.unsafe('GRANT USAGE ON SCHEMA ledger_poc TO ' + ident(role));
      await s.unsafe('GRANT SELECT ON ALL TABLES IN SCHEMA ledger_poc TO ' + ident(role));
      await s.unsafe('GRANT INSERT ON ledger_poc.pagos,ledger_poc.auditoria,ledger_poc.outbox TO ' + ident(role));
      await s.unsafe('GRANT EXECUTE ON FUNCTION ledger_poc.crear_cuenta(text,text,boolean),ledger_poc.registrar(uuid,uuid,uuid,uuid,text,numeric,uuid) TO ' + ident(role));
    }
  });
  await run('instalación SQL exacta y roles sin superuser/bypass', async () => {
    const rows = await client`select rolsuper,rolbypassrls,rolcreatedb,rolcreaterole from pg_roles where rolname in (${roles.a},${roles.b},${roles.owner})`;
    assert.equal(rows.length,3);
    assert.ok(rows.every((r) => !r.rolsuper && !r.rolbypassrls && !r.rolcreatedb && !r.rolcreaterole));
    const tables = await client`select relrowsecurity,relforcerowsecurity from pg_class join pg_namespace n on n.oid=relnamespace where n.nspname='ledger_poc' and relkind='r'`;
    assert.equal(tables.length,6);
    assert.ok(tables.every((r) => r.relrowsecurity && r.relforcerowsecurity));
  });
  const a = await actor('a', async (_tx,l) => ({
    bank: await l.crearCuenta('banco externo','USD',true),
    cash: await l.crearCuenta('cobros','USD'),
    other: await l.crearCuenta('otra','USD'),
    dop: await l.crearCuenta('DOP','DOP',true),
  }));
  const b = await actor('b', async (_tx,l) => ({
    bank: await l.crearCuenta('banco externo','USD',true),
    cash: await l.crearCuenta('cobros','USD'),
  }));
  const payment = move(a.bank,a.cash,'12345');
  let original;
  await run('pago/libro/auditoría/outbox: misma conexión y mismo xid, commit conjunto', async () => {
    original = await actor('a', (tx,l) => book(tx,l,payment));
    const [r] = await client`select p.xid::text px,m.xmin::text mx,a.xid::text ax,o.xid::text ox
      from ledger_poc.pagos p join ledger_poc.movimientos m on m.origen=p.id
      join ledger_poc.auditoria a on a.id=p.id join ledger_poc.outbox o on o.id=p.id
      where p.id=${payment.origen}`;
    assert.equal(r.px,r.mx); assert.equal(r.px,r.ax); assert.equal(r.px,r.ox);
  });
  for (const failure of ['libro','auditoria','outbox']) {
    await run('rollback total ante fallo de ' + failure, async () => {
      const m=move(a.bank,a.cash);
      await rejected(() => actor('a',(tx,l) => book(tx,l,m,failure)),failure==='libro'?'22023':'23502');
      for (const table of ['pagos','auditoria','outbox']) {
        const rows=await client.unsafe('select id from ledger_poc.'+table+' where id=$1',[m.origen]);
        assert.equal(rows.length,0);
      }
      assert.equal((await client`select id from ledger_poc.movimientos where origen=${m.origen}`).length,0);
    });
  }
  await run('idempotencia simultánea: 8 conexiones, un pago/movimiento/par de entradas', async () => {
    const m=move(a.bank,a.cash,'10'), gate=barrier(8);
    const results=await Promise.all(Array.from({length:8},()=>actor('a',(tx,l)=>book(tx,l,m),gate)));
    assert.equal(new Set(results).size,1);
    const [r]=await client`select count(*)::int n from ledger_poc.movimientos where origen=${m.origen}`;
    assert.equal(r.n,1);
    await rejected(()=>actor('a',(_tx,l)=>l.registrar({...m,centavos:'11'})),'23505');
    await rejected(()=>actor('a',(_tx,l)=>l.registrar({...m,clave:randomUUID()})),'23505');
  });
  await run('concurrencia en ambos sentidos: 16 escrituras, sin pérdida/deadlock', async () => {
    const gate=barrier(8);
    await Promise.all(Array.from({length:8},(_,i)=>actor('a',async (_tx,l)=>{
      const [from,to] = i%2===0 ? [a.bank,a.cash] : [a.cash,a.bank];
      await l.registrar(move(from,to,'1'));
      await l.registrar(move(to,from,'1'));
    },gate)));
    const [r]=await client`select saldo::text from ledger_poc.cuentas where public_id=${a.cash}`;
    assert.equal(r.saldo,'123.55');
    assert.ok(ids.size>=2);
    console.log('INFO conexiones físicas observadas=' + ids.size);
  });
  await run('saldo no negativo: dos retiros concurrentes, solo uno confirmado', async () => {
    const source=await actor('a',(_tx,l)=>l.crearCuenta('carrera','USD'));
    await actor('a',(_tx,l)=>l.registrar(move(a.bank,source,'10000')));
    const gate=barrier(2);
    const results=await Promise.allSettled([1,2].map(()=>actor('a',(_tx,l)=>l.registrar(move(source,a.other,'6000')),gate)));
    assert.equal(results.filter((r)=>r.status==='fulfilled').length,1);
    assert.equal(code(results.find((r)=>r.status==='rejected').reason),'23514');
    const [r]=await client`select saldo::text from ledger_poc.cuentas where public_id=${source}`;
    assert.equal(r.saldo,'40.00');
  });
  await run('USD/DOP y escala SQL: centavos exactos, bigint > Number.MAX_SAFE_INTEGER', async () => {
    await actor('a',(_tx,l)=>l.registrar(move(a.bank,a.other,'9007199254740993')));
    await actor('a',(_tx,l)=>l.registrar(move(a.bank,a.other,'9223372036854775807')));
    const dop2=await actor('a',(_tx,l)=>l.crearCuenta('destino DOP','DOP'));
    await actor('a',(_tx,l)=>l.registrar(move(a.dop,dop2,'621000',{moneda:'DOP'})));
    const [r]=await client`select saldo::text from ledger_poc.cuentas where public_id=${dop2}`;
    assert.equal(r.saldo,'6210.00');
    const [large]=await client`select importe::text from ledger_poc.movimientos where importe=90071992547409.93`;
    assert.equal(large.importe,'90071992547409.93');
    for (const amount of ['0.001','0','-1','NaN','Infinity','-Infinity','92233720368547758.08']) {
      await rejected(()=>actor('a',(tx)=>tx.execute(sql`select ledger_poc.registrar(
        ${randomUUID()}::uuid,${randomUUID()}::uuid,${a.bank}::uuid,${a.cash}::uuid,'USD',${amount}::numeric)`)),'22023');
    }
    await rejected(()=>actor('a',(_tx,l)=>l.registrar(move(a.bank,a.dop))),'22023');
    await rejected(()=>actor('a',(_tx,l)=>l.crearCuenta('EUR','EUR')),'23514');
  });
  await run('compensación parcial, replay y límite concurrente sin modificar original', async () => {
    const reverse=move(a.cash,a.bank,'3000',{compensa:original});
    const id=await actor('a',(_tx,l)=>l.registrar(reverse));
    assert.equal(await actor('a',(_tx,l)=>l.registrar(reverse)),id);
    const gate=barrier(2);
    const results=await Promise.allSettled([1,2].map(()=>actor('a',(_tx,l)=>
      l.registrar(move(a.cash,a.bank,'6000',{compensa:original})),gate)));
    assert.equal(results.filter((r)=>r.status==='fulfilled').length,1);
    assert.equal(code(results.find((r)=>r.status==='rejected').reason),'23514');
    const [r]=await client`select importe::text from ledger_poc.movimientos where public_id=${original}`;
    assert.equal(r.importe,'123.45');
    await actor('a',(_tx,l)=>l.registrar(move(a.cash,a.bank,'3345',{compensa:original})));
    await rejected(()=>actor('a',(_tx,l)=>l.registrar(move(a.cash,a.bank,'1',{compensa:original}))),'23514');
    await rejected(()=>actor('a',(_tx,l)=>l.registrar(move(a.bank,a.cash,'1',{compensa:id}))),'22023');
  });
  await run('aislamiento A/B: SELECT, función, replay, GUC y FK cruzada denegados', async () => {
    await actor('b',async(tx,l)=>{
      assert.equal((await tx.execute(sql`select * from ledger_poc.cuentas where public_id=${a.cash}::uuid`)).length,0);
      await tx.execute(sql`select set_config('app.current_user_id',${roles.a},true)`);
      assert.equal((await tx.execute(sql`select * from ledger_poc.movimientos where public_id=${original}::uuid`)).length,0);
      assert.ok(l);
    });
    await rejected(()=>actor('b',(_tx,l)=>l.registrar(move(b.bank,a.cash))),'42501');
    await rejected(()=>actor('b',(_tx,l)=>l.registrar(payment)),'42501');
    await rejected(()=>actor('b',(tx)=>tx.execute(sql.raw('SET LOCAL ROLE '+ident(roles.a)))),'42501');
    await rejected(()=>actor('a',(tx)=>tx.execute(sql`insert into ledger_poc.pagos(id,propietario) values (${randomUUID()}::uuid,${roles.b})`)),'42501');
    // Privilegio del dueño solo para atacar constraints sin bypass de RLS.
    await actor('owner',async(tx,l)=>{
      const x=await l.crearCuenta('FK propia','USD',true);
      await rejected(async()=>tx.transaction(async(sp)=>{
        const [own]=await sp.execute(sql`select id from ledger_poc.cuentas where public_id=${x}::uuid`);
        const [foreign]=await client`select id from ledger_poc.cuentas where public_id=${a.cash}`;
        await sp.execute(sql`insert into ledger_poc.movimientos(clave,origen,desde,hasta,moneda,importe)
          values (${randomUUID()}::uuid,${randomUUID()}::uuid,${own.id},${foreign.id},'USD',1)`);
      }),'23503');
    });
  });
  await run('revocar EXECUTE deniega replay; PUBLIC revocado; Data API informado aparte', async () => {
    await client.unsafe('REVOKE EXECUTE ON FUNCTION ledger_poc.registrar(uuid,uuid,uuid,uuid,text,numeric,uuid) FROM '+ident(roles.a));
    try { await rejected(()=>actor('a',(_tx,l)=>l.registrar(payment)),'42501'); }
    finally { await client.unsafe('GRANT EXECUTE ON FUNCTION ledger_poc.registrar(uuid,uuid,uuid,uuid,text,numeric,uuid) TO '+ident(roles.a)); }
    const functions=await client`select proacl::text acl from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='ledger_poc'`;
    assert.ok(functions.every((r)=>r.acl!==null && !/(?:^|[,\{])=X\//.test(r.acl))); 
    for (const role of ['anon','authenticated']) {
      const found=await client`select rolname from pg_roles where rolname=${role}`;
      if (!found.length) { console.log('UNKNOWN rol Data API ausente: '+role); continue; }
      for (const query of ['select * from ledger_poc.cuentas','select ledger_poc.crear_cuenta(\'no\',\'USD\')']) {
        await rejected(()=>client.begin(async(s)=>{
          await s.unsafe('SET LOCAL SESSION AUTHORIZATION "'+role+'"');
          await s.unsafe(query);
        }),'42501');
      }
      console.log('INFO Data API SELECT/funci?n denegados: '+role);
    }
  });
  await run('app sin INSERT/UPDATE/DELETE/TRUNCATE sobre hechos ni UPDATE de saldos', async () => {
    for (const query of [
      'insert into ledger_poc.entradas default values',
      'update ledger_poc.entradas set importe=0',
      'delete from ledger_poc.entradas',
      'truncate ledger_poc.entradas',
      'update ledger_poc.movimientos set importe=0',
      'delete from ledger_poc.movimientos',
      'truncate ledger_poc.movimientos',
      'update ledger_poc.cuentas set saldo=999',
      'create table ledger_poc.intruso(id int)',
      'create schema intruso'
    ]) await rejected(()=>actor('a',(tx)=>tx.execute(sql.raw(query))),'42501');
  });
  await run('triggers append-only también rechazan al propietario sin bypass', async () => {
    for (const table of ['entradas','movimientos']) {
      for (const query of ['update ledger_poc.'+table+' set importe=0','delete from ledger_poc.'+table,'truncate ledger_poc.'+table+(table==='movimientos'?',ledger_poc.entradas':'')])
        await rejected(()=>actor('owner',(tx)=>tx.execute(sql.raw(query))),'42501');
    }
  });
  await run('SQL directo: dominio rechaza subcentavo y balance diferido impide commit sin entradas', async () => {
    await rejected(()=>actor('owner',(tx)=>tx.execute(sql`insert into ledger_poc.cuentas(nombre,moneda,saldo)
      values ('fracción','USD',0.001)`)),'23514');
    await rejected(()=>actor('owner',async(tx,l)=>{
      const x=await l.crearCuenta('incompleto origen','USD',true);
      const y=await l.crearCuenta('incompleto destino','USD');
      await tx.execute(sql`insert into ledger_poc.movimientos(clave,origen,desde,hasta,moneda,importe)
        select ${randomUUID()}::uuid,${randomUUID()}::uuid,a.id,b.id,'USD',1
        from ledger_poc.cuentas a,ledger_poc.cuentas b where a.public_id=${x}::uuid and b.public_id=${y}::uuid`);
    }),'23514');
  });
  await run('oráculo SQL independiente: 2 entradas, neto cero/moneda, saldos, versiones e historia', async () => {
    const invalid = await client`select m.id from ledger_poc.movimientos m
      left join ledger_poc.entradas e on e.movimiento_id=m.id group by m.id
      having count(e.id)<>2 or sum(e.importe)<>0 or count(distinct e.moneda)<>1
      or count(*) filter(where (e.cuenta_id=m.desde and e.importe=-m.importe)
        or (e.cuenta_id=m.hasta and e.importe=m.importe))<>2`;
    assert.equal(invalid.length,0);
    const invalidBalances=await client`select c.id from ledger_poc.cuentas c
      left join ledger_poc.entradas e on e.cuenta_id=c.id group by c.id
      having c.saldo<>coalesce(sum(e.importe),0) or c.version<>count(e.id)`;
    assert.equal(invalidBalances.length,0);
    const invalidHistory=await client`select id from (
      select id,saldo_anterior,lag(saldo_actual,1,0::numeric) over(partition by cuenta_id order by version_cuenta) prev
      from ledger_poc.entradas) h where saldo_anterior<>prev`;
    assert.equal(invalidHistory.length,0);
    const invalidReverses=await client`select o.id from ledger_poc.movimientos o
      join ledger_poc.movimientos r on r.compensa=o.id group by o.id having sum(r.importe)>o.importe`;
    assert.equal(invalidReverses.length,0);
    const [n]=await client`select (select count(*) from ledger_poc.movimientos)::int movimientos,
      (select count(*) from ledger_poc.entradas)::int entradas`;
    console.log('INFO oráculo=' + JSON.stringify(n));
  });
  console.log('RESULTADO ' + checks + ' comprobaciones PASS; duración_ms=' + Math.round(performance.now()-started));
} catch(e) {
  console.log('RESULTADO NO VERIFICADO/NO APTO [' + code(e) + ']');
  process.exitCode=1;
} finally {
  let clean=true;
  if (client) await client.end({timeout:2}).catch(()=>{clean=false;});
  if (created) {
    try {
      await admin.unsafe('DROP DATABASE '+ident(database)+' WITH (FORCE)');
      const [r]=await admin`select count(*)::int n from pg_database where datname=${database}`;
      assert.equal(r.n,0);
      console.log('CLEANUP base eliminada y ausencia comprobada: '+database);
    } catch { clean=false; console.log('CLEANUP FAIL base sintética: '+database); }
  }
  for (const role of madeRoles.reverse()) {
    try { await admin.unsafe('DROP ROLE '+ident(role)); }
    catch { clean=false; console.log('CLEANUP FAIL rol sintético: '+role); }
  }
  if (clean && madeRoles.length) {
    try {
      const [r]=await admin`select count(*)::int n from pg_roles where rolname in (${roles.a},${roles.b},${roles.owner})`;
      assert.equal(r.n,0);
    } catch { clean=false; }
  }
  if (clean) console.log('CLEANUP roles eliminados; ausencia comprobada');
  else process.exitCode=1;
  await admin.end({timeout:2});
}
