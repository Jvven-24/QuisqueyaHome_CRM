/**
 * Pruebas de la conversión transaccional de un lead a negocio (`conversion.ts`)
 * con dobles en memoria.
 */

import assert from "node:assert/strict";
import { test } from "node:test";
import { ConflictError, NotFoundError } from "../../domain/errors.ts";
import type { Actor } from "../../domain/rbac.ts";
import { auditoriaEnMemoria } from "../testing/auditoria-en-memoria.ts";
import { unidadDeTrabajoEnMemoria } from "../testing/unidad-de-trabajo-en-memoria.ts";
import { convertirLead } from "./conversion.ts";
import { leadsEnMemoria, type SemillaLeads } from "./en-memoria.ts";
import type { Lead, RepositorioLeads } from "./puertos.ts";

const broker: Actor = { userId: 5, roleSlug: "broker", permissions: [] };
const admin: Actor = { userId: 1, roleSlug: "administrador", permissions: [] };

function lead(parcial: Partial<Lead> & { id: number }): Lead {
  return {
    contactId: 7,
    sourceId: 2,
    projectId: null,
    projectInterestText: null,
    zoneInterest: null,
    operationType: "rent",
    currency: "DOP",
    budgetMinCents: null,
    budgetMaxCents: null,
    bedrooms: null,
    status: "new",
    brokerId: 6,
    suggestedBrokerId: 9,
    sourceVideoUrl: null,
    campaign: null,
    utmSource: null,
    utmMedium: null,
    utmCampaign: null,
    originalMessage: null,
    externalId: null,
    receivedAt: new Date("2025-01-01T00:00:00Z"),
    firstContactedAt: null,
    convertedDealId: null,
    discardReason: null,
    createdAt: new Date("2025-01-01T00:00:00Z"),
    updatedAt: new Date("2025-01-01T00:00:00Z"),
    createdBy: 9,
    updatedBy: 9,
    deletedAt: null,
    ...parcial,
  };
}

function montar(semilla: SemillaLeads = {}) {
  const leads = leadsEnMemoria({ etapasAbiertas: [3, 4], ...semilla });
  const auditoria = auditoriaEnMemoria();
  const unidad = unidadDeTrabajoEnMemoria({ leads, auditoria }, [leads, auditoria]);
  return { leads, auditoria, unidad, deps: { unidad } };
}

test("convertir: crea el negocio en la primera etapa abierta, marca el lead convertido y audita", async () => {
  const original = lead({ id: 1 });
  const { deps, leads, auditoria } = montar({ leads: [original] });
  const { lead: convertido, deal } = await convertirLead(deps, admin, "all", 1);

  assert.equal(deal.contactId, 7);
  assert.equal(deal.leadId, 1);
  assert.equal(deal.stageId, 3);
  assert.equal(deal.sourceId, 2);
  assert.equal(deal.brokerId, 6, "el broker confirmado del lead, nunca suggestedBrokerId");
  assert.equal(deal.operationType, "rent");
  assert.equal(deal.currency, "DOP");
  assert.ok(deal.stageChangedAt instanceof Date);
  assert.equal(deal.createdBy, 1);
  assert.equal(convertido.status, "converted");
  assert.equal(convertido.convertedDealId, deal.id);
  assert.deepEqual(leads.negocios, [deal]);
  assert.deepEqual(leads.leads, [convertido]);
  assert.deepEqual(auditoria.registros, [
    { accion: "convertir", entidad: "lead", entidadId: 1, antes: original, despues: convertido, actorId: 1 },
  ]);
});

test("convertir un lead sin responsable ni tipo de operación: el negocio queda con quien convierte y en venta", async () => {
  const { deps } = montar({ leads: [lead({ id: 1, brokerId: null, operationType: null })] });
  const { deal } = await convertirLead(deps, admin, "all", 1);

  assert.equal(deal.brokerId, 1);
  assert.equal(deal.operationType, "sale");
});

test("convertir: guardas de estado con sus mensajes literales", async () => {
  const { deps, leads, auditoria } = montar({
    leads: [lead({ id: 1, status: "converted" }), lead({ id: 2, status: "discarded" })],
  });
  await assert.rejects(convertirLead(deps, admin, "all", 1), (error) => {
    assert.ok(error instanceof ConflictError);
    assert.equal(error.message, "Este lead ya fue convertido a negocio.");
    return true;
  });
  await assert.rejects(convertirLead(deps, admin, "all", 2), (error) => {
    assert.ok(error instanceof ConflictError);
    assert.equal(error.message, "Este lead fue descartado; no se puede convertir.");
    return true;
  });
  assert.deepEqual(leads.negocios, []);
  assert.deepEqual(auditoria.registros, []);
});

test("convertir sin etapa inicial en el embudo: ConflictError y nada escrito", async () => {
  const { deps, leads, auditoria } = montar({ leads: [lead({ id: 1 })], etapasAbiertas: [] });
  await assert.rejects(convertirLead(deps, admin, "all", 1), (error) => {
    assert.ok(error instanceof ConflictError);
    assert.equal(error.message, "No hay una etapa inicial configurada en el embudo.");
    return true;
  });
  assert.equal(leads.leads[0]!.status, "new");
  assert.deepEqual(leads.negocios, []);
  assert.deepEqual(auditoria.registros, []);
});

test("convertir un lead inexistente, borrado o fuera del alcance: NotFoundError", async () => {
  const { deps } = montar({
    leads: [lead({ id: 1, brokerId: 9 }), lead({ id: 2, brokerId: 5, deletedAt: new Date() })],
  });
  for (const id of [404, 2, 1]) {
    await assert.rejects(convertirLead(deps, broker, "own", id), NotFoundError);
  }
});

test("convertir un lead propio con alcance own funciona", async () => {
  const { deps } = montar({ leads: [lead({ id: 1, brokerId: 5 })] });
  const { deal } = await convertirLead(deps, broker, "own", 1);
  assert.equal(deal.brokerId, 5);
});

test("un fallo a mitad de la conversión no deja negocio, lead convertido ni auditoría", async () => {
  const { leads, auditoria } = montar({ leads: [lead({ id: 1 })] });
  const roto: RepositorioLeads = {
    ...leads,
    marcarConvertido: async () => {
      throw new Error("falla al sellar el lead");
    },
  };
  const unidad = unidadDeTrabajoEnMemoria({ leads: roto, auditoria }, [leads, auditoria]);

  await assert.rejects(convertirLead({ unidad }, admin, "all", 1), /falla al sellar el lead/);
  assert.deepEqual(leads.negocios, [], "el negocio creado se deshizo");
  assert.equal(leads.leads[0]!.status, "new");
  assert.equal(leads.leads[0]!.convertedDealId, null);
  assert.deepEqual(auditoria.registros, []);
});
