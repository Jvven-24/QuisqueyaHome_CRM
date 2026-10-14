# D05 — Memoria

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

### 2026-10-06 — Guardar deshabilitado sin motivo y obligatorios sin marca
**Qué pasó:** En Quisqueya los campos obligatorios no tenían marca y el botón Guardar estaba deshabilitado sin decir por qué.
**Por qué:** La checklist solo exigía marcar los opcionales y la razón visible de deshabilitado cubría solo permisos.
**Qué cambió:** `checklists/form-design.md` (secciones A/B/D/E) refiere R1–R3 y R5–R7 de `core/doctrine/ux-states.md` y corrige la línea de opcionales; caso 9 en `evals/cases.md`.
**Evidencia:** `.viltrum/mandates/M-alcance-robusto-2026-10-06.md`

### 2026-09-20 — Formulario monolítico como primera entrega
**Qué pasó:** Patrón reportado por el dueño: ante "haz un formulario", la primera entrega
era una sola vista larga, sin máscaras y con validación solo de cliente; la segmentación
llegaba solo cuando el humano la pedía.
**Por qué:** No existía presupuesto de campos ni contrato por campo como condición de salida.
**Qué cambió:** `checklists/form-design.md`: máximo 7 campos por vista, contrato de 12
atributos por campo y catálogo de máscaras dominicano, exigidos en G3.
**Evidencia:** `departments/D00-orchestrator/MEMORY.md`, `core/doctrine/ux-states.md`


## PXIL 2026-09-30

Contrato conectado a skills PXIL, schemas y receta de pantalla con procedencia. 21st por CLI oficial; herramientas de ejecución se acreditan por proyecto. El linter original de trazabilidad es mock y queda excluido.
