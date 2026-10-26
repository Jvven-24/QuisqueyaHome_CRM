/**
 * M4 · Tareas — Centro de Ejecución Comercial, To-Do List y Asignación por Broker (`docs/F2_ANALISIS_Y_PLAN.md` paso 2).
 *
 * Componente de servidor: actor resuelto una vez, permiso comprobado.
 * `visibleRows` sobre `activities.assigneeId` y sobre las entidades REA
 * vinculadas (Recurso: Proyectos/Negocios/Contactos · Evento: Actividad · Agente: Broker).
 */

import { and, asc, count, desc, eq, inArray, isNull } from "drizzle-orm";
import { can, scopeFor } from "@/domain/rbac";
import { requireActor } from "@/infrastructure/auth/actor";
import { getDb } from "@/infrastructure/db/client";
import { activities, contacts, deals, projects, users } from "@/infrastructure/db/schema";
import { requireScopeInPage } from "@/infrastructure/page-guard";
import { visibleRows } from "@/infrastructure/rbac-filter";
import { TareasVista, type TareaFila } from "./vista";

export const metadata = { title: "Tareas & To-Do por Broker · CRM Quisqueya Home" };

export default async function TareasPage() {
  const actor = await requireActor();
  const scope = requireScopeInPage(actor, "activities", "view");

  const db = getDb();

  const condicionesCola = and(
    visibleRows(actor, scope, activities.assigneeId, activities.deletedAt),
    inArray(activities.status, ["pending", "completed"]),
    eq(activities.activityType, "task"),
  );

  const scopeProyectos = scopeFor(actor, "projects", "view");
  const scopeNegocios = scopeFor(actor, "deals", "view");
  const scopeContactos = scopeFor(actor, "contacts", "view");

  const [filasTareas, cargaEquipo, personas, proyectosVisibles, negociosVisibles, contactosVisibles] =
    await Promise.all([
      db
        .select({
          id: activities.id,
          title: activities.title,
          description: activities.description,
          activityType: activities.activityType,
          priority: activities.priority,
          status: activities.status,
          startsAt: activities.startsAt,
          completedAt: activities.completedAt,
          location: activities.location,
          assigneeId: activities.assigneeId,
          assigneeName: users.fullName,
          projectId: activities.projectId,
          dealId: activities.dealId,
          contactId: activities.contactId,
        })
        .from(activities)
        .leftJoin(users, eq(users.id, activities.assigneeId))
        .where(condicionesCola)
        .orderBy(asc(activities.status), asc(activities.startsAt), desc(activities.id))
        .limit(250),
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
            .where(
              and(
                eq(activities.status, "pending"),
                eq(activities.activityType, "task"),
                isNull(activities.deletedAt),
              ),
            )
            .groupBy(activities.assigneeId, users.fullName)
        : Promise.resolve([]),
      db
        .select({ id: users.id, fullName: users.fullName })
        .from(users)
        .where(and(eq(users.isActive, true), isNull(users.deletedAt)))
        .orderBy(users.fullName),
      can(actor, "projects", "view")
        ? db
            .select({
              id: projects.id,
              name: projects.name,
              zone: projects.zone,
              confoturEligible: projects.confoturEligible,
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
              brokerId: deals.brokerId,
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
              brokerId: contacts.brokerId,
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

  const tareas: TareaFila[] = filasTareas.map((f) => {
    const proy = f.projectId ? mapaProyectos.get(f.projectId) : undefined;
    const neg = f.dealId ? mapaNegocios.get(f.dealId) : undefined;
    const cont = f.contactId ? mapaContactos.get(f.contactId) : undefined;
    return {
      id: f.id,
      title: f.title,
      description: f.description,
      activityType: f.activityType,
      priority: f.priority,
      status: f.status,
      startsAt: f.startsAt,
      completedAt: f.completedAt,
      location: f.location,
      assigneeId: f.assigneeId,
      assigneeName: f.assigneeName,
      projectId: proy ? proy.id : null,
      projectName: proy ? proy.name : null,
      projectZone: proy ? proy.zone : null,
      dealId: neg ? neg.id : null,
      dealTitle: neg ? neg.title || `Negocio #${neg.id}` : null,
      contactId: cont ? cont.id : null,
      contactName: cont ? cont.fullName : null,
    };
  });

  return (
    <TareasVista
      tareas={tareas}
      cargaEquipo={cargaEquipo}
      personas={personas}
      muestraCargaEquipo={scope === "all"}
      proyectos={proyectosVisibles.map((p) => ({
        id: p.id,
        name: p.name,
        zone: p.zone,
        confoturEligible: Boolean(p.confoturEligible),
      }))}
      negocios={negociosVisibles.map((d) => ({
        id: d.id,
        title: d.title || `Negocio #${d.id}`,
        contactId: d.contactId,
        brokerId: d.brokerId,
      }))}
      contactos={contactosVisibles.map((c) => ({
        id: c.id,
        fullName: c.fullName,
        phone: c.phone,
        brokerId: c.brokerId,
      }))}
      actorId={actor.userId}
    />
  );
}
