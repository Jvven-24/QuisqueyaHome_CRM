import test from "node:test";
import assert from "node:assert/strict";
import { extraerDatosDeTranscripcion } from "./audio-lead-extractor.ts";

test("AudioLeadExtractor: extrae prospecto de compra en Bávaro", () => {
  const nota = "Hablé con Carlos Peña, le interesa un apartamento de dos habitaciones en Bávaro, tiene unos 140 mil dólares de presupuesto, quedamos en llamarlo el viernes";
  const datos = extraerDatosDeTranscripcion(nota);

  assert.equal(datos.fullName, "Carlos Peña");
  assert.equal(datos.zoneInterest, "Bávaro");
  assert.equal(datos.operationType, "sale");
  assert.equal(datos.currency, "USD");
  assert.equal(datos.budgetMinCents, 14000000);
  assert.equal(datos.budgetMaxCents, 14000000);
  assert.match(datos.sugerenciaActividad || "", /llamarlo el viernes/i);
  assert.ok(datos.confianza >= 0.7);
});

test("AudioLeadExtractor: extrae alquiler en Santo Domingo Piantini", () => {
  const nota = "Cliente María Gómez busca alquiler amueblado en Santo Domingo Piantini presupuesto 1500 dólares";
  const datos = extraerDatosDeTranscripcion(nota);

  assert.equal(datos.fullName, "María Gómez");
  assert.ok(datos.zoneInterest === "Piantini" || datos.zoneInterest === "Santo Domingo");
  assert.equal(datos.operationType, "rent");
  assert.equal(datos.budgetMinCents, 150000);
  assert.equal(datos.budgetMaxCents, 150000);
  assert.equal(datos.currency, "USD");
  assert.ok(datos.confianza >= 0.5);
});

test("AudioLeadExtractor: extrae rango de lujo en Cap Cana con teléfono dominicano", () => {
  const nota = "Tengo a Roberto Rosario al 809-555-1234, quiere una villa en Cap Cana entre 600 y 800 mil dólares, enviar brochure hoy";
  const datos = extraerDatosDeTranscripcion(nota);

  assert.equal(datos.fullName, "Roberto Rosario");
  assert.equal(datos.phone, "+18095551234");
  assert.equal(datos.zoneInterest, "Cap Cana");
  assert.equal(datos.operationType, "sale");
  assert.equal(datos.budgetMinCents, 60000000);
  assert.equal(datos.budgetMaxCents, 80000000);
  assert.match(datos.sugerenciaActividad || "", /enviar brochure hoy/i);
  assert.ok(datos.confianza >= 0.8);
});

test("AudioLeadExtractor: extrae teléfono internacional de diáspora y correo", () => {
  const nota = "Hablé con Laura Méndez desde Miami al +1 (305) 555-0144 correo laura@mendez.com busca en Punta Cana Cana Rock presupuesto 220 mil dólares, enviar brochure por correo";
  const datos = extraerDatosDeTranscripcion(nota);
  assert.equal(datos.fullName, "Laura Méndez");
  assert.equal(datos.phone, "+13055550144");
  assert.equal(datos.email, "laura@mendez.com");
  assert.equal(datos.zoneInterest, "Punta Cana");
  assert.equal(datos.projectInterestText, "Cana Rock");
  assert.equal(datos.budgetMinCents, 22000000);
});

test("AudioLeadExtractor: texto vacío no revienta y devuelve confianza 0", () => {
  const datos = extraerDatosDeTranscripcion("");
  assert.equal(datos.fullName, null);
  assert.equal(datos.phone, null);
  assert.equal(datos.email, null);
  assert.equal(datos.confianza, 0);
  assert.equal(datos.operationType, "sale");
});
