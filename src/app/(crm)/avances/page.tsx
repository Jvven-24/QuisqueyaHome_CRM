/**
 * M6 · Avances de obra (`docs/F3_ANALISIS_Y_PLAN.md` §4.3, issue #32). Conecta
 * `/avances` a `construction_phases`: selector de proyecto (`?proyecto=<slug>`,
 * por defecto el primero visible), línea de tiempo con las fases reales
 * ordenadas por `position`, fase elegida vía `?fase=<id>` (por defecto la
 * primera) y sus fotos con URL firmada.
 *
 * Hallazgo 1 (§3): las fases no tienen `broker_id` propio — el alcance se
 * hereda del proyecto dueño con `visibleRows(actor, scope, projects.brokerId,
 * projects.deletedAt)`, mismo criterio que `api/pipeline/[id]/propiedades/route.ts`.
 *
 * Fotos: `files.url` guarda la ruta del objeto en Storage, no una URL pública
 * (el bucket es privado, decisión #33) — se firma aquí, en el servidor, con
 * una sola llamada a `createSignedUrls` para todas las fotos de la fase
 * elegida. Sin `SUPABASE_SERVICE_ROLE_KEY` no se puede firmar nada: la
 * sección de fotos muestra un aviso en vez de tumbar la página entera.
 */

import { and, eq, isNull } from "drizzle-orm";
import { can } from "@/domain/rbac";
import { fechaSantoDomingo, horaSantoDomingo } from "@/domain/zona-horaria";
import { adminClient } from "@/infrastructure/auth/supabase";
import { requireActor } from "@/infrastructure/auth/actor";
import { getDb } from "@/infrastructure/db/client";
import { constructionPhases, files, projects, users } from "@/infrastructure/db/schema";
import { requireScopeInPage } from "@/infrastructure/page-guard";
import { visibleRows } from "@/infrastructure/rbac-filter";
import { AvancesVista } from "./vista";

export const metadata = { title: "Avances de obra · CRM Quisqueya Home" };

function primero(valor: string | string[] | undefined): string | undefined {
  return Array.isArray(valor) ? valor[0] : valor;
}

export default async function AvancesDeObraPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const actor = await requireActor();
  const scope = requireScopeInPage(actor, "construction_phases", "view");

  const params = await searchParams;
  const db = getDb();

  const proyectos = await db
    .select({ id: projects.id, slug: projects.slug, name: projects.name, estimatedDeliveryDate: projects.estimatedDeliveryDate })
    .from(projects)
    .where(visibleRows(actor, scope, projects.brokerId, projects.deletedAt))
    .orderBy(projects.name);

  if (proyectos.length === 0) {
    return <AvancesVista proyectos={[]} proyecto={null} fases={[]} faseSeleccionadaId={null} usuarios={[]} fotos={[]} fotosError={null} puedeCrear={false} puedeEditar={false} puedeEliminar={false} />;
  }

  const slugParam = primero(params.proyecto);
  const proyecto = proyectos.find((p) => p.slug === slugParam) ?? proyectos[0]!;

  const fasesConResponsable = await db
    .select({
      fase: constructionPhases,
      responsableNombre: users.fullName,
    })
    .from(constructionPhases)
    .leftJoin(users, eq(users.id, constructionPhases.responsibleId))
    .where(eq(constructionPhases.projectId, proyecto.id))
    .orderBy(constructionPhases.position)
    .then((filas) => filas.map((fila) => ({ ...fila.fase, responsableNombre: fila.responsableNombre })));

  const faseIdParam = Number(primero(params.fase));
  const faseSeleccionada =
    fasesConResponsable.find((f) => f.id === faseIdParam) ?? fasesConResponsable[0] ?? null;

  const [usuarios, fotosResultado] = await Promise.all([
    db
      .select({ id: users.id, fullName: users.fullName })
      .from(users)
      .where(and(eq(users.isActive, true), isNull(users.deletedAt)))
      .orderBy(users.fullName),
    faseSeleccionada ? cargarFotos(faseSeleccionada.id) : Promise.resolve({ fotos: [], error: null }),
  ]);

  const ultimaEdicionTexto = faseSeleccionada
    ? `${fechaSantoDomingo(faseSeleccionada.updatedAt)} ${horaSantoDomingo(faseSeleccionada.updatedAt)}`
    : null;

  return (
    <AvancesVista
      proyectos={proyectos}
      proyecto={proyecto}
      fases={fasesConResponsable}
      faseSeleccionadaId={faseSeleccionada?.id ?? null}
      ultimaEdicionTexto={ultimaEdicionTexto}
      usuarios={usuarios}
      fotos={fotosResultado.fotos}
      fotosError={fotosResultado.error}
      puedeCrear={can(actor, "construction_phases", "create")}
      puedeEditar={can(actor, "construction_phases", "edit")}
      puedeEliminar={can(actor, "construction_phases", "delete")}
    />
  );
}

const BUCKET = "avances-obra";

/**
 * Fotos no borradas de una fase, con URL firmada — una sola llamada a
 * `createSignedUrls` para todas (§3 hallazgo 3, decisión #33). Sin la clave de
 * servicio, `adminClient()` lanza (`infrastructure/env.ts`); se atrapa aquí
 * para que la página siga sirviendo todo lo demás, con un aviso en su lugar.
 */
async function cargarFotos(faseId: number): Promise<{
  fotos: { id: number; name: string; url: string | null }[];
  error: string | null;
}> {
  const filas = await getDb()
    .select({ id: files.id, name: files.name, path: files.url })
    .from(files)
    .where(and(eq(files.entityType, "construction_phase"), eq(files.entityId, faseId), isNull(files.deletedAt)))
    .orderBy(files.position, files.id);

  if (filas.length === 0) return { fotos: [], error: null };

  try {
    const { data, error } = await adminClient()
      .storage.from(BUCKET)
      .createSignedUrls(
        filas.map((f) => f.path),
        3600,
      );
    if (error) throw error;

    return {
      fotos: filas.map((f, indice) => ({ id: f.id, name: f.name, url: data?.[indice]?.signedUrl ?? null })),
      error: null,
    };
  } catch (error) {
    return {
      fotos: [],
      error: error instanceof Error ? error.message : "No se pudieron cargar las fotos de esta fase.",
    };
  }
}
