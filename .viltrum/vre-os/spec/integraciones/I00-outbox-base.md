---
id: I00
sistema: Base local de outbox
repo: CRM Quisqueya Home (código propio)
licencia: código propio; sin incorporación de proveedor
modo: APP
puerto: OutboxCrm / ColaOutbox
estado: DRAFT
riesgo: R3
owner: D19
revisores: [D11, D12, D14]
actualizado: 2026-10-04
---

# I00 · Base local de outbox para integraciones C1

**Ficha canónica de primer nivel**, enumerada por `spec:check`; el lote I01-A en [`lotes/I01-A-outbox.md`](lotes/I01-A-outbox.md) es anexo técnico. Ambas permanecen DRAFT hasta revisión independiente D11/D12/D14 y registro D00. I00 no es un módulo de producto ni añade proveedor; es infraestructura compartida de C1.

## 1. Para qué lo usamos y para qué no

Persistir efectos de integraciones con identidad, orden y recuperación. No es CRM externo, scheduler, sincronización bidireccional ni garantía de entrega exactamente una vez por HTTP. El primer lote se prueba con datos sintéticos, doble de proveedor y PostgreSQL temporal.

## 2. Fuente de verdad

PostgreSQL CRM conserva entidades de negocio. Outbox y `external_refs` son registros locales de entrega y referencia, no dueños de contacto, negocio o certificado. Eventos viejos sin destino/revisión acreditados quedan en cuarentena. La versión heredada de ref=1 no demuestra revisión de negocio.

## 3. Contrato del puerto

El límite HTTP exige `Idempotency-Key` UUID conservado por la UI para el mismo intento/reintento; un `command_receipts` transaccional liga UUID a actor, operación, hash canónico y resultado **antes** de mutar dominio. Repetición idéntica devuelve resultado sin doble cambio de negocio ni avance de cursor; contenido/actor distinto con la misma clave devuelve 409. `OutboxCrm.emitir` recibe ese `commandId`; clave de evento versionada por destino/comando/tipo/agregado. `ColaOutbox` separa `reclamar`, `confirmarEnviado` y `confirmarFallo` con token+epoch; el claim confirma transacción antes de la red. La forma candidata está en `lotes/I01-A-outbox.md` §Contrato, pendiente D11/D12/D14.

## 4. Mapeo de datos

Diccionario conceptual en `lotes/I01-A-outbox.md`: `command_receipts` PK `command_id` y hash/version; `outbox_aggregate_cursor` PK `(destination,aggregate_type,aggregate_id)`, `last_revision bigint >=0`, `INSERT ... ON CONFLICT UPDATE +1 RETURNING`, primera revisión 1; outbox nuevo con `destination`, `command_id`, `aggregate_type`, `aggregate_revision >0`, `payload_hash`, `claim_token`, `claim_epoch >=0`, `lease_until`, `resolution_state` cerrado y uniques por comando/evento/agregado y por revisión de stream. Token y lease son ambos nulos o ambos presentes; terminal/cuarentena no reclamable. `schemaVersion` interpreta JSON y se conserva distinto de revisión. `external_refs.aggregate_revision` es nueva y anulable para legado; incremento estricto, igualdad mismo ID idempotente, colisión otro ID error. `version=1` existente no se convierte automáticamente. Las matrículas multi-programa de Moodle requieren diseño I02 aparte; no usar ref de broker simple. D11 valida DDL/índices y medición `EXPLAIN` antes de READY.

## 5. Eventos

El primer lote no añade emisión productiva; pruebas crean eventos sintéticos. r2 espera r1 del mismo destino/agregado aunque r1 esté pendiente, incierta o en DLQ; otro agregado progresa. Webhooks entrantes no forman parte de I00. Un caso de uso C1 futuro deberá emitir en la transacción de dominio tras su propia ficha READY.

## 6. Catálogo de fallos

