/**
 * Historial de una entidad (T6): lee `audit_log` filtrado por `entidad` +
 * `entidadId`, ordenado por fecha descendente, con el nombre de quien hizo el
 * cambio.
 *
 * Componente de servidor de punta a punta, sin estado propio: se monta en la
 * ficha del contacto (M1), en la ficha de lead (M2) y en el inspector del
 * negocio (M3).
 *
 * Fechas: Postgres guarda `created_at` en UTC (comentario en `db/schema.ts`,
 * decisión #13); la conversión a `America/Santo_Domingo` ocurre aquí en la
 * capa de presentación.
 */

import { and, desc, eq } from "drizzle-orm";
import {
  ArrowRightCircle,
  CheckCircle2,
  Clock,
  FileEdit,
  PlusCircle,
  RotateCcw,
  Send,
  Trash2,
  Trophy,
  UserCheck,
  XCircle,
} from "lucide-react";
import type { EntityType } from "@/domain/catalogs";
import { getDb } from "@/infrastructure/db/client";
import { auditLog, users } from "@/infrastructure/db/schema";
import {
  Timeline,
  TimelineBody,
  TimelineConnector,
  TimelineContent,
  TimelineHeader,
  TimelineIcon,
  TimelineItem,
  TimelineTime,
  TimelineTitle,
} from "@/components/ui/timeline";
import { Vacio } from "./estados";

/**
 * Etiqueta visible para cada valor de `AUDIT_ACTIONS` (`domain/catalogs.ts`).
 */
const ETIQUETAS_ACCION: Record<string, string> = {
  crear: "Creación",
  editar: "Edición",
  eliminar: "Eliminación",
  restaurar: "Restauración",
  convertir: "Conversión",
  cambiar_etapa: "Cambio de etapa",
  cerrar: "Cierre exitoso",
  marcar_perdido: "Marcado como perdido",
  enviar: "Envío de mensaje",
  asignar: "Asignación de responsable",
};

const formateadorFecha = new Intl.DateTimeFormat("es-DO", {
  timeZone: "America/Santo_Domingo",
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

function obtenerIconoYEstilo(accion: string) {
  switch (accion) {
    case "cerrar":
      return {
        icono: <Trophy className="size-4 text-emerald-600" />,
        estilo: "bg-emerald-50 border-emerald-200 text-emerald-700",
      };
    case "convertir":
      return {
        icono: <CheckCircle2 className="size-4 text-emerald-600" />,
        estilo: "bg-emerald-50 border-emerald-200 text-emerald-700",
      };
    case "marcar_perdido":
    case "eliminar":
      return {
        icono: accion === "eliminar" ? <Trash2 className="size-4 text-red-600" /> : <XCircle className="size-4 text-red-600" />,
        estilo: "bg-red-50 border-red-200 text-red-700",
      };
    case "cambiar_etapa":
      return {
        icono: <ArrowRightCircle className="size-4 text-gold-700" />,
        estilo: "bg-gold-50 border-gold-300 text-gold-800",
      };
    case "crear":
      return {
        icono: <PlusCircle className="size-4 text-navy-700" />,
        estilo: "bg-navy-50 border-navy-200 text-navy-800",
      };
    case "asignar":
      return {
        icono: <UserCheck className="size-4 text-navy-600" />,
        estilo: "bg-navy-50 border-navy-200 text-navy-700",
      };
    case "editar":
      return {
        icono: <FileEdit className="size-4 text-ink-muted" />,
        estilo: "bg-surface border-line text-ink",
      };
    case "restaurar":
      return {
        icono: <RotateCcw className="size-4 text-navy-600" />,
        estilo: "bg-surface border-line text-navy-700",
      };
    case "enviar":
      return {
        icono: <Send className="size-4 text-navy-600" />,
        estilo: "bg-navy-50 border-navy-200 text-navy-700",
      };
    default:
      return {
        icono: <Clock className="size-4 text-ink-muted" />,
        estilo: "bg-surface border-line text-ink",
      };
  }
}

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
      <h3 className="m-0 mb-4 text-base font-bold text-ink">Historial de actividades</h3>
      <Timeline className="timeline-list">
        {filas.map((fila, index) => {
          const { icono, estilo } = obtenerIconoYEstilo(fila.accion);
          const esUltimo = index === filas.length - 1;

          return (
            <TimelineItem key={fila.id}>
              {!esUltimo && <TimelineConnector />}
              <TimelineIcon className={estilo}>
                {icono}
              </TimelineIcon>
              <TimelineContent>
                <TimelineHeader>
                  <TimelineTitle>
                    {ETIQUETAS_ACCION[fila.accion] ?? fila.accion}
                  </TimelineTitle>
                  <TimelineTime dateTime={fila.creadoEn.toISOString()}>
                    {formateadorFecha.format(fila.creadoEn)}
                  </TimelineTime>
                </TimelineHeader>
                <TimelineBody>
                  <span>Por {fila.autor ?? "Sistema"}</span>
                </TimelineBody>
              </TimelineContent>
            </TimelineItem>
          );
        })}
      </Timeline>
    </div>
  );
}
