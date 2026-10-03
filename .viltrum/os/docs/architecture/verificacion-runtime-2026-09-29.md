# Evidencia operativa del runtime 0.3

Fecha: 2026-09-29. Implementación y revisión por sesiones delegadas distintas.
Este expediente registra lo observado; completar una tarea no aprueba un gate.

## Instalación

- SDK `viltrum-agentic-os` 0.3 instalado editable con extras runtime en Python global
  existente y en `.venv-langgraph` (Python 3.14.2).
- LangGraph 1.2.12, checkpoint 4.2.0 y SQLite saver 3.1.1. El grafo real ejecutó
  interrupción/reanudación con persistencia SQLite.
- `setup-global` actualizó las copias administradas de `orquestar` para Codex/Claude.
- Dos skills nuevas válidas; bundle SwarmClaw: 23 agentes deshabilitados y 26 skills.
- Pip señaló incompatibilidades ya presentes de `litellm` con click/python-dotenv;
  esta instalación no cambió esas dos versiones ni se corrigieron paquetes ajenos.
- LangChain emite aviso sobre Pydantic V1/Python 3.14 al importar. La ejecución
  LangGraph/SQLite observada funciona; no acredita compatibilidad de cualquier flujo.

## Ejecución real por host

Proyecto técnico local: `tmp/runtime-demo`, sin cliente ni aceptación comercial.

| Registro | Resultado observado |
|---|---|
| Run | `RUN-2803f9e11abd44d4ad655319b4218347` |
| Tarea | `TASK-D21` |
| Productor real | `/root/investigar_motores` |
| Revisor real D03 | `/root/skills_agencia`, otra sesión |
| Handoff | `HND-001` |
| Flujo | prepared → waiting_submission → delivered → waiting_review → approved → finished |
| Paquete | host-research.md + docs/motores.md, ejecucion.md, skills.md |
| Revisión | host-review.md, approved para síntesis técnica acotada |
| Integridad posterior | `artifactCurrent: true`; revisión/hash vigentes |

Artefactos completos en `.viltrum/runtime/runs/<run>/artifacts/` del caso. Las fuentes
son investigación pública de esta conversación, no transcripciones de un cliente.
No se aprobaron G0–G8/C1. No se atribuye pericia/eval_score a los 23 perfiles.

## Revisión independiente de código y distribución

Informe: `docs/research/revision-cli-panel-2026-09-29.md`. Evidencia de verificaciones
locales aisladas en `tmp/review-runtime` y `tmp/review-wheel`.

- Host por CLI: interrupción, entrega, rechazo del mismo actor, revisión desde otro
  ID y finalización; cambio en summary invalida; cancelar/reanudar conserva cancelación.
- Junction de carpeta RUN y symlink hoja run.json: reproducción inicial de escape,
  fix de contención, misma reproducción rechazada con exit2. Sin borrado de archivos.
- GET JSON del panel/CSP, Host no permitido403, traversal rechazado; lectura no
  modificó run.json. IDs inválidos todavía devuelven500 en este control local.
- Wheel provisional 0.3: 306 miembros; runtime/adapters/template/skills presentes,
  extra separado. Instalación temporal sin dependencias e importación con `py -S`;
  help/install/status/runs funcionan sin LangGraph. Build final cambia hash/contenido.
- Ledger de handoff/predespacho y locks revisados. Recuperación de crash en ventana
  exacta no ensayada destructivamente; no se afirma esa prueba.
- Tras revisión se añadieron guardas de cancelación antes de registrar entrega/review,
  catch específico de lock y regla de suficiencia del revisor con sourceEvidenceCount.
- Repetición independiente posterior: cancelar con lock ocupado publica cancelling;
  submit/review bloquean sin cambiar HND. Cancel terminal repetido conserva hashes de
  run/eventos/marker; resume conserva cancelled. RCL-05 cerrado.

## Codex: incidencias corregidas y límites

Codex CLI0.159 autenticado con ChatGPT. Cada llamada exige sandbox read-only, approvals
never, MCP/apps/plugins/conectores externos desactivados. Las herramientas nativas de
lectura requieren code_mode/code_mode_host activos. No se cambió el modelo configurado.

| Run / observación | Resultado / corrección |
|---|---|
| `RUN-3b2bc125d2184253a64698e74b923aac` | invalid transport: keys MCP con comillas interpretadas literalmente; corregido a keys bare seguras, las restantes bloquean |
| Preflight posterior | 22 MCP deshabilitados; sin llamada al modelo |
| `RUN-5839697cd30b42a190adedfb3539b60f` | Modelo completó; validador exigía evidence no vacío mientras schema permitía []; parse/contrato corregidos |
| Diagnóstico `RUN-diagnostic-2f1f8d162be34d79b0400e57a9a6004a` | Entrega real del modelo con declaración honesta de no acceso: code-mode estaba deshabilitado. No acredita lectura; corregido flag |
| `RUN-126a923c7a46467e85c0a0a4759dbeaa` | Productor entregó, revisión iniciada; cancelación real detuvo continuación y preservó artefactos. Sin aprobación de paquete |
| `RUN-f8e229695f7b4609b1b99f13bd6e27aa` | Límite180s alcanzado; proceso detenido, ejecución blocked. No se repitió el mismo despacho |
| `RUN-1ebce7071d324f0dae92f1a0f3b27252` | Finalizado: D21 produjo análisis de README.md/docs/motores.md, sourceEvidenceCount2; D03 aprobó desde otro proceso; HND-003, hashes vigentes |

