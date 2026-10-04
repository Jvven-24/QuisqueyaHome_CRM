# D11 · Corrección del seed: catálogos canónicos

Fecha de evidencia: 2026-10-04, hasta 17:28 UTC. Tarea: **T-W1-D11-R1**.
Productor: Codex / D11. Revisor requerido: **D12, otro proveedor**.
Estado: corrección implementada y verificada localmente; **pendiente de revisión independiente, sin autoaprobación**.

## Mandato y alcance

Se leyó completo `.viltrum/dispatch/20261004T171111Z-D11-codex/PERFIL.md` antes de actuar y después `TAREA.md`.
Se aplicó `viltrum-data`, incorporada en el perfil; se consultaron el relevo, contexto técnico, routing, C1 y mandato VRE-OS §4.
Clasificación: **BUG en CRM/ERP, R3, D11**, construcción acotada con revisión D12.
La tarea actual autoriza expresamente trabajar en la carpeta principal y verificar cambios sin commit; prevalece sobre el relevo histórico del 2-oct.
No se usaron subagentes ni git; no se hicieron commits, push, despliegues, migraciones ni cambios de permisos.

Archivos editados por esta ejecución:

- `scripts/seed/catalog.ts`: mapeos, rangos exactos v1/v2 y orden de inserción/limpieza.
- `scripts/seed/catalog-guards.ts`: resolución por slug y guarda de colisiones.
- `scripts/seed/generator.ts`: referencias reales de catálogos y probabilidades de la base.
- `scripts/seed/index.ts`: inserta únicamente fixtures pendientes, valida catálogos y cuenta INSERT reales.
- `scripts/seed/limpiar.ts`: limpieza transaccional por rangos con protección de referencias ajenas.
- `src/infrastructure/db/seed-invariantes.test.ts`: adaptación y cuatro regresiones adicionales.
- `package.json`: exclusivamente `db:seed` y `db:seed:clean`.
- Este entregable.

Se conserva el ajuste de `agencies` sin `position` en `generator.ts:42`.
`local.ts` no se editó: conserva `safeFailure`, motivo de errores propios y URLs enmascaradas.
`schema.ts`, migraciones y capas de aplicación/interfaz no se editaron.

## Diagnóstico e impacto

Consulta propia antes de limpiar: `pipeline_stages` tenía 14 filas (7 canónicas + 7 `vre-*`),
`lead_sources` 16 (8 originales + 8 `vre-*`), `loss_reasons` 12 (7 originales + 5 `vre-*`) y `roles` 3 originales.
Se confirmaron nombres repetidos en etapas y canales. Los motivos v1 añadían otro catálogo aunque sus nombres no coincidían literalmente.

Se ejecutaron `gitnexus_query` y análisis upstream de `generateDataset`, `validateDataset`, `checkStoredRows`,
`scripts/seed/index.ts` y `scripts/seed/limpiar.ts` antes de modificarlos. El índice no reconoce estos archivos/símbolos
sin commit: devolvió **Target not found**. **Blast radius automático y nivel de riesgo GitNexus: no verificados**.
No se reindexó porque escribiría fuera de la lista autorizada. Revisión manual de referencias con `rg`:
`generateDataset` → ejecutable del seed y suite de invariantes; `validateDataset` → generador, relectura transaccional y pruebas.
El alcance funcional observado es exclusivamente fixtures locales y pruebas; las consultas existentes reciben ahora los IDs canónicos.

## Mapeo de etapas y conteos

Los IDs de esta tabla son **observados**, no constantes del generador. Se resuelven por `slug` en cada corrida.
Las probabilidades se leen de `pipeline_stages.default_probability`; no se reemplaza el catálogo administrado.

