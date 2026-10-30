/** Webhook WhatsApp entrante (YCloud o Cloud API). Crea/actualiza el lead por teléfono (idempotente por mensaje). */
import { capturarLeadExterno } from "@/application/leads/casos-de-uso";
import { conOrigen, guardarAtribucion, toquesDeCaptura } from "@/infrastructure/seguimiento/captura";
import { leadsParaEscritura } from "@/infrastructure/contenedor/leads";
import { firmaMetaValida, firmaYCloudValida, parsearWebhookWhatsApp, verificarRetoMeta } from "@/infrastructure/proveedores-externos";

export async function GET(request: Request) {
  const reto = verificarRetoMeta(new URL(request.url).searchParams);
  return reto ? new Response(reto, { status: 200 }) : new Response("Forbidden", { status: 403 });
}

export async function POST(request: Request) {
  const raw = await request.text();
  if (raw.length > 256 * 1024) return new Response("Too large", { status: 413 });
  const ycloud = request.headers.get("ycloud-signature");
  const valida = ycloud
    ? firmaYCloudValida(raw, ycloud, process.env.YCLOUD_WEBHOOK_SECRET ?? "")
    : firmaMetaValida(raw, request.headers.get("x-hub-signature-256"), process.env.META_APP_SECRET ?? "");
  if (!valida) return Response.json({ error: "Firma inválida." }, { status: 401 });
  let cuerpo: unknown;
  try { cuerpo = JSON.parse(raw); } catch { return new Response("Bad JSON", { status: 400 }); }
  let recibidos = 0;
  for (const m of parsearWebhookWhatsApp(cuerpo)) {
    // El código `[QH-xxxxxxx]` viaja en el primer mensaje: ahí se sabe de qué video/anuncio viene.
    const toques = await toquesDeCaptura({ canal: "whatsapp", texto: m.texto });
    const { lead } = await capturarLeadExterno(leadsParaEscritura(), conOrigen({
      externalId: `wa_${m.de.replace(/\D/g, "")}`,
      fullName: `WhatsApp ${m.de}`,
      phone: m.de,
      originalMessage: m.texto.slice(0, 2000),
      utmSource: "whatsapp", utmMedium: "inbound",
    }, toques));
    await guardarAtribucion(lead, toques);
    recibidos++;
  }
  return Response.json({ ok: true, recibidos });
}
