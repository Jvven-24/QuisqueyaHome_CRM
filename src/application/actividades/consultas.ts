import { generarIcs } from "../../domain/ics.ts";
import type { Actor, PermissionScope } from "../../domain/rbac.ts";
import { fechaSantoDomingo, lunesDeLaSemana, medianocheSantoDomingo, sumarDias } from "../../domain/zona-horaria.ts";
import type { RepositorioActividades } from "./puertos.ts";

export async function exportarActividadesIcs(deps: { actividades: RepositorioActividades }, actor: Actor, alcance: PermissionScope, semana: string | null): Promise<{ ics: string; lunes: string }> {
  const lunes = lunesDeLaSemana(semana || fechaSantoDomingo(new Date()));
  const eventos = await deps.actividades.eventosIcs(actor, alcance, medianocheSantoDomingo(lunes), medianocheSantoDomingo(sumarDias(lunes, 5)));
  return { ics: generarIcs(eventos), lunes };
}
