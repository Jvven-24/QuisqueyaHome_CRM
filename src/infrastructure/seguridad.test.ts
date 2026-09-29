/**
 * Candados de seguridad que corren con `npm test` (y por tanto en CI).
 *
 * Son reglas que ya fallaron o que se olvidan sin dar error: una tabla sin RLS
 * quedó expuesta por PostgREST durante semanas (29/09/2026). Una regla escrita
 * solo en un documento se incumple sin que nadie lo note; aquí rompe el build.
 */

import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { test } from "node:test";

const raiz = new URL("../../", import.meta.url);

test("toda tabla creada en una migración tiene RLS activado", () => {
  const dir = new URL("drizzle/", raiz);
  const sql = readdirSync(dir)
    .filter((f) => f.endsWith(".sql"))
    .map((f) => readFileSync(new URL(f, dir), "utf8"))
    .join("\n");

  const creadas = [...sql.matchAll(/CREATE TABLE (?:IF NOT EXISTS )?(?:"public"\.)?"(\w+)"/g)].map((m) => m[1]);
  const conRls = new Set(
    [...sql.matchAll(/ALTER TABLE (?:"public"\.)?"(\w+)" ENABLE ROW LEVEL SECURITY/g)].map((m) => m[1]),
  );

  assert.ok(creadas.length > 0, "no se encontraron migraciones: ¿cambió la carpeta drizzle/?");
  assert.deepEqual(
    creadas.filter((t) => !conRls.has(t)),
    [],
    "Tablas sin RLS: añade `.enableRLS()` a la tabla en schema.ts o un ALTER TABLE ... ENABLE ROW LEVEL SECURITY en la migración.",
  );
});

/** Rutas sin sesión, a propósito. Cada una declara qué la protege en su lugar. */
const RUTAS_PUBLICAS: Record<string, RegExp> = {
  "auth/login/route.ts": /signInWithPassword\(/,
  "auth/logout/route.ts": /signOut\(/,
  "auth/recuperar/route.ts": /resetPasswordForEmail\(/,
  "leads/externo/route.ts": /coincideToken\(/,
};

test("toda ruta de la API comprueba permisos en servidor, salvo las públicas declaradas", () => {
  const dir = new URL("src/app/api/", raiz);
  const rutas = (readdirSync(dir, { recursive: true }) as string[])
    .map((f) => f.replaceAll("\\", "/"))
    .filter((f) => f.endsWith("/route.ts"));

  const sinPermiso = rutas.filter((ruta) => {
    const codigo = readFileSync(new URL(ruta, dir), "utf8");
    const publica = RUTAS_PUBLICAS[ruta];
    if (publica) return !publica.test(codigo);
    return !/\brequire(?:Full)?Scope\(/.test(codigo);
  });

  assert.ok(rutas.length > 0, "no se encontraron rutas: ¿cambió src/app/api/?");
  assert.deepEqual(
    sinPermiso,
    [],
    "Rutas sin requireScope/requireFullScope. Si una ruta debe ser pública, decláralo en RUTAS_PUBLICAS con lo que la protege.",
  );
});
