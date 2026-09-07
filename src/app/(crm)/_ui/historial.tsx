/**
 * Historial de una entidad (T6): lee `audit_log` filtrado por `entidad` +
 * `entidadId`, ordenado por fecha descendente, con el nombre de quien hizo el
 * cambio.
 *
 * Componente de servidor de punta a punta, sin estado propio: se monta en la
 * ficha del contacto (M1) y en el inspector del negocio (M3), cada uno
 * pasándole su propia `entidad`/`entidadId`. Este archivo no decide permisos
 * ni filtra por alcance — quien lo monta ya pasó por `requireScopeInPage` para
 * llegar a la página en la que vive; `audit_log` no tiene `broker_id` (es un
 * registro transversal, no un recurso con responsable) y por eso no hay
 * `visibleRows` que aplicarle aquí.
 *
 * Fechas: Postgres guarda `created_at` en UTC (comentario en `db/schema.ts`,
 * decisión #13); la conversión a `America/Santo_Domingo` ocurre aquí, en la
 * capa de presentación, nunca antes.
 *
 * Usa `.activity-log` y `.timeline-list`, ambas del CSS portado del prototipo
 * (`referencia-prototipo/app/globals.css`) — no se añade CSS propio.
 */

import { and, desc, eq } from "drizzle-orm";
import type { EntityType } from "@/domain/catalogs";
import { getDb } from "@/infrastructure/db/client";
import { auditLog, users } from "@/infrastructure/db/schema";
import { Vacio } from "./estados";

/**
 * Etiqueta visible para cada valor de `AUDIT_ACTIONS` (`domain/catalogs.ts`).
 * Si `auditar` registrara una acción nueva sin actualizar este mapa, se
 * muestra el valor crudo (`?? fila.accion`) en vez de romper la vista.
 */
const ETIQUETAS_ACCION: Record<string, string> = {
  crear: "Creación",
  editar: "Edición",
  eliminar: "Eliminación",
  restaurar: "Restauración",
  convertir: "Conversión",
  cambiar_etapa: "Cambio de etapa",
  cerrar: "Cierre",
  marcar_perdido: "Marcado como perdido",
};

const formateadorFecha = new Intl.DateTimeFormat("es-DO", {
  timeZone: "America/Santo_Domingo",
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export async function Historial({
  entidad,
  entidadId,
}: {
  entidad: EntityType;
  entidadId: number;
}) {
  const filas = await getDb()
    .select({
      id: auditLog.id,
      accion: auditLog.action,
      creadoEn: auditLog.createdAt,
      autor: users.fullName,
    })
    .from(auditLog)
    // `leftJoin`, no `innerJoin`: `user_id` es nulable en el esquema (una
    // futura escritura sin actor humano no debe desaparecer del historial), y
    // un usuario dado de baja (papelera) sigue teniendo fila en `users`, pero
    // no hay que asumirlo.
    .leftJoin(users, eq(users.id, auditLog.userId))
    .where(and(eq(auditLog.entityType, entidad), eq(auditLog.entityId, entidadId)))
    .orderBy(desc(auditLog.createdAt));

  if (filas.length === 0) {
    return (
      <Vacio
        titulo="Sin historial"
        texto="Todavía no hay cambios registrados para este registro."
      />
    );
  }

  return (
    <div className="activity-log">
      <h3>Historial</h3>
      <div className="timeline-list">
        {filas.map((fila) => (
          <div key={fila.id}>
            <time dateTime={fila.creadoEn.toISOString()}>
              {formateadorFecha.format(fila.creadoEn)}
            </time>
            <span>
              <strong>{ETIQUETAS_ACCION[fila.accion] ?? fila.accion}</strong>
              <small>{fila.autor ?? "Usuario eliminado"}</small>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
