/**
 * Candado de arquitectura por capas, en el estilo de `seguridad.test.ts`: corre
 * con `npm test` y por tanto en CI.
 *
 * La dirección de las dependencias es una decisión que no deja rastro en el
 * código cuando se incumple: un `import` de más compila igual, pasa el lint y
 * solo se nota meses después, cuando la lógica ya no se puede probar sin base
 * de datos. Aquí rompe el build.
 *
 * La regla de `src/app/` se endurece sola: un módulo cuenta como **migrado**
 * cuando existe `src/application/<modulo>/`, y desde ese momento sus rutas y
 * páginas ya no pueden volver a tocar la base. No hay lista que mantener.
 */

import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { test } from "node:test";

const src = new URL("../", import.meta.url);

/** Todos los archivos de código de `src/`, con ruta relativa a `src/`. */
const archivos = (readdirSync(src, { recursive: true }) as string[])
  .map((f) => f.replaceAll("\\", "/"))
  .filter((f) => /\.tsx?$/.test(f));

/**
 * `from "x"`, `import "x"`, `import("x")` y `export … from "x"`. Exige espacio o
 * paréntesis antes de la comilla: si no, el literal `"import"` de la lista de
 * acciones de `domain/catalogs.ts` se leería como un import.
 */
function importesDe(archivo: string): string[] {
  const codigo = readFileSync(new URL(archivo, src), "utf8");
  return [...codigo.matchAll(/(?<!["'])\b(?:from|import|require)(?:\s*\(\s*|\s+)["']([^"']+)["']/g)].map((m) => m[1]!);
}

/**
 * A qué apunta un import: a un archivo de `src/` (y entonces con qué capa) o a
 * un paquete de node_modules. `node:` no cuenta como dependencia externa.
 */
function destino(archivo: string, especificador: string): { interno: string } | { paquete: string } | null {
  if (especificador.startsWith("node:")) return null;
  if (especificador.startsWith("@/")) return { interno: especificador.slice(2) };
  if (!especificador.startsWith(".")) return { paquete: especificador };

  const partes = archivo.split("/").slice(0, -1);
  for (const parte of especificador.split("/")) {
    if (parte === "." || parte === "") continue;
    if (parte === "..") partes.pop();
    else partes.push(parte);
  }
  return { interno: partes.join("/") };
}

/** Recorre las capas indicadas y devuelve los imports que incumplen la regla. */
function infracciones(capas: string[], prohibido: (d: { interno: string } | { paquete: string }) => boolean) {
  const encontradas: string[] = [];
  for (const archivo of archivos) {
    if (!capas.some((capa) => archivo.startsWith(`${capa}/`))) continue;
    for (const especificador of importesDe(archivo)) {
      const d = destino(archivo, especificador);
      if (d && prohibido(d)) encontradas.push(`src/${archivo} → ${especificador}`);
    }
  }
  return encontradas.sort();
}

test("los archivos de src/ se encuentran (la prueba no se queda vacía sin avisar)", () => {
  assert.ok(archivos.length > 100, `solo ${archivos.length} archivos: ¿cambió la estructura de src/?`);
});

test("domain/ no depende de nada fuera de domain/", () => {
  assert.deepEqual(
    infracciones(["domain"], (d) => "paquete" in d || !d.interno.startsWith("domain/")),
    [],
    "El dominio son reglas puras: solo imports dentro de domain/ y módulos de node:. Si necesitas una librería, la regla no va en domain/.",
  );
});

test("application/ no conoce la infraestructura ni el framework", () => {
  const paquetesVetados = /^(next|drizzle-orm|@supabase)(\/|$)/;
  assert.deepEqual(
    infracciones(["application"], (d) =>
      "paquete" in d
        ? paquetesVetados.test(d.paquete)
        : d.interno.startsWith("infrastructure/") || d.interno.startsWith("app/"),
    ),
    [],
    "Un caso de uso depende de sus puertos, no de Drizzle, Supabase, Next ni de infrastructure/. El adaptador vive en infrastructure/db/repos/.",
  );
});

test("infrastructure/ no importa src/app/", () => {
  assert.deepEqual(
    infracciones(["infrastructure"], (d) => "interno" in d && d.interno.startsWith("app/")),
    [],
    "La infraestructura la usa la capa web, no al contrario.",
  );
});

test("un módulo migrado ya no toca la base desde src/app/", () => {
  const dirApplication = new URL("application/", src);
  const modulos = readdirSync(dirApplication).filter((n) => statSync(new URL(n, dirApplication)).isDirectory());

  const carpetas = modulos
    .flatMap((modulo) => [`app/api/${modulo}`, `app/(crm)/${modulo}`])
    .filter((carpeta) => existsSync(new URL(carpeta, src)));

  assert.deepEqual(
    infracciones(carpetas, (d) => "interno" in d && d.interno.startsWith("infrastructure/db/")),
    [],
    "Este módulo ya tiene casos de uso en src/application/: la ruta o la página debe llamarlos, no consultar la base. Si el import hace falta, el módulo no está migrado.",
  );
});
