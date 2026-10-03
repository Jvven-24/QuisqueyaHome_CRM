# D12 — Memoria

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

### 2026-09-30 — Discrepancia entre GRANT SELECT de Tabla y Políticas RLS en PostgreSQL
**Qué pasó:** Consultas anónimas a la Data API de PostgREST leían columnas confidenciales (`validation_notes`) en proyectos publicados.
**Por qué:** Se asumió que RLS protegía columnas; sin embargo, en PostgreSQL RLS filtra filas pero el privilegio `GRANT SELECT` de tabla expone todas las columnas de las filas autorizadas.
**Qué cambió:** Regla mandatoria: revocar `GRANT SELECT` a nivel de tabla a roles públicos (`anon`/`authenticated`) y exponer proyecciones públicas mediante vistas dedicadas con `security_invoker = true` o revocando el grant sobre columnas confidenciales.
**Evidencia:** `Docs/audits/security-review-2026-09-30.md`.
