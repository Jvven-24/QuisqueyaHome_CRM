# T-E1-1b3 · Corrección de la migración 0005: ejecución con el migrador oficial

Productor: Antigravity (gemini-3.8-flash-high, sesión HAPI). Perfil: **D11 Datos** (con D16 despliegue).
Fecha: 2026-10-13 (America/Santo_Domingo).
Revisión independiente pendiente: orquestador (corre el migrador oficial sobre una copia y sobre la base de desarrollo) + Codex cuando recupere cuota.
Ficha M03 READY, tarea T-E1-1b3, regla S-303-N y aviso S-303-H.
Modo: fix. Sin git, sin commit, sin npm run dev/build, sin .env* impreso. Base de desarrollo `quisqueyahome_crm` NUNCA modificada.

---

## 1. Resumen y diagnóstico

### Causa del defecto (P1)
En la versión previa, `drizzle/0005_identidad_venta_durable.sql` dependía de una tabla temporal `qh_sale_identity_backfill` poblada exclusivamente por un hook de JavaScript en el arnés de pruebas (`scripts/test-db/identidad-migracion.mjs`). Al ejecutarse a través del migrador oficial de Drizzle (`drizzle-kit migrate` o `migrate(db, { migrationsFolder: 'drizzle' })`), dicha tabla temporal no existía o estaba vacía, dejando `project_id` y `unit_code_normalized` con valores `NULL` y provocando el fallo Postgres 23502 en `ALTER TABLE unit_sales ALTER COLUMN project_id SET NOT NULL`.

### Solución implementada
1. **0005 autosuficiente en SQL puro:**
   - Se crea la función SQL inmutable `normalizar_codigo_unidad(code text)` en PostgreSQL con la misma regla S-303-N que `src/domain/unidades.ts`:
     - Normalización Unicode NFKC y NFD.
     - Retirada de diacríticos (`[\u0300-\u036f]`).
     - `btrim` de todos los espacios en blanco (`E' \t\r\n\v\f'`).
     - Mayúsculas (`upper`).
     - Reemplazo de secuencias de espacios, `_` y guiones/rayas (`- ‐ ‑ – — −`) por un único guion `-`.
     - Validación estricta: si el código es nulo o queda en blanco tras normalizar, lanza excepción `"El código de unidad no puede estar en blanco."`.
   - Se calculan `project_id` y `unit_code_normalized` directamente en SQL desde la tabla `units`:
     ```sql
     UPDATE unit_sales s
     SET project_id = u.project_id,
         unit_code_normalized = normalizar_codigo_unidad(u.code)
     FROM units u
     WHERE u.id = s.unit_id;
     ```
   - Se eliminó completamente la dependencia de la tabla temporal y se removió el arnés `scripts/test-db/identidad-migracion.mjs`.
   - Se preserva el aviso `S-303-H` en la migración 0004 y la no abortabilidad de 0004.
2. **Paridad exacta SQL ↔ dominio:**
   - Se añadió en `scripts/test-db/cierre.ts` una prueba exhaustiva en `test:db` que valida los mismos 20 vectores (espacios internos y externos, guiones bajos, rayas y guiones Unicode, acentos precompuestos y combinados, ancho completo, tabs, saltos de línea, vacíos y diacríticos aislados) exigiendo idéntico resultado entre `normalizar_codigo_unidad` en PostgreSQL y `normalizarCodigoUnidad` en TypeScript.
3. **Migrador oficial en todos los escenarios de `test:db`:**
   - **(a) Base vacía:** `run.mjs` ejecuta `migrate(db, { migrationsFolder: 'drizzle' })` sobre la base vacía y verifica que el esquema final de `unit_sales` tenga `project_id` y `unit_code_normalized` en `is_nullable = 'NO'` y 0 ventas.
   - **(b) Copia poblada (184 negocios):** `ensayarMigracionPoblada` ejecuta `migrate(db, { migrationsFolder: 'drizzle' })` de forma directa sin arnés previo; valida que las 23 tablas conserven conteos y SHA256 idénticos, verifica que las columnas sean NOT NULL, y confirma que los 15 legados históricos no tengan fila en `unit_sales`.
   - **(c) Control sintético:** `ensayarBackfillSintetico` ejecuta `migrate(db, { migrationsFolder: 'drizzle' })`; ante duplicados aborta con código Postgres `23505` sin aplicar cambios; tras corregir el código, migra con exit 0, verifica NOT NULL, índice único, las 3 ventas durables y que el legado 800004 no tenga fila en `unit_sales`.
