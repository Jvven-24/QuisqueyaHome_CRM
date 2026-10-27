/**
 * M4 · Agenda — Rejilla Semanal, Visitas a Obra y Agenda por Broker (`docs/F2_ANALISIS_Y_PLAN.md` paso 3).
 *
 * Semana navegable por `searchParams.semana` (cualquier fecha de esa semana;
 * por defecto, hoy en Santo Domingo). `lunesDeLaSemana`/`medianocheSantoDomingo`
 * resuelven los límites sin librería de fechas (decisión #24).
 *
 * `visibleRows` sobre `activities.assigneeId` y sobre las entidades REA
 * vinculadas (Proyectos, Negocios, Contactos).
 */

import { and, asc, desc, eq, gte, lt } from "drizzle-orm";
import { can, scopeFor } from "@/domain/rbac";
import { requireActor } from "@/infrastructure/auth/actor";
import { getDb } from "@/infrastructure/db/client";
import { activities, contacts, deals, projects, users } from "@/infrastructure/db/schema";
import { requireScopeInPage } from "@/infrastructure/page-guard";
import { visibleRows } from "@/infrastructure/rbac-filter";
import { fechaSantoDomingo, lunesDeLaSemana, medianocheSantoDomingo, sumarDias } from "@/domain/zona-horaria";
import { AgendaVista, type CitaFila } from "./vista";
import { GoogleCuentasPanel } from "../_ui/google-cuentas";

export const metadata = { title: "Agenda & Visitas por Broker · CRM Quisqueya Home" };

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
  const siguienteLunes = sumarDias(lunes, 7); // Semana completa de lunes a domingo inclusive

  const scopeProyectos = scopeFor(actor, "projects", "view");
  const scopeNegocios = scopeFor(actor, "deals", "view");
  const scopeContactos = scopeFor(actor, "contacts", "view");

  const db = getDb();
  const [filasCitas, personas, proyectosVisibles, negociosVisibles, contactosVisibles] =
    await Promise.all([
      db
        .select({
          id: activities.id,
          title: activities.title,
          description: activities.description,
          contactId: activities.contactId,
          dealId: activities.dealId,
          projectId: activities.projectId,
          activityType: activities.activityType,
          startsAt: activities.startsAt,
          endsAt: activities.endsAt,
          location: activities.location,
          meetingUrl: activities.meetingUrl,
          priority: activities.priority,
          status: activities.status,
          assigneeId: activities.assigneeId,
          assigneeName: users.fullName,
        })
        .from(activities)
        .leftJoin(users, eq(users.id, activities.assigneeId))
        .where(
          and(
            visibleRows(actor, scope, activities.assigneeId, activities.deletedAt),
            gte(activities.startsAt, medianocheSantoDomingo(lunes)),
            lt(activities.startsAt, medianocheSantoDomingo(siguienteLunes)),
          ),
        )
        .orderBy(activities.startsAt),
      db
        .select({ id: users.id, fullName: users.fullName })
        .from(users)
        .where(
          and(
            eq(users.isActive, true),
            visibleRows(actor, scopeFor(actor, "activities", "create"), users.id, users.deletedAt),
          ),
        )
        .orderBy(users.fullName),
      can(actor, "projects", "view")
        ? db
            .select({
              id: projects.id,
              name: projects.name,
              zone: projects.zone,
            })
            .from(projects)
            .where(visibleRows(actor, scopeProyectos, projects.brokerId, projects.deletedAt))
            .orderBy(asc(projects.name))
            .limit(100)
        : Promise.resolve([]),
      can(actor, "deals", "view")
        ? db
            .select({
              id: deals.id,
              title: deals.title,
              contactId: deals.contactId,
            })
            .from(deals)
            .where(visibleRows(actor, scopeNegocios, deals.brokerId, deals.deletedAt))
            .orderBy(desc(deals.id))
            .limit(120)
        : Promise.resolve([]),
      can(actor, "contacts", "view")
        ? db
            .select({
              id: contacts.id,
              fullName: contacts.fullName,
              phone: contacts.phoneDisplay,
            })
            .from(contacts)
            .where(visibleRows(actor, scopeContactos, contacts.brokerId, contacts.deletedAt))
            .orderBy(asc(contacts.fullName))
            .limit(150)
        : Promise.resolve([]),
    ]);

  const mapaProyectos = new Map(proyectosVisibles.map((p) => [p.id, p]));
  const mapaNegocios = new Map(negociosVisibles.map((d) => [d.id, d]));
  const mapaContactos = new Map(contactosVisibles.map((c) => [c.id, c]));

  const citas: CitaFila[] = filasCitas.map((c) => {
    const proy = c.projectId ? mapaProyectos.get(c.projectId) : undefined;
    const neg = c.dealId ? mapaNegocios.get(c.dealId) : undefined;
    const cont = c.contactId ? mapaContactos.get(c.contactId) : undefined;
    return {
      ...c,
      projectId: proy ? c.projectId : null,
      dealId: neg ? c.dealId : null,
      contactId: cont ? c.contactId : null,
      projectName: proy ? proy.name : null,
      dealTitle: neg ? neg.title || `Negocio #${neg.id}` : null,
      contactName: cont ? cont.fullName : null,
    };
  });

  return (
    <>
    <div className="mx-auto w-full max-w-7xl px-4 pt-4"><details className="group"><summary className="min-h-11 cursor-pointer py-2 text-sm font-semibold">Mis calendarios de Google</summary><GoogleCuentasPanel titulo="Mis calendarios de Google" /></details></div>
    <AgendaVista
      citas={citas}
      personas={personas}
      lunes={lunes}
      proyectos={proyectosVisibles}
      negocios={negociosVisibles.map((d) => ({
        id: d.id,
        title: d.title || `Negocio #${d.id}`,
        contactId: d.contactId,
      }))}
      contactos={contactosVisibles}
      muestraEquipo={scope === "all"}
    />
    </>
  );
}
