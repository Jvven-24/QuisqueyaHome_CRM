import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { after, test } from 'node:test';
import { desc, eq } from 'drizzle-orm';
import { db, connection, actorFor, checked, rollback } from './fixture.ts';
import * as tables from '../../src/infrastructure/db/schema.ts';
import { auditar } from '../../src/infrastructure/audit.ts';
import { consultarEstadoOutbox } from '../../src/infrastructure/integraciones/outbox/estado.ts';
import { despacharMensajeAuditado } from '../../src/application/comunicaciones/casos-de-uso.ts';
import type { AuditoriaDespachos } from '../../src/application/comunicaciones/puertos.ts';
import type { Db } from '../../src/infrastructure/db/client.ts';

const [admin, assistant, broker] = await Promise.all(['admin', 'assistant', 'broker'].map(actorFor));
after(async () => { await connection.end({ timeout: 5 }); });
const check = (name: string, fn: () => Promise<unknown>) => test(`DB comunicaciones ${name}`, { concurrency: false }, async () => { await checked(fn); });

check('seed: solo admin y asistente tienen communications:create con alcance all (despacho); el broker no', async () => {
  const todo = (a: typeof admin) => a!.permissions.find(p => p.resource === 'communications' && p.action === 'create')?.scope;
  assert.equal(todo(admin), 'all');
  assert.equal(todo(assistant), 'all');
  assert.notEqual(todo(broker), 'all');
});

check('outbox: consultarEstadoOutbox cuenta pendientes, enviados y fallidos reales', async () => rollback(async tx => {
  const ejecutor = tx as unknown as Db;
  const antes = await consultarEstadoOutbox(ejecutor);
  const ahora = new Date('2026-10-14T15:00:00Z');
  const base = () => { const id = randomUUID(); return { eventId: id, eventType: 'LeadCreado' as const, aggregateId: 1, correlationId: id, idempotencyKey: id, payload: { contactId: 1 } }; };
  await tx.insert(tables.outbox).values([
    base(),
    base(),
    { ...base(), sentAt: ahora, attempts: 1 },
    { ...base(), deadAt: ahora, attempts: 5, lastFailure: 'NON_RETRYABLE' as const },
  ]);
  const despues = await consultarEstadoOutbox(ejecutor);
  assert.equal(despues.pendientes - antes.pendientes, 2);
  assert.equal(despues.enviados - antes.enviados, 1);
  assert.equal(despues.fallidos - antes.fallidos, 1);
  assert.ok(despues.ultimoEnviadoAt && despues.ultimoEnviadoAt.getTime() >= ahora.getTime());
}));

check('auditoría: un despacho queda en audit_log con acción enviar, autor y destinatario enmascarado', async () => rollback(async tx => {
  // Mismo registro que el adaptador `auditoriaDespachosDrizzle`, pero dentro de una transacción que se revierte.
  const auditoria: AuditoriaDespachos = {
    registrar: (actor, registro) => auditar(tx, actor, {
      accion: 'enviar', entidad: 'user', entidadId: actor.userId,
      despues: { canal: registro.canal, destinatario: registro.destinatarioEnmascarado, ok: registro.ok, mensajeId: registro.mensajeId, error: registro.error, enviadoAt: registro.enviadoAt.toISOString() },
    }),
  };
  const proveedor = { despachar: async (m: { canal: 'whatsapp' | 'telegram' | 'email' | 'sms' | 'webhook' }) => ({ ok: true, canal: m.canal, mensajeId: 'm-db-1', enviadoAt: new Date() }) };
  const { auditado } = await despacharMensajeAuditado({ proveedor, auditoria }, admin!, {
    canal: 'whatsapp', destinatario: '+1 809 555 0142', cuerpoOPlantilla: 'texto confidencial',
  });
  assert.equal(auditado, true);
  const [fila] = await tx.select().from(tables.auditLog).where(eq(tables.auditLog.action, 'enviar')).orderBy(desc(tables.auditLog.id)).limit(1);
  assert.ok(fila);
  assert.equal(fila.userId, admin!.userId);
  assert.equal(fila.entityType, 'user');
  assert.equal(fila.entityId, admin!.userId);
  assert.ok(fila.createdAt instanceof Date);
  assert.ok(fila.newValue);
  const nuevo = JSON.parse(fila.newValue) as Record<string, unknown>;
  assert.equal(nuevo.canal, 'whatsapp');
  assert.equal(nuevo.destinatario, '***142');
  assert.equal(nuevo.ok, true);
  assert.ok(!fila.newValue.includes('5550142'));
  assert.ok(!fila.newValue.includes('confidencial'));
}));
