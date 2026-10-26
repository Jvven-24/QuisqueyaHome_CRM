---
name: orquestar
description: Orquesta un proyecto de software con los perfiles Viltrum; entiende el repositorio, elige la etapa vigente, delega trabajo y conserva arquitectura, evidencia y revisiones hasta completar el objetivo autorizado.
---

# Orquestar Viltrum

Usa el objetivo del mensaje y la raíz del proyecto activo. Prepara el contexto con
`viltrum orchestrate . --goal "<objetivo>"`; si el ejecutable no está en PATH, usa
`py -m viltrum_sdk.cli orchestrate . --goal "<objetivo>"` en Windows o
`python -m viltrum_sdk.cli orchestrate . --goal "<objetivo>"` en otros sistemas.
El SDK debe estar instalado. Si falta, usa la ubicación del SDK indicada por el usuario;
no descargues un paquete homónimo sin comprobar su procedencia.

Lee `.viltrum/orchestration/context.md`, el plan, el estado y
`.viltrum/os/core/orchestration.md`. Confirma la clasificación con los archivos reales;
el plan automático es orientativo. Usa `--intent` para corregir la ruta si corresponde.

Actúa sobre el siguiente entregable autorizado. Carga contrato, skill y SOP del perfil
seleccionado; crea subagentes mediante las herramientas del host cuando la tarea lo
justifique y esté autorizada. Declara límites de edición, evidencia de salida y revisor.
Mantén independientes productor y revisión; protege gates y aprobaciones humanas.
Reanuda la siguiente etapa cuando tenga entradas suficientes. Si falta información,
registra quién debe aportarla y continúa lo que sea independiente.

Consulta `viltrum doctor .` y el inventario del host para elegir herramientas reales.
No interpretes las skills/repositorios candidatos como herramientas instaladas. Usa
fuentes oficiales vigentes para APIs/estándares e investigación D21 antes de construir.
Persiste artefactos/handoffs/estado para continuar con otra sesión sin repetir trabajo.

## Ejecutar y observar el flujo durable

Para análisis delegado persistente usa `viltrum run . --goal "<objetivo>"
--intent INVESTIGACION --backend codex`. Mantén la intención correcta: `PROYECTO_NUEVO`
activa descubrimiento y conocimiento; `INTEGRACION` activa investigación, arquitectura
e integraciones. Esta versión ejecuta lectura/análisis; la construcción requiere otro
ejecutor verificado y los gates correspondientes. `orchestrate` prepara un plan;
`run` sí despacha trabajo mediante LangGraph cuando el backend está disponible.

Necesita `viltrum-agentic-os[runtime]` instalado desde el SDK autorizado en el entorno
Python activo. En esta instalación local, el entorno confirmado es
`E:\PERFILES AI\.venv-langgraph\Scripts\python.exe`; úsalo con `-m viltrum_sdk.cli`
si el Python de `viltrum` no incluye LangGraph. En otros proyectos descubre el entorno
instalado, sin asumir esa ruta personal.

Carga `skills/viltrum-runtime/SKILL.md` y `skills/viltrum-runtime-review/SKILL.md`
del paquete OS. Usa `viltrum runtime-doctor` antes de elegir proveedor. Sin executor
disponible, `--backend host` pausa y genera un prompt para un subagente real del host;
registra su resultado con `run-submit` y la revisión independiente con `run-review`.
No inventes actores ni respuestas humanas. Reanuda con `run-resume`; conserva el ID.
`runs`, `run-status` y `dashboard` muestran el avance y los eventos reales. Una ejecución
terminada acredita entregas revisadas, no gates aprobados ni aceptación del cliente.

SDK 0.5: `viltrum up PROJECT` inicia la consola local y el receptor autenticado si
está configurado. `--include-project ID=RUTA` añade proyectos visibles permitidos;
`--dashboard-only` abre sólo la consola. `services status/stop` comprueba y detiene
únicamente servicios administrados propios, con cierre cooperativo y cola libre.
El dashboard permite explorar departamentos, skills, contratos, intake, eventos y
arquitectura. Lee cada 2 s; capacidades del host se comprueban aparte cada 15 s.

