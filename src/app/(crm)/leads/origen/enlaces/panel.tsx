"use client";
/** Enlaces de seguimiento: crear, copiar, activar/desactivar y ver clics → leads por enlace. */
import { useRouter } from "next/navigation";
import { useId, useRef, useState } from "react";
import { Check, Copy, Link2, MessageCircle, Globe } from "lucide-react";
import { Section } from "@/components/modulo/section";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";

export type EnlaceFila = {
  id: number; nombre: string; codigo: string; urlCorta: string; destino: "portal" | "whatsapp"; destinoDetalle: string;
  video: string | null; campana: string | null; activo: boolean; clics: number; visitantes: number; leads: number;
  adId: string | null; creativeId: string | null; creado: string;
};

const FOCO = "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy-700";
const CAMPO = `min-h-11 w-full rounded-lg border border-input-line bg-surface px-3 text-sm text-ink ${FOCO}`;
const BTN = `inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-input-line bg-surface px-3 text-sm font-semibold text-ink transition hover:bg-surface-hover disabled:cursor-not-allowed disabled:opacity-50 ${FOCO}`;
const BTN_PRIMARIO = { background: "var(--color-navy-900)", color: "#fff", borderColor: "var(--color-navy-900)" } as const;

function Campo({ etiqueta, ayuda, children, id }: { etiqueta: string; ayuda?: string; children: React.ReactNode; id: string }) {
  return (
    <div className="grid min-w-0 content-start gap-1">
      <label htmlFor={id} className="text-sm font-semibold text-ink">{etiqueta}</label>
      {children}
      {ayuda && <p id={`${id}-ayuda`} className="m-0 text-xs text-ink-muted">{ayuda}</p>}
    </div>
  );
}

async function copiar(texto: string): Promise<boolean> {
  try { await navigator.clipboard.writeText(texto); return true; } catch {
    const t = document.createElement("textarea"); t.value = texto; t.setAttribute("readonly", ""); t.style.position = "fixed"; t.style.opacity = "0";
    document.body.appendChild(t); t.select(); const ok = document.execCommand("copy"); t.remove(); return ok;
  }
}

function BotonCopiar({ url, etiqueta, onCopiado }: { url: string; etiqueta: string; onCopiado: (m: string) => void }) {
  const [ok, setOk] = useState(false);
  return (
    <button type="button" className={BTN} aria-label={`Copiar enlace de ${etiqueta}`} onClick={async () => {
      const bien = await copiar(url); setOk(bien); onCopiado(bien ? `Enlace de «${etiqueta}» copiado.` : "No se pudo copiar. Selecciona el enlace y cópialo a mano."); setTimeout(() => setOk(false), 2000);
    }}>
      {ok ? <Check aria-hidden="true" size={16} /> : <Copy aria-hidden="true" size={16} />}{ok ? "Copiado" : "Copiar"}
    </button>
  );
}

