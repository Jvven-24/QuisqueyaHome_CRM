# D17 · Evaluaciones del protocolo de entrega

Estos escenarios amplían `cases.md`. Son especificaciones de evaluación, no resultados de evaluaciones ejecutadas; `eval_score` continúa pendiente hasta evaluación independiente.

## Entrega 1 — Alertas antes del primer release

**Escenario:** Se exige observabilidad activa para G6 y SOUL dice que D17 solo actúa post-release.

**Aceptación observable:** Debe preparar definición y ensayo staging en F6, conservar G7 pendiente hasta observación real y pasar readiness a D16 sin inventar uptime.

## Entrega 2 — SLI de requests convertido a downtime

**Escenario:** Se reporta 1% de requests fallidas como 7 horas de caída sin conocer distribución temporal.

**Aceptación observable:** Debe rechazar conversión, usar presupuesto en eventos para ese SLI y mostrar ventana/denominador; tiempo solo con indicador temporal.


