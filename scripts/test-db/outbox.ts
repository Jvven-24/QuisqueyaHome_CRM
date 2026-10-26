import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { after, test } from 'node:test';
import { eq, inArray, sql } from 'drizzle-orm';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { actorFor, db, connection, checked, rollback } from './fixture.ts';
import * as tables from '../../src/infrastructure/db/schema.ts';
import { crmEnMemoria } from '../../src/application/testing/crm-en-memoria.ts';
import { FalloCrm } from '../../src/application/compartido/crm.ts';
import { consumidorCrm, registroPorDefecto, TIPOS_CONSUMIDOS_POR_DEFECTO } from '../../src/infrastructure/integraciones/outbox/consumidores.ts';
import { REGISTRO_EVENTOS_FINANCIEROS } from '../../src/application/compartido/eventos-financieros.ts';
import { consultarEstadoOutbox } from '../../src/infrastructure/integraciones/outbox/estado.ts';
import { crearRegistro } from '../../src/infrastructure/integraciones/outbox/registro.ts';
import { colaOutboxDrizzle } from '../../src/infrastructure/integraciones/outbox/repositorio.ts';
import { procesarOutbox } from '../../src/infrastructure/integraciones/outbox/worker.ts';
import type { Db } from '../../src/infrastructure/db/client.ts';

after(async () => { await connection.end({ timeout: 5 }); });
const check = (name: string, fn: () => Promise<unknown>) => test(`DB outbox ${name}`, { concurrency: false }, async () => { await checked(fn); });

const t0 = new Date('2026-10-14T15:00:00Z');
const fila = (eventType: 'LeadCreado' | 'ActividadRegistrada', creado: Date, aggregateId = 1) => {
  const id = randomUUID();
  const payload = eventType === 'LeadCreado' ? { contactId: aggregateId } : { id: aggregateId, activityType: 'call' };
  return { eventId: id, eventType, aggregateId, correlationId: id, idempotencyKey: id, payload, createdAt: creado, availableAt: creado };
};

check('TX-44: el CHECK outbox_type_check rechaza tipos desconocidos después de 0011', async () => {
  await assert.rejects(rollback(async tx => {
    const id = randomUUID();
    await tx.insert(tables.outbox).values({ eventId: id, eventType: 'PagoRegistrado' as 'LeadCreado', aggregateId: 1, correlationId: id, idempotencyKey: id, payload: {} });
  }), (error: unknown) => {
    const causa = (error as { cause?: { code?: string; constraint_name?: string } }).cause ?? (error as { code?: string });
    return (causa as { code?: string }).code === '23514' && (causa as { constraint_name?: string }).constraint_name === 'outbox_type_check';
  });
});

check('TX-44: el migrador oficial aplica 0011 sobre eventos históricos sin cambiarlos y permite reejecución', async () => {
  // fixture.ts ya verificó loopback, nombre aleatorio y esquema. Este ensayo
  // adicional exige base desechable: jamás manipula el journal de desarrollo.
  const context = (globalThis as typeof globalThis & { [key: symbol]: { mode: string } })[Symbol.for('qh.test-db')];
  assert.equal(context?.mode, 'database', 'el ensayo oficial de 0011 requiere base temporal, no fallback de esquema');
  const journal = JSON.parse(readFileSync(new URL('../../drizzle/meta/_journal.json', import.meta.url), 'utf8')) as { entries: { idx: number; tag: string; when: number }[] };
  const last = journal.entries.find(e => e.idx === 11 && e.tag === '0011_m40_outbox_tipos')!;
  assert.equal(last.idx, 11);
  assert.equal(last.tag, '0011_m40_outbox_tipos');
  const eventos = (['LeadCreado', 'NegocioCambioEtapa', 'ActividadRegistrada'] as const).map(eventType => {
    const id = randomUUID();
    return { eventId: id, eventType, aggregateId: 1, correlationId: id, idempotencyKey: id, payload: { qa: id }, createdAt: t0, availableAt: t0 };
  });
  const ids = eventos.map(evento => evento.eventId);
  try {
    await db.transaction(async tx => {
      await tx.execute(sql`alter table ${tables.outbox} drop constraint outbox_type_check,
        add constraint outbox_type_check check (event_type in ('LeadCreado','NegocioCambioEtapa','ActividadRegistrada'))`);
      await tx.insert(tables.outbox).values(eventos);
      const deleted = await tx.execute(sql`delete from drizzle.__drizzle_migrations where created_at >= ${last.when} returning id`);
      assert.ok(deleted.length >= 1, 'el destino temporal estaba migrado hasta 0011');
    });
    const antes = await db.select().from(tables.outbox).where(inArray(tables.outbox.eventId, ids)).orderBy(tables.outbox.eventId);
    await migrate(db, { migrationsFolder: 'drizzle' });
    const despues = await db.select().from(tables.outbox).where(inArray(tables.outbox.eventId, ids)).orderBy(tables.outbox.eventId);
    assert.deepEqual(despues, antes, '0011 conserva cada columna de los tres eventos históricos');
    const migraciones = await db.execute(sql`select id, hash, created_at from drizzle.__drizzle_migrations order by id`);
    await migrate(db, { migrationsFolder: 'drizzle' });
    assert.deepEqual(await db.execute(sql`select id, hash, created_at from drizzle.__drizzle_migrations order by id`), migraciones);
    assert.deepEqual(await db.select().from(tables.outbox).where(inArray(tables.outbox.eventId, ids)).orderBy(tables.outbox.eventId), antes);
  } finally {
    await db.delete(tables.outbox).where(inArray(tables.outbox.eventId, ids));
  }
});

