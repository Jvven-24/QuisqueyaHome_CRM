import assert from "node:assert/strict";
import { test } from "node:test";
import { consumidorCrm, registroPorDefecto, TIPOS_CONSUMIDOS_POR_DEFECTO } from "./consumidores.ts";
import { crearRegistro } from "./registro.ts";
import type { Manejador } from "./registro.ts";

const nada: Manejador = async () => ({ ref: { system: "t", externalId: "1" }, entityType: "t", localId: 1 });

test("registro: tipos ordenados y manejador por tipo; los desconocidos no existen", () => {
  const registro = crearRegistro([{ destino: "b", manejadores: { Z: nada } }, { destino: "a", manejadores: { A: nada } }]);
  assert.deepEqual(registro.tipos(), ["A", "Z"]);
  assert.equal(registro.manejadorDe("A"), nada);
  assert.equal(registro.manejadorDe("B"), undefined);
  assert.equal(registro.manejadorDe("constructor"), undefined);
});

test("registro: dos consumidores del mismo tipo se rechazan al construir", () => {
  assert.throws(() => crearRegistro([{ destino: "a", manejadores: { X: nada } }, { destino: "b", manejadores: { X: nada } }]), /dos consumidores \(a y b\)/);
});

test("registro por defecto: solo los tres tipos del CRM comercial; nada financiero", () => {
  assert.deepEqual([...TIPOS_CONSUMIDOS_POR_DEFECTO], ["ActividadRegistrada", "LeadCreado", "NegocioCambioEtapa"]);
  assert.deepEqual(Object.keys(consumidorCrm.manejadores).sort(), [...registroPorDefecto.tipos()]);
  assert.equal(registroPorDefecto.manejadorDe("PagoRegistrado"), undefined);
});
