# D14 — Memoria

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

### 2026-09-30 — Falsos Positivos de Test por Verificación Teatral y Falta de Identidad
**Qué pasó:** Un arnés de pruebas reportó 200 OK validando accidentalmente otra aplicación que ocupaba el mismo puerto (5173), y un script TypeScript con Project References pasó con código 0 sin compilar código real.
**Por qué:** Comprobaciones que solo afirman el código de salida HTTP o de proceso sin verificar asertos de identidad de la aplicación ni validar caminos negativos.
**Qué cambió:** Regla obligatoria: Toda suite de pruebas debe afirmar primero la identidad de la aplicación en el DOM (`data-app`) y en `/api/health`. Al menos el 50% de las aserciones deben validar caminos negativos (rechazo, 401/403, 409, degradación).
**Evidencia:** `Docs/audits/luna-reliability-audit.md`.


## PXIL 2026-09-30

Contrato conectado a skills PXIL, schemas y receta de pantalla con procedencia. 21st por CLI oficial; herramientas de ejecución se acreditan por proyecto. El linter original de trazabilidad es mock y queda excluido.
