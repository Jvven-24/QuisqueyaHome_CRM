/**
 * Adaptadores Drizzle de Contactos (`application/contactos/puertos.ts`).
 *
 * El filtro de alcance y papelera vive en un solo sitio, `visibleRows`
 * (`convenciones.md`): ningún método escribe su propio `WHERE broker_id`. Y
 * `actualizar` arma el `set` campo por campo en vez de esparcir `cambios`, para
 * que un campo de más que llegara por error al repositorio no se escriba sin que
 * nadie lo decida.
 *
 * `repositorioContactos` acepta la transacción o la conexión suelta porque la
 * detección de duplicados corre fuera del `BEGIN` (`casos-de-uso.ts`).
 */

import { and, count, eq, ilike, isNull, or } from "drizzle-orm";
import type {
  BrokerAsignable,
  Canal,
  CandidatoDuplicado,
  Contacto,
  FilaListadoContacto,
  LecturaContactos,
  RepositorioContactos,
  ReposContactos,
} from "../../../application/contactos/puertos";
import type { Db } from "../client";
import { contacts, leadSources, roles, users } from "../schema";
import { visibleRows } from "../../rbac-filter";
import { auditoriaDrizzle, type Tx } from "./compartido";

/**
 * `Tx` y `Db` no se unifican limpiamente como unión, pero comparten `select`,
 * `insert` y `update`, que es todo lo que usa el repositorio: se tipa con ese
 * mínimo común en vez de duplicar el adaptador.
 */
type Ejecutor = Pick<Tx | Db, "select" | "insert" | "update">;

export function repositorioContactos(ejecutor: Ejecutor): RepositorioContactos {
  return {
    async candidatosDuplicados({ phone, email }): Promise<CandidatoDuplicado[]> {
      // Toda la cartera, sin `visibleRows` (decisión #19).
      return ejecutor
        .select({
          id: contacts.id,
          fullName: contacts.fullName,
          phone: contacts.phone,
          phoneDisplay: contacts.phoneDisplay,
          email: contacts.email,
        })
        .from(contacts)
        .where(
          and(
            isNull(contacts.deletedAt),
            or(phone ? eq(contacts.phone, phone) : undefined, email ? eq(contacts.email, email) : undefined),
          ),
        );
    },

    async buscarVisible(actor, alcance, id): Promise<Contacto | undefined> {
      const [fila] = await ejecutor
        .select()
        .from(contacts)
        .where(and(eq(contacts.id, id), visibleRows(actor, alcance, contacts.brokerId, contacts.deletedAt)))
        .limit(1);
      return fila;
    },

    async crear(datos): Promise<Contacto> {
      const [fila] = await ejecutor
        .insert(contacts)
        .values({
          fullName: datos.fullName,
          phone: datos.phone,
          phoneDisplay: datos.phoneDisplay,
          email: datos.email,
          sourceId: datos.sourceId,
          notes: datos.notes,
          brokerId: datos.brokerId,
          createdBy: datos.createdBy,
          updatedBy: datos.updatedBy,
        })
        .returning();
      // `.returning()` de un `insert` con un único `values()` siempre trae una
      // fila; el tipo de Drizzle la marca opcional porque la firma es genérica
      // para lotes de varias filas.
      return fila!;
    },

    async actualizar(id, cambios): Promise<Contacto> {
      // Asignación campo por campo, nunca `...cambios` (AGENTS.md).
      const set: Partial<typeof contacts.$inferInsert> = { updatedBy: cambios.updatedBy };
      if (cambios.fullName !== undefined) set.fullName = cambios.fullName;
      if (cambios.phone !== undefined) set.phone = cambios.phone;
      if (cambios.phoneDisplay !== undefined) set.phoneDisplay = cambios.phoneDisplay;
      if (cambios.email !== undefined) set.email = cambios.email;
      if (cambios.sourceId !== undefined) set.sourceId = cambios.sourceId;
      if (cambios.notes !== undefined) set.notes = cambios.notes;
      if (cambios.brokerId !== undefined) set.brokerId = cambios.brokerId;

      const [fila] = await ejecutor.update(contacts).set(set).where(eq(contacts.id, id)).returning();
      // Un `update … where id` sobre una fila que el caso de uso ya leyó dentro
      // de la misma transacción siempre devuelve una.
      return fila!;
    },

    async marcarBorrado(id, cuando, actorId): Promise<Contacto> {
      const [fila] = await ejecutor
        .update(contacts)
        .set({ deletedAt: cuando, updatedBy: actorId })
        .where(eq(contacts.id, id))
        .returning();
      return fila!;
    },
  };
}

