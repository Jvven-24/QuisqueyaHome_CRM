# D12 · Revisión independiente — Diseño D11 Academy CORE-2 (R3)

**Veredicto (propuesta D12, no gate, no aprobación de código):** **CONDICIONAL**

El modelo de datos es internamente coherente y los controles anti-autoaprobación/append-only están bien pensados, pero el documento mismo admite que su pieza más crítica — que RLS proteja algo en producción — **no está acreditada**, y que las pruebas A/B y el ensayo de rollback están *descritos*, no *ejecutados*. No corresponde READY mientras eso siga así.

---

## Qué está bien (se dice porque es cierto)

- `CHECK actor_user_id <> broker_user_id` en `academy_decisions` es control de autodecisión a nivel de base de datos, no solo de aplicación — correcto, no se puede saltar desde SQL directo con ese rol.
- Separación `academy_decisions` (hecho histórico, append-only) vs `academy_certificates` (materialización reconstruible) vs `academy_decision_audit` (auditoría sin PII) es la arquitectura correcta para "100% no certifica" y revocación sin reescritura.
- `public_id uuid` vs PK secuencial interna evita enumeración de IDs en superficie expuesta.
- Reconoce explícitamente que `FORCE RLS` no detiene a superusuario/`BYPASSRLS` — cita correcta de la documentación de Postgres, evita la trampa común de creer que `FORCE` basta.
- Idempotencia vía `academy_command_receipts` con hash de cuerpo y 409 en reintento con payload distinto — diseño correcto para evitar doble aprobación por reintento de red.
- Honestidad documental: el propio texto dice "no se hizo este ensayo", "no se midió", "DRAFT" — eso es exactamente lo que debe contener un diseño antes de READY, y facilita esta revisión.

---

## P0 — Bloqueantes antes de READY (no se puede pasar a gate sin esto)

1. **RLS no acreditado con el rol real.** La migración existente confirma que `DATABASE_URL` usa `postgres`, que probablemente ignora RLS (`BYPASSRLS`/superusuario). El diseño propone `qh_academy_app` sin probarlo. **Debe ejecutarse** la prueba A/B del §4 (current_user, rolbypassrls, pg_policies, SELECT/INSERT/UPDATE/DELETE cruzados broker A/B, Admin-sobre-sí-mismo, worker/migrador) contra el rol que la API usa *hoy*, para demostrar el bypass actual, y luego contra `qh_academy_app` propuesto. Sin esta corrida en DB temporal con resultados guardados, toda la sección 4 es una afirmación de diseño, no un control verificado.
2. **Corte de conexión fuera del alcance de CORE-2.** Las políticas RLS son inertes si nadie reasigna el rol de conexión de la API. D03 debe abrir explícitamente ese lote antes de que CORE-2 pueda considerarse protegido. No basta con mencionarlo; debe existir una tarea con dueño y archivo.
3. **Ensayo de migración/rollback no ejecutado.** §5 dice textualmente "no se hizo este ensayo en este documento". Se requiere corrida real en Postgres temporal: conteos/hashes antes-después, inserts inválidos (FK cruzada, `percent>100`, autodecisión, doble aprobación/revocación), concurrencia con dos conexiones, fallo inducido post-decisión-pre-auditoría, y rollback expand-only reversible. Sin esto, "reversibilidad" es un plan, no una propiedad verificada.
4. **Función transaccional (SECURITY DEFINER vs rol+trigger) sin SQL concreto.** El propio documento dice "D12 debe revisar la elección", pero no hay elección: solo dos opciones mencionadas. No se puede evaluar riesgo de escalamiento de privilegios (search_path, EXECUTE, superación de invariantes interfilas) sin el cuerpo real de la función/trigger.
5. **Numeración de migración `0004` sin revalidar.** El journal se leyó en `0003` "en esta lectura"; antes de generar cualquier DDL hay que revalidar contra `git`/journal actual para no colisionar con trabajo concurrente de otro agente.

## P1 — Deben resolverse antes de READY (pueden avanzar en paralelo al diseño)

1. **Algoritmo canónico del digest de evidencia no especificado.** `digest_sha256`/`digest_version` necesitan definición exacta de campos, orden y serialización; de lo contrario el chequeo "evidencia modificada desde snapshot → 409" no es reproducible ni auditable entre servidor y revisor.
2. **FK "solo si existe" de `academy_evidence_snapshots` a `academy_progress`** es ambigua: ¿es una FK compuesta nullable real (semántica MATCH SIMPLE) o un join de aplicación sin restricción en DB? Deben distinguirse explícitamente — son garantías de integridad distintas.
3. **Retención/exportación de `academy_decisions.reason`** queda pendiente de Q-C1-05 — correcto no resolverlo aquí con datos sintéticos, pero debe tener dueño y fecha antes de que exista PII real en esta tabla.
4. **Integración con `audit_log` existente** (¿referencia minimizada sí/no?) requiere decisión D03 explícita antes de tocar la vista de auditoría actual.
5. **Índices candidatos sin medir.** `(state, requested_at, id)` y `(broker_user_id, program_version_id, requested_at DESC)` se etiquetan correctamente como "candidatos", pero antes de READY necesitan `EXPLAIN` real en DB temporal, no solo intuición de acceso.
6. **Semántica de reactivación tras suspensión/revocación** depende de un caso (baja de usuario) fuera de CORE-2. Debe quedar bloqueada explícitamente en el código (p. ej. constraint o comentario de invariante) para que CORE-3/4 no construya sobre un supuesto que D03 aún no decidió.

## P2 — Observaciones menores

1. Fijar de una vez la convención de PK (`bigint identity` vs `integer`) "conforme convención de repo" en vez de dejarla como disyuntiva en el DDL final.
2. La normalización de 404 uniforme para IDs ajenos/inexistentes (evitar fuga de existencia vía errores de FK/UNIQUE) es responsabilidad de capa API — anotarlo como requisito explícito para quien construya CORE-4, no asumirlo implícito.
3. Documentar la situación de un Admin que también es Broker certificándose en otro programa: el `CHECK` cubre la fila, pero conviene una nota operativa sobre conflicto de interés más amplio (no es un hueco técnico, es higiene de proceso).

---

## Qué NO se acredita con este documento

- Que RLS proteja algo hoy (el rol de conexión actual probablemente lo evita).
- Que las políticas propuestas en §4 aíslen correctamente a broker/Admin/worker (prueba descrita, no corrida).
- Que la migración sea reversible en la práctica (ensayo no ejecutado).
- Rendimiento de los índices propuestos (sin `EXPLAIN`).
- Conteos actuales de filas en `academy_items`/`academy_progress`/etc. (dato histórico, no reconsultado).
- Validez del número de migración `0004` frente al estado real del repo.
- Seguridad de la función transaccional elegida (no hay elección ni SQL concreto todavía).
- Algoritmo exacto del digest de evidencia (no especificado byte a byte).

## Bloqueos para pasar a READY

CORE-2 (y por extensión CORE-3/4/5) permanece en DRAFT hasta que: (a) D03 asigne y confirme el lote de corte de conexión de la API; (b) se ejecuten y documenten las pruebas A/B de rol/RLS del §4 con resultados redactados; (c) se ejecute el ensayo de migración/rollback del §5 con evidencia capturada; (d) se entregue el SQL concreto de la función/trigger transaccional para revisión de D12; y (e) se resuelvan las decisiones D03/D01 listadas en §6 (alta de curso/versión, reactivación, retiro de asignación). Hasta entonces, este documento es una propuesta de diseño razonable, no una especificación verificada.
