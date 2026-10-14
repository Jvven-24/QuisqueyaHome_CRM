# D06 — Memoria

> Lo que se aprende y no se escribe, se vuelve a pagar.
> Entradas nuevas arriba. Cada una lleva fecha, qué pasó y qué cambió.

## Formato

```
### YYYY-MM-DD — Título corto
**Qué pasó:** hecho observado
**Por qué:** causa real, no síntoma
**Qué cambió:** skill nueva / SOP / checklist / práctica deprecada
**Evidencia:** enlace
```

---

### 2026-10-06 — Obligatorios sin marca y Guardar deshabilitado sin motivo (Quisqueya)
**Qué pasó:** En Quisqueya los campos obligatorios no tenían marca y el botón Guardar estaba deshabilitado sin explicar qué faltaba.
**Por qué:** La doctrina exigía "deshabilitado con razón visible" solo para permisos, y marcar opcionales pero no obligatorios; la validación incompleta quedó fuera de la regla.
**Qué cambió:** Contrato R1–R8 en `core/doctrine/ux-states.md` (fuente única, con hallazgos R8 en P2); tabla de estados del botón y checklist de permisos alineadas en `AGENTS.md`; casos 5 y 6 en `evals/cases.md`. D05/D09/D10/D14 lo refieren, no lo copian.
**Evidencia:** `.viltrum/mandates/M-alcance-robusto-2026-10-06.md`.

### 2026-09-30 — Pérdida de foco y salto de estado en listas de formulario reordenables
**Qué pasó:** Al subir o reordenar secciones de contenido en el CMS (`ContentSections.jsx`), los campos de texto (`input`, `textarea`) perdían el foco o retenían valores del elemento vecino.
**Por qué:** Se utilizaba el índice del array (`key={i}`) para reconciliar elementos JSX dinámicos que cambian de orden. React asume que el elemento con clave 0 sigue siendo el mismo y preserva su estado de DOM interno sin intercambiarlo.
**Qué cambió:** Regla obligatoria: en colecciones editables o reordenables usar siempre claves persistentes e inmutables asignadas por instancia (generador de IDs con `useRef` o identidades únicas).
**Evidencia:** `src/studio/ContentSections.jsx`.


## PXIL 2026-09-30

Contrato conectado a skills PXIL, schemas y receta de pantalla con procedencia. 21st por CLI oficial; herramientas de ejecución se acreditan por proyecto. El linter original de trazabilidad es mock y queda excluido.
