# Checklist — disposición del descubrimiento (Gate G0)

> Se aplica antes de declarar el Gate G0 — Baseline. Firma el revisor (D02), nunca quien
> levantó el descubrimiento.

## A. Problema

- [ ] El problema está enunciado sin mencionar la solución
- [ ] Se identifica quién lo sufre (rol o segmento concreto, no "los usuarios")
- [ ] Se identifica la frecuencia o el momento en que ocurre
- [ ] El objetivo medible está escrito con número o umbral, no con adjetivo

## B. Evidencia

- [ ] Existe al menos una evidencia de que el problema es real (dato, queja registrada,
      métrica, precedente, entrevista)
- [ ] La evidencia distingue hecho de inferencia
- [ ] Si no hay evidencia dura, está declarado como riesgo abierto, no disfrazado de hecho

## C. Restricciones

- [ ] Presupuesto identificado, aunque sea un rango
- [ ] Plazo identificado, aunque sea aproximado
- [ ] Restricciones de marca o legales identificadas si aplican
- [ ] Restricciones técnicas heredadas (sistema existente, integración obligatoria) listadas

## D. Preguntas

- [ ] Todas las preguntas generadas están en `.viltrum/questions.md` con formato exacto
      Q-nnn, `a:`, `bloquea:`, `dep:`, `prioridad:`
- [ ] Ninguna pregunta que bloquea G0 sigue en `## Abiertas`
- [ ] Las preguntas respondidas tienen su `- R:` con fecha y quién respondió
- [ ] `.viltrum/client-inputs.md` tiene todo insumo pendiente del cliente, con formato
      CI-nnn

## E. Riesgo y tipo de solución

- [ ] Tipo de solución clasificado (`core/routing.md` 1.2)
- [ ] Riesgo R0–R4 clasificado con su razón en una línea
- [ ] Módulos probablemente activados identificados (Auth, pagos, catálogo…)
- [ ] Línea base de `reference/expected-capabilities.md` revisada para ese tipo de solución

## F. Cobertura del banco de preguntas

- [ ] Se aplicaron las secciones de `reference/question-bank.md` correspondientes al tipo
      de solución clasificado
- [ ] Se aplicaron las secciones correspondientes a cada módulo identificado
- [ ] Ninguna pregunta bloqueante genérica del banco quedó sin adaptar al proyecto

---

## Veredicto

```
APROBADO      — toda la checklist marcada, sin preguntas bloqueantes de G0 abiertas
CONDICIONAL   — excepciones listadas, con dueño y fecha. Nunca con una pregunta bloqueante sin responder
RECHAZADO     — vuelve a D01 con hallazgos clasificados
```

Firma el revisor (D02), **nunca** quien levantó el descubrimiento.
