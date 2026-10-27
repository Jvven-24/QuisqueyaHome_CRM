/**
 * Suites de contrato de los puertos compartidos.
 *
 * Un doble en memoria solo sirve si se comporta como el adaptador real; si
 * cada uno se probara con sus propias pruebas, podrían divergir sin que nada
 * lo avise y los casos de uso pasarían contra un doble que miente. Por eso el
 * comportamiento se escribe una vez aquí y se corre contra cualquier
 * implementación que entregue la fábrica.
 *
 * Los nombres de los `test` llevan `nombre` como prefijo para que la misma
 * suite se pueda registrar después contra el adaptador real sin choque de
 * nombres. Este archivo no es un `*.test.ts`: `npm test` no lo corre solo; lo
 * invoca la prueba que lo importa.
 */

import assert from "node:assert/strict";
import { test } from "node:test";
import { ConflictError } from "../../domain/errors.ts";
import type { Actor } from "../../domain/rbac.ts";
import type { AdminAuth } from "../compartido/admin-auth.ts";
import type { AlmacenamientoArchivos } from "../compartido/almacenamiento.ts";
import type { Auditoria } from "../compartido/auditoria.ts";
import type { UnidadDeTrabajo } from "../compartido/unidad-de-trabajo.ts";

const actor: Actor = { userId: 7, roleSlug: "admin", permissions: [] };

/**
 * El puerto de auditoría no expone lectura, así que la fábrica entrega también
 * `leer`, que devuelve lo registrado hasta ahora.
 */
export function contratoAuditoria(
  nombre: string,
  crear: () => {
    auditoria: Auditoria;
    leer: () => readonly { actorId: number; accion: string; entidadId: number }[];
  },
): void {
  test(`${nombre}: registrar deja rastro del actor, la acción y la entidad`, async () => {
    const { auditoria, leer } = crear();
    await auditoria.registrar(actor, {
      accion: "editar",
      entidad: "contact",
      entidadId: 5,
      antes: { phone: "1" },
      despues: { phone: "2" },
    });
    // Se proyectan solo los campos del contrato: el doble puede guardar más.
    assert.deepEqual(
      leer().map(({ actorId, accion, entidadId }) => ({ actorId, accion, entidadId })),
      [{ actorId: 7, accion: "editar", entidadId: 5 }],
    );
  });

  test(`${nombre}: acepta un registro sin antes ni despues`, async () => {
    const { auditoria, leer } = crear();
    await auditoria.registrar(actor, { accion: "crear", entidad: "lead", entidadId: 9 });
    assert.equal(leer().length, 1);
  });

  test(`${nombre}: los registros múltiples conservan el orden`, async () => {
    const { auditoria, leer } = crear();
    await auditoria.registrar(actor, { accion: "crear", entidad: "deal", entidadId: 1 });
    await auditoria.registrar(actor, { accion: "editar", entidad: "deal", entidadId: 2 });
    await auditoria.registrar(actor, { accion: "cerrar", entidad: "deal", entidadId: 3 });
    assert.deepEqual(
      leer().map((r) => r.entidadId),
      [1, 2, 3],
    );
  });
}

export function contratoAlmacenamiento(nombre: string, crear: () => AlmacenamientoArchivos): void {
  const archivo = (ruta: string, nombreVisible = "foto.jpg") => ({
    ruta,
    contenido: new Blob(["abc"], { type: "image/jpeg" }),
    tipoMime: "image/jpeg",
    nombreVisible,
  });

  test(`${nombre}: urlsFirmadas devuelve una url por ruta, en el mismo orden`, async () => {
    const almacen = crear();
    await almacen.subir(archivo("a/1.jpg"));
    await almacen.subir(archivo("a/2.jpg"));
    const urls = await almacen.urlsFirmadas(["a/2.jpg", "a/1.jpg"], 3600);
    assert.equal(urls.length, 2);
    assert.ok(urls[0]?.includes("a/2.jpg"));
    assert.ok(urls[1]?.includes("a/1.jpg"));
  });

  test(`${nombre}: una ruta desconocida da null`, async () => {
    const almacen = crear();
    await almacen.subir(archivo("a/1.jpg"));
    const urls = await almacen.urlsFirmadas(["a/1.jpg", "a/no-existe.jpg"], 60);
    assert.equal(typeof urls[0], "string");
    assert.equal(urls[1], null);
  });

  test(`${nombre}: subir sobre una ruta ocupada lanza ConflictError con el nombre visible`, async () => {
    const almacen = crear();
    await almacen.subir(archivo("a/1.jpg"));
    await assert.rejects(almacen.subir(archivo("a/1.jpg", "casa frontal.jpg")), (error) => {
      assert.ok(error instanceof ConflictError);
      assert.ok(error.message.includes("casa frontal.jpg"));
      return true;
    });
  });

  test(`${nombre}: borrar quita el objeto y no lanza con rutas inexistentes`, async () => {
    const almacen = crear();
    await almacen.subir(archivo("a/1.jpg"));
    await almacen.borrar(["a/1.jpg", "a/nunca-existio.jpg"]);
    assert.deepEqual(await almacen.urlsFirmadas(["a/1.jpg"], 60), [null]);
    await almacen.borrar([]);
  });

  test(`${nombre}: urlsFirmadas([]) devuelve []`, async () => {
    assert.deepEqual(await crear().urlsFirmadas([], 60), []);
  });
}

/** Como la auditoría, `leer` devuelve los correos invitados hasta ahora. */
export function contratoAdminAuth(
  nombre: string,
  crear: () => { admin: AdminAuth; leer: () => readonly string[] },
): void {
  test(`${nombre}: invitar devuelve un id no vacío o null`, async () => {
    const { admin } = crear();
    const id = await admin.invitarPorCorreo("ana@example.com");
    assert.ok(id === null || (typeof id === "string" && id.length > 0));
  });

  test(`${nombre}: el correo invitado queda registrado`, async () => {
    const { admin, leer } = crear();
    await admin.invitarPorCorreo("ana@example.com");
    await admin.invitarPorCorreo("luis@example.com");
    assert.deepEqual(leer(), ["ana@example.com", "luis@example.com"]);
  });
}

export function contratoUnidadDeTrabajo(
  nombre: string,
  crear: () => {
    unidad: UnidadDeTrabajo<{ marca: string }>;
    repos: { marca: string };
    /** Estado observable que la unidad debe revertir si el callback lanza. */
    leer: () => number;
  },
): void {
  test(`${nombre}: el callback recibe la misma identidad de repos`, async () => {
    const { unidad, repos } = crear();
    await unidad.ejecutar(async (recibidos) => {
      assert.equal(recibidos, repos);
    });
  });

  test(`${nombre}: el valor devuelto por fn llega al llamante`, async () => {
    const { unidad } = crear();
    assert.equal(await unidad.ejecutar(async () => 42), 42);
  });

  test(`${nombre}: si fn lanza, el error se propaga tal cual y no queda nada escrito`, async () => {
    const { unidad, leer } = crear();
    const previo = leer();
    const error = new Error("falla a propósito");
    await assert.rejects(
      unidad.ejecutar(async () => {
        throw error;
      }),
      (recibido) => recibido === error,
    );
    assert.equal(leer(), previo);
  });
}
