import { ConflictError } from "../../domain/errors.ts";
import type { CrmPort, ContextoCrm, RefExterna } from "../compartido/crm.ts";

export function crmEnMemoria(): CrmPort & { readonly registros: readonly string[] } {
  const operaciones = new Map<string, { datos: string; ref: RefExterna }>();
  const registros: string[] = [];
  async function registrar(tipo: string, datos: { id: number }, contexto: ContextoCrm) {
    const serializado = JSON.stringify({ tipo, datos, version: contexto.version });
    const previo = operaciones.get(contexto.idempotencyKey);
    if (previo && previo.datos !== serializado) throw new ConflictError("Clave de idempotencia reutilizada con otros datos.");
    if (previo) return { ...previo.ref };
    const ref = { system: "local", externalId: `${tipo}:${datos.id}` };
    operaciones.set(contexto.idempotencyKey, { datos: serializado, ref });
    registros.push(tipo);
    return { ...ref };
  }
  return {
    registros,
    reflejarContacto: (datos, contexto) => registrar("contact", datos, contexto),
    reflejarNegocio: (datos, contexto) => registrar("deal", datos, contexto),
    registrarActividad: (datos, contexto) => registrar("activity", datos, contexto),
    async salud() { return "disponible"; },
  };
}
