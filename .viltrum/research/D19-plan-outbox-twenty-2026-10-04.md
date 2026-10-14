# D19/D10 · Plan técnico del outbox previo al espejo Twenty

**Fecha:** 2026-10-04 · **Clasificación:** INTEGRACION, CRM/ERP, R3 · **Nivel:** L1, análisis. **No es despacho de código ni READY.** Dueño funcional: D03/D02; datos: D11; seguridad: D12; pruebas: D14. Revisión independiente pendiente. Operación local y datos sintéticos; ningún push ni cambio de proveedor autorizado.

## Entrada y alcance

- I01 Twenty sigue `DRAFT`; `CrmPort` en `src/application/compartido/crm.ts` solo conoce contacto `{id}`, negocio `{id,stageId}` y actividad `{id,activityType}`. `crmParaIntegraciones()` solo selecciona el adaptador local. `outboxDrizzle.emitir` no tiene llamadas productivas (búsqueda `rg` en `src/`). Ningún evento real de C1 alcanza Twenty hoy.
- PostgreSQL local es dueño de entidades comerciales; Twenty es espejo reconstruible, según decisión #43 e I01. Este plan no traslada fuente de verdad ni interpreta la API capturada como integración probada.
- Decisión de alcance comunicada por D00 el 04/10: seis etapas activas `Nuevo`, `Contactado`, `Presentación`, `Preselección`, `Negociación`, `Cierre`; `Perdido` queda como resultado archivado con registros preservados. La emisión/mapeo de `NegocioCambioEtapa` espera que D02/D11 definan IDs/slug estables y migración de la séptima etapa; no enviar IDs antiguos a Twenty por intuición. iCalendar `.ics` y certificado Academy aprobado por administrador son contratos separados, fuera del lote de outbox CRM.
- Línea base independiente D14: `typecheck` 0, `npm test` 512/512, `test:db` 130/130; `lint` falla por dos `require()` en `capture_b.cjs` no seguido; `spec:check` informa 0 READY y 11 bloqueos. Son pruebas internas, no E2E con Twenty.

## Hallazgos verificables

1. **HTTP bajo lock.** `colaOutboxDrizzle.conSiguiente` (`src/infrastructure/integraciones/outbox/repositorio.ts:27-55`) abre `db.transaction`, selecciona `FOR UPDATE SKIP LOCKED` y hace `await procesar(...)` antes de cerrar. `procesarOutbox` (`worker.ts:34-62`) llama `CrmPort` dentro de ese callback. Con un adaptador HTTP, la transacción y el lock duran lo que la red, incluidos timeouts. Una instancia lenta ocupa conexión y bloquea eventos relacionados; la suite de `worker.test.ts` usa un doble y no mide este límite transaccional.
2. **La unicidad actual no deduplica comandos.** `outboxDrizzle.emitir` (`repositorio.ts:10-21`) genera `randomUUID()` y usa ese valor para `eventId`, `correlationId` e `idempotencyKey`. El índice único `outbox_idempotency_unq` (`schema.ts:1147`) solo distingue los UUID nuevos: repetir una operación de negocio crea otra fila. `OutboxCrm.emitir(EventoCrm)` no recibe identidad de comando. `outboxEnMemoria` también añade cada emisión sin deduplicación.
3. **Versión equívoca.** `outbox.version` vale 1 y el worker la valida como versión de *esquema del evento* (`worker.ts:39`). `externalRefs.version` se compara contra ese mismo 1 (`repositorio.ts:33-38`), por lo que no impide que una actualización vieja de negocio pise otra nueva. Debe separarse versión de esquema y revisión monotónica del agregado antes de afirmar orden.
4. **No hay prioridad/orden por agregado.** Claim actual ordena `createdAt,eventId`, usa `SKIP LOCKED` y no excluye que otro worker reclame una versión posterior del mismo agregado mientras la anterior está en vuelo. Para el espejo, una etapa anterior podría llegar después de la nueva.
5. **Idempotencia remota desconocida.** El doble `crmLocal` deduplica en un `Map` del proceso, que se pierde al reiniciar (`crm/local.ts:8-18`). Ni ese doble ni las pruebas acreditan que Twenty acepte una clave remota o un upsert por ID local. Un timeout puede significar éxito remoto con confirmación local perdida; el fencing local por sí solo no evita duplicados remotos.
6. **Datos y RLS.** `outbox`, `outbox_dead` y `external_refs` usan `.enableRLS()` (`schema.ts:1131-1178`) y hay migración `0003`, con índices únicos de refs. No se encontró política SQL para estas tablas; verificar identidad/privilegios efectivos del worker antes de asumir que un rol SQL de bajo privilegio puede leerlas. `test:db` actual cubre lecturas de negocio, no claim/finish concurrente de outbox ni RLS de worker.

