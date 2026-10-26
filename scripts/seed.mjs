/**
 * Aplica db/seed.sql contra la base configurada (T1).
 *
 * JavaScript plano y no TypeScript: así corre con `node` sin compilar, sin
 * cargador y sin resolver alias de rutas. El contenido interesante está en el
 * .sql, que es donde debe poder revisarse.
 */

import { readFileSync } from "node:fs";
import postgres from "postgres";

// Igual que drizzle.config.ts: este script no pasa por Next.js.
try {
  process.loadEnvFile(".env");
} catch {
  /* si no hay .env, la comprobación de abajo da el mensaje útil */
}

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("Falta DATABASE_URL. Copia .env.example a .env. Ver docs/DESPLIEGUE.md.");
  process.exit(1);
}

// max: 1 porque db/seed.sql trae su propio BEGIN/COMMIT: postgres.js exige una
// sola conexión (sin pool) para permitir control de transacción manual en sql.unsafe().
const sql = postgres(url, { prepare: false, max: 1 });

try {
  await sql.unsafe(readFileSync("db/seed.sql", "utf8"));
  console.log("Seeds aplicados.");
} catch (error) {
  console.error("Fallaron los seeds:", error.message);
  process.exitCode = 1;
} finally {
  await sql.end();
}
