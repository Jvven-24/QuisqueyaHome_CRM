/**
 * Pruebas de los casos de uso de Contactos con dobles en memoria. El doble de
 * `buscarVisible` imita a `visibleRows`, así que las pruebas de alcance
 * ejercitan la regla y no un repositorio que devuelve cualquier cosa.
 */

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { ConflictError, ForbiddenError, NotFoundError } from "../../domain/errors.ts";
import type { Actor, PermissionScope } from "../../domain/rbac.ts";
import { auditoriaEnMemoria } from "../testing/auditoria-en-memoria.ts";
import { unidadDeTrabajoEnMemoria } from "../testing/unidad-de-trabajo-en-memoria.ts";
import { borrarContacto, crearContacto, editarContacto } from "./casos-de-uso.ts";
import { contactosEnMemoria } from "./en-memoria.ts";
import type { Contacto } from "./puertos.ts";

const MENSAJE_DUPLICADO = "Ya existe un contacto con ese teléfono o correo. Confirma si quieres crearlo de todas formas.";
const MENSAJE_REASIGNAR = "Solo un administrador o asistente puede reasignar el responsable de un contacto.";

const broker: Actor = { userId: 5, roleSlug: "broker", permissions: [] };

function contacto(parcial: Partial<Contacto> & { id: number }): Contacto {
  return {
    fullName: "Existente",
    phone: null,
    phoneDisplay: null,
    email: null,
    country: null,
    city: null,
    sourceId: null,
    brokerId: 9,
    notes: null,
    lastInteractionAt: null,
    consentAt: null,
    consentSource: null,
    createdAt: new Date("2025-01-01T00:00:00Z"),
    updatedAt: new Date("2025-01-01T00:00:00Z"),
    createdBy: 9,
    updatedBy: 9,
    deletedAt: null,
    ...parcial,
  };
}

function montar(iniciales: readonly Contacto[] = []) {
  const contactos = contactosEnMemoria(iniciales);
  const auditoria = auditoriaEnMemoria();
  const unidad = unidadDeTrabajoEnMemoria({ contactos, auditoria }, [contactos, auditoria]);
  return { contactos, auditoria, unidad, deps: { contactos, unidad } };
}

const conTelefono = contacto({ id: 1, fullName: "Ana", phone: "+18095550184", phoneDisplay: "809-555-0184", email: "ana@example.com" });

// --- crear -------------------------------------------------------------------

test("crear: asigna responsable y autoría al actor y audita con la fila completa", async () => {
  const { deps, contactos, auditoria } = montar();
  const fila = await crearContacto(deps, broker, { fullName: "Luis", sourceId: 3, notes: "nota" });

  assert.equal(fila.brokerId, 5);
  assert.equal(fila.createdBy, 5);
  assert.equal(fila.updatedBy, 5);
  assert.equal(fila.sourceId, 3);
  assert.equal(fila.email, null);
  assert.deepEqual(contactos.filas, [fila]);
  assert.deepEqual(auditoria.registros, [
    { accion: "crear", entidad: "contact", entidadId: fila.id, despues: fila, actorId: 5 },
  ]);
});

test("crear con teléfono duplicado sin crearIgual: ConflictError con candidatos, sin crear ni auditar", async () => {
  const { deps, contactos, auditoria } = montar([conTelefono]);
  const lector: Actor = { ...broker, permissions: [{ resource: "contacts", action: "view", scope: "all" }] };
  await assert.rejects(crearContacto(deps, lector, { fullName: "Otra", phone: "809-555-0184" }), (error) => {
    assert.ok(error instanceof ConflictError);
    assert.equal(error.message, MENSAJE_DUPLICADO);
    assert.deepEqual(error.details, {
      candidatos: [{ id: 1, fullName: "Ana", phone: "+18095550184", phoneDisplay: "809-555-0184", email: "ana@example.com" }],
    });
    return true;
  });
  assert.equal(contactos.filas.length, 1);
  assert.equal(auditoria.registros.length, 0);
});

