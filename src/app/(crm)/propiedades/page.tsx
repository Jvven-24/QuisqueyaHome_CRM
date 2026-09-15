/**
 * M5 · Propiedades — rejilla (`docs/F2_ANALISIS_Y_PLAN.md` paso 1).
 *
 * Mismo patrón que `contactos/page.tsx`: componente de servidor, actor
 * resuelto una vez, `visibleRows` sobre `projects.brokerId` (R6: el broker
 * solo ve sus proyectos). Filtros de zona, tipo y estado por `searchParams`.
 *
 * La disponibilidad ("12/40" en el prototipo, literal) sale de un `COUNT(*)
 * FILTER (WHERE status = 'available')` agrupado por proyecto — una consulta,
 * no un campo que haya que mantener sincronizado a mano.
 *
 * El precio real (`internalPriceCents`) se decide aquí, antes de pasarlo a la
 * vista de cliente (decisión #26): `stripRestrictedPrices` ya existe en
 * `domain/rbac.ts` con su prueba, y lo pone en `null` si el actor no tiene
 * permiso sobre `unit_real_price` — así el dato nunca llega al payload que
 * recibe el navegador, no se esconde después en el JSX.
 */

import { and, eq, isNull, sql } from "drizzle-orm";
import { PROJECT_TYPES } from "@/domain/catalogs";
import { stripRestrictedPrices, can } from "@/domain/rbac";
import { requireActor } from "@/infrastructure/auth/actor";
import { getDb } from "@/infrastructure/db/client";
import { projects, roles, units, users } from "@/infrastructure/db/schema";
import { requireScopeInPage } from "@/infrastructure/page-guard";
import { visibleRows } from "@/infrastructure/rbac-filter";
import { PropiedadesVista } from "./vista";

export const metadata = { title: "Propiedades · CRM Quisqueya Home" };

function primero(valor: string | string[] | undefined): string | undefined {
  return Array.isArray(valor) ? valor[0] : valor;
}

export default async function PropiedadesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const actor = await requireActor();
  const scope = requireScopeInPage(actor, "projects", "view");

  const params = await searchParams;
  const zone = primero(params.zone)?.trim() || "";
  const projectTypeParam = primero(params.type);
  const projectType = PROJECT_TYPES.includes(projectTypeParam as (typeof PROJECT_TYPES)[number])
    ? (projectTypeParam as (typeof PROJECT_TYPES)[number])
    : undefined;

  const db = getDb();

  const condiciones = and(
    visibleRows(actor, scope, projects.brokerId, projects.deletedAt),
    zone ? eq(projects.zone, zone) : undefined,
    projectType ? eq(projects.projectType, projectType) : undefined,
  );

  const [filas, disponibilidad, brokers] = await Promise.all([
    db
      .select({
        id: projects.id,
        slug: projects.slug,
        name: projects.name,
        zone: projects.zone,
        projectType: projects.projectType,
        progressPercent: projects.progressPercent,
        internalPriceCents: projects.internalPriceCents,
        publicRangeMinCents: projects.publicRangeMinCents,
        publicRangeMaxCents: projects.publicRangeMaxCents,
        currency: projects.currency,
        brokerId: projects.brokerId,
        brokerName: users.fullName,
      })
      .from(projects)
      .leftJoin(users, eq(users.id, projects.brokerId))
      .where(condiciones)
      .orderBy(projects.name),
    // Disponibilidad de todos los proyectos visibles en una sola consulta
    // agrupada, en vez de una por tarjeta.
    db
      .select({
        projectId: units.projectId,
        total: sql<number>`count(*)`.mapWith(Number),
        disponibles: sql<number>`count(*) filter (where ${units.status} = 'available')`.mapWith(Number),
      })
      .from(units)
      .where(isNull(units.deletedAt))
      .groupBy(units.projectId),
    db
      .select({ id: users.id, fullName: users.fullName })
      .from(users)
      .innerJoin(roles, eq(roles.id, users.roleId))
      .where(and(eq(roles.slug, "broker"), eq(users.isActive, true), isNull(users.deletedAt)))
      .orderBy(users.fullName),
  ]);

  const disponibilidadPorProyecto = new Map(disponibilidad.map((fila) => [fila.projectId, fila]));

  const proyectos = filas.map((fila) => {
    const disp = disponibilidadPorProyecto.get(fila.id);
    return stripRestrictedPrices(actor, {
      ...fila,
      unidadesDisponibles: disp?.disponibles ?? 0,
      unidadesTotal: disp?.total ?? 0,
    });
  });

  return (
    <PropiedadesVista
      proyectos={proyectos}
      brokers={brokers}
      filtros={{ zone, type: projectType }}
      puedeCrear={can(actor, "projects", "create")}
      puedeEditarPrecioReal={can(actor, "unit_real_price", "edit")}
    />
  );
}