| Paso del mandato / v1 | Slug canónico | ID observado | Negocios seed en etapa actual | Total activo en BD | Negocios seed que alcanzaron la etapa |
|---|---|---:|---:|---:|---:|
| Entrada / `vre-nuevo` | `nuevo` | 8 | 0 | 1 | 176 |
| Oportunidad/contacto / `vre-contactado` | `contactado` | 9 | 57 | 58 | 176 |
| Visita / `vre-visita` | `presentacion` | 10 | 16 | 18 | 88 |
| Cotización / `vre-cotizacion` | `preseleccion` | 11 | 20 | 22 | 53 |
| Reserva/negociación / `vre-reserva` | `negociacion` | 12 | 4 | 6 | 19 |
| Contrato ganado / `vre-cierre` | `cierre` | 13 | 15 | 15 | 15 |
| Salida perdida / `vre-perdido` | `perdido` | 14 | 64 | 64 | 64 |
| **Total actual** | | | **176** | **184** | No sumar: etapas acumuladas |

Conversión de fixtures: 176/640 = 27,5 % oportunidades; 88/176 = 50 % visitas;
53/88 ≈ 60,23 % cotizaciones; 19/53 ≈ 35,85 % reservas; 15/19 ≈ 78,95 % contratos.
La discretización conserva los volúmenes del mandato. Las pérdidas son una salida lateral, no otro avance.
Los 8 negocios anteriores al seed se conservan y explican la diferencia entre 176 y 184.

### Canales y motivos: agrupación explícita

No existen canales propios para Google, feria de diáspora o broker externo en el catálogo original.
Se conserva la descripción de la campaña simulada, agrupándola en el canal existente indicado abajo.
**Esto es una hipótesis de fixture, no atribución comercial verificada ni garantía de ROI por esos subcanales.**

| Campaña simulada | Slug existente | ID observado |
|---|---|---:|
| Meta Ads | `meta_lead_ads` | 16 |
| Portal web | `portal_web` | 14 |
| WhatsApp | `whatsapp` | 12 |
| Referido | `referido` | 13 |
| Instagram | `instagram` | 10 |
| Google | `portal_web` | 14 |
| Ferias de la diáspora | `referido` | 13 |
| Broker externo | `referido` | 13 |

`meta_lead_ads` permanece **inactivo** como estaba: las fixtures históricas pueden referenciarlo,
pero no se activó una integración ni se modificó su disponibilidad para nuevas altas.
YouTube, Facebook y Llamada directa permanecen intactos aunque estas ocho campañas no los utilicen.

| Motivo simulado v1 | Slug existente | ID observado |
|---|---|---:|
| Presupuesto insuficiente | `precio` | 8 |
| Financiamiento rechazado | `sin_financiamiento` | 10 |
| Entrega incompatible | `otro` | 14 |
| Eligió otro proyecto | `otra_opcion` | 9 |
| Desistió de invertir | `solo_consultaba` | 13 |

El rol `broker` se relee por slug y activo (ID observado 6); no se insertan roles ni permisos.
Solo se insertan filas de los cuatro catálogos nuevos de 0002: `zones`, `agencies`, `payment_methods`, `unit_inventory_states`.
Las campañas y sus gastos son registros operativos, no reemplazos de canales.

## Limpieza e idempotencia

`SEED_RANGES` define para cada tabla el intervalo cerrado-abierto `[1_000_000, 1_000_000 + n)`.
Incluye los rangos de los tres catálogos v1 retirados; el rol canónico nunca entra en limpieza.
`broker_profiles` utiliza `user_id`; las demás tablas utilizan `id`.
Se eliminan primero hijos y después padres, en una transacción con el mismo advisory lock que el seed,
`lock_timeout=5s` y `statement_timeout=60s`.

Antes de DELETE se inventarían las FK entrantes, se bloquean las tablas afectadas y se rechaza cualquier referencia
desde una fila ajena a los rangos, incluyendo FK con CASCADE. Una FK compuesta/no compatible aborta de forma cerrada.
Se comparan conteos y hashes de filas fuera de los rangos antes y después de limpiar, dentro de la misma transacción;
los valores y hashes quedan en memoria. Resultado ejecutado: `outsideRowsUnchanged: true`.
La rama de rechazo ante referencias ajenas **no se ensayó con una inyección en BD**; requiere revisión D12.

