/**
 * M6 · Avances de obra — helpers compartidos entre los route handlers de
 * `api/proyectos/[id]/fases/…` (issue #32, decisión #32).
 *
 * `faseVisible` aplica el hallazgo 1 de `docs/F3_ANALISIS_Y_PLAN.md` §3: las
 * fases no tienen `broker_id` propio, así que el alcance del actor se
 * comprueba sobre el proyecto dueño (`projects.broker_id`) con `visibleRows`
 * — igual que `api/pipeline/[id]/propiedades/route.ts` ya hace para asociar
 * un proyecto a un negocio.
 *
 * `recalcularProgreso` es el hallazgo 2: `projects.progress_percent` es un
 * caché del promedio de las fases (comentario del propio esquema), y toda
 * escritura de una fase lo recalcula en la misma transacción para que la
 * rejilla de M5 nunca mienta.
 */

import { and, eq } from "drizzle-orm";
import { promedioAvance } from "@/domain/avance-obra";
import type { Actor } from "@/domain/rbac";
import type { PermissionScope } from "@/domain/catalogs";
import type { Db } from "@/infrastructure/db/client";
import { constructionPhases, projects } from "@/infrastructure/db/schema";
import { idsDeRuta } from "@/infrastructure/http";
import { visibleRows } from "@/infrastructure/rbac-filter";

export { idsDeRuta };

/**
 * `Pick<Db, "select" | "update">` y no `Db` completo ni el tipo estrecho de
 * `tx` (`Parameters<Parameters<Db["transaction"]>[0]>[0]`): el objeto que
 * abre `transaction()` no trae `$client` (solo lo tiene la conexión raíz que
 * devuelve `getDb()`), así que ninguno de los dos tipos completos acepta al
 * otro. Pedir solo los dos métodos que estos helpers usan deja pasar
 * cualquiera de los dos indistintamente: dentro de una `transaction()` (donde
 * importa que la lectura vea lo que la propia transacción ya escribió) y
 * fuera de ella con `getDb()`, para una comprobación de solo lectura que no
 * necesita bloquear nada (`fotos/route.ts`: la subida a Storage no puede
 * vivir dentro de un `BEGIN` de Postgres).
 */
type Consultable = Pick<Db, "select" | "update">;

/**
 * El proyecto existe, no está borrado y el actor lo alcanza — mismo criterio
 * que `api/proyectos/[id]/route.ts`.
 *
 * `lock`: `for("update")` bloquea la fila del proyecto hasta que termine la
 * transacción — lo usa `fases/route.ts` (POST) para que dos altas
 * concurrentes sobre el mismo proyecto (plantilla o fase suelta) se
 * serialicen; sin esto, las dos leen "sin fases" (o el mismo `max(position)`)
 * bajo READ COMMITTED y la segunda choca con el índice único en vez de un 409
 * limpio o la siguiente posición correcta.
 */
export async function proyectoVisible(db: Consultable, actor: Actor, scope: PermissionScope, projectId: number, lock = false) {
  const consulta = db
    .select({ id: projects.id })
    .from(projects)
    .where(and(eq(projects.id, projectId), visibleRows(actor, scope, projects.brokerId, projects.deletedAt)))
    .limit(1);
  const [fila] = await (lock ? consulta.for("update") : consulta);
  return fila ?? null;
}

/**
 * La fase existe, pertenece a ese proyecto, y el proyecto está dentro del
 * alcance del actor. La tabla no tiene `deleted_at` (esquema congelado, sin
 * papelera): "no existe" y "está fuera de alcance" son los únicos casos.
 */
export async function faseVisible(db: Consultable, actor: Actor, scope: PermissionScope, projectId: number, faseId: number) {
  const proyecto = await proyectoVisible(db, actor, scope, projectId);
  if (!proyecto) return null;
  const [fila] = await db
    .select()
    .from(constructionPhases)
    .where(and(eq(constructionPhases.id, faseId), eq(constructionPhases.projectId, projectId)))
    .limit(1);
  return fila ?? null;
}

/** Promedio de `progress_percent` de las fases restantes del proyecto, cacheado en `projects.progress_percent`. */
export async function recalcularProgreso(tx: Consultable, projectId: number): Promise<void> {
  const filas = await tx
    .select({ progressPercent: constructionPhases.progressPercent })
    .from(constructionPhases)
    .where(eq(constructionPhases.projectId, projectId));
  await tx
    .update(projects)
    .set({ progressPercent: promedioAvance(filas.map((f) => f.progressPercent)) })
    .where(eq(projects.id, projectId));
}