Timeout tras posible efecto remoto es resultado incierto: sin deduplicación/consulta remota probada, pasa a conciliación humana antes de reenvío. Un claim vencido no puede finalizar éxito ni fallo ni alterar refs/DLQ/historia. 429/5xx reintentan con clave conservada y política acotada; 401/403/colisión requieren intervención. 404/409 se definen por proveedor en I01/I02. Logs e historial no incluyen payload, secretos o respuesta bruta.

## 7. Despliegue

Solo PostgreSQL local y worker servidor CRM. Plan expandir→clasificar→conciliar→activar: D11 midió en DB local 0 filas en `outbox`, `outbox_dead` y `external_refs`, RLS ENABLE sin FORCE/políticas y roles de servicio inexistentes; repetir conteos y colisiones inmediatamente antes de migrar. D16 correlacionó el proceso app local en 9301 con una sesión SQL `postgres` superusuario/BYPASSRLS; no se ha acreditado worker activo. Ver [auditoría D11](../../../research/D11-auditoria-local-outbox-roles-2026-10-04.md) y [ampliación D16](../../../research/D16-runtime-roles-outbox-2026-10-04.md). Backup restaurado en DB temporal; migración nueva añade columnas anulables y estado `LEGACY_QUARANTINED` durable sin reescribir `0003`; enviados/dead conservan historia y pendientes sin destino/revisión verificables no se reclaman. Activación solo tras clasificar o mantener cuarentena auditada y probar rol/orden. Rollback antes de efectos permite proceso local compatible; tras efecto externo se **detiene transporte y concilia**, sin reactivar worker antiguo que reenvíe. No se borran columnas/filas en este lote. Seguridad objetivo: roles SQL directos `crm_app` emisor y `crm_outbox_worker` separado, migrador dueño distinto, políticas `TO role` y `FORCE ROW LEVEL SECURITY`, sin BYPASSRLS; D11/D12 confirman grants y credencial efectiva después de la transición antes de READY. No VPS, nube ni push.

## 8. Pantallas nuestras

I00 no agrega pantalla. G10 Integraciones y salud tratará estados de entrega por rol con otra ficha y seis estados UX. Ninguna vista lee tokens ni referencias externas generales. El cierre de I00 no implica que G10 o la UI Twenty/Moodle funcionen.

## 9. Pruebas y criterios de aceptación

Para READY: D11 acepta cursor, unicidad, conteos DB/plan legacy y rol SQL efectivo; D12 acepta identificadores seudónimos/RLS/fencing; D14 valida oráculos PostgreSQL de replay HTTP con `commandId` persistido antes de dominio, hash distinto, dos comandos concurrentes/rollback, dos workers, transacción cerrada durante stub remoto, lease vencido **con y sin** segundo claim, fin tardío de éxito y fallo, r1/r2/DLQ, cuarentena no reclamable y crash/restart sobre la misma DB. `pg_stat_activity`/`pg_locks` o instrumentación del pool prueba ausencia de transacción mientras espera red; probar rol ordinario denegado y worker permitido con `current_user`/`rolbypassrls` registrado. Tras código: typecheck, lint, test, test:db, `spec:check` corregido por TOOL-001 y build en worktree seguro, con revisión independiente. Tareas A1–A4 del anexo ≤45 min y archivos cerrados.

## 10. Riesgos, licencia y salida

Código propio sin copia de proveedor. `commandId`, IDs y clave de idempotencia son **identificadores seudónimos vinculables**, no datos anónimos: servidor únicamente, sin URL, UI, logs o analítica y con retención aprobada. Riesgos: duplicación remota, lock abierto, orden incorrecto, reenvío de legacy, bypass RLS y PII en logs. Salida: parar worker sin borrar eventos, conservar entidad canónica y cola para conciliación, cambiar adaptador por puerto. Q-C1-05 sigue abierta: ninguna copia de datos reales a Twenty/Moodle autorizada. TOOL-001 está READY para corregir el falso verde del validador; hasta verificar ese parche, exit 0 no acredita integridad completa.
