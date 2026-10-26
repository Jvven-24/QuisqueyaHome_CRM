import { notFound } from "next/navigation";
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

import { and, asc, count, eq, ilike, isNull, or } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { scopeFor } from "@/domain/rbac";
import { LEAD_STATUSES } from "@/domain/catalogs";
import { requireActor } from "@/infrastructure/auth/actor";
import { getDb } from "@/infrastructure/db/client";
import { contacts, leadSources, leads, projects, users } from "@/infrastructure/db/schema";
import { requireScopeInPage } from "@/infrastructure/page-guard";
import { visibleRows } from "@/infrastructure/rbac-filter";
import { candidatosBroker } from "@/app/api/leads/_broker-candidatos";
import { Historial } from "../_ui/historial";
import { LeadsVista } from "./vista";
import { AsignacionVista } from "./asignacion/vista";

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

  if (params.lead !== undefined && (!Number.isSafeInteger(leadId) || !leadId || leadId > 2147483647)) notFound();

  const db = getDb();
  // Dos columnas de `leads` referencian `users` (responsable y sugerido):
  // Drizzle exige un alias por cada `join` extra a la misma tabla, o la
  // segunda pisa a la primera en el resultado.
  const brokerSugerido = alias(users, "broker_sugerido");

  const puedeTomarCola = actor.roleSlug === "broker" && scopeFor(actor,"leads","edit") !== "none";
  const disponibilidad = puedeTomarCola ? and(isNull(leads.brokerId), or(eq(leads.status,"new"),eq(leads.status,"assigned")), visibleRows(actor,"all",leads.brokerId,leads.deletedAt)) : undefined;
  const filasVisibles = or(visibleRows(actor, scope, leads.brokerId, leads.deletedAt), disponibilidad);

  const condiciones = and(
    primero(params.cola) === "1" ? filasVisibles : visibleRows(actor, scope, leads.brokerId, leads.deletedAt),
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
    primero(params.cola) === "1" ? or(eq(leads.status,"new"),eq(leads.status,"assigned")) : undefined,
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
    firstContactedAt: leads.firstContactedAt,
    discardReason: leads.discardReason,
    convertedDealId: leads.convertedDealId,
  };

  const [filas, totales, canales, brokers, conteosEstado, proyectos] = await Promise.all([
    db
      .select(columnas)
      .from(leads)
      .innerJoin(contacts, eq(contacts.id, leads.contactId))
      .leftJoin(leadSources, eq(leadSources.id, leads.sourceId))
      .leftJoin(projects, eq(projects.id, leads.projectId))
      .leftJoin(users, eq(users.id, leads.brokerId))
      .leftJoin(brokerSugerido, eq(brokerSugerido.id, leads.suggestedBrokerId))
      .where(condiciones)
      .orderBy(...(primero(params.cola) === "1" ? [asc(leads.receivedAt)] : [asc(leads.status), asc(leads.receivedAt)]))
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
    // Candidatos válidos para el botón Asignar del inspector (issue #22):
    // misma lista que arma la sugerencia, con el nombre para el selector.
    candidatosBroker(db),
    // Distribución por estado sobre el universo visible para KPIs
    db
      .select({ status: leads.status, total: count() })
      .from(leads)
      .innerJoin(contacts, eq(contacts.id, leads.contactId))
      .where(visibleRows(actor, scope, leads.brokerId, leads.deletedAt))
      .groupBy(leads.status),
    db.select({ id: projects.id, name: projects.name, zone: projects.zone }).from(projects)
      .where(visibleRows(actor, scopeFor(actor, "projects", "view"), projects.brokerId, projects.deletedAt))
      .orderBy(projects.name),
  ]);

  const metricasLeads = {
    total: 0,
    new: 0,
    assigned: 0,
    contacted: 0,
    converted: 0,
    discarded: 0,
  };
  for (const item of conteosEstado) {
    if (item.status && item.status in metricasLeads) {
      metricasLeads[item.status as keyof typeof metricasLeads] = Number(item.total);
    }
    metricasLeads.total += Number(item.total);
  }

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
          .where(and(eq(leads.id, leadId), or(visibleRows(actor, scope, leads.brokerId, leads.deletedAt), disponibilidad)))
          .limit(1)
      )[0]
    : undefined;

  if (params.lead !== undefined && !leadSeleccionado) notFound();

  if (primero(params.vista) === "asignacion") return <AsignacionVista key={[pagina,q].join(":")} leads={filas} brokers={brokers} total={totales[0]?.total ?? 0} page={pagina} q={q} canAssign={actor.roleSlug === "admin" && scopeFor(actor,"leads","edit") === "all"} />;

  return (
    <LeadsVista
      soloFicha={primero(params.ficha) === "1"}
      leads={filas}
      canales={canales}
      proyectos={proyectos}
      brokers={brokers}
      total={totales[0]?.total ?? 0}
      metricas={metricasLeads}
      tamanioPagina={TAMANIO_PAGINA}
      pagina={pagina}
      filtros={{ q, sourceId, status }}
      leadSeleccionado={leadSeleccionado ?? null}
      historial={leadSeleccionado ? <Historial entidad="lead" entidadId={leadSeleccionado.id} /> : null}
      ahora={Date.now()}
      cola={primero(params.cola) === "1"}
      roleSlug={actor.roleSlug}
      actorId={actor.userId}
    />
  );
}
