# Ejecución controlada: Viltrum, LangGraph y agentes locales

Fecha de consulta: 2026-09-29. Alcance: investigación D19/D12 y comprobaciones locales de versiones, ayuda, autenticación declarada y módulos. Este documento propone un puerto ejecutor; no acredita una integración implementada ni un sandbox probado. No se instalaron paquetes, clonaron repositorios, iniciaron servicios ni ejecutaron agentes con modelos.

## Decisión propuesta

Viltrum conserva mandato, perfiles, autorizaciones, artefactos y gates. LangGraph coordina estado y transiciones. Un puerto `ControlledExecutor` lanza el proceso o conversación autorizado mediante un adaptador reemplazable y devuelve evidencia. La revisión usa otro actor/sesión con acceso al resultado congelado. OpenHands SDK/Agent Server es candidato para ejecución aislada; Agent Canvas es una aplicación opcional para operar conversaciones. CLI Codex es candidato inmediato porque está instalado y declara autenticación; su ejecución y sandbox siguen pendientes de validación.

El SDK local `viltrum-agentic-os` declara versión 0.2.0 y dependencias vacías en `pyproject.toml`. `core/orchestration.md` establece que el CLI prepara contexto y registros, mientras el host ejecuta herramientas reales. `doctor()` en `viltrum_sdk/orchestration.py` inventaría binarios, skills y declaraciones: no verifica conexión, permisos, identidad ni pericia. Mantener esa distinción también en LangGraph y en el panel. El bundle SwarmClaw por sí solo tampoco prueba conectividad.

## Evidencia local observada

Comprobaciones realizadas desde `E:\PERFILES AI` en PowerShell; ningún prompt de agente fue enviado.

| Superficie | Comando/comprobación ejecutada | Resultado |
| --- | --- | --- |
| Codex | `codex --version` | `codex-cli 0.159.0` |
| Codex | `codex exec --help` | Reconoce stdin, `--json`, `-C`, `--sandbox`, `--output-schema`, `-o`, `--ephemeral`, `resume`, `fork`, `review` |
| Codex | `codex login status` | `Logged in using ChatGPT`; no tokens mostrados |
| Claude Code | `claude --version`, `claude --help` | `2.1.241`; reconoce `-p`, JSON/stream-json, `--permission-mode`, `--tools`, `--allowedTools`, `--max-budget-usd`, `--session-id` |
| Claude Code | `claude auth status` | `loggedIn: false`, `authMethod: none`, `apiProvider: firstParty`; salida de error 1 |
| Docker | `docker version` | Cliente `28.1.1`, contexto `desktop-linux`; falla conexión a `dockerDesktopLinuxEngine` por pipe ausente |
| Docker | `Get-Service -Name com.docker.service` | `Stopped`; no se inició |
| Python virtual | `importlib.util.find_spec` en `.venv-langgraph\Scripts\python.exe` | `langgraph`, `langchain_core` presentes; `openhands`, `sweagent`, `minisweagent` ausentes |
| Python virtual | `importlib.metadata.version` | LangGraph `1.2.12`, LangChain Core `1.6.6` |
| Viltrum | `.venv-langgraph\Scripts\python.exe -m viltrum_sdk.cli doctor .` | Ejecutable como módulo; `viltrum` no aparece en PATH; capacidades declaradas vacías |
| Otros ejecutores | `Get-Command openhands,sweagent,mini,uv` | No encontrados en PATH en esta inspección |

Un módulo ausente en este entorno no demuestra ausencia en todos los Python/WSL del equipo. Una sesión CLI declarada activa no comprueba cuota, modelo disponible, acceso remoto ni autorización para una llamada nueva. No se leyó contenido de archivos de credenciales.

## Candidatos y fuentes oficiales

### OpenHands SDK y aplicación

