# T-E1-1b2 · Tercera pasada S-303-H: entrega de cierre y legado sin unidad

Productor: Codex D11, tramo D10 autorizado. Fecha: 2026-10-13 (America/Santo_Domingo).
Revisores pendientes: Antigravity (otro proveedor), D12 y orquestador. Esta entrega no firma aceptación, gate ni cierre de issue (P4).
Ficha M03 READY, Decisión #47, tarea T-E1-1b2, desbloqueos S-303-N y S-303-H. Clasificación: cambio de CRM/ERP existente, R3, F4, L3 con verificación de productor; C1 activo.

## Resultado

El ensayo poblado y `npm run test:db` terminan con **exit 0 real**. S-303-H resuelve el bloqueo técnico de los 15 ganados históricos sin unidad, sin conciliación inventada. Se conservaron ganados, comisiones e historial. No se creó ninguna relación negocio→unidad para ellos.

La copia anonimizada tiene 184 negocios; las 23 tablas copiadas conservan conteos y SHA256 de todas sus columnas originales copiadas. Sus 15 ventas ganadas no tienen unidad concreta: el backfill produce **0 ventas**, que es exactamente el número de ganados de venta con principal concreta en esta copia. La consulta real devuelve exactamente los IDs **1000000–1000014**, mediante cuatro páginas de tamaño 4. El control sintético independiente demuestra el caso positivo: tres ganados con unidad (incluido archivado) sí generan ventas; un legado adicional queda ganado sin fila de venta. No se usa el fixture sintético para conciliar la copia real.

Origen: transacción REPEATABLE READ READ ONLY. Destino: base aleatoria validada en loopback:5432. El runner verifica identidad antes de DDL destructivo y elimina el destino al terminar. Los conteos y las huellas de **todas las columnas de todas las tablas públicas de desarrollo** coinciden antes/después, incluida audit_log; las huellas MD5 se calculan dentro del servidor sin enviar valores al runner. Esto acredita ausencia de cambios observados, no un respaldo/PITR.

## Cambios de la tercera pasada

- `drizzle/0004_cierre_venta_unica.sql:3`: el preflight ahora cuenta ganados de venta sin principal concreta y emite `RAISE NOTICE` con la cuenta. El INSERT filtra `p.unit_id IS NOT NULL`. No toca los negocios históricos, no inventa actores ni unidades. Duplicados o autoría inválida de ventas concretas siguen siendo rechazados por constraints.
- `src/application/pipeline/consultas.ts:100`: `consultarVentasHistoricasSinUnidad(repo, actor, cursor, limite)`, lectura paginada ordenada por ID ascendente. Reutiliza permiso `deals:view`, validación de cursor/límite, resumen y whitelist del DTO. `none` no llama al puerto.
- `puertos.ts`, `consultas.ts` y `lectura-en-memoria.ts`: filtro tipado y booleano estricto `historicasSinUnidad`; doble distingue venta durable de propiedades presentes. No se infiere el legado a partir del interés mostrado.
- `src/infrastructure/db/repos/pipeline-lectura.ts:20`: condición `won AND sale AND NOT EXISTS(unit_sales por dealId)` junto a `visibleRows`. Aplica tanto a lista como resumen. No filtra ni libera ventas archivadas. Conserva exclusión de papelera y alcance efectivo del lector de b1.
- `consultas.test.ts`: exclusión de venta registrada, rent/open/papelera y ajenos; cursor, resumen completo, own/all/none y DTO del asistente.
- `cierre.test.ts`: legado ganado no se reabre por esta API existente. Un estado representativo ya reabierto tampoco vuelve a ganar sin unidad; con unidad concreta genera venta/evento/auditoría. No se construyó una nueva vía de reapertura.
- `scripts/test-db/migracion-poblada.mjs:35`: migra con éxito y comprueba igualdad exacta entre ventas y ganados con unidad, conservación de SHA/conteos, consulta de los 15 IDs, mapa temporal interrumpido/reconstruido y segunda migrate idempotente. El control sintético ahora parte de 0003 para ejercitar el backfill no vacío de 0004 antes del control de identidad 0005.
- `scripts/test-db/negocios.ts:17`: prueba PostgreSQL del legado con/sin registro durable, own/all/none, alquiler y archivo, paginación y DTO. La prueba existente que observa SQL también ejecuta la consulta nueva: broker no SELECT de comisión/precio real; asistente no SELECT financiero; none sin SQL.
- `scripts/test-db/run.mjs:25,58`: imprime solo el aviso S-303-H validado, nunca notices arbitrarios; compara además huellas de desarrollo. Mantiene exit 1 si falta acreditar ensayo poblado (p. ej. fallback de esquema sin CREATE DATABASE).
- Informe y logs reescritos; coordinación temporal en EN-CURSO.md. Sin cambios de schema/snapshots/journal en esta pasada: la estructura de 0004 no cambia.

