/**
 * Pruebas de los casos de uso de Catálogos con dobles en memoria: alta y edición
 * de los dos tipos (motivos de pérdida y canales) con el mismo código.
 */

import assert from "node:assert/strict";
import { test } from "node:test";
import { NotFoundError } from "../../domain/errors.ts";
import type { Actor } from "../../domain/rbac.ts";
import { auditoriaEnMemoria } from "../testing/auditoria-en-memoria.ts";
import { unidadDeTrabajoEnMemoria } from "../testing/unidad-de-trabajo-en-memoria.ts";
import { crearEntradaCatalogo, editarEntradaCatalogo, esTipoCatalogo } from "./casos-de-uso.ts";
import { catalogosEnMemoria } from "./en-memoria.ts";
import type { EntradaCatalogo, TipoCatalogo } from "./puertos.ts";

const admin: Actor = { userId: 1, roleSlug: "admin", permissions: [] };

function entrada(parcial: Partial<EntradaCatalogo> & { id: number }): EntradaCatalogo {
  return {
    slug: `slug-${parcial.id}`,
    name: `Nombre ${parcial.id}`,
    position: 0,
    isActive: true,
    createdAt: new Date("2025-01-01T00:00:00Z"),
    updatedAt: new Date("2025-01-01T00:00:00Z"),
    ...parcial,
  };
}

function montar(semilla: Partial<Record<TipoCatalogo, EntradaCatalogo[]>> = {}) {
  const repo = catalogosEnMemoria(semilla);
  const auditoria = auditoriaEnMemoria();
  const unidad = unidadDeTrabajoEnMemoria({ catalogos: repo, auditoria }, [repo, auditoria]);
  return { repo, auditoria, unidad, deps: { unidad } };
}

const ENTIDADES: [TipoCatalogo, string][] = [
  ["motivos-perdida", "loss_reason"],
  ["canales", "lead_source"],
];

for (const [tipo, entidad] of ENTIDADES) {
  test(`alta en ${tipo}: slug a partir del nombre, posición 0 y auditoría de ${entidad}`, async () => {
    const { repo, auditoria, deps } = montar();
    const fila = await crearEntradaCatalogo(deps, admin, tipo, { name: "Precio muy alto" });

    assert.equal(fila.slug, "precio-muy-alto");
    assert.equal(fila.name, "Precio muy alto");
    assert.equal(fila.position, 0);
    assert.equal(fila.isActive, true);
    assert.equal(repo.filas(tipo).length, 1);
    const otro = tipo === "canales" ? "motivos-perdida" : "canales";
    assert.equal(repo.filas(otro).length, 0, "no toca el otro catálogo");

    assert.equal(auditoria.registros.length, 1);
    const registro = auditoria.registros[0]!;
    assert.equal(registro.accion, "crear");
    assert.equal(registro.entidad, entidad);
    assert.equal(registro.entidadId, fila.id);
    assert.equal(registro.actorId, 1);
    assert.deepEqual(registro.despues, fila);
    assert.equal(registro.antes, undefined);
  });

  test(`edición en ${tipo}: solo las claves presentes, con antes/después y auditoría de ${entidad}`, async () => {
    const { auditoria, deps } = montar({ [tipo]: [entrada({ id: 7, name: "Viejo", position: 3 })] });
    const fila = await editarEntradaCatalogo(deps, admin, tipo, 7, { name: "Nuevo", isActive: false });

    assert.equal(fila.name, "Nuevo");
    assert.equal(fila.isActive, false);
    assert.equal(fila.position, 3, "lo ausente no se toca");
    assert.equal(fila.slug, "slug-7", "el slug no se edita");

    const registro = auditoria.registros[0]!;
    assert.equal(registro.accion, "editar");
    assert.equal(registro.entidad, entidad);
    assert.equal(registro.entidadId, 7);
    assert.equal(registro.actorId, 1);
    assert.equal((registro.antes as EntradaCatalogo).name, "Viejo");
    assert.equal((registro.despues as EntradaCatalogo).name, "Nuevo");
  });

  test(`edición en ${tipo}: una entrada inexistente da NotFoundError y no audita`, async () => {
    const { auditoria, deps } = montar();
    await assert.rejects(() => editarEntradaCatalogo(deps, admin, tipo, 99, { name: "X" }), NotFoundError);
    assert.equal(auditoria.registros.length, 0);
  });
}

test("el id de un tipo no se encuentra en el otro", async () => {
  const { deps } = montar({ canales: [entrada({ id: 7 })] });
  await assert.rejects(() => editarEntradaCatalogo(deps, admin, "motivos-perdida", 7, { name: "X" }), NotFoundError);
});

test("slug repetido: se añade el sufijo con el número de coincidencias + 1", async () => {
  const { deps } = montar({
    canales: [entrada({ id: 1, slug: "referido" }), entrada({ id: 2, slug: "referido-2" }), entrada({ id: 3, slug: "referidos" })],
  });
  const fila = await crearEntradaCatalogo(deps, admin, "canales", { name: "Referido" });
  assert.equal(fila.slug, "referido-3");
});

test("alta con nombre sin letras ni dígitos usa el slug 'elemento'; con posición la respeta", async () => {
  const { deps } = montar();
  const fila = await crearEntradaCatalogo(deps, admin, "motivos-perdida", { name: "!!!", position: 4 });
  assert.equal(fila.slug, "elemento");
  assert.equal(fila.position, 4);
});

test("un fallo dentro de la transacción no deja fila ni auditoría", async () => {
  const { repo, auditoria, unidad } = montar();
  const deps = {
    unidad: {
      ejecutar: <T>(fn: Parameters<typeof unidad.ejecutar<T>>[0]) =>
        unidad.ejecutar(async (repos) => {
          await fn(repos);
          throw new Error("falla después de escribir");
        }),
    },
  };
  await assert.rejects(() => crearEntradaCatalogo(deps, admin, "canales", { name: "Web" }), /falla después de escribir/);
  assert.equal(repo.filas("canales").length, 0);
  assert.equal(auditoria.registros.length, 0);
});

test("esTipoCatalogo: solo las dos claves; un tipo desconocido (o heredado de Object) no pasa", () => {
  assert.equal(esTipoCatalogo("motivos-perdida"), true);
  assert.equal(esTipoCatalogo("canales"), true);
  assert.equal(esTipoCatalogo("otro"), false);
  assert.equal(esTipoCatalogo("toString"), false);
  assert.equal(esTipoCatalogo("__proto__"), false);
});
