# D11 · Auditoría local de outbox, rol SQL y conciliación I01-A

**Fecha:** 2026-10-04, America/Santo_Domingo. **Perfil:** D11 productor de evidencia, revisión independiente D12. **Alcance:** PostgreSQL local de QuisqueyaHome CRM, solo lectura; sin filas, payloads, PII, URL, credenciales, cambios de esquema ni push. **Estado:** evidencia parcial para I01-A DRAFT; no acredita READY ni sustituye ensayo de migración/worker.

## Método y fuentes

Se leyeron `.viltrum/vre-os/spec/integraciones/lotes/I01-A-outbox.md`, `.viltrum/reviews/D14-revision-I01-A-outbox-r2-2026-10-04.md`, `src/infrastructure/db/schema.ts` y `src/infrastructure/db/client.ts`. La ficha I01-A fue editada por D03 durante esta auditoría: el primer contenido leído no contenía `outbox_resolutions`; la revisión final sí, con fecha local de modificación 2026-10-04 22:54:38. Los hallazgos de conciliación siguientes se refieren a **esa versión posterior**, no afirman revisión de una versión estable o aprobada.

Consulta vía driver `postgres` con la `DATABASE_URL` cargada desde `.env`, **solo tras verificar programáticamente que el host era loopback**; la URL y sus componentes no se imprimieron. Una única conexión con `default_transaction_read_only='on'`, tiempo de espera de conexión y consulta acotado. Se ejecutaron únicamente `COUNT(*)`/agregaciones de estados y versión, más catálogos `pg_roles`, `pg_class`, `pg_policies` e `information_schema.role_table_grants`. No se seleccionó ninguna fila de negocio ni columnas de payload/identificadores externos. No se leyó ni cambió el valor de ningún secreto. El acceso a la base funcionó; los UNKNOWN restantes son sobre estado de procesos/credenciales no observado, no sobre estos conteos.

## Resultado observado de la base local

| Superficie | Resultado |
|---|---:|
| Motor | PostgreSQL 15.8, DB `quisqueyahome_crm` |
| `current_user` / `session_user` de esta conexión | `postgres` / `postgres` |
| Rol `postgres` | `rolsuper=true`, `rolbypassrls=true`, LOGIN; dueño de las tres tablas |
| `outbox` | **0 total**; 0 pendientes (`sent_at/dead_at NULL`), 0 enviadas, 0 muertas; ninguna versión agrupable |
| `outbox_dead` | **0 total** |
| `external_refs` | **0 total**; 0 con `version=1` |
| `command_receipts`, `outbox_aggregate_cursor` | No existen en `public` al consultar |
| `outbox`, `outbox_dead`, `external_refs` | `relrowsecurity=true`, `relforcerowsecurity=false`, propietario `postgres` |
| Políticas RLS en esas tablas | **0** |
| Grants visibles para esas tablas | `postgres` tiene SELECT/INSERT/UPDATE/DELETE y también TRUNCATE, TRIGGER, REFERENCES; no aparecieron grants a `crm_app` ni `crm_outbox_worker` |
| Roles `crm_app` y `crm_outbox_worker` | No aparecen en `pg_roles` consultado |

