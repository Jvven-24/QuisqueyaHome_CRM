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
  "auth/demo/route.ts": /qh_dev_role/,
  "leads/externo/route.ts": /coincideToken\(/,
  "health/route.ts": /select 1/, // solo responde ok/503, sin datos ni sesión
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

test("ARQ-3: tablas de integración con RLS en esquema y migración", () => {
  const esquema = readFileSync(new URL("src/infrastructure/db/schema.ts", raiz), "utf8");
  const dir = new URL("drizzle/", raiz);
  const migraciones = readdirSync(dir).filter((f) => f.endsWith(".sql")).map((f) => readFileSync(new URL(f, dir), "utf8")).join("\n");
  for (const tabla of ["outbox", "outbox_dead", "external_refs", "webhook_inbox"]) {
    const declaracion = esquema.slice(esquema.indexOf(`pgTable("${tabla}"`)).split("export const ")[0]!;
    assert.match(declaracion, /\.enableRLS\(\)/, `${tabla}: esquema sin RLS`);
    assert.ok(migraciones.includes(`ALTER TABLE "${tabla}" ENABLE ROW LEVEL SECURITY`), `${tabla}: migración sin RLS`);
  }
});

/** Firma sobre bytes crudos antes de JSON; leer bytes es necesario para verificar. */
function exigirVerificacionWebhook(codigo: string): void {
  const sinComentarios = codigo.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|\n)\s*\/\/[^\n]*/g, "$1");
  const verificacion = sinComentarios.search(/await\s+verificarFirma(?:YReplay)?\(/);
  const parseo = sinComentarios.search(/(?:JSON\.parse|\w+\.json)\s*\(/);
  assert.ok(verificacion >= 0, "webhook sin verificación explícita await verificarFirma(bytes)");
  assert.ok(parseo < 0 || verificacion < parseo, "webhook parsea antes de verificar firma");
  assert.doesNotMatch(sinComentarios, /catch\s*\([^)]*\)\s*\{\s*\}/, "webhook ignora el rechazo de firma");
}

test("ARQ-4: webhooks verifican firma antes de parsear el cuerpo", () => {
  const codigoValido = 'const bytes = await request.arrayBuffer(); await verificarFirma(bytes); const payload = JSON.parse(texto);';
  exigirVerificacionWebhook(codigoValido);
  // Fixtures obligatorias: la ausencia actual de rutas webhooks no vacía la prueba.
  assert.throws(() => exigirVerificacionWebhook('const payload = await request.json(); await verificarFirma(payload);'));
  assert.throws(() => exigirVerificacionWebhook('const payload = JSON.parse(texto);'));
  const dir = new URL("src/app/api/", raiz);
  for (const archivo of (readdirSync(dir, { recursive: true }) as string[]).map((f) => f.replaceAll("\\", "/"))) {
    if (archivo.startsWith("webhooks/") && archivo.endsWith("/route.ts")) {
      exigirVerificacionWebhook(readFileSync(new URL(archivo, dir), "utf8"));
    }
  }
});
