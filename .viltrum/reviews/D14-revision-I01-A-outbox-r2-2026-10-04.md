# D14 · Revisión independiente (documental) · I01-A actualizado · 2026-10-04

**Alcance:** revisión de la ficha `.viltrum/vre-os/spec/integraciones/lotes/I01-A-outbox.md` frente a los hallazgos de mi revisión previa (`D14-revision-outbox-I01-A-2026-10-04.md`). No ejecuto pruebas, no declaro `READY`, no evalúo código ni gate. Riesgo R3 confirmado.

## 1. Hallazgos previos: estado de cierre

| # | Hallazgo previo | Estado en esta versión |
|---|---|---|
| 1 | Identidad/clave con dos diseños posibles ("o recibe idempotencyKey durable") | **Cerrado.** Contrato único: `command_receipts(command_id uuid PK, actor_id, operation, request_hash, status, result_ref)`, hash `sha256(canonical_json_v1)` con reglas de normalización explícitas, `idempotency_key = v1/{destination}/{commandId}/{eventType}/{aggregateType}/{aggregateId}`. |
| 2 | Predicado de fencing impreciso; no exigía "cero filas" en ambas confirmaciones | **Cerrado.** Predicado único `event_id + claim_token + claim_epoch + lease_until>clock_timestamp() + sent_at IS NULL + dead_at IS NULL`; "cero filas = `STALE_CLAIM`, no cambia refs/intentos/historial/DLQ" queda explícito y es oráculo de A4. |
| 3 | "Otra transacción puede operar" no probaba ausencia de transacción abierta durante HTTP | **Cerrado.** "Ningún callback de red corre dentro de `db.transaction`" + oráculo A5 exige `pg_stat_activity`/`pg_locks` con **cero transacciones abiertas del worker** durante remoto suspendido. |
| 4 | Orden r1/r2 no contemplaba DLQ como bloqueante | **Cerrado.** Punto 5 y A6: r2 espera r1 "pendiente, reclamada, incierta **o en DLQ**"; liberación solo por conciliación auditada. |
| 5 | Crash/restart probado con doble en memoria, no DB real | **Cerrado en el enunciado.** A4/A6 exigen explícitamente "misma DB persistida" tras claim y tras efecto remoto. (Ver P2-3 sobre semántica exacta de "crash".) |
| 6 | Legacy/RLS sin plan de conteo ni rol SQL concreto | **Mejorado, no cerrado.** Hay plan expandir→clasificar→conciliar→activar y matriz de roles/grants concreta, pero la ficha admite "conteos actuales: UNKNOWN" y "viabilidad del reemplazo de identidad: UNKNOWN". Ver P1-2. |
| 7 | `spec:check` no cubre `integraciones/lotes/`, exit 0 no valida el anexo | **Cerrado (transparencia).** La ficha ya declara que no se marca READY por sí sola y que I00 es la canónica para `TAREA.md`. |

El avance es real: hay **un solo contrato** de identidad, revisión y cola, y los oráculos de A1–A6 son en su mayoría verificables con observables de PostgreSQL concretos (no inferencias).

## 2. Hallazgos nuevos sobre esta versión

**P0:** ninguno. No encuentro ambigüedad de contrato que impida construir una prueba (a diferencia de la revisión anterior).

**P1-1 — Falta esquema para la evidencia de conciliación.**
El punto 5 exige que la conciliación "guarde... actor Admin, fecha DB, referencia/evidencia remota y motivo en auditoría", y A6 pide "operador libera con evidencia auditada". El diccionario DDL (sección "Diccionario DDL conceptual") **no define dónde viven esos campos** (¿columnas nuevas en `outbox`: `resolved_by`, `resolved_at`, `resolution_reason`, `resolution_evidence`? ¿tabla de auditoría separada?). Sin esa columna/tabla fijada, el oráculo de A6 no puede verificar "evidencia auditada" de forma determinista.
*Oráculo requerido:* D03/D11 deben fijar la(s) columna(s) exactas antes de que A6 se despache, de modo que la prueba pueda hacer `SELECT resolved_by, resolution_reason, resolution_evidence FROM outbox WHERE event_id=... ` y comparar contra valores esperados.

