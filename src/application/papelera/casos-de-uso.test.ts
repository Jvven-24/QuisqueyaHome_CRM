/**
 * Pruebas del caso de uso de Papelera con dobles en memoria: restaurar cada una
 * de las seis entidades. La restauración escribe SOLO `deletedAt = null`.
 */

import assert from "node:assert/strict";
import { test } from "node:test";
import { NotFoundError } from "../../domain/errors.ts";
import type { Actor } from "../../domain/rbac.ts";
import { auditoriaEnMemoria } from "../testing/auditoria-en-memoria.ts";
import { unidadDeTrabajoEnMemoria } from "../testing/unidad-de-trabajo-en-memoria.ts";
import { restaurarDePapelera } from "./casos-de-uso.ts";
import { papeleraEnMemoria } from "./en-memoria.ts";
import type { EntidadPapelera, FilaPapelera } from "./puertos.ts";

const admin: Actor = { userId: 1, roleSlug: "admin", permissions: [] };
const BORRADO = new Date("2026-02-01T00:00:00Z");

const ENTIDADES: EntidadPapelera[] = ["contact", "lead", "deal", "project", "unit", "user"];

function montar(semilla: Partial<Record<EntidadPapelera, FilaPapelera[]>>) {
  const repo = papeleraEnMemoria(semilla);
  const auditoria = auditoriaEnMemoria();
  const unidad = unidadDeTrabajoEnMemoria({ papelera: repo, auditoria }, [repo, auditoria]);
  return { repo, auditoria, deps: { unidad } };
}

for (const entidad of ENTIDADES) {
  test(`restaurar ${entidad}: quita deletedAt, audita con la entidad correcta y solo escribe deletedAt`, async () => {
    const original = { id: 3, name: "Algo", isActive: false, updatedAt: new Date("2025-06-01T00:00:00Z"), deletedAt: BORRADO };
    const { repo, auditoria, deps } = montar({ [entidad]: [original] });

    const fila = await restaurarDePapelera(deps, admin, entidad, 3);

    assert.equal(fila.deletedAt, null);
    // Solo deletedAt cambia: el resto de la fila queda idéntico (un usuario
    // restaurado vuelve «Inactivo»: eliminar lo desactiva y restaurar no lo reactiva).
    assert.deepEqual({ ...fila, deletedAt: BORRADO }, original);
    assert.equal(fila.isActive, false);
    assert.equal(repo.filas(entidad)[0]!.deletedAt, null);

    assert.equal(auditoria.registros.length, 1);
    const registro = auditoria.registros[0]!;
    assert.equal(registro.accion, "restaurar");
    assert.equal(registro.entidad, entidad);
    assert.equal(registro.entidadId, 3);
    assert.equal(registro.actorId, 1);
    assert.deepEqual(registro.antes, original);
    assert.deepEqual(registro.despues, fila);
  });
}

test("restaurar algo que no está borrado da NotFoundError y no audita", async () => {
  const { auditoria, deps } = montar({ contact: [{ id: 3, deletedAt: null }] });
  await assert.rejects(() => restaurarDePapelera(deps, admin, "contact", 3), NotFoundError);
  assert.equal(auditoria.registros.length, 0);
});

test("restaurar algo inexistente da NotFoundError", async () => {
  const { auditoria, deps } = montar({});
  await assert.rejects(() => restaurarDePapelera(deps, admin, "deal", 99), NotFoundError);
  assert.equal(auditoria.registros.length, 0);
});

test("una fila sin columna deletedAt da NotFoundError", async () => {
  const { deps } = montar({ unit: [{ id: 3 }] });
  await assert.rejects(() => restaurarDePapelera(deps, admin, "unit", 3), NotFoundError);
});

test("el mismo id en otra entidad no cuenta", async () => {
  const { deps } = montar({ lead: [{ id: 3, deletedAt: BORRADO }] });
  await assert.rejects(() => restaurarDePapelera(deps, admin, "contact", 3), NotFoundError);
});

test("un fallo dentro de la transacción deja la fila borrada y sin auditoría", async () => {
  const repo = papeleraEnMemoria({ contact: [{ id: 3, deletedAt: BORRADO }] });
  const auditoria = auditoriaEnMemoria();
  const unidad = unidadDeTrabajoEnMemoria({ papelera: repo, auditoria }, [repo, auditoria]);
  const fallando = { registrar: async () => { throw new Error("auditoría caída"); } };
  const deps = { unidad: { ejecutar: <T>(fn: (r: { papelera: typeof repo; auditoria: typeof fallando }) => Promise<T>) =>
    unidad.ejecutar(() => fn({ papelera: repo, auditoria: fallando })) } };

  await assert.rejects(() => restaurarDePapelera(deps, admin, "contact", 3), /auditoría caída/);
  assert.equal(repo.filas("contact")[0]!.deletedAt, BORRADO);
});