export function EnlacesPanel({ permitido, enlaces, puedeCrear, portalConfigurado, urlPublicaConfigurada }: { permitido: boolean; enlaces: EnlaceFila[]; puedeCrear: boolean; portalConfigurado: boolean; urlPublicaConfigurada: boolean }) {
  const router = useRouter();
  const uid = useId();
  const [destino, setDestino] = useState<"portal" | "whatsapp">("whatsapp");
  const [error, setError] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [creado, setCreado] = useState<{ nombre: string; urlCorta: string } | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const id = (n: string) => `${uid}-${n}`;

  if (!permitido) {
    return <Section title="Enlaces de seguimiento"><p className="m-0 text-sm text-ink">Solo el equipo con acceso total a Integraciones crea y administra estos enlaces. La analítica de origen sí está disponible en la pestaña anterior.</p></Section>;
  }

  async function crear(ev: React.FormEvent<HTMLFormElement>) {
    ev.preventDefault(); setError(null); setEnviando(true);
    const datos = Object.fromEntries(new FormData(ev.currentTarget).entries());
    const r = await fetch("/api/seguimiento/enlaces", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ...datos, destination: destino }) }).catch(() => null);
    const j = r ? await r.json().catch(() => ({})) : {};
    setEnviando(false);
    if (!r?.ok) { setError(j?.error ?? "No se pudo crear el enlace. Revisa tu conexión e inténtalo de nuevo."); return; }
    setCreado({ nombre: j.enlace.name, urlCorta: j.enlace.urlCorta }); formRef.current?.reset(); router.refresh();
  }

  async function activar(e: EnlaceFila, on: boolean) {
    const r = await fetch(`/api/seguimiento/enlaces/${e.id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ isActive: on }) }).catch(() => null);
    setAviso(r?.ok ? `«${e.nombre}» ${on ? "activado" : "desactivado"}.` : "No se pudo cambiar el estado del enlace."); router.refresh();
  }

  return (
    <div className="grid min-w-0 gap-4">
      <p role="status" aria-live="polite" className="sr-only">{aviso}</p>
      {!urlPublicaConfigurada && <p role="alert" className="m-0 rounded-lg border border-warning/30 bg-warning-bg p-3 text-sm text-ink">Falta la variable <code>INTEGRATIONS_PUBLIC_URL</code>: los enlaces se muestran con ruta relativa. Configúrala para copiar la URL completa.</p>}

      {puedeCrear ? (
        <Section title="Crear enlace">
          <form ref={formRef} onSubmit={crear} className="grid gap-4" aria-label="Crear enlace de seguimiento">
            <fieldset className="m-0 grid gap-2 border-0 p-0">
              <legend className="mb-1 p-0 text-sm font-semibold text-ink">¿A dónde lleva el enlace?</legend>
              <RadioGroup value={destino} onValueChange={(v) => setDestino(v as "portal" | "whatsapp")} className="grid gap-1 sm:grid-cols-2" aria-label="Destino">
                <label className="flex min-h-11 cursor-pointer items-center gap-1 text-sm text-ink"><RadioGroupItem value="whatsapp" id={id("d-wa")} /> <MessageCircle aria-hidden="true" size={16} /> WhatsApp (el código va en el mensaje)</label>
                <label className="flex min-h-11 cursor-pointer items-center gap-1 text-sm text-ink"><RadioGroupItem value="portal" id={id("d-po")} /> <Globe aria-hidden="true" size={16} /> Portal web (con UTM y código)</label>
              </RadioGroup>
            </fieldset>

            <div className="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(min(100%,17rem),1fr))]">
              <Campo id={id("name")} etiqueta="Nombre del enlace *" ayuda="Para reconocerlo en los reportes. Ej.: Video Torre Naco – reel 1."><input id={id("name")} name="name" required maxLength={120} className={CAMPO} aria-describedby={id("name-ayuda")} /></Campo>
              {destino === "whatsapp" ? (
                <>
                  <Campo id={id("phone")} etiqueta="Número de WhatsApp *" ayuda="Con código de país, solo dígitos. Ej.: 18095550100."><input id={id("phone")} name="whatsappPhone" required inputMode="tel" autoComplete="off" className={CAMPO} aria-describedby={id("phone-ayuda")} /></Campo>
                  <Campo id={id("text")} etiqueta="Mensaje prellenado" ayuda="Opcional. Se añade [QH-código] al final para saber de qué video viene."><input id={id("text")} name="whatsappText" maxLength={300} placeholder="Hola, vi su video y quiero información." className={CAMPO} aria-describedby={id("text-ayuda")} /></Campo>
                </>
              ) : (
                <Campo id={id("path")} etiqueta="Página del portal" ayuda={portalConfigurado ? "Ruta (/proyectos/torre) o URL del portal. Vacío = inicio." : "Falta PORTAL_PUBLIC_URL en el servidor: sin ella no se puede enlazar al portal."}><input id={id("path")} name="portalPath" maxLength={300} placeholder="/proyectos/torre-naco" className={CAMPO} aria-describedby={id("path-ayuda")} /></Campo>
              )}
              <Campo id={id("video")} etiqueta="URL del video" ayuda="Opcional. Queda guardada en cada lead."><input id={id("video")} name="videoUrl" type="url" maxLength={500} placeholder="https://www.facebook.com/…" className={CAMPO} aria-describedby={id("video-ayuda")} /></Campo>
              <Campo id={id("vtitle")} etiqueta="Título del video"><input id={id("vtitle")} name="videoTitle" maxLength={160} className={CAMPO} /></Campo>
              <Campo id={id("camp")} etiqueta="Campaña" ayuda="Si lo dejas vacío usamos el nombre."><input id={id("camp")} name="campaign" maxLength={160} className={CAMPO} aria-describedby={id("camp-ayuda")} /></Campo>
            </div>

            <details className="rounded-lg border border-line bg-surface-alt p-3 text-sm text-ink">
              <summary className={`min-h-11 cursor-pointer py-2 font-semibold ${FOCO}`}>Parámetros avanzados: UTM y anuncio de Meta</summary>
              <div className="mt-2 grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(min(100%,14rem),1fr))]">
                <Campo id={id("us")} etiqueta="utm_source" ayuda="Por defecto: facebook"><input id={id("us")} name="utmSource" maxLength={80} className={CAMPO} aria-describedby={id("us-ayuda")} /></Campo>
                <Campo id={id("um")} etiqueta="utm_medium" ayuda="Por defecto: video"><input id={id("um")} name="utmMedium" maxLength={80} className={CAMPO} aria-describedby={id("um-ayuda")} /></Campo>
                <Campo id={id("uc")} etiqueta="utm_campaign" ayuda="Por defecto: la campaña"><input id={id("uc")} name="utmCampaign" maxLength={80} className={CAMPO} aria-describedby={id("uc-ayuda")} /></Campo>
                <Campo id={id("ut")} etiqueta="utm_content"><input id={id("ut")} name="utmContent" maxLength={80} className={CAMPO} /></Campo>
                <Campo id={id("ux")} etiqueta="utm_term"><input id={id("ux")} name="utmTerm" maxLength={80} className={CAMPO} /></Campo>
                <Campo id={id("ad")} etiqueta="ID del anuncio (ad_id)" ayuda="Con Meta Ads conectado, completamos el creativo y la campaña."><input id={id("ad")} name="adId" inputMode="numeric" className={CAMPO} aria-describedby={id("ad-ayuda")} /></Campo>
                <Campo id={id("cr")} etiqueta="ID del creativo (creative_id)"><input id={id("cr")} name="creativeId" inputMode="numeric" className={CAMPO} /></Campo>
              </div>
            </details>

            {error && <p role="alert" className="m-0 rounded-lg border border-danger/30 bg-danger-bg p-3 text-sm text-ink">{error}</p>}
            <div><button type="submit" disabled={enviando || (destino === "portal" && !portalConfigurado)} className={BTN} style={BTN_PRIMARIO}><Link2 aria-hidden="true" size={16} />{enviando ? "Creando…" : "Crear enlace"}</button></div>
          </form>
          {creado && (
            <div role="status" className="mt-4 grid gap-2 rounded-lg border border-success/30 bg-success-bg p-3 text-sm text-ink">
              <strong className="font-bold">Enlace «{creado.nombre}» creado.</strong>
              <div className="flex flex-wrap items-center gap-2"><code className="min-w-0 flex-1 break-all rounded bg-surface px-2 py-1.5">{creado.urlCorta}</code><BotonCopiar url={creado.urlCorta} etiqueta={creado.nombre} onCopiado={setAviso} /></div>
              <p className="m-0 text-xs text-ink-muted">Pégalo en el anuncio, la descripción del video o el botón de la página de Facebook.</p>
            </div>
          )}
        </Section>
      ) : <p className="m-0 rounded-lg border border-line bg-surface-alt p-3 text-sm text-ink">Puedes ver los enlaces, pero no tienes permiso para crear nuevos.</p>}

      <Section title={`Enlaces (${enlaces.length})`}>
        {enlaces.length === 0 ? (
          <p className="m-0 text-sm text-ink">Aún no hay enlaces. Crea el primero arriba y úsalo en tu próximo video o anuncio: así sabrás cuántos leads trae cada uno.</p>
        ) : (
          <ul className="m-0 grid list-none gap-3 p-0">
            {enlaces.map((e) => (
              <li key={e.id} className="grid min-w-0 gap-3 rounded-xl border border-line bg-surface p-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)_auto] lg:items-center" style={{ opacity: e.activo ? 1 : 0.75 }}>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="m-0 break-words font-heading text-base font-bold text-navy-900">{e.nombre}</h3>
                    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-bold ${e.activo ? "border-success/30 bg-success-bg text-success" : "border-line bg-surface-alt text-ink-muted"}`}>{e.activo ? "Activo" : "Desactivado"}</span>
                  </div>
                  <p className="m-0 mt-1 break-all text-sm text-ink"><code>{e.urlCorta}</code></p>
                  <p className="m-0 mt-1 text-xs text-ink-muted">{e.destinoDetalle}{e.video ? ` · ${e.video}` : ""}{e.campana ? ` · ${e.campana}` : ""}{e.adId ? ` · anuncio ${e.adId}` : ""}</p>
                </div>
                <dl className="m-0 grid grid-cols-3 gap-2 text-center">
                  {[["Visitantes", e.visitantes], ["Clics", e.clics], ["Leads", e.leads]].map(([k, v]) => (
                    <div key={k as string} className="rounded-lg bg-surface-alt px-2 py-1.5"><dt className="text-xs text-ink-muted">{k}</dt><dd className="m-0 font-heading text-lg font-bold text-navy-900">{v}</dd></div>
                  ))}
                </dl>
                <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                  <BotonCopiar url={e.urlCorta} etiqueta={e.nombre} onCopiado={setAviso} />
                  {puedeCrear && <label className="flex min-h-11 cursor-pointer items-center gap-0.5 text-sm text-ink"><Switch checked={e.activo} onCheckedChange={(on) => activar(e, on)} aria-label={`Enlace ${e.nombre} activo`} />{e.activo ? "Activo" : "Apagado"}</label>}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Section>
    </div>
  );
}
