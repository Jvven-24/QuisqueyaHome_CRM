# D01 — Memoria

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

### 2026-09-30 — Ingesta semántica de minutas y detección de faltantes en 4 dimensiones
**Qué pasó:** Las reuniones con clientes aportan requerimientos fragmentados. Construir o diseñar con datos omitidos sobre VPS, accesos, dispositivos móviles (>70%) o moneda provocaba reescrituras estructurales tardías.
**Por qué:** Se evaluaba la reunión de forma intuitiva sin una matriz matemática que contrastara [AFIRMADO], [INFERIDO] y [FALTANTE].
**Qué cambió:** Implementado el motor `viltrum_sdk.intake` (`viltrum meeting-intake`) con ponderación en 4 dimensiones (VPS, Público, Negocio, Legal) y generación automática de `cuestionario-despeje-cliente.md` con bloqueo estricto en semáforo rojo (<70%).
**Evidencia:** `viltrum_sdk/intake.py`, `departments/D01-discovery/checklists/client-meeting-intake.md`
