/**
 * M13 · Configuración — dispatcher por pestaña (`docs/F2_ANALISIS_Y_PLAN.md`
 * paso 4 y 5).
 *
 * La pestaña vive en `?tab=` (mismo criterio que los filtros de contactos y
 * propiedades): cada una consulta solo lo que necesita, en vez de traer
 * usuarios + permisos + etapas + catálogos + papelera en cada visita, que es
 * lo que el `useState` del prototipo hacía sin darse cuenta (todo montado de
 * una vez, solo oculto con CSS).
 *
 * Todas las escrituras de esta página exigen `settings:edit` — es la única
 * pantalla que administra el propio sistema de permisos, así que su alcance
 * no se subdivide por recurso (ver `api/papelera/restaurar/route.ts`).
 */

import { eq, isNotNull, isNull } from "drizzle-orm";
import { can } from "@/domain/rbac";
import { requireActor } from "@/infrastructure/auth/actor";
import { getDb } from "@/infrastructure/db/client";
import {
  brokerProfiles,
  contacts,
  deals,
  integrationAccounts,
  leadSources,
  leads,
  lossReasons,
  permissions,
  pipelineStages,
  projects,
  roles,
  units,
  users,
} from "@/infrastructure/db/schema";
import { requireScopeInPage } from "@/infrastructure/page-guard";
import { ConfiguracionVista, type Tab } from "./vista";

export const metadata = { title: "Configuración · CRM Quisqueya Home" };

const TABS: Tab[] = ["usuarios", "permisos", "etapas", "catalogos", "papelera", "integraciones"];

function primero(valor: string | string[] | undefined): string | undefined {
  return Array.isArray(valor) ? valor[0] : valor;
}

export default async function ConfiguracionPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const actor = await requireActor();
  requireScopeInPage(actor, "settings", "view");

  const params = await searchParams;
  const tabParam = primero(params.tab);
  const tab: Tab = TABS.includes(tabParam as Tab) ? (tabParam as Tab) : "usuarios";

  const db = getDb();
  const puedeEditar = can(actor, "settings", "edit");

  if (tab === "usuarios") {
    const [listaUsuarios, listaRoles] = await Promise.all([
      db
        .select({
          id: users.id,
          fullName: users.fullName,
          email: users.email,
          jobTitle: users.jobTitle,
          phone: users.phone,
          isActive: users.isActive,
          authUserId: users.authUserId,
          roleId: users.roleId,
          roleName: roles.name,
          roleSlug: roles.slug,
          specialty: brokerProfiles.specialty,
          handlesRentals: brokerProfiles.handlesRentals,
          monthlyTargetDeals: brokerProfiles.monthlyTargetDeals,
        })
        .from(users)
        .innerJoin(roles, eq(roles.id, users.roleId))
        .leftJoin(brokerProfiles, eq(brokerProfiles.userId, users.id))
        .where(isNull(users.deletedAt))
        .orderBy(users.fullName),
      db.select({ id: roles.id, name: roles.name, slug: roles.slug }).from(roles).where(eq(roles.isActive, true)).orderBy(roles.name),
    ]);
    return <ConfiguracionVista tab={tab} puedeEditar={puedeEditar} usuarios={{ lista: listaUsuarios, roles: listaRoles }} />;
  }

  if (tab === "permisos") {
    const listaRoles = await db
      .select({ id: roles.id, name: roles.name, slug: roles.slug, isProtected: roles.isProtected })
      .from(roles)
      .where(eq(roles.isActive, true))
      .orderBy(roles.name);
    const rolIdParam = Number(primero(params.rol));
    const rolSeleccionado = listaRoles.find((r) => r.id === rolIdParam) ?? listaRoles.find((r) => !r.isProtected) ?? listaRoles[0] ?? null;
    const filasPermiso = rolSeleccionado
      ? await db
          .select({ resource: permissions.resource, action: permissions.action, scope: permissions.scope })
          .from(permissions)
          .where(eq(permissions.roleId, rolSeleccionado.id))
      : [];
    return (
      <ConfiguracionVista
        tab={tab}
        puedeEditar={puedeEditar}
        permisos={{ roles: listaRoles, rolSeleccionado, permisos: filasPermiso }}
      />
    );
  }

  if (tab === "etapas") {
    const etapas = await db.select().from(pipelineStages).orderBy(pipelineStages.position);
    return <ConfiguracionVista tab={tab} puedeEditar={puedeEditar} etapas={etapas} />;
  }

  if (tab === "catalogos") {
    const [motivos, canales] = await Promise.all([
      db.select().from(lossReasons).orderBy(lossReasons.position),
      db.select().from(leadSources).orderBy(leadSources.position),
    ]);
    return <ConfiguracionVista tab={tab} puedeEditar={puedeEditar} catalogos={{ motivos, canales }} />;
  }

  if (tab === "papelera") {
    const [contactosBorrados, leadsBorrados, dealsBorrados, proyectosBorrados, unidadesBorradas, usuariosBorrados] = await Promise.all([
      db.select({ id: contacts.id, nombre: contacts.fullName, borradoEn: contacts.deletedAt }).from(contacts).where(isNotNull(contacts.deletedAt)).limit(30),
      db.select({ id: leads.id, nombre: leads.projectInterestText, borradoEn: leads.deletedAt }).from(leads).where(isNotNull(leads.deletedAt)).limit(30),
      db.select({ id: deals.id, borradoEn: deals.deletedAt }).from(deals).where(isNotNull(deals.deletedAt)).limit(30),
      db.select({ id: projects.id, nombre: projects.name, borradoEn: projects.deletedAt }).from(projects).where(isNotNull(projects.deletedAt)).limit(30),
      db.select({ id: units.id, nombre: units.code, borradoEn: units.deletedAt }).from(units).where(isNotNull(units.deletedAt)).limit(30),
      db.select({ id: users.id, nombre: users.fullName, borradoEn: users.deletedAt }).from(users).where(isNotNull(users.deletedAt)).limit(30),
    ]);
    const papelera = [
      ...contactosBorrados.map((f) => ({ entityType: "contact" as const, id: f.id, nombre: f.nombre ?? `#${f.id}`, borradoEn: f.borradoEn })),
      ...leadsBorrados.map((f) => ({ entityType: "lead" as const, id: f.id, nombre: f.nombre ?? `Lead #${f.id}`, borradoEn: f.borradoEn })),
      ...dealsBorrados.map((f) => ({ entityType: "deal" as const, id: f.id, nombre: `Negocio #${f.id}`, borradoEn: f.borradoEn })),
      ...proyectosBorrados.map((f) => ({ entityType: "project" as const, id: f.id, nombre: f.nombre, borradoEn: f.borradoEn })),
      ...unidadesBorradas.map((f) => ({ entityType: "unit" as const, id: f.id, nombre: f.nombre, borradoEn: f.borradoEn })),
      ...usuariosBorrados.map((f) => ({ entityType: "user" as const, id: f.id, nombre: f.nombre, borradoEn: f.borradoEn })),
    ].sort((a, b) => (b.borradoEn?.getTime() ?? 0) - (a.borradoEn?.getTime() ?? 0));
    return <ConfiguracionVista tab={tab} puedeEditar={puedeEditar} papelera={papelera} />;
  }

  // tab === "integraciones"
  const integraciones = await db.select().from(integrationAccounts);
  return <ConfiguracionVista tab={tab} puedeEditar={puedeEditar} integraciones={integraciones} />;
}
