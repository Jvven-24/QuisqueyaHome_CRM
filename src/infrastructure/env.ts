/**
 * Contrato de configuración por entorno (T8).
 *
 * Todas las variables se leen aquí y en ningún otro sitio: un `process.env.X`
 * suelto en un módulo es una variable que nadie documenta y que revienta en
 * producción, no en desarrollo. El contrato vive en `.env.example`.
 */

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Falta la variable de entorno ${name}. Copia .env.example a .env. Ver docs/DESPLIEGUE.md.`,
    );
  }
  return value;
}

/** Cadena de conexión de Postgres (Supabase). Solo servidor. */
export const databaseUrl = () => required("DATABASE_URL");

/** Base local: cualquier motor todavía no implementado falla cerrado. */
export function crmMotor(): "local" {
  const motor = process.env.CRM_MOTOR ?? "local";
  if (motor !== "local") throw new Error("Motor CRM no implementado.");
  return motor;
}

/** URL del proyecto de Supabase. Pública: la usa también el navegador. */
export const supabaseUrl = () => required("NEXT_PUBLIC_SUPABASE_URL");

/** Clave anónima de Supabase. Pública por diseño: la seguridad la da RLS + T3. */
export const supabaseAnonKey = () => required("NEXT_PUBLIC_SUPABASE_ANON_KEY");

/**
 * Token compartido del endpoint público de captura de leads (M2, decisión #20).
 * `POST /api/leads/externo` no tiene sesión —es la única entrada del sistema
 * sin actor— así que se autentica comparando este valor contra la cabecera
 * `x-webhook-token`, en vez de con RBAC.
 */
export const leadsWebhookToken = () => required("LEADS_WEBHOOK_TOKEN");

/**
 * Clave de servicio de Supabase (M13, decisión #28). Solo servidor, **nunca**
 * expuesta al navegador (a diferencia de `supabaseAnonKey`): concede acceso
 * administrativo completo a Auth, es lo que permite invitar usuarios por
 * correo (`auth.admin.inviteUserByEmail`) sin que ellos tengan que registrarse
 * por su cuenta. `Project Settings → API Keys → service_role` en el panel de
 * Supabase.
 */
export const supabaseServiceRoleKey = () => required("SUPABASE_SERVICE_ROLE_KEY");

/** Fixture local: contraseña obligatoria, independiente por rol; sin defaults. */
export function testUserPassword(role: string): string {
  const names: Record<string, string> = {
    admin: "CRM_TEST_ADMIN_PASSWORD",
    asistente: "CRM_TEST_ASISTENTE_PASSWORD",
    broker: "CRM_TEST_BROKER_PASSWORD",
  };
  const name = Object.hasOwn(names, role) ? names[role] : undefined;
  if (!name) throw new Error("Rol de prueba no reconocido.");
  return required(name);
}

/** Solo servidor. Destinos HTTPS exactos registrados como array JSON, deny por defecto. */
export function communicationConfig() {
  let webhookDestinations: string[] = [];
  try {
    const parsed: unknown = JSON.parse(process.env.CRM_WEBHOOK_DESTINATIONS ?? "[]");
    if (Array.isArray(parsed) && parsed.every((item) => typeof item === "string")) {
      webhookDestinations = parsed;
    }
  } catch {
    // Configuración inválida mantiene el despacho webhook cerrado.
  }
  return {
    telegramToken: process.env.TELEGRAM_BOT_TOKEN || null,
    whatsappToken: process.env.WHATSAPP_API_TOKEN || null,
    whatsappPhoneId: process.env.WHATSAPP_PHONE_NUMBER_ID || null,
    webhookDestinations,
    webhookTimeoutMs: 10_000,
  };
}

/** Evaluación sin contraseña: opt-in exclusivo de desarrollo en host local. */
export function evaluationLoginAllowed(host: string | null): boolean {
  if (process.env.NODE_ENV !== "development" || process.env.CRM_EVAL_LOGIN !== "1") {
    return false;
  }
  // No se aceptan URLs, subdominios, listas de proxy ni variantes de loopback.
  return host !== null && /^(?:localhost|127\.0\.0\.1)(?::[0-9]{1,5})?$/i.test(host);
}

/** Configuración de Moodle LMS local (Academy, M13). Solo servidor. */
export function moodleConfig() {
  return {
    url: process.env.MOODLE_URL || "http://127.0.0.1:9330",
    token: process.env.MOODLE_TOKEN || null,
  };
}

