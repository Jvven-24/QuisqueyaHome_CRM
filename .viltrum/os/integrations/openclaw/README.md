# OpenClaw: perfiles Viltrum y entrada webhook durable

El SDK Viltrum 0.4 añade 23 agentes OpenClaw, D00–D22, y un receptor local que
convierte una entrada autenticada en un run Viltrum de análisis. El SDK conserva
la clasificación, contratos, checkpoints, entregas y revisión independiente.
OpenClaw ejecuta cada encargo productor o revisor mediante CLI `agent --local`,
con transporte local explícito y harness Codex para `openai/gpt-5.6-sol`.

El contrato del adaptador fija OpenClaw **2026.9.4**. El entorno Windows de
referencia usa **Node 24.18.0**; el preflight exige Node 24 o superior y verifica
la versión del paquete OpenClaw. Cambiar versión, modelo o política de herramientas
requiere revisar el contrato antes de volver a ejecutar. Los resultados HTTP
observados y el run de demo en curso se registran en la sección final.

## Perfiles y alcance

La raíz dedicada por defecto es `C:\Users\wilbe\.clawd\viltrum`:

```text
.clawd/viltrum/
  workspaces/viltrum-d00/ ... workspaces/viltrum-d22/
    AGENTS.md  SOUL.md  IDENTITY.md  USER.md  TOOLS.md  profile.json
  state/viltrum-d00/agent/ ... state/viltrum-d22/agent/
  inbox/
    events.sqlite
    receiver.lock
```

Cada workspace contiene método, identidad y contrato del departamento. El
supervisor aporta las fuentes del proyecto y guarda las respuestas como artefactos;
los agentes no reciben acceso a las herramientas del proyecto. Los IDs nativos
son `viltrum-d00` a `viltrum-d22`, con workspace y agentDir distintos. Su política
exige `tools.deny: ["*"]`, sin skills nativas, subagentes, heartbeat ni fallback de
modelo; `tools.fs.workspaceOnly` se fija en true. El harness del modelo es `codex`.

La denegación de tools es una política comprobada en la configuración y durante
la respuesta; no acredita un sandbox del sistema de archivos. El adaptador aporta
contexto seleccionado y hashes. Se permite análisis supervisado y salida
estructurada; no se acredita construcción, publicación, envío de mensajes,
investigación autónoma con navegador ni lectura con tools por el modelo.

D00 coordina según la fase del proyecto. Los productores siguen su contrato y el
revisor canónico de `registry/departments.yaml` y `delivery.json`; un departamento
no revisa su propia entrega. Las revisiones humanas permanecen explícitas. Terminar
un run acredita paquetes revisados para su alcance, sin aprobar gates G0–G8 ni C1.
`profile.json` conserva `eval_score: null`: registrar 23 agentes no demuestra
entrenamiento, pericia del 100% ni cobertura completa de evaluaciones.

## Autenticación y archivos privados

Los agentes usan la autenticación OAuth OpenAI gestionada por OpenClaw en su
almacén nativo. Esta integración no copia, exporta ni imprime esos tokens y no
replica `auth-profiles.json` en los 23 agentDir. El proceso usa
`OPENCLAW_STATE_DIR=C:\Users\wilbe\.openclaw`, el estado original compartido,
con metadatos OAuth OpenAI declarados y credenciales administradas allí por
OpenClaw. Una configuración OAuth declarada no demuestra por sí sola una llamada
autenticada exitosa. El CLI requiere estado exclusivo mediante su lock nativo;
el worker webhook serializa sus encargos, pero otros escritores OpenClaw deben
permanecer detenidos mientras se utiliza el transporte local.

El Bearer del receptor webhook es un secreto separado, generado por el setup.
La configuración compartida del cliente se guarda en
`%LOCALAPPDATA%\Viltrum\openclaw\client.json`; apunta a `agents.local.json`, una
configuración privada con solo los 23 agentes Viltrum y plugins OpenAI/Codex.
Este transporte no carga canales ni la configuración global de Nova. El secreto
webhook está en `secret.env` del mismo
directorio, con permisos privados. Ambos están fuera del SDK y de los proyectos.
La cola se configura en `.clawd\viltrum\inbox`, también fuera de los proyectos
allowlisted. `VILTRUM_OPENCLAW_CONFIG` permite señalar el client.json privado
registrado en el recibo de preparación.

El archivo [webhook.example.json](webhook.example.json) contiene únicamente rutas
ficticias y el contrato de configuración del receptor. No contiene credenciales ni
el registro completo de agentes del adaptador; no sustituye el client.json generado.

