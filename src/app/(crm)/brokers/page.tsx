/**
 * M7 · Brokers (`docs/F3_ANALISIS_Y_PLAN.md` §4.4, decisión #38, issue #33).
 *
 * Componente de servidor: actor resuelto una vez, permiso comprobado antes de
 * pintar nada. `/brokers` lee `broker_profiles` real — nivel, ventas del año
 * y meta mensual ya los escribe el cierre transaccional (hallazgo 8 de F3);
 * aquí solo se consultan, agregadas en tres `Promise.all` en vez de una
 * consulta por tarjeta (sin N+1). El JSX visual vive en `./vista.tsx` (cliente).
 */

import { and, count, eq, isNull } from "drizzle-orm";
import { cumplimientoPorcentaje, parsearPeriodo } from "@/domain/metas";
import { can, scopeFor } from "@/domain/rbac";
import { requireActor } from "@/infrastructure/auth/actor";
import { getDb } from "@/infrastructure/db/client";
import { brokerProfiles, deals, goals, pipelineStages, projects, roles, users } from "@/infrastructure/db/schema";
import { requireScopeInPage } from "@/infrastructure/page-guard";
import { visibleRows } from "@/infrastructure/rbac-filter";
import { BrokersVista } from "./vista";

export const metadata = { title: "Brokers · CRM Quisqueya Home" };

export default async function BrokersPage() {
  const actor = await requireActor();
  const scope = requireScopeInPage(actor, "brokers", "view");
  // Decisión #38: la asignación es de M7 sobre `projects`, no sobre `brokers`
  // — solo con alcance `all` en `projects:edit` (admin y asistente según el
  // seed) tiene sentido mostrar el control.
  const puedeAsignar = scopeFor(actor, "projects", "edit") === "all";
  const puedeInvitar = can(actor, "users", "create");

  const db = getDb();
  const periodo = parsearPeriodo(undefined, new Date());

  const [brokersBase, negociosPorBroker, metasDelMes, proyectosAsignables, listaRoles] = await Promise.all([
    db
      .select({
        userId: users.id,
        fullName: users.fullName,
        jobTitle: users.jobTitle,
        roleName: roles.name,
        specialty: brokerProfiles.specialty,
        level: brokerProfiles.level,
        annualSalesCents: brokerProfiles.annualSalesCents,
        monthlyTargetDeals: brokerProfiles.monthlyTargetDeals,
      })
      .from(brokerProfiles)
      .innerJoin(users, eq(users.id, brokerProfiles.userId))
      .innerJoin(roles, eq(roles.id, users.roleId))
      .where(and(eq(users.isActive, true), isNull(users.deletedAt), visibleRows(actor, scope, brokerProfiles.userId)))
      .orderBy(users.fullName),
    // Negocios activos = etapa `kind = 'open'`, agregado por broker en una
    // sola consulta (evita una consulta de conteo por tarjeta).
    db
      .select({ brokerId: deals.brokerId, cantidad: count() })
      .from(deals)
      .innerJoin(pipelineStages, eq(pipelineStages.id, deals.stageId))
      .where(and(isNull(deals.deletedAt), eq(pipelineStages.kind, "open")))
      .groupBy(deals.brokerId),
    db
      .select({ brokerId: goals.brokerId, targetDeals: goals.targetDeals, achievedDeals: goals.achievedDeals })
      .from(goals)
      .where(and(eq(goals.year, periodo.year), eq(goals.month, periodo.month))),
    // Solo se trae el catálogo de proyectos si el actor puede asignar — nadie
    // más ve "a quién está asignado" cada proyecto.
    puedeAsignar
      ? db
          .select({ id: projects.id, name: projects.name, brokerId: projects.brokerId, brokerName: users.fullName })
          .from(projects)
          .leftJoin(users, eq(users.id, projects.brokerId))
          .where(and(eq(projects.isActive, true), isNull(projects.deletedAt)))
          .orderBy(projects.name)
      : Promise.resolve([]),
    // Mismo listado de roles que `configuracion` (tab usuarios): "Invitar
    // broker" reutiliza el formulario de M13, no un endpoint nuevo.
    puedeInvitar
      ? db.select({ id: roles.id, name: roles.name, slug: roles.slug }).from(roles).where(eq(roles.isActive, true)).orderBy(roles.name)
      : Promise.resolve([]),
  ]);

  const negociosPorId = new Map(negociosPorBroker.map((fila) => [fila.brokerId, fila.cantidad]));
  const metaPorId = new Map(metasDelMes.filter((fila) => fila.brokerId != null).map((fila) => [fila.brokerId as number, fila]));

  const brokers = brokersBase.map((broker) => {
    // Hallazgo 5 de F3 (M8): sin fila de `goals` este mes, la meta es la del
    // perfil y lo logrado es 0 — nunca "sin meta" solo porque el cierre
    // todavía no creó la fila del mes.
    const meta = metaPorId.get(broker.userId);
    const targetDeals = meta?.targetDeals ?? broker.monthlyTargetDeals;
    const achievedDeals = meta?.achievedDeals ?? 0;

    return {
      userId: broker.userId,
      fullName: broker.fullName,
      jobTitle: broker.jobTitle ?? broker.roleName,
      specialty: broker.specialty,
      level: broker.level,
      annualSalesCents: broker.annualSalesCents,
      negociosActivos: negociosPorId.get(broker.userId) ?? 0,
      porcentajeMeta: cumplimientoPorcentaje(achievedDeals, targetDeals),
    };
  });

  return (
    <BrokersVista
      brokers={brokers}
      puedeAsignar={puedeAsignar}
      puedeInvitar={puedeInvitar}
      proyectosAsignables={proyectosAsignables}
      roles={listaRoles}
    />
  );
}
