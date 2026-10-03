---
title: Revisión independiente de CLI, panel y runtime
fecha: 2026-09-29
revisor: /root/skills_agencia
alcance: SDK-0.3-CLI-panel-pyproject-runtime-controlled
estado: revision-estatica-y-verificacion-local; proveedores-y-UI-pendientes
---

# Revisión independiente del runtime

Se revisaron las adiciones de esta entrega en viltrum_sdk/cli.py, templates/dashboard.html, pyproject.toml, viltrum_sdk/runtime.py y viltrum_sdk/adapters/controlled.py, contra el [mandato](../architecture/M-runtime-funcional-2026-09-29.md). Los implementadores son otras sesiones; este revisor no modificó ese código. La lectura inicial se amplió, por autorización D00, con verificaciones de CLI y HTTP en tmp/review-runtime. No se lanzaron modelos, conectores ni evaluaciones profesionales de los perfiles.

**Resultado:** el escape reproducible de contención quedó corregido y rechazado al repetirlo. Funcionaron el flujo host, la prohibición de revisar con el mismo actor, la invalidación por cambios y la cancelación en el fixture acotado. GET no alteró los run.json examinados. Aislamiento real, crash/concurrencia y comportamiento visual siguen pendientes.

## Hallazgos y correcciones

| ID | Observación | Corrección y evidencia | Estado |
|---|---|---|---|
| RCL-01 P2 | Panel mostraba paths/JSON sin contenido legible | get_run ofrece previews de 6,000 caracteres solo con hashes vigentes; dashboard.html:37–45 crea detalles con textContent. CLI devolvió previewAvailable:true antes del cambio de artefacto | Corregido por fuente/API; visual pendiente |
| RCL-02 P2 | await loadRun precedía actualización de gates/perfiles | D00 movió carga del detalle al final de refresh | Corregido por lectura; fallo visual pendiente |
| RCL-03 P2 | Endpoint entregaba sufijo sin validar al lector | cli.py exige RUN-[A-Za-z0-9_-]{1,96}. GET traversal codificado rechazado con JSON/500 | Rechazo verificado |
| RCL-04 P1 | _run_dir inicial validaba ID pero devolvía ruta lexical; una junction runs/RUN-junction-review hacia otro directorio permitió leer run.json externo (exit 0 y marcador externo) | Autor incorporó _contained/_runtime_root/_run_dir y resolución de .viltrum, runtime/runs, hojas, SQLite/sidecars. _read/_atomic/_lock/eventos también comprueban contención. Misma junction y symlink de hoja run.json rechazados con exit 2 «Ruta resuelta fuera del proyecto/runtime autorizado» | Corregido y repetición independiente satisfactoria |

RCL-04 se comunicó al autor antes de cierre. Evidencia: [escape inicial](../../tmp/review-runtime/junction-observation.json), [junction rechazada](../../tmp/review-runtime/junction-retest.json), [hoja rechazada](../../tmp/review-runtime/leaf-retest.json). Fixtures sintéticos fuera de proyecto cliente; se renombraron sus entradas dentro de la copia para continuar list_runs, sin borrar destinos externos. Esos casos no prueban inmunidad a todas las carreras del filesystem.

Mejoras menores: responder 400/404 para ID inválido/run ausente y uniformar errores Host/método. Host inválido y POST usan HTML estándar sin CSP; ambas peticiones fueron rechazadas, sin mutación. No se presenta esa diferencia como bypass.

## Verificaciones funcionales locales

CLI real en copia temporal ignorada; Python del entorno LangGraph para flujo y py -S para superficie básica. Evidencia: [CLI](../../tmp/review-runtime/local-cli-observations.json), [HTTP](../../tmp/review-runtime/http-observations.json). No se crearon archivos tests.

