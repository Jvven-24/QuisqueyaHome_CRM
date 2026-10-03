/**
 * Contenedor de Reportes & BI: inyecta la conexión a la base para sus consultas.
 */

import type { ReportesRepositorio } from "../../application/reportes/puertos";
import { getDb } from "../db/client";
import { repositorioReportes } from "../db/repos/reportes";

export function reportesRepositorio(): ReportesRepositorio {
  const db = getDb();
  return repositorioReportes(db);
}