## Preparar y registrar

Se necesita el SDK autorizado con extras runtime, OpenClaw instalado y el modelo
`openai/gpt-5.6-sol` presente en su catálogo configurado. El proyecto de destino
debe tener Viltrum instalado. Usa el Python que contiene LangGraph; en esta copia
local se dispone de `.venv-langgraph\Scripts\python.exe`.

```powershell
$viltrumPython = 'E:\PERFILES AI\.venv-langgraph\Scripts\python.exe'
& $viltrumPython -m viltrum_sdk.cli openclaw-setup `
  --workspace-root 'C:\Users\wilbe\.clawd\viltrum' `
  --project 'demo=E:\PERFILES AI\tmp\runtime-demo' `
  --model 'openai/gpt-5.6-sol' --transport local
```

Sin `--apply`, el comando prepara archivos administrados, secreto, client.json y
patch privado y pide a OpenClaw validar el patch en dry-run. No llama a un modelo.
Con `--apply` local confirma el registro de la configuración privada validada; no
modifica el registro global. En transporte Gateway, valida el destino nativo,
guarda un backup privado y registra mediante `openclaw config patch`, conservando
las entradas previas y campos externos al patch. Puede repetirse `--project 'ID=RUTA_ABSOLUTA'` para cada proyecto permitido.

```powershell
& $viltrumPython -m viltrum_sdk.cli openclaw-setup `
  --workspace-root 'C:\Users\wilbe\.clawd\viltrum' `
  --project 'demo=E:\PERFILES AI\tmp\runtime-demo' `
  --model 'openai/gpt-5.6-sol' --transport local --apply
& $viltrumPython -m viltrum_sdk.cli runtime-doctor
```

El setup conserva recursos existentes distintos y exige reconciliarlos; no
restablece configuración automáticamente. El recibo `setup-receipt.json` es
privado y distingue preparación, validación del patch y aplicación. El registro
global de esta instalación añadió 23 agentes y conservó los cuatro previos; la
configuración local privada fue validada en dry-run.

El transporte default es `local`, seleccionado también en client.json. Ejecuta
`node.exe openclaw.mjs agent ... --local` con `OPENCLAW_CONFIG_PATH` apuntando a
agents.local.json y el estado OAuth original, sin iniciar Gateway. El transporte
alternativo `gateway` puede seleccionarse explícitamente con `--transport gateway`
en una configuración revisada y necesita Gateway operativo en loopback 18789.
No existe fallback silencioso de Gateway a local ni de modelo.

Antes del modo local, el Gateway gestionado 18789 debe estar detenido para liberar
el estado nativo. En esta instalación se utilizó el comando nativo fijado:

```powershell
openclaw gateway stop --force --json
```

`Stop-ScheduledTask` por sí solo dejó un supervisor stale. El Gateway original
falló durante bootstrap con un error de cleanup stdio MCP, observado antes y
después del registro Viltrum, y quedó detenido. No se acredita actualmente como
operativo. Reconciliar ese problema por separado si se quiere usar transporte
gateway; no reactivarlo en paralelo con el run local.

## Servir y consultar la cola

El puerto **8771** pertenece al receptor Viltrum. Es distinto del Gateway OpenClaw
18789 y no necesita activar hooks HTTP nativos de OpenClaw. El listener enlaza
exclusivamente `127.0.0.1`; el cliente debe enviar Host loopback con el puerto.

```powershell
$viltrumConfig = Join-Path $env:LOCALAPPDATA 'Viltrum\openclaw\client.json'
& $viltrumPython -m viltrum_sdk.cli webhooks status --config $viltrumConfig
& $viltrumPython -m viltrum_sdk.cli webhooks serve --config $viltrumConfig --port 8771
```

`status` lee contadores SQLite; no crea runs ni recupera eventos. `serve` conserva
el lock del sistema operativo sobre la cola, inicia un worker y sirve HTTP hasta
el cierre. Usa el clientConfig del recibo si LOCALAPPDATA difiere entre procesos.

## Enviar una entrada y observar su resultado

El POST acepta exactamente cuatro campos, sin selección remota de backend, agente,
modelo, ruta, comando ni callback:

```json
{
  "eventId": "contacto-demo-20260929-001",
  "projectId": "demo",
  "text": "Analiza el alcance y las dudas para integrar el formulario de contacto.",
  "intent": "INTEGRACION"
}
```

