/**
 * M5 · Propiedades — detalle de proyecto (`docs/F2_ANALISIS_Y_PLAN.md` paso 1).
 *
 * Un id fuera del `visibleRows` del actor no debe filtrarse por la URL: el
 * mismo criterio que `contactos/page.tsx` aplica aquí, solo que la clave de
 * búsqueda es `slug` en vez de `id` (es lo que compone la URL del detalle).
 *
 * Las unidades no llevan su propio filtro de alcance (`docs/F2_ANALISIS_Y_PLAN.md`
 * §4.2): el acceso al detalle ya lo decidió `visibleRows` sobre el proyecto, y
 * una unidad no se ve fuera de la ficha de su proyecto. El precio real de cada
 * unidad sí se decide aquí, con `stripRestrictedPrices`, igual que en la
 * rejilla.
 */

import { and, eq, isNull } from "drizzle-orm";
import { notFound } from "next/navigation";
import { can, reaches, stripRestrictedPrices } from "@/domain/rbac";
import { requireActor } from "@/infrastructure/auth/actor";
import { getDb } from "@/infrastructure/db/client";
import { projects, roles, units, users } from "@/infrastructure/db/schema";
import { requireScopeInPage } from "@/infrastructure/page-guard";
import { PropiedadDetalleVista } from "./vista";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return { title: `${slug} · Propiedades · CRM Quisqueya Home` };
}

export default async function PropiedadDetallePage({ params }: { params: Promise<{ slug: string }> }) {
  const actor = await requireActor();
  const scope = requireScopeInPage(actor, "projects", "view");

  const { slug } = await params;
  const db = getDb();

  const [proyecto] = await db
    .select()
    .from(projects)
    .where(eq(projects.slug, slug))
    .limit(1);

  // Igual que `dentroDeAlcance` en `api/leads/[id]/convertir/route.ts`: un
  // proyecto fuera del alcance del actor responde igual que uno inexistente.
  if (!proyecto || proyecto.deletedAt || !reaches(actor, scope, proyecto.brokerId)) notFound();

  const [unidades, brokers] = await Promise.all([
    db
      .select()
      .from(units)
      .where(and(eq(units.projectId, proyecto.id), isNull(units.deletedAt)))
      .orderBy(units.code),
    db
      .select({ id: users.id, fullName: users.fullName })
      .from(users)
      .innerJoin(roles, eq(roles.id, users.roleId))
      .where(eq(roles.slug, "broker"))
      .orderBy(users.fullName),
  ]);

  const proyectoConPrecio = stripRestrictedPrices(actor, proyecto);
  const unidadesConPrecio = unidades.map((unidad) => stripRestrictedPrices(actor, unidad));

  return (
    <PropiedadDetalleVista
      proyecto={proyectoConPrecio}
      unidades={unidadesConPrecio}
      brokers={brokers}
      puedeEditarProyecto={can(actor, "projects", "edit")}
      puedeCrearUnidad={can(actor, "units", "create")}
      puedeEditarUnidad={can(actor, "units", "edit")}
      puedeEliminarUnidad={can(actor, "units", "delete")}
      puedeEditarPrecioReal={can(actor, "unit_real_price", "edit")}
      puedeVerAvances={can(actor, "construction_phases", "view")}
    />
  );
}
