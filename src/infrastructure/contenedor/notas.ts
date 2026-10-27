import { getDb } from "../db/client";
import { reposNotas, repositorioNotas } from "../db/repos/notas";
import { unidadDeTrabajoDrizzle } from "../db/repos/compartido";
export function notasParaLectura() { return repositorioNotas(getDb()); }
export function notasParaEscritura() { return unidadDeTrabajoDrizzle(reposNotas); }