4. **Protección absoluta de `quisqueyahome_crm`:**
   - La base de desarrollo permaneció en solo lectura en todo momento. Los conteos y las huellas MD5 de todas las tablas públicas antes y después de `test:db` son 100% idénticos.

---

## 2. Archivos tocados

| Archivo | Acción | Descripción |
|---|---|---|
| `drizzle/0005_identidad_venta_durable.sql` | Modificado | Autosuficiente con función SQL `normalizar_codigo_unidad` y backfill directo desde `units` |
| `scripts/test-db/cierre.ts` | Modificado | Prueba de paridad exacta SQL ↔ TS sobre todos los vectores S-303-N |
| `scripts/test-db/migracion-poblada.mjs` | Modificado | Eliminada dependencia de tabla temporal; migrador oficial con verificación de esquema y legados |
| `scripts/test-db/run.mjs` | Modificado | Eliminada preparación temporal; verificación de esquema final NOT NULL sobre base vacía |
| `scripts/test-db/identidad-migracion.mjs` | Eliminado | Lógica de arnés temporal obsoleta eliminada del proyecto |

---

## 3. Salida real de los cinco comandos

### 1. `npm run typecheck`
```
> quisqueya-home-crm@0.1.0 typecheck
> tsc --noEmit
```
**Exit code:** 0

---

### 2. `npm run lint`
```
> quisqueya-home-crm@0.1.0 lint
> eslint .
```
**Exit code:** 0

---

### 3. `npm test`
```
> quisqueya-home-crm@0.1.0 test
> node --test "src/**/*.test.ts"

ℹ tests 549
ℹ suites 0
ℹ pass 549
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 3578.8763
```
**Exit code:** 0 (549 pruebas unitarias aprobadas, 0 fallos)

---

### 4. `npm run test:db`
```
> quisqueya-home-crm@0.1.0 test:db
> node scripts/test-db/run.mjs

SERVER IDENTITY {"db":"quisqueyahome_crm","schema":"public","host":"127.0.0.1/32","port":5432}
ISOLATION PASS: database quisqueyahome_crm_test_...; loopback:5432.
POPULATED BEFORE {"roles":3,"pipeline_stages":7,"lead_sources":8,"loss_reasons":7,"zones":13,"agencies":3,"payment_methods":3,"unit_inventory_states":5,"users":15,"permissions":183,"broker_profiles":13,"marketing_campaigns":8,"campaign_spend":152,"projects":24,"units":404,"contacts":459,"leads":649,"deals":184,"deal_properties":184,"deal_stage_history":592,"activities":1803,"commissions":17,"goals":247}
MIGRATION NOTICE: S-303-H: 15 ventas historicas sin unidad; conservadas sin fila en unit_sales
POPULATED LEGACY PASS: [1000000,1000001,1000002,1000003,1000004,1000005,1000006,1000007,1000008,1000009,1000010,1000011,1000012,1000013,1000014]; conservados ganados sin inventar unidades.
POPULATED MIGRATION PASS: 184 negocios; 23 tablas conservan conteos y SHA256 de todas las columnas originales; 0 ventas con unidad concreta; migrador oficial.
SYNTHETIC S-303-H PASS: 3 ganados concretos backfilled (incluido archivado); 1 legado preservado sin venta.
SYNTHETIC BACKFILL PASS: duplicado aborta sin pérdida; migrador oficial exit 0 tras resolver conflicto; 3 ventas preservadas, incluida archivada; legado sin fila; reejecución idempotente.
MIGRATIONS PASS: drizzle/ aplicado solo al destino temporal.
SEED PASS: semilla 20261003; 640 leads, 176 negocios, 450 contactos, 400 unidades.
# tests 144
# suites 0
# pass 144
# fail 0
# cancelled 0
# skipped 0
# todo 0
# duration_ms 7666.0875
CLEANUP PASS: database temporal eliminado.
DEV COUNTS PASS: todas las tablas public idénticas antes/después.
DEV HASHES PASS: todas las columnas de todas las tablas public idénticas antes/después (huellas calculadas en servidor).
```
**Exit code:** 0 (144 pruebas DB aprobadas, 0 fallos)

---

