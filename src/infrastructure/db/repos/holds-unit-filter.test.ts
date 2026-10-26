import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { test } from "node:test";
import { drizzle } from "drizzle-orm/pg-proxy";
import ts from "typescript";
import * as puertos from "../../../application/compromisos/puertos.ts";
import * as errores from "../../../domain/errors.ts";
import * as unidades from "../../../domain/unidades.ts";
import * as rbac from "../../rbac-filter.ts";
import * as schema from "../schema.ts";
import type { Actor, PermissionScope } from "../../../domain/rbac.ts";
import type { Tx } from "./compartido.ts";

const require = createRequire(import.meta.url);
const source = readFileSync(new URL("./compromisos.ts", import.meta.url), "utf8");
function cargar(codigo = source) {
  const deps: Record<string, unknown> = { "../../../application/compromisos/puertos.ts": puertos, "../../../domain/errors.ts": errores, "../../../domain/unidades.ts": unidades, "../../rbac-filter.ts": rbac, "../schema.ts": schema, "./pipeline.ts": { repositorioPipeline: () => ({}) } };
  const js = ts.transpileModule(codigo, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const exports: Record<string, unknown> = {};
  new Function("require", "exports", js)((id: string) => deps[id] ?? require(id), exports);
  return exports.repositorioCompromisos as (tx: Tx) => puertos.CompromisosHoldsPort;
}
const actor: Actor = { userId: 7, roleSlug: "broker", permissions: [] };
async function consulta(scope: PermissionScope, unitId?: number, codigo?: string) {
  const ejecutadas: { sql: string; params: unknown[] }[] = [];
  const db = drizzle(async (sql, params) => { ejecutadas.push({ sql, params }); return { rows: [] }; });
  const repo = cargar(codigo)(db as unknown as Tx);
  assert.deepEqual(await repo.listarHolds({ unitId, dealId: 10 }, actor, scope), []);
  assert.equal(ejecutadas.length, 1);
  return ejecutadas[0]!;
}
function exigirUnidad(q: { sql: string; params: unknown[] }) {
  assert.match(q.sql, /"holds"\."id" in \(select "hold_id" from "hold_units" where "hold_units"\."unit_id" = \$\d+\)/i);
  assert.ok(q.params.includes(41), "unitId debe viajar como parámetro, no concatenado");
}
for (const scope of ["own", "team", "all", "none"] as const) {
  test("Drizzle listarHolds combina unitId con visibleHolds y dealId · " + scope, async () => {
    const q = await consulta(scope, 41);
    exigirUnidad(q);
    assert.match(q.sql, /"rbac_deal"\."id" = "holds"\."deal_id"/);
    assert.match(q.sql, /"rbac_deal"\."deleted_at" is null/);
    assert.match(q.sql, /"holds"\."deal_id" = \$\d+/);
    assert.ok(q.params.includes(10));
    if (scope === "own" || scope === "team") { assert.match(q.sql, /"rbac_deal"\."broker_id" = \$\d+/); assert.ok(q.params.includes(actor.userId)); }
    if (scope === "none") assert.match(q.sql, /false/);
  });
}
test("sin unitId conserva listado scoped; mutación que retira filtro reproduce el defecto", async () => {
  const sin = await consulta("own");
  assert.ok(!sin.sql.includes('from "hold_units"'));
  const mutado = source.replace(/      if \(filtros\.unitId !== undefined\) \{[\s\S]*?\n      \}/, "");
  assert.notEqual(mutado, source, "control de mutación debe retirar el filtro");
  const defectuosa = await consulta("own", 41, mutado);
  assert.throws(() => exigirUnidad(defectuosa), "la regresión detecta quitar la condición real");
});
