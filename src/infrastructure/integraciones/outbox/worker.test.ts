import assert from "node:assert/strict";
import { test } from "node:test";
import { FalloCrm } from "../../../application/compartido/crm.ts";
import { crmEnMemoria } from "../../../application/testing/crm-en-memoria.ts";
import { crearRegistro } from "./registro.ts";
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
    async conSiguiente(cuando, tipos, procesar) {
      if (!pendiente || cuando < proximo || !tipos.includes(pendiente.eventType)) return false;
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
    async conSiguiente(_cuando, _tipos, fn) {
      await fn({ evento: evento(), async enviado() { if (crash) throw new Error("crash simulado"); }, async fallido() { assert.fail("no es fallo del proveedor"); } });
      return true;
    },
  };
  await assert.rejects(procesarOutbox({ cola, crm }, 1), /crash simulado/);
  crash = false;
  assert.equal(await procesarOutbox({ cola, crm }, 1), 1);
  assert.equal(crm.registros.length, 1);
});

/** Cola con varios eventos que respeta el filtro por tipos como el adaptador real (sin tocar los demás). */
function colaMultiple(eventos: PendienteOutbox[]) {
  const estado = new Map(eventos.map((e) => [e.eventId, { ...e, fin: "pending" as "pending" | "sent" | "dead", proximo: fecha }]));
  const tiposPedidos: (readonly string[])[] = [];
  const cola: ColaOutbox = {
    async conSiguiente(cuando, tipos, procesar) {
      tiposPedidos.push(tipos);
      const e = [...estado.values()].find((x) => x.fin === "pending" && x.proximo <= cuando && tipos.includes(x.eventType));
      if (!e) return false;
      await procesar({
        evento: e,
        async enviado() { e.fin = "sent"; },
        async fallido(_clase, siguiente) {
          e.attempts += 1;
          if (siguiente === null) e.fin = "dead"; else e.proximo = siguiente;
        },
      });
      return true;
    },
  };
  return { cola, fin: (id: string) => estado.get(id)!.fin, intentos: (id: string) => estado.get(id)!.attempts, tiposPedidos };
}

test("worker: un tipo sin consumidor no se reclama, queda pendiente e intacto y nunca va a cola muerta", async () => {
  const desconocido = evento({ eventId: "x", eventType: "PagoRegistrado", aggregateId: 9, payload: { monto: 1 } });
  const conocido = evento({ eventId: "k" });
  const doble = colaMultiple([desconocido, conocido]);
  const crm = crmEnMemoria();
  assert.equal(await procesarOutbox({ cola: doble.cola, crm, ahora: () => fecha }), 1);
  assert.equal(doble.fin("k"), "sent");
  assert.equal(doble.fin("x"), "pending");
  assert.equal(doble.intentos("x"), 0);
  assert.equal(crm.registros.length, 1);
  // Aunque se repita el bucle muchas veces, el desconocido sigue pendiente.
  assert.equal(await procesarOutbox({ cola: doble.cola, crm, ahora: () => fecha }), 0);
  assert.equal(doble.fin("x"), "pending");
  assert.ok(doble.tiposPedidos.every((t) => !t.includes("PagoRegistrado")));
});

test("worker: registrar un consumidor nuevo hace que el tipo se procese; el resto del registro no cambia", async () => {
  const pago = evento({ eventId: "p", eventType: "PagoRegistrado", aggregateId: 9, payload: { monto: 1 } });
  const doble = colaMultiple([pago]);
  const vistos: string[] = [];
  const registro = crearRegistro([{
    destino: "cobros",
    manejadores: { PagoRegistrado: async (e) => { vistos.push(e.eventId); return { ref: { system: "cobros", externalId: "1" }, entityType: "payment", localId: e.aggregateId }; } },
  }]);
  assert.equal(await procesarOutbox({ cola: doble.cola, crm: crmEnMemoria(), registro, ahora: () => fecha }), 1);
  assert.deepEqual(vistos, ["p"]);
  assert.equal(doble.fin("p"), "sent");
});

test("worker: un manejador que falla siempre llega a cola muerta solo tras agotar los cinco intentos", async () => {
  const pago = evento({ eventId: "p", eventType: "PagoRegistrado", aggregateId: 9, payload: {} });
  const doble = colaMultiple([pago]);
  let llamadas = 0;
  const registro = crearRegistro([{ destino: "cobros", manejadores: { PagoRegistrado: async () => { llamadas++; throw new FalloCrm("RETRYABLE"); } } }]);
  let reloj = fecha.getTime();
  for (let i = 1; i <= 4; i++) {
    await procesarOutbox({ cola: doble.cola, crm: crmEnMemoria(), registro, ahora: () => new Date(reloj), random: () => 0 }, 1);
    assert.equal(doble.fin("p"), "pending", `intento ${i} sigue pendiente`);
    reloj += 120_000;
  }
  await procesarOutbox({ cola: doble.cola, crm: crmEnMemoria(), registro, ahora: () => new Date(reloj), random: () => 0 }, 1);
  assert.equal(llamadas, 5);
  assert.equal(doble.fin("p"), "dead");
});

test("worker: sin ningún consumidor registrado no se reclama nada", async () => {
  const doble = colaMultiple([evento()]);
  assert.equal(await procesarOutbox({ cola: doble.cola, crm: crmEnMemoria(), registro: crearRegistro([]), ahora: () => fecha }), 0);
  assert.equal(doble.fin("a"), "pending");
});

test("worker: si una cola ignora el filtro, falla sin marcar el evento (no va a cola muerta)", async () => {
  let tocado = false;
  const cola: ColaOutbox = {
    async conSiguiente(_cuando, _tipos, fn) {
      await fn({ evento: evento({ eventType: "PagoRegistrado" }), async enviado() { tocado = true; }, async fallido() { tocado = true; } });
      return true;
    },
  };
  await assert.rejects(procesarOutbox({ cola, crm: crmEnMemoria() }, 1), /sin consumidor/);
  assert.equal(tocado, false);
});

test("worker: la cola recibe exactamente los tipos del registro por defecto", async () => {
  const doble = colaMultiple([]);
  await procesarOutbox({ cola: doble.cola, crm: crmEnMemoria(), ahora: () => fecha });
  assert.deepEqual(doble.tiposPedidos[0], ["ActividadRegistrada", "LeadCreado", "NegocioCambioEtapa"]);
});
