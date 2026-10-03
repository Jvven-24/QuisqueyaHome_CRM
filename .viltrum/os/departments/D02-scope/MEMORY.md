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

### 2026-09-30 — Contratos vinculantes C0-C4 y pagarés notariales criptográficos
**Qué pasó:** Los proyectos iniciaban con acuerdos verbales o informales de pagos. Los retrasos en cobranzas y disputas de alcance surgían por falta de hitos contractuales claros y pagarés de garantía.
**Por qué:** No existía un procedimiento estándar de contratos versionados (C0 a C4) ni generación de pagarés notariales vinculantes.
**Qué cambió:** Implementado `viltrum_sdk.legal` (`viltrum legal-generate`), el SOP `legal-and-commercial-contracts.md` y el esquema estandarizado de pagos en 3 hitos (30% anticipo C1, 40% sandbox Gate G5, 30% release Gate G7) con hash SHA256 inmutable.
**Evidencia:** `viltrum_sdk/legal.py`, `departments/D02-scope/sops/legal-and-commercial-contracts.md`, `E:\PROYECTOS WEB\APP DE FINANCIAMIENTO\lending-pro\pdf_generator.py`
