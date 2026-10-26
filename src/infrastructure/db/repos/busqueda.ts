import { ETIQUETAS_ESTADO } from "../../../application/leads/presentacion";
import { and, desc, eq, ilike, or } from "drizzle-orm";
import type {
  AlcancesBusquedaGlobal,
  ItemResultadoBusqueda,
  RepositorioBusquedaGlobal,
  ResultadosBusquedaGlobal,
} from "../../../application/busqueda/consultas";
import type { Actor } from "../../../domain/rbac";
import { visibleRows } from "../../rbac-filter";
import type { Db } from "../client";
import {
  activities,
  contacts,
  deals,
  leads,
  pipelineStages,
  projects,
} from "../schema";
import type { Tx } from "./compartido";

const LIMITE_POR_GRUPO = 5;
type Ejecutor = Pick<Tx | Db, "select">;

export function repositorioBusquedaGlobal(db: Ejecutor): RepositorioBusquedaGlobal {
  return {
    async buscar(
      actor: Actor,
      termino: string,
      alcances: AlcancesBusquedaGlobal,
    ): Promise<ResultadosBusquedaGlobal> {
      const patron = `%${termino}%`;

      const [resLeads, resContactos, resNegocios, resPropiedades, resTareas] = await Promise.all([
        alcances.leads === "none"
          ? Promise.resolve([] as ItemResultadoBusqueda[])
          : (async (): Promise<ItemResultadoBusqueda[]> => {
              const filas = await db
                .select({
                  id: leads.id,
                  fullName: contacts.fullName,
                  phoneDisplay: contacts.phoneDisplay,
                  phone: contacts.phone,
                  zoneInterest: leads.zoneInterest,
                  projectInterestText: leads.projectInterestText,
                  status: leads.status,
                })
                .from(leads)
                .innerJoin(contacts, eq(leads.contactId, contacts.id))
                .where(
                  and(
                    visibleRows(actor, alcances.leads, leads.brokerId, leads.deletedAt),
                    or(
                      ilike(contacts.fullName, patron),
                      ilike(contacts.phone, patron),
                      ilike(contacts.phoneDisplay, patron),
                      ilike(contacts.email, patron),
                      ilike(leads.zoneInterest, patron),
                      ilike(leads.projectInterestText, patron),
                    ),
                  ),
                )
                .orderBy(desc(leads.receivedAt))
                .limit(LIMITE_POR_GRUPO);

              return filas.map((f) => ({
                id: f.id,
                tipo: "lead" as const,
                titulo: f.fullName,
                subtitulo:
                  [f.projectInterestText, f.zoneInterest, f.phoneDisplay ?? f.phone]
                    .filter(Boolean)
                    .join(" · ") || "Prospecto en seguimiento",
                etiqueta: ETIQUETAS_ESTADO[f.status],
                ruta: `/leads/${f.id}`,
              }));
            })(),

        alcances.contacts === "none"
          ? Promise.resolve([] as ItemResultadoBusqueda[])
          : (async (): Promise<ItemResultadoBusqueda[]> => {
              const filas = await db
                .select({
                  id: contacts.id,
                  fullName: contacts.fullName,
                  phoneDisplay: contacts.phoneDisplay,
                  phone: contacts.phone,
                  email: contacts.email,
                })
                .from(contacts)
                .where(
                  and(
                    visibleRows(actor, alcances.contacts, contacts.brokerId, contacts.deletedAt),
                    or(
                      ilike(contacts.fullName, patron),
                      ilike(contacts.phone, patron),
                      ilike(contacts.phoneDisplay, patron),
                      ilike(contacts.email, patron),
                    ),
                  ),
                )
                .orderBy(desc(contacts.updatedAt))
                .limit(LIMITE_POR_GRUPO);

              return filas.map((f) => ({
                id: f.id,
                tipo: "contacto" as const,
                titulo: f.fullName,
                subtitulo: [f.phoneDisplay ?? f.phone, f.email].filter(Boolean).join(" · ") || "Contacto registrado",
                etiqueta: "Contacto",
                ruta: `/contactos/${f.id}`,
              }));
            })(),

        alcances.deals === "none"
          ? Promise.resolve([] as ItemResultadoBusqueda[])
          : (async (): Promise<ItemResultadoBusqueda[]> => {
              const filas = await db
                .select({
                  id: deals.id,
                  title: deals.title,
                  contactName: contacts.fullName,
                  stageName: pipelineStages.name,
                })
                .from(deals)
                .innerJoin(contacts, eq(deals.contactId, contacts.id))
                .innerJoin(pipelineStages, eq(deals.stageId, pipelineStages.id))
                .where(
                  and(
                    visibleRows(actor, alcances.deals, deals.brokerId, deals.deletedAt),
                    or(
                      ilike(deals.title, patron),
                      ilike(contacts.fullName, patron),
                      ilike(contacts.phone, patron),
                    ),
                  ),
                )
                .orderBy(desc(deals.updatedAt))
                .limit(LIMITE_POR_GRUPO);

              return filas.map((f) => ({
                id: f.id,
                tipo: "negocio" as const,
                titulo: f.title ?? f.contactName,
                subtitulo: `${f.contactName} · ${f.stageName}`,
                etiqueta: f.stageName,
                ruta: `/negocios/${f.id}`,
              }));
            })(),

        alcances.properties === "none"
          ? Promise.resolve([] as ItemResultadoBusqueda[])
          : (async (): Promise<ItemResultadoBusqueda[]> => {
              const filas = await db
                .select({
                  id: projects.id,
                  slug: projects.slug,
                  name: projects.name,
                  zone: projects.zone,
                })
                .from(projects)
                .where(
                  and(
                    visibleRows(actor, alcances.properties, projects.brokerId, projects.deletedAt),
                    or(
                      ilike(projects.name, patron),
                      ilike(projects.slug, patron),
                      ilike(projects.zone, patron),
                    ),
                  ),
                )
                .orderBy(projects.name)
                .limit(LIMITE_POR_GRUPO);

              return filas.map((f) => ({
                id: f.id,
                tipo: "propiedad" as const,
                titulo: f.name,
                subtitulo: f.zone ? `Zona: ${f.zone}` : "Proyecto inmobiliario",
                etiqueta: "Proyecto",
                ruta: `/propiedades/${f.slug}`,
              }));
            })(),

        alcances.tasks === "none"
          ? Promise.resolve([] as ItemResultadoBusqueda[])
          : (async (): Promise<ItemResultadoBusqueda[]> => {
              const filas = await db
                .select({
                  id: activities.id,
                  title: activities.title,
                  status: activities.status,
                  location: activities.location,
                })
                .from(activities)
                .where(
                  and(
                    visibleRows(actor, alcances.tasks, activities.assigneeId, activities.deletedAt),
                    or(ilike(activities.title, patron), ilike(activities.description, patron)),
                  ),
                )
                .orderBy(desc(activities.updatedAt))
                .limit(LIMITE_POR_GRUPO);

              return filas.map((f) => ({
                id: f.id,
                tipo: "tarea" as const,
                titulo: f.title,
                subtitulo: f.location ?? "Actividad operativa",
                etiqueta: f.status === "completed" ? "Completada" : "Pendiente",
                ruta: `/tareas`,
              }));
            })(),
      ]);

      return {
        leads: resLeads,
        contactos: resContactos,
        negocios: resNegocios,
        propiedades: resPropiedades,
        tareas: resTareas,
      };
    },
  };
}