El texto es un dato externo, máximo 32 KiB UTF-8; el body JSON tiene máximo 64 KiB.
eventId usa hasta 96 caracteres seguros y projectId debe pertenecer a la allowlist.
intent admite `AUTO` o el catálogo SDK. El Bearer se acepta exclusivamente mediante
un único header `Authorization`. No se admiten query strings ni CORS.

Este ejemplo carga el token generado en memoria y no lo imprime ni lo coloca en
la URL. Ejecuta el cliente desde otra terminal mientras el receptor esté activo:

```powershell
$viltrumSettings = Get-Content -LiteralPath $viltrumConfig -Raw | ConvertFrom-Json
$viltrumTokenLine = Get-Content -LiteralPath $viltrumSettings.secretEnvFile |
  Where-Object { $_ -match '^VILTRUM_WEBHOOK_TOKEN=' } | Select-Object -First 1
$viltrumToken = $viltrumTokenLine.Split('=', 2)[1].Trim()
$viltrumHeaders = @{ Authorization = "Bearer $viltrumToken" }
$viltrumPayload = @{
  eventId = 'contacto-demo-20260929-001'
  projectId = 'demo'
  text = 'Analiza el alcance y las dudas para integrar el formulario de contacto.'
  intent = 'INTEGRACION'
} | ConvertTo-Json -Compress
$viltrumAccepted = Invoke-RestMethod -Method Post `
  -Uri 'http://127.0.0.1:8771/webhooks/viltrum' `
  -Headers $viltrumHeaders -ContentType 'application/json' `
  -Body ([System.Text.Encoding]::UTF8.GetBytes($viltrumPayload))
$viltrumAccepted
Invoke-RestMethod -Method Get `
  -Uri ("http://127.0.0.1:8771/events/" + $viltrumAccepted.eventId) `
  -Headers $viltrumHeaders
```

`202` acredita el commit de entrada en SQLite, no el término del run. El GET de
evento siempre requiere Bearer y devuelve status, runId, artefacto y referencias
acotadas de evidencia. `GET /health` devuelve únicamente estado del servicio y
versión de esquema y no requiere token. Evita publicar variables de headers,
secret.env, configuración nativa o sesiones privadas como evidencia.

SQLite aplica idempotencia durable por eventId y hash del payload canónico. Repetir
el mismo ID y contenido devuelve la identidad original y el estado actual con 202;
cambiar el contenido usando ese ID devuelve 409. La cola admite 32 eventos
pending/processing por defecto y limita a 60 solicitudes por minuto; saturación
devuelve 429. Usa un nuevo eventId para una nueva solicitud deliberada.

## Flujo y recuperación

La aceptación asigna `.viltrum/intake/webhooks/<uuid>.md`. El worker registra
processing antes de escribir la fuente, trata el texto como datos y crea un goal
administrativo fijo que referencia el archivo. `source_paths` incluye la fuente
en el contexto y fingerprint del runtime. `on_created(run_id)` guarda el ID en
SQLite antes de despachar el primer agente.

Cada encargo usa una sesión nativa distinta con actor productor o revisor. El
adaptador conserva dispatch.json, execution.json, respuesta acotada y manifiesto
de fuentes. El runtime guarda run.json, eventos, prompts, checkpoints y handoffs
en el proyecto. Una entrega sin revisión suficiente permanece bloqueada.

Tras caída, processing pasa a blocked con nota de reconciliación y nunca se
redistribuye automáticamente. Los pendientes pueden avanzar al reiniciar. Si hay
runId, inspecciona el run existente; una caída anterior al callback exige
correlacionar la fuente y el goal local. `run-resume` y `run-cancel` operan sobre el
ID existente; no crees un segundo evento para resolver un despacho ambiguo. El
adaptador corta procesos locales por timeout/cancelación, pero no acredita
cancelación remota de la operación del proveedor.

```powershell
& $viltrumPython -m viltrum_sdk.cli run-status `
  'E:\PERFILES AI\tmp\runtime-demo' --run-id 'RUN-ID_REAL'
```

## Rutas de implementación y evidencia

| Ruta | Responsabilidad |
| --- | --- |
| `viltrum_sdk/openclaw_setup.py` | Preparación, registro nativo y recibo privado |
| `viltrum_sdk/adapters/openclaw.py` | Preflight, sesión restringida y resultado validado |
| `viltrum_sdk/webhooks.py` | HTTP, allowlist, SQLite, lock y worker |
| `viltrum_sdk/runtime.py` | Estado durable, fuentes, entregas y revisor independiente |
| `viltrum_sdk/cli.py` | openclaw-setup, webhooks y comandos de run |

