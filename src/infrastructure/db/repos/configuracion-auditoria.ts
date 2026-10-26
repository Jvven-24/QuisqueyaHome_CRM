import { desc } from "drizzle-orm";
import type { AuditoriaConfiguracionRepositorio } from "../../../application/configuracion/auditoria";
import type { Db } from "../client";
import { auditLog } from "../schema";
export function repositorioAuditoriaConfiguracion(db: Db): AuditoriaConfiguracionRepositorio {
  return { listarMetadatos: () => db.select({ id: auditLog.id, userId: auditLog.userId, action: auditLog.action, entityType: auditLog.entityType, entityId: auditLog.entityId, createdAt: auditLog.createdAt }).from(auditLog).orderBy(desc(auditLog.createdAt), desc(auditLog.id)).limit(200) };
}
