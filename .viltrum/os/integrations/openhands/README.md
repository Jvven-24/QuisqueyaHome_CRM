# OpenHands Agent Server local (1.50.0)

Preparación para el backend de análisis Viltrum. Monta únicamente `tmp/runtime-demo` en solo lectura. Imagen oficial `python-slim`, versión y digest inmutables en `compose.yaml`; no monta Docker socket, home del host ni credenciales de otros agentes. No requiere instalar paquetes Python globales.

## Preparar y levantar

Desde PowerShell en `E:\PERFILES AI`:

```powershell
./integrations/openhands/setup-local.ps1 -PrepareOnly
./integrations/openhands/setup-local.ps1
```

El primer comando prepara claves aleatorias y configuración; el segundo descarga la imagen fijada, crea el contenedor y comprueba salud, versión y autenticación. Docker Engine debe responder. En esta máquina la integración existente se reactivó al abrir Ubuntu WSL:

```powershell
wsl -d Ubuntu -- docker version --format '{{.Server.Version}}'
docker version --format '{{.Server.Version}}'
```

El script no instala WSL, cambia políticas de Windows, resetea Docker ni borra archivos. Si falla el engine, registra un bloqueo explícito. No ejecutar factory reset para completar este montaje.

Para reutilizarlo en otro proyecto, indicar explícitamente un workspace preparado y sin secretos. Puede estar fuera del SDK/repositorio:

```powershell
./integrations/openhands/setup-local.ps1 -ProjectPath 'D:/Workspaces/proyecto-analisis' -PrepareOnly
./integrations/openhands/setup-local.ps1 -ProjectPath 'D:/Workspaces/proyecto-analisis'
```

Todos los workspaces, incluido el demo predeterminado, se comprueban: se rechazan drive root, home del usuario, raíz completa del SDK, junctions/symlinks del workspace o ancestros, `.git/.hg/.svn`, `.env*`, directorios de credenciales (incluidos `.codex` y `.claude`), `auth.json`, `token.json/tokens.json`, `id_rsa/id_ed25519` y nombres/extensiones habituales de claves. Preparar una copia seleccionada sin VCS/credenciales antes de montar. Esta comprobación de nombres no detecta secretos incrustados en cualquier texto: quien elige el workspace debe revisar su contenido. La frontera del mount es el directorio exacto proporcionado, en solo lectura. Volver a ejecutar setup con otro proyecto reemplaza el montaje de este único servicio: hacerlo cuando no haya tareas activas.

## Archivos y conexión

- Endpoint: `http://127.0.0.1:8011`.
- Autenticación REST: header `X-Session-API-Key`.
- Claves fuera del repositorio: `%LOCALAPPDATA%\Viltrum\openhands\secret.env` (`SESSION_API_KEY`, `OH_SECRET_KEY`). El archivo nuevo restringe sus permisos a su propietario; no imprimirlo ni copiarlo a conversaciones.
- Configuración sin valores secretos: `%LOCALAPPDATA%\Viltrum\openhands\client.json`.
- Evidencia local ignorada por Git: `output/openhands-local/receipt.json`, `compose.env`, `openapi.json`.
- Contenedor: `viltrum-openhands-agent-server`; estado: volumen `viltrum-openhands-agent-state-v150`.

El adaptador Viltrum lee `client.json` y `secret.env` directamente, sin ejecutar contenido de estos archivos. La opción `VILTRUM_OPENHANDS_CONFIG` permite señalar otra configuración. El receipt acredita únicamente datos observados; `serviceReady` no implica que exista un LLM listo.

El backend compuesto explícito `openhands-codex` usa GET autenticado de archivos seleccionados y comprueba sus hashes frente al host; no crea conversaciones LLM en OpenHands. Codex ejecuta con su autenticación nativa, bajo su sandbox de solo lectura y con identidad de productor/revisor diferenciada. Un sandbox read-only limita escrituras; no constituye una frontera universal de lectura de secretos. El proveedor del resultado debe quedar identificado como esa composición.

## Credenciales LLM y ejecución

