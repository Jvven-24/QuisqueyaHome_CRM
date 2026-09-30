/**
 * Pruebas de los casos de uso de Leads con dobles en memoria: alta manual,
 * asignación, descarte y captura externa. La conversión está en
 * `conversion.test.ts`.
 *
 * Límite honesto: en memoria no hay concurrencia. Que dos entregas simultáneas
 * del mismo `externalId` no dupliquen lo garantiza el `ON CONFLICT DO NOTHING`
 * del adaptador Drizzle (índice único parcial `leads_external_id_unq`), no estos
 * dobles. Lo que sí se comprueba es que el caso de uso use el único método
 * atómico del puerto y que una entrega repetida no escriba nada nuevo.
 */

import assert from "node:assert/strict";
import { test } from "node:test";
import { sugerirBroker } from "../../domain/asignacion-lead.ts";
import { ConflictError, NotFoundError, ValidationError } from "../../domain/errors.ts";
import type { Actor } from "../../domain/rbac.ts";
import { auditoriaEnMemoria } from "../testing/auditoria-en-memoria.ts";
import { unidadDeTrabajoEnMemoria } from "../testing/unidad-de-trabajo-en-memoria.ts";
import { asignarResponsableDeLead, capturarLeadExterno, crearLead, descartarLead } from "./casos-de-uso.ts";
import { leadsEnMemoria, type SemillaLeads } from "./en-memoria.ts";
import type { CandidatoBroker, Contacto, Lead, RepositorioLeads } from "./puertos.ts";

const MENSAJE_DUPLICADO = "Ya existe un contacto con ese teléfono o correo. Confirma si quieres crearlo de todas formas.";
const MENSAJE_NO_BROKER = "Ese usuario no es un broker activo.";

const broker: Actor = { userId: 5, roleSlug: "broker", permissions: [] };
const admin: Actor = { userId: 1, roleSlug: "administrador", permissions: [] };

const BROKERS: CandidatoBroker[] = [
  { userId: 5, specialty: "Proyectos en planos", handlesRentals: false, annualSalesCents: 100, fullName: "Bea" },
  { userId: 6, specialty: null, handlesRentals: true, annualSalesCents: 50, fullName: "Rafa" },
  { userId: 9, specialty: "Villas", handlesRentals: false, annualSalesCents: 10, fullName: "Vera" },
];

function contacto(parcial: Partial<Contacto> & { id: number }): Contacto {
  return {
    fullName: "Existente",
    phone: null,
    phoneDisplay: null,
    email: null,
    country: null,
    city: null,
    sourceId: null,
    brokerId: 9,
    notes: null,
    lastInteractionAt: null,
    consentAt: null,
    consentSource: null,
    createdAt: new Date("2025-01-01T00:00:00Z"),
    updatedAt: new Date("2025-01-01T00:00:00Z"),
    createdBy: 9,
    updatedBy: 9,
    deletedAt: null,
    ...parcial,
  };
}