`OpenHands/software-agent-sdk` mantiene Python SDK, herramientas, conversaciones, workspaces, Agent Server y API REST/WebSocket; permite workspace local o ejecución efímera. Su TypeScript client está documentado en ese repositorio. [Repositorio oficial SDK](https://github.com/OpenHands/software-agent-sdk).

El patrón de control es `Agent` + `Conversation`; el cliente envía mensajes y ejecuta la conversación. Para un servidor aislado, `DockerWorkspace` o `APIRemoteWorkspace` cambia la frontera de ejecución y permite consumir eventos del servidor. El adaptador debe conservar el ID de conversación junto al `runId` Viltrum y fijar versión de SDK/imagen. Los ejemplos con `latest` son demostraciones, no la selección de producción. [Agent Server: overview](https://docs.openhands.dev/sdk/guides/agent-server/overview).

`OpenHands/OpenHands` hoy se presenta como **Agent Canvas**, un centro de control que admite OpenHands y agentes ACP como Claude Code/Codex; `OpenHands/automation` posee programación, webhooks e historial. El launcher sin sandbox ejecuta Agent Server en el host con acceso al filesystem. El modo Docker puede montar un árbol con múltiples proyectos: ese montaje determina la superficie visible. Conversaciones que comparten workspace comparten archivos. [README de Agent Canvas](https://github.com/OpenHands/OpenHands).

En Windows, la opción de contenedor por conversación exige WSL2, integración de Docker Desktop y rutas de workspace Linux; ese runtime no admite host Windows nativo porque utiliza IDs POSIX. El motor local está indisponible en esta inspección. [Instrucciones oficiales Windows](https://github.com/OpenHands/OpenHands/blob/main/README.windows.md).

### SWE-agent y mini-SWE-agent

La documentación oficial SWE-agent declara mantenimiento únicamente y recomienda mini-SWE-agent como sucesor. Conserva `sweagent run`, `run-batch`, `run-replay` e inspección de trayectorias; replay vuelve a ejecutar acciones y debe tratarse como ejecución con efectos. [CLI oficial SWE-agent](https://swe-agent.com/latest/usage/cli/).

mini-SWE-agent v2 mantiene una arquitectura pequeña basada en acciones de shell; es alternativa para tareas de código acotadas y evaluación. Sus métricas públicas no equivalen a validación del proyecto Viltrum. [Repositorio oficial mini](https://github.com/SWE-agent/mini-swe-agent).

El CLI `mini` usa entorno `local` por defecto; allí `subprocess.run` ejecuta en el host sin aislamiento. Tiene backends Docker, Singularity, SWE-ReX y otros; bubblewrap es Linux y experimental. Seleccionar explícitamente el backend, nunca inferir que el nombre del agente significa sandbox. [Entornos oficiales](https://mini-swe-agent.com/latest/advanced/environments/). El proyecto espera Bash o un runtime que lo proporcione; las acciones son procesos independientes y no conservan `cd`/variables de una acción anterior. [FAQ oficial](https://mini-swe-agent.com/latest/faq/). Ambos módulos están ausentes del virtualenv revisado: contrato de ejecución local no validado.

### Codex y Claude Code

Codex admite `exec` no interactivo, stdin, JSONL de eventos, respuesta final en archivo y JSON Schema. Configurar explícitamente permisos mínimos y capturar stdout/stderr por separado. `resume` identifica conversación del proveedor; no aporta idempotencia de efectos. La ayuda local confirma esas opciones; no se ejecutaron solicitudes. [Modo no interactivo oficial](https://learn.chatgpt.com/docs/non-interactive-mode).

Windows tiene sandbox nativo `elevated` con usuarios de menor privilegio, ACL y firewall, y `unelevated` con token restringido y controles de red más débiles. Disponibilidad de estas implementaciones no prueba configuración local efectiva; requerir evidencia antes de declarar `sandbox_verified`. [Sandbox Windows oficial](https://learn.chatgpt.com/docs/windows/windows-sandbox).

Claude Code admite `-p`, stdin y JSON/stream-json; el consumidor debe drenar la salida para evitar bloqueo. `--bare` omite personalizaciones y usa autenticación API explícita; no conserva OAuth de usuario. No elegirlo automáticamente si el contrato espera login de suscripción. La versión instalada debe prevalecer al seleccionar flags: la documentación puede incluir opciones posteriores. [Ejecución programática oficial](https://code.claude.com/docs/en/headless).

Su sandbox protege subprocesses Bash en macOS/Linux/WSL2; no está disponible en Windows nativo y no define la misma frontera para todos los demás tools. `allowedTools`/permisos complementan el control, pero no crean aislamiento del sistema operativo. [Sandbox Claude oficial](https://code.claude.com/docs/en/sandboxing). Esta instalación no declara autenticación activa.

## Puerto `ControlledExecutor` propuesto

Diseño a implementar y revisar por D03/D19/D12; los nombres de campos son un contrato propio, no una API atribuida a un proveedor.

### Entrada, transporte y política

| Campo | Invariante |
| --- | --- |
| `schemaVersion`, `runId`, `attemptId`, `idempotencyKey` | `runId` estable para trabajo lógico; intento único por lanzamiento; idempotencia persistida y única por proyecto/operación |
| `projectId`, `department`, `producerActor`, `reviewerActor` | Identidad/sesión acreditada por host; productor y revisor distintos |
| `goal`, `contextArtifacts`, `inputHashes`, `baseRevision` | Contexto mínimo, procedencia y snapshot exactos; no cambiar silenciosamente la base al reanudar |
| `workspaceRoot`, `allowedWritePaths`, `artifactRoot` | Rutas absolutas canónicas, dentro del espacio autorizado; validar symlinks/junctions/reparse points y destinos tras resolución |
| `executorProfile`, `isolationMode`, `networkPolicy` | Perfil administrado; proveedor/versión e imagen fijados; comportamiento ante aislamiento indisponible explícito y cerrado |
| `timeoutSeconds`, `idleTimeoutSeconds`, `cancelGraceSeconds` | Configuración de mandato; reloj monotónico; ausencia de salida no demuestra ausencia de trabajo |
| `maxOutputBytes`, `maxArtifactBytes`, `maxAttempts`, `costBudget` | Límites configurables por perfil/riesgo; costo desconocido no se registra como cero |
| `authorizationRef`, `credentialRef`, `toolPolicy` | Autorización concreta; referencia a secretos externa; tools/MCP/hooks permitidos expresamente |

El adaptador selecciona un ejecutable por ruta absoluta verificada, construye un vector `argv` desde opciones permitidas y transmite prompt/contexto UTF-8 por stdin. Nunca ejecutar una línea de shell concatenada con objetivo, paths o texto generado; nunca interpretar stdout como órdenes. `shell=False` no convierte en seguro un programa que ejecuta comandos del modelo: ese proceso requiere su frontera propia.

En Windows, preferir binario real (`.exe`) o `node.exe` y entrypoint conocido. Los wrappers `.cmd`/`.ps1` requieren un adaptador explícito con argumentos probados, sin interpolación del prompt. No registrar prompts/credenciales en argv. Usar entorno mínimo revisado; no heredar todas las variables, tokens cloud, homes de otros agentes o configuraciones MCP automáticamente. Credenciales del proveedor pueden ser visibles a código no confiable que comparte proceso/entorno: usar proxy/servicio externo cuando esa separación sea requisito.

Forma conceptual para Codex, confirmada solo por ayuda/documentación:

```json
{
  "executable": "<ruta absoluta de codex.exe>",
  "argv": ["exec", "-", "--json", "--sandbox", "workspace-write", "-C", "<workspace aislado>", "--output-schema", "<schema>", "-o", "<resultado>"],
  "stdin": "<mandato y contexto autorizado>"
}
```

La política de approvals del perfil también debe ser explícita, sin permitir escalamiento automático fuera del alcance. Para Claude, la forma candidata es `-p --input-format text --output-format stream-json --verbose`, con política de tools y permisos predefinida; aún falta autenticación y ejecución validada. No usar bypass de permisos/sandbox en el host compartido. Los IDs nativos son referencias adicionales, no sustituyen `runId`.

### Salida y artefactos

El supervisor escribe `.viltrum/runs/<runId>/`: `request.redacted.json`, `events.jsonl`, `stderr.redacted.log`, `result.json`, manifiesto de artefactos y diff/patch. La ubicación es propuesta; no existe por redactar este documento.

Cada evento normalizado contiene `runId`, `attemptId`, `seq`, `timestamp`, `type`, `providerSessionId` y payload permitido. Conservar versión del parser. Limitar línea y volumen; JSON malformado o salida truncada provoca `protocol_error`/marcador de truncamiento, no éxito. Drenar pipes concurrentemente para evitar deadlock. Redactar secretos antes de persistir/exportar y restringir permisos de logs; el redactor reduce exposición, no garantiza que toda fuga sea detectable.

`result.json` informa `status`, `exitCode`, inicio/fin, `isolationEvidence`, uso/costo observado, hashes de inputs y outputs, archivos cambiados, errores y efectos externos observados/desconocidos. Cada artefacto tiene path relativo, hash, tamaño, MIME y procedencia. El supervisor calcula hashes y enumera diferencias; declaraciones del agente son datos no confiables. Exit code 0 no demuestra criterios cumplidos ni aprobación. Nunca aplicar automáticamente contenido recibido a shell, producción o secretos.

### Estados, cancelación y reanudación

Transiciones: `queued → preflight → running → produced → awaiting_review → accepted|rejected`. Salidas técnicas: `blocked`, `failed`, `protocol_error`, `timed_out`, `cancel_requested → cancelled|cancel_failed`, `unknown_effects`. `accepted` requiere informe independiente vigente; `produced` solo acredita resultado recolectado.

Preflight comprueba perfil/versiones, autorización, auth declarada, frontera operativa, hashes, locks y límites. No inicia automáticamente servicios o instala dependencias. Adquirir lock durable sobre operación y workspace antes de lanzar; escritura de request/estado atómica. En Windows el supervisor necesita controlar el árbol completo, idealmente Job Object; `terminate()` del padre no garantiza terminar nietos. En Linux usar grupo de procesos y frontera de contenedor/VM. Contenedores/remotos requieren cancelación por ID del runtime; matar cliente no implica detener servidor.

Timeout/cancel solicita parada, espera gracia configurada, fuerza terminación del árbol/runtime y confirma estado. Si no puede confirmar, marcar `cancel_failed` y bloquear relanzamiento; recolectar evidencia parcial. Conservar recursos identificados para reconciliar. No borrar workspace mientras el agente siga vivo. Efectos externos pueden haber ocurrido antes de un timeout: reconciliar por ID e idempotencia del proveedor antes de reintentar.

Idempotencia del supervisor evita doble despacho; no vuelve idempotentes comandos de shell, modelos ni APIs externas. Misma clave con payload distinto se rechaza. Tras crash consultar proceso/runtime y journal; nunca hacer replay ciego. Cada reintento conserva clave lógica y crea `attemptId`; presupuesto/backoff/DLQ definidos en configuración. LangGraph persiste la referencia al run: reanudar un nodo consulta esa referencia antes de lanzar de nuevo. Detener o reanudar un grafo tampoco cancela por sí solo el agente externo.

## Frontera de seguridad y revisión

| Mecanismo | Garantía que puede afirmarse |
| --- | --- |
| Prompt, `cwd`, lista de paths, worktree o copia | Alcance organizativo y separación de cambios; el proceso conserva permisos del usuario salvo control del SO |
| Política CLI/tools/hooks | Restricción mediada por aplicación, dependiente de configuración; documentar superficie y escapes |
| Sandbox nativo comprobado | ACL/token/usuarios/red según implementación; exigir evidencia negativa de lectura/escritura/red fuera de política |
| Contenedor endurecido por run | Filesystem/recursos/red según configuración; montar solo workspace del run, usuario sin privilegios, sin Docker socket/host home/credenciales/`--privileged` |
| VM o servicio remoto dedicado | Frontera adicional del host, con identidad/red/storage mínimos y teardown confirmado |

Docker socket o daemon accesible permite crear contenedores con otros montajes y puede romper el aislamiento. WSL2 por sí solo no demuestra aislamiento: interoperabilidad Windows y montajes `/mnt/*` deben revisarse. Las evidencias de aislamiento deben ejercitar límites con fixtures sin secretos; quedaron pendientes, pues la inspección autorizada solo cubrió disponibilidad.

Inventario inicial D12: entrada de mandato (inyección y ampliación de alcance), repositorio/contexto (prompt injection), configuración/hooks/MCP (ejecución lateral), credenciales (exfiltración), pipes/eventos (spoofing y agotamiento), montajes/runtime (elevación), journal/checkpoints (replay y manipulación), artefactos/revisión (rutas fuera de raíz y autoaprobación). Controles: validación propia, mínimos privilegios, política de red, límites, hashing, locks, auditoría y revisor con snapshot. Este inventario no reemplaza modelo STRIDE completo ni escaneo.

El registro canónico asigna D19 → D12 y D12 → humano. El productor entrega diff/artefactos y evidencia; D12 revisa con sesión independiente y permisos de lectura. La revisión registra actor/sessionId, `runId`, base, hashes, hallazgos e informe; no debe recibir autoridad de aprobación del productor. Otro nombre de perfil en la misma sesión no satisface independencia. Los registros `handoff/review` Viltrum son declaraciones trazables; el host acredita identidad. G6 y acciones de producción conservan aprobación humana requerida por `core/orchestration.md`.

## Lo pendiente antes de habilitar ejecución

1. D03 aprueba puerto y política por riesgo; D21 cierra evaluación de candidatos y plan de salida.
2. D19 implementa adaptadores con preflight, supervisión, persistencia y parser por versión.
3. D16 habilita un runtime autorizado; OpenHands/mini requieren instalación/entorno y Docker o frontera equivalente. El estado local actual no permite prometer ejecución aislada.
4. D12 acredita límites reales, secretos, hooks/MCP y árbol de cancelación; revisión humana de seguridad independiente.
5. D14 verifica escenarios útiles: proceso que crea nietos, JSON inválido, pipes llenos, timeout, doble dispatch, crash tras mutación, cancelación remota y artefacto fuera de raíz. Son criterios propuestos; no se ejecutaron pruebas en esta investigación.

Estado de entrega: investigación y contrato propuesto completos; implementación, conectividad, ejecución de modelos, verificación de sandbox y gates pendientes. La fecha y versiones son una fotografía local, no una garantía permanente.
