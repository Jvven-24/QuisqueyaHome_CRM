/**
 * Prueba manual de integraciones (admin con settings:edit). Solo funciona con
 * INTEGRATIONS_TEST_MODE=1 y destinos de INTEGRATIONS_TEST_ALLOWLIST.
 */
import { z } from "zod";
import { requireScope } from "@/domain/rbac";
import { requireActor } from "@/infrastructure/auth/actor";
import { errorResponse, parseInput } from "@/infrastructure/http";
import { enviarCorreo, enviarWhatsApp, eventoCAPI } from "@/infrastructure/proveedores-externos";

const Input = z.object({ tipo: z.enum(["whatsapp", "correo", "capi"]), destino: z.string().optional() });

export async function POST(request: Request) {
  try {
    const actor = await requireActor();
    requireScope(actor, "settings", "edit");
    if (process.env.INTEGRATIONS_TEST_MODE !== "1") return Response.json({ error: "Modo prueba desactivado." }, { status: 403 });
    const { tipo, destino } = parseInput(Input, await request.json().catch(() => ({})));
    const texto = "[PRUEBA CRM] Mensaje de prueba de integraciones de Quisqueya Home CRM.";
    const r = tipo === "whatsapp" ? await enviarWhatsApp(destino ?? "", texto)
      : tipo === "correo" ? await enviarCorreo(destino ?? "", "[PRUEBA CRM]", `<p>${texto}</p>`)
      : await eventoCAPI({ nombre: "Lead", id: `prueba_${Date.now()}`, telefono: destino });
    return Response.json(r, { status: r.ok ? 200 : 502 });
  } catch (error) {
    return errorResponse(error);
  }
}