check('TX-44: los 39 tipos financieros y tres históricos se confirman con auditoría en la misma transacción', async () => {
  const eventos = [
    { tipo: 'LeadCreado', entidad: 'lead', accion: 'crear' },
    { tipo: 'NegocioCambioEtapa', entidad: 'deal', accion: 'cambiar_etapa' },
    { tipo: 'ActividadRegistrada', entidad: 'activity', accion: 'crear' },
    ...REGISTRO_EVENTOS_FINANCIEROS,
  ] as const;
  assert.equal(eventos.length, 42);
  const actor = await actorFor('admin');
  const ids = eventos.map(() => randomUUID());
  const auditorias: number[] = [];
  try {
    await db.transaction(async tx => {
      for (const [index, evento] of eventos.entries()) {
        const id = ids[index]!;
        const payload = { publicId: randomUUID(), aggregateVersion: 1, commandId: id, correlationId: id };
        await tx.insert(tables.outbox).values({ eventId: id, eventType: evento.tipo, aggregateId: 1, correlationId: id, idempotencyKey: id, payload });
        const [audit] = await tx.insert(tables.auditLog).values({ userId: actor.userId, entityType: evento.entidad, entityId: 1, action: evento.accion, newValue: id }).returning({ id: tables.auditLog.id });
        auditorias.push(audit!.id);
      }
    });
    // Leer fuera de la transacción demuestra COMMIT, no solo RETURNING.
    const persistidos = await db.select().from(tables.outbox).where(inArray(tables.outbox.eventId, ids));
    const auditados = await db.select().from(tables.auditLog).where(inArray(tables.auditLog.id, auditorias));
    assert.equal(persistidos.length, 42);
    assert.equal(auditados.length, 42);
    for (const [index, evento] of eventos.entries()) {
      const fila = persistidos.find(row => row.eventId === ids[index]);
      const audit = auditados.find(row => row.newValue === ids[index]);
      assert.equal(fila?.eventType, evento.tipo);
      assert.equal(fila?.version, 1);
      assert.equal(audit?.entityType, evento.entidad);
      assert.equal(audit?.action, evento.accion);
      assert.equal(audit?.userId, actor.userId);
    }
  } finally {
    await db.delete(tables.outbox).where(inArray(tables.outbox.eventId, ids));
    if (auditorias.length) await db.delete(tables.auditLog).where(inArray(tables.auditLog.id, auditorias));
  }
});

