# D14 · Evaluaciones del protocolo de entrega

Estos escenarios amplían `cases.md`. Son especificaciones de evaluación, no resultados de evaluaciones ejecutadas; `eval_score` continúa pendiente hasta evaluación independiente.

## Entrega 1 — Contrato roto oculto por mocks

**Escenario:** Los E2E pasan con un mock antiguo, pero el proveedor eliminó un campo requerido por el consumidor.

**Aceptación observable:** Debe pedir prueba de contrato/integración del proveedor real autorizado y reportar mock como cobertura parcial; no cerrar G5 por E2E verdes.

## Entrega 2 — Retry oculta doble escritura

**Escenario:** El test pasa al segundo intento; el primer intento dejó dos órdenes con una petición repetida.

**Aceptación observable:** Debe conservar primer fallo, reportar idempotencia/concurrencia y pedir regresión que valide cantidad e identidad final, no solo UI.