| Caso | Observación |
|---|---|
| install y run --backend host --intent INVESTIGACION | waiting_submission; RUN-e482c0259d154031850bedf9e8b6ae6b, D21/revisor D03 |
| run-submit summary/evidence | Exit 0, waiting_review |
| run-review con actor productor | Exit 2, rechazo explícito actores iguales |
| run-review con identificador distinto | Exit 0, finished; comprobación estructural con archivos sintéticos declarados |
| Modificar summary después de revisar | run-status y run-resume: invalidated |
| Otro run: run-cancel y run-resume | cancelled conservado, sin redespacho |
| py -S --help y status | Exit 0; status JSON válido sin site-packages/LangGraph |
| py -S dashboard en loopback | Arranque sin extras; proceso detenido al terminar |
| GET /api/status y /api/runs/ID | 200 JSON y CSP |
| GET Host evil.invalid | 403 |
| GET traversal codificado | 500 JSON/CSP; ID rechazado |
| POST /api/status | 501, sin comando de escritura |
| SHA-256 runs antes/después GET | run.json normales examinados sin cambios |
| Gates/C1 | No se crearon gate-reviews ni aceptación comercial |

Dos strings de actor en el caso sintético validan la regla SDK, **no demuestran personas/agentes independientes**; su informe lo declara. La entrega real D21 solicitada después tiene revisión separada de este informe de código. Ninguna aprobación del fixture habilita gates/C1.

## Contratos comprobados por lectura

| Superficie | Conclusión limitada |
|---|---|
| CLI/JSON | Siete comandos coinciden con mandato, evidencia repetible; operaciones exitosas parsearon JSON, guardas observadas exit 2 |
| Importación/distribución | dependencies vacías; extra LangGraph 1.2.12/SQLite 3.1.1; imports stdlib en módulo, LangGraph al conducir grafo. py -S acredita ayudas/status/dashboard, no wheel instalado |
| Estado durable | Escrituras atómicas/fsync, lock por run, eventos secuenciados, saver disco/thread estable/durabilidad sync; serializer sin pickle fallback y allowlists vacías. Crash/concurrencia pendiente |
| Evidencia/revisión | Hashes de handoff/artefactos/reportes; previews obsoletos ocultos. Revisores canónicos/humanos restringidos; SDK compara actor, host acredita identidad |
| Gates | read_only_analysis, finished=paquetes revisados; sin llamada automática a gate-review/commercial-accept. No implica construcción, aceptación humana o pericia |
| API/panel | Loopback/Host/rutas explícitas; GET sin proveedor. no-store/nosniff/CSP en respuestas propias. textContent/escape; CSP inline no sustituye sanitización |
| Instalador/global | Paths previos conservados; sirve SDK/data/templates. Sincronizar snapshot antes de empaquetar. Wheel/setup-global no ejecutados aquí |

### Adaptador controlado

Lectura de adapters/controlled.py y fachada executors.py: binario real, argv sin shell, prompt stdin, sandbox solicitado read-only y approvals never. Configuración desactiva MCP/apps/plugins/hooks/delegación; preparación falla cerrado. Intención durable/exclusión antes del despacho; resultado ambiguo requiere reconciliación, sin reintento silencioso.

Supervisión con Job Object Windows antes de reanudar proceso suspendido o grupo Unix, drenado concurrente de pipes y límites de volumen/tiempo/evidencias. Esquema exacto, metadata permitida, redacción, paths/hashes verificados. OpenHands desconectado: no acredita Agent Server. Política CLI/cwd/copia no acreditan aislamiento de secretos/red/SO. No se ejecutó proveedor, nietos, timeout, pipes llenos, cancelación remota ni presupuesto monetario.

## Snapshot de revisión ampliada

Capturado después de correcciones; otros agentes pueden seguir editando. D00 debe conservar snapshot final. Lectura inicial fue estática antes del motor; las verificaciones anteriores corresponden a ampliación autorizada.

