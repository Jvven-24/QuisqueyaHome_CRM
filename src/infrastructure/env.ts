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
      `Falta la variable de entorno ${name}. Ver .env.example y docs/DESPLIEGUE.md.`,
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
