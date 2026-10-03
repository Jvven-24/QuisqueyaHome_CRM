# D19 — Memoria

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

## 2026-09-29 — Puerto de ejecución y conexión real

SDK0.3 separa runtime LangGraph y proveedores bajo viltrum_sdk/adapters. Host entrega/revisa
con sesiones reales; Codex read-only usa resultado estructurado y metadatos redactados.
OpenHands Agent Server requiere endpoint, auth, workspace aislado y LLM; Docker instalado
no prueba engine operativo. Usuario autorizó montaje local Docker/WSL; conservar su estado
comprobado en integrations/openhands y docs/research/openhands-local-2026-09-29.md.
SwarmClaw conserva bundle26skills/23agentes disabled, sin instancia importada. OpenClaw opcional.

Actualización operada: Agent Server1.50.0 local8011 respondió ready, auth401 sin clave,
GET autorizado y mountDocker read-only acreditado. `openhands-codex` obtiene contexto
supervisado por GET/hash y Codex razona con autenticación CLI existente; no requiere
LLM propio OpenHands ni extrae OAuth. El backend `openhands` directo sigue pendiente
de modelo/clave. La configuración exige proyecto exactamente igual al mount; helper
portable acepta workspace explícito preparado y excluye secretos/reparsepoints conocidos.
Revisión independiente: GET22815bytes reales, traversal/secret/mismatch rechazados.

## 2026-09-29 — SDK 0.4: OpenClaw y webhook local

23 agentes en .clawd/viltrum; webhook autenticado8771, cola SQLite idempotente y
CLI OpenClaw local con OAuth existente/GPT-5.6-sol. RUN-df40231836ed4293af8b468549f00ca0
entregó análisis D21 y revisión D03 en sesiones independientes. D03 rechazó
una afirmación SwarmClaw sin fuente y pidió aclarar integridad; estado blocked,
no gates/C1/eval100%. Supervisor verifica SHA256; el modelo revisa contenido.
Gateway18789 detenido por fallo stdio/MCP; local requiere estado nativo exclusivo.
Evidencia y operación: docs/architecture/HANDOFF-OPENCLAW-WEBHOOK-CLAUDE-CODE.md
y evidencia-openclaw-webhook-2026-09-29.json. No atribuir entrenamiento por registro.


## Consola SDK 0.5 / 2026-09-30

Panel y webhook administrados con `viltrum up`. Ruta activa Codex; RUN-6b70cf74a1964e42af935a6cf1c202de aprobado por actor D03 separado. OpenClaw/OpenHands tienen bloqueos documentados, no conexión acreditada. PXIL aporta 8 skills y contratos a 9 perfiles; 21st se consultó por CLI oficial. Ver HANDOFF-CONSOLE-CLAUDE-CODE.md y HANDOFF-PXIL-21ST.md en docs/architecture.
