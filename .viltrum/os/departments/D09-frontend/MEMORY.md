# D09 — Memoria

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


### 2026-10-06 — Guardar deshabilitado sin motivo (Quisqueya)
**Qué pasó:** botón Guardar deshabilitado sin decir qué faltaba; obligatorios sin marca.
**Por qué:** "¿puedo enviar?" devolvía un booleano; la UI no tenía motivos que mostrar.
**Qué cambió:** AGENTS.md (capa de dominio devuelve `reasons[]`, mapeo de `errors[]`, doble envío), sops/delivery.md paso 5, evals Caso 5.
**Evidencia:** `.viltrum/mandates/M-alcance-robusto-2026-10-06.md`; `core/doctrine/ux-states.md` § "Contrato de retroalimentación de acciones y formularios"

## PXIL 2026-09-30

Contrato conectado a skills PXIL, schemas y receta de pantalla con procedencia. 21st por CLI oficial; herramientas de ejecución se acreditan por proyecto. El linter original de trazabilidad es mock y queda excluido.
