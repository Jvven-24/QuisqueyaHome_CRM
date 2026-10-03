# D00 — Registro de cambios

Formato basado en Keep a Changelog. Versiones según SemVer 2.0.0: mayor cambia el
contrato de entrada o salida, menor añade checklist o procedimiento, parche corrige.

## [1.1.0] — 2026-09-29

- Entrada global `orquestar`, contrato de entrega, SOP de activación y especialistas.
- Plan por etapa, inventario de recursos reales, trazabilidad y revisión independiente.
- Validación de gates vinculada a evidencia, aceptación humana y puertas previas.
- Casos de evaluación añadidos; `eval_score` sigue null hasta evaluación del agente.

## [1.0.0] — 2026-09-20

### Añadido
- Paquete inicial: SOUL, AGENTS, manifest, memoria, checklists y evals.
- Pendiente de primera revisión humana (`reviewed_by: pendiente`) y de ejecutar
  `evals/` (`eval_score: null`).
