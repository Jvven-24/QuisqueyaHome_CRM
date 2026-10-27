/** Contenedor de metas por alcance: la unidad de trabajo Drizzle (ver `metas.ts`). */
import type { DepsMetasAlcance } from "../../application/metas/alcances";
import { unidadDeTrabajoDrizzle } from "../db/repos/compartido";
import { reposMetasAlcance } from "../db/repos/metas-alcances";

export function metasAlcanceParaEscritura(): DepsMetasAlcance {
  return { unidad: unidadDeTrabajoDrizzle(reposMetasAlcance) };
}
