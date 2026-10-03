# OpenClaw 2026.9.4: agentes ChatGPT y receptor de eventos

Investigación del 29 de septiembre de 2026. Solo lectura de instalación y campos seleccionados de configuración; no se ejecutaron modelos, no se enviaron mensajes a canales y no se modificó OpenClaw. El único archivo escrito por esta investigación es este documento. No se consultaron archivos del repositorio personal `C:\Users\wilbe\clawd`, memoria personal ni credenciales completas.

## Versión y fuentes

La CLI instalada reporta `OpenClaw 2026.9.4 (3a9d69d)`. El paquete instalado tiene `version: 2026.9.4`, licencia MIT y autor OpenClaw Foundation. La [publicación oficial v2026.9.4](https://github.com/openclaw/openclaw/releases/tag/v2026.9.4) coincide con `3a9d69d`. Las recomendaciones se basan en documentación y código distribuidos dentro de esa instalación, no en `latest`.

Raíz local de fuente: `C:\Users\wilbe\tools\node-v24.18.0-win-x64\node_modules\openclaw`. CLI: `C:\Users\wilbe\tools\node-v24.18.0-win-x64\openclaw.ps1`. Las URL con `blob/v2026.9.4` permiten consultar la revisión correspondiente; los archivos locales fueron la evidencia efectiva cuando el visor web no pudo recuperar páginas raw.

## Estado observado, sin secretos

| Campo | Observación |
| --- | --- |
| Gateway | modo `local`, bind `loopback`, puerto `18789`, autenticación `token` |
| Configuración de agentes | `agents.defaults`, `agents.ownership`, `agents.entries`; el formato recomendado es `entries` |
| Modelo global primario | `openai/gpt-5.6-sol` |
| Modelos OpenAI registrados | `openai/gpt-5.6-sol`, `openai/gpt-5.6-luna` |
| OAuth declarado | perfiles `openai:default` y `openai:chatgpt-default`, proveedor `openai`, modo `oauth` |
| Hooks HTTP | bloque `hooks` ausente; deshabilitados por defecto |
| Herramientas globales | perfil `full`; no `fs.workspaceOnly` global explícito |
| Agentes previos | `main`, `viltrum`, `viltrum-internal`, `luna-whatsapp` |

Esto acredita presencia de configuración OAuth; no acredita vigencia del token ni éxito de una llamada. No se imprimieron tokens, cuentas, correos, IDs personales ni contenido de bases de datos de autenticación. Las rutas workspace anteriores se observaron únicamente como metadatos de configuración, sin abrirlas.

## Agentes nuevos dentro de .clawd

Para los 23 agentes `viltrum-d00` a `viltrum-d22`, mantener workspace y estado separados:

```text
C:\Users\wilbe\.clawd\viltrum\workspaces\viltrum-d00
C:\Users\wilbe\.clawd\viltrum\state\viltrum-d00\agent
```

El comando compatible, ilustrado para un agente, es:

```powershell
& 'C:\Users\wilbe\tools\node-v24.18.0-win-x64\openclaw.ps1' agents add viltrum-d00 --workspace 'C:\Users\wilbe\.clawd\viltrum\workspaces\viltrum-d00' --agent-dir 'C:\Users\wilbe\.clawd\viltrum\state\viltrum-d00\agent' --model openai/gpt-5.6-sol --non-interactive --json
```

La CLI requiere nombre y `--workspace` en modo no interactivo. No requiere bindings de canales para ejecutar `agent --agent ID`. Nunca compartir `agentDir`: contiene `openclaw-agent.sqlite` con historia y estado locales. [Agentes](https://github.com/openclaw/openclaw/blob/v2026.9.4/docs/cli/agents.md), [aislamiento y rutas](https://github.com/openclaw/openclaw/blob/v2026.9.4/docs/concepts/multi-agent.md).

Esta versión usa el proveedor canónico `openai` tanto para API key como para OAuth ChatGPT/Codex; `openai-codex/*` es legacy. Las credenciales tienen una base compartida de lectura y overrides por agente. Agentes nuevos pueden usar la autenticación compartida sin copiar refresh tokens. La copia interactiva copia estáticas portables y excluye OAuth salvo opt-in explícito. No ejecutar login, migración ni `doctor --fix` para el mero alta de esta flota. [OAuth](https://github.com/openclaw/openclaw/blob/v2026.9.4/docs/concepts/oauth.md), [auth del runtime](https://github.com/openclaw/openclaw/blob/v2026.9.4/docs/providers/openai/runtimes.md).

Fragmento propuesto que se agrega a `agents.entries`, conservando defaults y agentes existentes:

```json5
{
  "viltrum-d00": {
    workspace: "C:\\Users\\wilbe\\.clawd\\viltrum\\workspaces\\viltrum-d00",
    agentDir: "C:\\Users\\wilbe\\.clawd\\viltrum\\state\\viltrum-d00\\agent",
    model: { primary: "openai/gpt-5.6-sol", fallbacks: [] },
    models: { "openai/gpt-5.6-sol": { agentRuntime: { id: "codex" } } },
    skills: [],
    tools: { profile: "full", deny: ["*"], fs: { workspaceOnly: true } },
    subagents: { allowAgents: [] },
    heartbeat: { every: "0m", target: "none" }
  }
}
```

`agentRuntime` se configura dentro del registro de modelos por agente, proveedor o modelo; no como campo directo del agente. Es válido fijar Codex explícitamente para este modelo, o dejar la elección implícita de la ruta HTTPS oficial. Una instalación sin el harness requerido falla en lugar de cambiar silenciosamente de runtime. El modelo sigue siendo un valor configurable: conservarlo en el contrato del receptor y usar overrides autorizados. Un `--model` explícito en `agent` deshabilita fallbacks configurados para esa ejecución. [Modelos](https://github.com/openclaw/openclaw/blob/v2026.9.4/docs/gateway/config-agents/models.md).

`skills: []` elimina skills visibles de ese agente. `deny: ["*"]` gana a allow y restringe todas las herramientas. En Codex, deny wildcard activa la superficie restringida: sin native Code Mode ni selección de entorno, MCP heredado/configurado deshabilitado y comprobado, relays de hooks nativos desactivados y política aplicada a herramientas dinámicas. Un perfil reducido por sí solo no activa esa restricción nativa. [Política](https://github.com/openclaw/openclaw/blob/v2026.9.4/docs/gateway/config-tools/tool-policy.md), [Codex restringido](https://github.com/openclaw/openclaw/blob/v2026.9.4/docs/plugins/codex-harness-reference/restricted-turns.md), [skills](https://github.com/openclaw/openclaw/blob/v2026.9.4/docs/tools/skills-config.md).

El workspace es cwd, no una barrera del sistema operativo. `tools.fs.workspaceOnly: true` limita herramientas de archivos si se habilitan luego. Un sandbox OpenClaw real usa `sandbox: {mode:"all", scope:"agent", workspaceAccess:"none"|"ro"|"rw", backend:"docker"}` y requiere backend disponible. No se comprobó Docker ni se propone instalarlo en esta investigación. El sandbox nativo de Codex usa `plugins.entries.codex.config.appServer.sandbox: "read-only"` (config global del plugin), no campos `sandboxMode` o `readOnly` por agente. No cambiarlo globalmente para esta flota. [Sandbox](https://github.com/openclaw/openclaw/blob/v2026.9.4/docs/gateway/config-agents/sandbox.md), [campos Codex](https://github.com/openclaw/openclaw/blob/v2026.9.4/docs/plugins/codex-harness/config-fields.md).

`heartbeat.every: "0m"` detiene cadencia periódica, aunque un wake dirigido aún puede ejecutar un turno. `target:"none"` conserva resultados internos. La denegación de herramientas bloquea además `sessions_spawn`; `allowAgents:[]` restringe destinos. [Heartbeat](https://github.com/openclaw/openclaw/blob/v2026.9.4/docs/gateway/config-agents/heartbeat-compaction-and-streaming.md).

## Ruta elegida: receptor SDK propio → CLI → resultados

El receptor autenticado en loopback `127.0.0.1:8771` puede conservar una cola SQLite, ejecutar `runtime.start` con backend OpenClaw y publicar estado/resultados mediante su propio contrato. Así no necesita habilitar `hooks` del Gateway. Separar mensajes recibidos, ID de evento, ejecución y resultado; la revisión independiente sucede después de la ejecución.

Invocación prevista para un trabajo, no ejecutada por esta investigación:

```powershell
& 'C:\Users\wilbe\tools\node-v24.18.0-win-x64\openclaw.ps1' agent --agent viltrum-d00 --session-key 'viltrum-webhook:EVENT_ID' --message-file 'C:\Users\wilbe\.clawd\viltrum\jobs\EVENT_ID\prompt.txt' --model openai/gpt-5.6-sol --timeout 600 --json
```

Usar subprocess con lista de argumentos, sin shell concatenado. `agent` normal acepta archivo UTF-8 máximo 4 MiB; no está documentado stdin `-` para esta entrada. `agent exec` sí soporta stdin, pero no selecciona un agente configurado por `--agent` y añade defaults de coding/exec; no es sustituto transparente de esta arquitectura. Omitir `--deliver` conserva la entrega a canales desactivada. El prompt se obtiene de contexto/memoria del SDK y archivos bootstrap dedicados, sin leer archivos arbitrarios personales.

La salida JSON normal conserva el resultado RPC: texto en `response.result.payloads[*].text`, metadata en `response.result.meta`, estadísticas en `meta.agentMeta` y herramientas en `meta.toolSummary`. Si existe `result.deliveryStatus`, también se proyecta `deliveryStatus` en la raíz. No confundirlo con el envelope de `agent exec`, que expone `final` y `payloads` en raíz. CLI `--json` dirige logs a stderr. Estados `ok`/`completed` salen con 0; timeout/error y `in_flight` con 1. Fuente código instalado: `dist/agent-via-gateway-Bvxv2S_F.mjs`, funciones `buildGatewayJsonResponse`, `agentViaGatewayCommand` y `markAgentRunExitCode`; [CLI](https://github.com/openclaw/openclaw/blob/v2026.9.4/docs/cli/agent.md).

El CLI genera idempotencyKey aleatoria por llamada y no expone flag público para fijarla. El receptor debe registrar durablemente la clave externa y estado antes de despachar; una caída tras admisión puede dejar ejecución indeterminada. Timeout o cierre del Gateway no rerun automático local: la ejecución aceptada puede terminar después. No reintentar a ciegas una operación ya despachada. Model override permite mantener el modelo configurable, sujeto a políticas y disponibilidad. Nunca devolver stdout/stderr brutos como diagnóstico público.

RPC opcional: `agent` exige `message` e `idempotencyKey` no vacíos y admite `agentId`, `model`, `sessionKey`, `sessionId`, `timeout`, `deliver`; `agent.wait` admite `{runId,timeoutMs}`. Fuente instalada `dist/src-7tzZ8j12.mjs:2306` y `:2392`. Requiere handshake/auth propio del Gateway; no reutilizar el token del receptor como credencial Gateway.

## Hooks HTTP nativos: alternativa opcional y límites

Si se habilitan en otro momento, `hooks.token` es una cadena dedicada; SecretRef objeto no está soportado. Sí admite sustitución de cadena `${VILTRUM_OPENCLAW_HOOK_TOKEN}` por variable de entorno del proceso, sin escribir el valor real en documentación. No reutilizar token/password del Gateway. Config propuesta opcional:

```json5
hooks: {
  enabled: true,
  token: "${VILTRUM_OPENCLAW_HOOK_TOKEN}",
  path: "/viltrum-hooks",
  allowedAgentIds: ["viltrum-d00"],
  allowRequestSessionKey: false,
}
```

`POST /viltrum-hooks/agent` acepta JSON con `message`, `agentId`, `model`, `deliver:false`, `sessionMode:"isolated"`, `timeoutSeconds` y opcional `waitForCompletion:true`. Auth mediante Bearer o `x-openclaw-token`; query `token` rechazada. Cuerpo normal máximo 256 KiB y lectura 30 s. Admisión de una ejecución máximo 15 s. Un 200 inicial `{ok:true,runId}` solo prueba admisión.

Con `waitForCompletion:true` devuelve facts `completion.status` (`ok|error|skipped`), `replyDisposition` y datos categóricos de entrega; nunca texto generado ni summaries. Un fallo posterior a admisión puede ser HTTP 200 con `completion.status:error`. Por ello no satisface por sí solo `/messages → /results` con respuesta textual o callback. No se documenta `callbackUrl` en ese payload.

Idempotencia: headers `Idempotency-Key`, `X-OpenClaw-Idempotency-Key`, luego payload `idempotencyKey`; máximo 256 caracteres. Replay corresponde al mismo token/path/campos de dispatch. Pendientes siguen retenidos; completadas TTL 5 minutos y límite 1000 entradas; reinicio elimina memoria. Cambiar contenido/ruta puede crear otro run aun con la misma clave. No equivale a exactly-once durable.

Mappings opcionales: primer match gana; `match.path`, `match.source`, `agentId` estático, `messageTemplate`, `model`, `thinking`, `timeoutSeconds`, `deliver:false`. `forEach` máximo 200 elementos; espera admisión de fan-out hasta 8 s y elementos pendientes continúan pese a respuesta parcial no 2xx. Transforms son JS/TS confiable en el Gateway, fuera del sandbox del agente; no instalar transform basado en input externo. Mappings no permiten `waitForCompletion` y no exponen accountId. [Referencia de hooks](https://github.com/openclaw/openclaw/blob/v2026.9.4/docs/gateway/config-hooks.md), [ingress](https://github.com/openclaw/openclaw/blob/v2026.9.4/docs/automation/cron-jobs/webhooks.md), [env](https://github.com/openclaw/openclaw/blob/v2026.9.4/docs/gateway/config-secrets-env.md).

`openclaw webhooks` solo administra Gmail Pub/Sub; no registra mappings genéricos. El plugin Webhooks de TaskFlow y `HOOK.md` internos son subsistemas distintos.

## Licencia y alcance de comprobación

OpenClaw y documentación distribuida: MIT, Copyright (c) 2026 OpenClaw Foundation. Si se copia software o una parte sustancial de documentación, conservar aviso de copyright y licencia. [LICENSE oficial](https://github.com/openclaw/openclaw/blob/v2026.9.4/LICENSE). Los ejemplos anteriores son una propuesta derivada y no contienen secretos.

Se comprobaron versión, ayuda CLI, documentación distribuida, código del envelope/schemas RPC y metadatos seleccionados de config. No se ejecutó una inferencia, no se validó aún la configuración compuesta de los 23 agentes ni se comprobó respuesta/callback en producción. La integración debe validar configuración candidata antes de aplicar y comprobar por separado que el trabajo real utiliza el agente/modelo esperado y que `toolSummary` no registra herramientas ejecutadas.

## Implementación operativa posterior: CLI local

El SDK 0.4 usa por defecto `agent --local` y `agents.local.json` sin canales. Mantiene
el estado original de OpenClaw para reutilizar OAuth sin copiarlo; exige estado
exclusivo y Gateway detenido. El JSON local es raíz `{payloads, meta}`, a diferencia
del Gateway `{status, result, runId}`. El adaptador normaliza sólo el transporte
seleccionado y exige los mismos recibos, modelo, sesión, harness y política.
Véase el handoff OpenClaw/webhook para la ejecución real D21→D03 y su rechazo.
