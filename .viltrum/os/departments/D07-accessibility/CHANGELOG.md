# D07 — Registro de cambios

Formato basado en Keep a Changelog. Versiones según SemVer 2.0.0: mayor cambia el
contrato de entrada o salida, menor añade checklist o procedimiento, parche corrige.

## [1.2.0] — 2026-09-29

### Añadido
- Skill dedicada `accessibility` y `web-design-guidelines`; se mantiene la exigencia de axe/Lighthouse y revisión manual real.

## [1.1.0] — 2026-09-29

### Añadido
- Protocolo experto `sops/delivery.md` y contrato máquina-legible `delivery.json` para F3, con límites de evidencia, herramientas y delegación.
- Skill local `viltrum-accessibility` referenciada desde manifest sin eliminar skills actuales.
- Fuentes oficiales consultadas y dependencias declaradas, sin instalaciones ni credenciales.
- Separación de especificación, ejecución y revisión independiente; primera evaluación sigue pendiente.
- Correcciones normativas: foco 2.4.11 AA versus 2.4.12 AAA, arrastre 2.5.7, instrucciones 3.3.2 y movimiento AAA; retirado porcentaje automático no sustentado.
- D07 revisa D05 y consulta D06; D14 mantiene revisión de cierre. Checklist operativa declara cobertura normativa parcial.

## [1.0.0] — 2026-09-24

### Añadido
- Paquete inicial: SOUL, AGENTS, manifest, memoria, checklists y evals.
- Pendiente de primera revisión humana (`reviewed_by: pendiente`) y de ejecutar
  `evals/` (`eval_score: null`).


## PXIL 2026-09-30

Contrato conectado a skills PXIL, schemas y receta de pantalla con procedencia. 21st por CLI oficial; herramientas de ejecución se acreditan por proyecto. El linter original de trazabilidad es mock y queda excluido.