function lead(parcial: Partial<Lead> & { id: number }): Lead {
  return {
    contactId: 1,
    sourceId: null,
    projectId: null,
    projectInterestText: null,
    zoneInterest: null,
    operationType: null,
    currency: "USD",
    budgetMinCents: null,
    budgetMaxCents: null,
    bedrooms: null,
    status: "new",
    brokerId: null,
    suggestedBrokerId: null,
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
  const leads = leadsEnMemoria({ candidatosBroker: BROKERS, ...semilla });
  const auditoria = auditoriaEnMemoria();
  const unidad = unidadDeTrabajoEnMemoria({ leads, auditoria }, [leads, auditoria]);
  return { leads, auditoria, unidad, deps: { leads, unidad } };
}

const ana = contacto({ id: 1, fullName: "Ana", phone: "+18095550184", phoneDisplay: "809-555-0184", email: "ana@example.com" });

// --- alta manual --------------------------------------------------------------

test("alta: crea contacto y lead, sugiere el broker de sugerirBroker y audita las dos filas con actor", async () => {
  const { deps, leads, auditoria } = montar();
  const interes = { projectInterestText: "Proyectos en planos", zoneInterest: "Bávaro", operationType: "sale" as const };
  const esperado = sugerirBroker(interes, BROKERS);
  assert.equal(esperado, 5);

  const fila = await crearLead(deps, broker, { fullName: " Luis ", phone: "809-555-0199", sourceId: 3, ...interes });

  assert.equal(fila.suggestedBrokerId, esperado);
  assert.equal(fila.brokerId, null, "decisión #21: solo se escribe la sugerencia, nunca brokerId");
  assert.equal(fila.createdBy, 5);
  assert.equal(fila.currency, "USD");
  const nuevo = leads.contactos[0]!;
  assert.equal(nuevo.fullName, "Luis");
  assert.equal(nuevo.phone, "+18095550199");
  assert.equal(nuevo.brokerId, 5);
  assert.equal(fila.contactId, nuevo.id);
  assert.deepEqual(auditoria.registros, [
    { accion: "crear", entidad: "contact", entidadId: nuevo.id, despues: nuevo, actorId: 5 },
    { accion: "crear", entidad: "lead", entidadId: fila.id, despues: fila, actorId: 5 },
  ]);
});

test("alta con contactId existente: no crea contacto y solo audita el lead", async () => {
  const { deps, leads, auditoria } = montar({ contactos: [ana] });
  const fila = await crearLead(deps, broker, { contactId: 1, currency: "DOP" });

  assert.equal(fila.contactId, 1);
  assert.equal(fila.currency, "DOP");
  assert.equal(leads.contactos.length, 1);
  assert.deepEqual(auditoria.registros.map((r) => r.entidad), ["lead"]);
});

test("alta con contactId que no existe o está borrado: NotFoundError y nada escrito", async () => {
  const { deps, leads, auditoria } = montar({ contactos: [contacto({ id: 2, deletedAt: new Date() })] });
  for (const contactId of [99, 2]) {
    await assert.rejects(crearLead(deps, broker, { contactId }), (error) => {
      assert.ok(error instanceof NotFoundError);
      assert.equal(error.message, "El contacto indicado no existe.");
      return true;
    });
  }
  assert.deepEqual(leads.leads, []);
  assert.deepEqual(auditoria.registros, []);
});

test("alta con teléfono duplicado: ConflictError con candidatos; con crearIgual crea", async () => {
  const { deps, leads, auditoria } = montar({ contactos: [ana] });
  await assert.rejects(crearLead(deps, broker, { fullName: "Otra", phone: "809-555-0184" }), (error) => {
    assert.ok(error instanceof ConflictError);
    assert.equal(error.message, MENSAJE_DUPLICADO);
    assert.deepEqual(error.details, {
      candidatos: [{ id: 1, fullName: "Ana", phone: "+18095550184", phoneDisplay: "809-555-0184", email: "ana@example.com" }],
    });
    return true;
  });
  assert.deepEqual(leads.leads, []);
  assert.deepEqual(auditoria.registros, []);

  const fila = await crearLead(deps, broker, { fullName: "Otra", phone: "809-555-0184", crearIgual: true });
  assert.equal(leads.contactos.length, 2);
  assert.equal(fila.contactId, 2);
});

test("alta sin contactId ni nombre: ValidationError (protege al caso de uso de una entrada sin Zod)", async () => {
  const { deps, leads } = montar();
  await assert.rejects(crearLead(deps, broker, { fullName: "   " }), ValidationError);
  assert.deepEqual(leads.leads, []);
});

test("alta: un fallo dentro de la transacción no deja contacto, lead ni auditoría", async () => {
  const { leads, auditoria, unidad } = montar();
  const roto: RepositorioLeads = {
    ...leads,
    crearLead: async () => {
      throw new Error("falla el insert del lead");
    },
  };
  const unidadRota = unidadDeTrabajoEnMemoria({ leads: roto, auditoria }, [leads, auditoria]);

  await assert.rejects(crearLead({ leads, unidad: unidadRota }, broker, { fullName: "Luis" }), /falla el insert/);
  assert.deepEqual(leads.contactos, []);
  assert.deepEqual(leads.leads, []);
  assert.deepEqual(auditoria.registros, []);
  assert.equal(unidad.revertidas, 0);
  assert.equal(unidadRota.revertidas, 1);
});

// --- asignar responsable ------------------------------------------------------

test("asignar: escribe brokerId y audita asignar con antes y después", async () => {
  const propio = lead({ id: 1, brokerId: 1 });
  const { deps, leads, auditoria } = montar({ leads: [propio] });
  const fila = await asignarResponsableDeLead(deps, admin, "all", 1, { brokerId: 6 });

  assert.equal(fila.brokerId, 6);
  assert.equal(fila.updatedBy, 1);
  assert.deepEqual(leads.leads, [fila]);
  assert.deepEqual(auditoria.registros, [
    { accion: "asignar", entidad: "lead", entidadId: 1, antes: propio, despues: fila, actorId: 1 },
  ]);
});

test("asignar a quien no es un broker activo: ValidationError literal y nada escrito", async () => {
  const { deps, leads, auditoria } = montar({ leads: [lead({ id: 1 })] });
  await assert.rejects(asignarResponsableDeLead(deps, admin, "all", 1, { brokerId: 77 }), (error) => {
    assert.ok(error instanceof ValidationError);
    assert.equal(error.message, MENSAJE_NO_BROKER);
    assert.deepEqual(error.fields, { brokerId: "Elige un broker activo." });
    return true;
  });
  assert.equal(leads.leads[0]!.brokerId, null);
  assert.deepEqual(auditoria.registros, []);
});

test("asignar: el broker inválido gana al lead inexistente (se valida antes de leer el lead)", async () => {
  const { deps } = montar();
  await assert.rejects(asignarResponsableDeLead(deps, admin, "all", 404, { brokerId: 77 }), ValidationError);
  await assert.rejects(asignarResponsableDeLead(deps, admin, "all", 404, { brokerId: 6 }), NotFoundError);
});

test("asignar un lead fuera del alcance (o borrado): NotFoundError", async () => {
  const { deps, leads, auditoria } = montar({
    leads: [lead({ id: 1, brokerId: 9 }), lead({ id: 2, brokerId: 5, deletedAt: new Date() })],
  });
  await assert.rejects(asignarResponsableDeLead(deps, broker, "own", 1, { brokerId: 6 }), NotFoundError);
  await assert.rejects(asignarResponsableDeLead(deps, broker, "own", 2, { brokerId: 6 }), NotFoundError);
  assert.equal(leads.leads[0]!.brokerId, 9);
  assert.deepEqual(auditoria.registros, []);
});

test("asignar un lead PROPIO con alcance own funciona (H16: deliberado, comportamiento actual)", async () => {
  // H16 (docs/R_HALLAZGOS.md): reasignar un lead propio NO exige alcance `all`,
  // a diferencia de Contactos. Es una inconsistencia conocida y una decisión de
  // producto pendiente; esta prueba fija el comportamiento actual para que un
  // cambio no pase desapercibido. Si producto decide lo contrario, se cambia
  // el caso de uso Y esta prueba juntos.
  const { deps, leads } = montar({ leads: [lead({ id: 1, brokerId: 5 })] });
  const fila = await asignarResponsableDeLead(deps, broker, "own", 1, { brokerId: 6 });
  assert.equal(fila.brokerId, 6);
  assert.equal(leads.leads[0]!.brokerId, 6);
});

// --- descartar ----------------------------------------------------------------

test("descartar: marca discarded con el motivo y audita descartar", async () => {
  const original = lead({ id: 1, brokerId: 5, status: "contacted" });
  const { deps, auditoria } = montar({ leads: [original] });
  const fila = await descartarLead(deps, broker, "own", 1, "No responde");

  assert.equal(fila.status, "discarded");
  assert.equal(fila.discardReason, "No responde");
  assert.equal(fila.updatedBy, 5);
  assert.deepEqual(auditoria.registros, [
    { accion: "descartar", entidad: "lead", entidadId: 1, antes: original, despues: fila, actorId: 5 },
  ]);
});

test("descartar: guardas de estado con sus mensajes literales", async () => {
  const { deps, auditoria } = montar({
    leads: [lead({ id: 1, status: "converted" }), lead({ id: 2, status: "discarded" })],
  });
  await assert.rejects(descartarLead(deps, admin, "all", 1, "x"), (error) => {
    assert.ok(error instanceof ConflictError);
    assert.equal(error.message, "Este lead ya fue convertido a negocio; no se puede descartar.");
    return true;
  });
  await assert.rejects(descartarLead(deps, admin, "all", 2, "x"), (error) => {
    assert.ok(error instanceof ConflictError);
    assert.equal(error.message, "Este lead ya está descartado.");
    return true;
  });
  assert.deepEqual(auditoria.registros, []);
});

test("descartar un lead inexistente, borrado o fuera del alcance: NotFoundError", async () => {
  const { deps } = montar({
    leads: [lead({ id: 1, brokerId: 9 }), lead({ id: 2, brokerId: 5, deletedAt: new Date() })],
  });
  for (const id of [404, 2, 1]) {
    await assert.rejects(descartarLead(deps, broker, "own", id, "x"), NotFoundError);
  }
});

// --- captura externa (webhook) ------------------------------------------------

const entradaExterna = {
  externalId: "portal-1",
  fullName: " María ",
  phone: "809-555-0100",
  email: "maria@example.com",
  projectInterestText: "Proyectos en planos",
};

test("webhook: la primera entrega crea contacto y lead, con dos filas de auditoría SIN actor, y responde creado", async () => {
  const { deps, leads, auditoria } = montar();
  const { lead: fila, creado } = await capturarLeadExterno(deps, entradaExterna);

  assert.equal(creado, true);
  assert.equal(fila.externalId, "portal-1");
  assert.equal(fila.suggestedBrokerId, 5);
  assert.equal(fila.createdBy, null, "el webhook no tiene autor");
  const nuevo = leads.contactos[0]!;
  assert.equal(nuevo.fullName, "María");
  assert.equal(nuevo.phone, "+18095550100");
  assert.equal(nuevo.consentSource, "portal_externo");
  assert.ok(nuevo.consentAt instanceof Date);
  assert.equal(nuevo.brokerId, null);
  assert.deepEqual(leads.auditoriaSinActor, [
    { accion: "crear", entidad: "contact", entidadId: nuevo.id, despues: nuevo },
    { accion: "crear", entidad: "lead", entidadId: fila.id, despues: fila },
  ]);
  assert.deepEqual(auditoria.registros, [], "no pasa por el puerto Auditoria, que exige actor");
});

test("webhook repetido con el mismo externalId: no duplica, devuelve el existente con creado false y NO audita", async () => {
  const { deps, leads } = montar();
  const primera = await capturarLeadExterno(deps, entradaExterna);
  const auditoriasTrasPrimera = leads.auditoriaSinActor.length;

  const segunda = await capturarLeadExterno(deps, entradaExterna);

  assert.equal(segunda.creado, false);
  assert.deepEqual(segunda.lead, primera.lead);
  assert.equal(leads.leads.length, 1);
  assert.equal(leads.contactos.length, 1);
  assert.equal(leads.auditoriaSinActor.length, auditoriasTrasPrimera);
});

test("webhook: un lead borrado con ese externalId no cuenta (el índice único es parcial)", async () => {
  const borrado = lead({ id: 1, externalId: "portal-1", deletedAt: new Date() });
  const { deps, leads } = montar({ leads: [borrado] });
  const { lead: fila, creado } = await capturarLeadExterno(deps, entradaExterna);

  assert.equal(creado, true);
  assert.notEqual(fila.id, 1);
  assert.equal(leads.leads.length, 2);
});

test("webhook con teléfono o correo de un contacto existente: lo reutiliza y no crea otro", async () => {
  const { deps, leads } = montar({ contactos: [ana] });

  const porTelefono = await capturarLeadExterno(deps, { externalId: "a", fullName: "Otro", phone: "809-555-0184" });
  const porCorreo = await capturarLeadExterno(deps, { externalId: "b", fullName: "Otro", email: "ana@example.com" });

  assert.equal(porTelefono.lead.contactId, 1);
  assert.equal(porCorreo.lead.contactId, 1);
  assert.equal(leads.contactos.length, 1);
  // Sin contacto nuevo, solo hay auditoría de los dos leads.
  assert.deepEqual(leads.auditoriaSinActor.map((r) => r.entidad), ["lead", "lead"]);
});

test("webhook sin teléfono ni correo: crea un contacto nuevo", async () => {
  const { deps, leads } = montar({ contactos: [ana] });
  const { lead: fila } = await capturarLeadExterno(deps, { externalId: "c", fullName: "Anónimo" });

  assert.equal(leads.contactos.length, 2);
  assert.equal(fila.contactId, 2);
  assert.equal(leads.contactos[1]!.phone, null);
  assert.equal(leads.contactos[1]!.email, null);
});

test("webhook: un fallo a mitad (al auditar el lead) no deja contacto, lead ni auditoría", async () => {
  const { leads, auditoria } = montar();
  let llamadas = 0;
  const roto: RepositorioLeads = {
    ...leads,
    registrarAuditoriaSinActor: async (registro) => {
      llamadas += 1;
      if (llamadas === 2) throw new Error("falla la auditoría del lead");
      await leads.registrarAuditoriaSinActor(registro);
    },
  };
  const unidad = unidadDeTrabajoEnMemoria({ leads: roto, auditoria }, [leads, auditoria]);

  await assert.rejects(capturarLeadExterno({ leads, unidad }, entradaExterna), /falla la auditoría del lead/);
  assert.deepEqual(leads.contactos, []);
  assert.deepEqual(leads.leads, []);
  assert.deepEqual(leads.auditoriaSinActor, []);
});
