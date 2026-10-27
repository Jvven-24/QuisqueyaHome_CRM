import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { PERMISSION_RESOURCES } from "../../domain/catalogs.ts";
import { agruparRecursosPorModulo } from "./permission-matrix.ts";

const component = readFileSync(new URL("./responsive-permission-matrix.tsx", import.meta.url), "utf8");

test("la matriz agrupa una sola vez todos los recursos RBAC vigentes", () => {
  const groups = agruparRecursosPorModulo(PERMISSION_RESOURCES);
  const grouped = groups.flatMap((group) => group.resources);

  assert.deepEqual(new Set(grouped), new Set(PERMISSION_RESOURCES));
  assert.equal(grouped.length, PERMISSION_RESOURCES.length);
});

test("la matriz conserva recursos desconocidos y omite grupos vacíos al filtrar", () => {
  const groups = agruparRecursosPorModulo(["leads", "recurso_futuro"]);

  assert.deepEqual(groups.map((group) => [group.id, ...group.resources]), [
    ["comercial", "leads"],
    ["otros", "recurso_futuro"],
  ]);
});

test("la presentación usa acordeones accesibles y controles fluidos sin tabla con scroll lateral", () => {
  assert.match(component, /<Accordion type="multiple"/);
  assert.match(component, /<AccordionTrigger/);
  assert.match(component, /grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3/);
  assert.doesNotMatch(component, /overflow-x-auto|min-w-(?:\d{2,}|\[)|<table/);
});
