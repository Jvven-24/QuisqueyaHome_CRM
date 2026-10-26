import type { UnidadDeTrabajo } from "../../application/compartido/unidad-de-trabajo";
import type { ReposActividades, RepositorioActividades } from "../../application/actividades/puertos";
import { getDb } from "../db/client";
import { reposActividades, repositorioActividades } from "../db/repos/actividades";
import { unidadDeTrabajoDrizzle } from "../db/repos/compartido";

export function actividadesParaEscritura(): { actividades: RepositorioActividades; unidad: UnidadDeTrabajo<ReposActividades> } {
  return { actividades: repositorioActividades(getDb()), unidad: unidadDeTrabajoDrizzle(reposActividades) };
}

export function actividadesParaLectura(): { actividades: RepositorioActividades } {
  return { actividades: repositorioActividades(getDb()) };
}
