/**
 * Catálogo de servicios conectables por OAuth. Fuente única para scopes, textos y
 * variables de entorno. Scopes mínimos por servicio; los extras son incrementales
 * (se piden solo cuando el administrador activa esa capacidad).
 */
export type ProveedorId = "google" | "meta";
export type ServicioId = "search_console" | "analytics" | "gmail" | "calendar" | "meta_ads";
/** Clasificación de Google para la verificación de la app (OAuth consent). */
export type Sensibilidad = "basico" | "sensible" | "restringido";

export type Extra = { id: string; etiqueta: string; descripcion: string; scopes: readonly string[]; sensibilidad: Sensibilidad };
export type ServicioDef = {
  id: ServicioId;
  proveedor: ProveedorId;
  nombre: string;
  /** Qué hace el CRM con esta conexión (texto para el administrador). */
  uso: string;
  scopes: readonly string[];
  sensibilidad: Sensibilidad;
  extras?: readonly Extra[];
  /** API que hay que habilitar en el proyecto de Google Cloud / Meta. */
  api: string;
};

const G = "https://www.googleapis.com/auth/";

export const SERVICIOS: readonly ServicioDef[] = [
  {
    id: "search_console", proveedor: "google", nombre: "Google Search Console",
    uso: "Lee el rendimiento de búsqueda orgánica del portal (clics, impresiones, posición) para medir el origen de los leads.",
    scopes: [`${G}webmasters.readonly`], sensibilidad: "sensible", api: "Google Search Console API",
  },
  {
    id: "analytics", proveedor: "google", nombre: "Google Analytics 4",
    uso: "Lee sesiones, conversiones y fuentes de tráfico del portal para cruzarlas con los leads del CRM.",
    scopes: [`${G}analytics.readonly`], sensibilidad: "sensible", api: "Google Analytics Admin API y Google Analytics Data API",
  },
  {
    id: "gmail", proveedor: "google", nombre: "Gmail",
    uso: "Lee el correo de la cuenta conectada para asociar conversaciones a leads. El envío es opcional y se autoriza aparte.",
    scopes: [`${G}gmail.readonly`], sensibilidad: "restringido", api: "Gmail API",
    extras: [{ id: "enviar", etiqueta: "Permitir enviar correos", descripcion: "Autoriza enviar correos desde esta cuenta (seguimientos desde el CRM).", scopes: [`${G}gmail.send`], sensibilidad: "sensible" }],
  },
  {
    id: "calendar", proveedor: "google", nombre: "Google Calendar",
    uso: "Crea las visitas en el calendario del asesor y lista sus calendarios con permiso de escritura.",
    scopes: [`${G}calendar.calendarlist.readonly`, `${G}calendar.events`], sensibilidad: "sensible", api: "Google Calendar API",
  },
  {
    id: "meta_ads", proveedor: "meta", nombre: "Meta Ads",
    uso: "Lee campañas, anuncios y creativos de Meta Marketing API para enlazar cada lead con su anuncio de origen.",
    scopes: ["ads_read"], sensibilidad: "sensible", api: "Marketing API (Facebook Login for Business)",
  },
];

/** Scopes de identidad que Google pide siempre para saber qué cuenta se conectó. */
export const SCOPES_IDENTIDAD_GOOGLE = ["openid", "email"] as const;

export function servicioPorId(id: string): ServicioDef | undefined {
  return SERVICIOS.find((s) => s.id === id);
}

/** Scopes pedidos en un consentimiento: los del servicio más los extras activados. */
export function scopesSolicitados(servicio: ServicioDef, extras: readonly string[] = []): string[] {
  const adicionales = (servicio.extras ?? []).filter((e) => extras.includes(e.id)).flatMap((e) => e.scopes);
  return [...new Set([...servicio.scopes, ...adicionales])];
}

/** Scopes obligatorios que el usuario no concedió (en Google puede desmarcarlos). */
export function scopesFaltantes(servicio: ServicioDef, otorgados: string): string[] {
  const tiene = new Set(otorgados.split(/[\s,]+/).filter(Boolean));
  return servicio.scopes.filter((s) => !tiene.has(s));
}

/** Extras ya concedidos según los scopes guardados. */
export function extrasOtorgados(servicio: ServicioDef, otorgados: string): string[] {
  const tiene = new Set(otorgados.split(/[\s,]+/).filter(Boolean));
  return (servicio.extras ?? []).filter((e) => e.scopes.every((s) => tiene.has(s))).map((e) => e.id);
}

export const VARIABLES = {
  google: ["GOOGLE_OAUTH_CLIENT_ID", "GOOGLE_OAUTH_CLIENT_SECRET", "INTEGRATIONS_TOKEN_ENC_KEY", "INTEGRATIONS_PUBLIC_URL"],
  meta: ["META_APP_ID", "META_APP_SECRET", "META_LOGIN_CONFIG_ID", "INTEGRATIONS_TOKEN_ENC_KEY", "INTEGRATIONS_PUBLIC_URL"],
} as const satisfies Record<ProveedorId, readonly string[]>;

/** Variables obligatorias que faltan (META_LOGIN_CONFIG_ID es opcional: sin él se usa `scope`). */
export function variablesFaltantes(proveedor: ProveedorId, env: Record<string, string | undefined> = process.env): string[] {
  const obligatorias = proveedor === "google"
    ? ["GOOGLE_OAUTH_CLIENT_ID", "GOOGLE_OAUTH_CLIENT_SECRET"]
    : ["META_APP_ID", "META_APP_SECRET"];
  const faltan = obligatorias.filter((k) => !env[k]?.trim());
  if (!env.INTEGRATIONS_TOKEN_ENC_KEY?.trim() && !env.GOOGLE_TOKEN_ENC_KEY?.trim()) faltan.push("INTEGRATIONS_TOKEN_ENC_KEY");
  if (!urlPublica(env)) faltan.push("INTEGRATIONS_PUBLIC_URL");
  return faltan;
}

/** Origen público del CRM (sin barra final). Cae al origen del redirect de Google ya registrado. */
export function urlPublica(env: Record<string, string | undefined> = process.env): string {
  const base = env.INTEGRATIONS_PUBLIC_URL?.trim() || (env.GOOGLE_OAUTH_REDIRECT_URI?.trim() ? new URL(env.GOOGLE_OAUTH_REDIRECT_URI.trim()).origin : "");
  return base.replace(/\/+$/, "");
}

export function redirectUri(proveedor: ProveedorId, env: Record<string, string | undefined> = process.env): string {
  return `${urlPublica(env)}/api/integraciones/oauth/${proveedor}/callback`;
}
