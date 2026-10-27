import { z } from "zod";
import { contextoNotaSchema, textoNotaSchema, leerNotas, escribirNota } from "@/application/actividades/notas";
import { requireScope } from "@/domain/rbac";
import { requireActor } from "@/infrastructure/auth/actor";
import { notasParaLectura, notasParaEscritura } from "@/infrastructure/contenedor/notas";
import { errorResponse, parseInput } from "@/infrastructure/http";

export async function GET(request: Request) {
  try {
    const actor = await requireActor();
    requireScope(actor, "activities", "view");
    const contexto = parseInput(contextoNotaSchema, Object.fromEntries(new URL(request.url).searchParams));
    return Response.json(await leerNotas(notasParaLectura(), actor, contexto));
  } catch (error) { return errorResponse(error); }
}
async function mutar(request: Request, accion: "create" | "edit" | "delete") {
  try {
    const actor = await requireActor();
    requireScope(actor, "activities", accion);
    const schema = contextoNotaSchema.extend({ id: accion === "create" ? z.number().optional() : z.number().int().positive(), texto: accion === "delete" ? z.string().optional() : textoNotaSchema });
    const datos = parseInput(schema, await request.json().catch(() => ({})));
    await escribirNota(notasParaEscritura(), actor, datos, accion, datos.id, datos.texto);
    return Response.json({ ok: true });
  } catch (error) { return errorResponse(error); }
}
export async function POST(request: Request) { return mutar(request, "create"); }
export async function PATCH(request: Request) { return mutar(request, "edit"); }
export async function DELETE(request: Request) { return mutar(request, "delete"); }
