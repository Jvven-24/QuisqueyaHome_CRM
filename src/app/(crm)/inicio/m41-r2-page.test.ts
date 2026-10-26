import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { test } from "node:test";
import ts from "typescript";
import * as jsxRuntime from "react/jsx-runtime";
import { dashboardScopes } from "../../../application/dashboard/consultas.ts";
import { can, requireScope, type Actor } from "../../../domain/rbac.ts";

test("G1-09: Inicio entrega el embudo canónico de Reportes con los mismos filtros y alcance", async () => {
  const filtros = { period: "month", brokerId: 5 };
  const funnel = [{ stageId: 1, reachedCount: 7, widthPercent: 100, passRatePercent: null }];
  for (const permisoNegocios of [true, false]) {
    let llamadas = 0;
    const actor: Actor = { userId: 5, roleSlug: "broker", permissions: [
      { resource: "dashboard", action: "view", scope: "all" },
      ...(permisoNegocios ? [{ resource: "deals" as const, action: "view" as const, scope: "own" as const }] : []),
    ] };
    const deps: Record<string, unknown> = {
      "react/jsx-runtime": jsxRuntime,
      "@/application/reportes/consultas": { async consultarReportesBi(_repo: unknown, a: Actor, scope: string, filters: unknown) {
        llamadas++; assert.equal(a, actor); assert.equal(scope, "own"); assert.equal(filters, filtros); return { funnel };
      } },
      "@/infrastructure/contenedor/reportes": { reportesRepositorio: () => ({}) },
      "@/application/dashboard/consultas": { dashboardScopes, consultarDashboard: async () => ({ nombre: "Prueba", funnel: [{ reachedCount: 999 }] }) },
      "@/domain/rbac": { can }, "@/infrastructure/auth/actor": { requireActor: async () => actor },
      "@/infrastructure/contenedor/dashboard": { dashboardRepositorio: () => ({}) },
      "@/infrastructure/page-guard": { requireScopeInPage: requireScope },
      "../reportes/filtros": { leerFiltros: () => filtros }, "./vista": { InicioVista: () => null },
    };
    const code = ts.transpileModule(readFileSync(new URL("./page.tsx", import.meta.url), "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } }).outputText;
    const exports: Record<string, unknown> = {};
    runInNewContext(code, { exports, require: (id: string) => { assert.ok(Object.hasOwn(deps, id), id); return deps[id]; } });
    const page = exports.default as (args: { searchParams: Promise<object> }) => Promise<{ props: { metricas: { funnel: unknown[] } } }>;
    const vista = await page({ searchParams: Promise.resolve({}) });
    assert.equal(llamadas, permisoNegocios ? 1 : 0);
    assert.equal(JSON.stringify(vista.props.metricas.funnel), JSON.stringify(permisoNegocios ? funnel : []));
  }
});
