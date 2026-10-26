import { NextResponse } from "next/server";
import { buscarEnCrm } from "@/application/busqueda/consultas";
import { requireScope } from "@/domain/rbac";
import { requireActor } from "@/infrastructure/auth/actor";
import { busquedaParaLectura } from "@/infrastructure/contenedor/busqueda";
import { errorResponse } from "@/infrastructure/http";

export async function GET(request: Request) {
  try {
    const actor = await requireActor();
    requireScope(actor, "dashboard", "view");

    const url = new URL(request.url);
    const q = url.searchParams.get("q") ?? "";
    const resultados = await buscarEnCrm(busquedaParaLectura(), actor, q);
    return NextResponse.json({ resultados });
  } catch (error) {
    return errorResponse(error);
  }
}
