import { requireFullScope, type Actor } from "../../domain/rbac.ts";
export type MetadatoAuditoria = { id: number; userId: number | null; action: string; entityType: string; entityId: number | null; createdAt: Date };
export type AuditoriaConfiguracionRepositorio = { listarMetadatos: () => Promise<MetadatoAuditoria[]> };
export async function consultarAuditoriaConfiguracion(repo: AuditoriaConfiguracionRepositorio, actor: Actor) {
  requireFullScope(actor, "settings", "view");
  requireFullScope(actor, "audit_log", "view");
  return repo.listarMetadatos();
}
