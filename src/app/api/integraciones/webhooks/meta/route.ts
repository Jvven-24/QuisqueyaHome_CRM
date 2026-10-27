/** Webhook Meta (Lead Ads): reto de verificación + firma X-Hub-Signature-256 + alta de lead idempotente. */
import { capturarLeadExterno } from "@/application/leads/casos-de-uso";
import { leadsParaEscritura } from "@/infrastructure/contenedor/leads";
import { firmaMetaValida, leadgenIds, leerLeadMeta, verificarRetoMeta } from "@/infrastructure/proveedores-externos";

export async function GET(request: Request) {
  const reto = verificarRetoMeta(new URL(request.url).searchParams);
  return reto ? new Response(reto, { status: 200 }) : new Response("Forbidden", { status: 403 });
}

export async function POST(request: Request) {
  const raw = await request.text();
  if (raw.length > 256 * 1024) return new Response("Too large", { status: 413 });
  if (!firmaMetaValida(raw, request.headers.get("x-hub-signature-256"), process.env.META_APP_SECRET ?? "")) {
    return Response.json({ error: "Firma inválida." }, { status: 401 });
  }
  let cuerpo: unknown;
  try { cuerpo = JSON.parse(raw); } catch { return new Response("Bad JSON", { status: 400 }); }
  let creados = 0;
  for (const { leadId, formId } of leadgenIds(cuerpo)) {
    const campos = (await leerLeadMeta(leadId)) ?? {};
    await capturarLeadExterno(leadsParaEscritura(), {
      externalId: `meta_lead_${leadId}`,
      fullName: campos.full_name || campos.nombre || `Lead Meta ${leadId}`,
      phone: campos.phone_number || undefined,
      email: campos.email || undefined,
      campaign: formId ? `meta_form_${formId}` : undefined,
      utmSource: "facebook", utmMedium: "lead_ads",
    });
    creados++;
  }
  return Response.json({ ok: true, creados });
}