Timeout configurable `VILTRUM_CODEX_TIMEOUT_SECONDS=30..900`, default180. Un array
evidence vacío produce artefacto del supervisor con `sourceEvidenceCount=0`; la salida
de un modelo no acredita que investigó archivos. El revisor debe valorar suficiencia
y rechazar afirmaciones de lectura sin respaldo. Nuevos intentos llevan nuevo ID.
El sandbox solicitado no constituye una evaluación completa de prohibición de lectura
de secretos fuera del proyecto. Los reportes/metadatos redactan secretos/payloads.
Los procesos nativos finalizados conservan `sandboxRequested=read-only` y
`sandboxVerified=false`: hubo ejecución correcta con esa opción, sin prueba negativa
independiente que acredite todo el aislamiento del CLI. Docker del workspace se
verifica separadamente; no convierte el proceso Codex del host en proceso Docker.

## Panel y servicios

Panel local en `http://127.0.0.1:8765/`, sirve el caso técnico autorizado. Se verificó
API200, 23 perfiles, eventos/runs y cero gates aprobados. El navegador se actualizó y
mostró «Etapas conectadas», «Ejecuciones de agentes» y los bloqueos reales. El proceso
anterior del panel fue identificado y sustituido por su nuevo servidor; no se tocaron
proyectos de clientes.

OpenHands: usuario autorizó instalación local Docker/WSL. Investigación/despliegue y
estado definitivo se registran en `docs/research/openhands-local-2026-09-29.md` y en
`integrations/openhands/`. No dar por conectado por presencia de Docker o variables.
Servicio real: Agent Server/SDK/tools/workspace1.50.0, loopback8011, Docker28.1.1;
401 sin clave y GET autorizado verificados. Imagen fijada por digest, uid10001,
rootfs/proyecto read-only, capsdropALL, sin privilegios ni docker.sock. Docker Desktop
se reactivó al abrir Ubuntu WSL y reanudó contenedores Supabase existentes. Ningún
reset/reinstalación de WSL ni segundo engine Ubuntu. Receipt local ignorado:
`output/openhands-local/receipt.json`; nunca contiene valores de las claves.

El backend propio `openhands` permanece pendiente de proveedor LLM. El híbrido
`openhands-codex` usa GET de contexto y la autenticación existente del CLI Codex;
no extrae OAuth ni inicia conversaciones OpenHands. La primera ejecución híbrida
`RUN-bc9792c155d64e80a91be693eff9a2b1` bloqueó antes del LLM por exceso de rutas de
inventario (>32); se corrige la selección explícita de fuentes, sin repetir ese ID.
Revisor independiente descargó por GET los dos archivos reales (22815bytes), comprobó
hashes host y verificó rechazo de traversal, `.env`, 33rutas y bytes alterados mediante
inyección en memoria. Evidencia `tmp/review-runtime/openhands-get-observations.json`.
Sin modificación del servidor ni nueva conversación/LLM por ese revisor.

## Ejecución híbrida finalizada

`RUN-6045c280de784f119411b4a1d6938cb2`, backend `openhands-codex`, completó
prepared → running → delivered → reviewing → approved → finished. Handoff `HND-004`.
Productor D21 `codex:producer:bea04f59f31e43f6b344dbe1899ac779`; revisor D03
`codex:reviewer:531979c7a4af4d8f8783e9b8504abf6c`, proceso y sesión diferentes.

- Productor recibió dos fuentes por GET, 22815bytes: README.md y docs/motores.md.
  `sourceEvidenceCount=2`, `supervisorSourceCount=2`, SHA256 coincidentes con el host.
- Revisor recibió cinco archivos por GET, 29970bytes, incluyendo entrega original,
  paquete con anexo supervisor y manifiesto. Sus referencias del modelo son6; entradas
  supervisor5. El runtime conserva la revisión/hash independiente.
- Ambos procesos exit0/turn.completed, timeout420 sin alcanzar el plazo; eventos
  command_execution4/8 e item.error3 en cada uno. No se afirma ausencia de errores
  internos. No se conservan contenidos de comandos en la telemetría agregada.
- Uso reportado: productor103954 input/64384cached/1147output tokens; revisor152045
  input/109312cached/1982output. No se calculó costo monetario. Contexto acotado no
  garantiza costo bajo: el CLI carga también instrucciones y contexto propios.
- `artifactCurrent=true`, revisión aprobada exclusivamente para síntesis documental
  de las fuentes autorizadas. La comparación declara límites y datos ausentes para
  Codex en ese corpus; no es aprobación de proveedor/arquitectura o ejecución autónoma
  del LLM OpenHands. Cero G0–G8/C1 aprobados en la demostración.

Manifiestos/dispatch/execution/reportes en `.viltrum/runtime/runs/<run>/artifacts/`.
El Docker/API contexto se verifica separadamente del sandboxCLI solicitado. El backend
compuesto es funcional para este análisis real; evaluaciones profesionales y ejecución
de construcción requieren evidencia propia.

## Pendientes concretos

Evaluar los 23 perfiles con sus casos y conectar tools/CI
por proyecto. Construcción/release siguen requiriendo alcance/gates/permiso real.
