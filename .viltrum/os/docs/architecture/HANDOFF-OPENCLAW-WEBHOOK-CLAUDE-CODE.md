# Handoff: OpenClaw y webhook durable — Claude Code

Fecha: 2026-09-29. Fuente de implementación: SDK Viltrum 0.4 en `E:\PERFILES AI`.
Esta guía conserva el mecanismo y los pasos de operación para continuar con otra
sesión. La evidencia HTTP y el snapshot del run en curso se incorporan al final;
su terminación sigue pendiente del supervisor.

## Resultado implementado y alcance

El SDK prepara 23 agentes OpenClaw D00–D22 con identidad y workspace separados;
añade el backend `openclaw` al runtime y expone un receptor local autenticado en
`127.0.0.1:8771`. La entrada HTTP se persiste antes de responder, se convierte en
una fuente de datos del proyecto y activa el runtime existente con contratos,
checkpoints, entregas y revisión independiente.

El backend fija OpenClaw **2026.9.4** y modelo **openai/gpt-5.6-sol**, con harness
**codex**. El transporte default explícito es CLI `agent --local`. Windows
**Node 24.18.0** es la instalación de referencia; preflight exige
Node 24 o superior y versión OpenClaw exacta. Una actualización de proveedor o
modelo requiere revisar preflight, esquema de respuesta y política antes de
reanudar. Esta documentación no constituye una captura de versiones ejecutadas.

El modo es `supervised_context_analysis`: el supervisor selecciona fuentes,
registra SHA256 y guarda el resultado del agente como artefacto. El agente tiene
`tools.deny: ["*"]`, skills vacías, sin subagentes, heartbeat ni fallback y
`tools.fs.workspaceOnly: true`. Esta política restringe tools; no se acredita un
sandbox de filesystem ni construcción/publicación autónoma.

Los 23 perfiles son contratos operativos registrados, con `eval_score: null`.
No hay certificación de entrenamiento, desempeño del 100% ni ejecución de todos
sus casos de evaluación. D00 coordina; productor y revisor canónico son actores
distintos. Las revisiones humanas siguen siendo humanas. Los gates G0–G8 y la
aceptación comercial C1 conservan autoridad separada de que un run termine.

## Mecanismo y puntos de extensión

| Paso | Código | Estado o evidencia |
| --- | --- | --- |
| Preparar 23 workspaces y configuración local | `viltrum_sdk/openclaw_setup.py:setup` | client.json, agents.local.json, patch y recibo privados |
| Validar POST y Bearer | `viltrum_sdk/webhooks.py:Handler` | Payload de cuatro campos y allowlist |
| Aceptar de forma idempotente | `Queue.accept` | Commit SQLite, eventId y fuente asignada |
| Reclamar y crear fuente | `Queue.claim` / `Queue.execute` | processing antes de side effects; intake atómico |
| Preparar run y vincular evento | `runtime.start` / `on_created` | run preparado y runId persistido antes del dispatch |
| Ejecutar perfil nativo | `viltrum_sdk/adapters/openclaw.py:execute` | Actor/sesión, dispatch y resultado acotado |
| Registrar y revisar entrega | `viltrum_sdk/runtime.py` | Handoff, hashes y revisor independiente |
| Consultar | GET de evento / CLI / dashboard | Estado durable y referencias de evidencia |

LangGraph permanece como motor del grafo Viltrum. OpenClaw es un executor del
puerto del SDK: no sustituye sus fases, revisores ni la aceptación del proyecto.
El CLI SDK proporciona `openclaw-setup`, `webhooks serve`, `webhooks status` y el
backend `run --backend openclaw`. El flujo se representa en el
[diagrama 15](diagramas/15-openclaw-webhook.mmd).

El receptor pasa un goal fijo y `source_paths=[ruta_intake]` a `runtime.start`.
El contenido externo se marca como datos no confiables y no se usa como instrucción
administrativa libre. La fuente se incluye en contexto/fingerprints. El catálogo
de intención acepta valores SDK y AUTO; AUTO se clasifica localmente sobre el texto.

Antes de cada nuevo dispatch, el adaptador valida versión, transporte explícito,
registro de agentes, modelo/harness, política de tools y archivos del método.
Con `transport: local`, llama Node/openclaw.mjs `agent ... --local` y exige el
recibo terminal nativo. La alternativa `transport: gateway` requiere además
Gateway loopback 18789 operativo. Un fallo nunca cambia silenciosamente al otro
transporte ni a otro modelo.
Selecciona contexto bajo el proyecto, excluye fuentes privadas, limita su volumen,
verifica hashes y pide salida JSON. Producer devuelve summary/evidence; reviewer
añade verdict approved/rejected. `sourceEvidenceCount` cuenta referencias del
resultado y `supervisorSourceCount` las fuentes suministradas; no intercambiarlos
ni afirmar lectura mediante tools denegadas.

