# Revisión D12 · Contrato I01-A (outbox seguro) + auditoría D11 local

**Rol:** revisor independiente, documental. **Alcance de esta revisión:** el contrato actualizado en `.viltrum/vre-os/spec/integraciones/lotes/I01-A-outbox.md` y el informe `D11-auditoria-local-outbox-roles-2026-10-04.md`, cotejados entre sí. No ejecuté SQL, no corrí pruebas, no reviso código y no declaro `READY` ni gate: eso corresponde a D00/D11/D14 según los criterios de promoción ya fijados en la propia ficha.

## Veredicto: **CONDICIONAL**

El contrato incorpora correctamente los hallazgos previos de D11 (FK `resolved_by` corregida a `integer`, `claim_epoch` arrancando en 1, transición de incertidumbre con `UPDATE...RETURNING` cercado por fila) y el diseño de fencing/orden/reconciliación es internamente consistente. No encuentro defecto que invalide el contrato como tal. Pero persisten brechas P1 que deben cerrarse en el documento antes de que D00 lo considere para promoción, y mejoras P2 de consolidación.

---

## P1 — deben resolverse antes de READY

### P1-1 · Vínculo de identidad de `resolved_by` no especificado a nivel SQL
**Archivo/sección:** `I01-A-outbox.md`, diccionario DDL `outbox_resolutions` + párrafo "El servicio Admin verifica `requireScope`...".
**Tipo:** observación de diseño, no de ejecución.
**Criterio:** fencing/autorización — una función `SECURITY DEFINER` que inserta una decisión irreversible debe dejar claro de dónde proviene `resolved_by`. El texto dice que "el servicio verifica... antes de llamar", pero no fija si el parámetro se deriva server-side de la sesión autenticada o si viaja como argumento confiado ciegamente desde una capa superior. Sin esa precisión, el contrato no puede acreditar que un `crm_resolution_admin` comprometido (o un bug de capa aplicación) no pueda atribuir la resolución a un actor distinto del que realmente ejecutó la llamada. Pedir que el documento declare explícitamente el origen de `resolved_by` (sesión server-side exclusivamente, sin parámetro de cliente) antes de READY.

### P1-2 · Repositorio y retención de evidencia sigue UNKNOWN
**Archivo/sección:** `I01-A-outbox.md`, nota final de la tabla `outbox_resolutions` ("Repositorio, acceso y plazo de evidencia: UNKNOWN...").
**Tipo:** confirmo observación ya señalada por D11; sigue sin resolver en esta versión.
**Criterio:** PII/evidencia — `resolution_evidence` solo guarda un digest y un `evidence_record_id` opaco; sin repositorio, control de acceso y retención aprobados, `REMOTE_CONFIRMED`/`CANCELLED_WITH_REPLACEMENT` quedan sin respaldo verificable ante una auditoría real. Esto bloquea Q-C1-05 y debe resolverse antes de aceptar datos reales, aunque no bloquea necesariamente la migración con fixtures sintéticos.

### P1-3 · El modelo de roles/RLS descrito no ha sido validado contra identidad de ejecución real
**Archivo/sección:** `I01-A-outbox.md`, punto 6 del contrato + "Matriz SQL objetivo a revisar con identidad real"; contrastado con `D11-auditoria-local-outbox-roles-2026-10-04.md`, tabla de resultados.
**Tipo:** esto es una **observación real** de D11 (no diseño): la conexión auditada opera como `postgres`, `rolsuper=true`, `rolbypassrls=true`, `relforcerowsecurity=false`, cero políticas, y los roles `crm_app`/`crm_outbox_worker` no existen en `pg_roles`.
**Criterio:** RLS/privilegios mínimos — el contrato ya marca esto como `UNKNOWN hasta D16` y lo deja como precondición, lo cual es correcto; no es un defecto del documento. Lo señalo como P1 (no P2) porque es una condición de aceptación explícita en los criterios de promoción ((b)/(c) de la ficha) y conviene que quede trazada aquí también: ninguna garantía de aislamiento por rol descrita en el contrato ha sido contrastada todavía contra un proceso app/worker real con credenciales separadas.

---

## P2 — consolidación y claridad, no bloqueantes

