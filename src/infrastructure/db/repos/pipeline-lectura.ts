import { and, asc, desc, eq, exists, gt, gte, inArray, isNull, lt, lte, notExists, or, sql } from "drizzle-orm";
import type { Actor, PermissionScope } from "../../../domain/rbac.ts";
import { scopeFor } from "../../../domain/rbac.ts";
import { camposNegocios, ZONA_NEGOCIOS } from "../../../application/pipeline/consultas.ts";
import type { CursorNegocios, FiltrosNegocios, LecturaPipeline, OrdenNegocios, ProyectoDisponibleNegocio } from "../../../application/pipeline/puertos.ts";
import type { Db } from "../client.ts";
import type { Tx } from "./compartido.ts";
import { activities, commissions, contacts, dealProperties, deals, leadSources, lossReasons, pipelineStages, projects, unitSales, units, users } from "../schema.ts";
import { visibleRows } from "../../rbac-filter.ts";

// Sitio único de mutación en el loader de test:db; producto siempre usa EXISTS.
const PROJECT_FILTER_MODE: string = "exists";
export function lecturaPipeline(db: Db | Tx): LecturaPipeline {
  function condiciones(actor: Actor, scope: PermissionScope, f: FiltrosNegocios) {
    const interes = db.select({ id: dealProperties.id }).from(dealProperties)
      .where(and(eq(dealProperties.dealId, deals.id), eq(dealProperties.projectId, f.projectId ?? 0), isNull(dealProperties.deletedAt)));
    const fecha = f.campoFecha === "expectedCloseDate" ? sql`${deals.expectedCloseDate}`
      : sql`(${f.campoFecha === "closedAt" ? deals.closedAt : deals.createdAt} at time zone ${ZONA_NEGOCIOS})::date`;
    return and(visibleRows(actor, scope, deals.brokerId, deals.deletedAt),
      f.historicasSinUnidad ? and(eq(pipelineStages.kind, "won"), eq(deals.operationType, "sale"),
        notExists(db.select({ id: unitSales.id }).from(unitSales).where(eq(unitSales.dealId, deals.id)))) : undefined,
      f.projectId === undefined ? undefined : PROJECT_FILTER_MODE === "join" ? eq(dealProperties.projectId, f.projectId) : exists(interes),
      f.brokerId === undefined ? undefined : eq(deals.brokerId, f.brokerId),
      f.stageId === undefined ? undefined : eq(deals.stageId, f.stageId),
      f.resultado === undefined ? undefined : eq(pipelineStages.kind, f.resultado),
      f.moneda === undefined ? undefined : eq(deals.currency, f.moneda),
      f.montoMin === undefined ? undefined : gte(deals.amountCents, f.montoMin),
      f.montoMax === undefined ? undefined : lte(deals.amountCents, f.montoMax),
      f.desde === undefined ? undefined : sql`${fecha} >= ${f.desde}::date`,
      f.hasta === undefined ? undefined : sql`${fecha} <= ${f.hasta}::date`);
  }
  function columnas(actor: Actor) {
    const campos = camposNegocios(actor);
    return {
      id: deals.id, contactId: deals.contactId, contactName: contacts.fullName,
      contactPhone: contacts.phone, contactPhoneDisplay: contacts.phoneDisplay,
      sourceName: leadSources.name, brokerId: deals.brokerId, brokerName: users.fullName,
      stageId: deals.stageId, stageKind: pipelineStages.kind, operationType: deals.operationType,
      currency: deals.currency, ...(campos.monto ? { amountCents: deals.amountCents } : {}),
      probability: deals.probability,
      ...(campos.comision ? { commissionBasisPoints: deals.commissionBasisPoints,
        totalCommissionCents: sql<number | null>`(select ${commissions.totalCommissionCents} from ${commissions}
          where ${commissions.dealId} = ${deals.id} and ${visibleRows(actor, scopeFor(actor, "commissions", "view"), commissions.brokerId) ?? sql`true`} limit 1)`.mapWith(Number) } : {}),
      expectedCloseDate: deals.expectedCloseDate, nextActivityTitle: activities.title,
      nextActivityStartsAt: activities.startsAt, stageChangedAt: deals.stageChangedAt,
      closedAt: deals.closedAt, lossReasonId: deals.lossReasonId, lossComment: deals.lossComment,
      notes: deals.notes, createdAt: deals.createdAt,
    };
  }
  function filas(actor: Actor, f: FiltrosNegocios) {
    const query = db.select(columnas(actor)).from(deals)
      .innerJoin(contacts, eq(contacts.id, deals.contactId))
      .innerJoin(pipelineStages, eq(pipelineStages.id, deals.stageId))
      .leftJoin(leadSources, eq(leadSources.id, deals.sourceId))
      .leftJoin(users, eq(users.id, deals.brokerId))
      .leftJoin(activities, and(eq(activities.id, deals.nextActivityId), eq(activities.dealId, deals.id),
        eq(activities.status, "pending"), isNull(activities.deletedAt),
        sql`${activities.assigneeId} is not null`, sql`${activities.startsAt} is not null`,
        visibleRows(actor, scopeFor(actor, "activities", "view"), activities.assigneeId, activities.deletedAt)))
      .$dynamic();
    return f.projectId !== undefined && PROJECT_FILTER_MODE === "join"
      ? query.innerJoin(dealProperties, eq(dealProperties.dealId, deals.id)) : query;
  }
  function valorOrden(orden: OrdenNegocios) {
    return orden.campo === "id" ? sql`${deals.id}` : orden.campo === "createdAt" ? sql`date_trunc('milliseconds', ${deals.createdAt})` : sql<number>`coalesce(${deals.amountCents}, -1)`;
  }
  function despues(cursor: CursorNegocios | null, orden: OrdenNegocios) {
    if (!cursor) return undefined;
    const valor = orden.campo === "createdAt" ? sql`${cursor.valor}::timestamptz` : cursor.valor;
    const comparar = orden.direccion === "asc" ? gt : lt;
    return or(comparar(valorOrden(orden), valor), and(eq(valorOrden(orden), valor), comparar(deals.id, cursor.id)));
  }
  async function intereses(actor: Actor, scope: PermissionScope, ids: number[]) {
    if (!ids.length) return [];
    return db.select({ dealId: dealProperties.dealId, id: dealProperties.id, projectId: dealProperties.projectId,
      projectName: projects.name, unitId: dealProperties.unitId, unitCode: units.code, isPrimary: dealProperties.isPrimary,
      ...(camposNegocios(actor).precio ? { realPriceCents: sql<number | null>`case when
        ${visibleRows(actor, scopeFor(actor, "unit_real_price", "view"), units.brokerId, units.deletedAt)}
        then ${units.realPriceCents} else null end`.mapWith(Number) } : {}),
    }).from(dealProperties).innerJoin(deals, eq(deals.id, dealProperties.dealId))
      .innerJoin(projects, and(eq(projects.id, dealProperties.projectId),
        visibleRows(actor, scopeFor(actor, "projects", "view"), projects.brokerId, projects.deletedAt)))
      .leftJoin(units, and(eq(units.id, dealProperties.unitId), eq(units.projectId, projects.id), isNull(units.deletedAt)))
      .where(and(isNull(dealProperties.deletedAt), inArray(deals.id, ids), visibleRows(actor, scope, deals.brokerId, deals.deletedAt)))
      .orderBy(asc(dealProperties.id));
  }
  async function enriquecer(actor: Actor, scope: PermissionScope, rows: Awaited<ReturnType<ReturnType<typeof filas>["execute"]>>) {
    const props = await intereses(actor, scope, rows.map(n => n.id));
    return rows.map(n => {
      const p = props.find(p => p.dealId === n.id && p.isPrimary);
      return { ...n, proyectoPrincipal: p ? { dealId: n.id, projectName: p.projectName, unitId: p.unitId, unitCode: p.unitCode } : null };
    });
  }
  async function proyectosDisponibles(actor: Actor) {
    const scope = scopeFor(actor, "projects", "view");
    if (scope === "none") return [];
    const rows = await db.select({ id: projects.id, name: projects.name, unitId: units.id, unitCode: units.code })
      .from(projects).leftJoin(units, and(eq(units.projectId, projects.id), isNull(units.deletedAt)))
      .where(and(visibleRows(actor, scope, projects.brokerId, projects.deletedAt), eq(projects.isActive, true)))
      .orderBy(asc(projects.name), asc(units.code), asc(units.id));
    const result = new Map<number, ProyectoDisponibleNegocio>();
    for (const row of rows) {
      const p = result.get(row.id) ?? { id: row.id, name: row.name, unidades: [] };
      if (row.unitId !== null) p.unidades.push({ id: row.unitId, code: row.unitCode! });
      result.set(row.id, p);
    }
    return [...result.values()];
  }
  return {
    async listar(actor, scope, f, orden, cursor, limite) {
      const ordenar = orden.direccion === "asc" ? asc : desc;
      const rows = await filas(actor, f).where(and(condiciones(actor, scope, f), despues(cursor, orden)))
        .orderBy(ordenar(valorOrden(orden)), ordenar(deals.id)).limit(limite);
      return enriquecer(actor, scope, rows);
    },
    async resumir(actor, scope, f) {
      const query = db.select({ stageId: deals.stageId, kind: pipelineStages.kind, currency: deals.currency,
        count: sql<number>`count(*)::int`,
        ...(camposNegocios(actor).monto ? { amountCents: sql<number>`coalesce(sum(${deals.amountCents}), 0)`.mapWith(Number) } : {}),
      }).from(deals).innerJoin(contacts, eq(contacts.id, deals.contactId))
        .innerJoin(pipelineStages, eq(pipelineStages.id, deals.stageId)).$dynamic();
      const filtered = f.projectId !== undefined && PROJECT_FILTER_MODE === "join"
        ? query.innerJoin(dealProperties, eq(dealProperties.dealId, deals.id)) : query;
      return filtered.where(condiciones(actor, scope, f)).groupBy(deals.stageId, pipelineStages.kind, deals.currency)
        .orderBy(asc(deals.stageId), asc(deals.currency));
    },
    async ficha(actor, scope, id) {
      const rows = await filas(actor, {}).where(and(condiciones(actor, scope, {}), eq(deals.id, id))).limit(1);
      if (!rows.length) return undefined;
      const [negocio] = await enriquecer(actor, scope, rows);
      const [propiedades, disponibles] = await Promise.all([intereses(actor, scope, [id]), proyectosDisponibles(actor)]);
      return { negocio: negocio!, propiedades, proyectosDisponibles: disponibles };
    },
    async catalogos(actor, scope) {
      if (scope === "none") return { etapas: [], motivos: [], brokers: [], proyectos: [] };
      const [etapas, motivos, brokers, proyectos] = await Promise.all([
        db.select({ id: pipelineStages.id, slug: pipelineStages.slug, name: pipelineStages.name, position: pipelineStages.position,
          kind: pipelineStages.kind, defaultProbability: pipelineStages.defaultProbability }).from(pipelineStages)
          .where(eq(pipelineStages.isActive, true)).orderBy(asc(pipelineStages.position), asc(pipelineStages.id)),
        // Incluye motivos históricos usados en el alcance; las bajas no borran el significado de una pérdida.
        db.select({ id: lossReasons.id, name: lossReasons.name, isActive: lossReasons.isActive }).from(lossReasons)
          .where(or(eq(lossReasons.isActive, true), exists(db.select({ id: deals.id }).from(deals)
            .where(and(eq(deals.lossReasonId, lossReasons.id), visibleRows(actor, scope, deals.brokerId, deals.deletedAt))))))
          .orderBy(asc(lossReasons.position), asc(lossReasons.id)),
        db.selectDistinct({ id: users.id, name: users.fullName }).from(users).innerJoin(deals, eq(deals.brokerId, users.id))
          .where(visibleRows(actor, scope, deals.brokerId, deals.deletedAt)).orderBy(asc(users.fullName), asc(users.id)),
        db.selectDistinct({ id: projects.id, name: projects.name }).from(projects).innerJoin(dealProperties, eq(dealProperties.projectId, projects.id))
          .innerJoin(deals, eq(deals.id, dealProperties.dealId))
          .where(and(isNull(dealProperties.deletedAt), visibleRows(actor, scope, deals.brokerId, deals.deletedAt),
            visibleRows(actor, scopeFor(actor, "projects", "view"), projects.brokerId, projects.deletedAt))).orderBy(asc(projects.name), asc(projects.id)),
      ]);
      return { etapas, motivos, brokers, proyectos };
    },
  };
}
