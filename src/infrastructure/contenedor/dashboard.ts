/**
 * Contenedor de Inicio / Dashboard: inyecta la conexión a la base para sus consultas.
 */

import type { DashboardRepositorio } from "../../application/dashboard/puertos";
import { getDb } from "../db/client";
import { repositorioDashboard } from "../db/repos/dashboard";

export function dashboardRepositorio(): DashboardRepositorio {
  const db = getDb();
  return repositorioDashboard(db);
}