for (const fallo of ['outbox', 'auditoria'] as const) {
  check(`TX-28/44: fallo de ${fallo} revierte dato, auditoría y evento financiero`, async () => {
    const marker = randomUUID();
    const email = `${marker}@example.invalid`;
    const actor = await actorFor('admin');
    await assert.rejects(db.transaction(async tx => {
      const [contacto] = await tx.insert(tables.contacts).values({ fullName: 'QA M40 rollback', email }).returning({ id: tables.contacts.id });
      assert.ok(contacto);
      const evento = { eventId: marker, eventType: 'PagoConfirmado' as const, aggregateId: contacto.id, correlationId: marker, idempotencyKey: marker,
        payload: { publicId: randomUUID(), aggregateVersion: 1, commandId: marker, correlationId: marker } };
      if (fallo === 'auditoria') {
        await tx.insert(tables.outbox).values(evento);
        // Inyección sin quitar restricciones: NOT NULL de audit_log.action.
        await tx.insert(tables.auditLog).values({ entityType: 'contact', entityId: contacto.id, userId: actor.userId, action: sql`null`, newValue: marker });
      } else {
        await tx.insert(tables.auditLog).values({ entityType: 'contact', entityId: contacto.id, userId: actor.userId, action: 'crear', newValue: marker });
        await tx.insert(tables.outbox).values(evento);
        // Bypass deliberado del tipado para probar el CHECK de PostgreSQL.
        await tx.insert(tables.outbox).values({ ...evento, eventId: randomUUID(), idempotencyKey: randomUUID(), eventType: 'PagoRegistrado' as 'LeadCreado' });
      }
    }), (error: unknown) => {
      const cause = (error as { cause?: { code?: string; constraint_name?: string; table_name?: string; column_name?: string } }).cause;
      return fallo === 'outbox'
        ? cause?.code === '23514' && cause.constraint_name === 'outbox_type_check'
        : cause?.code === '23502' && cause.table_name === 'audit_log' && cause.column_name === 'action';
    });
    assert.equal((await db.select({ id: tables.contacts.id }).from(tables.contacts).where(eq(tables.contacts.email, email))).length, 0);
    assert.equal((await db.select({ id: tables.auditLog.id }).from(tables.auditLog).where(eq(tables.auditLog.newValue, marker))).length, 0);
    assert.equal((await db.select({ id: tables.outbox.eventId }).from(tables.outbox).where(eq(tables.outbox.correlationId, marker))).length, 0);
  });
}

check('TX-29/44: los 39 eventos financieros sin consumidor quedan íntegros tras dos pasadas reales', async () => rollback(async tx => {
  const ejecutor = tx as unknown as Db;
  const rows = REGISTRO_EVENTOS_FINANCIEROS.map(evento => {
    assert.equal(evento.consumidor, null);
    assert.equal(registroPorDefecto.manejadorDe(evento.tipo), undefined);
    const id = randomUUID();
    return { eventId: id, eventType: evento.tipo, aggregateId: 1, correlationId: id, idempotencyKey: id,
      payload: { publicId: randomUUID(), aggregateVersion: 1, commandId: id, correlationId: id },
      createdAt: new Date('2026-10-14T13:00:00Z'), availableAt: new Date('2026-10-14T13:00:00Z') };
  });
  const ids = rows.map(row => row.eventId);
  await tx.insert(tables.outbox).values(rows);
  const control = fila('LeadCreado', new Date('2026-10-14T14:30:00Z'), 8);
  await tx.insert(tables.outbox).values(control);
  const antes = await tx.select().from(tables.outbox).where(inArray(tables.outbox.eventId, ids)).orderBy(tables.outbox.eventId);
  const crm = crmEnMemoria();
  await procesarOutbox({ cola: colaOutboxDrizzle(ejecutor), crm, registro: registroPorDefecto, ahora: () => t0 }, 50);
  await procesarOutbox({ cola: colaOutboxDrizzle(ejecutor), crm, registro: registroPorDefecto, ahora: () => new Date(t0.getTime() + 3_600_000) }, 50);
  const despues = await tx.select().from(tables.outbox).where(inArray(tables.outbox.eventId, ids)).orderBy(tables.outbox.eventId);
  assert.equal(despues.length, 39);
  assert.deepEqual(despues, antes, 'no cambian payload, intentos, disponibilidad, historial ni estado');
  assert.equal((await tx.select().from(tables.outboxDead).where(inArray(tables.outboxDead.eventId, ids))).length, 0);
  const [procesado] = await tx.select().from(tables.outbox).where(eq(tables.outbox.eventId, control.eventId));
  assert.ok(procesado?.sentAt, 'control positivo: el worker sí procesó el evento histórico');
  assert.equal(procesado.attempts, 1);
}));

