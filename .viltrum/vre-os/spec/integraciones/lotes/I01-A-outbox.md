---
id: I01-A
parent: I01
estado: DRAFT
nivel: L1
tipo: infraestructura de integracion local
riesgo: R3
owner: D19
revisores: [D11, D12, D14]
actualizado: 2026-10-04
---

# I01-A · Outbox seguro, previo al adaptador Twenty

**Ficha estrecha candidata a READY tras revisión D11/D12/D14.** No integra Twenty, no activa HTTP, no cambia fuente de verdad ni modifica UI. D03 define el contrato; D19 implementaría tras promoción formal e índice Spec actualizado por D00. D14 [revisó](../../../../reviews/D14-revision-fichas-I01-I02-2026-10-04.md) I01 padre y encontró outbox bajo lock e identidad no durable; esta subficha concreta solo esos fallos. R3 por potencial PII y duplicación de efectos remotos.

## Resultado observable

El outbox permite emitir **una vez por identidad de comando**, reclamar sin retener transacción durante el envío, finalizar solo desde el lease vigente y reintentar/reconciliar resultados inciertos sin perder el cambio local. Las escrituras de casos de uso a outbox siguen fuera de este lote; ninguna prueba de este lote acredita el espejo Twenty funcional.

## Estado AS-IS y riesgo

- `src/application/compartido/crm.ts`: `OutboxCrm.emitir(evento)` no recibe identidad de comando estable.
- `src/infrastructure/integraciones/outbox/repositorio.ts`: `emitir` genera `eventId`/`idempotencyKey` nuevos en cada invocación; `colaOutboxDrizzle.conSiguiente` mantiene `SELECT FOR UPDATE` y transacción mientras espera `procesar`.
- `src/infrastructure/integraciones/outbox/worker.ts`: `ColaOutbox` define callback bajo lock; los tests actuales usan doble en memoria y no acreditan concurrencia PostgreSQL.
- `src/infrastructure/db/schema.ts`: unique `idempotency_key`, pero sin clave durable del comando; `external_refs.version` recibe `evento.version=1` de esquema, que **no es revisión del agregado**. No usar esa columna para afirmar orden de cambios de negocio.

## Contrato propuesto para revisión D03/D11/D12

1. El emisor recibe `commandId` estable y `eventId`/clave idempotente derivada de `(commandId, tipo, agregado, revisión de emisión)` mediante formato versionado, o recibe `idempotencyKey` durable desde el caso de uso. D03 elige **una** forma antes de READY. Repetir el mismo comando no agrega evento; un comando diferente para el mismo agregado sí. Una colisión de misma clave con payload distinto es error explícito, no éxito silencioso. La clave no contiene PII.
2. `claim(cuando, workerId)` es transacción corta: selecciona pendiente elegible con `FOR UPDATE SKIP LOCKED`, asigna `claimToken` opaco y `leaseUntil`, incrementa o reserva intento según política y **commitea antes** de invocar `CrmPort`. Ningún callback de red corre dentro de `db.transaction`.
3. `finalizarEnviado(eventId, claimToken, ...)` o `finalizarFallido(...)` hace `UPDATE ... WHERE event_id AND claim_token AND estado elegible` y comprueba exactamente una fila. Token viejo tras lease vencido o reclamado por otro worker no altera outbox ni `external_refs`; se registra para reconciliación. `external_refs` y estado enviado se escriben en una única transacción corta. No se borra evento ni DLQ.
4. Al vencer lease, otro worker puede reclamar. Una petición anterior pudo haber llegado al proveedor: se conserva **la misma clave idempotente** y se consulta/reconcilia referencia antes de nuevo efecto si el proveedor no garantiza idempotencia. Se promete entrega **al menos una vez**, nunca exactamente una vez en red. La prueba local usa doble que simula timeout posterior al efecto.
5. El orden por agregado exige `aggregateRevision` distinto de `version` del esquema; D03/D11 deben fijar cómo se genera atómicamente y cómo una revisión antigua no sobrescribe nueva. **No activar el espejo de etapas** hasta resolver esta dependencia; I01-A puede limitarse a dejar interfaz preparada y prueba de fencing sin cambiar semántica de negocio aún.
6. `attemptHistory`, error y logs contienen clase/correlación, nunca tokens, payload sensible ni mensaje bruto del proveedor. Las columnas nuevas conservan RLS y migración reversible no destructiva. D11 revisa índices de cola y compatibilidad con eventos existentes.

