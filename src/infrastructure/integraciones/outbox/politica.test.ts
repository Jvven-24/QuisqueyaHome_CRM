import assert from "node:assert/strict";
import { test } from "node:test";
import { FalloCrm } from "../../../application/compartido/crm.ts";
import { ConflictError } from "../../../domain/errors.ts";
import { clasificarFallo, decidirReintento, POLITICA_OUTBOX } from "./politica.ts";

test("outbox: backoff exponencial con full jitter y cap", () => {
  const fallo = new FalloCrm("RETRYABLE");
  assert.equal(decidirReintento(fallo, 1, () => 0).esperaMs, 0);
  assert.equal(decidirReintento(fallo, 1, () => 0.5).esperaMs, 500);
  assert.equal(decidirReintento(fallo, 4, () => 1).esperaMs, 8_000);
  assert.ok(decidirReintento(fallo, 4, () => 1).esperaMs! <= POLITICA_OUTBOX.capMs);
});
test("outbox: Retry-After impide adelantar el próximo intento", () => {
  assert.equal(decidirReintento(new FalloCrm("RETRYABLE", 120_000), 1, () => 0).esperaMs, 120_000);
});
test("outbox: quinto intento agotado termina en DLQ", () => {
  assert.equal(decidirReintento(new FalloCrm("RETRYABLE"), 5).esperaMs, null);
});
test("outbox: errores permanentes, autorización y resultado desconocido no se reintentan", () => {
  assert.equal(clasificarFallo(new ConflictError("conflicto")), "NON_RETRYABLE");
  assert.equal(decidirReintento(new FalloCrm("NON_RETRYABLE"), 1).esperaMs, null);
  assert.equal(decidirReintento(new FalloCrm("HUMAN_REQUIRED"), 1).esperaMs, null);
  assert.equal(clasificarFallo(new Error("timeout")), "HUMAN_REQUIRED");
});
