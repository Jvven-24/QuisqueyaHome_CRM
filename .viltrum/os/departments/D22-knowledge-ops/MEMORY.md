# D22 — Memoria

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

### 2026-09-29 — Contexto y evidencia de un runtime real

**Qué pasó:** la demostración técnica `tmp/runtime-demo` completó entregas D21 y
revisiones D03 mediante host y procesos Codex distintos; LangGraph conserva checkpoints
SQLite, IDs y hashes. Agent Server OpenHands1.50.0 local expone un mount en solo lectura.
**Por qué:** planes y fuentes Markdown necesitaban continuidad operativa y revisión.
**Qué cambió:** `sourceEvidenceCount` distingue referencias del modelo y el híbrido
`supervisorSourceCount` distingue entradas verificadas del supervisor. No registrar
lectura por herramientas ni búsqueda web por mera existencia de un archivo. Los
23 perfiles conservan `eval_score=null`; esta demostración no es un cliente real ni
acredita pericia de D22. Los servicios y fuentes versionadas permanecen separados.
**Evidencia:** `docs/architecture/verificacion-runtime-2026-09-29.md`,
`docs/architecture/HANDOFF-RUNTIME-CLAUDE-CODE.md`, RUN-1ebce7071d324f0dae92f1a0f3b27252.

## 2026-09-29 — SDK 0.4: OpenClaw y webhook local

23 agentes en .clawd/viltrum; webhook autenticado8771, cola SQLite idempotente y
CLI OpenClaw local con OAuth existente/GPT-5.6-sol. RUN-df40231836ed4293af8b468549f00ca0
entregó análisis D21 y revisión D03 en sesiones independientes. D03 rechazó
una afirmación SwarmClaw sin fuente y pidió aclarar integridad; estado blocked,
no gates/C1/eval100%. Supervisor verifica SHA256; el modelo revisa contenido.
Gateway18789 detenido por fallo stdio/MCP; local requiere estado nativo exclusivo.
Evidencia y operación: docs/architecture/HANDOFF-OPENCLAW-WEBHOOK-CLAUDE-CODE.md
y evidencia-openclaw-webhook-2026-09-29.json. No atribuir entrenamiento por registro.


## PXIL 2026-09-30

Contrato conectado a skills PXIL, schemas y receta de pantalla con procedencia. 21st por CLI oficial; herramientas de ejecución se acreditan por proyecto. El linter original de trazabilidad es mock y queda excluido.


## Consola SDK 0.5 / 2026-09-30

Panel y webhook administrados con `viltrum up`. Ruta activa Codex; RUN-6b70cf74a1964e42af935a6cf1c202de aprobado por actor D03 separado. OpenClaw/OpenHands tienen bloqueos documentados, no conexión acreditada. PXIL aporta 8 skills y contratos a 9 perfiles; 21st se consultó por CLI oficial. Ver HANDOFF-CONSOLE-CLAUDE-CODE.md y HANDOFF-PXIL-21ST.md en docs/architecture.
