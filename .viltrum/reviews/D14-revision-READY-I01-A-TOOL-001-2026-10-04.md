# D14 · Revisión independiente para READY: I01-A y TOOL-001 · 2026-10-04

**Entradas:** `.viltrum/vre-os/spec/integraciones/lotes/I01-A-outbox.md`, `specs/001-spec-check-catalogo-no-ficha/spec.md`, contrato D11 `D11-contrato-datos-integraciones-C1-2026-10-04.md` e informe D14 anterior `D14-revision-outbox-I01-A-2026-10-04.md`. Clasificación INTEGRACION/infraestructura, R3 para outbox; gobernanza R2 para TOOL-001. Esta revisión de QA no modifica fichas ni código y no aprueba gate. D00 es revisor de la revisión D14.

## Decisión de QA

| Ficha | Testabilidad propuesta | Estado para READY hoy | Causa principal |
|---|---|---|---|
| **I01-A outbox** | Parcial; A1–A4 tienen objetivos útiles. | **FAIL** | D03 no ha fijado contrato único de identidad/cola/revisión; D11 no ha cerrado política DLQ, migración legacy ni rol SQL; criterios de prueba DB necesitan oráculos más exactos. La subficha anidada no entra en `spec:check`. |
| **TOOL-001 spec:check** | **PASS de criterios escritos:** excepción exacta y regresiones negativas bien formuladas. | **FAIL** | Implementación ya presente en checkout contradice el contrato: filtro general por prefijo silencia `OTRO.md` y `CAPACIDADES.md` en otros directorios. Las cinco pruebas existentes no cubren esos casos; D12 y D00 deben revisar antes de READY. |

## I01-A: cierre requerido

La nueva subficha resuelve el bloqueo histórico de «ficha inexistente» y separa correctamente outbox de adaptación Twenty. Incluye replay del comando, dos workers, lease/fencing, respuesta tardía, crash, RLS y DB real. Aun así, `estado: DRAFT`, `nivel: L1`, y la sección «Contrato propuesto» conserva alternativas. **D14 no puede firmar A1–A4 como pruebas ejecutables hasta que haya un solo contrato esperado.**

1. **Identidad y revisión:** D03 escoge formato único de `commandId`/clave y de `ColaOutbox`, generación transaccional de `aggregateRevision`, `schemaVersion` y `claimEpoch` separados, `destination`/tipo de agregado e invariantes/índices. D11 revisa unicidad, migración y `external_refs`. La frase «o recibe `idempotencyKey` durable» aún deja dos diseños distintos; el test no puede fijar el oráculo.
2. **Concurrencia DB:** la prueba de A2/A3 necesita barrera para dos conexiones reales, resultado único de claim inicial y prueba de lease vencido mientras el primer remoto sigue vivo. Tanto `finalizarEnviado` como `finalizarFallido` con token/epoch viejo deben afectar cero filas, no solo la referencia. Verificar `sent_at`, `dead_at`, intentos, historial, DLQ y refs. D11 propone predicado `claim_token + claim_epoch + lease_until > clock_timestamp()`; la ficha debe adoptarlo o explicar equivalente verificable.
3. **Red fuera de transacción:** «otra transacción puede operar» no demuestra ausencia de transacción del primer worker; con `SKIP LOCKED` podría operar aun si el lock sigue. A3 debe exigir observación de `pg_stat_activity`/`pg_locks` o instrumentación equivalente del pool **durante** stub HTTP suspendido, con commit de claim comprobado antes de invocar `CrmPort`.
4. **Orden y DLQ:** D11 fija r2 bloqueada por r1 pendiente, incierta **o en DLQ**, hasta conciliación explícita del operador. I01-A solo dice que revisión antigua no pisa nueva; A4 debe probar r1/r2 mismo agregado más otro agregado, r1 DLQ bloqueando r2 y liberación auditada tras conciliación. La interfaz preparada sin semántica de negocio puede llegar a READY solo si su límite está escrito con claridad y la prueba de orden se asigna a un lote posterior obligatorio; no marcar A4 cumplida con un doble que no pruebe esta política.
5. **Crash/restart y resultado incierto:** crear worker nuevo con **la misma PostgreSQL persistida** tras caída después del claim y tras efecto remoto antes de finalización. La frase «replay no duplica referencia» no prueba que Twenty no duplica efecto; ante API remota sin deduplicación verificada, el evento queda para conciliación/HUMAN_REQUIRED y no hace un segundo envío ciego. Probar timeout después de efecto y fin local obsoleto.
6. **Legacy y seguridad DB:** D11 exige conteo/estado de filas heredadas, cuarentena sin revisión/destino acreditados, y `external_refs.version=1` tratado como ambiguo; la ficha debe referenciar este contrato y una prueba sobre copia restaurada. A2 incluye RLS, pero debe exigir identidad SQL efectiva, grants/policies y prueba negativa con rol normal y positiva con worker de mínimo privilegio. `.enableRLS()` sola no es aceptación.
7. **Seguimiento Spec:** la subficha está en `integraciones/lotes/`. `runCheck()` enumera solo el primer nivel de `integraciones`, de modo que el `spec:check` actual informa 4 fichas e **ignora I01-A**. D00 debe registrar cómo se valida/promueve/actualiza índice para esta subficha; un exit 0 del script no demuestra su READY. I01 padre permanece DRAFT.

