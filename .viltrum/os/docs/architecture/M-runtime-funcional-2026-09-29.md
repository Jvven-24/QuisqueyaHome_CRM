# Mandato: runtime funcional de la agencia Viltrum

Autorización: usuario pidió investigar con subagentes y dejar funcional la integración
con repositorios, skills, LangGraph y ejecutores. Scope: SDK/local, sin tocar proyectos
de clientes ni publicar; conservar modificaciones anteriores de esta conversación.

## Estado observado al iniciar

SDK0.2 prepara planes, contratos y evidencia; no invoca modelos. 23 perfiles.
`.venv-langgraph` Python3.14.2/LangGraph1.2.12/checkpoint4.2.0; falta SQLite saver.
Codex CLI0.159 autenticado con ChatGPT. Claude CLI2.1.241 sin autenticación. Docker
cliente instalado; engine desktop-linux no responde. OpenHands SDK no instalado.
CrewAI/MetaGPT tienen restricciones Python incompatibles con este entorno compartido.

Durante la implementación se instaló el saver SQLite 3.1.1 y el SDK 0.3 con extras
en el Python global existente y en `.venv-langgraph`. La verificación final se registra
por separado con los IDs y resultados observados.

## Resultado requerido

1. Grafo LangGraph durable por run: plan → trabajo → revisión independiente → entrega.
   SQLite por proyecto, runId estable, prompts/artefactos/eventos/estado en disco.
2. Ejecutores detrás de contrato estable. Host: pausa y recibe entrega real. Codex:
   proceso autenticado con sandbox `read-only` y resultado estructurado. La primera
   entrega funcional ejecuta análisis/documentación; construcción requiere un futuro
   ejecutor aislado verificado y autorización/gates, no rebajar a shell sin sandbox.
3. Separar productor/revisor por ejecución/actor. Registrar handoff/review usando el SDK.
   Revisores humanos generan pausa y evidencia explícita, nunca aprobación automática.
   La revisión de paquete no aprueba un gate ni C1.
4. Panel: runs, backend/modo, departamento, estado, eventos, bloqueos, salida y revisión.
   Proyección de 23 perfiles y fases. API de lectura; sin escritura por navegador en
   esta entrega. Reanudar/cancelar desde CLI autorizado.
5. Adaptador OpenHands remoto configurable con autenticación fuera del repo; comprobar
   documentación/API de Agent Server. La capacidad se declara desconectada si no hay
   endpoint y sandbox acreditado. SwarmClaw conserva bundle/IDs como runtime alternativo.
6. Investigación y skills específicas, documentación para Claude Code, memoria actualizada.

## Contrato de implementación

Comandos `viltrum run PROJECT --goal ... --intent ... --backend host|codex|openhands`,
`viltrum runs PROJECT`, `viltrum run-status PROJECT --run-id ...`,
`viltrum run-resume PROJECT --run-id ...`,
`viltrum run-submit PROJECT --run-id ... --task-id ... --actor ... --summary FILE
--evidence FILE`, `viltrum run-review PROJECT --run-id ... --task-id ... --actor ...
--result approved|rejected --report FILE`, `viltrum run-cancel PROJECT --run-id ...`.
Todos los runs tienen modo lectura/análisis. Ningún comando inicia producción, cambia
modelo configurado o declara pericia de los perfiles.

Raíz: `.viltrum/runtime/`; `checkpoints.sqlite`, `runs/RUN-.../run.json`,
`events.jsonl`, `prompts/`, `artifacts/`. Plan/contratos instalados son autoridad.
Run-state mínimo: schema_version,id,project,goal,intent,phase,gate,backend,mode,status,
createdAt,updatedAt,tasks,blocked. Task: id,department,reviewer,actor,status,prompt,
summary,evidence,review,handoffId. IDs de actores por run/tarea/proceso.

## Límites y continuidad

Side effects antes de interrupt deben ser idempotentes por taskId. Un crash ambiguo
de ejecución no dispara duplicación silenciosa: reconciliar o registrar bloqueo.
Al reanudar: comprobar hashes de paquetes y política/plan; si cambió el proyecto,
invalidar trabajo dependiente y producir otro paquete/run. Locks por run para prevenir
despachos concurrentes. Eventos tienen secuencia/ID; secretos nunca en eventos/prompts.
`finished` del run significa entregables revisados, no producto/gates aprobados.

Revisiones independientes de código y ejecuciones reales deben dejar evidencia de lo
operado. No se sustituyen aprobaciones reales por fixtures o transcripciones sintéticas.

## Decisiones

LangGraph como motor; Codex como ejecutor de lectura ya autenticado; host como puente
de herramientas; OpenHands como ejecutor aislado mediante contrato separado. Mantener
MetaGPT/CrewAI/mini-SWE como referentes/alternativas sin instalar runtimes incompatibles.
El circuito final debe operar en una copia local de demostración, con datos ficticios
identificados y sin acreditar gates de cliente.
