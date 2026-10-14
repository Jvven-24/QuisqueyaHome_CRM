# D11 — Registro de cambios

Formato basado en Keep a Changelog. Versiones según SemVer 2.0.0: mayor cambia el
contrato de entrada o salida, menor añade checklist o procedimiento, parche corrige.

## [1.2.0] — 2026-10-06

### Añadido
- Paquete de plataforma `platform-packs/supabase.md` (stack insignia): cambio obligatorio de Data API del 2026-10-30, esquema `realtime` bloqueado, analítica/replicación (Pipelines, ETL, Analytics Buckets) y lista de salida.
- Pendiente de revisión independiente D12; `eval_score` sigue sin medirse.

## [1.1.0] — 2026-09-29

### Añadido
- SOP de entrega especializado, contrato delivery.json y skill local viltrum-data.
- Entradas/gates, casos límite, controles por tenant, recuperación, herramientas opcionales y handoff con evidencia.
- Casos de evaluación adicionales para comprobar decisiones y fallos; evaluación de producto y revisión independiente continúan pendientes.

## [1.0.0] — 2026-09-20

### Añadido
- Paquete inicial: SOUL, AGENTS, manifest, memoria, checklists y evals.
- Pendiente de primera revisión humana (`reviewed_by: pendiente`) y de ejecutar
  `evals/` (`eval_score: null`).