Guías complementarias:
[diseño del receptor](../../docs/research/webhook-design-2026-09-29.md) y
[handoff para Claude Code](../../docs/architecture/HANDOFF-OPENCLAW-WEBHOOK-CLAUDE-CODE.md) y
[diagrama 15](../../docs/architecture/diagramas/15-openclaw-webhook.mmd).

## Evidencia operativa de la demo — resultado final

Fecha local: 2026-09-29. SDK 0.4, OpenClaw 2026.9.4 y Node 24.18.0.

| Comprobación | Resultado observado |
| --- | --- |
| Perfiles | 23 workspaces/configurados; cuatro entradas anteriores preservadas en el registro inicial |
| Configuración local | Validada y aplicada; la aplicación local no modifica el registro global |
| Transporte | `agent --local`, sin canales; estado nativo original y OAuth existente |
| HTTP | Health 200; POST/GET sin Bearer 401; aceptación 202; duplicado idéntico 202; contenido distinto 409 |
| Evento | `openclaw-local-20260929-001`, projectId `demo` |
| Run | `RUN-df40231836ed4293af8b468549f00ca0` |
| Productor | D21 / `viltrum-d21`; GPT respondió y entregó un informe con una fuente |
| Revisor | D03 / `viltrum-d03`; otra sesión GPT entregó revisión con dos fuentes |
| Atestación de ambos turnos | Harness Codex, modelo solicitado/efectivo GPT-5.6-sol, sesiones/run IDs coincidentes, Code Mode false, herramientas exitosas vacías, política y hashes vigentes al retorno |
| Resultado de revisión | `rejected`; run/evento `blocked`, conservados para corrección |
| Gates / C1 / eval scores | No aprobados; los 23 eval_score siguen null |

El revisor detectó una mención de SwarmClaw sin respaldo en la fuente y cuestionó
la comprobación independiente de hashes bajo un encargo sin tools. El rechazo se
conservó: no se sustituyó por aprobación ni se volvió a despachar automáticamente.
Después de la demo se aclaró el contrato del adaptador: el supervisor calcula y
comprueba SHA256 antes/después del turno; el modelo revisa contenido y referencias,
sin atribuirse recálculo de hashes. Las fuentes incluyen ahora su hash y se exige
preflight local de sólo OpenAI/Codex, sin hooks, canales, bindings ni extraDirs.
Estos ajustes posteriores recibieron revisión de código y preflight, sin una segunda
demo de modelo ni afirmación de que la entrega rechazada quedó corregida.

La captura sanitizada está en `docs/architecture/evidencia-openclaw-webhook-2026-09-29.json`.
Los informes reales están en `tmp/runtime-demo/.viltrum/runtime/runs/RUN-df40231836ed4293af8b468549f00ca0/artifacts/`.
El dashboard `http://127.0.0.1:8765/` y el GET autenticado del evento muestran el bloqueo.

El Gateway gestionado 18789 permanece detenido tras un fallo de limpieza stdio/MCP.
El transporte local requiere propiedad exclusiva del estado nativo; si otro escritor
o Gateway lo posee, el CLI debe bloquear. No habilitar ambos simultáneamente sobre
el mismo estado ni crear un eventId nuevo para esquivar un bloqueo. La integración
no acredita sandbox del host ni cancelación remota. El webhook es sólo local; no
se publicó una URL de Internet.

Nota de consulta: `status` conserva el snapshot SQLite del evento y `runStatusAtDispatch` su estado histórico; el GET autenticado muestra `runStatus` actual tras revisión/reanudación manual cuando `runStatusRefreshed` es true.
Con `runStatusRefreshed: false` se conserva el snapshot sin acreditar actualización; consultar nunca muta la cola ni redespliega. La demo mantiene su revisión `rejected` y bloqueo real.

## Añadir otro proyecto

Instala Viltrum en la raíz destino y ejecuta `openclaw-setup --project nuevoID=RUTA --transport local --apply`. Los proyectos anteriores se conservan. Un ID existente no se remapea: usa uno nuevo para otra raíz. Reinicia el receptor de forma ordenada para cargar la allowlist ampliada; no lo cierres durante una ejecución activa. El SDK exige el estado nativo original, sin otro OPENCLAW_STATE_DIR.

El arranque CLI puede ser lento: setup tiene un límite de 600 segundos y los turnos un límite de 300. Se pueden ajustar dentro de 30–900 mediante VILTRUM_OPENCLAW_SETUP_TIMEOUT_SECONDS y VILTRUM_OPENCLAW_TIMEOUT_SECONDS. Un timeout queda registrado y requiere reconciliación; no activa otro backend.
