import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import ts from "typescript";
import { requireFullScope } from "../../../domain/rbac.ts";
import { ForbiddenError } from "../../../domain/errors.ts";
import type { Actor } from "../../../domain/rbac.ts";

test("G4-P1: integración selecciona exclusivamente columnas públicas antes de serializar", () => {
 const texto = readFileSync(new URL("./page.tsx", import.meta.url), "utf8");
 const source = ts.createSourceFile("page.tsx", texto, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
 let proyecciones = 0;
 const visitar = (node: ts.Node) => {
  if (ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression) && node.expression.name.text === "from" && node.arguments[0]?.getText(source) === "integrationAccounts") {
   proyecciones++;
   const select = node.expression.expression;
   assert.ok(ts.isCallExpression(select));
   const argumento = select.arguments[0];
   assert.ok(argumento && ts.isObjectLiteralExpression(argumento), "No se permite select() completo ni proyección dinámica.");
   assert.deepEqual(argumento.properties.map((prop) => prop.name?.getText(source)).sort(), ["id", "lastSyncedAt", "provider", "status"]);
   for (const prop of argumento.properties) {
    assert.ok(ts.isPropertyAssignment(prop));
    assert.equal(prop.initializer.getText(source), `integrationAccounts.${prop.name.getText(source)}`);
   }
  }
  ts.forEachChild(node, visitar);
 };
 visitar(source); assert.equal(proyecciones, 1);
 assert.match(texto, /if \(alcance !== "all"\) forbidden\(\)/);
});

test("G4-P1/P2: cada escritura global exige alcance total", () => {
 for (const ruta of ["roles/[id]/permisos", "catalogos/[tipo]", "catalogos/[tipo]/[id]", "etapas/[id]", "papelera/restaurar"]) {
  const codigo = readFileSync(new URL(`../../api/${ruta}/route.ts`, import.meta.url), "utf8");
  assert.match(codigo, /requireFullScope\(actor, "settings", "(?:edit|create)"\)/, ruta);
 }
 for (const action of ["view", "edit", "create"] as const) {
  for (const scope of ["none", "own", "team", "all"] as const) {
   const actor: Actor = { userId: 7, roleSlug: "broker", permissions: [{ resource: "settings", action, scope }] };
   if (scope === "all") assert.doesNotThrow(() => requireFullScope(actor, "settings", action));
   else assert.throws(() => requireFullScope(actor, "settings", action), ForbiddenError);
  }
 }
});

test("G4-03: alta y edición usan el mismo esquema de teléfono", () => {
 for (const ruta of ["usuarios", "usuarios/[id]"]) {
  const codigo = readFileSync(new URL(`../../api/${ruta}/route.ts`, import.meta.url), "utf8");
  assert.match(codigo, /phone: TelefonoUsuarioInput/);
 }
});

test("G4-07/14: matriz y usuarios permiten desplazamiento; cada rol remonta su matriz", () => {
 for (const archivo of ["_permisos.tsx", "_usuarios.tsx"]) {
  const codigo = readFileSync(new URL(`./${archivo}`, import.meta.url), "utf8");
  assert.match(codigo, /overflowX: "auto"/);
 }
 assert.match(readFileSync(new URL("./vista.tsx", import.meta.url), "utf8"), /PermisosPanel key=\{props.permisos.rolSeleccionado/);
});