export function lecturaContactos(db: Db): LecturaContactos {
  return {
    async listado(actor, alcance, { q, sourceId, pagina, contactoId, incluirBrokers, tamanioPagina }) {
      const condiciones = and(
        visibleRows(actor, alcance, contacts.brokerId, contacts.deletedAt),
        q
          ? or(
              ilike(contacts.fullName, `%${q}%`),
              ilike(contacts.phone, `%${q}%`),
              ilike(contacts.phoneDisplay, `%${q}%`),
              ilike(contacts.email, `%${q}%`),
            )
          : undefined,
        sourceId ? eq(contacts.sourceId, sourceId) : undefined,
      );

      const columnas = {
        id: contacts.id,
        fullName: contacts.fullName,
        phone: contacts.phone,
        phoneDisplay: contacts.phoneDisplay,
        email: contacts.email,
        sourceId: contacts.sourceId,
        sourceName: leadSources.name,
        brokerId: contacts.brokerId,
        brokerName: users.fullName,
        notes: contacts.notes,
        lastInteractionAt: contacts.lastInteractionAt,
      };

      const [filas, totales, canales]: [FilaListadoContacto[], { total: number }[], Canal[]] = await Promise.all([
        db
          .select(columnas)
          .from(contacts)
          .leftJoin(leadSources, eq(leadSources.id, contacts.sourceId))
          .leftJoin(users, eq(users.id, contacts.brokerId))
          .where(condiciones)
          .orderBy(contacts.fullName)
          .limit(tamanioPagina)
          .offset((pagina - 1) * tamanioPagina),
        db.select({ total: count() }).from(contacts).where(condiciones),
        db
          .select({ id: leadSources.id, name: leadSources.name })
          .from(leadSources)
          .where(eq(leadSources.isActive, true))
          .orderBy(leadSources.position),
      ]);

      // La ficha lateral respeta el mismo alcance que el listado: un id fuera del
      // `visibleRows` del actor no debe filtrarse por la URL.
      const contactoSeleccionado = contactoId
        ? (
            await db
              .select(columnas)
              .from(contacts)
              .leftJoin(leadSources, eq(leadSources.id, contacts.sourceId))
              .leftJoin(users, eq(users.id, contacts.brokerId))
              .where(and(eq(contacts.id, contactoId), condiciones))
              .limit(1)
          )[0]
        : undefined;

      // Solo se trae la lista de brokers si la página va a mostrar el selector de
      // reasignar (alcance `all`): evita la consulta en cada visita de un broker
      // con `own`, que nunca lo vería.
      const brokers: BrokerAsignable[] = incluirBrokers
        ? await db
            .select({ id: users.id, fullName: users.fullName })
            .from(users)
            .innerJoin(roles, eq(roles.id, users.roleId))
            .where(and(eq(roles.slug, "broker"), eq(users.isActive, true), isNull(users.deletedAt)))
            .orderBy(users.fullName)
        : [];

      return {
        contactos: filas,
        total: totales[0]?.total ?? 0,
        canales,
        contactoSeleccionado: contactoSeleccionado ?? null,
        brokers,
      };
    },
  };
}

export function reposContactos(tx: Tx): ReposContactos {
  return { contactos: repositorioContactos(tx), auditoria: auditoriaDrizzle(tx) };
}
