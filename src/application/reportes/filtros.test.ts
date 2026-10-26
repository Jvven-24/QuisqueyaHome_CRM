import assert from "node:assert/strict";
import { test } from "node:test";
import { resolverFiltros, urlPestanaReportes } from "./filtros.ts";
test("G4-05: filtros inválidos degradan sin ZodError y conservan filtros válidos", () => {
  assert.deepEqual(resolverFiltros({ periodo: "';DROP", desde: "2026-02-30", hasta: "basura", projectId: "3", brokerId: "-1" }), { periodo: "todo", filtros: { desde: undefined, hasta: undefined, projectId: 3, brokerId: undefined } });
  assert.equal(resolverFiltros({ desde: "2024-02-29" }).filtros.desde, "2024-02-29");
  assert.equal(resolverFiltros({ periodo: ["90d"], projectId: "1.2" }).periodo, "todo");
});
test("G4-05: rangos invertidos y períodos en hora de Santo Domingo", () => {
  const now = new Date("2026-10-18T01:00:00Z");
  assert.equal(resolverFiltros({ periodo: "ano" }, now).filtros.desde, "2026-01-01");
  assert.equal(resolverFiltros({ periodo: "90d" }, now).filtros.desde, "2026-07-20");
  assert.equal(resolverFiltros({ desde: "2026-10-20", hasta: "2026-10-01" }, now).filtros.hasta, undefined);
});
test("G4-04: pestaña compartible conserva filtros", () => {
  const url = new URL(urlPestanaReportes("periodo=ano&projectId=2&tab=embudo", "canales"), "https://example.test");
  assert.equal(url.pathname, "/reportes");
  assert.equal(url.searchParams.get("tab"), "canales");
  assert.equal(url.searchParams.get("projectId"), "2");
  assert.equal(url.searchParams.get("periodo"), "ano");
});