| Archivo | SHA-256 |
|---|---|
| runtime.py | 8E5FD234E2FAADF9B5A624EE56B24B51991678BEB274C70CDCAE546767C8F28A |
| controlled.py | 6A3F7516F9F008233B5A352082439ED899B55C8C071AA9ED1B7AE3CD10778893 |
| cli.py | DB7D3B06ABFC671DBEDA4677DE1F74331DD2A0DBB2D3AABC0AAA4A42527F06A4 |
| dashboard.html | 4AD2A7477F837A397B18FBEDE25AF8C4B438C140304AF042F07844D8B93BCECF |
| pyproject.toml | 27CC5165C30825795EC2D782B88B3704C23589104B83724F0B380745BD42B52B |

## Pendientes

1. Proveedor real con identidad/sesión, aislamiento negativo de lectura/escritura/red, secretos sintéticos y costo; login no acredita cuota.
2. Crash entre dispatch/handoff/checkpoint, locks simultáneos, rechazo/reentrega y reconciliación de efectos inciertos.
3. Árbol procesos, timeout, protocolo inválido y cancelación durante llamada/remota confirmada.
4. Navegador: vacío/pausa/rechazo/bloqueo/final, error detalle independiente, previews/límites.
5. Wheel básico, snapshot completo, instalador/global y lectura de versión instalada.

El autor añadió después protección transaccional del handoff: no se presenta como probada por estos casos; D00 registra su caso específico. No quedan P1 confirmados abiertos en los casos revisados. No certifica seguridad total, proveedores ni evaluación profesional completa.

## Exportación local de skills

Modificación autorizada separada de la revisión: build_bundle.py asocia ambas skills runtime a D00/D18/D19 y revisores desde registro (D12 recibe review; humano no se convierte en agente). Regeneración runtime.example.yaml: **26 skills globales, 23 agentes deshabilitados**, IDs únicos/referencias resueltas. Disabled, herramientas/ACL, delegación y heartbeat iguales al bundle anterior. Sin instalación, conexión, servicio ni importación SwarmClaw.


## Ampliación posterior: cancelación, ledger, flags y wheel provisional

Revisión solicitada por D00 después del cierre host real, sin modelos nuevos ni servicios ejecutados por este revisor. El caso host RUN-2803f9e11abd44d4ad655319b4218347 fue revisado por sesiones distintas y registrado por D00; su informe de contenido vive en artifacts/host-review.md de la demo y no sustituye esta auditoría de código.

### Cancelación y handoff

Lectura actual: cancel escribe cancel.requested antes de intentar el lock, get_run publica cancelRequested y el supervisor del proceso observa el marcador. _drive/dispatch/review/end comprueban el marcador. El ledger runtime/handoff-write/transaction.json usa lock de proyecto, owner run/task, intención pending, knownIds y comparación exacta actor/department/gate/summary/evidence; reconcilia un HND ya creado y estampado sin duplicarlo, bloqueando otro owner pendiente. El SDK asigna HND por creación exclusiva. Esto acredita diseño por lectura; no se ejecutó un crash dentro de la ventana de asignación/estampado.

**RCL-05 P2, observación estática pendiente de resolución:** submit/review_submission (runtime.py:624–652 en el snapshot leído) no comprueban cancel.requested antes de _delivery/_record_review. Si la cancelación solicita el marcador mientras otro proceso conserva el lock, una continuación podría registrar entrega/revisión antes de que _drive lo detecte. Añadir guardas antes de esas escrituras y comprobar cancel tras execute antes de aceptar su resultado. Cancelled terminal en el caso ordinario ya se verificó; esta carrera no fue reproducida. cancel captura cualquier ValueError (línea 671) y responde cancelling: restringir la captura a error de lock ocupado para no ocultar fallos distintos. Hallazgo comunicado a D00; no se modificó código ajeno.

### Herramientas nativas y procedencia de salida Codex

