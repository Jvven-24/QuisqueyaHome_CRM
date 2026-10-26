import catalogo from "./integraciones-catalogo.json" with { type: "json" };
/** Inventario de configuración. Presencia de variables nunca acredita conexión. */
export type IntegracionDef = { id: string; nombre: string; categoria: string; variables: readonly string[]; docs: string; pasos: readonly string[]; falta: string };
export const INTEGRACIONES: readonly IntegracionDef[] = catalogo;
export type PresenciaIntegraciones = Record<string, { presentes: string[]; faltantes: string[] }>;
export function estadoDeVariables(def: IntegracionDef, presencia: PresenciaIntegraciones | undefined): string {
  if (!def.variables.length) return "Backend pendiente";
  const p = presencia?.[def.id];
  if (!p) return "Sin lectura de configuración";
  return p.faltantes.length ? "Sin configurar / incompleta" : "Variables presentes · conexión sin verificar";
}
