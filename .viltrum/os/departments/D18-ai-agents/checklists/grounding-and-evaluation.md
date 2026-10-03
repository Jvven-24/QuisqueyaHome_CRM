# Checklist — grounding, citas y evaluación

> La firma D12, nunca quien construyó el sistema.
> Se aplica a todo sistema que responde con base en una fuente propia (RAG, base de
> conocimiento, documentos del cliente) o que toma una decisión automática.

## A. Grounding y citas

- [ ] El sistema responde solo con base en fuentes verificables cuando el caso de uso
      lo exige — no de memoria general del modelo
- [ ] Cada afirmación que depende de una fuente específica del negocio cita esa fuente
      (documento, registro, fecha)
- [ ] La cita apunta a algo verificable por un humano (enlace, número de documento,
      sección) — no una referencia genérica sin forma de comprobarla
- [ ] Existe un umbral de confianza o de similitud de recuperación por debajo del cual
      el sistema no contesta desde la fuente, aunque haya recuperado algo
- [ ] El umbral está probado con casos reales, no fijado por intuición

## B. Criterio de negarse a responder

- [ ] Si la pregunta cae fuera de la base de conocimiento del sistema, la respuesta
      correcta es decirlo — nunca generalizar con el conocimiento general del modelo
      cuando el caso de uso exige grounding
- [ ] El mensaje de "no sé" ofrece una alternativa (escalar, reformular, dónde buscar)
      en vez de un callejón sin salida
- [ ] Existe al menos un caso de prueba con una pregunta plausible pero fuera de base,
      y el sistema se niega en vez de inventar una respuesta convincente
- [ ] El sistema no rellena huecos de la fuente con suposiciones presentadas como
      hecho

## C. Dataset de evaluación repetible

- [ ] Cada caso tiene: entrada exacta, salida esperada o comportamiento esperado,
      criterio de aprobado verificable, y categoría de riesgo si aplica
- [ ] El dataset incluye casos normales, casos límite y casos adversariales (inyección
      directa e indirecta, intento de fuga del system prompt, pregunta fuera de base)
- [ ] El dataset vive versionado junto al sistema y se amplía con cada caso real que
      falló en producción
- [ ] Cada cambio de prompt, de modelo o de herramienta corre el dataset completo antes
      de desplegar
- [ ] Un caso que ya estaba aprobado y baja de score se trata como regresión, no como
      ruido aceptable
- [ ] El resultado de cada corrida queda registrado con fecha y versión del sistema
      evaluado

**"Lo probé a mano y respondía bien" no es evidencia válida.** Exige `core/evidence-
contract.md`: una prueba que corre, repetible, con resultado fechado.

## D. Fallback humano

- [ ] Gatillo explícito: confianza de grounding bajo el umbral
- [ ] Gatillo explícito: el usuario pide hablar con una persona
- [ ] Gatillo explícito: decisión con impacto real no autorizada a automatizar (dinero,
      salud, legal, cancelación de cuenta)
- [ ] Gatillo explícito: posible inyección o intento de manipulación detectado
- [ ] Gatillo explícito: falla repetida o frustración medible del usuario
- [ ] Gatillo explícito: límite de costo o de iteraciones alcanzado
- [ ] El traspaso a humano incluye el contexto necesario para no repetir la
      conversación desde cero
- [ ] El usuario sabe que está hablando con un sistema automatizado y cómo pedir un
      humano en cualquier momento

## E. Elección de modelo por tarea

- [ ] Tarea mecánica de clasificación o extracción usa modelo pequeño
- [ ] Ambigüedad, razonamiento complejo o riesgo alto usa modelo grande
- [ ] Toda elección de modelo grande está justificada por escrito, no por defecto

---

## Veredicto

```
APROBADO      — checklist completa, con evidencia enlazada por sección
CONDICIONAL   — excepciones con dueño y fecha. Nunca con un P0
RECHAZADO     — vuelve a D18 con hallazgos clasificados
```

Firma el revisor (D12), **nunca** quien construyó el sistema.
