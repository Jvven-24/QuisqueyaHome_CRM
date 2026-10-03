/**
 * Pruebas del caso de uso de Etapas con dobles en memoria.
 *
 * Lo más importante: `kind` y `slug` no se pueden cambiar. Hay una prueba de
 * comportamiento y una guarda de lectura de código del adaptador (H33).
 */

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { NotFoundError } from "../../domain/errors.ts";
import type { Actor } from "../../domain/rbac.ts";
import { auditoriaEnMemoria } from "../testing/auditoria-en-memoria.ts";
import { unidadDeTrabajoEnMemoria } from "../testing/unidad-de-trabajo-en-memoria.ts";
import { editarEtapa } from "./casos-de-uso.ts";
import { etapasEnMemoria } from "./en-memoria.ts";
import type { CambiosEtapa, Etapa } from "./puertos.ts";

const admin: Actor = { userId: 1, roleSlug: "admin", permissions: [] };

function etapa(parcial: Partial<Etapa> & { id: number }): Etapa {
  return {
    slug: "cerrado-ganado",
    name: "Cerrado ganado",
    position: 5,
    kind: "won",
    defaultProbability: 100,
    isActive: true,
    createdAt: new Date("2025-01-01T00:00:00Z"),
    updatedAt: new Date("2025-01-01T00:00:00Z"),
    ...parcial,
  };
}

function montar(etapas: Etapa[]) {
  const repo = etapasEnMemoria(etapas);
  const auditoria = auditoriaEnMemoria();
  const unidad = unidadDeTrabajoEnMemoria({ etapas: repo, auditoria }, [repo, auditoria]);
  return { repo, auditoria, deps: { unidad } };
}

test("renombrar: cambia el nombre, deja lo demás y audita con antes/después", async () => {
  const { auditoria, deps } = montar([etapa({ id: 4 })]);
  const fila = await editarEtapa(deps, admin, 4, { name: "Venta cerrada" });

  assert.equal(fila.name, "Venta cerrada");
  assert.equal(fila.position, 5);
  assert.equal(fila.defaultProbability, 100);
  assert.equal(auditoria.registros.length, 1);
  const registro = auditoria.registros[0]!;
  assert.equal(registro.accion, "editar");
  assert.equal(registro.entidad, "pipeline_stage");
  assert.equal(registro.entidadId, 4);
  assert.equal(registro.actorId, 1);
  assert.equal((registro.antes as Etapa).name, "Cerrado ganado");
  assert.equal((registro.despues as Etapa).name, "Venta cerrada");
});

test("defaultProbability: null la borra; ausente la deja", async () => {
  const { deps } = montar([etapa({ id: 4 })]);
  const igual = await editarEtapa(deps, admin, 4, { name: "X" });
  assert.equal(igual.defaultProbability, 100);
  const borrada = await editarEtapa(deps, admin, 4, { defaultProbability: null });
  assert.equal(borrada.defaultProbability, null);
});

test("posición y activa se editan", async () => {
  const { deps } = montar([etapa({ id: 4 })]);
  const fila = await editarEtapa(deps, admin, 4, { position: 2, isActive: false });
  assert.equal(fila.position, 2);
  assert.equal(fila.isActive, false);
});

test("una etapa inexistente da NotFoundError y no audita", async () => {
  const { auditoria, deps } = montar([]);
  await assert.rejects(() => editarEtapa(deps, admin, 9, { name: "X" }), NotFoundError);
  assert.equal(auditoria.registros.length, 0);
});

test("kind y slug en la entrada NO cambian la fila guardada", async () => {
  const { repo, auditoria, deps } = montar([etapa({ id: 4 })]);
  // Escrito a mano, saltándose el tipo (`kind?: never`): como lo haría un
  // `...body` descuidado en una ruta.
  const traicionera = { name: "Venta cerrada", kind: "lost", slug: "hackeado" } as unknown as CambiosEtapa;
  const fila = await editarEtapa(deps, admin, 4, traicionera);

  assert.equal(fila.name, "Venta cerrada", "lo permitido sí se aplica");
  assert.equal(fila.kind, "won");
  assert.equal(fila.slug, "cerrado-ganado");
  const guardada = repo.etapas.find((e) => e.id === 4)!;
  assert.equal(guardada.kind, "won");
  assert.equal(guardada.slug, "cerrado-ganado");
  assert.equal((auditoria.registros[0]!.despues as Etapa).kind, "won");
});

test("el tipo CambiosEtapa no admite kind ni slug (ni a mano)", () => {
  // @ts-expect-error `kind` es `never`: escribirlo no compila.
  const conKind: CambiosEtapa = { kind: "lost" };
  // @ts-expect-error `slug` es `never`: escribirlo no compila.
  const conSlug: CambiosEtapa = { slug: "x" };
  assert.ok(conKind && conSlug);
});

// --- Guarda de lectura de código (H33) --------------------------------------

test("el adaptador real arma el set de la etapa sin nombrar kind ni slug", () => {
  // Un doble no puede ver qué columnas escribe el SQL real: se vigila el texto.
  // Los comentarios se quitan antes de afirmar, porque el docblock del adaptador
  // menciona `kind` y `slug` y un comentario no es una garantía. Se lee el
  // archivo en vez de importarlo: abre la conexión al cargarse y usa imports sin
  // extensión que `node --test` no resuelve.
  const codigo = readFileSync(new URL("../../infrastructure/db/repos/etapas.ts", import.meta.url), "utf8")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^\s*\/\/.*$/gm, "");

  assert.match(codigo, /\.update\(pipelineStages\)\.set\(set\)/, "el update escribe el set armado campo por campo");
  assert.match(codigo, /set\.name = cambios\.name/, "y ese set sí asigna los campos permitidos");
  assert.doesNotMatch(codigo, /\bkind\b/, "el adaptador no nombra kind");
  assert.doesNotMatch(codigo, /\bslug\b/, "el adaptador no nombra slug");
  assert.doesNotMatch(codigo, /\.\.\.cambios/, "nunca se esparce la entrada en el set");
});
