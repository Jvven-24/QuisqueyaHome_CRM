# D06 — Registro de cambios

## Integración aprobada — 2026-10-07 (revisión D00 HND-012)
- Guía fuente canónica aprobada; D06 aplica su referencia cuando el scroll introduzca navegación o comportamiento con estado. El scroll pasivo no define estados de negocio.

Formato basado en Keep a Changelog. Versiones según SemVer 2.0.0: mayor cambia el
contrato de entrada o salida, menor añade checklist o procedimiento, parche corrige.

## [1.2.0] — 2026-09-29

### Añadido
- Skills de microinteracción, auditoría web, UI/UX avanzada y accesibilidad para diseñar y verificar los seis estados.

## [1.1.0] — 2026-09-29

### Añadido
- Protocolo experto `sops/delivery.md` y contrato máquina-legible `delivery.json` para F3, con límites de evidencia, herramientas y delegación.
- Skill local `viltrum-ux-states` referenciada desde manifest sin eliminar skills actuales.
- Fuentes oficiales consultadas y dependencias declaradas, sin instalaciones ni credenciales.
- Separación de especificación, ejecución y revisión independiente; primera evaluación sigue pendiente.
- Conservación de borradores limitada por seguridad D12; timeout de escritura sin promesa de idempotencia; reproducción situada tras implementación.

## [1.0.0] — 2026-09-24

### Añadido
- Paquete inicial: SOUL, AGENTS, manifest, memoria, checklists y evals.
- Pendiente de primera revisión humana (`reviewed_by: pendiente`) y de ejecutar
  `evals/` (`eval_score: null`).


## PXIL 2026-09-30

Contrato conectado a skills PXIL, schemas y receta de pantalla con procedencia. 21st por CLI oficial; herramientas de ejecución se acreditan por proyecto. El linter original de trazabilidad es mock y queda excluido.
