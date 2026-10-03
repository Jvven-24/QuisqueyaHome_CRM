# D09 — Registro de cambios

Formato basado en Keep a Changelog. Versiones según SemVer 2.0.0: mayor cambia el
contrato de entrada o salida, menor añade checklist o procedimiento, parche corrige.

## [Sin publicar] — 2026-10-01

### Medido
- Primera evaluación con evaluador independiente (`viltrum eval-*`, EVAL-c6655d799a0c): `eval_score: 92`,
  5 de 6 casos aprobados y C06 parcial (faltó expiración de sesión y el estado de resultado desconocido
  persistente). Piloto de una pasada: productor Sonnet, evaluador D14 (Sonnet), citas verificadas como literales.
  Resultado con hashes en `evals/results/`. No acredita pericia general; `reviewed_by` sigue pendiente.

## [1.2.0] — 2026-09-29

### Añadido
- Integración con Magic MCP de 21st.dev y skills `shadcn-ui`, `vercel-react-best-practices`, `web-design-guidelines` y `accessibility`.

## [1.1.0] — 2026-09-29

### Añadido
- SOP de entrega especializado, contrato delivery.json y skill local viltrum-frontend.
- Entradas/gates, casos límite, controles por tenant, recuperación, herramientas opcionales y handoff con evidencia.
- Casos de evaluación adicionales para comprobar decisiones y fallos; evaluación de producto y revisión independiente continúan pendientes.

## [1.0.0] — 2026-09-24

### Añadido
- Paquete inicial: SOUL, AGENTS, manifest, memoria, checklists y evals.
- Pendiente de primera revisión humana (`reviewed_by: pendiente`) y de ejecutar
  `evals/` (`eval_score: null`).


## PXIL 2026-09-30

Contrato conectado a skills PXIL, schemas y receta de pantalla con procedencia. 21st por CLI oficial; herramientas de ejecución se acreditan por proyecto. El linter original de trazabilidad es mock y queda excluido.