for (const alcance of ["own", "team", "none", "all"] as const satisfies readonly PermissionScope[]) {
  for (const criterio of [{ phone: "809-555-0184" }, { email: "ana@example.com" }]) {
    test(`F04 contactos: advertencia global y candidatos visibles con ${alcance}, ${"phone" in criterio ? "teléfono" : "correo"}`, async () => {
      const propios = { ...conTelefono, id: 2, fullName: "Propio", brokerId: broker.userId };
      const borrado = { ...conTelefono, id: 3, fullName: "Borrado", deletedAt: new Date() };
      const { deps, contactos, auditoria } = montar([conTelefono, propios, borrado]);
      const lector: Actor = { ...broker, permissions: [{ resource: "contacts", action: "view", scope: alcance }] };
      const esperado = (alcance === "all" ? [conTelefono, propios] : alcance === "none" ? [] : [propios])
        .map(({ id, fullName, phone, phoneDisplay, email }) => ({ id, fullName, phone, phoneDisplay, email }));
      await assert.rejects(crearContacto(deps, lector, { fullName: "Nueva", ...criterio }), (error) => {
        assert.ok(error instanceof ConflictError);
        assert.equal(error.message, MENSAJE_DUPLICADO);
        assert.deepEqual(error.details, { candidatos: esperado });
        return true;
      });
      assert.equal(contactos.filas.length, 3);
      assert.equal(auditoria.registros.length, 0);
    });
  }
}

test("F04 contactos: candidato exclusivamente ajeno mantiene advertencia sin PII y permite crearIgual", async () => {
  const { deps, contactos, auditoria } = montar([conTelefono]);
  const lector: Actor = { ...broker, permissions: [{ resource: "contacts", action: "view", scope: "own" }] };
  await assert.rejects(crearContacto(deps, lector, { fullName: "Nueva", email: "ana@example.com" }), (error) => {
    assert.ok(error instanceof ConflictError);
    assert.equal(error.message, MENSAJE_DUPLICADO);
    assert.deepEqual(error.details, { candidatos: [] });
    return true;
  });
  assert.equal(auditoria.registros.length, 0);
  await crearContacto(deps, lector, { fullName: "Nueva", email: "ana@example.com", crearIgual: true });
  assert.equal(contactos.filas.length, 2);
});

