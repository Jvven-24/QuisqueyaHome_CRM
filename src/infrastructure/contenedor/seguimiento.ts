/** Contenedor de Seguimiento de origen: arma el repositorio y el enriquecedor de Meta Ads para sus rutas. */
import type { Enriquecedor } from "../../application/seguimiento/casos-de-uso";
import type { RepoSeguimiento } from "../../application/seguimiento/puertos";
import { enriquecerAnuncioMeta } from "../db/repos/oauth-conexiones";
import { datosAnaliticaOrigen, repoSeguimiento } from "../db/repos/seguimiento";

export function seguimientoParaEscritura(): { repo: RepoSeguimiento; enriquecer: Enriquecedor } {
  return { repo: repoSeguimiento(), enriquecer: enriquecerAnuncioMeta };
}

export const seguimientoParaLectura = (): RepoSeguimiento => repoSeguimiento();

export const analiticaOrigenDatos = datosAnaliticaOrigen;
