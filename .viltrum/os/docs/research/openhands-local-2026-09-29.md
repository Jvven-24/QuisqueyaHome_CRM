# OpenHands local: preparación y evidencia, 2026-09-29

## Alcance autorizado

Preparar instalación local OpenHands sobre Docker/WSL para Viltrum. La integración inicial sirve análisis de `tmp/runtime-demo`: montaje de solo lectura, autenticación propia y puerto publicado en loopback. Los archivos reproducibles están en `integrations/openhands/`. El adaptador del SDK pertenece a otra tarea; este documento no certifica su implementación ni sustituye una entrega/revisión de Viltrum.

Se eligió **Agent Server 1.50.0**, componente REST del repositorio `OpenHands/software-agent-sdk`, separado de Agent Canvas/OpenHands 1.24.0. La licencia del repositorio SDK es MIT; los componentes incluidos en la imagen conservan sus propias licencias. Docker Desktop tiene términos comerciales propios, distintos de la licencia OpenHands. [Licencia SDK fijada](https://github.com/OpenHands/software-agent-sdk/blob/v1.50.0/LICENSE), [requisitos/términos Docker Windows](https://docs.docker.com/desktop/setup/install/windows-install/).

## Versión fijada y fuentes

La fuente v1.50.0 corresponde al commit `dcf401af7a9a302ef92cb7d092e1df9bb659daa5`. Se consultaron el Dockerfile, script de construcción, modelos REST, autenticación y routers de ese tag. El registry oficial respondió a `docker buildx imagetools inspect ghcr.io/openhands/agent-server:1.50.0-python-slim`, sin ejecutar contenedores para esa consulta.

| Dato | Valor comprobado |
| --- | --- |
| Imagen | `ghcr.io/openhands/agent-server:1.50.0-python-slim` |
| Digest del índice OCI fijado | `sha256:cf8ebed4d3b65ee14ae5742e58db009681845f8eca340521da07d1c862e7b4af` |
| Manifest Linux amd64 | `sha256:74c615b97b4c3f429dcf444d184dcd4568c698d5c22eda796b5ad72090e01847` |
| Manifest Linux arm64 | `sha256:fa8abc2889a66487a9c9a0d27fcdab32e7e565b86126cf1a82e7d4dad1354b32` |
| Plataforma desplegada | `linux/amd64` |
| Usuario de imagen/source | UID/GID 10001, `openhands` |

El script oficial construye tags de versión como `1.50.0-python-slim`; `slim` excluye los proveedores ACP preinstalados. Sigue siendo una imagen de desarrollo con capacidades empaquetadas: el nombre no demuestra ausencia de todas las herramientas ni aislamiento total. [Build oficial](https://github.com/OpenHands/software-agent-sdk/blob/v1.50.0/openhands-agent-server/openhands/agent_server/docker/build.py), [Dockerfile](https://github.com/OpenHands/software-agent-sdk/blob/v1.50.0/openhands-agent-server/openhands/agent_server/docker/Dockerfile).

## Estado del host observado

WSL 2.5.9.0, kernel 6.6.87.2-1 y Ubuntu 24.04.3 LTS ya estaban instalados. Las distribuciones Ubuntu y docker-desktop aparecieron inicialmente detenidas. Docker CLI 28.1.1 estaba instalado, contexto desktop-linux, pero faltaba el named pipe del motor. La versión WSL supera el mínimo general 2.1.5 de Docker; no acredita Enhanced Container Isolation, para el cual la documentación vigente pide WSL 2.6+. [Docker Windows](https://docs.docker.com/desktop/setup/install/windows-install/).

El intento `Start-Process` para iniciar la instalación existente fue rechazado por revisión automática: la respuesta literal fue `rejected: blocked by policy`, sin explicación más específica. Se usó después el CLI oficial `docker desktop start`, que fue aceptado, pero el backend Desktop 4.41.2 reportó:

`initializing Inference manager ... dockerInference ... The file cannot be accessed by the system`.

Se confirmó que `LOCALAPPDATA/Docker/run/dockerInference` era un archivo de cero bytes con atributo ReparsePoint. La recuperación acotada autorizada intentó `Move-Item -LiteralPath` a un backup único dentro del mismo directorio `run/backup`, tras verificar ausencia de procesos Docker/vmmem/wslhost y distribuciones detenidas. Windows devolvió `El sistema no tiene acceso al archivo`; no se movió ni borró el socket. No se hicieron factory reset, borrados, cambios de ACL del sistema, firewall o características de Windows.

La inspección alternativa autorizada abrió Ubuntu WSL. Entonces su CLI respondió con Docker Server 28.1.1. `/usr/bin/docker` resolvió a `/mnt/wsl/docker-desktop/cli-tools/usr/bin/docker`; el daemon informado fue Docker Desktop, conectado por `unix:///var/run/docker.sock`. También volvió a responder el CLI Windows. Por ello **no se instaló un segundo Engine ni paquetes Ubuntu**. No se atribuye causalidad definitiva a este arranque: se registra la recuperación observada. Contenedores ajenos previamente existentes se reanudaron automáticamente con Docker; no se modificaron desde esta tarea. [Instalación oficial Engine Ubuntu, consultada para la alternativa](https://docs.docker.com/engine/install/ubuntu/).

## Configuración preparada

`setup-local.ps1` crea claves aleatorias de 32 bytes fuera del repositorio, en `%LOCALAPPDATA%/Viltrum/openhands/secret.env`; ese archivo nuevo se restringe a su propietario. No imprime valores ni reutiliza OAuth/credenciales de Codex. `SESSION_API_KEY` autentica el API y `OH_SECRET_KEY` mantiene cifrado del estado sensible entre reinicios. Cambiar esa segunda clave puede impedir descifrar datos persistidos. [README del servidor](https://github.com/OpenHands/software-agent-sdk/blob/v1.50.0/openhands-agent-server/openhands/agent_server/README.md).

`client.json` adyacente contiene únicamente configuración/ubicaciones. El estado y esquema se guardan bajo `output/openhands-local`, ignorado por Git. No hay claves de proveedor LLM. El API usa header **`X-Session-API-Key`**, comprobado en el código de `dependencies.py`; el ejemplo Bearer del README no coincide con esta implementación. [Autenticación fuente](https://github.com/OpenHands/software-agent-sdk/blob/v1.50.0/openhands-agent-server/openhands/agent_server/dependencies.py).

El script es reutilizable: el default mantiene el demo aislado, mientras `-ProjectPath` explícito admite un workspace preparado fuera del repositorio. Todos los workspaces, incluido el default, rechazan raíz de unidad/home/SDK completo, junctions/symlinks y ancestros, VCS `.git/.hg/.svn`, `.codex/.claude`, `.env*`, `auth.json`, `token.json/tokens.json`, claves SSH `id_rsa/id_ed25519` y otros nombres/extensiones habituales de credenciales. Esto reduce exposiciones evidentes, pero no descubre cualquier secreto incrustado en archivos. La persona que selecciona el workspace debe acotar/revisar su contenido. No se cambió el montaje activo para comprobar esta portabilidad durante una ejecución Viltrum.

El compose fija puerto `127.0.0.1:8011:8000`, UID/GID10001, rootfs read-only, `cap_drop: ALL`, `no-new-privileges`, máximo 256 PIDs, memoria 4GiB y 2 CPUs. Monta el demo en `/workspace/project:ro`; un volumen Docker separado `/workspace` conserva conversaciones y home interno; `/tmp` usa tmpfs. No hay mounts de host home, secretos del host, Docker socket ni privileged. El secret se entrega por env-file al contenedor, no como mount del directorio privado. Se rechazan junctions/symlinks en el workspace antes de montar. VSCode y preload de herramientas se desactivan; telemetría exporter none, consentimiento denied y DO_NOT_TRACK=1. [Configuración fuente](https://github.com/OpenHands/software-agent-sdk/blob/v1.50.0/openhands-agent-server/openhands/agent_server/config.py).

## Contrato REST comprobado

Los routers de conversación se montan bajo `/api`; salud se publica directamente como `/health`, `/alive`, `/ready`, `/server_info`. Estos endpoints de salud no requieren el header; `/api/conversations/count` sí lo requiere si hay claves configuradas. El script distingue una respuesta readiness de la validación de autenticación y versión. [API montaje](https://github.com/OpenHands/software-agent-sdk/blob/v1.50.0/openhands-agent-server/openhands/agent_server/api.py), [Server details](https://github.com/OpenHands/software-agent-sdk/blob/v1.50.0/openhands-agent-server/openhands/agent_server/server_details_router.py).

El JSON fuente para creación se entrega como `integrations/openhands/conversation.example.json`; contiene placeholders, sin credenciales reales. `POST /api/conversations` recibe `StartConversationRequest`, `workspace.kind=LocalWorkspace`, `working_dir=/workspace/project`, `agent.kind=Agent` y configuración LLM. Asignar UUID antes del POST, persistirlo y elegir `initial_message.run=false`, `autotitle=false`, `confirmation_policy.kind=AlwaysConfirm`; creación no debe disparar llamada LLM de título o ejecución. La respuesta expone `id` y `execution_status`. [Request models](https://github.com/OpenHands/software-agent-sdk/blob/v1.50.0/openhands-sdk/openhands/sdk/conversation/request.py).

`POST /api/conversations/{uuid}/run` no requiere JSON adicional y devuelve `Success`; GET de esa conversación expone estado. `POST .../pause` espera la llamada actual; `POST .../interrupt` cancela la llamada en vuelo y deja la conversación pausada. `GET .../agent_final_response` devuelve `{"response":"texto"}`, potencialmente vacío antes del final. El nombre correcto contiene underscores. Los estados incluyen `waiting_for_confirmation`: el adaptador debe detenerse sin llamar endpoints de aprobación automática. No se traduce `finished` a aprobación SDK, gate o aceptación humana. [Conversation router](https://github.com/OpenHands/software-agent-sdk/blob/v1.50.0/openhands-agent-server/openhands/agent_server/conversation_router.py), [Confirmation policy](https://github.com/OpenHands/software-agent-sdk/blob/v1.50.0/openhands-sdk/openhands/sdk/security/confirmation_policy.py).

## Resultado y límites

La descarga y el despliegue se completaron. El primer arranque salió con código 127 (`libz.so.1: failed to map segment from shared object`): el binario PyInstaller oficial necesita bibliotecas extraídas ejecutables en `/tmp`. Una comprobación `--help` de esa misma imagen, sin red ni mounts del host, funcionó al indicar `exec` en el tmpfs. El compose se corrigió a `/tmp:rw,exec,nosuid,nodev,size=2g` y se recreó únicamente este contenedor.

El contenedor activo es `399c55980581e9cfa23680edd7d94c5279c24cc29602cfc8aa28ccec207d0628`, endpoint `http://127.0.0.1:8011`. `/ready` respondió `ready`; `/server_info` acreditó Agent Server, SDK, tools y workspace **1.50.0** y el commit fijado. `/api/conversations/count` respondió **401 sin clave** y **0 con clave**. Docker inspect acreditó UID/GID10001, rootfs read-only, privileged=false, ALL capabilities descartadas, volumen de estado separado, demo RW=false y bind127.0.0.1:8011. Receipt: `output/openhands-local/receipt.json`; esquema REST verdadero del servicio: `output/openhands-local/openapi.json`. Se comprobaron allí todas las rutas REST listadas, incluida `/api/file/download` con parámetro absoluto `path`. Este endpoint permite paths del filesystem interno: el adaptador debe imponer selección y límites propios, sin inferir confinamiento universal por el nombre workspace.

Estado final del servicio: **service_ready_llm_pending**. No se creó/ejecutó una conversación con proveedor LLM en esta tarea. El arranque del servidor y la salud son una evidencia distinta de la ejecución de tareas. El adaptador directo debe quedar bloqueado mientras falte configuración LLM explícita, aunque el servicio responda. El backend compuesto explícito `openhands-codex` aporta lectura API autenticada de archivos seleccionados y comparación de hashes con el host; Codex ejecuta con su autenticación nativa. El supervisor principal informó una ejecución Codex con revisión aprobada: esa evidencia pertenece al run/artefactos de ejecución y no constituye una llamada LLM OpenHands. Esta tarea no ejecutó modelos. La composición debe identificarse como tal, sin atribuir a un LLM OpenHands lo que produjo Codex.

El aislamiento de filesystem/read-only y ausencia de mounts peligrosos acotan el alcance local; Docker mantiene salida de red y no se afirma aislamiento universal. Las futuras llamadas LLM requieren proveedor autorizado, datos mínimos y coste/token reportado realmente; no se inventa coste ni se infiere que una suscripción ChatGPT sea una clave API. Logs/conversaciones pueden conservar contenido futuro: se mantienen locales con rotación y sin exportación automática. El plan de salida es verificar health/auth/version/mounts, conectar el adaptador con credenciales explícitas y luego acreditar producción y revisión independientes en una nueva ejecución. Para detener sin borrar estado, usar `docker compose ... stop`; nunca `down -v` o prune como parte de este montaje.
