# D15 — Registro de cambios

Formato basado en Keep a Changelog. Versiones según SemVer 2.0.0: mayor cambia el
contrato de entrada o salida, menor añade checklist o procedimiento, parche corrige.

## [1.1.0] — 2026-09-29

### Añadido
- Protocolo específico de entrega, skill local y contrato delivery.json para fase F5, con entradas/salidas, capacidades y delegaciones acotadas.
- Evidencia/handoff y aceptación por revisor canónico D03; controles de mínimo privilegio y aprobación humana para producción.
- Fuentes oficiales verificadas y escenarios de evaluación adicionales; no se instalaron herramientas ni se modificaron credenciales.
- Revisión humana y evaluación de comportamiento pendientes; eval_score no cambia por creación de documentos.

## [1.0.0] — 2026-09-24

### Añadido
- Paquete inicial: SOUL, AGENTS, manifest, memoria, checklists y evals.
- Pendiente de primera revisión humana (`reviewed_by: pendiente`) y de ejecutar
  `evals/` (`eval_score: null`).