El seed compara las filas presentes contra la fixture y rechaza conflictos; inserta solo las ausentes.
La guarda compara slug y nombre visible normalizado, también entre filas pendientes, antes de INSERT.
Las lecturas/inserciones de catálogos están bloqueadas contra carreras con otros escritores.
Después valida las filas persistidas y ejecuta SQL de nombres duplicados en los ocho catálogos antes de COMMIT.
No usa un `ON CONFLICT DO NOTHING` que esconda una colisión. La segunda corrida insertó **0 filas**;
tampoco actualiza secuencias cuando no hay INSERT. La primera sí mantiene secuencias sin rebajarlas;
`setval` no es transaccional y puede dejar huecos tras una interrupción (comportamiento preexistente documentado).

## Pruebas

Salidas reales del 4-oct. En PowerShell, `npm`/`npx` sin extensión fallaron por la política de firma de sus `.ps1`;
se usaron `npm.cmd`/`npx.cmd`, sin cambiar políticas del equipo.
La primera corrida TypeScript encontró errores de tipado en los scripts; se corrigieron y se repitió completa.

### TypeScript final

Comando: `npx.cmd tsc --noEmit --incremental false`.
**Exit 0; ninguna salida en stdout/stderr**, tampoco errores de `.next/types`.

### Suite completa

Comando: `npm.cmd test`. Fragmento final literal de la segunda corrida completa, **exit 0**:

```text
ℹ tests 463
ℹ suites 0
ℹ pass 463
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 3162.5573
```

Las 15 pruebas de seed pasan: incluyen IDs canónicos no consecutivos, probabilidades de la base,
catálogo ausente/ambiguo, etapa incompatible, colisión por slug/nombre y rangos exactos de limpieza.
También pasan los candados globales de RLS y permisos API.

### Lint

`npm.cmd run lint`: **exit 0**, salida final real:

```text
✖ 12 problems (0 errors, 12 warnings)
```

Una advertencia corresponde a `_position` en `scripts/seed/generator.ts:42`, del ajuste conservado del orquestador;
las otras 11 están fuera de los archivos editados. No se presentan como cero advertencias.
La comprobación acotada `npx.cmd eslint scripts/seed src/infrastructure/db/seed-invariantes.test.ts`
también terminó exit 0, con esa única advertencia.

### Respaldo previo

`node --env-file=.env scripts/seed/verify-local.ts backup`, exit 0:

```json
{"database":"quisqueyahome_crm","host":"127.0.0.1/32","version":150008}
{"backup":"C:\\Users\\wilbe\\AppData\\Local\\Temp\\vre-d11-backup-betfLp\\pre-d11.dump","bytes":260534,"archiveReadable":true,"restoreRehearsed":false}
```

PostgreSQL observado: **15.8**, host loopback, puerto validado 5432, base `quisqueyahome_crm`.
Respaldo fuera del repositorio. Restauración, cifrado, RPO/RTO: **no verificados**.

### Limpieza ejecutada

Comando: `npm.cmd run db:seed:clean`, **exit 0**:

```text
> quisqueya-home-crm@0.1.0 db:seed:clean
> node --env-file=.env scripts/seed/limpiar.ts

{
  "localDestination": "PASS",
  "outsideRowsUnchanged": true,
  "deletedCounts": {
    "goals": 247,
    "commissions": 15,
    "activities": 1800,
    "deal_stage_history": 591,
    "deal_properties": 176,
    "deals": 176,
    "leads": 640,
    "contacts": 450,
    "units": 400,
    "projects": 20,
    "campaign_spend": 152,
    "marketing_campaigns": 8,
    "broker_profiles": 12,
    "users": 12,
    "unit_inventory_states": 5,
    "payment_methods": 3,
    "agencies": 3,
    "zones": 13,
    "pipeline_stages": 7,
    "loss_reasons": 5,
    "lead_sources": 8
  }
}
```

### Seed, primera corrida

Comando: `node --env-file=.env scripts/seed/index.ts`, **exit 0**:

