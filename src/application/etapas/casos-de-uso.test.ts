import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { ConflictError, NotFoundError, ValidationError } from "../../domain/errors.ts";
import type { Actor } from "../../domain/rbac.ts";
import { auditoriaEnMemoria } from "../testing/auditoria-en-memoria.ts";
import { unidadDeTrabajoEnMemoria } from "../testing/unidad-de-trabajo-en-memoria.ts";
import { crearEtapa, editarEtapa } from "./casos-de-uso.ts";
import { etapasEnMemoria } from "./en-memoria.ts";
import type { Etapa } from "./puertos.ts";
const admin: Actor = { userId: 1, roleSlug: "admin", permissions: [] };
function etapa(id: number, parcial: Partial<Etapa> = {}): Etapa {
  return { id, slug: `etapa-${id}`, name: `Etapa ${id}`, kind: "open", position: id,
    defaultProbability: 20, isActive: true, createdAt: new Date(), updatedAt: new Date(), ...parcial };
}
function montar(semilla = [etapa(1), etapa(2), etapa(3)], usadas: number[] = []) {
  const repo = etapasEnMemoria(semilla, usadas); const auditoria = auditoriaEnMemoria();
  const unidad = unidadDeTrabajoEnMemoria({ etapas: repo, auditoria }, [repo, auditoria]);
  return { repo, auditoria, deps: { unidad } };
}
test("renombra y desactiva con autor y auditoría, preservando la identidad", async () => {
  const { deps, auditoria } = montar();
  const fila = await editarEtapa(deps, admin, 1, { name: " Contacto inicial ", isActive: false });
  assert.equal(fila.name, "Contacto inicial"); assert.equal(fila.slug, "etapa-1"); assert.equal(fila.isActive, false);
  assert.equal(auditoria.registros[0]!.actorId, 1); assert.equal((auditoria.registros[0]!.antes as Etapa).name, "Etapa 1");
});
test("probabilidad null limpia; ausente preserva", async () => {
  const { deps } = montar();
  assert.equal((await editarEtapa(deps, admin, 1, { name: "X" })).defaultProbability, 20);
  assert.equal((await editarEtapa(deps, admin, 1, { defaultProbability: null })).defaultProbability, null);
});
test("reordena hacia arriba sin posiciones duplicadas ni perder slugs", async () => {
  const { deps, repo } = montar();
  await editarEtapa(deps, admin, 3, { position: 1 });
  assert.deepEqual([...repo.etapas].sort((a,b) => a.position-b.position).map(e => [e.slug,e.position]), [["etapa-3",1],["etapa-1",2],["etapa-2",3]]);
});
test("reordena hacia abajo y acota posiciones fuera del catálogo", async () => {
  const { deps, repo } = montar(); await editarEtapa(deps, admin, 1, { position: 999 });
  assert.deepEqual([...repo.etapas].sort((a,b) => a.position-b.position).map(e=>e.id), [2,3,1]);
});
test("crea etapa intermedia con tipo y probabilidad, sin colisionar identidad", async () => {
  const { deps, repo, auditoria } = montar();
  const nueva = await crearEtapa(deps, admin, { name: "Visita", position: 2, kind: "open", defaultProbability: 65, isActive: true });
  assert.equal(nueva.position, 2); assert.equal(nueva.kind, "open"); assert.equal(nueva.defaultProbability, 65);
  assert.equal(repo.etapas.find(e=>e.id===2)?.position, 3); assert.match(nueva.slug, /^etapa-/);
  assert.equal(auditoria.registros[0]!.accion, "crear");
});
test("crear etapas ganada/perdida permite configurar catálogos sin hardcodear nombres", async () => {
  const { deps } = montar([]);
  for (const kind of ["won", "lost"] as const) assert.equal((await crearEtapa(deps, admin, { name: "Resultado", position: 1, kind, defaultProbability: null, isActive: true })).kind, kind);
});
test("permite cambiar el tipo de una etapa sin uso", async () => {
  const { deps } = montar(); assert.equal((await editarEtapa(deps, admin, 1, { kind: "lost" })).kind,"lost");
});
test("bloquea reinterpretar etapas con negocios o historial", async () => {
  const { deps, repo, auditoria } = montar(undefined, [1]);
  await assert.rejects(() => editarEtapa(deps, admin, 1, { kind: "won" }), ConflictError);
  assert.equal(repo.etapas[0]!.kind,"open"); assert.equal(auditoria.registros.length,0);
  assert.equal((await editarEtapa(deps,admin,1,{kind:"open",name:"Renombrada"})).name,"Renombrada");
});
test("etapa inexistente no audita", async () => {
  const { deps, auditoria } = montar(); await assert.rejects(() => editarEtapa(deps,admin,99,{name:"X"}),NotFoundError); assert.equal(auditoria.registros.length,0);
});
test("rechaza slug mutable, nombres vacíos, tipos y rangos inválidos antes de escribir", async () => {
  const { deps, auditoria } = montar();
  for (const input of [{slug:"contactado"},{name:" "},{kind:"inventado"},{position:0},{defaultProbability:101}]) {
    await assert.rejects(() => editarEtapa(deps,admin,1,input as never), ValidationError);
  }
  assert.equal(auditoria.registros.length,0);
});
test("adaptador serializa catálogo y asigna explícitamente; consulta negocio e historial para tipo", () => {
  const codigo=readFileSync(new URL("../../infrastructure/db/repos/etapas.ts",import.meta.url),"utf8");
  assert.match(codigo,/pg_advisory_xact_lock/); assert.match(codigo,/\.for\("update"\)/);
  assert.match(codigo,/from\(deals\)/); assert.match(codigo,/from\(dealStageHistory\)/);
  assert.match(codigo,/set\.kind = cambios\.kind/); assert.doesNotMatch(codigo,/\.\.\.cambios/);
});
