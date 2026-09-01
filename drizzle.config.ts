import type { Config } from "drizzle-kit";

// drizzle-kit no pasa por Next.js, así que nadie le carga el `.env`. Nativo
// desde Node 21.7, sin dependencias. Falla en silencio si el archivo no existe:
// `db:generate` no necesita conexión.
try {
  process.loadEnvFile(".env");
} catch {
  /* sin .env: solo importa para `migrate`, que fallará con un mensaje claro */
}

/**
 * Configuración de Drizzle Kit (T1).
 *
 * `generate` no necesita conexión: lee el esquema y escribe el SQL. La cadena de
 * conexión solo hace falta para `migrate`, contra la base de Supabase.
 */
export default {
  schema: "./src/infrastructure/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: { url: process.env.DATABASE_URL ?? "" },
  // Nombres de restricción estables: sin esto, dos ramas generan migraciones con
  // nombres distintos para la misma restricción y el merge es un infierno.
  breakpoints: true,
} satisfies Config;
