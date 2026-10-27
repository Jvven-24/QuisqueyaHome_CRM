/**
 * Semilla idempotente para la base de PRUEBAS aislada (qh-test-db, 127.0.0.1:55432).
 * Uso: QH_TEST_SEED=1 node --env-file=.env scripts/seed-test.ts [--counts]
 * Rechaza cualquier destino que no sea loopback:55432. Nunca borra ni actualiza datos.
 */
import { readFileSync } from "node:fs";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { and, gte, lt, sql, getTableColumns, getTableName } from "drizzle-orm";
import type { PgTable, AnyPgColumn } from "drizzle-orm/pg-core";
import * as schema from "../src/infrastructure/db/schema.ts";
import { BASE_ID, INSERT_ORDER, SEED } from "./seed/catalog.ts";
import { generateDataset } from "./seed/generator.ts";

export const TEST_PORT = "55432";
export function assertTestDestination(url: string | undefined, flag = process.env.QH_TEST_SEED) {
  if (flag !== "1") throw new Error("Falta QH_TEST_SEED=1");
  if (!url) throw new Error("Falta DATABASE_URL");
  const p = new URL(url);
  if (!["postgres:", "postgresql:"].includes(p.protocol) || !["127.0.0.1", "localhost"].includes(p.hostname) || p.port !== TEST_PORT || p.search) {
    throw new Error("Destino rechazado: solo la base de pruebas en loopback:" + TEST_PORT);
  }
  return url;
}

const EXTRA = 2_000_000;
const NOTIF_TYPES = ["lead_asignado", "visita_programada", "seguimiento_vencido", "reserva_creada", "comision_aprobada"];