### P2-1 · `outbox_resolutions` falta en la tabla "Matriz SQL objetivo"
**Archivo/sección:** `I01-A-outbox.md`, tabla "Matriz SQL objetivo a revisar con identidad real".
**Criterio:** auditabilidad — los roles `crm_resolution_admin` (solo `EXECUTE`), `crm_resolution_auditor` (solo `SELECT`) y la ausencia de acceso de `crm_app`/`crm_outbox_worker`/rol ordinario están descritos en prosa pero no aparecen como fila de la matriz. Consolidarlo reduce el riesgo de que una futura migración de permisos omita esta tabla.

### P2-2 · Falta `REVOKE ALL ... FROM PUBLIC` explícito sobre las tablas nuevas
**Archivo/sección:** diccionario DDL, fila `outbox_resolutions` y tablas vecinas.
**Criterio:** privilegios mínimos — el contrato es explícito con `REVOKE EXECUTE... FROM PUBLIC` para la función, pero no dice lo mismo para las tablas (`command_receipts`, `outbox_aggregate_cursor`, `outbox`, `outbox_resolutions`). Dado que ya se exige `FORCE ROW LEVEL SECURITY` y políticas `TO role`, declarar también la revocación de `PUBLIC` sobre las tablas cierra el mismo razonamiento de forma simétrica.

### P2-3 · Catálogo `status` de `command_receipts` no contempla fallo local terminal
**Archivo/sección:** diccionario DDL, fila `command_receipts`.
**Criterio:** idempotencia — solo existen `IN_PROGRESS`/`COMPLETED`. No se especifica qué pasa si el comando falla por validación de dominio antes de llegar a outbox (p. ej., Zod/regla de negocio rechaza la operación dentro de la misma transacción). No es necesariamente un error — si el rollback revierte también el insert del recibo, la clave queda libre para reintento y el catálogo binario podría ser intencional—, pero el contrato no lo aclara explícitamente y conviene decirlo para que D14 sepa qué oráculo probar.

### P2-4 · Algoritmo de inserción idempotente de la fila `outbox` en A3 no tiene el mismo nivel de detalle SQL que el del cursor
**Archivo/sección:** punto 2 del contrato (cursor, con `INSERT...ON CONFLICT...RETURNING` explícito) vs. punto 1/tarea A3 (solo descrito por el resultado esperado del test).
**Criterio:** completitud documental — el comportamiento ante dos emisiones concurrentes con la misma identidad `(destination, command_id, event_type, aggregate_type, aggregate_id)` se infiere del test de A3 ("una fila/una revisión") pero no se fija como idioma SQL (p. ej. `ON CONFLICT DO NOTHING RETURNING event_id`, con `SELECT` de respaldo si no retorna fila). Fijarlo evita que D11/D14 interpreten distinto la implementación esperada.

---

## Nota de trazabilidad (observación vs. diseño)

- **Observación real confirmada** por D11 y reafirmada aquí: estado de la DB local (`current_user=postgres`, superusuario/`bypassrls`, `outbox`/`outbox_dead`/`external_refs` en 0 filas, RLS habilitado sin `FORCE` y sin políticas, roles `crm_app`/`crm_outbox_worker` inexistentes). Esto no prueba ni refuta el contrato — es el punto de partida AS-IS que el contrato debe migrar.
- **Todo lo demás evaluado aquí es diseño documental** (esquema conceptual, matriz de permisos objetivo, flujo de reconciliación): no hay migración aplicada, ni prueba de concurrencia PostgreSQL real, ni identidad runtime verificada. El propio documento lo reconoce (UNKNOWN en varios puntos) y no debe leerse como evidencia de funcionamiento.

## Qué falta antes de READY (no otorgo esa condición)

1. D03 cierra P1-1 (origen de `resolved_by`) en el texto del contrato.
2. D11/D12 confirman P1-2 y P1-3 con una decisión de repositorio de evidencia y con D16 entregando identidad runtime real para contrastar roles.
3. D00 decide si los P2 se incorporan antes de READY o se delegan a las tareas A2/A7 (son de detalle, no bloquean el diseño).

No declaro este anexo `READY`, no afirmo que exista código, gate o prueba corrida: esta es una revisión documental de contrato, conforme al alcance que se me asignó.