```text
Destino local verificado; PostgreSQL 150008.
{
  "seed": 20261004,
  "invariants": "PASS (filas persistidas, antes de COMMIT)",
  "fixtureCounts": {
    "zones": 13,
    "agencies": 3,
    "payment_methods": 3,
    "unit_inventory_states": 5,
    "users": 12,
    "broker_profiles": 12,
    "marketing_campaigns": 8,
    "campaign_spend": 152,
    "projects": 20,
    "units": 400,
    "contacts": 450,
    "leads": 640,
    "deals": 176,
    "deal_properties": 176,
    "deal_stage_history": 591,
    "activities": 1800,
    "commissions": 15,
    "goals": 247
  },
  "insertedCounts": {
    "zones": 13,
    "agencies": 3,
    "payment_methods": 3,
    "unit_inventory_states": 5,
    "users": 12,
    "broker_profiles": 12,
    "marketing_campaigns": 8,
    "campaign_spend": 152,
    "projects": 20,
    "units": 400,
    "contacts": 450,
    "leads": 640,
    "deals": 176,
    "deal_properties": 176,
    "deal_stage_history": 591,
    "activities": 1800,
    "commissions": 15,
    "goals": 247
  },
  "insertedTotal": 4723,
  "duplicateCatalogNames": 0
}
```

### Seed, segunda corrida

Mismo comando, **exit 0**:

```text
Destino local verificado; PostgreSQL 150008.
{
  "seed": 20261004,
  "invariants": "PASS (filas persistidas, antes de COMMIT)",
  "fixtureCounts": {
    "zones": 13,
    "agencies": 3,
    "payment_methods": 3,
    "unit_inventory_states": 5,
    "users": 12,
    "broker_profiles": 12,
    "marketing_campaigns": 8,
    "campaign_spend": 152,
    "projects": 20,
    "units": 400,
    "contacts": 450,
    "leads": 640,
    "deals": 176,
    "deal_properties": 176,
    "deal_stage_history": 591,
    "activities": 1800,
    "commissions": 15,
    "goals": 247
  },
  "insertedCounts": {
    "zones": 0,
    "agencies": 0,
    "payment_methods": 0,
    "unit_inventory_states": 0,
    "users": 0,
    "broker_profiles": 0,
    "marketing_campaigns": 0,
    "campaign_spend": 0,
    "projects": 0,
    "units": 0,
    "contacts": 0,
    "leads": 0,
    "deals": 0,
    "deal_properties": 0,
    "deal_stage_history": 0,
    "activities": 0,
    "commissions": 0,
    "goals": 0
  },
  "insertedTotal": 0,
  "duplicateCatalogNames": 0
}
```

### SQL posterior, conexión independiente

Se ejecutó literalmente:

```sql
select name, count(*) from pipeline_stages group by name having count(*)>1;
```

Salida real: `{"pipelineDuplicateNames":[]}` — **0 filas**.
Consulta de negocios actuales excluye `deals.deleted_at IS NOT NULL`; para fixtures filtra `[1000000,1000176)`.
Resultados por etapa están completos en la tabla de mapeo. El historial filtra `[1000000,1000591)`.
Salidas reales adicionales:

```json
{"table":"pipeline_stages","duplicateNames":0,"count":7}
{"table":"lead_sources","duplicateNames":0,"count":8}
{"table":"loss_reasons","duplicateNames":0,"count":7}
{"table":"roles","duplicateNames":0,"count":3}
{"table":"zones","duplicateNames":0,"count":13}
{"table":"agencies","duplicateNames":0,"count":3}
{"table":"payment_methods","duplicateNames":0,"count":3}
{"table":"unit_inventory_states","duplicateNames":0,"count":5}
{"funnelHistory":[{"slug":"nuevo","reached":176},{"slug":"contactado","reached":176},{"slug":"presentacion","reached":88},{"slug":"preseleccion","reached":53},{"slug":"negociacion","reached":19},{"slug":"cierre","reached":15},{"slug":"perdido","reached":64}]}
```

### Interfaz observada

