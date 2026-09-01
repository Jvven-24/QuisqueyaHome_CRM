import type { Config } from "drizzle-kit";

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
