import assert from "node:assert/strict";
import { test } from "node:test";
import { exportContactData } from "./privacidad.ts";
import { contactosEnMemoria } from "./en-memoria.ts";
import { auditoriaEnMemoria } from "../testing/auditoria-en-memoria.ts";
import { unidadDeTrabajoEnMemoria } from "../testing/unidad-de-trabajo-en-memoria.ts";
import { ForbiddenError, NotFoundError } from "../../domain/errors.ts";
import type { Actor } from "../../domain/rbac.ts";
import type { Contacto } from "./puertos.ts";
import { matchInventory, type Demand, type InventoryCandidate } from "./matching.ts";
const base: Contacto = { id: 1, fullName: "Ana Ejemplo", phone: "+18095550101", phoneDisplay: null, email: "ana@example.com", country: null, city: null, sourceId: null, brokerId: 5, notes: "Nota personal", lastInteractionAt: null, consentAt: null, consentSource: null, createdAt: new Date("2026-10-01"), updatedAt: new Date("2026-10-01"), createdBy: 1, updatedBy: 1, deletedAt: null };
const actor: Actor = { userId: 5, roleSlug: "broker", permissions: [{ resource: "contacts", action: "view", scope: "own" }, { resource: "contacts", action: "export", scope: "own" }] };
function setup(change: Partial<Contacto> = {}) { const contactos = contactosEnMemoria([{ ...base, ...change }]); const auditoria = auditoriaEnMemoria(); const unidad = unidadDeTrabajoEnMemoria({ contactos, auditoria }, [contactos, auditoria]); return { contactos, auditoria, unidad }; }
test("S3 privacidad: exporta campos personales explícitos y audita sin duplicar PII en el log", async () => { const e = setup(); const data = await exportContactData(e, actor, 1); assert.equal(data.nombre, "Ana Ejemplo"); assert.equal(data.notas, "Nota personal"); assert.ok(!("brokerId" in data)); assert.ok(!("createdBy" in data)); assert.equal(e.auditoria.registros[0]!.accion, "exportar"); assert.ok(!JSON.stringify(e.auditoria.registros).includes("ana@example.com")); });
for (const change of [{ brokerId: 9 }, { deletedAt: new Date() }])
    test("S3 privacidad: exportación de fila ajena o borrada devuelve 404 " + JSON.stringify(change), async () => { const e = setup(change); await assert.rejects(exportContactData(e, actor, 1), NotFoundError); assert.equal(e.auditoria.registros.length, 0); });
test("S3 privacidad: lectura all no amplía exportación own", async () => { const e = setup({ brokerId: 9 }); const mixed: Actor = { ...actor, permissions: [{ resource: "contacts", action: "view", scope: "all" }, { resource: "contacts", action: "export", scope: "own" }] }; await assert.rejects(exportContactData(e, mixed, 1), NotFoundError); });
test("S3 privacidad: exportación all no amplía lectura own", async () => { const e = setup({ brokerId: 9 }); const mixed: Actor = { ...actor, permissions: [{ resource: "contacts", action: "view", scope: "own" }, { resource: "contacts", action: "export", scope: "all" }] }; await assert.rejects(exportContactData(e, mixed, 1), NotFoundError); });
for (const action of ["view", "export"] as const)
    test("S3 privacidad: exige permiso " + action, async () => { const e = setup(); await assert.rejects(exportContactData(e, { ...actor, permissions: actor.permissions.filter(p => p.action !== action) }, 1), ForbiddenError); assert.equal(e.auditoria.registros.length, 0); });
test("S3 privacidad: si falla auditoría no entrega datos", async () => { const e = setup(); const unidad = unidadDeTrabajoEnMemoria({ contactos: e.contactos, auditoria: { registrar: async () => { throw new Error("auditoría caída"); } } }, [e.contactos]); await assert.rejects(exportContactData({ unidad }, actor, 1), /auditoría caída/); });
const demand: Demand = { id: "d", name: "Demanda", contact: "Ana", zone: "Punta Cana", currency: "USD", minCents: 10000, maxCents: 30000, bedrooms: 2, areaMin: 90, operation: "sale", priority: "alta", status: "activa" };
const candidate: InventoryCandidate = { id: "u", project: "Proyecto", unit: "A-1", zone: "Punta Cana", currency: "USD", priceCents: 20000, bedrooms: 2, area: 100, operation: "sale", available: true };
test("S3 matching: puntuación completa incluye explicación por criterio", () => { const [match] = matchInventory(demand, [candidate]); assert.equal(match!.score, 100); assert.equal(match!.reasons.length, 4); assert.deepEqual(match!.warnings, []); });
for (const change of [{ available: false }, { operation: "rent" as const }, { currency: "DOP" }])
    test("S3 matching: excluye candidato no elegible " + JSON.stringify(change), () => { const [match] = matchInventory(demand, [{ ...candidate, ...change }]); assert.equal(match!.eligible, false); assert.equal(match!.score, 0); assert.ok(match!.warnings.length); });
test("S3 matching: presupuesto fuera de rango reduce score y añade advertencia", () => { const [match] = matchInventory(demand, [{ ...candidate, priceCents: 30001 }]); assert.equal(match!.score, 60); assert.match(match!.warnings.join(), /fuera del presupuesto/); });
test("S3 matching: orden determinista, elegibles primero y luego puntuación", () => { const rows = matchInventory(demand, [{ ...candidate, id: "z", available: false }, { ...candidate, id: "b", area: 20 }, { ...candidate, id: "a" }]); assert.deepEqual(rows.map(r => r.candidate.id), ["a", "b", "z"]); assert.deepEqual(matchInventory(demand, []), []); });