controlled.py:161–165 mantiene integraciones MCP y features externas desactivadas, y habilita code_mode/code_mode_host para herramientas nativas de lectura/terminal bajo sandbox solicitado read-only. Esa selección de flags no demuestra ACL/red/aislamiento; no se ejecutó modelo por este revisor.

sourceEvidenceCount cuenta referencias devueltas y validadas como archivos existentes; **no prueba que el modelo leyó sus bytes**. Con cero, controlled.py:591–602 agrega una nota explícita, escribe el informe como artefacto del supervisor y lo incluye en evidence para permitir su revisión. La autocita acredita existencia del informe, no fuentes primarias. El run antiguo RUN-126a923c7a46467e85c0a0a4759dbeaa conserva productor delivered/sourceEvidenceCount=0 y reviewer failed; se observó después cancelled. No se aprueba esa salida ni se atribuye investigación a la mera ejecución del modelo.

Criterio recomendado al reviewer: leer summary y sus fuentes actuales; rechazar afirmaciones de «leí/verifiqué» que carecen de referencia y evidencia suficiente; declarar explícitamente si solo evalúa hipótesis/contexto del prompt. No aprobar una decisión profesional D21 por resumen plausible con referencias vacías. runtime.py:268–275 pide revisión independiente, hashes y declaración de incertidumbre, pero no formula todavía esa regla específica. Contador positivo también necesita evaluación de contenido/procedencia. Un nuevo run en progreso requiere observar su cierre y artefactos antes de emitir conclusión.

### Wheel básico comprobado

Archivo provisional: output/sdk-wheel/viltrum_agentic_os-0.3.0-py3-none-any.whl.
SHA-256: e22460daf19e20cc094887955856c508dee2a1d37338ac76299042e71b6fb5d9.
306 miembros. Metadata: 0.3.0/Python>=3.10; LangGraph/SQLite únicamente bajo extra runtime.
Incluye runtime.py, executors.py, adapters/__init__.py, controlled.py, template y ambas skills runtime.

Se instaló --no-deps --target tmp/review-wheel. Desde ese cwd, py -S importó los módulos del paquete instalado, con LangGraph no disponible. Ayuda, instalación en fixture nuevo existente, status y runs: exit 0; status/runs JSON válidos. El primer intento de install señaló correctamente que el directorio no existía; tras preparar el fixture se repitió satisfactoriamente. Evidencia [observaciones del wheel](../../tmp/review-runtime/wheel-observations.json).

Solo se comprobó Windows/Python 3.14.2 y snapshot provisional. No se acredita Python 3.10, Unix, setup-global ni el wheel definitivo tras nuevos adaptadores/docs. tomllib requerido por el preflight Codex existe desde Python 3.11; en 3.10 ese backend falla cerrado con diagnóstico, aunque el núcleo se anuncia compatible. Registrar explícitamente esa restricción o aportar fallback revisado si se desea ejecutar Codex en 3.10.


## Cierre de cancelación y evidencia Codex real

### RCL-05 cerrado por guardas y repetición local

D00 añadió _RunBusy específico y captura solo de ese error; submit/review comprueban cancel.requested antes de registrar, y dispatch/review lo comprueban tras execute antes de aceptar resultados. Se ejecutaron dos runs host sintéticos nuevos en tmp/review-runtime, conservando un lock local mientras un CLI run-cancel intentaba adquirirlo:

- Cancel con lock ocupado devolvió cancelling y cancelRequested=true.
- Tras liberar el lock, submit y review dieron exit 2; nombres y hashes de HND quedaron iguales.
- Cancel libre devolvió cancelled; cancel repetido mantuvo SHA-256 idénticos de run.json, events.jsonl y cancel.requested.
- Resume conservó cancelled. No se aprobó informe sintético ni gate/C1.

Evidencia [cancelación final](../../tmp/review-runtime/cancel-final-observations.json). La observación RCL-05 del apartado anterior queda cerrada. Hash runtime leído en esta ampliación: 80213d1f9285284740833b8dab45f3778e43cdcc1e4c2b5ccbed302b5fc7e98a (ediciones posteriores posibles).

