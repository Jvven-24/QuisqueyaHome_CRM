# D02 — Memoria

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

### 2026-10-06 — "Integra X" entregado a medias: faltaba la matriz por departamento
**Qué pasó:** `skills/alcance-completo` existía pero nadie la invocaba y expandía por ocho caras, no por departamento; peticiones como "integra X" salían sin contenido, migración de datos ni funciones.
**Por qué:** no había un entregable que obligara a decir qué le toca a cada D01..D22, ni cierre por rebanada.
**Qué cambió:** `module-impact-matrix.md` (etapa, efectos externos en lista mínima, no tope, tabla D01..D22 con razón en N/A, cierre por rebanada), enlazada desde la skill; caso 5 de evals. Cableado ya hecho en `core/routing.md`, `core/orchestration.md` y `skills/orquestar/SKILL.md`. Tras revisión D01: filas legal/fiscal y secretos, `N/A` único con evidencia, profundidad por riesgo, arquetipo de pagos.
**Evidencia:** `.viltrum/mandates/M-alcance-robusto-2026-10-06.md`, `skills/alcance-completo/module-impact-matrix.md`

### 2026-09-30 — Contratos vinculantes C0-C4 y pagarés notariales criptográficos
**Qué pasó:** Los proyectos iniciaban con acuerdos verbales o informales de pagos. Los retrasos en cobranzas y disputas de alcance surgían por falta de hitos contractuales claros y pagarés de garantía.
**Por qué:** No existía un procedimiento estándar de contratos versionados (C0 a C4) ni generación de pagarés notariales vinculantes.
**Qué cambió:** Implementado `viltrum_sdk.legal` (`viltrum legal-generate`), el SOP `legal-and-commercial-contracts.md` y el esquema estandarizado de pagos en 3 hitos (30% anticipo C1, 40% sandbox Gate G5, 30% release Gate G7) con hash SHA256 inmutable.
**Evidencia:** `viltrum_sdk/legal.py`, `departments/D02-scope/sops/legal-and-commercial-contracts.md`, `E:\PROYECTOS WEB\APP DE FINANCIAMIENTO\lending-pro\pdf_generator.py`
