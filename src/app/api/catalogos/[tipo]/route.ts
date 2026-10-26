/**
 * M13 · Catálogos — alta (`docs/F2_ANALISIS_Y_PLAN.md` paso 5). Motivos de
 * pérdida y canales comparten ruta: tienen la forma exacta (`slug`, `name`,
 * `position`, `isActive`), así que un solo par de route handlers parametrizados
 * por `[tipo]`. El caso de uso y el repositorio son genéricos
 * (`application/catalogos/`).
 */

import { CrearEntradaInput } from "@/application/catalogos/entrada";
import { crearEntradaCatalogo, esTipoCatalogo } from "@/application/catalogos/casos-de-uso";
import type { EntradaCrearCatalogo } from "@/application/catalogos/casos-de-uso";
import { NotFoundError } from "@/domain/errors";
import { requireFullScope } from "@/domain/rbac";
import { requireActor } from "@/infrastructure/auth/actor";
import { catalogosParaEscritura } from "@/infrastructure/contenedor/catalogos";
import { errorResponse, parseInput } from "@/infrastructure/http";

export async function POST(request: Request, { params }: { params: Promise<{ tipo: string }> }) {
  try {
    const { tipo } = await params;
    if (!esTipoCatalogo(tipo)) throw new NotFoundError("Catálogo no reconocido.");

    const datos = parseInput(CrearEntradaInput, await request.json().catch(() => ({})));
    const actor = await requireActor();
    requireFullScope(actor, "settings", "create");

    const entrada: EntradaCrearCatalogo = { name: datos.name };
    if (datos.position !== undefined) entrada.position = datos.position;

    const resultado = await crearEntradaCatalogo(catalogosParaEscritura(), actor, tipo, entrada);

    return Response.json({ ok: true, entrada: resultado });
  } catch (error) {
    return errorResponse(error);
  }
}