test("F04 contactos: la consulta identificable de duplicados aplica visibleRows en SQL", () => {
  const fuente = readFileSync(new URL("../../infrastructure/db/repos/contactos.ts", import.meta.url), "utf8");
  const metodo = fuente.slice(fuente.indexOf("async candidatosDuplicados("), fuente.indexOf("async buscarVisible("));
  const consultaIdentificable = metodo.slice(metodo.indexOf("const candidatos ="));
  assert.match(consultaIdentificable, /\.where\([\s\S]*visibleRows\(actor, alcanceLectura, contacts\.brokerId, contacts\.deletedAt\)/);
  assert.match(metodo, /select\(\{ id: contacts\.id \}\)[\s\S]*isNull\(contacts\.deletedAt\)[\s\S]*\.limit\(1\)/);
});

test("crear con correo duplicado sin crearIgual: ConflictError, sin crear ni auditar", async () => {
  const { deps, contactos, auditoria } = montar([conTelefono]);
  await assert.rejects(crearContacto(deps, broker, { fullName: "Otra", email: "ana@example.com" }), (error) => {
    assert.ok(error instanceof ConflictError);
    assert.equal(error.message, MENSAJE_DUPLICADO);
    return true;
  });
  assert.equal(contactos.filas.length, 1);
  assert.equal(auditoria.registros.length, 0);
});

test("crear con duplicado y crearIgual: crea", async () => {
  const { deps, contactos } = montar([conTelefono]);
  const fila = await crearContacto(deps, broker, { fullName: "Otra", phone: "809-555-0184", crearIgual: true });
  assert.equal(contactos.filas.length, 2);
  assert.equal(fila.phone, "+18095550184");
});

test("crear sin teléfono ni correo: no consulta duplicados y crea", async () => {
  const { deps, contactos } = montar([conTelefono]);
  let consultas = 0;
  const original = contactos.candidatosDuplicados;
  contactos.candidatosDuplicados = async (...args) => {
    consultas += 1;
    return original(...args);
  };
  await crearContacto(deps, broker, { fullName: "Sin datos" });
  assert.equal(consultas, 0);
  assert.equal(contactos.filas.length, 2);
});

test("crear normaliza el teléfono a E.164 y conserva lo que escribió el usuario", async () => {
  const { deps } = montar();
  const fila = await crearContacto(deps, broker, { fullName: "Luis", phone: "809-555-0199" });
  assert.equal(fila.phone, "+18095550199");
  assert.equal(fila.phoneDisplay, "809-555-0199");
});

// --- editar ------------------------------------------------------------------

test("editar: cambia solo los campos presentes y audita antes y después", async () => {
  const { deps, auditoria } = montar([contacto({ id: 1, fullName: "Ana", brokerId: 5, notes: "vieja", email: "a@x.com" })]);
  const fila = await editarContacto(deps, broker, "own", 1, { fullName: "Ana María" });

  assert.equal(fila.fullName, "Ana María");
  assert.equal(fila.notes, "vieja");
  assert.equal(fila.email, "a@x.com");
  assert.equal(fila.updatedBy, 5);
  assert.equal(auditoria.registros.length, 1);
  const registro = auditoria.registros[0]!;
  assert.equal(registro.accion, "editar");
  assert.equal(registro.entidad, "contact");
  assert.equal(registro.entidadId, 1);
  assert.equal((registro.antes as Contacto).fullName, "Ana");
  assert.deepEqual(registro.despues, fila);
});

test("editar con phone null borra phone y phoneDisplay; sin la clave los deja igual", async () => {
  const { deps } = montar([{ ...conTelefono, brokerId: 5 }]);

  const intacto = await editarContacto(deps, broker, "own", 1, { notes: "x" });
  assert.equal(intacto.phone, "+18095550184");
  assert.equal(intacto.phoneDisplay, "809-555-0184");

  const borrado = await editarContacto(deps, broker, "own", 1, { phone: null });
  assert.equal(borrado.phone, null);
  assert.equal(borrado.phoneDisplay, null);
});

test("editar con brokerId y alcance own: ForbiddenError y no escribe nada", async () => {
  const { deps, contactos, auditoria, unidad } = montar([contacto({ id: 1, brokerId: 5 })]);
  const antes = contactos.filas;
  await assert.rejects(editarContacto(deps, broker, "own", 1, { brokerId: 5 }), (error) => {
    assert.ok(error instanceof ForbiddenError);
    assert.equal(error.message, MENSAJE_REASIGNAR);
    return true;
  });
  assert.equal(contactos.filas, antes);
  assert.equal(auditoria.registros.length, 0);
  assert.equal(unidad.confirmadas + unidad.revertidas, 0);
});

test("editar con brokerId y alcance all: reasigna", async () => {
  const admin: Actor = { userId: 1, roleSlug: "admin", permissions: [] };
  const { deps } = montar([contacto({ id: 1, brokerId: 9 })]);
  const fila = await editarContacto(deps, admin, "all", 1, { brokerId: 5 });
  assert.equal(fila.brokerId, 5);
});

test("editar un contacto fuera del alcance: NotFoundError y no escribe", async () => {
  const { deps, contactos, auditoria } = montar([contacto({ id: 1, brokerId: 9 })]);
  const antes = contactos.filas;
  await assert.rejects(editarContacto(deps, broker, "own", 1, { fullName: "X" }), NotFoundError);
  assert.equal(contactos.filas, antes);
  assert.equal(auditoria.registros.length, 0);
});

// --- borrar ------------------------------------------------------------------

test("borrar: escribe deletedAt, conserva la fila, audita eliminar y deja de verse", async () => {
  const { deps, contactos, auditoria } = montar([contacto({ id: 1, brokerId: 5 })]);
  await borrarContacto(deps, broker, "own", 1);

  assert.equal(contactos.filas.length, 1);
  assert.ok(contactos.filas[0]!.deletedAt instanceof Date);
  assert.equal(contactos.filas[0]!.updatedBy, 5);
  assert.equal(await contactos.buscarVisible(broker, "own", 1), undefined);
  assert.equal(auditoria.registros.length, 1);
  const registro = auditoria.registros[0]!;
  assert.equal(registro.accion, "eliminar");
  assert.equal(registro.entidadId, 1);
  assert.equal((registro.antes as Contacto).deletedAt, null);
  assert.deepEqual(registro.despues, contactos.filas[0]);
});

test("borrar un id inexistente o fuera de alcance: NotFoundError", async () => {
  const { deps } = montar([contacto({ id: 1, brokerId: 9 })]);
  await assert.rejects(borrarContacto(deps, broker, "own", 99), NotFoundError);
  await assert.rejects(borrarContacto(deps, broker, "own", 1), NotFoundError);
});

// --- transacción -------------------------------------------------------------

test("un fallo dentro de la transacción no deja fila ni auditoría", async () => {
  const { contactos, auditoria, unidad } = montar();
  const fallando = {
    ...contactos,
    async crear(datos: Parameters<typeof contactos.crear>[0]) {
      await contactos.crear(datos);
      throw new Error("falla después de escribir");
    },
  };
  // La unidad entrega el repositorio que falla tras escribir; la auditoría va a la par.
  const unidadFallando = unidadDeTrabajoEnMemoria({ contactos: fallando, auditoria }, [contactos, auditoria]);

  await assert.rejects(
    crearContacto({ contactos, unidad: unidadFallando }, broker, { fullName: "X" }),
    { message: "falla después de escribir" },
  );
  assert.equal(contactos.filas.length, 0);
  assert.equal(auditoria.registros.length, 0);
  assert.equal(unidadFallando.revertidas, 1);
  assert.equal(unidad.revertidas, 0);
});
