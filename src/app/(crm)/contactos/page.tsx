/**
 * M1 · Contactos — lectura (`docs/F1_ANALISIS_Y_PLAN.md` paso 3).
 *
 * Componente de servidor: actor resuelto una vez, permiso comprobado antes de
 * pintar nada, y el listado filtrado por `visibleRows` (§18.1) — nunca con un
 * `WHERE broker_id = ?` propio. Búsqueda, filtro de canal y paginación viven en
 * `searchParams`, no en estado de cliente: la URL es compartible y el filtro se
 * aplica en SQL, que es donde el permiso ya vive (`docs/contexto/decisiones.md`
 * #2). Paginación con `LIMIT`/`OFFSET`, tamaño fijo — nada de cursores.
 *
 * También resuelve, por `searchParams.contacto`, la ficha lateral: el
 * historial de auditoría (T6, `Historial`) es un componente de servidor, así
 * que la selección se lleva en la URL en vez de en estado de cliente — así
 * este archivo lo monta directamente, sin que `vista.tsx` tenga que volver a
 * pedirlo por su cuenta ni reimplementar lo que `Historial` ya hace.
 */

import { and, count, eq, ilike, or } from "drizzle-orm";
import { requireActor } from "@/infrastructure/auth/actor";
import { getDb } from "@/infrastructure/db/client";
import { contacts, leadSources, users } from "@/infrastructure/db/schema";
import { requireScopeInPage } from "@/infrastructure/page-guard";
import { visibleRows } from "@/infrastructure/rbac-filter";
import { Historial } from "../_ui/historial";
import { ContactosVista } from "./vista";

export const metadata = { title: "Contactos · CRM Quisqueya Home" };

const TAMANIO_PAGINA = 20;

/** `searchParams` puede traer el mismo parámetro repetido; solo interesa el primero. */
function primero(valor: string | string[] | undefined): string | undefined {
  return Array.isArray(valor) ? valor[0] : valor;
}

export default async function ContactosPage({
  searchParams,
}: {
  // Next 15: `searchParams` es una Promise (paso 3, instrucción del encargo).
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const actor = await requireActor();
  const scope = requireScopeInPage(actor, "contacts", "view");

  const params = await searchParams;
  const q = primero(params.q)?.trim() || "";
  const sourceIdParam = Number(primero(params.source_id));
  const sourceId = Number.isFinite(sourceIdParam) && sourceIdParam > 0 ? sourceIdParam : undefined;
  const paginaParam = Number(primero(params.page));
  const pagina = Number.isFinite(paginaParam) && paginaParam > 0 ? Math.trunc(paginaParam) : 1;
  const contactoIdParam = Number(primero(params.contacto));
  const contactoId = Number.isFinite(contactoIdParam) && contactoIdParam > 0 ? contactoIdParam : undefined;

  const db = getDb();

  const condiciones = and(
    visibleRows(actor, scope, contacts.brokerId, contacts.deletedAt),
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

  const [filas, totales, canales] = await Promise.all([
    db
      .select(columnas)
      .from(contacts)
      .leftJoin(leadSources, eq(leadSources.id, contacts.sourceId))
      .leftJoin(users, eq(users.id, contacts.brokerId))
      .where(condiciones)
      .orderBy(contacts.fullName)
      .limit(TAMANIO_PAGINA)
      .offset((pagina - 1) * TAMANIO_PAGINA),
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

  return (
    <ContactosVista
      contactos={filas}
      canales={canales}
      total={totales[0]?.total ?? 0}
      tamanioPagina={TAMANIO_PAGINA}
      pagina={pagina}
      filtros={{ q, sourceId }}
      contactoSeleccionado={contactoSeleccionado ?? null}
      historial={
        contactoSeleccionado ? <Historial entidad="contact" entidadId={contactoSeleccionado.id} /> : null
      }
    />
  );
}
