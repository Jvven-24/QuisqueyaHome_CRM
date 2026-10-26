/**
 * Asignación sugerida de broker por especialidad (M2, decisión #21).
 *
 * Función pura, sin acceso a base de datos — el route handler (manual y
 * externo) consulta los candidatos en `broker_profiles` + `users` (activos, sin
 * papelera) y le pasa la lista aquí; la decisión de a cuál sugerir es dominio
 * puro y se prueba con `node --test`, igual que `rbac.ts`.
 *
 * **Nunca escribe `broker_id`.** Decisión #21: el resultado es
 * `leads.suggested_broker_id`, una propuesta que alguien confirma — repartir
 * trabajo en automático sin que nadie mire, en un equipo de tres personas,
 * produce leads en el buzón equivocado y nadie se entera hasta que el cliente
 * llama.
 */

export type InteresLead = {
  /** Texto libre del proyecto consultado (`leads.project_interest_text`). */
  projectInterestText: string | null;
  /** Zona de interés (`leads.zone_interest`). */
  zoneInterest: string | null;
  operationType: "sale" | "rent" | null;
};

export type BrokerCandidato = {
  userId: number;
  /** Ej. "Proyectos en planos", "Alquileres". */
  specialty: string | null;
  handlesRentals: boolean;
  /** Ventas del año, para desempatar repartiendo carga hacia quien vende menos. */
  annualSalesCents: number;
};

/**
 * `specialty` es texto libre (§10.3 #1 solo pide una condición sobre dos
 * columnas, no un motor de reglas configurable): "Proyectos en planos" y
 * "Praderas de Punta Cana — en planos" no son subcadena la una de la otra,
 * pero comparten la palabra que importa. Por eso la coincidencia es por
 * palabra (≥4 letras, para no disparar con conectores como "en" o "de"), sin
 * distinguir mayúsculas — no una subcadena completa en ninguna dirección.
 */
function palabrasClave(texto: string): string[] {
  return texto
    .toLowerCase()
    .split(/[^\p{L}\p{N}]+/u)
    .filter((palabra) => palabra.length >= 4);
}

function coincideEspecialidad(specialty: string, texto: string): boolean {
  const palabrasEspecialidad = palabrasClave(specialty);
  const palabrasTexto = new Set(palabrasClave(texto));
  return palabrasEspecialidad.some((palabra) => palabrasTexto.has(palabra));
}

function coincide(lead: InteresLead, candidato: BrokerCandidato): boolean {
  if (lead.operationType === "rent" && candidato.handlesRentals) return true;

  if (!candidato.specialty) return false;
  const interes = [lead.projectInterestText, lead.zoneInterest].filter(
    (texto): texto is string => Boolean(texto && texto.trim()),
  );
  return interes.some((texto) => coincideEspecialidad(candidato.specialty!, texto));
}

/**
 * Devuelve el `userId` sugerido, o `null` si ningún candidato coincide.
 *
 * Desempate con varios candidatos: el de menor `annualSalesCents` — reparte
 * carga hacia quien menos ha vendido en el año en vez de sugerir siempre al
 * mismo top producer, que es justo lo que el nivel de brokers (§8.3) ya
 * recompensa por otro lado. Ante empate exacto, se conserva el primero en el
 * orden recibido (desempate estable, no arbitrario: el orden lo decide quien
 * arma la lista de candidatos, no esta función).
 */
export function sugerirBroker(
  lead: InteresLead,
  candidatos: readonly BrokerCandidato[],
): number | null {
  const coincidencias = candidatos.filter((candidato) => coincide(lead, candidato));
  if (coincidencias.length === 0) return null;

  const elegido = coincidencias.reduce((menor, actual) =>
    actual.annualSalesCents < menor.annualSalesCents ? actual : menor,
  );
  return elegido.userId;
}
