import assert from "node:assert/strict";
import { test } from "node:test";
import { FalloCrm } from "../../../application/compartido/crm.ts";
import { crmEnMemoria } from "../../../application/testing/crm-en-memoria.ts";
import { procesarOutbox } from "./worker.ts";
import type { ColaOutbox, PendienteOutbox } from "./worker.ts";

const fecha = new Date("2026-10-04T18:00:00Z");
const evento = (cambios: Partial<PendienteOutbox> = {}): PendienteOutbox => ({
  eventId: "a", eventType: "LeadCreado", aggregateId: 2, payload: { contactId: 1 },
  version: 1, correlationId: "c", idempotencyKey: "a", attempts: 0, ...cambios,
});

function colaFalsa(inicial: PendienteOutbox) {
  let pendiente: PendienteOutbox | null = inicial;
  let estado: "pending" | "sent" | "dead" = "pending";
  let proximo = fecha;
  const claves: string[] = [];
  const cola: ColaOutbox = {
    async conSiguiente(cuando, procesar) {
      if (!pendiente || cuando < proximo) return false;
      const actual = pendiente;
      await procesar({
        evento: actual,
        async enviado(ref) {
          assert.equal(ref.system, "local");
          claves.push(actual.idempotencyKey);
          pendiente = null; estado = "sent";
        },
        async fallido(clase, siguiente) {
          assert.ok(["RETRYABLE", "NON_RETRYABLE", "HUMAN_REQUIRED"].includes(clase));
          claves.push(actual.idempotencyKey);
          if (siguiente === null) { pendiente = null; estado = "dead"; }
          else { pendiente = { ...actual, attempts: actual.attempts + 1 }; proximo = siguiente; }
        },
      });
      return true;
    },
  };
  return { cola, claves, estado: () => estado };
}

test("worker: despacha las tres capacidades y marca enviado", async () => {
  for (const e of [evento(), evento({ eventType: "NegocioCambioEtapa", payload: { id: 2, stageId: 3 } }), evento({ eventType: "ActividadRegistrada", payload: { id: 2, activityType: "call" } })]) {
    const doble = colaFalsa(e);
    assert.equal(await procesarOutbox({ cola: doble.cola, crm: crmEnMemoria(), ahora: () => fecha }), 1);
    assert.equal(doble.estado(), "sent");
  }
});
test("worker: payload inválido y versión desconocida no invocan el puerto", async () => {
  for (const e of [evento({ payload: { contactId: -1 } }), evento({ version: 2 }), evento({ payload: { contactId: 1, secret: "fixture-no-secreta" } }), evento({ eventType: "NegocioCambioEtapa", payload: { id: 3, stageId: 2 } })]) {
    const doble = colaFalsa(e);
    const crm = crmEnMemoria();
    await procesarOutbox({ cola: doble.cola, crm, ahora: () => fecha });
    assert.equal(crm.registros.length, 0);
    assert.equal(doble.estado(), "dead");
  }
});
test("worker: 429 simulado espera y reintenta con la misma clave", async () => {
  const doble = colaFalsa(evento());
  const crm = crmEnMemoria();
  const original = crm.reflejarContacto;
  let intentos = 0;
  crm.reflejarContacto = async (datos, contexto) => {
    if (intentos++ === 0) throw new FalloCrm("RETRYABLE", 10_000);
    return original(datos, contexto);
  };
  assert.equal(await procesarOutbox({ cola: doble.cola, crm, ahora: () => fecha, random: () => 0 }), 1);
  assert.equal(doble.estado(), "pending");
  await procesarOutbox({ cola: doble.cola, crm, ahora: () => new Date(fecha.getTime() + 10_000) });
  assert.equal(doble.estado(), "sent");
  assert.deepEqual(doble.claves, ["a", "a"]);
});
test("worker: fallo total agota cinco intentos y deja DLQ", async () => {
  const doble = colaFalsa(evento());
  const crm = crmEnMemoria();
  crm.reflejarContacto = async () => { throw new FalloCrm("RETRYABLE"); };
  assert.equal(await procesarOutbox({ cola: doble.cola, crm, ahora: () => fecha, random: () => 0 }), 5);
  assert.equal(doble.estado(), "dead");
  assert.deepEqual(doble.claves, ["a", "a", "a", "a", "a"]);
});
test("worker: timeout desconocido queda para reconciliación humana", async () => {
  const doble = colaFalsa(evento());
  const crm = crmEnMemoria();
  crm.reflejarContacto = async () => { throw new Error("timeout simulado"); };
  assert.equal(await procesarOutbox({ cola: doble.cola, crm, ahora: () => fecha }), 1);
  assert.equal(doble.estado(), "dead");
});
test("worker: crash antes de confirmar persiste pendiente y conserva idempotencia", async () => {
  const crm = crmEnMemoria();
  let crash = true;
  const cola: ColaOutbox = {
    async conSiguiente(cuando, fn) {
      await fn({ evento: evento(), async enviado() { if (crash) throw new Error("crash simulado"); }, async fallido() { assert.fail("no es fallo del proveedor"); } });
      return true;
    },
  };
  await assert.rejects(procesarOutbox({ cola, crm }, 1), /crash simulado/);
  crash = false;
  assert.equal(await procesarOutbox({ cola, crm }, 1), 1);
  assert.equal(crm.registros.length, 1);
});