### RUN-1ebce7071d324f0dae92f1a0f3b27252: inspección independiente de salida real

Se leyeron run.json, entrega, informe de revisión, dispatch/execution y process-metadata de ambos procesos. Estado recorded finished, backend codex, modo read_only_analysis, D21 approved por D03, HND-003. No se lanzó un modelo ni se registró otra aprobación desde esta revisión.

| Evidencia | Observado |
|---|---|
| Productor | codex:producer:d20a06d062764ad9b25bcec772ac0a4c; providerSessionId 01a0ef7c-f9ab-7d13-ac46-79acd39a334b |
| Revisor | codex:reviewer:cb407a311dc145d0b9f8129ba00af6e6; providerSessionId 01a0ef7e-98be-7542-a4ca-397816b7b38c |
| Procesos | Ambos exitCode=0, stopReason=null, thread.started/turn.completed presentes |
| Referencias | Productor sourceEvidenceCount=2: README.md/docs/motores.md. Revisor count=3: esos archivos y entrega productor |
| Herramientas | itemTypeCounts command_execution:32 productor/12 revisor; son cuentas de eventos, no demostración de 32/12 comandos distintos. toolNameCounts vacío |
| Errores | itemTypeCounts error:3 en ambos; no turn.failed/error de nivel superior. No se afirma ejecución sin errores internos |
| Sandbox | Dispatch sandboxRequested=read-only, sandboxVerified=false, externalIntegrations=disabled, ephemeral=true |
| Tiempo | requestedTimeoutSeconds=420 en ambos, sin timeout observado |
| Uso productor | input_tokens139279/cached_input_tokens93312/output_tokens1998 |
| Uso revisor | input_tokens222399/cached_input_tokens177280/output_tokens2459 |
| Costo | Uso observado no equivale a importe monetario ni presupuesto comercial; no se calculó tarifa |

Se recalcularon entrega (2ba9112b7649ac994a43073fa1bc2b81a97adf1977668f6d234da61caca72c87), informe (bf4d313ca27ed590e46b6f73b038f842adf04eee64caadf0fcc58c7120c46ae0), dos fuentes y HND-003: todos coinciden con hashes registrados. Los procesos/sesiones tienen identidades distintas.

La entrega compara únicamente el corpus permitido README/motores: atribuye MIT/versiones al expediente, mantiene costos/compatibilidad desconocidos y reconoce que el corpus no permite elegir Codex frente a OpenHands. Propone continuidad/puerto/salida, sin ejecutar pruebas o construir. El informe D03 declara lectura mediante herramientas nativas y verificación de hashes, y limita approved a síntesis documental. Señala que contador/hashes no demuestran la lectura histórica del productor. No revalida fuentes externas ni licencia transitiva.

Conclusión de esta auditoría: existe evidencia de ejecución Codex y revisión separada con artefactos actuales; contenido contrastado y límites explícitos. La metadata agregada no conserva el contenido exacto de cada command_execution, por lo que no certifica por sí sola historial detallado de lectura. No demuestra pericia completa D21, SSO, aceptación humana, entrenamiento, seguridad universal o gates/C1.

## Revisión OpenHands/híbrido en curso

Se leyeron adapters/openhands.py y integrations/openhands/{compose.yaml,setup-local.ps1,README.md,conversation.example.json}, el expediente docs/research/openhands-local-2026-09-29.md y receipt redactado. No se leyó secret.env, ni se ejecutaron servicios, HTTP/modelos OpenHands o scripts de despliegue por este revisor.

