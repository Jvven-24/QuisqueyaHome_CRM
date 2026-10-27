/**
 * Listas de usuarios de la Agenda, separadas por propósito (revisión cruzada d7c592f).
 *
 * - `personas` (consulta: filtro por broker y vista «Por Broker») sigue el
 *   alcance de VER actividades. Con «ver como» (readOnly) crear es `none`, pero
 *   la consulta debe seguir poblada.
 * - `asignables` (selector de responsable) sigue la regla del servidor:
 *   `validarReferencias` solo deja asignar a otra persona con crear `all`. Con
 *   `own`/`team` solo se ofrece el propio actor; con `none`, nada.
 *
 * Pura: recibe los usuarios activos y decide con `scopeFor`/`reaches` de dominio.
 */

import { reaches, scopeFor, type Actor } from "../../../../domain/rbac.ts";

export type PersonaAgenda = { id: number; fullName: string };

export type ListasAgenda = {
  personas: PersonaAgenda[];
  asignables: PersonaAgenda[];
  puedeCrear: boolean;
};

export function listasAgenda(actor: Actor, usuariosActivos: readonly PersonaAgenda[]): ListasAgenda {
  const scopeVer = scopeFor(actor, "activities", "view");
  const scopeCrear = scopeFor(actor, "activities", "create");
  const personas = usuariosActivos.filter((u) => reaches(actor, scopeVer, u.id));
  const asignables =
    scopeCrear === "none"
      ? []
      : scopeCrear === "all"
        ? usuariosActivos.filter((u) => reaches(actor, "all", u.id))
        : usuariosActivos.filter((u) => u.id === actor.userId);
  return { personas, asignables, puedeCrear: scopeCrear !== "none" };
}
