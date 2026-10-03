/**
 * Casos de uso de Contactos: crear, editar y borrar.
 *
 * Son el comportamiento que antes vivía dentro de `api/contactos/**`, movido tal
 * cual: mismo orden de operaciones, mismos mensajes y mismas filas de auditoría
 * (la fila completa que devuelve el repositorio en `antes`/`despues`). Cada
 * función recibe sus dependencias en el primer parámetro y los datos en el
 * segundo; la autorización (`requireScope`) la hace quien llama, antes, y el
 * alcance resultante entra como parámetro donde hace falta.
 */

import { ConflictError, ForbiddenError, NotFoundError } from "../../domain/errors.ts";
import type { Actor, PermissionScope } from "../../domain/rbac.ts";
import { normalizarTelefono } from "../../domain/telefono.ts";
import type { UnidadDeTrabajo } from "../compartido/unidad-de-trabajo.ts";
import type { CambiosContacto, Contacto, RepositorioContactos, ReposContactos } from "./puertos.ts";

export type EntradaCrearContacto = {
  fullName: string;
  phone?: string;
  email?: string;
  sourceId?: number;
  notes?: string;
  /** Forzar la creación pese a candidatos de duplicado (decisión #19). */
  crearIgual?: boolean;
};

export async function crearContacto(
  deps: { contactos: RepositorioContactos; unidad: UnidadDeTrabajo<ReposContactos> },
  actor: Actor,
  entrada: EntradaCrearContacto,
): Promise<Contacto> {
  const { phone, phoneDisplay } = normalizarTelefono(entrada.phone ?? null);

  // Detección de duplicados (decisión #19): se busca en toda la cartera, no solo
  // en lo que el actor puede ver. Se avisa, no se bloquea: sin `crearIgual`, un
  // candidato lanza el conflicto en vez de crear.
  //
  // Esta lectura va FUERA de la transacción, igual que antes: `contacts` no tiene
  // índice único en `phone` ni en `email` (solo índices normales), así que es un
  // aviso y no una garantía, y meterla en el `BEGIN` sugeriría una exclusividad
  // que la base no da.
  if (!entrada.crearIgual && (phone || entrada.email)) {
    const candidatos = await deps.contactos.candidatosDuplicados({ phone, email: entrada.email ?? null });
    if (candidatos.length > 0) {
      throw new ConflictError(
        "Ya existe un contacto con ese teléfono o correo. Confirma si quieres crearlo de todas formas.",
        { candidatos },
      );
    }
  }

  return deps.unidad.ejecutar(async ({ contactos, auditoria }) => {
    const fila = await contactos.crear({
      fullName: entrada.fullName,
      phone,
      phoneDisplay,
      email: entrada.email ?? null,
      sourceId: entrada.sourceId ?? null,
      notes: entrada.notes ?? null,
      // El responsable por defecto es quien lo crea: sin esto, un broker con
      // alcance `own` no volvería a ver el contacto que acaba de dar de alta
      // (`rbac-filter.ts`), y quedaría huérfano de responsable.
      brokerId: actor.userId,
      createdBy: actor.userId,
      updatedBy: actor.userId,
    });

    await auditoria.registrar(actor, { accion: "crear", entidad: "contact", entidadId: fila.id, despues: fila });

    return fila;
  });
}

/**
 * Edición parcial. La distinción entre "ausente" y `null` es semántica: `null`
 * borra el campo y ausente lo deja como está. La firma con `?` no basta por sí
 * sola para expresarla, porque `{ phone: undefined }` tiene la clave presente
 * (`"phone" in entrada` es `true`) y aquí se trataría como borrar. Quien
 * construya la entrada debe OMITIR la clave, no pasar `undefined`; la ruta lo
 * garantiza porque Zod omite las claves ausentes y ella copia solo las presentes.
 */
export type EntradaEditarContacto = {
  fullName?: string;
  phone?: string | null;
  email?: string | null;
  sourceId?: number | null;
  notes?: string | null;
  brokerId?: number;
};

export async function editarContacto(
  deps: { unidad: UnidadDeTrabajo<ReposContactos> },
  actor: Actor,
  alcance: PermissionScope,
  id: number,
  entrada: EntradaEditarContacto,
): Promise<Contacto> {
  // Reasignar el responsable es una decisión de cartera, no de edición de ficha
  // (deuda de F1, issue #21): solo quien ve y edita toda la cartera (`all`) puede
  // mover un contacto de un broker a otro. Un broker con `own` podría, si no fuera
  // por esto, "regalarse" el contacto de otro con la misma llamada que corrige un
  // teléfono. Va antes de abrir la transacción, como siempre.
  if (entrada.brokerId !== undefined && alcance !== "all") {
    throw new ForbiddenError("Solo un administrador o asistente puede reasignar el responsable de un contacto.");
  }

  return deps.unidad.ejecutar(async ({ contactos, auditoria }) => {
    // Se relee dentro de la transacción: el `NotFoundError` cubre a la vez "no
    // existe" y "existe pero fuera de tu alcance" (`domain/errors.ts`), sin
    // distinguir los dos casos al usuario.
    const anterior = await contactos.buscarVisible(actor, alcance, id);
    if (!anterior) throw new NotFoundError();

    const cambios: CambiosContacto = { updatedBy: actor.userId };
    if (entrada.fullName !== undefined) cambios.fullName = entrada.fullName;
    if ("phone" in entrada) {
      const { phone, phoneDisplay } = normalizarTelefono(entrada.phone ?? null);
      cambios.phone = phone;
      cambios.phoneDisplay = phoneDisplay;
    }
    if ("email" in entrada) cambios.email = entrada.email;
    if ("sourceId" in entrada) cambios.sourceId = entrada.sourceId;
    if ("notes" in entrada) cambios.notes = entrada.notes;
    if (entrada.brokerId !== undefined) cambios.brokerId = entrada.brokerId;

    const fila = await contactos.actualizar(id, cambios);

    await auditoria.registrar(actor, {
      accion: "editar",
      entidad: "contact",
      entidadId: id,
      antes: anterior,
      despues: fila,
    });

    return fila;
  });
}

export async function borrarContacto(
  deps: { unidad: UnidadDeTrabajo<ReposContactos> },
  actor: Actor,
  alcance: PermissionScope,
  id: number,
): Promise<void> {
  await deps.unidad.ejecutar(async ({ contactos, auditoria }) => {
    const anterior = await contactos.buscarVisible(actor, alcance, id);
    if (!anterior) throw new NotFoundError();

    // Borrado lógico: nunca `DELETE` real. `buscarVisible` ya excluye `deletedAt`
    // no nulo de cualquier lectura futura.
    const fila = await contactos.marcarBorrado(id, new Date(), actor.userId);

    await auditoria.registrar(actor, {
      accion: "eliminar",
      entidad: "contact",
      entidadId: id,
      antes: anterior,
      despues: fila,
    });
  });
}