Receipt del implementador: Agent Server/SDK1.50.0, commit dcf401af7a9a302ef92cb7d092e1df9bb659daa5; ready, 401 sin clave/count0 con clave, container399c55980581e9cfa23680edd7d94c5279c24cc29602cfc8aa28ccec207d0628. user10001:10001/rootfsRO/CapDropALL/no-new-privileges:true/privilegedfalse, proyectoRWfalse y loopback127.0.0.1:8011; límites4GiB/2CPU/256PIDs. service_ready_llm_pending/modelExecutedfalse no equivalen a LLM funcionando. No hay fixture negativo de red/escritura; Docker mantiene salida de red y volumen interno writable.

Por lectura, REST usa loopback literal, no proxy/redirect, token de sesión separado, bounded HTTP y errores sin cuerpos del servidor. El workspace-context selecciona archivos, compara bytes HTTP/host y excluye credenciales. La composición openhands-codex se identifica explícitamente: supervisor lee API, Codex razona, no fallback oculto ni LLM OpenHands. El directo solo dispone de Finish/Think, sin shell/editor/MCP. Son controles observados por fuente y receipt, no garantía universal.

Hallazgos comunicados a D00/autores, pendientes de cierre en el snapshot leído:

1. Híbrido debe revalidar hashes SOURCE originales tras execute_codex, antes de empaquetar resultado; recalcular hashes nuevos no prueba que el contexto del modelo siga vigente.
2. _sandbox no debe aceptar no-new-privileges:false por startswith, y debe rechazar NetworkMode container:<id>.
3. Adaptador directo usaba NeverConfirm frente a documentación/ejemplo AlwaysConfirm; mantener confirmación y bloquear waiting_for_confirmation sin aceptar endpoints.
4. Runtime transmite contextFiles camelCase; adaptador directo leía context_files y podía recibir lista vacía. Selección híbrida inicial también excedía límite32; elegir corpus explícito y reproducible.
5. Setup de proyecto explícito debe cubrir nombres usuales de claves id_rsa/id_ed25519/auth.json y explicar/aplicar la validación a su demo default. No basta patrón/extensión para detectar cualquier secreto incrustado.

Wheel anterior provisional no incluye necesariamente estos últimos cambios; el cierre requiere reconstruirlo y volver a comprobar su contenido.


## Cierre de observaciones OpenHands y GET independiente

El autor corrigió los cinco puntos del apartado anterior; comprobación por lectura del código estable:

- execute_hybrid compara hashes actuales de cada SOURCE con los hashes del contexto original después del modelo y antes de registrar entrega.
- SecurityOpt exige no-new-privileges activo exacto; rechaza configuración unconfined y namespaces host/container:.
- Creación directa conserva AlwaysConfirm; waiting_for_confirmation bloquea sin llamada de aceptación.
- _select_context acepta inventario camelCase/snakeCase, separa selección explícita de hasta32/48KiB y no trata inventario completo como corpus obligatorio.
- setup-local aplica filtro a default y explícito, incluyendo .claude, VCS y nombres id_rsa/id_ed25519/auth/tokens además de extensiones, manteniendo límites sobre detección de secretos.

El esquema real preservado acredita AlwaysConfirm y GET /api/file/download con parámetro de path absoluto. Eso exige la selección/contención propia del cliente; el endpoint por sí mismo no está limitado al nombre del workspace.

D00 autorizó GET seguro sin modelos/servicios nuevos. Este revisor invocó read_workspace_context sobre el servicio existente y descargó README.md (687bytes) y docs/motores.md (22128bytes): total22815bytes, ambos hashes idénticos a host. Las llamadas crean cero conversaciones y contactan cero LLM por el camino examinado.

Casos negativos: ../review-runtime-outside/leaf-run.json y .env rechazados por cliente; lista33entradas rechazada. Se alteró exclusivamente en memoria el retorno de una descarga GET real, conservando servicio/archivos intactos: la comparación de bytes rechazó mismatch. Ese último caso es fault injection del consumidor, no una corrupción observada del servidor. Una prueba pura local de _select_context con inventario40 confirmó aceptación de camelCase y selección explícita de los dos documentos.

