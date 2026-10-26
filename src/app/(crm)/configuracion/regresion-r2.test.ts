import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { test } from "node:test";
import ts from "typescript";
import * as zod from "zod";
import * as errores from "../../../domain/errors.ts";
import * as rbac from "../../../domain/rbac.ts";
import * as catalogos from "../../../domain/catalogs.ts";
import { TelefonoUsuarioInput } from "../../../application/usuarios/telefono.ts";
import type { Actor } from "../../../domain/rbac.ts";

const require = createRequire(import.meta.url);
function cargar(ruta: string, dependencias: Record<string, unknown>) {
  const codigo = ts.transpileModule(readFileSync(new URL(ruta, import.meta.url), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const modulo = { exports: {} as Record<string, (...args: unknown[]) => Promise<Response>> };
  new Function("require", "module", "exports", codigo)(
    (id: string) => dependencias[id] ?? require(id), modulo, modulo.exports,
  );
  return modulo.exports;
}
const http = cargar("../../../infrastructure/http.ts", { "@/domain/errors": errores });

for (const [ruta, metodo, recurso, accion] of [
  ["usuarios", "POST", "users", "create"],
  ["usuarios/[id]", "PATCH", "users", "edit"],
  ["roles/[id]/permisos", "PATCH", "settings", "edit"],
  ["papelera/restaurar", "POST", "settings", "edit"],
] as const) {
  test(`R2 REG-3: ${metodo} ${ruta} autoriza antes de leer JSON o validar id`, async () => {
    let lecturas = 0;
    let servicios = 0;
    let actor: Actor | null = { userId: 7, roleSlug: "broker", permissions: [] };
    const noTocar = () => { servicios++; throw Error("No debe acceder a servicios"); };
    const handler = cargar(`../../api/${ruta}/route.ts`, {
      zod, "@/domain/rbac": rbac, "@/domain/errors": errores, "@/domain/catalogs": catalogos,
      "@/application/usuarios/telefono": { TelefonoUsuarioInput }, "@/infrastructure/http": http,
      "@/infrastructure/auth/actor": { requireActor: async () => { if (!actor) throw new errores.UnauthorizedError(); return actor; } },
      "@/application/usuarios/casos-de-uso": { crearUsuario: noTocar, editarUsuario: noTocar, borrarUsuario: noTocar },
      "@/infrastructure/contenedor/usuarios": { usuariosParaEscritura: noTocar },
      "@/application/roles/casos-de-uso": { editarPermisos: noTocar },
      "@/infrastructure/contenedor/roles": { rolesParaEscritura: noTocar },
      "@/application/papelera/casos-de-uso": { restaurarDePapelera: noTocar },
      "@/infrastructure/contenedor/papelera": { papeleraParaEscritura: noTocar },
    })[metodo]!;
    const request = { json: async () => { lecturas++; return { fullName: null }; } };
    const context = { params: Promise.resolve({ id: "abc" }) };
    assert.equal((await handler(request, context)).status, 403);
    actor = null;
    assert.equal((await handler(request, context)).status, 401);
    assert.equal(lecturas, 0);
    assert.equal(servicios, 0);
    actor = { userId: 1, roleSlug: "admin", permissions: [{ resource: recurso, action: accion, scope: "all" }] };
    assert.equal((await handler(request, { params: Promise.resolve({ id: "1" }) })).status, 400);
    assert.equal(lecturas, 1);
    assert.equal(servicios, 0);
  });
}

test("R2 G4-03: POST real de usuarios rechaza teléfono basura con 400 y fields.phone antes del caso de uso", async () => {
  const handler = cargar("../../api/usuarios/route.ts", {
    zod, "@/domain/rbac": rbac,
    "@/application/usuarios/telefono": { TelefonoUsuarioInput }, "@/infrastructure/http": http,
    "@/infrastructure/auth/actor": { requireActor: async () => ({ userId: 1, roleSlug: "admin", permissions: [{ resource: "users", action: "create", scope: "all" }] }) },
    "@/application/usuarios/casos-de-uso": { crearUsuario: () => assert.fail("No debe crear ni invitar") },
    "@/infrastructure/contenedor/usuarios": { usuariosParaEscritura: () => assert.fail("No debe conectar a datos") },
  }).POST!;
  const respuesta = await handler(new Request("http://localhost/api/usuarios", {
    method: "POST", body: JSON.stringify({ fullName: "Prueba", email: "prueba@example.invalid", roleId: 2, phone: "abc!!<b>x</b>" }),
  }));
  assert.equal(respuesta.status, 400);
  const cuerpo = await respuesta.json();
  assert.match(cuerpo.fields.phone, /^Escribe un teléfono/);
});