## Entrega b2 conservada

S-303-N sigue usando una sola función de dominio `normalizarCodigoUnidad`: Unicode NFKC, retirada de diacríticos, trim, mayúsculas y colapso de espacios/guiones/rayas/underscore; blanco es ValidationError. Identidad durable de venta `(project_id,unit_code_normalized)`, además de UNIQUE unitId y dealId; NOT NULL/CHECK, FK restrictivas y RLS. No se altera `units_project_code_unq` ni se supone M04 implementada.

Cierre: elegir/crear unidad mínima en proyecto autorizado, sin precio real, con bloqueo de proyecto/negocio/unidad; venta/comisión/metas/historial/auditoría/evento local `{id,stageId}` en una transacción; conflicto 409 saneado e idempotencia. Dos conexiones con barrera compiten por unidad existente y por código normalizado sin fila: un ganador, un conflicto, sin efectos del perdedor. Outbox fallido revierte también alta mínima y asociación. Archivo/recreación física no libera la identidad durable.

Se mantienen prerrequisitos por etapa, pérdida con motivo activo/comentario y archivo lógico, principal activa única, DTO restrictivo en todas las mutaciones, entrada Zod estricta y asignación campo por campo. Proveedores externos no participan durante los locks. Las pruebas heredadas vuelven a pasar en estas corridas; no se afirma un recorrido visual.

## Migración y runbook

Esta tarea autoriza expresamente corregir **0004 aún no integrada**. No se editaron 0000–0003 ni 0005, snapshots ni journal. Si un entorno ya aplicó 0004 anterior, editar el archivo no vuelve a ejecutar la migración: D00/D11 deben evaluar ese historial antes de desplegar. No se aplicó DDL en desarrollo ni remoto.

SHA256 0004 corregida: `16DB859EED40350D0D82AA0A6B863660B064665C038C16CEC34C133D6097371F`.
SHA256 0005 conservada: `639DE6C6A1A945821F6464D302D0A05968CB40B3C3F144B235B0735EACD77615`.

Modelo: unidad 0..1 venta, negocio 0..1 venta, proyecto 1:N ventas. UUID interno en ventas; identidad al cierre inmutable por archivo, claves alternativas unitId/dealId. No se duplican precio/notas/nombres. Dinero en bigint centavos y fechas timestamptz. Sin tenants nuevos; se conserva autorización de alcance existente. No se añaden índices por rendimiento ni desnormalización.

Switch sujeto a aprobación independiente: suspender escritores antiguos; respaldo y recuperación acreditados por D16 para un entorno con datos; conexión dedicada/session pool max:1; preparar `qh_sale_identity_backfill` mediante `prepararIdentidadesDeVenta` en la misma sesión de migrate; aplicar 0004/0005; verificar registro = ganados de venta con unidad concreta, aviso y consulta de legado, conteos/hashes; activar escritor nuevo. No asignar unidad a legados por proyecto/importe. Para conciliación posterior, responsable del dato debe aportar la relación validada.

