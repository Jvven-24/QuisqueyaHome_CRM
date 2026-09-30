/**
 * Puente temporal para `app/(crm)/leads/page.tsx`.
 *
 * La lógica de "brokers activos con perfil" (decisión #21 y asignación manual,
 * issue #22) ya vive en el módulo: `RepositorioLeads.candidatosBroker`
 * (`application/leads/puertos.ts`, su adaptador Drizzle en `repos/leads.ts`).
 * Las tres rutas (alta, asignación y webhook) la usan desde ahí.
 *
 * Este archivo solo se conserva porque la página de leads todavía lo importa y
 * está fuera del alcance de R3.2. Se elimina en R4.1, cuando la página pase a
 * `consultas.ts`. El parámetro se ignora: la conexión es la misma.
 */

import { leadsParaEscritura } from "@/infrastructure/contenedor/leads";

// eslint-disable-next-line @typescript-eslint/no-unused-vars -- la página aún pasa `db`
export async function candidatosBroker(_db?: unknown) {
  return leadsParaEscritura().leads.candidatosBroker();
}
