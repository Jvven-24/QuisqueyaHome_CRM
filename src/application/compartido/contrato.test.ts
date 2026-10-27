/**
 * Corre las suites de contrato de `testing/contratos.ts` contra los dobles en
 * memoria, más lo que cada doble hace y el contrato no cubre (sus perillas de
 * fallo y sus contadores). Cuando existan pruebas de integración contra los
 * adaptadores reales, registrarán las mismas suites con otro `nombre`.
 */

import assert from "node:assert/strict";
import { test } from "node:test";
import { ConflictError } from "../../domain/errors.ts";
import { adminAuthEnMemoria } from "../testing/admin-auth-en-memoria.ts";
import { almacenamientoEnMemoria } from "../testing/almacenamiento-en-memoria.ts";
import { auditoriaEnMemoria } from "../testing/auditoria-en-memoria.ts";
import {
  contratoAdminAuth,
  contratoAlmacenamiento,
  contratoAuditoria,
  contratoUnidadDeTrabajo,
} from "../testing/contratos.ts";
import { unidadDeTrabajoEnMemoria } from "../testing/unidad-de-trabajo-en-memoria.ts";

contratoAuditoria("auditoría en memoria", () => {
  const auditoria = auditoriaEnMemoria();
  return { auditoria, leer: () => auditoria.registros };
});

contratoAlmacenamiento("almacenamiento en memoria", () => almacenamientoEnMemoria());

contratoAdminAuth("admin de Auth en memoria", () => {
  const admin = adminAuthEnMemoria();
  return { admin, leer: () => admin.invitados };
});

contratoUnidadDeTrabajo("unidad de trabajo en memoria", () => {
  const auditoria = auditoriaEnMemoria();
  const repos = { marca: "repos" };
  const unidad = unidadDeTrabajoEnMemoria(repos, [auditoria]);
  return {
    unidad,
    repos,
    leer: () => auditoria.registros.length,
  };
});

const actor = { userId: 1, roleSlug: "admin", permissions: [] } as const;
const foto = (nombreVisible = "foto.jpg") => ({
  ruta: "a/1.jpg",
  contenido: new Blob(["x"]),
  tipoMime: "image/jpeg",
  nombreVisible,
});

test("almacenamiento en memoria: fallarAlSubirCon fuerza el motivo en el mensaje", async () => {
  const almacen = almacenamientoEnMemoria({ fallarAlSubirCon: "Bucket no encontrado" });
  await assert.rejects(almacen.subir(foto("casa.jpg")), (error) => {
    assert.ok(error instanceof ConflictError);
    assert.equal(error.message, 'No se pudo subir "casa.jpg": Bucket no encontrado');
    return true;
  });
  assert.equal(almacen.objetos.size, 0);
});

test("almacenamiento en memoria: ruta ocupada usa el motivo `El objeto ya existe.`", async () => {
  const almacen = almacenamientoEnMemoria();
  await almacen.subir(foto());
  await assert.rejects(almacen.subir(foto()), { message: 'No se pudo subir "foto.jpg": El objeto ya existe.' });
});

test("almacenamiento en memoria: urlsFirmadas lleva la ruta y la vida en la url", async () => {
  const almacen = almacenamientoEnMemoria();
  await almacen.subir(foto());
  assert.deepEqual(await almacen.urlsFirmadas(["a/1.jpg"], 3600), ["memoria://a/1.jpg?exp=3600"]);
});

test("almacenamiento en memoria: fallarAlFirmarCon lanza ConflictError", async () => {
  const almacen = almacenamientoEnMemoria({ fallarAlFirmarCon: "Sin permiso" });
  await assert.rejects(almacen.urlsFirmadas(["a/1.jpg"], 60), (error) => {
    assert.ok(error instanceof ConflictError);
    assert.equal(error.message, "Sin permiso");
    return true;
  });
});

test("admin de Auth en memoria: numera los ids de usuario", async () => {
  const admin = adminAuthEnMemoria();
  assert.equal(await admin.invitarPorCorreo("a@example.com"), "auth-user-1");
  assert.equal(await admin.invitarPorCorreo("b@example.com"), "auth-user-2");
});

test("admin de Auth en memoria: fallarCon lanza ConflictError y no registra el correo", async () => {
  const admin = adminAuthEnMemoria({ fallarCon: "Correo inválido" });
  await assert.rejects(admin.invitarPorCorreo("a@example.com"), (error) => {
    assert.ok(error instanceof ConflictError);
    assert.equal(error.message, "Correo inválido");
    return true;
  });
  assert.deepEqual(admin.invitados, []);
});

test("admin de Auth en memoria: sinIdDeUsuario devuelve null pero registra el correo", async () => {
  const admin = adminAuthEnMemoria({ sinIdDeUsuario: true });
  assert.equal(await admin.invitarPorCorreo("a@example.com"), null);
  assert.deepEqual(admin.invitados, ["a@example.com"]);
});

test("auditoría en memoria: guarda actor, antes y después", async () => {
  const auditoria = auditoriaEnMemoria();
  await auditoria.registrar(actor, { accion: "editar", entidad: "contact", entidadId: 4, antes: 1, despues: 2 });
  assert.deepEqual(auditoria.registros, [
    { accion: "editar", entidad: "contact", entidadId: 4, antes: 1, despues: 2, actorId: 1 },
  ]);
});

test("unidad de trabajo en memoria: cuenta confirmadas y revertidas", async () => {
  const unidad = unidadDeTrabajoEnMemoria({});
  await unidad.ejecutar(async () => 1);
  await unidad.ejecutar(async () => 2);
  await assert.rejects(
    unidad.ejecutar(async () => {
      throw new Error("x");
    }),
  );
  assert.equal(unidad.confirmadas, 2);
  assert.equal(unidad.revertidas, 1);
});

/**
 * Ejercita que se restauran **varios** reversibles, no solo uno, y en orden
 * inverso. Ojo con leerlo como plantilla: en producción el almacenamiento de
 * archivos **no** forma parte del juego transaccional —es una llamada de red que
 * no cabe en el `BEGIN` de Postgres (ver `compartido/almacenamiento.ts`)— y el
 * caso de uso compensa llamando a `borrar` cuando el `INSERT` falla. Aquí entra
 * al juego solo porque es el otro doble `Reversible` que existe.
 */
test("unidad de trabajo en memoria: restaura todos los reversibles si fn lanza", async () => {
  const auditoria = auditoriaEnMemoria();
  const almacen = almacenamientoEnMemoria();
  const unidad = unidadDeTrabajoEnMemoria({ auditoria, almacen }, [auditoria, almacen]);

  await unidad.ejecutar(async ({ auditoria: a }) => {
    await a.registrar(actor, { accion: "crear", entidad: "file", entidadId: 1 });
  });

  await assert.rejects(
    unidad.ejecutar(async ({ auditoria: a, almacen: s }) => {
      await a.registrar(actor, { accion: "crear", entidad: "file", entidadId: 2 });
      await s.subir(foto());
      throw new Error("falla después de escribir");
    }),
    { message: "falla después de escribir" },
  );

  assert.deepEqual(
    auditoria.registros.map((r) => r.entidadId),
    [1],
  );
  assert.equal(almacen.objetos.size, 0);
});
