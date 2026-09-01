/**
 * Aplica db/seed.sql contra la base configurada (T1).
 *
 * JavaScript plano y no TypeScript: así corre con `node` sin compilar, sin
 * cargador y sin resolver alias de rutas. El contenido interesante está en el
 * .sql, que es donde debe poder revisarse.
 */

import { readFileSync } from "node:fs";
import postgres from "postgres";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("Falta DATABASE_URL. Ver .env.example.");
  process.exit(1);
}

const sql = postgres(url, { prepare: false });

try {
  await sql.unsafe(readFileSync("db/seed.sql", "utf8"));
  console.log("Seeds aplicados.");
} catch (error) {
  console.error("Fallaron los seeds:", error.message);
  process.exitCode = 1;
} finally {
  await sql.end();
}
