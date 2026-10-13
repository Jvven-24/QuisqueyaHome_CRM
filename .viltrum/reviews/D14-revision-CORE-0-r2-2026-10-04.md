# D14 · Revisión independiente (R4) · Texto actualizado CORE-0 · 2026-10-04

**Entrada:** versión actualizada del subcontrato `M13-CORE-0` (DRAFT, owner D03, revisores D12/D14), tras mi dictamen previo APROBADO-con-observación de R3. Revisión documental únicamente; no se ejecutó código, pruebas ni capturas.

## Dictamen

**APROBADO** para despacho como documento final.

## Verificación puntual: ¿se cerró la observación de R3?

Mi observación anterior era sobre la frase "Certificación pendiente de revisión" como copy de UI aceptable bajo la etiqueta de "información de proceso", por sugerir un flujo de revisión en curso que CORE-0 no crea.

El texto actual la retira explícitamente:

> "Antes de existir una solicitud, se prohíbe también «Certificación pendiente de revisión»: implicaría una revisión iniciada que el sistema no registra."

Esto cierra la observación por completo, y de forma más estricta que una simple corrección cosmética: no solo quita la frase de la lista de ejemplos permitidos, sino que explica el motivo (una revisión que el sistema no registra) y lo liga a la condición temporal correcta ("antes de existir una solicitud"), coherente con que CORE-1..5 siguen en DRAFT. No queda redacción ambigua equivalente en el resto del texto de UI: el párrafo de Decisión de contrato ahora enumera las frases prohibidas (`«Broker Certificado»`, `«Acreditado oficialmente»`, certificado, constancia, aprobación implícita) y añade esta cuarta explícitamente, sin dejar una puerta abierta tipo "o frases similares que no prometan X" que permitiría reintroducir una variante equivalente.

## Testabilidad: ¿se preserva?

Sí, intacta respecto a R3:

- Los Oráculos 1–5 no cambiaron en su estructura ni en los estados cubiertos (0%, 100%, vacío, interacción/recarga, regresión de test invertido).
- El grep literal del Oráculo 5 sigue exigiendo buscar "Broker Certificado" y "Acreditado oficialmente"; dado que el cierre de mi observación es una prohibición nueva en el texto normativo y no una tarea nueva, correspondería a D00/D07 confirmar en la verificación visual de CORE-0A/CORE-0C que tampoco aparece "Certificación pendiente de revisión" ni variantes — el contrato ya lo exige en prosa, pero el Oráculo 5 no fue actualizado para listarla junto a las otras dos frases en el grep. Esto no es un defecto que bloquee aprobación (la prohibición normativa ya existe y es vinculante), pero señalo el hueco para que D00 lo verifique igual, sin asumir que el grep automatizado la cubre.
- CORE-0A/B/C conservan los mismos archivos permitidos, mismos límites de ≤45 min, misma salvaguarda sobre la prueba HTTP de CORE-0C (ruta automatizada vs. evidencia externa auditable).

## Alcance y límites preservados

- El alcance sigue acotado a eliminar el booleano y su copy derivada; no crea curso, decisión, constancia, migración ni integración LMS. CORE-1..5 permanecen DRAFT.
- No se amplió ni se redujo el conjunto de archivos permitidos por tarea respecto a la versión revisada en R3.
- Sigue sin existir estado "aprobado" en este lote, consistente con que no hay decisión Admin consultable.

## Hallazgos restantes

Ninguno que bloquee. Único punto a registrar por D00: confirmar en la verificación visual/grep de cierre que "Certificación pendiente de revisión" (y variantes textuales equivalentes) esté efectivamente ausente, ya que el Oráculo 5 enumera solo dos frases para grep y la tercera prohibición quedó en prosa normativa.

## Alcance de esta revisión

Revisión documental exclusiva del texto de contrato. No se ejecutaron `typecheck`, `lint`, `test`, `test:db` ni se evaluó código, UI en navegador o respuesta HTTP real. No se reevalúa aquí el estado de `spec:check` reportado como ajeno en R3.
