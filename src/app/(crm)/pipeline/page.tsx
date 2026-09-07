/**
 * M3b · Pipeline — lectura (`docs/F1_ANALISIS_Y_PLAN.md` paso 6).
 *
 * Mismo patrón que `contactos/page.tsx` y `leads/page.tsx`: componente de
 * servidor, actor resuelto una vez, `visibleRows` sobre `deals.brokerId`. Sin
 * paginación a propósito (encargo, punto 1): un Kanban se ve entero, no por
 * páginas — si el volumen algún día lo exige, es un problema para cuando
 * aparezca, no ahora.
 *
 * Se pasan también las `pipelineStages` activas (con la de `kind: "lost"`
 * incluida — es la columna que hoy falta, `docs/contexto/errores-conocidos.md`
 * §2) y los `lossReasons` activos, para que `vista.tsx` arme las columnas y el
 * modal de pérdida sin volver a consultar nada.
 */

import { and, asc, eq } from "drizzle-orm";
import { requireActor } from "@/infrastructure/auth/actor";
import { getDb } from "@/infrastructure/db/client";
import {
  activities,
  contacts,
  dealProperties,
  deals,
  leadSources,
  lossReasons,
  pipelineStages,
  projects,
  units,
  users,
} from "@/infrastructure/db/schema";
import { requireScopeInPage } from "@/infrastructure/page-guard";
import { visibleRows } from "@/infrastructure/rbac-filter";
import { Historial } from "../_ui/historial";
import { PipelineVista } from "./vista";

export const metadata = { title: "Pipeline · CRM Quisqueya Home" };

function primero(valor: string | string[] | undefined): string | undefined {
  return Array.isArray(valor) ? valor[0] : valor;
}

export default async function PipelinePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const actor = await requireActor();
  const scope = requireScopeInPage(actor, "deals", "view");

  const params = await searchParams;
  const dealIdParam = Number(primero(params.deal));
  const dealId = Number.isFinite(dealIdParam) && dealIdParam > 0 ? dealIdParam : undefined;

  const db = getDb();
  const condiciones = visibleRows(actor, scope, deals.brokerId, deals.deletedAt);

  const columnas = {
    id: deals.id,
    contactId: deals.contactId,
    contactName: contacts.fullName,
    contactPhone: contacts.phone,
    contactPhoneDisplay: contacts.phoneDisplay,
    sourceName: leadSources.name,
    brokerId: deals.brokerId,
    brokerName: users.fullName,
    stageId: deals.stageId,
    operationType: deals.operationType,
    currency: deals.currency,
    amountCents: deals.amountCents,
    probability: deals.probability,
    commissionBasisPoints: deals.commissionBasisPoints,
    expectedCloseDate: deals.expectedCloseDate,
    nextActivityTitle: activities.title,
    nextActivityStartsAt: activities.startsAt,
    stageChangedAt: deals.stageChangedAt,
    closedAt: deals.closedAt,
    lossReasonId: deals.lossReasonId,
    lossComment: deals.lossComment,
    notes: deals.notes,
  };

  const [filas, etapas, motivos] = await Promise.all([
    db
      .select(columnas)
      .from(deals)
      .innerJoin(contacts, eq(contacts.id, deals.contactId))
      .leftJoin(leadSources, eq(leadSources.id, deals.sourceId))
      .leftJoin(users, eq(users.id, deals.brokerId))
      // `deals.next_activity_id` no tiene FK (decisión #8), pero sigue siendo
      // un id de `activities`: el `leftJoin` funciona igual, solo Drizzle no
      // lo infiere solo y hay que decirle contra qué columna.
      .leftJoin(activities, eq(activities.id, deals.nextActivityId))
      .where(condiciones)
      .orderBy(asc(deals.stageId), asc(deals.stageChangedAt)),
    db
      .select({ id: pipelineStages.id, slug: pipelineStages.slug, name: pipelineStages.name, position: pipelineStages.position, kind: pipelineStages.kind })
      .from(pipelineStages)
      .where(eq(pipelineStages.isActive, true))
      .orderBy(asc(pipelineStages.position)),
    db
      .select({ id: lossReasons.id, name: lossReasons.name })
      .from(lossReasons)
      .where(eq(lossReasons.isActive, true))
      .orderBy(asc(lossReasons.position)),
  ]);

  // Proyecto/unidad principal de cada negocio (`deal_properties.is_primary`),
  // para la tarjeta y el inspector. Consulta aparte para no repetir el join
  // completo de `deals` sobre una tabla N:M.
  const primarias = await db
    .select({
      dealId: dealProperties.dealId,
      projectName: projects.name,
      unitCode: units.code,
      unitId: dealProperties.unitId,
    })
    .from(dealProperties)
    .innerJoin(projects, eq(projects.id, dealProperties.projectId))
    .leftJoin(units, eq(units.id, dealProperties.unitId))
    .where(eq(dealProperties.isPrimary, true));
  const primariaPorDeal = new Map(primarias.map((fila) => [fila.dealId, fila]));

  const negocios = filas.map((fila) => ({
    ...fila,
    proyectoPrincipal: primariaPorDeal.get(fila.id) ?? null,
  }));

  // Igual que en Contactos y Leads: la ficha lateral respeta el mismo alcance
  // que el listado — un id fuera de `filas` (ya filtradas por `visibleRows`)
  // simplemente no aparece.
  const negocioSeleccionado = dealId ? (negocios.find((n) => n.id === dealId) ?? null) : null;

  const propiedadesSeleccionado = negocioSeleccionado
    ? await db
        .select({
          id: dealProperties.id,
          projectId: dealProperties.projectId,
          projectName: projects.name,
          unitId: dealProperties.unitId,
          unitCode: units.code,
          isPrimary: dealProperties.isPrimary,
        })
        .from(dealProperties)
        .innerJoin(projects, eq(projects.id, dealProperties.projectId))
        .leftJoin(units, eq(units.id, dealProperties.unitId))
        .where(and(eq(dealProperties.dealId, negocioSeleccionado.id)))
    : [];

  return (
    <PipelineVista
      negocios={negocios}
      etapas={etapas}
      motivos={motivos}
      negocioSeleccionado={negocioSeleccionado}
      propiedades={propiedadesSeleccionado}
      historial={negocioSeleccionado ? <Historial entidad="deal" entidadId={negocioSeleccionado.id} /> : null}
    />
  );
}
