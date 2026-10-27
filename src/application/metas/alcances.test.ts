import assert from "node:assert/strict";
import { test } from "node:test";
import { ConflictError, ForbiddenError, NotFoundError, ValidationError } from "../../domain/errors.ts";
import type { Actor } from "../../domain/rbac.ts";
import { auditoriaEnMemoria } from "../testing/auditoria-en-memoria.ts";
import { unidadDeTrabajoEnMemoria } from "../testing/unidad-de-trabajo-en-memoria.ts";
import { alcancesEnMemoria } from "./alcances-en-memoria.ts";
import { eliminarMetaAlcance, fijarMetaAlcance, guardarEquipo, publicarReglaAtribucion } from "./alcances.ts";

const admin: Actor = { userId: 1, roleSlug: "admin", permissions: [] };
const base = { year: 2026, month: 10, targetDeals: 5, currency: "USD" as const };

function montar() {
  const repo = alcancesEnMemoria({ proyectos: [10, 11], brokers: [5, 6, 7] });
  const auditoria = auditoriaEnMemoria();
  const unidad = unidadDeTrabajoEnMemoria({ alcances: repo, auditoria }, [repo, auditoria]);
  return { repo, auditoria, deps: { unidad, ahora: () => new Date("2026-10-26T12:00:00Z") } };
}

test("meta de proyecto: crea, luego edita la misma fila del periodo y audita ambas", async () => {
  const { repo, auditoria, deps } = montar();
  const a = await fijarMetaAlcance(deps, admin, "all", { ...base, scopeType: "project", scopeId: 10, targetAmountCents: 100_000_00 });
  const b = await fijarMetaAlcance(deps, admin, "all", { ...base, scopeType: "project", scopeId: 10, targetDeals: 8 });
  assert.equal(a.id, b.id);
  assert.equal(repo.metas.length, 1);
  assert.equal(b.targetDeals, 8);
  assert.deepEqual(auditoria.registros.map((r) => r.accion), ["crear", "editar"]);
  assert.equal(auditoria.registros[0]!.entidad, "scoped_goal");
});

test("meta de alcance: proyecto inexistente es NotFound y alcance own es Forbidden", async () => {
  const { deps } = montar();
  await assert.rejects(fijarMetaAlcance(deps, admin, "all", { ...base, scopeType: "project", scopeId: 99 }), NotFoundError);
  await assert.rejects(fijarMetaAlcance(deps, admin, "own", { ...base, scopeType: "project", scopeId: 10 }), ForbiddenError);
});

test("meta de alcance: valida negativos y moneda con mensajes en español", async () => {
  const { deps } = montar();
  await assert.rejects(fijarMetaAlcance(deps, admin, "all", { ...base, scopeType: "project", scopeId: 10, targetDeals: -1 }), (e) => {
    assert.ok(e instanceof ValidationError);
    assert.equal(e.fields?.targetDeals, "La meta no puede ser negativa.");
    return true;
  });
  await assert.rejects(fijarMetaAlcance(deps, admin, "all", { ...base, scopeType: "project", scopeId: 10, currency: "EUR" as "USD" }), ValidationError);
});

test("equipos: crea con líder incluido, mueve un broker de equipo y no admite nombre repetido", async () => {
  const { repo, deps } = montar();
  const e1 = await guardarEquipo(deps, admin, "all", { name: "Equipo Bávaro", leaderId: 5, memberIds: [6] });
  assert.deepEqual(e1.memberIds.sort(), [5, 6]);
  assert.equal(e1.slug, "equipo-bavaro");
  await guardarEquipo(deps, admin, "all", { name: "Equipo Piantini", memberIds: [6, 7] });
  assert.deepEqual(repo.equipos.find((e) => e.id === e1.id)!.memberIds, [5]);
  await assert.rejects(guardarEquipo(deps, admin, "all", { name: "equipo bavaro", memberIds: [] }), ConflictError);
});

test("equipos: solo brokers como miembros", async () => {
  const { deps } = montar();
  await assert.rejects(guardarEquipo(deps, admin, "all", { name: "Mixto", memberIds: [5, 42] }), (e) => {
    assert.ok(e instanceof ValidationError);
    assert.match(e.fields?.memberIds ?? "", /perfil de broker/);
    return true;
  });
});

test("meta de equipo: requiere equipo existente; eliminar audita y luego es NotFound", async () => {
  const { deps, auditoria } = montar();
  await assert.rejects(fijarMetaAlcance(deps, admin, "all", { ...base, scopeType: "team", scopeId: 1 }), NotFoundError);
  const eq = await guardarEquipo(deps, admin, "all", { name: "Norte", memberIds: [5] });
  const m = await fijarMetaAlcance(deps, admin, "all", { ...base, scopeType: "team", scopeId: eq.id });
  await eliminarMetaAlcance(deps, admin, "all", { id: m.id });
  assert.equal(auditoria.registros.at(-1)!.accion, "eliminar");
  await assert.rejects(eliminarMetaAlcance(deps, admin, "all", { id: m.id }), NotFoundError);
});

test("regla de atribución: cada publicación es una versión nueva, aprobada y única activa", async () => {
  const { repo, deps } = montar();
  const texto = "Un negocio ganado cuenta una sola vez en el mes de cierre.";
  const v1 = await publicarReglaAtribucion(deps, admin, "all", { scope: "Compañía", rule: texto, equipo: "equipo_del_broker_al_cierre" });
  const v2 = await publicarReglaAtribucion(deps, admin, "all", { scope: "Compañía", rule: texto, equipo: "sin_equipo" });
  assert.equal(v1.version, 1);
  assert.equal(v2.version, 2);
  assert.equal(v2.approvedBy, 1);
  assert.equal(v2.config.equipo, "sin_equipo");
  assert.equal(repo.reglas.filter((r) => r.isActive).length, 1);
  await assert.rejects(publicarReglaAtribucion(deps, admin, "all", { scope: "x", rule: "corta", equipo: "sin_equipo" }), ValidationError);
});