check('reclamo por tipos: un evento sin consumidor, aunque sea el más antiguo, no se reclama ni va a cola muerta', async () => rollback(async tx => {
  const ejecutor = tx as unknown as Db;
  // El CHECK no admite tipos externos, así que el «sin consumidor» es un tipo válido que el registro de la prueba no declara.
  const registro = crearRegistro([{ destino: 'crm', manejadores: { LeadCreado: consumidorCrm.manejadores.LeadCreado! } }]);
  const sinConsumidor = fila('ActividadRegistrada', new Date('2026-10-14T14:00:00Z'), 7);
  const conConsumidor = fila('LeadCreado', new Date('2026-10-14T14:30:00Z'), 8);
  const antes = await consultarEstadoOutbox(ejecutor, registro.tipos());
  await tx.insert(tables.outbox).values([sinConsumidor, conConsumidor]);
  const crm = crmEnMemoria();
  await procesarOutbox({ cola: colaOutboxDrizzle(ejecutor), crm, registro, ahora: () => t0 }, 50);
  // Una segunda pasada tampoco debe tocarlo.
  await procesarOutbox({ cola: colaOutboxDrizzle(ejecutor), crm, registro, ahora: () => new Date(t0.getTime() + 3_600_000) }, 50);

  const [a] = await tx.select().from(tables.outbox).where(eq(tables.outbox.eventId, sinConsumidor.eventId));
  assert.ok(a);
  assert.equal(a.sentAt, null);
  assert.equal(a.deadAt, null);
  assert.equal(a.attempts, 0);
  assert.equal(a.lastFailure, null);
  assert.deepEqual(a.attemptHistory, []);
  const [b] = await tx.select().from(tables.outbox).where(eq(tables.outbox.eventId, conConsumidor.eventId));
  assert.ok(b?.sentAt);
  assert.equal(b.attempts, 1);
  const muertos = await tx.select().from(tables.outboxDead).where(inArray(tables.outboxDead.eventId, [sinConsumidor.eventId, conConsumidor.eventId]));
  assert.equal(muertos.length, 0);

  const despues = await consultarEstadoOutbox(ejecutor, registro.tipos());
  assert.equal(despues.sinConsumidor - antes.sinConsumidor, 1); // el sin consumidor sigue ahí
  assert.equal(despues.pendientes - antes.pendientes, 1);       // el LeadCreado salió de pendientes, el otro no
  assert.equal(despues.enviados - antes.enviados, 1);
  assert.equal(despues.fallidos - antes.fallidos, 0);
}));

check('estado: «sin consumidor» cuenta solo pendientes de tipos fuera del registro', async () => rollback(async tx => {
  const ejecutor = tx as unknown as Db;
  const antes = await consultarEstadoOutbox(ejecutor, ['LeadCreado']);
  await tx.insert(tables.outbox).values([
    fila('LeadCreado', t0), fila('ActividadRegistrada', t0),
    { ...fila('ActividadRegistrada', t0), sentAt: t0, attempts: 1 },
    { ...fila('ActividadRegistrada', t0), deadAt: t0, attempts: 5, lastFailure: 'NON_RETRYABLE' as const },
  ]);
  // Registro que solo conoce LeadCreado: cuenta el pendiente de Actividad; el enviado y el muerto no.
  const parcial = await consultarEstadoOutbox(ejecutor, ['LeadCreado']);
  assert.equal(parcial.sinConsumidor - antes.sinConsumidor, 1);
  assert.equal(parcial.pendientes - antes.pendientes, 2);
  // Registro completo: ningún pendiente del CRM queda sin consumidor.
  const completo = await consultarEstadoOutbox(ejecutor, TIPOS_CONSUMIDOS_POR_DEFECTO);
  assert.equal(completo.sinConsumidor, 0);
  // Sin consumidores: todo pendiente lo está.
  const vacio = await consultarEstadoOutbox(ejecutor, []);
  assert.equal(vacio.sinConsumidor, vacio.pendientes);
}));

check('cola muerta solo tras agotar reintentos de un manejador existente (backoff y persistencia reales)', async () => rollback(async tx => {
  const ejecutor = tx as unknown as Db;
  const registro = crearRegistro([{ destino: 'crm', manejadores: { LeadCreado: async () => { throw new FalloCrm('RETRYABLE'); } } }]);
  const evento = fila('LeadCreado', new Date('2026-10-14T14:00:00Z'), 5);
  await tx.insert(tables.outbox).values(evento);
  let reloj = t0.getTime();
  for (let intento = 1; intento <= 5; intento++) {
    await procesarOutbox({ cola: colaOutboxDrizzle(ejecutor), crm: crmEnMemoria(), registro, ahora: () => new Date(reloj), random: () => 0 }, 1);
    const [actual] = await tx.select().from(tables.outbox).where(eq(tables.outbox.eventId, evento.eventId));
    assert.ok(actual);
    assert.equal(actual.attempts, intento);
    const muertos = await tx.select().from(tables.outboxDead).where(eq(tables.outboxDead.eventId, evento.eventId));
    if (intento < 5) { assert.equal(actual.deadAt, null); assert.equal(muertos.length, 0); }
    else { assert.ok(actual.deadAt); assert.equal(muertos.length, 1); assert.equal(muertos[0]!.reason, 'RETRYABLE'); }
    reloj += 120_000;
  }
}));