## Tareas pequeñas, secuenciales, tras READY

Cada despacho dura ≤45 min, cita esta subficha y especifica exactamente las rutas tocadas; no hay edición paralela del mismo archivo.

| Tarea | Archivos permitidos | Salida medible y prueba | Revisor |
|---|---|---|---|
| A1 · Identidad | `src/application/compartido/crm.ts`, `src/infrastructure/integraciones/outbox/repositorio.ts`, tests nuevos de emisión | Dos emisiones del mismo `commandId` y payload crean una fila; payload distinto con misma clave falla; comandos distintos crean dos. Rollback de transacción local elimina dominio+outbox juntos cuando la futura llamada productiva lo use. | D11 + D14 |
| A2 · Lease persistido | `src/infrastructure/db/schema.ts`, migración nueva `drizzle/0004_*.sql` y metadatos generados por Drizzle si proceden, `src/infrastructure/integraciones/outbox/repositorio.ts`, test DB nuevo | Dos workers PostgreSQL reclaman un evento una sola vez; lease expira/reclaim; token vencido no finaliza ni cambia ref; RLS y migración arriba/abajo o plan de rollback sin pérdida revisados. | D11 + D12 + D14 |
| A3 · Worker sin lock de red | `src/infrastructure/integraciones/outbox/worker.ts`, `src/infrastructure/integraciones/outbox/repositorio.ts`, `src/infrastructure/integraciones/outbox/worker.test.ts`, test DB nuevo | Una barrera del doble remoto observa commit del claim antes de iniciar envío; otra transacción puede operar mientras el doble retiene la respuesta; 429/5xx/timeout conservan clave y política. | D12 + D14 |
| A4 · Reconciliación/finalización | Mismos archivos de A3 más `src/infrastructure/integraciones/outbox/politica.ts` y pruebas; `schema.ts` solo si D11 aprueba cambio adicional | Timeout tras efecto remoto, worker reiniciado y replay no duplican referencia; una revisión antigua no puede sobrescribir un estado nuevo; DLQ y reintento administrativo permanecen íntegros. | D11 + D12 + D14 |

**Dependencia estricta:** A1 → A2 → A3 → A4. Si A2 requiere tocar más archivos por migración Drizzle, D00 reemite lista cerrada antes del despacho. Ningún productor prueba/aprueba su propio parche; D14 ejecuta pruebas sobre el parche integrado y D12 revisa seguridad. El build se hace solo en worktree seguro según `AGENTS.md`.

## Criterios de aceptación para promoción a READY de esta subficha

La promoción requiere **diseño**, no implementación: (a) D03 escoge forma única de identidad y contrato de cola; (b) D11 acepta esquema de lease/índices y camino de migración con filas antiguas; (c) D12 valida fencing, PII/RLS y manejo de resultado incierto; (d) D14 firma que A1–A4 son pruebas ejecutables, incluida PostgreSQL real; (e) D00 actualiza índice y registra revisión independiente conforme a P4. I01 padre continúa DRAFT aunque esta base llegue a READY.

## Evidencia posterior a implementación exigida

`npm run typecheck`, `npm run lint`, `npm test`, `npm run test:db`, `npm run spec:check` y build en worktree compatible, más tests de DB para concurrencia, crash, lease y rollback. `spec:check` hoy tiene 11 bloqueos legados que D00 debe aislar/corregir por tarea separada; esta ficha no declara el gate verde. Prueba negativa de que `src/app/`, `domain/` y `application/` no importan proveedor. El informe de D14 distingue prueba de doble, prueba DB y futuro E2E Twenty.