## Archivos privados y autenticación

Raíz de agentes: `C:\Users\wilbe\.clawd\viltrum`. Los workspaces viven en
`workspaces/viltrum-d00` a `workspaces/viltrum-d22`; cada agente usa su `state/.../agent`.
La cola por defecto está en `inbox/events.sqlite`, con un lock OS sobre receiver.lock.

Configuración del cliente y secreto del webhook:

```text
%LOCALAPPDATA%/Viltrum/openclaw/
  client.json
  agents.local.json
  secret.env
  agents.patch.json
  setup-receipt.json
```

Usar clientConfig del recibo o `VILTRUM_OPENCLAW_CONFIG` cuando el entorno de la
aplicación redirija LOCALAPPDATA. No colocar estos archivos en el SDK, en contexto
de agentes ni en proyectos versionados. El setup protege archivos privados con
ACL del usuario; la configuración nativa y su backup permanecen en su ubicación
OpenClaw privada.

client.json selecciona `transport: local` y apunta a agents.local.json. Esta
configuración privada contiene exclusivamente los 23 agentes Viltrum, sus políticas
y plugins OpenAI/Codex; no carga canales ni la configuración global de Nova.

OpenClaw conserva y comparte su autenticación OAuth OpenAI nativa mediante
`OPENCLAW_STATE_DIR=C:\Users\wilbe\.openclaw`, su estado original. El SDK no
exporta/copia tokens ni crea 23 copias de `auth-profiles.json`. Preflight consulta
metadatos declarados de proveedor/modo, por lo que `configuredOAuth` no equivale a
`authVerified`. La primera respuesta válida del proveedor es evidencia adicional
que debe identificarse por su run/sesión, sin exponer el almacén de autenticación.
El CLI local requiere propiedad exclusiva del estado mediante su lock nativo.
La cola webhook serializa sus encargos; otros procesos que escriban el mismo
estado, incluido el Gateway gestionado, deben permanecer detenidos durante el run.

El secreto Bearer del receptor es independiente: `VILTRUM_WEBHOOK_TOKEN` en un
archivo env privado, leído como texto sin ejecución/expansión. El mínimo es 32
caracteres. No incluirlo en URLs, ejemplos públicos, logs, PRs ni capturas.

## Operación desde Claude Code

Usar el SDK instalado desde esta fuente autorizada y Python con extras runtime.
No actualizar OpenClaw ni cambiar cuentas para resolver un preflight bloqueado
sin examinar su contrato y los diagnósticos locales.

```powershell
$viltrumPython = 'E:\PERFILES AI\.venv-langgraph\Scripts\python.exe'
& $viltrumPython -m viltrum_sdk.cli openclaw-setup `
  --workspace-root 'C:\Users\wilbe\.clawd\viltrum' `
  --project 'demo=E:\PERFILES AI\tmp\runtime-demo' `
  --model 'openai/gpt-5.6-sol' --transport local
```

Sin `--apply`, prepara recursos y valida el patch nativo con dry-run; no es una
consulta sin escrituras. `--project ID=RUTA` puede repetirse y cada ruta debe ser
absoluta, allowlisted y tener Viltrum instalado. Agregar `--apply` registra las
entradas mediante el CLI OpenClaw, conserva un backup privado y comprueba que
agentes anteriores y otros campos nativos mantienen su contenido. Archivos o
agentes existentes distintos exigen reconciliación, no sobrescritura automática.

```powershell
& $viltrumPython -m viltrum_sdk.cli openclaw-setup `
  --workspace-root 'C:\Users\wilbe\.clawd\viltrum' `
  --project 'demo=E:\PERFILES AI\tmp\runtime-demo' `
  --model 'openai/gpt-5.6-sol' --transport local --apply
& $viltrumPython -m viltrum_sdk.cli runtime-doctor
$viltrumConfig = Join-Path $env:LOCALAPPDATA 'Viltrum\openclaw\client.json'
& $viltrumPython -m viltrum_sdk.cli webhooks status --config $viltrumConfig
& $viltrumPython -m viltrum_sdk.cli webhooks serve --config $viltrumConfig --port 8771
```

El Gateway OpenClaw usa 18789; el receptor Viltrum, 8771. Son procesos y contratos
distintos. El transporte local no necesita activar Gateway, hooks HTTP, canales
ni callbacks nativos. Antes de iniciar `agent --local`, el Gateway gestionado debe
estar detenido para liberar el estado compartido. El supervisor usó el comando
nativo de OpenClaw 2026.9.4:

