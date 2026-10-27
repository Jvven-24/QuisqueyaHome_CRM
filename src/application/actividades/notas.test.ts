import { test } from "node:test";
import assert from "node:assert/strict";
import { escribirNota, leerNotas, puedeModificarNota, textoNotaSchema, type Nota, type ReposNotas, type RepositorioNotas } from "./notas.ts";
import type { Actor } from "../../domain/rbac.ts";
import { ForbiddenError, NotFoundError } from "../../domain/errors.ts";
const actor: Actor = { userId: 7, roleSlug: "broker", permissions: ["view", "create", "edit", "delete"].map(action => ({ resource: "activities", action: action as "view" | "create" | "edit" | "delete", scope: "own" })) };
const contexto = { entidad: "lead", entidadId: 1 } as const;
function entorno(visible = true) {
  let filas: Nota[] = [];
  const audit: unknown[] = [];
  const fecha = new Date("2026-10-27T00:00:00Z");
  const repo: RepositorioNotas = {
    async contextoVisible() { return visible ? { contactId: 3, leadId: 1, dealId: null } : undefined; },
    async listar() { return filas; },
    async buscar(_ref, id) { return filas.find(n => n.id === id); },
    async crear(_ref, texto, id) { const nota = { id: filas.length + 1, title: texto, description: null, createdBy: id, author: "Broker", createdAt: fecha, updatedAt: fecha }; filas.push(nota); return nota; },
    async editar(id, texto) { const nota = filas.find(n => n.id === id)!; nota.title = texto; return nota; },
    async borrar(id) { filas = filas.filter(n => n.id !== id); },
  };
  const unidad = { async ejecutar<T>(fn: (repos: ReposNotas) => Promise<T>) { return fn({ notas: repo, auditoria: { async registrar(_actor, registro) { audit.push(registro); } } }); } };
  return { repo, unidad, audit };
}
test("bitácora: crear, listar con autor/fecha, editar y retirar con auditoría", async () => {
  const { repo, unidad, audit } = entorno();
  await escribirNota(unidad, actor, contexto, "create", undefined, " Primera nota ");
  const lista = await leerNotas(repo, actor, contexto);
  assert.equal(lista.notas[0]!.title, "Primera nota");
  assert.equal(lista.notas[0]!.author, "Broker");
  assert.ok(lista.notas[0]!.createdAt instanceof Date);
  assert.equal(lista.notas[0]!.puedeEditar, true);
  await escribirNota(unidad, actor, contexto, "edit", 1, "Corregida");
  assert.equal((await leerNotas(repo, actor, contexto)).notas[0]!.title, "Corregida");
  await escribirNota(unidad, actor, contexto, "delete", 1);
  assert.equal((await leerNotas(repo, actor, contexto)).notas.length, 0);
  assert.equal(audit.length, 3);
});
test("nota de otro autor exige permiso global aunque se comparta la ficha", async () => {
  const { repo, unidad } = entorno();
  await repo.crear({ contactId: 3, leadId: 1, dealId: null }, "Ajena", 8);
  assert.equal((await leerNotas(repo, actor, contexto)).notas[0]!.puedeEditar, false);
  for (const accion of ["edit", "delete"] as const) await assert.rejects(escribirNota(unidad, actor, contexto, accion, 1, "Intento"), ForbiddenError);
  const admin: Actor = { ...actor, permissions: [{ resource: "activities", action: "edit", scope: "all" }] };
  await escribirNota(unidad, admin, contexto, "edit", 1, "Supervisada");
});
test("ámbito: ficha ajena o nota fuera de la ficha devuelve 404", async () => {
  const { repo, unidad } = entorno(false);
  await assert.rejects(leerNotas(repo, actor, contexto), NotFoundError);
  await assert.rejects(escribirNota(unidad, actor, contexto, "create", undefined, "Intento"), NotFoundError);
  await assert.rejects(escribirNota(entorno().unidad, actor, contexto, "delete", 999), NotFoundError);
});
test("sin permiso ni el autor puede mutar; team no concede notas ajenas", async () => {
  assert.equal(puedeModificarNota({ ...actor, permissions: [] }, { createdBy: 7 }, "edit"), false);
  assert.equal(puedeModificarNota({ ...actor, permissions: [{ resource: "activities", action: "edit", scope: "team" }] }, { createdBy: 8 }, "edit"), false);
  await assert.rejects(escribirNota(entorno().unidad, { ...actor, permissions: [] }, contexto, "create", undefined, "Intento"), ForbiddenError);
});
test("notas vacías y texto excesivo se rechazan", () => {
  for (const texto of ["", "  \n ", "x".repeat(10001)]) assert.equal(textoNotaSchema.safeParse(texto).success, false);
});
