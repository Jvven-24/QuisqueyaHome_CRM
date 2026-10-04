# T-W1-D11-R1 · Corrección: el seed duplicó catálogos existentes

Perfil: **D11 Data**. Modo: fix **en la carpeta principal** (sin worktree: tu entrega anterior aún no tiene commit y
vive aquí). Revisor: D12 (otro proveedor). Autorización: decisiones #43 y #44 (sí escribes código en los archivos
listados). Entrega anterior: `.viltrum/vre-os/D11-datos-seed.md` (run `20261004T164016Z-D11-codex`).

## Defecto verificado por el orquestador (4-oct, consulta SQL)
`pipeline_stages` tiene ahora **dos** catálogos: los 7 originales (ids 8–14: `nuevo`, `contactado`, `presentacion`,
`preseleccion`, `negociacion`, `cierre`, `perdido`) y 7 nuevos (ids 1000000–1000006: `vre-nuevo`, `vre-contactado`,
`vre-visita`, `vre-cotizacion`, `vre-reserva`, `vre-cierre`, `vre-perdido`). Los negocios simulados usan los `vre-*`
y la UI (embudo de Reportes, Pipeline) los originales → claves React duplicadas ("Nuevo", "Cierre"…) y un embudo que
muestra 648 leads pero 1–2 negocios por etapa. Comprueba lo mismo en `lead_sources` y `loss_reasons` (y cualquier
catálogo que ya existiera antes del seed).

## Qué hacer
1. **Reutilizar catálogos existentes por `slug`**: `pipeline_stages`, `lead_sources`, `loss_reasons`, `roles` y
   cualquier otro que existiera. El generador busca sus ids reales en la base y solo inserta filas de catálogos
   **nuevos** de la migración 0002 (`zones`, `agencies`, `payment_methods`, `unit_inventory_states`).
   Las 7 etapas originales son el embudo canónico del negocio (C1 M03): mapea las distribuciones de conversión del
   mandato §4 sobre ellas (visita → `presentacion`, cotización → `preseleccion`, reserva/negociación → `negociacion`,
   etc.; documenta el mapeo). No crees etapas nuevas.
2. **Limpieza segura** `scripts/seed/limpiar.ts`: borra **solo** filas generadas por el seed (ids en
   `[BASE_ID, BASE_ID + n)` de `catalog.ts`), en orden topológico inverso, en una transacción, con la misma guarda de
   destino local de `local.ts`. Script `db:seed:clean` en `package.json`. Ejecútalo y vuelve a sembrar.
3. **Guarda**: el seed aborta si va a insertar una fila de catálogo cuyo `slug` o nombre visible ya exista; añade la
   prueba en `src/infrastructure/db/seed-invariantes.test.ts` (sin BD) y una verificación SQL al final del seed:
   ningún catálogo con nombres repetidos.
4. Conserva los dos ajustes que hizo el orquestador: `generator.ts` (agencies sin `position`) y `local.ts`
   (`safeFailure` muestra el motivo de errores propios con URLs enmascaradas).
5. La salida de `drizzle-kit`/npm puede contener la URL: ejecuta el seed con
   `node --env-file=.env scripts/seed/index.ts` (como ya funciona), no con wrappers que impriman entorno.

## Archivos permitidos
`scripts/seed/**`, `src/infrastructure/db/seed-invariantes.test.ts`, `package.json` (solo scripts `db:seed*`).
Nada de `src/app/`, `src/application/`, `schema.ts` ni migraciones.

## Pruebas (pega la salida real)
`npx tsc --noEmit --incremental false` (ignora errores de `.next/types`) · `npm test` · `db:seed:clean` · seed dos
veces (la segunda no inserta nada) · SQL: `select name, count(*) from pipeline_stages group by name having count(*)>1`
debe devolver 0 filas; conteo de negocios por etapa original.

## Entregable
`.viltrum/vre-os/D11-rework-catalogos.md` con mapeo de etapas, conteos por etapa y sección `## Pruebas`.
