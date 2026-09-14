/**
 * M4 · Tareas — cola del día (`docs/F2_ANALISIS_Y_PLAN.md` paso 2).
 *
 * Mismo patrón que `contactos/page.tsx`: componente de servidor,
 * `visibleRows` sobre `activities.assigneeId` — aquí el responsable no es
 * `brokerId`, es a quien se le asignó la actividad (`rbac-filter.ts`).
 *
 * "Cola del día" = pendientes sin fecha (tareas sin hora fija) más las que
 * vencen hoy o ya vencieron — nunca las que empiezan mañana o después, esas
 * viven en `/agenda`.
 *
 * El panel "Carga del equipo" es una métrica global (§10.4): solo se pinta
 * con alcance `all`, nunca a un broker con `own`.
 */

import { and, count, eq, isNull, lt, or } from "drizzle-orm";
import { requireActor } from "@/infrastructure/auth/actor";
import { getDb } from "@/infrastructure/db/client";
import { activities, users } from "@/infrastructure/db/schema";
import { requireScopeInPage } from "@/infrastructure/page-guard";
import { visibleRows } from "@/infrastructure/rbac-filter";
import { fechaSantoDomingo, medianocheSantoDomingo, sumarDias } from "@/domain/zona-horaria";
import { TareasVista } from "./vista";

export const metadata = { title: "Tareas · CRM Quisqueya Home" };

export default async function TareasPage() {
  const actor = await requireActor();
  const scope = requireScopeInPage(actor, "activities", "view");

  const db = getDb();
  const mananaSD = medianocheSantoDomingo(sumarDias(fechaSantoDomingo(new Date()), 1));

  const condicionesCola = and(
    visibleRows(actor, scope, activities.assigneeId, activities.deletedAt),
    eq(activities.status, "pending"),
    or(isNull(activities.startsAt), lt(activities.startsAt, mananaSD)),
  );

  const [tareas, cargaEquipo, personas] = await Promise.all([
    db
      .select({
        id: activities.id,
        title: activities.title,
        activityType: activities.activityType,
        priority: activities.priority,
        startsAt: activities.startsAt,
        assigneeId: activities.assigneeId,
        assigneeName: users.fullName,
      })
      .from(activities)
      .leftJoin(users, eq(users.id, activities.assigneeId))
      .where(condicionesCola)
      .orderBy(activities.startsAt),
    // Métrica global (§10.4): solo tiene sentido, y solo se calcula, con alcance `all`.
    scope === "all"
      ? db
          .select({ assigneeId: activities.assigneeId, assigneeName: users.fullName, total: count() })
          .from(activities)
          .leftJoin(users, eq(users.id, activities.assigneeId))
          .where(and(eq(activities.status, "pending"), isNull(activities.deletedAt)))
          .groupBy(activities.assigneeId, users.fullName)
      : Promise.resolve([]),
    db.select({ id: users.id, fullName: users.fullName }).from(users).where(and(eq(users.isActive, true), isNull(users.deletedAt))).orderBy(users.fullName),
  ]);

  return <TareasVista tareas={tareas} cargaEquipo={cargaEquipo} personas={personas} muestraCargaEquipo={scope === "all"} />;
}
