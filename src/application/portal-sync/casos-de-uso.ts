/**
 * Reconciliación idempotente CRM → portal. El CRM manda: crea/actualiza lo publicado cuyo contenido cambió y retira del
 * portal lo que el CRM ya no publica. Se puede ejecutar N veces con el mismo resultado; el webhook «al publicar» solo
 * adelanta lo que este trabajo garantiza. Detrás de la bandera `PORTAL_SYNC_ENABLED`.
 */
import { ConflictError } from "../../domain/errors.ts";
import { huellaDe } from "./proyeccion.ts";
import type { Accion, FuenteProyectos, PuertoPortal, ResultadoSync } from "./tipos.ts";

export type EntornoSync = Record<string, string | undefined>;

export const portalSyncHabilitado = (env: EntornoSync): boolean => ["1", "true", "si", "sí"].includes((env.PORTAL_SYNC_ENABLED ?? "").trim().toLowerCase());

export function exigirPortalSync(env: EntornoSync): void {
  if (!portalSyncHabilitado(env)) throw new ConflictError("La sincronización con el portal está desactivada (PORTAL_SYNC_ENABLED).");
}

export async function planificar(deps: { fuente: FuenteProyectos; portal: PuertoPortal }) {
  const [crm, portal] = await Promise.all([deps.fuente.proyectosPublicables(), deps.portal.listar()]);
  const enPortal = new Map(portal.map((e) => [e.slug, e.huella]));
  const acciones: Accion[] = [];
  const pendientes = new Map<string, { proyecto: (typeof crm)[number]; huella: string }>();
  for (const proyecto of crm) {
    const huella = huellaDe(proyecto);
    const previa = enPortal.get(proyecto.slug);
    const tipo = previa === undefined ? "crear" : previa === huella ? "sin_cambios" : "actualizar";
    acciones.push({ tipo, slug: proyecto.slug });
    if (tipo !== "sin_cambios") pendientes.set(proyecto.slug, { proyecto, huella });
  }
  const vigentes = new Set(crm.map((p) => p.slug));
  for (const e of portal) if (!vigentes.has(e.slug)) acciones.push({ tipo: "retirar", slug: e.slug });
  return { acciones, pendientes };
}

export async function reconciliarPortal(deps: { fuente: FuenteProyectos; portal: PuertoPortal }, opciones: { simulacro?: boolean } = {}): Promise<ResultadoSync> {
  const { acciones, pendientes } = await planificar(deps);
  const r: ResultadoSync = { simulacro: Boolean(opciones.simulacro), creados: 0, actualizados: 0, retirados: 0, sinCambios: 0, errores: [], acciones };
  for (const a of acciones) {
    if (a.tipo === "sin_cambios") { r.sinCambios++; continue; }
    if (!r.simulacro) {
      try {
        if (a.tipo === "retirar") await deps.portal.retirar(a.slug);
        else { const p = pendientes.get(a.slug)!; await deps.portal.publicar(p.proyecto, p.huella); }
      } catch (e) {
        // Un proyecto que falla no frena a los demás; el siguiente ciclo lo reintenta.
        r.errores.push({ slug: a.slug, error: e instanceof Error ? e.message.slice(0, 200) : "Error desconocido" });
        continue;
      }
    }
    if (a.tipo === "crear") r.creados++; else if (a.tipo === "actualizar") r.actualizados++; else r.retirados++;
  }
  return r;
}