GitNexus `npx gitnexus status` informó índice vigente en `cdb5f14`. `impact --direction upstream --repo QuisqueyaHome_CRM --include-tests`: `outboxDrizzle` LOW, 0 dependientes indexados (coincide con ausencia de uso productivo); `colaOutboxDrizzle` LOW, 1 llamador directo `ejecutarLoteOutbox`, 1 proceso; `procesarOutbox` LOW, 1 archivo de prueba indexado. El grafo no sustituye búsqueda estática: `runtime.ts` invoca `procesarOutbox`, y hay tests que tipan `ColaOutbox`. Repetir impacto sobre cada símbolo concreto antes de editar cuando haya ficha READY.

## Cambio mínimo propuesto, sujeto a D03/D11/D12

### A. Emisión transaccional y clave durable

Extender `EventoCrm` o el argumento de `OutboxCrm.emitir` con `commandId`/`operationId` creado una sola vez al aceptar el comando local, `correlationId` separado, y `aggregateRevision` monotónica (o secuencia por agregado). Guardar `(destino, commandId, tipo)` o una clave opaca derivada de esa identidad como `idempotencyKey` única. Una repetición con **misma clave y mismo payload canónico** devuelve la fila existente; la misma clave con distinto payload es conflicto, nunca sobrescritura. Persistir evento y cambio de dominio en la misma `UnidadDeTrabajo`. No derivar una clave solo de `contactId + tipo`: dos cambios legítimos a la misma entidad deben conservar eventos distintos. El `eventId` puede seguir siendo UUID aleatorio una vez creado; reintentos conservan la fila y la clave. Definir generación y transporte de `commandId` en la capa de aplicación sin exponer IDs internos al navegador. La revisión del agregado no es la versión del esquema JSON.

### B. Claim breve → red fuera de transacción → finalización cercada

Cambiar el contrato `ColaOutbox` de `conSiguiente(callback)` a tres operaciones: `reclamar(cuando, leaseMs)` devuelve fila + `claimToken`/fencing epoch tras una transacción corta; `confirmarEnviado(claim, ref, fecha)`; `confirmarFallo(claim, clase, próximo, fecha)`. En `reclamar`, `SELECT FOR UPDATE SKIP LOCKED` filtra pendiente, vencimiento de lease y *ningún evento previo no terminal del mismo agregado/destino*; actualiza `leaseUntil`, token nuevo y contador de claim en esa transacción, luego COMMIT. **Solo entonces** `procesarOutbox` llama `CrmPort`. Al finalizar, usar `UPDATE ... WHERE event_id=? AND claim_token=? AND sent_at IS NULL AND dead_at IS NULL` en transacción breve; si afecta 0 filas, reportar `STALE_CLAIM` sin alterar refs ni DLQ. Insert/upsert de `external_refs` y marca `sentAt` van en la misma transacción y condicionados al claim válido. `fallido` actualiza historial, intentos y DLQ bajo el mismo fencing; inserción DLQ con conflicto controlado. `leaseUntil` se limpia al finalizar.

Dimensionar lease por encima del timeout HTTP, o renovarlo si se permite operación larga. Un claim vencido puede coexistir con una llamada remota aún viva: fencing protege PostgreSQL, **no** Twenty. Por eso la operación remota debe aceptar deduplicación verificable o usar una búsqueda/upsert determinista por referencia externa; ante resultado incierto se reconcilia antes de reemitir. Sin esta garantía, el timeout queda `HUMAN_REQUIRED` y no se fuerza un retry automático. Registrar latencia, número de intentos y desfase sin payload sensible.

### C. Orden, referencias y límites

La consulta de claim debe serializar por `(destino, entityType, aggregateId)` y revisión. `createdAt` solo desempata; no acredita orden lógico. Elegir entre `aggregateRevision` persistida en dominio o secuencia asignada bajo lock de la entidad; D11 debe aprobar índice y estrategia de backfill. `external_refs` necesita actualización monotónica por esa revisión y rechazo de colisión `(system,externalId)`; `setWhere externalRefs.version <= evento.version` actual no sirve. Una actividad independiente puede tener su propio agregado. Mantener `schemaVersion` para parseo evolutivo y DLQ del payload desconocido. Definir retención/borrado de PII en outbox y trazas, aunque el payload mínimo actual solo lleva IDs.

## Esquema/migración y permisos propuestos

Agregar **migración nueva** (no reescribir `0003`) para `outbox`: `command_id` o identidad durable equivalente, `aggregate_revision`, `destination` si habrá varios motores, `lease_until`, `claim_token` UUID y quizá `claimed_at`; índices de claim y orden por agregado. Migrar filas preexistentes conservando `event_id`, `idempotency_key`, `sent_at` y DLQ; backfill de `command_id` desde clave histórica solo marca identidad legacy, no prueba que esos comandos fueran deduplicados. Los eventos antiguos con revisión desconocida se reconcilian/archivan antes de activar envío externo. Añadir restricciones de revisión positiva y estado de lease coherente; mantener `.enableRLS()` y migración `ALTER TABLE ... ENABLE ROW LEVEL SECURITY`. D11/D12 deben definir rol DB del worker y política SQL explícita, o documentar el uso de rol de servicio con privilegios mínimos y prueba negativa del rol de usuario; `.enableRLS()` por sí sola no certifica aislamiento para el dueño de la tabla.

## Plan de pruebas que debe preparar D14

