# D18 — Memoria

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

## 2026-09-29 — Runtime y lecciones comprobadas

LangGraph interrumpe/reanuda nodos; efectos requieren intención e idempotencia fuera del
checkpoint. Read-only del CLI no autoriza MCP/apps mutantes. Deshabilitar code_mode_host
rompe incluso lectura nativa; conservarlo junto al sandbox y bloquear conectores aparte.
Salida de modelo sin sourceEvidenceCount no demuestra investigación; el revisor decide
suficiencia. Timeout/cancel preservan evidencia y no repiten automáticamente el despacho.
Ver docs/architecture/verificacion-runtime-2026-09-29.md. No fine tuning/eval_score acreditado.

Codex real RUN-1ebce7071d324f0dae92f1a0f3b27252 completó D21→D03, referencias2,
procesos distintos, hashes vigentes, lectura/análisis acotados. SandboxCLI solicitado
read-only conserva sandboxVerifiedfalse (no prueba independiente universal). Workspace
OpenHands Docker se verifica por separado. Híbrido explícito aporta fuentes SHA256;
supervisorSourceCount no demuestra llamadas de lectura del modelo. Rehash posterior
impide registrar fuentes que cambiaron durante análisis; sin fallback de proveedor.
