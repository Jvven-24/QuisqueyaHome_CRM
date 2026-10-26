import type { RepositorioBusquedaGlobal } from "../../application/busqueda/consultas";
import { getDb } from "../db/client";
import { repositorioBusquedaGlobal } from "../db/repos/busqueda";

export function busquedaParaLectura(): { busqueda: RepositorioBusquedaGlobal } {
  return { busqueda: repositorioBusquedaGlobal(getDb()) };
}
