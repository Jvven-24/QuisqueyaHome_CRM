/** Pruebas de seguridad y escritura de Usuarios, sin base de datos ni red (R3.5). */

import assert from "node:assert/strict";
import { test } from "node:test";
import { ForbiddenError, ConflictError } from "../../domain/errors.ts";
import type { Actor } from "../../domain/rbac.ts";
import { adminAuthEnMemoria } from "../testing/admin-auth-en-memoria.ts";
import { auditoriaEnMemoria } from "../testing/auditoria-en-memoria.ts";
import { unidadDeTrabajoEnMemoria } from "../testing/unidad-de-trabajo-en-memoria.ts";
import { borrarUsuario, crearUsuario, editarUsuario, reenviarInvitacion } from "./casos-de-uso.ts";
import { usuariosEnMemoria } from "./en-memoria.ts";
import type { Rol, Usuario } from "./puertos.ts";

const actor: Actor = { userId: 7, roleSlug: "admin", permissions: [] };
const own: Actor = { userId: 7, roleSlug: "broker", permissions: [] };
const adminRole: Rol = { id: 1, slug: "admin", name: "Administrador", description: null, isProtected: true, isActive: true, createdAt: new Date("2025-01-01"), updatedAt: new Date("2025-01-01") };
const brokerRole: Rol = { id: 2, slug: "broker", name: "Broker", description: null, isProtected: false, isActive: true, createdAt: new Date("2025-01-01"), updatedAt: new Date("2025-01-01") };

function usuario(parcial: Partial<Usuario> = {}): Usuario {
  return { id: 7, roleId: 1, authUserId: null, fullName: "Admin", email: "admin@example.com", passwordHash: null, initials: "AD", jobTitle: null, phone: null, isActive: true, lastLoginAt: null, createdAt: new Date("2025-01-01"), updatedAt: new Date("2025-01-01"), deletedAt: null, ...parcial };
}

function montar(filas: readonly Usuario[] = [usuario()], roles: readonly Rol[] = [adminRole, brokerRole]) {
  const usuarios = usuariosEnMemoria(filas, roles);
  const auditoria = auditoriaEnMemoria();
  const unidad = unidadDeTrabajoEnMemoria({ usuarios, auditoria }, [usuarios, auditoria]);
  return { usuarios, auditoria, unidad };
}

test("el ultimo administrador no se puede editar ni borrar, y no escribe ni audita", async () => {
  const edit = montar();
  await assert.rejects(() => editarUsuario({ unidad: edit.unidad }, actor, "all", 7, { isActive: false }), (error: unknown) => error instanceof ConflictError && error.message === "Debe quedar al menos un administrador activo.");
  assert.equal(edit.usuarios.filas[0]!.isActive, true);
  assert.equal(edit.auditoria.registros.length, 0);
  const borrar = montar();
  await assert.rejects(() => borrarUsuario({ unidad: borrar.unidad }, actor, "all", 7), (error: unknown) => error instanceof ConflictError && error.message === "Debe quedar al menos un administrador activo.");
  assert.equal(borrar.usuarios.filas[0]!.deletedAt, null);
  assert.equal(borrar.auditoria.registros.length, 0);
});

test("alcance own no puede editar ni borrar, ni su propia fila", async () => {
  const edit = montar();
  await assert.rejects(() => editarUsuario({ unidad: edit.unidad }, own, "own", 7, {}), ForbiddenError);
  const borrar = montar();
  await assert.rejects(() => borrarUsuario({ unidad: borrar.unidad }, own, "own", 7), ForbiddenError);
  assert.equal(edit.usuarios.operaciones.length, 0);
  assert.equal(borrar.usuarios.operaciones.length, 0);
});

test("alta usa AdminAuth, conserva el orden y registra auditoria", async () => {
  const montaje = montar([]);
  const auth = adminAuthEnMemoria();
  const resultado = await crearUsuario({ usuarios: montaje.usuarios, unidad: montaje.unidad, adminAuth: auth }, actor, { fullName: "Broker Nuevo", email: "nuevo@example.com", roleId: 2, specialty: "Alquileres" });
  assert.deepEqual(auth.invitados, ["nuevo@example.com"]);
  assert.deepEqual(montaje.usuarios.operaciones, ["buscar-correo", "buscar-rol", "crear", "crear-perfil", "auth-id"]);
  assert.equal(resultado.invitado, true);
  assert.equal(montaje.auditoria.registros[0]?.accion, "crear");
  assert.equal(montaje.auditoria.registros[0]?.actorId, 7);
});

test("edicion y borrado normales auditan, y el reenvio llama al puerto", async () => {
  const montaje = montar([usuario({ id: 7 }), usuario({ id: 8, roleId: 2, email: "broker@example.com", fullName: "Broker" })]);
  const editado = await editarUsuario({ unidad: montaje.unidad }, actor, "all", 8, { fullName: "Broker Editado" });
  assert.equal(editado.fullName, "Broker Editado");
  await borrarUsuario({ unidad: montaje.unidad }, actor, "all", 8);
  assert.equal(montaje.auditoria.registros.length, 2);
  const reenvio = montar([usuario({ id: 8, roleId: 2, email: "broker@example.com", fullName: "Broker" })]);
  const auth = adminAuthEnMemoria();
  await reenviarInvitacion({ usuarios: reenvio.usuarios, adminAuth: auth }, 8);
  assert.deepEqual(auth.invitados, ["broker@example.com"]);
});
