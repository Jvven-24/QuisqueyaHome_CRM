# Spec Pack VRE-OS · Índice

Flujo: `../FLUJO-PASADAS.md`. Estados: DRAFT → REVIEW → READY → BUILT → VERIFIED. Solo `READY` entra a construcción.

| Pasada | Entregable | Estado |
|---|---|---|
| P0 | `inventario/crm-as-is.md`, `inventario/crm-mapa-modulos.md` | pendiente (Codex Sol, en cola) |
| P0 | `inventario/cms-reutilizable.md` | pendiente (Antigravity, en cola) |
| P1 | `arquitectura/*` (ADR, reglas de integración, convenciones, fuente de verdad) | tras P0 |
| P2+P3 | `modulos/M01…M21`, `globales/G01…G11` | tras P1 (insumo UX: `../D05-ux-modulos-A.md`, `../D05-ux-modulos-B.md`) |
| P4 | `integraciones/I01…I08` | tras P1 |
| P5 | `huecos/*` | tras P2/P4 |
| P6 | plan de construcción por oleadas | tras P5 + aprobación de Wilber |

Ya construido antes de este flujo (se documenta en P0 y se ajusta a las fichas): W1 `2de69fa`, base W3 `32ca7bf`,
W2 `b376aad` (reportes reales) y `5d96155` (integraciones base). En curso con especificación previa: rediseño de
Inicio/Reportes (`tareas/T-W3-D09-inicio-reportes.md`) y Rentas (`tareas/T-W4b-D10-rentas.md`).
