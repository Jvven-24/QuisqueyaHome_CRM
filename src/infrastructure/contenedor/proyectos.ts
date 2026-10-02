/** Contenedor de R3.4; `getDb()` queda dentro de cada fábrica. */
import type { AlmacenamientoArchivos } from "../../application/compartido/almacenamiento";
import type { UnidadDeTrabajo } from "../../application/compartido/unidad-de-trabajo";
import type { ReposProyectos, RepositorioProyectos } from "../../application/proyectos/puertos";
import { getDb } from "../db/client";
import { reposProyectos, repositorioProyectos } from "../db/repos/proyectos";
import { unidadDeTrabajoDrizzle } from "../db/repos/compartido";
import { almacenamientoSupabase } from "./compartido";

export function proyectosParaEscritura(): { proyectos: RepositorioProyectos; unidad: UnidadDeTrabajo<ReposProyectos>; almacenamiento: AlmacenamientoArchivos } { return { proyectos: repositorioProyectos(getDb()), unidad: unidadDeTrabajoDrizzle(reposProyectos), almacenamiento: almacenamientoSupabase("avances-obra") }; }
