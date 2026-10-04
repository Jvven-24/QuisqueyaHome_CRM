# T-QA-TEST-DB · Capa de pruebas de integración contra PostgreSQL real (`npm run test:db`)

Perfil: **D14 QA** (con D11). Modo: fix en worktree. Revisor: D12 (otro proveedor). Tier: medium.
Autorización: decisiones #43/#44 (sí escribes código en los archivos listados; sin git, sin commit, sin `npm run dev`/`build`).
Constitución: `.specify/memory/constitution.md` §C10 y la lección del plan (`M-20261004-VRE.md` §9, "Pruebas verdes no prueban el SQL").

## Defecto que motivó la tarea (verificado, 4-oct)
Hay 51 archivos de prueba y ninguno ejecuta SQL: las de aplicación usan dobles en memoria, las guardas leen código
fuente como texto, y `metas/route.test.ts` y `audit.test.ts` crean `postgres()` sin conectar. Los 18 archivos de
`src/infrastructure/db/repos/` no tienen ninguna prueba de ejecución. Resultado: tsc + 508 pruebas en verde con
Inicio y Reportes rotos (alias de tabla incompatible con los fragmentos de alcance; booleano de JS como condición SQL).

## Qué construir
1. **Base de pruebas aislada, nunca la de desarrollo.** `scripts/test-db/` crea una base temporal
   `quisqueyahome_crm_test_<aleatorio>` en el PostgreSQL local (127.0.0.1:5432), aplica las migraciones Drizzle
   (`drizzle/`), siembra con el generador determinista (`scripts/seed/`, semilla fija) y la elimina al terminar
   (también si falla). Misma guarda de destino que `scripts/seed/local.ts` (solo loopback, nada de URLs cloud). Si el
   usuario de `DATABASE_URL` no puede crear bases, usa un esquema temporal con `search_path` y documenta la limitación.
   Prohibido modificar `quisqueyahome_crm`: la prueba compara conteos de tablas antes y después.
2. **`npm run test:db`** (script en package.json): ejecuta `src/**/*.db.test.ts` con `node --test` contra esa base.
   `npm test` NO los incluye (siguen siendo rápidas y sin base); documenta cómo correr ambas.
3. **Pruebas de ejecución para cada consulta de lectura** de `repos/dashboard.ts` y `repos/reportes.ts` primero, y
   después `leads`, `contactos`, `pipeline`, `proyectos`, `comisiones`, `metas`, `brokers`: ejecutan la consulta real con
   los tres actores de evaluación (admin, broker de alcance `own`, asistente) y comprueban (a) que no lanza, (b) que la
   forma de la respuesta cumple el tipo del puerto, (c) coherencia con el seed (suma de etapas = total de negocios,
   un broker `own` ve menos o igual que admin, nunca filas ajenas).
4. **Prueba de mutación obligatoria**: reintroduce a propósito, una por una, las dos causas del fallo (alias en el
   `join contacts c ... "contacts"."deleted_at"`; `where ${booleanoJS}`) y demuestra que `test:db` cae por su nombre.
   Pega la salida de cada caída y revierte.
5. **Guarda estática barata** en `arquitectura.test.ts`: falla si en `repos/*.ts` aparece `${...!== ...}`/`${...===...}`
   como condición directa de `where|and|or|when` (booleano de JS interpolado).

## Archivos permitidos
`scripts/test-db/**`, `src/**/*.db.test.ts`, `src/infrastructure/arquitectura.test.ts` (solo añadir la guarda),
`package.json` (solo scripts `test:db*`). Nada de código de producto: si una consulta falla, repórtalo en el
entregable (archivo:línea y mensaje) sin corregirla.

## Verificación (pega la salida real)
`npx tsc --noEmit --incremental false` (ignora `.next/types`) · `npm test` · `npm run test:db` (verde) · las dos
mutaciones (rojas) · conteos de la base de desarrollo idénticos antes y después.

## Entregable
`.viltrum/vre-os/D14-test-db.md`: diseño, cómo correrlo, consultas cubiertas, resultado de las mutaciones y `## Pruebas`.