### 5. `npm run spec:check`
```
> quisqueya-home-crm@0.1.0 spec:check
> node scripts/spec/check.mjs

Spec Pack: 6 fichas; listas READY o superior: 17%
Estados: DRAFT 4 · REVIEW 1 · READY 1 · BUILT 0 · VERIFIED 0
Tipos: Módulo 3 · Global 0 · Integración 3
Bloqueos: 0
Aviso: .viltrum/vre-os/spec/integraciones/CAPACIDADES.md: catálogo histórico omitido; investigación no probatoria, no acredita APIs verificadas
- .viltrum/vre-os/tareas/T-DS-1-negocios-leads.md: legado (sin Ficha:)
- .viltrum/vre-os/tareas/T-DS-2-propiedades-brokers.md: legado (sin Ficha:)
- .viltrum/vre-os/tareas/T-DS-3-integraciones-shell.md: legado (sin Ficha:)
- .viltrum/vre-os/tareas/T-E1-0-renombrar-negocios.md: legado (sin Ficha:)
- .viltrum/vre-os/tareas/T-E1-1a-ficha-negocios.md: legado (sin Ficha:)
- .viltrum/vre-os/tareas/T-E1-1a-r1-ficha-negocios.md: legado (sin Ficha:)
- .viltrum/vre-os/tareas/T-E1-2a-ficha-leads.md: legado (sin Ficha:)
- .viltrum/vre-os/tareas/T-E1-2a-r1-ficha-leads.md: legado (sin Ficha:)
- .viltrum/vre-os/tareas/T-E1-3a-ficha-propiedades.md: legado (sin Ficha:)
- .viltrum/vre-os/tareas/T-E1-4a-ficha-brokers.md: legado (sin Ficha:)
- .viltrum/vre-os/tareas/T-E1-5a-ficha-integraciones.md: legado (sin Ficha:)
- .viltrum/vre-os/tareas/T-I0-capacidades.md: legado (sin Ficha:)
- .viltrum/vre-os/tareas/T-P0-cms-reutilizable.md: legado (sin Ficha:)
- .viltrum/vre-os/tareas/T-P0-crm-inventario.md: legado (sin Ficha:)
- .viltrum/vre-os/tareas/T-P1-spec-check.md: legado (sin Ficha:)
- .viltrum/vre-os/tareas/T-QA-test-db.md: legado (sin Ficha:)
- .viltrum/vre-os/tareas/T-TW-D21-twenty-inventario.md: legado (sin Ficha:)
- .viltrum/vre-os/tareas/T-W1-D05-graficas-movil.md: legado (sin Ficha:)
- .viltrum/vre-os/tareas/T-W1-D09a-higiene-visual.md: legado (sin Ficha:)
- .viltrum/vre-os/tareas/T-W1-D11-datos-seed.md: legado (sin Ficha:)
- .viltrum/vre-os/tareas/T-W1-D11-rework-catalogos.md: legado (sin Ficha:)
- .viltrum/vre-os/tareas/T-W1-D21-cobertura-modulos.md: legado (sin Ficha:)
- .viltrum/vre-os/tareas/T-W1-D21-oss-intake.md: legado (sin Ficha:)
- .viltrum/vre-os/tareas/T-W1-D21b-rework.md: legado (sin Ficha:)
- .viltrum/vre-os/tareas/T-W2-D10-reportes-reales.md: legado (sin Ficha:)
- .viltrum/vre-os/tareas/T-W2-D19-base-integraciones.md: legado (sin Ficha:)
- .viltrum/vre-os/tareas/T-W3-D05-ux-visual-A.md: legado (sin Ficha:)
- .viltrum/vre-os/tareas/T-W3-D05-ux-visual-B.md: legado (sin Ficha:)
- .viltrum/vre-os/tareas/T-W3-D09-inicio-reportes.md: legado (sin Ficha:)
- .viltrum/vre-os/tareas/T-W4b-D10-rentas.md: legado (sin Ficha:)
- .viltrum/vre-os/tareas/T-W4b-D21-rentas-porte.md: legado (sin Ficha:)
Sin bloqueos.
```
**Exit code:** 0

---

## 4. Lo no verificado y límites declarados

- **Migración en la base física de desarrollo (`quisqueyahome_crm`):** Por instrucción explícita del mandato y de la tarea, Antigravity no ejecutó DDL contra la base de desarrollo (corresponde al orquestador tras revisión independiente). La base de desarrollo se mantuvo en modo solo lectura para la verificación de invariantes y conteos/hashes.
- **Despliegue a producción / Supabase Cloud / VPS:** No se aplicó DDL en entornos remotos ni se imprimieron variables de entorno.
- **Sin git/commit/push:** El parche queda en el árbol de trabajo local para integración por parte del orquestador.

---

ESTADO: ENTREGADO