```powershell
openclaw gateway stop --force --json
```

Detener solo la tarea programada con `Stop-ScheduledTask` dejó un supervisor stale.
El Gateway original falló durante bootstrap con cleanup stdio MCP antes y después
del registro Viltrum; actualmente permanece detenido. No atribuir ese fallo a
los 23 agentes sin evidencia ni afirmar Gateway operativo. `--transport gateway`
es una alternativa administrativa explícita que exige resolver y verificar ese
servicio por separado. No hay fallback silencioso desde Gateway hacia local.

## Contrato de entrada y consulta

`POST http://127.0.0.1:8771/webhooks/viltrum`, con Content-Type application/json y
un único `Authorization: Bearer <secreto_privado>`. El payload contiene exactamente:

```json
{
  "eventId": "handoff-demo-20260929-001",
  "projectId": "demo",
  "text": "Analiza requisitos, riesgos y dudas de la integración propuesta.",
  "intent": "INTEGRACION"
}
```

Requiere Content-Length y UTF-8 válido. Body máximo: 64 KiB; texto máximo: 32 KiB;
eventId seguro de hasta 96 caracteres; proyecto allowlisted. Rechaza otros campos,
duplicados JSON, rutas/backend/agentes/modelos/comandos/callbacks del caller,
Transfer-Encoding, Content-Encoding, query strings y Origin de navegador.

202 significa recepción durable. Para observar su resultado usar
`GET /events/<eventId>` **con Bearer**. La consulta devuelve estado, runId y rutas
de artefacto/evidencia, con un resumen acotado del estado. `GET /health` no requiere
autenticación y no devuelve proyectos, configuración ni datos de la cola.

Reintento idéntico con el mismo eventId: 202, misma identidad y estado actual.
Contenido distinto con el mismo ID: 409. Formato/autenticación no acreditados:
400/401/411/413/415. Capacidad/tasa excedidas: 429. Defaults: 32 eventos pendientes/en
proceso y 60 solicitudes por minuto globales, incluyendo consultas y health.
La guía [OpenClaw](../../integrations/openclaw/README.md) incluye un cliente
PowerShell que carga el token en memoria y consulta el GET autenticado.

## Crash, cancelación y reconciliación

El lock del sistema operativo se adquiere antes de recuperar SQLite y se mantiene
durante toda la vida del receptor. SQLite usa WAL, synchronous FULL, eventId único y
transacciones para aceptación y claim. El worker único marca processing antes de
escribir el intake o crear un run. El callback de creación persiste runId antes del
dispatch; si falla, el runtime preparado no despacha.

Al reiniciar, processing pasa a blocked con una nota de reconciliación. No se
redistribuye ni se crea otro run automáticamente. Puede existir un run preparado
sin runId en la cola si el proceso cayó antes del callback: correlacionar su fuente
y goal en el proyecto. El adaptador también conserva la intención de despacho y
no repite una sesión ambigua sin cierre. Los eventos pending sí pueden avanzar
cuando el receptor reinicia. Un cambio de ruta de projectId bloquea la redirección
de una entrada aceptada.

Para continuar, consultar el evento, inspeccionar el run y comprobar hashes,
artefactos, handoff y revisor; después utilizar el comando del runtime que
corresponda sobre el mismo ID. Cambios de entradas o evidencia invalidan el run.
No generar un eventId nuevo como sustituto automático de reconciliación.

```powershell
& $viltrumPython -m viltrum_sdk.cli run-status `
  'E:\PERFILES AI\tmp\runtime-demo' --run-id 'RUN-ID_REAL'
& $viltrumPython -m viltrum_sdk.cli run-cancel `
  'E:\PERFILES AI\tmp\runtime-demo' --run-id 'RUN-ID_REAL'
```

La cancelación se comprueba durante la ejecución y corta el árbol de procesos CLI
local. `cancellationVerified: false` conserva el límite de que no se acredita
cancelación remota del proveedor. El cierre normal del receptor espera al runtime
activo antes de liberar el lock; una terminación forzada deja estado para
reconciliación. No se emiten mensajes ni callbacks externos.

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

## Arranque frío y validación posterior

Una revalidación CLI posterior agotó el límite anterior de 240 segundos sin stdout/stderr ni nueva escritura nativa. El registro aplicado y la demo real permanecen conservados. El setup usa ahora un límite de 600 segundos, ajustable con VILTRUM_OPENCLAW_SETUP_TIMEOUT_SECONDS (30–900); este ajuste no recibió otra ejecución CLI completa. No repetir despachos de modelo para resolver un timeout de configuración. La disponibilidad de metadata/preflight se comprueba con runtime-doctor; no prueba que todo arranque futuro terminará a tiempo.