N/N-1: lecturas previas toleradas; escritores mixtos NO acreditados porque el antiguo no genera ventas durables. Se requiere parada durante switch. Lock timeout 5s. Backfill/contract transaccionales, mapa temporal reconstruible por lotes de 200; falla íntegramente ante identidad duplicada/incompleta. Rollback después de ventas: preferir roll-forward conservando registro e intereses; no retirar unicidad para revender. Restore/PITR, RPO/RTO y retención legal pendientes de D16/D12.

## Comandos observados

| Comando | Exit y resultado | Log íntegro |
|---|---|---|
| `npm run typecheck` | 0 | [typecheck](D11-D10-b2-typecheck.log) |
| `npm run lint` | 0 | [lint](D11-D10-b2-lint.log) |
| `npm test` | 0; 542 pass, 0 fail | [unitarias](D11-D10-b2-test.log) |
| `npm run test:db` | 0; 143 pass, 0 fail; ensayo poblado exitoso | [PostgreSQL](D11-D10-b2-test-db.log) |
| `npm run spec:check` | 0; Sin bloqueos | [spec](D11-D10-b2-spec-check.log) |
| `npm run test:db:mutation:venta-unica` | 1 esperado; 142 pass, 1 fail específico | [mutación](D11-D10-b2-mutation.log) |

CA-29: retiro de `unit_sales_unit_unq` exclusivamente en destino aleatorio aislado. Único fallo: `DB cierre UNIQUE unitId durable rechaza INSERT directo aunque el negocio se archive`, `Missing expected rejection`. El vector usa otra identidad proyecto+código para aislar unitId del índice redundante. Destino eliminado, desarrollo intacto. Corrida normal **posterior** volvió a exit 0 y 143/143. No se maquilla el exit de la mutación.

GitNexus: el índice fechado 2026-10-05 no contiene los símbolos de b1/b2 (`lecturaPipeline`, `filtrosNegocios`, `ensayarMigracionPoblada` y lector en memoria); las llamadas a impact devolvieron Target not found. Se intentó actualizar con `npx gitnexus analyze` y después modo index-only/skip-agents/skip-skills; no terminaron y se interrumpieron. **No se acredita grafo vigente ni riesgo calculado por GitNexus.** La búsqueda de referencias directa acredita lector→contenedor/pruebas y ensayo→runner, sin cambios de firmas ni rutas. Revisor debe repetir impacto con índice vigente. No se llamó detect_changes porque usa git y no hay commit autorizado.

## Seguridad y límites

Checklist de `docs/contexto/flujo-de-trabajo.md` §6 recorrido mediante lectura de archivos autorizados; sin git/diff. Correcto en esta pasada: `visibleRows` antes de lectura, scope none sin puerto, Zod booleano estricto, DTO por rol y proyección SQL con centinelas ausentes, anti-join sin devolver filas de ventas, RLS y unicidad/FK existentes conservadas. Sin ruta, vista SQL, SECURITY DEFINER, grant, variable de entorno o acceso Data API nuevo. Aviso solo cuenta, fixture anonimizado sin password/auth, logs sin parámetros/credenciales. Fuente local read-only y operaciones destructivas confinadas al destino validado.

Hallazgo heredado fuera del alcance: `src/infrastructure/audit.ts:74`–75 serializa snapshots completos; notes/lossComment pueden duplicar PII en audit_log sin redacción. Dueño D12; requiere revisión antes de integración. El ensayo copia 23 tablas de dependencias sin auditoría ni sesiones; no equivale a una copia/restore completo del sistema. Auditoría y todo el contenido de desarrollo se comprueban intactos por huellas del servidor.

UNKNOWN: RLS con rol real no privilegiado, grants/remoto/advisors/db diff de Supabase, restore/PITR/RPO/RTO, retención integral, escritores N/N-1, QA visual/capturas, revisión de otro proveedor. No se ejecutaron commit, push, dev ni build; no se inspeccionaron `.env*`. El runner utiliza internamente el cargador local existente sin emitir conexión. No se tocó VPS ni cloud. No se cerraron issues/gates.

