import { createHash } from "node:crypto";
import { ConflictError } from "../../../domain/errors.ts";
import type { ContextoCrm, CrmPort } from "../../../application/compartido/crm.ts";

export type RegistroCrmLocal = { entityType: string; localId: number; correlationId: string };

/** No-op: registra referencias en el proceso, sin red ni datos personales. */
export function crmLocal(registrar: (registro: RegistroCrmLocal) => void = () => {}): CrmPort {
  const vistas = new Map<string, string>();
  async function reflejar(entityType: string, datos: { id: number }, contexto: ContextoCrm) {
    const hash = createHash("sha256").update(JSON.stringify({ entityType, datos, version: contexto.version })).digest("hex");
    const previo = vistas.get(contexto.idempotencyKey);
    if (previo && previo !== hash) throw new ConflictError("Clave de idempotencia reutilizada con otros datos.");
    if (!previo) {
      registrar({ entityType, localId: datos.id, correlationId: contexto.correlationId });
      vistas.set(contexto.idempotencyKey, hash);
    }
    return { system: "local", externalId: `${entityType}:${datos.id}` };
  }
  return {
    reflejarContacto: (datos, contexto) => reflejar("contact", datos, contexto),
    reflejarNegocio: (datos, contexto) => reflejar("deal", datos, contexto),
    registrarActividad: (datos, contexto) => reflejar("activity", datos, contexto),
    async salud() { return "disponible"; },
  };
}