**Interpretación limitada:** no hay trabajo legacy pendiente que clasificar **en esta base y en el instante de la consulta**; volver a medir inmediatamente antes de A2. La ausencia de filas permite un ensayo con fixtures sintéticos, pero no sustituye copia restaurada ni prueba de rollback. RLS habilitado sin políticas aplica denegación por defecto a un rol ordinario con grants, pero la conexión observada es superusuario/BYPASSRLS y no queda restringida por RLS; `FORCE ROW LEVEL SECURITY` tampoco corrige un superusuario. Este comportamiento coincide con el comentario de `drizzle/0001_enable_rls_public_tables.sql` y la documentación de [PostgreSQL RLS](https://www.postgresql.org/docs/15/ddl-rowsecurity.html). No se comprobó que el proceso Next.js o el worker activo use en este momento exactamente esta misma credencial; `client.ts` obtiene `DATABASE_URL`, pero identidad **runtime** y viabilidad de separación de conexiones siguen **UNKNOWN** hasta D16.

## Revisión de la tabla de conciliación añadida por D03

La versión posterior de I01-A propone `outbox_resolutions(event_id, decision, resolved_by uuid, resolved_at, resolution_reason, resolution_evidence jsonb, remote_external_id, replacement_event_id)` y función restringida para resolución. La tabla separada es buena forma de conservar una decisión final y no contaminar `attempt_history`; las condiciones de abajo deben incorporarse al diccionario antes de READY:

1. **Tipo de FK incorrecto (bloqueante):** `src/infrastructure/db/schema.ts` define `users.id` como `serial`, por tanto PostgreSQL `integer`. `resolved_by uuid REFERENCES users(id)` no se puede materializar contra esa PK. Cambiar a `resolved_by integer NOT NULL REFERENCES users(id) ON DELETE RESTRICT ON UPDATE RESTRICT`. `users.auth_user_id` es texto puente de Auth, no reemplazo de `users.id` para esta FK. La autorización Admin activo se verifica en la transacción; una FK no prueba rol.
2. **Integridad de resolución:** `event_id` PK/FK asegura una resolución por evento, pero debe fijarse `ON DELETE RESTRICT` y no conceder UPDATE/DELETE a app/worker/admin. `decision` necesita CHECK cerrado. `REMOTE_CONFIRMED` requiere evidencia verificable y, si se actualiza `external_refs`, un `remote_external_id` no vacío; `CANCELLED_WITH_REPLACEMENT` requiere `replacement_event_id IS NOT NULL`, distinto de `event_id`. Un `CHECK` cubre nulidad; que reemplazo pertenezca al mismo destino/agregado y tenga revisión válida requiere transacción/trigger o función bajo lock (la ficha ya lo propone).
3. **Evidencia JSON controlada:** el contrato `{kind, source, evidence_sha256}` debe tener versión de esquema, tipo/longitud del SHA-256, claves exactas y valores permitidos; validar por aplicación y función SQL o CHECK/fila normalizada. `resolution_reason` debe referir catálogo de códigos cerrado y documentado, con motivo libre confidencial fuera de logs/outbox; actualmente el nombre del catálogo y sus códigos no están fijados. Guardar solo digest minimizado no equivale a conservar la evidencia remota: especificar repositorio seguro, identificador de evidencia, retención y quién puede verificarla; Q-C1-05 limita PII real.
4. **Roles/políticas de nueva tabla:** `crm_resolution_admin` por `EXECUTE` de función, sin DML directo, es una dirección coherente. La función `SECURITY DEFINER` (si esa es la elección) debe fijar `search_path`, propietario no superusuario, `EXECUTE` revocado de `PUBLIC`, comprobar Admin vigente y enlazar identidad autenticada. El rol auditor para el `SELECT` de A6 debe nombrarse y tener política/grant de solo lectura; el worker y broker deben fallar. No hay ninguno de esos roles en la DB observada.
5. **Atomicidad y orden:** insertar resolución, cambiar `resolution_state`, escribir referencia y desbloquear siguiente revisión en una transacción, con lock del evento y CAS. `REMOTE_CONFIRMED` no falsifica `sent_at`; `CANCELLED_WITH_REPLACEMENT` no libera r2 hasta que el sustituto esté identificado y ordenado. El test debe simular dos conciliaciones concurrentes: una fila en `outbox_resolutions`, una transición y ningún ref duplicado.

Esto es revisión de diseño; no se editó la ficha D03. D14 también pidió carrera de dos workers al expirar un lease con dispatch iniciado. La versión posterior ya añadió `UPDATE ... RETURNING` con una transición efectiva y `attempts` sin incremento; D14 debe verificarlo independientemente con dos conexiones reales. El primer `claim_epoch` se fijó en 1 en la versión posterior. Un crash debe terminar proceso/conexión sin cleanup y reiniciar sobre la misma DB, no simularse solo con excepción.

## Próximo paso y límites

1. D03 corrige la FK `resolved_by` y cierra constraints/catálogo/evidencia de `outbox_resolutions`; D12 revisa función, privacidad y permisos. D14 revisa de nuevo sobre hash/versión estable.
2. D16 identifica **en ejecución** las credenciales efectivas de app y worker sin exponerlas y diseña su separación; D11/D12 prueban `current_user`, `rolsuper`, `rolbypassrls`, propietario, FORCE, policies y grants con esas conexiones en DB temporal. La propuesta `crm_app`/`crm_outbox_worker` no existe hoy.
3. Antes de A2, repetir conteos, comprobar número de migración libre, respaldar/restaurar en DB temporal y ensayar expandir/clasificar/rollback con fixtures que incluyan pendientes, sent, DLQ, refs ambiguas y dos workers. Los cero actuales no prueban la migración en un conjunto representativo.

**Resultado D11:** conteos y rol SQL de la conexión local observados; aprobación de I01-A/READY **pendiente**. No hay datos para afirmar que un envío a Twenty exista o que su reintento remoto sea idempotente.
