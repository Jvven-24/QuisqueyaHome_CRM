/** Pruebas de la matriz de permisos, sin base de datos ni red (R3.5). */

import assert from "node:assert/strict";
import { test } from "node:test";
import { ForbiddenError } from "../../domain/errors.ts";
import type { Actor } from "../../domain/rbac.ts";
import { auditoriaEnMemoria } from "../testing/auditoria-en-memoria.ts";
import { unidadDeTrabajoEnMemoria } from "../testing/unidad-de-trabajo-en-memoria.ts";
import { editarPermisos } from "./casos-de-uso.ts";
import { rolesEnMemoria } from "./en-memoria.ts";

const actor: Actor = { userId: 7, roleSlug: "admin", permissions: [] };
const permiso = { resource: "users" as const, action: "view" as const, scope: "all" as const };

test("los permisos del rol administrador no son editables", async () => {
  const roles = rolesEnMemoria({ id: 1, isProtected: true }, [permiso]);
  const auditoria = auditoriaEnMemoria();
  const unidad = unidadDeTrabajoEnMemoria({ roles, auditoria }, [roles, auditoria]);
  await assert.rejects(() => editarPermisos({ unidad }, actor, 1, []), (error: unknown) => error instanceof ForbiddenError && error.message === "Los permisos del rol administrador no son editables.");
  assert.deepEqual(roles.permisos, [permiso]);
  assert.equal(auditoria.registros.length, 0);
});

test("la matriz normal reemplaza celdas ausentes y audita", async () => {
  const roles = rolesEnMemoria({ id: 2, isProtected: false }, [permiso]);
  const auditoria = auditoriaEnMemoria();
  const unidad = unidadDeTrabajoEnMemoria({ roles, auditoria }, [roles, auditoria]);
  await editarPermisos({ unidad }, actor, 2, [{ resource: "contacts", action: "edit", scope: "own" }]);
  assert.deepEqual(roles.permisos, [{ resource: "contacts", action: "edit", scope: "own" }]);
  assert.equal(auditoria.registros.length, 1);
});