**Regresión tras implementación:** `typecheck`, `lint`, `npm test`, `npm run test:db` con las carreras y permisos anteriores, `spec:check`, build en worktree seguro, y revisión independiente D12/D14. Las 130 pruebas DB de la línea base aún no cubren claim/finalización reales.

## TOOL-001: la especificación es precisa, el código actual no la cumple

La ficha exige ignorar **solo** el basename exacto `CAPACIDADES.md` en `integraciones/`, y seguir rechazando `OTRO.md`, `I03-defectuosa.md` y un `CAPACIDADES.md` bajo `modulos/` o `globales/`. Ese es el criterio correcto. Sin embargo, el diff local actual de `scripts/spec/check.mjs` añade cerca de la línea 108:

```js
if (!/^[MGI]\d+-/i.test(path.basename(filename))) continue;
```

Ese filtro acepta solo archivos con prefijo de ficha y salta **todo** otro Markdown, en cualquiera de los tres directorios. Resultado observado en fixture temporal con `CAPACIDADES.md` y `OTRO.md` en integraciones, `I03-defectuosa.md` en integraciones y `CAPACIDADES.md` en módulos: `runCheck()` devolvió `stats.total=1`, solo hallazgos de `I03-defectuosa.md`; omitió `OTRO.md` y el catálogo situado en módulos. El fixture se creó y eliminó fuera del repositorio, sin modificar código. `node --test scripts/spec/check.test.mjs` pasó 5/5, pero carece de estas regresiones; `npm run spec:check` pasó con 0 bloqueos en el checkout actual, sin que eso acredite el contrato de TOOL-001.

**Requisitos para READY y parche posterior:**

1. D14 acepta los criterios de TOOL-001 **como diseño de pruebas**; D12 revisa que la excepción no oculte fichas inválidas y D00 registra la promoción según la constitución antes de despachar el cambio.
2. Retirar el filtro general por prefijo y excluir exclusivamente cuando `directory === 'integraciones' && path.basename(filename) === 'CAPACIDADES.md'`; mantener validación normal de cualquier otro `.md`, incluidos nombres inválidos. La excepción no debe propagarse a módulos/globales.
3. Añadir test de fixture con dos Ixx válidas y catálogo: total 2, catálogo sin bloqueo y archivo idéntico; repetir con `OTRO.md` y `I03-defectuosa.md`, cada uno bloquea; repetir con catálogo bajo módulos/globales, bloquea. Probar aviso no bloqueante y estados I01/I02 intactos. Ejecutar además el script CLI para verificar exit 1 en fixtures inválidos, no solo `runCheck().findings`.
4. `spec:check` verde tras corrección informa **cero bloqueos estructurales** de fichas de primer nivel; no convierte I01/I02/I01-A en READY. Las advertencias de tareas legadas quedan visibles. Repetir `typecheck`, `lint`, `test` y la prueba específica; no atribuir el lint de `capture_b.cjs` a este cambio.

**Conclusión:** I01-A requiere consolidación técnica con D03/D11/D12 para poder probarla. TOOL-001 tiene una especificación QA adecuada, pero el cambio ya presente incumple sus criterios negativos y genera un falso verde. **Ambas permanecen FAIL para READY en esta revisión.**
