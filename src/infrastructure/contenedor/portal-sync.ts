/** Contenedor de la sincronización con el portal: arma fuente y adaptador solo si la bandera y la configuración están completas. */
import type { EntornoSync } from "../../application/portal-sync/casos-de-uso";
import { exigirPortalSync } from "../../application/portal-sync/casos-de-uso";
import type { FuenteProyectos, PuertoPortal } from "../../application/portal-sync/tipos";
import { ConflictError } from "../../domain/errors";
import { fuenteProyectosPublicables } from "../db/repos/portal-sync";
import { portalHttp } from "../portal-sync/adaptador-http";

export function portalSyncDeps(env: EntornoSync = process.env): { fuente: FuenteProyectos; portal: PuertoPortal } {
  exigirPortalSync(env);
  const baseUrl = env.PORTAL_SYNC_URL?.trim(); const secreto = env.PORTAL_SYNC_SECRET?.trim();
  if (!baseUrl || !secreto) throw new ConflictError("Faltan PORTAL_SYNC_URL y PORTAL_SYNC_SECRET para sincronizar con el portal.");
  return { fuente: fuenteProyectosPublicables(), portal: portalHttp({ baseUrl, secreto }) };
}