El navegador integrado no estuvo disponible; se verificó el servidor existente en **Edge**, `http://localhost:9301`,
con sesión de administrador ya presente. No se levantó otro servidor ni se introdujeron credenciales.
Reportes mostró una única serie: `648 Leads 1 Nuevo 58 Contactado 18 Presentación 22 Preselección 6 Negociación 15 Cierre 64 Perdido`.
Pipeline mostró exactamente las siete columnas y los mismos conteos. Se verificó mediante el árbol accesible,
sin cambiar registros. No se inspeccionó la consola: **ausencia de warnings React en consola no verificada**.
Los valores de Reportes corresponden al stock por etapa actual, no al historial acumulado de conversión:
la métrica acumulada sigue siendo tarea W2/D10. Inicio todavía mostró cifras de embudo distintas del historial;
no se atribuye ese comportamiento al catálogo ni se corrige fuera del alcance.

`build` y `dev` **no ejecutados**, por la restricción explícita de Codex en la carpeta principal.

## Revisión de seguridad del cambio

Checklist de `docs/contexto/flujo-de-trabajo.md` §6 aplicado al alcance:

- **Bien:** `limpiar.ts:10` y `index.ts:24` usan la guarda de `local.ts`, que valida protocolo, loopback, puerto,
  nombre de base y ausencia de opciones que redirijan el destino; ambos verifican identidad del servidor.
- **Bien:** `limpiar.ts:19–68` restringe cada DELETE al rango propio, evita referencias externas/cascadas y
  verifica conservación de filas ajenas. No se usa TRUNCATE ni se rebajan secuencias.
- **Bien:** `catalog-guards.ts:29` e `index.ts:58–78` evitan duplicar catálogos y revierten ante inconsistencias.
- **Bien:** conexión obtenida de `infrastructure/env.ts` mediante `local.ts`; configuración leída en ejecución,
  sin credenciales nuevas, cadenas de conexión, volcado de entorno ni datos personales en las salidas de esta sesión.
- No hay tablas, vistas, funciones SQL, rutas API, JSON público, CSV ni políticas nuevas: sus apartados no aplican.
  Los candados existentes de RLS/API pasan en la suite global.
- **Límites:** no se ensayó aislamiento RLS con rol real ni restauración; no se afirman garantías nuevas sobre ello.
  La limpieza presupone la reserva exclusiva de los rangos del seed, como exige la tarea; una fila externa que
  se cree manualmente dentro de esos rangos sería elegible. D12 debe confirmar esa precondición al revisar.

No se detectó una exposición nueva de secretos en esta ejecución. El incidente del informe anterior no se repitió;
no se reejecutaron `drizzle-kit` ni su wrapper de migración. Esta comprobación no certifica todo el repositorio.

## Handoff

**D12 (otro proveedor):** revisar el paquete y decidir su aceptación; D11 no lo aprueba ni cierra un issue/gate.
No hay commit/SHA ni comparación remota verificados: por mandato, no se usó git.

1. Confirmar el alcance de los ocho archivos enumerados, guardas locales, rangos v1/v2 y protección de FK/CASCADE.
   Ensayar en sandbox la rama de rechazo de limpieza ante una referencia ajena, sin introducir secretos.
2. Repetir TypeScript, lint y `npm test`; ejecutar build desde el entorno del revisor permitido, no desde Codex en esta carpeta.
3. Revisar la agrupación de Google/ferias/broker y motivos de pérdida; los nombres de campaña no equivalen a nuevos canales.
4. **D10/W2:** consumir el catálogo canónico y calcular conversión por `deal_stage_history`; los conteos actuales por etapa
   y los acumulados no son intercambiables. Conservar que Meta Lead Ads sigue inactivo.
5. **D16:** respaldo previo disponible en la ruta temporal indicada; restore/RPO/RTO pendientes, sin garantía de recuperación ensayada.
6. **Claude/D00:** revisión independiente, integración/commit y relevo corresponden al orquestador según decisión #44.
   Actualizar el índice GitNexus y comprobar flujos cuando el paquete esté integrado. No hay push autorizado por esta entrega.