Cuando el host ejecuta trabajo fuera de `viltrum run`, registra la sesión real para
que el dashboard pueda mostrarla. Tras activar el perfil productor, ejecuta
`viltrum activity start PROJECT --department Dxx --actor IDENTIDAD --goal OBJETIVO`;
conserva el `HOST-...` devuelto. Registra avances con `viltrum activity update PROJECT
--id HOST-ID --actor IDENTIDAD --message AVANCE` y el resultado con
`viltrum activity finish PROJECT --id HOST-ID --actor IDENTIDAD --message RESULTADO
--status finished|blocked|failed|cancelled`. En tareas largas, actualiza al completar
cada hito; tras dos minutos sin señal, el panel muestra la sesión como inactiva.
Cada agente delegado registra su propia sesión con el departamento que realmente
ejecuta. Estos registros son declaraciones del host: no prueban identidad, ejecución
de un modelo, revisión independiente ni aprobación de gates.
Una skill disponible no acredita entrenamiento ni acceso de tools. El modelo
configurado de OpenClaw y el backend efectivo de una tarea son datos diferentes.
`run-rework PROJECT --run-id ID --backend BACKEND --reason TEXTO` crea una corrección
vinculada a un paquete rechazado, conservando el historial. No retransmite eventos
ambiguos. `webhooks backend --backend codex|openclaw` cambia la ruta explícitamente,
con el receptor detenido y cola libre; nunca habilita fallback automático.

## Encargos de diseño PXIL

Si el alcance aceptado contiene varias pantallas, usa la skill `viltrum-pxil-design` y
`templates/design-brief.example.json` como forma del brief. Corre el ciclo de biblioteca en
el proyecto objetivo: `viltrum design PROJECT brief --file pantallas.json`, `status`,
`search --query TEXTO --limit 8`, `acquire --id ID`, capturas de previews con el navegador
y `prepare --brief-id ID`. El handoff lexical debe cubrir todas las pantallas listadas.
Consulta `docs/architecture/HANDOFF-DESIGN-LIBRARY.md` para recorrido, estados y artefactos.
Asigna D21 para scouting; D05 para selección/capturas; D06 para estados/contrato; D07 para
accesibilidad; D09 para implementación y D14 como revisión independiente; D22 solo cura
patrones revisados. La búsqueda remota es opcional; mantener modo local gratuito si no hay
acceso confirmado. Un Jev remoto no se considera integrado ni se usa para aprobar selección.

Este flujo prepara investigación, selección visual y handoff; la construcción requiere
alcance de proyecto y mandato vigentes. Aplicar C1 cuando corresponda según la política
de Viltrum (p. ej., trabajo para cliente); un ajuste interno autorizado no se bloquea por
una regla comercial ajena. Nunca inferir gates aprobados desde `prepare`, capturas o estado
de consola. No sobrescribir configuración global ni ampliar el scope del proyecto.

OpenHands requiere endpoint y sandbox comprobados; Docker instalado no acredita un
engine disponible. SwarmClaw requiere conexión aparte. OpenClaw dispone del backend
`openclaw` y un webhook durable local en SDK 0.4: comprueba `runtime-doctor` y la guía
`integrations/openclaw/README.md`. No ejecutes dos motores simultáneamente sobre la misma tarea.

`--backend openhands-codex` obtiene contexto por GET desde Agent Server local y
verifica SHA256 contra el proyecto; Codex analiza y revisa en el host. Exige que el
mount corresponda al proyecto y conserva manifiesto de fuentes. No ejecuta un LLM
OpenHands ni mueve Codex dentro de Docker. El backend `openhands` con LLM propio
requiere otra configuración explícita. Distingue entradas del supervisor de lectura
con herramientas por el modelo y consulta la guía de integración incluida en el OS.