**P1-2 — Dos UNKNOWN autodeclarados siguen bloqueando criterios (b)/(e).**
"Conteos actuales: UNKNOWN; no se corrió consulta DB en esta sesión" e "Identidad actual del proceso y viabilidad del reemplazo: UNKNOWN hasta consulta D11/D16" son honestos, pero significan que el plan legacy y la matriz de roles están **diseñados sobre datos no verificados**. No es un defecto de redacción, pero es una condición de cierre pendiente de D11/D16 antes de que A2 (legacy) y A7 (roles) puedan despacharse con confianza; no los trato como resueltos solo porque estén declarados.

**P1-3 — Transición automática a `UNCERTAIN` por lease vencido no tiene oráculo de concurrencia entre dos workers.**
La sección de transiciones exige que esa transición sea "atómica frente a dos workers", pero el oráculo de A4 solo describe: claim inicial único, recuperación de lease sin dispatch, paso a incierto con dispatch, y cero filas en éxito/fallo tardío **sin segundo claim**. No se pide probar que **dos workers que detectan el mismo lease vencido con `dispatch_started_at` seteado** intentando ambos la transición a `UNCERTAIN` produzcan el mismo resultado final sin doble escritura de historial/`attempts`.
*Oráculo requerido:* A4 debe añadir el caso "dos workers ejecutan la transición de expiración simultáneamente → exactamente una transición efectiva, la segunda afecta cero filas, `attempts`/historial no se duplican".

**P2-1 — Valor inicial de `claim_epoch` no fijado para el primer claim.**
`claim_epoch bigint DEFAULT 0`, pero no se dice si el primer `reclamar()` deja el epoch en `1` (incrementado desde 0) o en otro valor. El oráculo de A4 ("un claim inicial") necesita un valor esperado exacto para poder aserirse.

**P2-2 — Densidad de A4 frente al límite de 45 min.**
A4 ya cubre: barrera de dos workers, recuperación de lease sin dispatch, transición a incierto con dispatch, cero filas en éxito/fallo tardío sin segundo claim, y ahora (P1-3) la carrera entre dos workers sobre la misma transición. Es una lista extensa para un único despacho; recomiendo que D00 confirme antes de despachar si se divide (p. ej. A4a claim/recuperación, A4b transición a incierto + carrera) para no incumplir la cláusula de que "se divide otra vez si el ensayo excede ese tiempo".

**P2-3 — Semántica de "crash" en A6 no especifica terminación abrupta.**
"Crash de proceso y worker nuevo en misma DB persistida" no indica si el proceso debe terminarse de forma abrupta (p. ej. `SIGKILL`/cierre de conexión sin `COMMIT`/`ROLLBACK` ordenado) o si basta un apagado controlado. Un apagado ordenado podría ejecutar limpieza que un crash real no permite, debilitando el oráculo.
*Oráculo requerido:* especificar que el proceso que sostiene el claim se termina sin cierre ordenado de conexión (o se mata la conexión del pool) antes de que el worker nuevo intente reclamar.

## 3. Dictamen

**RECHAZADO** como propuesta documental, en esta ronda.

No por regresión de fondo —los seis hallazgos P0 de mi revisión anterior están efectivamente resueltos y el contrato es ahora único y mayormente verificable— sino porque quedan tres puntos P1 (esquema de auditoría de conciliación sin definir, dos UNKNOWN autodeclarados que son precondición de A2/A7, y ausencia de oráculo para la carrera de transición a `UNCERTAIN` entre dos workers) que impiden fijar algunos oráculos A4/A6/A7 con la precisión exigida por el criterio (d) de la propia ficha. Cerrados estos tres puntos, la base de A1–A6 me parece suficientemente sólida para una siguiente ronda de revisión.
