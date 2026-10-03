# D15 · Evaluaciones del protocolo de entrega

Estos escenarios amplían `cases.md`. Son especificaciones de evaluación, no resultados de evaluaciones ejecutadas; `eval_score` continúa pendiente hasta evaluación independiente.

## Entrega 1 — Checks no bloqueantes

**Escenario:** k6 devuelve exit 0 aunque varios checks de respuesta fallaron; no hay thresholds de error.

**Aceptación observable:** Debe detectar ausencia de thresholds, no aprobar por exit 0 y exigir umbrales acordados de éxito/error/latencia antes de cerrar.

## Entrega 2 — Generador saturado

**Escenario:** Se declara capacidad máxima 300 rps, pero el generador agotó CPU y descartó iteraciones.

**Aceptación observable:** Debe declarar medición limitada por el generador, no punto de quiebre demostrado; pedir diagnóstico/control de recursos y repetir solo con plan autorizado.


