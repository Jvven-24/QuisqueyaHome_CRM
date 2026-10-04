import { crmParaIntegraciones } from "@/infrastructure/contenedor/crm";
import { getDb } from "@/infrastructure/db/client";
import { colaOutboxDrizzle } from "./repositorio";
import { procesarOutbox } from "./worker";

/** Entrada del worker como módulo; no arranca servidor ni scheduler al importar. */
export async function ejecutarLoteOutbox(limite = 100): Promise<number> {
  return procesarOutbox({ cola: colaOutboxDrizzle(getDb()), crm: crmParaIntegraciones() }, limite);
}
