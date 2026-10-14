import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { after, test } from 'node:test';
import { eq, inArray } from 'drizzle-orm';
import { connection, checked, rollback } from './fixture.ts';
import * as tables from '../../src/infrastructure/db/schema.ts';
import { crmEnMemoria } from '../../src/application/testing/crm-en-memoria.ts';
import { FalloCrm } from '../../src/application/compartido/crm.ts';
import { consumidorCrm, TIPOS_CONSUMIDOS_POR_DEFECTO } from '../../src/infrastructure/integraciones/outbox/consumidores.ts';
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

check('el CHECK outbox_type_check rechaza hoy tipos fuera de los tres del CRM (ampliarlo es trabajo de cada módulo)', async () => {
  await assert.rejects(rollback(async tx => {
    const id = randomUUID();
    await tx.insert(tables.outbox).values({ eventId: id, eventType: 'PagoRegistrado' as 'LeadCreado', aggregateId: 1, correlationId: id, idempotencyKey: id, payload: {} });
  }), (error: unknown) => {
    const causa = (error as { cause?: { code?: string; constraint_name?: string } }).cause ?? (error as { code?: string });
    return (causa as { code?: string }).code === '23514' && /outbox_type_check/.test(String((causa as { constraint_name?: string }).constraint_name ?? 'outbox_type_check'));
  });
});

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