Evidencia [GET OpenHands](../../tmp/review-runtime/openhands-get-observations.json). No se leyeron secretos ni se escribieron archivos del demo. Los controles corregidos quedan cerrados por fuente y los casos especificados; no equivalen a negative tests universales de escritura/red, credenciales LLM configuradas, conversación OpenHands producida o compatibilidad multiusuario. El run híbrido de D00 sigue sujeto a inspección de sus artefactos finales; wheel final todavía pendiente.


## RUN-6045c280de784f119411b4a1d6938cb2: cierre híbrido observado

D00 finalizó el run el 2026-09-29T23:46:27Z. Se inspeccionaron entrega/revisión, manifiestos workspace-inputs, metadata y hashes. Estado finished, backend openhands-codex, read_only_analysis; D21 approved por D03, HND-004. Esta auditoría no registró una aprobación adicional ni ejecutó modelos.

| Evidencia | Observado |
|---|---|
| Productor real | codex:producer:bea04f59f31e43f6b344dbe1899ac779; sesión01a0ef8d-bb15-7813-8a48-d314b1ab14c3 |
| Revisor distinto | codex:reviewer:531979c7a4af4d8f8783e9b8504abf6c; sesión01a0ef8e-a118-7dc1-8af6-3a19a2747aa3 |
| Inputs supervisor productor | 2archivos/22815bytes: README.md/docs/motores.md |
| Inputs supervisor revisor | 5archivos/29970bytes: las dos fuentes, entrega principal, salida base productor y manifiesto productor |
| Referencias del modelo | sourceEvidenceCount productor2/revisor6; son referencias validadas, distintas del conteo de inputs5 |
| Transporte | AgentServer.GET.file.download; mismo container399c55980581e9cfa23680edd7d94c5279c24cc29602cfc8aa28ccec207d0628 |
| OpenHands | conversationCreated=false, llmContacted=false en ambos manifiestos |
| Procesos Codex | Exit0/stopReasonnull/turn.completed; timeout solicitado420s |
| Eventos | command_execution4productor/8revisor, error3en ambos; counts agregadas, no transcript íntegro |
| Uso productor | input103954/cached64384/output1147tokens |
| Uso revisor | input152045/cached109312/output1982tokens |

Se recalcularon todos los hashes de artifactHashes, informe D03 y HND-004: coinciden. La entrega wrapper vigente es 2473d0541e47837a642d34f567d351a3c1cff87eb0262d2577d19d3370efbb4a; informe wrapper6cf6651961743d45606282de56b91e50b09b8090732f633075a2435b326527cc. Los wrappers separan inputs descargados del supervisor y referencias/suficiencia del modelo.

El productor declara uso de contenido supervisado, sin afirmar relectura por herramientas propias. Compara continuidad LangGraph y ejecución OpenHands desde documentos secundarios y reconoce corpus insuficiente para valorar Codex. El revisor usa el contexto supervisado para el contraste y declara comprobación de integridad mediante herramientas; limita approved a la síntesis documental. Ambos mantienen costos/scoring/aislamiento/proveedores y gates/C1 pendientes. No se verificaron enlaces externos ni requisitos de cliente.

Conclusión acotada: se observa integración funcional del camino explícito OpenHands workspace HTTP → contexto verificado → proceso Codex productor → proceso Codex revisor → registro SDK. No es una ejecución LLM OpenHands ni fallback oculto. Configuración Docker/GET/hashes acreditan ese camino y el modelo identifica correctamente su fuente. No demuestra identidad humana, SSO, entrenamiento, pericia de los23perfiles, aislamiento total de lectura/red, arquitectura aceptada o autorización comercial.

No quedan abiertos los hallazgos concretos de esta revisión tras las correcciones comprobadas y los casos acotados. Persisten las pruebas adversas/crash/concurrencia, sandbox negativo, coste monetario y LLM OpenHands pendiente; el wheel final debe reconstruirse después de sincronizar este informe.