No se ha añadido un proveedor/modelo ni se ha extraído OAuth de Codex. El servidor puede exponer salud y REST sin una clave LLM. Para ejecutar tareas hace falta un proveedor/modelo compatible, credenciales explícitas propias si ese proveedor las requiere, y el adaptador verifica esa configuración. Puede añadirse al archivo privado `secret.env`: `VILTRUM_OPENHANDS_LLM_MODEL`, `VILTRUM_OPENHANDS_LLM_API_KEY` y, si corresponde, `VILTRUM_OPENHANDS_LLM_BASE_URL`. No se proporciona ninguna clave de ejemplo real.

`conversation.example.json` es una plantilla del contrato fuente 1.50.0, con placeholders y sin herramientas; no ha sido enviada a un modelo. El adaptador acota las herramientas y conserva `AlwaysConfirm`: si aparece `waiting_for_confirmation`, debe bloquear esperando intervención; nunca aprobar por sí mismo. Las rutas comprobadas en el código oficial son:

| Operación | Método y ruta | Cuerpo / respuesta |
| --- | --- | --- |
| Crear | `POST /api/conversations` | `StartConversationRequest`; devuelve `ConversationInfo.id` y `execution_status` |
| Consultar | `GET /api/conversations/{uuid}` | Sin cuerpo; `execution_status` (`idle/running/paused/waiting_for_confirmation/finished/error/stuck/deleting`) |
| Ejecutar | `POST /api/conversations/{uuid}/run` | Sin cuerpo; `Success` |
| Pausa | `POST /api/conversations/{uuid}/pause` | Sin cuerpo; espera la llamada LLM actual |
| Interrumpir | `POST /api/conversations/{uuid}/interrupt` | Sin cuerpo; cancela llamada en vuelo y deja pausado |
| Salida | `GET /api/conversations/{uuid}/agent_final_response` | `{"response": "texto final"}`; vacío antes de salida |

Asignar UUID y persistirlo antes del POST de creación, `initial_message.run=false`, `autotitle=false`; luego registrar creación y lanzar `/run`. El API devuelve 409 si ya corre. No confundir creación de conversación con producción de evidencia ni con aprobación de Viltrum. El esquema descargado del servidor desplegado está en el archivo de evidencia mencionado.

## Operación reproducible

```powershell
$ohComposeEnv = 'E:/PERFILES AI/output/openhands-local/compose.env'
$ohCompose = 'E:/PERFILES AI/integrations/openhands/compose.yaml'
docker compose --env-file $ohComposeEnv -f $ohCompose ps
docker compose --env-file $ohComposeEnv -f $ohCompose stop
docker compose --env-file $ohComposeEnv -f $ohCompose start
```

`stop` preserva el contenedor y el volumen. No usar `down -v`, `prune` ni inspecciones que impriman `Config.Env`. Los logs de Agent Server pueden contener contenido de futuras tareas: mantenerlos locales, con rotación y sin exportación automática. La red Docker permite salida; el aislamiento del filesystem no acredita aislamiento total de red ni seguridad universal de herramientas.

## Fuentes

- [Docker Sandbox oficial](https://docs.openhands.dev/sdk/guides/agent-server/docker-sandbox).
- [API montaje de routers v1.50.0](https://github.com/OpenHands/software-agent-sdk/blob/v1.50.0/openhands-agent-server/openhands/agent_server/api.py).
- [Autenticación v1.50.0](https://github.com/OpenHands/software-agent-sdk/blob/v1.50.0/openhands-agent-server/openhands/agent_server/dependencies.py).
- [Conversation router v1.50.0](https://github.com/OpenHands/software-agent-sdk/blob/v1.50.0/openhands-agent-server/openhands/agent_server/conversation_router.py).
- [Request models v1.50.0](https://github.com/OpenHands/software-agent-sdk/blob/v1.50.0/openhands-sdk/openhands/sdk/conversation/request.py).
- [Dockerfile oficial v1.50.0](https://github.com/OpenHands/software-agent-sdk/blob/v1.50.0/openhands-agent-server/openhands/agent_server/docker/Dockerfile).
