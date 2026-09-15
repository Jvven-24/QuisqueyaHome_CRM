/**
 * M13 · Catálogos — alta (`docs/F2_ANALISIS_Y_PLAN.md` paso 5). Ver
 * `./_tablas.ts` para por qué motivos de pérdida y canales comparten ruta.
 */

import { like, or } from "drizzle-orm";
import { z } from "zod";
import { NotFoundError } from "@/domain/errors";
import { requireScope } from "@/domain/rbac";
import { slugify } from "@/domain/slug";
import { requireActor } from "@/infrastructure/auth/actor";
import { auditar } from "@/infrastructure/audit";
import { transaction } from "@/infrastructure/db/client";
import { errorResponse, parseInput } from "@/infrastructure/http";
import { resolverCatalogo } from "./_tablas";

const CrearEntradaInput = z.object({
  name: z.string({ error: "Escribe el nombre." }).min(1, "Escribe el nombre."),
  position: z.coerce.number().int().nonnegative().optional(),
});

export async function POST(request: Request, { params }: { params: Promise<{ tipo: string }> }) {
  try {
    const { tipo } = await params;
    const catalogo = resolverCatalogo(tipo);
    if (!catalogo) throw new NotFoundError("Catálogo no reconocido.");

    const datos = parseInput(CrearEntradaInput, await request.json().catch(() => ({})));
    const actor = await requireActor();
    requireScope(actor, "settings", "create");

    const resultado = await transaction(async (tx) => {
      const base = slugify(datos.name) || "elemento";
      // Mismo criterio que `api/proyectos/route.ts`: catálogos pequeños,
      // administrados por una sola persona a la vez, no hace falta más que
      // contar coincidencias dentro de la transacción.
      const existentes = await tx
        .select({ slug: catalogo.tabla.slug })
        .from(catalogo.tabla)
        .where(or(like(catalogo.tabla.slug, base), like(catalogo.tabla.slug, `${base}-%`)));
      const slug = existentes.length === 0 ? base : `${base}-${existentes.length + 1}`;

      const [fila] = await tx.insert(catalogo.tabla).values({ slug, name: datos.name, position: datos.position ?? 0 }).returning();

      await auditar(tx, actor, { accion: "crear", entidad: catalogo.entidad, entidadId: fila!.id, despues: fila });

      return fila!;
    });

    return Response.json({ ok: true, entrada: resultado });
  } catch (error) {
    return errorResponse(error);
  }
}
