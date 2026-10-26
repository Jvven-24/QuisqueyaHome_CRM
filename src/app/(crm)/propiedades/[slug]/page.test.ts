import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import ts from "typescript";
import * as jsxRuntime from "react/jsx-runtime";
import { reaches } from "../../../../domain/rbac.ts";
function cargar(scope: "all" | "own", fila?: { brokerId: number; deletedAt: Date | null }) {
  const denegacion = new Error("NEXT_HTTP_ERROR_FALLBACK;404");
  let lecturas = 0;
  const NoEncontrado = () => null;
  const cadena = { from() { return this; }, where() { return this; }, async limit() { return fila ? [fila] : []; } };
  const deps: Record<string, unknown> = {
    "react/jsx-runtime": jsxRuntime,
    "next/navigation": { notFound() { throw denegacion; } },
    "./not-found": { default: NoEncontrado },
    "drizzle-orm": { eq: () => true },
    "@/domain/rbac": { reaches },
    "@/infrastructure/auth/actor": { requireActor: async () => ({ userId: 5 }) },
    "@/infrastructure/page-guard": { requireScopeInPage: () => scope },
    "@/infrastructure/db/client": { getDb: () => ({ select() { if (++lecturas > 1) throw new Error("Se intentó consultar contenido sin acceso"); return cadena; } }) },
    "@/infrastructure/db/schema": { projects: { slug: "slug" } },
    "./vista": {},
  };
  const code = ts.transpileModule(readFileSync(new URL("./page.tsx", import.meta.url), "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX } }).outputText;
  const exports: Record<string, unknown> = {};
  runInNewContext(code, { exports, require: (name: string) => { assert.ok(Object.hasOwn(deps, name), name); return deps[name]; } });
  return { page: exports.default as (args: { params: Promise<{ slug: string }> }) => Promise<{ type: unknown }>, NoEncontrado, denegacion, lecturas: () => lecturas };
}
test("proyecto: slug inexistente con alcance global termina en el estado propio, sin consultar unidades", async () => {
  const ruta = cargar("all");
  await assert.rejects(ruta.page({ params: Promise.resolve({ slug: "no-existe" }) }), error => error === ruta.denegacion);
  assert.equal(ruta.lecturas(), 1);
});
test("proyecto: ajeno, borrado e inexistente producen el mismo 404 para alcance propio", async () => {
  for (const fila of [undefined, { brokerId: 6, deletedAt: null }, { brokerId: 5, deletedAt: new Date() }]) {
    const ruta = cargar("own", fila);
    await assert.rejects(ruta.page({ params: Promise.resolve({ slug: "proyecto" }) }), error => error === ruta.denegacion);
    assert.equal(ruta.lecturas(), 1);
  }
});
