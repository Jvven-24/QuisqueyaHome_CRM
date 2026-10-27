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

## Fichas técnicas fuera del catálogo de módulos

| ID | Ruta canónica | Estado | Revisión independiente | Alcance |
|---|---|---|---|---|
| TOOL-001 | `../../../specs/001-spec-check-catalogo-no-ficha/spec.md` | **READY / L2** | D12 `reviews/D12-preparacion-integraciones-locales-2026-10-04.md` §«Revisión posterior»; D14 `reviews/D14-revision-TOOL-001-READY-2026-10-04.md` | Corregir el falso verde de `spec:check`; aún no BUILT. |
| I00 | `integraciones/I00-outbox-base.md` | **DRAFT / L1** | D11/D12/D14 pendientes sobre contrato actualizado | Ficha canónica de base outbox, enumerada por `spec:check`; no habilita código. |
| I01-A | `integraciones/lotes/I01-A-outbox.md` | **DRAFT / L1** | D14 `reviews/D14-revision-READY-I01-A-TOOL-001-2026-10-04.md`: FAIL histórico para READY; D11/D12/D14 deben revisar versión actual. | Anexo de I00, **no enumerado por `spec:check`**. Su eventual despacho cita `Ficha: I00` tras READY; I01 Twenty sigue DRAFT. |
| M13-CORE | `../../../specs/002-m13-certificacion-local/spec.md` | **DRAFT / L1** | D11/D12/D14/D07 pendientes | Subficha local y sintética de C1 M10/Spec M13 para corregir autocertificación y aprobar por Admin sin Moodle; fuera del conteo de `spec:check`. |
| M13-CORE-0 | `../../../specs/002-m13-certificacion-local/CORE-0.md` | **VERIFIED / L2** | Aprobación humana HND-040/041; código revisado por D14 HND-042 y D12 HND-043; evidencia `reviews/CORE-0-verificacion-integrada-2026-10-04.md` | Corrección local integrada: progreso educativo sin certificación inferida. No crea aprobación Admin, constancia ni Moodle. Fuera del conteo de `spec:check`. |

Este bloque es manual y está fuera de los marcadores que actualiza `spec:check --md`; el verde del script no acredita TOOL-001 implementada, I01-A lista ni M13-CORE revisada. Los IDs C1 M01–M15 tampoco equivalen por número a las fichas M01–M21 del Spec Pack.

## Equivalencia C1 Academy

| Contrato | Ficha del Spec Pack | Estado | Regla |
|---|---|---|---|
| C1 M10 · Academy | `modulos/M13-academy.md` | **DRAFT / L1** | Certificación por curso y versión solo tras aprobación explícita de Admin; progreso y quiz son evidencia educativa. |

`C1 M13` corresponde a Auditoría y Trazabilidad; no se debe usar ese identificador para Academy.

Ya construido antes de este flujo (se documenta en P0 y se ajusta a las fichas): W1 `2de69fa`, base W3 `32ca7bf`,
W2 `b376aad` (reportes reales) y `5d96155` (integraciones base). En curso con especificación previa: rediseño de
Inicio/Reportes (`tareas/T-W3-D09-inicio-reportes.md`). **Rentas** (`T-W4b-D10-rentas.md`) fue rechazada con razón por
D10 (run `20261004T205251Z`, `D10-rentas.md`): faltan contrato de módulo (D03) y modelo de datos (D11) → pasa a ficha
`modulos/M15-rentas.md` en P2; insumo `../D21-rentas-porte.md`.

<!-- spec:avance:start -->
<!-- spec:avance:end -->

Herramienta de seguimiento: `npm run spec:check` (tarea `tareas/T-P1-spec-check.md`, en cola). Método compatible con
GitHub Spec Kit (MIT, `github/spec-kit`); su adopción formal (`specify init`) queda pendiente de aprobación de Wilber.

Fase 3 RBAC: `../../../specs/fase3-rbac/spec.md` · BUILT/L3 · autorización directa 2026-10-27; revisión independiente pendiente.
