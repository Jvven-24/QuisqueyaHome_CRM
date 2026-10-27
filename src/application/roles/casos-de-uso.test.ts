/** Pruebas de la matriz de permisos, sin base de datos ni red (R3.5). */

import assert from "node:assert/strict";
import { test } from "node:test";
import { ForbiddenError, ValidationError } from "../../domain/errors.ts";
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

const editor: Actor = { userId: 8, roleSlug: "asistente", permissions: [{ resource: "settings", action: "edit", scope: "all" }, { resource: "contacts", action: "view", scope: "own" }] };

test("un rol no admin no puede editar su propio rol", async () => {
  const roles = rolesEnMemoria({ id: 3, isProtected: false, slug: "asistente" }, [permiso]);
  const auditoria = auditoriaEnMemoria();
  const unidad = unidadDeTrabajoEnMemoria({ roles, auditoria }, [roles, auditoria]);
  await assert.rejects(() => editarPermisos({ unidad }, editor, 3, [{ resource: "users", action: "edit", scope: "all" }]), ForbiddenError);
  assert.deepEqual(roles.permisos, [permiso]);
});

test("un rol no admin no concede más alcance del que tiene", async () => {
  const roles = rolesEnMemoria({ id: 4, isProtected: false, slug: "broker" }, []);
  const auditoria = auditoriaEnMemoria();
  const unidad = unidadDeTrabajoEnMemoria({ roles, auditoria }, [roles, auditoria]);
  await assert.rejects(() => editarPermisos({ unidad }, editor, 4, [{ resource: "contacts", action: "view", scope: "all" }]), ForbiddenError);
  await editarPermisos({ unidad }, editor, 4, [{ resource: "contacts", action: "view", scope: "own" }]);
  assert.equal(roles.permisos.length, 1);
});

test("rechaza celdas duplicadas", async () => {
  const roles = rolesEnMemoria({ id: 2, isProtected: false }, []);
  const auditoria = auditoriaEnMemoria();
  const unidad = unidadDeTrabajoEnMemoria({ roles, auditoria }, [roles, auditoria]);
  await assert.rejects(() => editarPermisos({ unidad }, actor, 2, [{ resource: "contacts", action: "edit", scope: "own" }, { resource: "contacts", action: "edit", scope: "all" }]), ValidationError);
});
