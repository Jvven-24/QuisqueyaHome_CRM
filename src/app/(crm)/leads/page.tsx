/**
 * M2 · Leads — lectura (`docs/F1_ANALISIS_Y_PLAN.md` paso 4).
 *
 * Mismo patrón que `contactos/page.tsx` (M1, que cierra §20.2): componente de
 * servidor, actor resuelto una vez, `visibleRows` sobre `leads.brokerId` — un
 * broker con alcance `own` ve los suyos, alguien con `all` ve toda la bandeja.
 * Búsqueda, origen, estado y página viven en `searchParams`; la ficha lateral
 * en `?lead=<id>`, igual que `?contacto=<id>` en Contactos, para que el
 * historial de auditoría (T6) se resuelva aquí como componente de servidor.
 */

import { and, asc, count, eq, ilike, or } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { LEAD_STATUSES } from "@/domain/catalogs";
import { requireActor } from "@/infrastructure/auth/actor";
import { getDb } from "@/infrastructure/db/client";
import { contacts, leadSources, leads, projects, users } from "@/infrastructure/db/schema";
import { requireScopeInPage } from "@/infrastructure/page-guard";
import { visibleRows } from "@/infrastructure/rbac-filter";
import { Historial } from "../_ui/historial";
import { LeadsVista } from "./vista";

export const metadata = { title: "Leads · CRM Quisqueya Home" };

const TAMANIO_PAGINA = 20;

function primero(valor: string | string[] | undefined): string | undefined {
  return Array.isArray(valor) ? valor[0] : valor;
}

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const actor = await requireActor();
  const scope = requireScopeInPage(actor, "leads", "view");

  const params = await searchParams;
  const q = primero(params.q)?.trim() || "";
  const sourceIdParam = Number(primero(params.source_id));
  const sourceId = Number.isFinite(sourceIdParam) && sourceIdParam > 0 ? sourceIdParam : undefined;
  const statusParam = primero(params.status);
  const status = (LEAD_STATUSES as readonly string[]).includes(statusParam ?? "")
    ? (statusParam as (typeof LEAD_STATUSES)[number])
    : undefined;
  const paginaParam = Number(primero(params.page));
  const pagina = Number.isFinite(paginaParam) && paginaParam > 0 ? Math.trunc(paginaParam) : 1;
  const leadIdParam = Number(primero(params.lead));
  const leadId = Number.isFinite(leadIdParam) && leadIdParam > 0 ? leadIdParam : undefined;

  const db = getDb();
  // Dos columnas de `leads` referencian `users` (responsable y sugerido):
  // Drizzle exige un alias por cada `join` extra a la misma tabla, o la
  // segunda pisa a la primera en el resultado.
  const brokerSugerido = alias(users, "broker_sugerido");

  const condiciones = and(
    visibleRows(actor, scope, leads.brokerId, leads.deletedAt),
    q
      ? or(
          ilike(contacts.fullName, `%${q}%`),
          ilike(contacts.phone, `%${q}%`),
          ilike(contacts.phoneDisplay, `%${q}%`),
          ilike(contacts.email, `%${q}%`),
        )
      : undefined,
    sourceId ? eq(leads.sourceId, sourceId) : undefined,
    status ? eq(leads.status, status) : undefined,
  );

  const columnas = {
    id: leads.id,
    contactId: leads.contactId,
    contactName: contacts.fullName,
    contactPhone: contacts.phone,
    contactPhoneDisplay: contacts.phoneDisplay,
    contactEmail: contacts.email,
    sourceId: leads.sourceId,
    sourceName: leadSources.name,
    projectId: leads.projectId,
    projectName: projects.name,
    projectInterestText: leads.projectInterestText,
    zoneInterest: leads.zoneInterest,
    operationType: leads.operationType,
    currency: leads.currency,
    budgetMinCents: leads.budgetMinCents,
    budgetMaxCents: leads.budgetMaxCents,
    status: leads.status,
    brokerId: leads.brokerId,
    brokerName: users.fullName,
    suggestedBrokerId: leads.suggestedBrokerId,
    suggestedBrokerName: brokerSugerido.fullName,
    campaign: leads.campaign,
    receivedAt: leads.receivedAt,
    discardReason: leads.discardReason,
    convertedDealId: leads.convertedDealId,
  };

  const [filas, totales, canales] = await Promise.all([
    db
      .select(columnas)
      .from(leads)
      .innerJoin(contacts, eq(contacts.id, leads.contactId))
      .leftJoin(leadSources, eq(leadSources.id, leads.sourceId))
      .leftJoin(projects, eq(projects.id, leads.projectId))
      .leftJoin(users, eq(users.id, leads.brokerId))
      .leftJoin(brokerSugerido, eq(brokerSugerido.id, leads.suggestedBrokerId))
      .where(condiciones)
      .orderBy(asc(leads.status), asc(leads.receivedAt))
      .limit(TAMANIO_PAGINA)
      .offset((pagina - 1) * TAMANIO_PAGINA),
    db
      .select({ total: count() })
      .from(leads)
      .innerJoin(contacts, eq(contacts.id, leads.contactId))
      .where(condiciones),
    db
      .select({ id: leadSources.id, name: leadSources.name })
      .from(leadSources)
      .where(eq(leadSources.isActive, true))
      .orderBy(leadSources.position),
  ]);

  // La ficha lateral respeta el mismo alcance que el listado, igual que en
  // Contactos: un id fuera del `visibleRows` del actor no se filtra por la URL.
  const leadSeleccionado = leadId
    ? (
        await db
          .select(columnas)
          .from(leads)
          .innerJoin(contacts, eq(contacts.id, leads.contactId))
          .leftJoin(leadSources, eq(leadSources.id, leads.sourceId))
          .leftJoin(projects, eq(projects.id, leads.projectId))
          .leftJoin(users, eq(users.id, leads.brokerId))
          .leftJoin(brokerSugerido, eq(brokerSugerido.id, leads.suggestedBrokerId))
          .where(and(eq(leads.id, leadId), condiciones))
          .limit(1)
      )[0]
    : undefined;

  return (
    <LeadsVista
      leads={filas}
      canales={canales}
      total={totales[0]?.total ?? 0}
      tamanioPagina={TAMANIO_PAGINA}
      pagina={pagina}
      filtros={{ q, sourceId, status }}
      leadSeleccionado={leadSeleccionado ?? null}
      historial={leadSeleccionado ? <Historial entidad="lead" entidadId={leadSeleccionado.id} /> : null}
      roleSlug={actor.roleSlug}
    />
  );
}
