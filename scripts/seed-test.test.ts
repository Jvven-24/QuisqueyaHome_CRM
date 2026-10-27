import assert from "node:assert/strict";
import { test } from "node:test";
import { assertTestDestination } from "./seed-test.ts";

test("seed-test acepta solo loopback:55432 con QH_TEST_SEED=1", () => {
  assert.equal(assertTestDestination("postgresql://u:p@127.0.0.1:55432/postgres", "1"), "postgresql://u:p@127.0.0.1:55432/postgres");
  assert.ok(assertTestDestination("postgres://u@localhost:55432/crm", "1"));
});
test("seed-test rechaza destinos que no son la base de pruebas", () => {
  for (const url of ["postgres://u@127.0.0.1:5432/crm", "postgres://u@db.supabase.co:55432/postgres", "postgres://u@127.0.0.1:55432/postgres?host=10.0.0.1", "mysql://u@127.0.0.1:55432/x"]) {
    assert.throws(() => assertTestDestination(url, "1"), /Destino rechazado/, url);
  }
  assert.throws(() => assertTestDestination(undefined, "1"), /DATABASE_URL/);
});
test("seed-test exige la bandera explícita", () => {
  assert.throws(() => assertTestDestination("postgres://u@127.0.0.1:55432/postgres", undefined), /QH_TEST_SEED/);
});
