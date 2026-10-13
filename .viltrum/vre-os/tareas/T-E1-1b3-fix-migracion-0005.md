# T-E1-1b3 · Corregir la migración 0005: debe correr con el migrador oficial

Ficha: M03

Perfil: **D11 Datos** (con D16 despliegue). Productor: Antigravity (gemini-3.8-flash-high, HAPI). Revisión independiente: orquestador (corre el migrador oficial sobre una copia y sobre la base de desarrollo) + Codex cuando recupere cuota.
Modo: fix. **Sin git, sin commit, sin `npm run dev`/`build`, sin `.env*` impreso, y NUNCA contra la base de desarrollo `quisqueyahome_crm` (la migra el orquestador).** Máximo 45 min.

## Defecto verificado (P1)
`npm run db:migrate` (drizzle-kit, el camino de despliegue) contra la base de desarrollo falla en `drizzle/0005_identidad_venta_durable.sql:17`: `ALTER TABLE unit_sales ALTER COLUMN project_id SET NOT NULL` ⇒ Postgres 23502 «la columna project_id de la relación unit_sales contiene valores null». La causa: 0005 rellena `project_id` y `unit_code_normalized` desde un **mapa temporal que solo crea el arnés de pruebas** (`scripts/test-db/migracion-poblada.mjs`, `identidad-migracion.mjs`) calculando el código normalizado en JavaScript; con el migrador oficial no existe ese mapa y la migración revierte. Las pruebas pasaban porque ejecutan su propio runner, no el oficial. La base de desarrollo sigue en la migración 0003 (0004 y 0005 revierten juntas).

## Qué corregir
1. **0005 autosuficiente:** calcula `project_id` (desde `units`) y `unit_code_normalized` **en SQL**, con la misma regla S-303-N que `normalizarCodigoUnidad` en `src/domain/unidades.ts`: NFKC → quitar diacríticos → `btrim` → mayúsculas → toda secuencia de espacios, `_` y guiones/rayas (`- ‐ ‑ – — −`) a un solo `-`. En Postgres: `normalize(x, NFKC)`, `normalize(…, NFD)` + `regexp_replace(…, '[\u0300-\u036f]', '', 'g')`, `upper(btrim(…))`, `regexp_replace(…, '[\s_\-‐‑–—−]+', '-', 'g')`. Sin extensiones (`unaccent`) que no existan. Elimina la dependencia del mapa temporal (y la lógica del arnés que lo genera si deja de hacer falta). Conserva el aviso `S-303-H` con la cuenta de legados y que 0004 no aborte.
2. **Paridad exacta SQL ↔ dominio:** una prueba en `test:db` que pase por la función SQL y por `normalizarCodigoUnidad` los mismos vectores (`" a 101 "`, `"a_101"`, `"A–101"`, acentos precompuestos y combinados, ancho completo, tabs, vacío) y exija resultados idénticos.
3. **Las pruebas deben usar el migrador oficial:** `npm run test:db` aplica `drizzle/` con el mismo mecanismo que `npm run db:migrate` (`drizzle-orm/postgres-js/migrator` sobre `./drizzle`) en (a) base vacía, (b) la **copia poblada de 184 negocios** y (c) un caso sintético con ventas concretas + legados; en cada una comprueba esquema final, `unit_sales` con `project_id`/`unit_code_normalized` NOT NULL y los 15 legados sin fila.
4. Nada se aplica a la base de desarrollo. Conteos y SHA de la base de desarrollo idénticos antes/después de `test:db`.

## Hecho cuando (pega la salida real)
`npm run typecheck` · `npm run lint` · `npm test` · `npm run test:db` (exit 0) · `npm run spec:check`. Entrega `.viltrum/vre-os/evidencia/E1/negocios/D11-b3-migracion-0005.md` con archivos tocados, salida de los comandos y lo no verificado; termina con `ESTADO: ENTREGADO` o `ESTADO: BLOQUEADO — motivo`.
