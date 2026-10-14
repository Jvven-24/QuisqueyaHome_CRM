/**
 * M4 · Tareas — cola operativa y semáforo de urgencia (`docs/F2_ANALISIS_Y_PLAN.md` paso 2).
 *
 * Componente de servidor: actor resuelto una vez, permiso comprobado.
 * `visibleRows` sobre `activities.assigneeId`.
 *
 * Muestra actividades pendientes organizadas por semáforo de urgencia
 * (Vencidas, Hoy, Próximas) y balance de carga del equipo cuando el
 * usuario tiene alcance `all`.
 */

import { and, count, eq, isNull } from "drizzle-orm";
import { requireActor } from "@/infrastructure/auth/actor";
import { getDb } from "@/infrastructure/db/client";
import { activities, users } from "@/infrastructure/db/schema";
import { requireScopeInPage } from "@/infrastructure/page-guard";
import { visibleRows } from "@/infrastructure/rbac-filter";
import { TareasVista } from "./vista";

export const metadata = { title: "Tareas · CRM Quisqueya Home" };

export default async function TareasPage() {
  const actor = await requireActor();
  const scope = requireScopeInPage(actor, "activities", "view");

  const db = getDb();

  const condicionesCola = and(
    visibleRows(actor, scope, activities.assigneeId, activities.deletedAt),
    eq(activities.status, "pending"),
  );

  const [tareas, cargaEquipo, personas] = await Promise.all([
    db
      .select({
        id: activities.id,
        title: activities.title,
        description: activities.description,
        activityType: activities.activityType,
        priority: activities.priority,
        startsAt: activities.startsAt,
        location: activities.location,
        assigneeId: activities.assigneeId,
        assigneeName: users.fullName,
      })
      .from(activities)
      .leftJoin(users, eq(users.id, activities.assigneeId))
      .where(condicionesCola)
      .orderBy(activities.startsAt),
    // Métrica global (§10.4): solo se calcula con alcance `all`.
    scope === "all"
      ? db
          .select({
            assigneeId: activities.assigneeId,
            assigneeName: users.fullName,
            total: count(),
          })
          .from(activities)
          .leftJoin(users, eq(users.id, activities.assigneeId))
          .where(and(eq(activities.status, "pending"), isNull(activities.deletedAt)))
          .groupBy(activities.assigneeId, users.fullName)
      : Promise.resolve([]),
    db
      .select({ id: users.id, fullName: users.fullName })
      .from(users)
      .where(and(eq(users.isActive, true), isNull(users.deletedAt)))
      .orderBy(users.fullName),
  ]);

  return (
    <TareasVista
      tareas={tareas}
      cargaEquipo={cargaEquipo}
      personas={personas}
      muestraCargaEquipo={scope === "all"}
    />
  );
}
