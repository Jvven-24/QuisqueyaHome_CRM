import { scopeFor, type Actor } from "../../../../domain/rbac.ts";
import type { PreviewConfig } from "../../reservas/_componentes/preview-types";

/** Las reglas son configuración global: no admiten edición propia o por equipo. */
export function rulesConfigFor(actor: Actor, config: PreviewConfig): PreviewConfig {
  return {
    ...config,
    actions: scopeFor(actor, "commissions", "edit") === "all" ? config.actions : [],
  };
}