Fuentes consultadas: [PostgreSQL RAISE](https://www.postgresql.org/docs/current/plpgsql-errors-and-messages.html) para NOTICE sin aborto y [changelog Supabase](https://supabase.com/changelog) como comprobación de plataforma; sin API/SDK nuevo en esta pasada. La URL changelog.md no pudo abrirse por content-type; se usó el changelog HTML.

## Handoff y aprendizaje

D10/c1/c2: consumir `consultarVentasHistoricasSinUnidad` con cursor; distinguir legado pendiente de conciliación y conservar DTO por rol. No derivar legacy de unitId mostrado (puede existir interés actual sin venta durable). D12/Antigravity: revisar permisos, constraints, identidad y aviso, repetir ensayos/impacto; aprobar o rechazar de forma independiente. D00: integración y estado global solo después de revisión. D16: respaldos y switch por entorno autorizado.

Lección ampliada para D00/D10/D11/D14: un fixture sembrado después del schema no demuestra migración histórica; el ensayo debe migrar el estado anterior y comprobar conservación y consulta del legado. Cero filas de backfill puede ser correcto si el control positivo no vacío está separado y probado. Persistida aquí y en tests. Pendiente D00 incorporarla en `registry/lessons.json` de la **fuente** Viltrum y notificar departamentos; no se altera la copia instalada `.viltrum/os` ni se acredita aviso externo.

## Salidas reales de las cinco corridas finales

### npm run typecheck

```text

> quisqueya-home-crm@0.1.0 typecheck
> tsc --noEmit

```

### npm run lint

```text

> quisqueya-home-crm@0.1.0 lint
> eslint .

```

### npm run test

```text
✔ D-04: las excepciones técnicas no permiten etiquetas, errores ni enlaces antiguos (2.1519ms)
ℹ tests 542
ℹ suites 0
ℹ pass 542
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 4051.7281
```

### npm run test:db

```text
POPULATED BEFORE {"roles":3,"pipeline_stages":7,"lead_sources":8,"loss_reasons":7,"zones":13,"agencies":3,"payment_methods":3,"unit_inventory_states":5,"users":15,"permissions":183,"broker_profiles":13,"marketing_campaigns":8,"campaign_spend":152,"projects":24,"units":404,"contacts":459,"leads":649,"deals":184,"deal_properties":184,"deal_stage_history":592,"activities":1803,"commissions":17,"goals":247}
MIGRATION NOTICE: S-303-H: 15 ventas historicas sin unidad; conservadas sin fila en unit_sales
POPULATED LEGACY PASS: [1000000,1000001,1000002,1000003,1000004,1000005,1000006,1000007,1000008,1000009,1000010,1000011,1000012,1000013,1000014]; conservados ganados sin inventar unidades.
POPULATED MIGRATION PASS: 184 negocios; 23 tablas conservan conteos y SHA256 de todas las columnas originales; 0 ventas con unidad concreta; mapa reanudado; 1323ms.
MIGRATION NOTICE: S-303-H: 1 ventas historicas sin unidad; conservadas sin fila en unit_sales
SYNTHETIC S-303-H PASS: 3 ganados concretos backfilled (incluido archivado); 1 legado preservado sin venta.
SYNTHETIC BACKFILL PASS: duplicado aborta sin pérdida; mapa interrumpido/reanudado; 3 ventas preservadas, incluida archivada; reejecución idempotente. NO acredita conciliación de base real.
MIGRATION NOTICE: S-303-H: 0 ventas historicas sin unidad; conservadas sin fila en unit_sales
# tests 143
# pass 143
# fail 0
CLEANUP PASS: database temporal eliminado.
DEV COUNTS PASS: todas las tablas public idénticas antes/después.
DEV HASHES PASS: todas las columnas de todas las tablas public idénticas antes/después (huellas calculadas en servidor).
```

### npm run spec:check

```text

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

ESTADO: ENTREGADO
