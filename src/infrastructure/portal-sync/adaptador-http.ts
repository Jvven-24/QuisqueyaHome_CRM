/** Adaptador HTTP del portal (Express, puerto 8787 en la VPS). Contrato: ver docs en README.md de este directorio. */
import { firmar } from "../../application/portal-sync/firma.ts";
import type { EntradaPortal, ProyectoPublico, PuertoPortal } from "../../application/portal-sync/tipos.ts";

type Fetch = (url: string, init?: RequestInit) => Promise<Response>;
export type OpcionesPortalHttp = { baseUrl: string; secreto: string; fetch?: Fetch; ahora?: () => number; timeoutMs?: number };

/** https obligatorio salvo loopback (desarrollo). Evita enviar proyectos firmados por texto plano a internet. */
export function baseUrlValida(url: string): string {
  const u = new URL(url);
  const local = ["localhost", "127.0.0.1", "[::1]"].includes(u.hostname);
  if (u.protocol !== "https:" && !(u.protocol === "http:" && local)) throw new Error("PORTAL_SYNC_URL debe ser https (o http solo en localhost).");
  return u.origin;
}

export function portalHttp(o: OpcionesPortalHttp): PuertoPortal {
  const base = baseUrlValida(o.baseUrl);
  const f = o.fetch ?? fetch;
  const ahora = o.ahora ?? (() => Math.floor(Date.now() / 1000));
  async function llamar(metodo: "GET" | "PUT" | "DELETE", ruta: string, cuerpo = "", idem?: string): Promise<Response> {
    const ts = ahora();
    const headers: Record<string, string> = { "x-qh-timestamp": String(ts), "x-qh-signature": firmar(o.secreto, ts, metodo, ruta, cuerpo), accept: "application/json" };
    if (cuerpo) headers["content-type"] = "application/json";
    if (idem) headers["idempotency-key"] = idem;
    const r = await f(`${base}${ruta}`, { method: metodo, headers, body: cuerpo || undefined, redirect: "error", signal: AbortSignal.timeout(o.timeoutMs ?? 10_000) });
    if (!r.ok) throw new Error(`El portal respondió ${r.status} en ${metodo} ${ruta}.`);
    return r;
  }
  const rutaProyecto = (slug: string) => `/api/crm-sync/projects/${encodeURIComponent(slug)}`;
  return {
    async listar(): Promise<EntradaPortal[]> {
      const j = (await (await llamar("GET", "/api/crm-sync/projects")).json()) as { items?: { slug?: unknown; huella?: unknown; origen?: unknown }[] };
      // Solo lo que el CRM publicó: el contenido propio del portal nunca se retira desde aquí.
      return (j.items ?? []).filter((i) => i.origen === "crm" && typeof i.slug === "string" && typeof i.huella === "string").map((i) => ({ slug: i.slug as string, huella: i.huella as string }));
    },
    async publicar(p: ProyectoPublico, huella: string) { await llamar("PUT", rutaProyecto(p.slug), JSON.stringify({ huella, origen: "crm", proyecto: p }), huella); },
    async retirar(slug: string) { await llamar("DELETE", rutaProyecto(slug)); },
  };
}
