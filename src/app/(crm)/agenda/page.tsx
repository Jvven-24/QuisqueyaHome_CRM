/**
 * M4 · Agenda — rejilla semanal (`docs/F2_ANALISIS_Y_PLAN.md` paso 3).
 *
 * Semana navegable por `searchParams.semana` (cualquier fecha de esa semana;
 * por defecto, hoy en Santo Domingo). `lunesDeLaSemana`/`medianocheSantoDomingo`
 * ya resuelven los límites — sin librería de fechas (decisión #24).
 *
 * `visibleRows` sobre `activities.assigneeId`, igual que `/tareas`: un
 * broker ve su propia agenda, no la del equipo (§10.4).
 */

import { and, eq, gte, isNull, lt } from "drizzle-orm";
import { requireActor } from "@/infrastructure/auth/actor";
import { getDb } from "@/infrastructure/db/client";
import { activities, users } from "@/infrastructure/db/schema";
import { requireScopeInPage } from "@/infrastructure/page-guard";
import { visibleRows } from "@/infrastructure/rbac-filter";
import { fechaSantoDomingo, lunesDeLaSemana, medianocheSantoDomingo, sumarDias } from "@/domain/zona-horaria";
import { AgendaVista } from "./vista";

export const metadata = { title: "Agenda · CRM Quisqueya Home" };

function primero(valor: string | string[] | undefined): string | undefined {
  return Array.isArray(valor) ? valor[0] : valor;
}

export default async function AgendaPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const actor = await requireActor();
  const scope = requireScopeInPage(actor, "activities", "view");

  const params = await searchParams;
  const semanaParam = primero(params.semana);
  const lunes = lunesDeLaSemana(semanaParam || fechaSantoDomingo(new Date()));
  const sabado = sumarDias(lunes, 5);

  const db = getDb();
  const [citas, personas] = await Promise.all([
    db
      .select({
        id: activities.id,
        title: activities.title,
        startsAt: activities.startsAt,
        endsAt: activities.endsAt,
        location: activities.location,
        assigneeId: activities.assigneeId,
        assigneeName: users.fullName,
      })
      .from(activities)
      .leftJoin(users, eq(users.id, activities.assigneeId))
      .where(
        and(
          visibleRows(actor, scope, activities.assigneeId, activities.deletedAt),
          gte(activities.startsAt, medianocheSantoDomingo(lunes)),
          lt(activities.startsAt, medianocheSantoDomingo(sabado)),
        ),
      )
      .orderBy(activities.startsAt),
    db.select({ id: users.id, fullName: users.fullName }).from(users).where(and(eq(users.isActive, true), isNull(users.deletedAt))).orderBy(users.fullName),
  ]);

  return <AgendaVista citas={citas} personas={personas} lunes={lunes} />;
}