| Nivel | Prueba significativa | Resultado exigido |
|---|---|---|
| Contrato de emisión | mismo `commandId` + payload en dos transacciones/concurrencia; clave igual + payload distinto; rollback de dominio | una fila y una operación; conflicto explícito; rollback sin evento huérfano |
| `test:db` con dos conexiones | dos workers reclaman simultáneamente un evento; HTTP simulado queda pendiente mientras se consulta DB; lease vence; claim viejo intenta finalizar | un claim activo inicial; la DB y otro agregado siguen disponibles durante la espera; token viejo no cambia `sent_at`, refs ni DLQ |
| Orden por agregado | revisiones 1 y 2 del mismo negocio, más otro negocio | revisión 2 espera; otro negocio puede progresar; ningún estado viejo pisa el nuevo |
| Crash/restart | caída tras claim, tras éxito remoto y antes de `confirmarEnviado`, tras rechazo remoto | lease recuperable; misma identidad; resultado incierto en reconciliación, sin asumir exactamente una entrega |
| Puerto CRM simulado | 401/403, 404/409, 429 con `Retry-After`, 5xx, timeout, respuesta inválida, colisión de ref | clase correcta, backoff/retención de clave, rechazo de payload inválido y ninguna escritura local perdida |
| Esquema/RLS | aplicar migración en DB temporal `test:db`; usuario sin rol de worker intenta leer/modificar outbox; rol worker reclama/finaliza | denegación a usuario y permiso mínimo operativo a worker, sin tocar DB de desarrollo |
| E2E local posterior | comando C1 aprobado → DB → outbox → Twenty fijado → referencia → UI degradada y reanudación | solo tras READY; datos sintéticos, rollback/replay y capturas por rol |

`npm test` comprueba lógica sin DB; `npm run test:db` debe extenderse con casos realmente concurrentes de outbox en la base temporal del harness, no con un doble en memoria. Verificar `typecheck`, `lint`, `npm test`, `test:db`, `spec:check`, build en worktree aislado y revisión de diff por D12/D14. La línea base actual no equivale a esas pruebas nuevas.

## Lotes/archivos permitidos para despacho futuro

1. **Contrato e identidad (D03/D10, revisor D11/D14):** `src/application/compartido/crm.ts`, `src/application/testing/outbox-en-memoria.ts`, casos de uso C1 **enumerados por D03 tras impacto**, pruebas de esos casos. Requiere resolver semántica de `commandId`, revision y seis etapas.
2. **Outbox persistente (D19/D11, revisores D12/D14):** `src/infrastructure/integraciones/outbox/{repositorio,worker,runtime,politica}.ts`, sus pruebas, `src/infrastructure/db/schema.ts`, nueva migración `drizzle/0004_*.sql` y metadatos generados por Drizzle. El nombre de migración se fija al generarla; no editar migraciones históricas.
3. **Contrato Twenty (D19, revisores D12/D14):** `src/infrastructure/integraciones/crm/twenty/**`, `src/infrastructure/contenedor/crm.ts`, `src/infrastructure/env.ts`, pruebas de contrato/arquitectura. No tocar esta tanda hasta demostrar idempotencia y versión de Twenty, y hasta que I01 esté READY.
4. **Harness DB (D14 independiente del productor):** solo `scripts/test-db/**`, pruebas `.db.test.ts` asignadas y evidencia `.viltrum/reviews/**`. El productor del código no certifica sus propios tests.

Cada despacho tendrá archivos exactos, ≤45 min y una ficha READY citada. I01-A (outbox) puede aislarse de activar Twenty, pero sigue necesitando la ficha READY de infraestructura/integración y revisión formal. No se declara C1 completo por cerrar este lote.

## Riesgos y decisiones pendientes

- D03/D11: modelo de revisión monotónica por entidad, orden entre eventos de lead/contacto/negocio y estrategia ante eventos legacy; mapeo de seis etapas y `Perdido` archivado.
- D03/D19: verificar en instancia Twenty local y versión fijada si hay idempotency key, external ID/upsert y semántica de 404/409. Hasta entonces, **exactly once remoto es desconocido**.
- D12: rol/privilegios DB y RLS, secreto servidor, minimización de payload, política de retención, clasificación de fallos y DLQ visible solo a administradores.
- D14: prueba de red fuera de transacción y concurrencia con dos conexiones; revisión de `test:db` sin tocar desarrollo; E2E por rol.
- D00: resolver gate `spec:check` y ruido de `lint` antes de despachar; registrar handoff y revisión independiente. Este documento no los cierra.

**Evidencia examinada:** I01 DRAFT; D03 arquitectura multi-OSS; D14 línea base; `src/application/compartido/crm.ts`; `src/infrastructure/integraciones/outbox/{repositorio,worker,runtime,politica}.ts`; `worker.test.ts`; `src/infrastructure/db/schema.ts:1131-1178`; `drizzle/0003_curly_charles_xavier.sql`; búsquedas `rg`; GitNexus status/impact con repo explícito. No se ejecutaron pruebas nuevas ni se editó código de producto en esta pasada.
