/** Fuente de la sincronización con el portal: proyectos publicados y activos con sus unidades (solo campos públicos). */
import { and, asc, eq, isNull } from "drizzle-orm";
import { proyectarProyecto } from "../../../application/portal-sync/proyeccion";
import type { FuenteProyectos } from "../../../application/portal-sync/tipos";
import { getDb } from "../client";
import { projects, units } from "../schema";

export function fuenteProyectosPublicables(): FuenteProyectos {
  return {
    async proyectosPublicables() {
      const db = getDb();
      const ps = await db.select().from(projects).where(and(eq(projects.isPublished, true), eq(projects.isActive, true), isNull(projects.deletedAt))).orderBy(asc(projects.slug));
      const salida = [];
      for (const p of ps) {
        const us = await db.select().from(units).where(and(eq(units.projectId, p.id), isNull(units.deletedAt)));
        salida.push(proyectarProyecto(p, us));
      }
      return salida;
    },
  };
}