async function main() {
  const url = assertTestDestination(process.env.DATABASE_URL);
  const conn = postgres(url, { prepare: false, max: 1, connect_timeout: 5 });
  try {
    const db = drizzle(conn);
    const tables = ["roles", "users", "leads", "notifications", "activities", "academy_items", "message_templates", "outbox", "projects", "units", "contacts", "deals", "goals", "commissions", "academy_checklist_items", "lead_sources", "pipeline_stages", "permissions"];
    if (process.argv.includes("--counts")) {
      const out: Record<string, number> = {};
      for (const t of tables) out[t] = Number((await conn.unsafe(`select count(*)::int c from "${t}"`))[0]!.c);
      console.log(JSON.stringify(out, null, 2)); return;
    }
    await conn.unsafe(readFileSync("db/seed-filtered.sql", "utf8"));
    await db.transaction(async tx => {
      await tx.execute(sql`select pg_advisory_xact_lock(20261026)`);
      const [broker] = await tx.select().from(schema.roles).where(sql`${schema.roles.slug} = 'broker'`);
      if (!broker) throw new Error("Falta rol broker tras catálogos");
      const ds = generateDataset({ brokerRoleId: broker.id, pipelineStages: await tx.select().from(schema.pipelineStages), leadSources: await tx.select().from(schema.leadSources), lossReasons: await tx.select().from(schema.lossReasons) }, SEED);
      for (const key of INSERT_ORDER) {
        const table: PgTable = schema[key];
        const rows = ds[key] as Record<string, unknown>[];
        // El generador base no rellena loss_comment, exigido desde la migración 0004.
        if (key === "deals") for (const r of rows) if (r.lossReasonId != null && !r.lossComment) r.lossComment = "Motivo de pérdida registrado (dato de prueba).";
        const pkName = key === "brokerProfiles" ? "userId" : "id";
        const pk: AnyPgColumn = getTableColumns(table)[pkName]!;
        const have = new Set((await tx.select({ v: pk }).from(table).where(and(gte(pk, BASE_ID), lt(pk, BASE_ID + rows.length)))).map(r => r.v));
        const pending = rows.filter(r => !have.has(r[pkName]));
        if (["zones", "agencies", "paymentMethods", "unitInventoryStates"].includes(key)) {
          const slugs = new Set((await tx.execute(sql`select slug from ${table}`)).map(r => (r as { slug: string }).slug));
          for (let i = pending.length - 1; i >= 0; i--) if (slugs.has(String(pending[i]!.slug))) pending.splice(i, 1);
        }
        for (let o = 0; o < pending.length; o += 200) await tx.insert(table).values(pending.slice(o, o + 200) as never);
        if (key !== "brokerProfiles" && pending.length) { const n = getTableName(table); await tx.execute(sql`select setval(pg_get_serial_sequence(${n}, 'id'), (select max(id) from ${sql.identifier(n)}))`); }
      }
      const [admin] = await tx.select().from(schema.roles).where(sql`${schema.roles.slug} = 'admin'`);
      await tx.insert(schema.users).values({ id: EXTRA, roleId: (admin ?? broker).id, fullName: "Ana Admin Prueba", email: "admin.prueba@example.com", initials: "AA", jobTitle: "Administradora (prueba)", phone: "+18095550100", isActive: true }).onConflictDoNothing();
      const brokers = ds.users.map(u => u.id!);
      const notif = Array.from({ length: 40 }, (_, i) => ({ id: EXTRA + i, userId: i % 5 === 0 ? EXTRA : brokers[i % brokers.length]!, notificationType: NOTIF_TYPES[i % NOTIF_TYPES.length]!, title: `Aviso de prueba ${i + 1}`, body: "Notificación ficticia de pruebas. No contactar.", entityType: "lead" as const, entityId: BASE_ID + i, isRead: i % 3 === 0, readAt: i % 3 === 0 ? new Date("2026-10-20T15:00:00Z") : null }));
      await tx.insert(schema.notifications).values(notif).onConflictDoNothing();
      const items = [["Inducción al CRM", "session"], ["Checklist de visita a proyecto", "checklist"], ["Brochure Punta Cana 2026", "material"], ["Ley 189-11 y fideicomiso", "session"], ["Confotur para inversionistas", "material"]] as const;
      await tx.insert(schema.academyItems).values(items.map(([title, itemType], i) => ({ id: EXTRA + i, title, itemType, description: "Contenido de prueba", durationMinutes: 20 + i * 5, position: i, isActive: true, publishedAt: new Date("2026-10-01T12:00:00Z") }))).onConflictDoNothing();
      await tx.insert(schema.academyChecklistItems).values(["Confirmar cita por WhatsApp", "Llevar planos y lista de precios", "Registrar visita en agenda"].map((label, i) => ({ id: EXTRA + i, academyItemId: EXTRA + 1, position: i, label }))).onConflictDoNothing();
      const tpl = [["Bienvenida lead", "whatsapp", "Hola {{nombre}}, gracias por tu interés en {{proyecto}}."], ["Recordatorio visita", "whatsapp", "{{nombre}}, te esperamos el {{fecha}} en {{proyecto}}."], ["Seguimiento cotización", "email", "Adjuntamos la cotización de {{unidad}}."], ["Reserva confirmada", "email", "Tu reserva en {{proyecto}} está confirmada."]];
      await tx.insert(schema.messageTemplates).values(tpl.map(([name, channel, body], i) => ({ id: EXTRA + i, name: name!, channel: channel!, body: body!, category: "prueba", variables: JSON.stringify(["nombre", "proyecto", "fecha", "unidad"]), isActive: true }))).onConflictDoNothing();
      const ev = Array.from({ length: 6 }, (_, i) => ({ eventId: `00000000-0000-4000-8000-${String(EXTRA + i).padStart(12, "0")}`, eventType: "LeadCreado" as const, aggregateId: BASE_ID + i, correlationId: `00000000-0000-4000-9000-${String(EXTRA + i).padStart(12, "0")}`, payload: { contactId: BASE_ID + i }, idempotencyKey: `seed-test-lead-${i}`, sentAt: i < 3 ? new Date("2026-10-20T15:00:00Z") : null }));
      await tx.insert(schema.outbox).values(ev).onConflictDoNothing();
      for (const n of ["users", "notifications", "academy_items", "academy_checklist_items", "message_templates"]) await tx.execute(sql`select setval(pg_get_serial_sequence(${n}, 'id'), (select max(id) from ${sql.identifier(n)}))`);
    });
    console.log("Semilla de pruebas aplicada (idempotente).");
  } finally { await conn.end({ timeout: 5 }); }
}
if (import.meta.url === `file://${process.argv[1]}`) await main().catch(e => { console.error("seed-test abortado:", e instanceof Error ? (String((e as {cause?:unknown}).cause ?? "") + " :: " + e.message).replace(/\w+:\/\/\S+/g, "<url>").slice(0, 300) : "error"); process.exitCode = 1; });
