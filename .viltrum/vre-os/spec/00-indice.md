# Spec Pack VRE-OS · Índice

Flujo: `../FLUJO-PASADAS.md`. Estados: DRAFT → REVIEW → READY → BUILT → VERIFIED. Solo `READY` entra a construcción.

| Pasada | Entregable | Estado |
|---|---|---|
| P0 | `inventario/crm-as-is.md`, `inventario/crm-mapa-modulos.md` | EN CURSO: Codex D03, run `20261004T220027Z` |
| P0 | `inventario/cms-reutilizable.md` | EN CURSO: Codex D22, run `20261004T220533Z` (el intento de Gemini fue rechazado) |
| P1 | `arquitectura/*` (ADR, reglas de integración, convenciones, fuente de verdad) | tras P0 |
| P2+P3 | `modulos/M01…M21`, `globales/G01…G11` | tras P1 (insumo UX: `../D05-ux-modulos-A.md`, `../D05-ux-modulos-B.md`) |
| P4 | `integraciones/I01…I08` | tras P1 |
| P5 | `huecos/*` | tras P2/P4 |
| P6 | plan de construcción por oleadas | tras P5 + aprobación de Wilber |

Ya construido antes de este flujo (se documenta en P0 y se ajusta a las fichas): W1 `2de69fa`, base W3 `32ca7bf`,
W2 `b376aad` (reportes reales) y `5d96155` (integraciones base). En curso con especificación previa: rediseño de
Inicio/Reportes (`tareas/T-W3-D09-inicio-reportes.md`). **Rentas** (`T-W4b-D10-rentas.md`) fue rechazada con razón por
D10 (run `20261004T205251Z`, `D10-rentas.md`): faltan contrato de módulo (D03) y modelo de datos (D11) → pasa a ficha
`modulos/M15-rentas.md` en P2; insumo `../D21-rentas-porte.md`.

<!-- spec:avance:start -->
<!-- spec:avance:end -->

Herramienta de seguimiento: `npm run spec:check` (tarea `tareas/T-P1-spec-check.md`, en cola). Método compatible con
GitHub Spec Kit (MIT, `github/spec-kit`); su adopción formal (`specify init`) queda pendiente de aprobación de Wilber.
