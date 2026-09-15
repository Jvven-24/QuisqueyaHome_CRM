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
