# D12 · Revisión independiente — CORE-0 actualizado (M13-academy, C1:M10)

**Fecha:** 2026-10-04. **Perfil:** D12, revisión documental, sin ejecución de código ni pruebas. **Entrada:** versión actualizada de `M13-CORE-0` (DRAFT, owner D03) tras mi dictamen previo. **Objeto de este veredicto:** solo el texto del contrato — no valido código, no valido gate, no valido pruebas ejecutadas.

## Dictamen: **APROBADO** (contrato documental)

Las cuatro observaciones no bloqueantes de mi dictamen anterior quedan cerradas en el texto:

| # | Observación previa | Cierre verificado en esta versión |
|---|---|---|
| 1 | Payloads `isCertified` persistidos fuera de código (outbox, logs, caché, exports) | Se añade el párrafo "Antes del corte, inspeccionar en modo lectura si outbox, logs, caché o exportaciones persisten o retransmiten payloads con `isCertified`. Registrar ruta, productor/consumidor..." con cláusula de corte de despacho si aparece un productor activo fuera de archivos permitidos. |
| 2 | Ambigüedad de "Certificación pendiente de revisión" | Ahora está **prohibida explícitamente**: "se prohíbe también «Certificación pendiente de revisión»: implicaría una revisión iniciada que el sistema no registra". Cierre más fuerte que mi sugerencia original. |
| 3 | Evidencia HTTP manual sin soporte auditable | "Verificación y límites" exige ahora: "conservar captura HTTP auditable con fecha, comando o solicitud reproducible, estado, cuerpo relevante redactado y resultado esperado/observado para 0%, 100%, 401 y 403; no incluir cookies, tokens ni PII". |
| 4 | Falta de oráculo dedicado a 401/403 | Nuevo **oráculo 6**: "`GET /api/academy` devuelve 401 para anónimo y 403 para actor sin `academy:view`, antes y después del corte; no expone `resumen` en esas respuestas". |

No encuentro en el texto actualizado ninguna vía nueva por la que este lote certifique, decida o deje una huella de aprobación que no exista hoy. El contrato sigue sin tocar autenticación/permisos de forma sustantiva (solo los verifica), sigue sin introducir campo sustituto, y sigue en `DRAFT` — no se autodeclara `READY`.

## Riesgos restantes (no bloqueantes, a verificar en despacho/ejecución)

| # | Severidad | Riesgo | Qué exigir |
|---|---|---|---|
| 1 | P2 | La inspección de payloads persistidos (outbox/logs/caché/exports) está mandatada en la sección "Decisión de contrato" pero **no tiene owner ni presupuesto de tiempo en la tabla de tareas CORE-0A/B/C**. Si D00 despacha solo la tabla, esta inspección puede omitirse por falta de ranura explícita. | D00 debe asignar esta inspección a una tarea concreta (sugerido: ampliar el alcance de CORE-0C o crear una tarea CORE-0-previa ≤45 min) antes de abrir el worktree, no dejarla implícita en el texto narrativo. |
| 2 | P3 | El texto neutral que sustituye a las frases prohibidas a 100% ("texto neutral sobre el avance educativo") no está fijado literalmente; queda a redacción de D03. | D14 debe validar la redacción final contra el oráculo 5 (búsqueda literal de frases prohibidas) antes de aceptar el corte, no asumir que "neutral" se cumplió por intención. |
| 3 | P3 | La cláusula de corte de despacho ante un "productor activo fuera de los archivos permitidos" depende de que D03 reporte honestamente ese hallazgo durante una inspección de solo lectura sin instrumentación automatizada. | D12/D14 deben pedir evidencia explícita del resultado de esa inspección (aunque sea negativa: "no se encontraron productores activos") como parte del cierre, no solo la ausencia de mención. |

## Pruebas exigidas (pendientes de ejecución y de revisión D14)

- `npm run typecheck`, `npm run lint`, `npm test`, y `npm run test:db` si se incorpora prueba DB — resultado visto en corrida real, no reportado por terceros.
- Evidencia en navegador de UI para 0%, 100%, vacío y recarga, sin insignia ni texto prohibido.
- Captura HTTP auditable (o prueba automatizada) de `GET /api/academy` para 0%, 100%, 401 y 403, con cuerpo redactado sin cookies/tokens/PII.
- Registro explícito del resultado de la inspección de payloads persistidos (outbox/logs/caché/exports), con ruta y veredicto, aunque sea "sin hallazgos".
- Búsqueda literal post-cambio de `isCertified`, «Broker Certificado», «Acreditado oficialmente» y «Certificación pendiente de revisión» en el código y copy de Academy.

## Límites de esta revisión

- Revisión puramente documental sobre el texto del contrato; no ejecuté `typecheck`, `lint`, pruebas ni consulté el índice GitNexus.
- No declaro aprobado ningún código, gate ni prueba — ese veredicto corresponde a D14 (oráculos API/UI) y a D00 (registro y promoción), sobre la base de ejecución real.
- No emito juicio sobre CORE-1..5 ni sobre el modelo de decisión Admin de D11; ambos permanecen `DRAFT` y fuera de este veredicto.
- Este dictamen cubre solo la solidez del contrato CORE-0 como instrucción de trabajo actualizada; la verificación de que la implementación de D03 cumple estos oráculos queda pendiente de revisión independiente en ejecución.
