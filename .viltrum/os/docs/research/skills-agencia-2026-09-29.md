---
title: Skills y herramientas para operar la agencia Viltrum
fecha: 2026-09-29
estado: investigacion-y-procedimientos-locales; conexiones-y-evaluaciones-pendientes
responsables: D21 y D22
---

# Skills para la agencia de 23 perfiles

Los 23 perfiles ya tienen skill local, SOP y contrato de entrega. La siguiente inversión útil es ejecutar entregas con estado recuperable, herramientas comprobadas y revisión independiente. Este expediente identifica fuentes oficiales, reutilización disponible y brechas concretas; no instala colecciones, no otorga credenciales y no atribuye fine tuning a la incorporación de instrucciones.

## Evidencia local y significado de disponibilidad

Se leyeron `CLAUDE.md`, los manifests D00–D22, `delivery.json`, las skills locales, `registry/toolchain.json`, los métodos D21/D22 y [arquitectura vigente](../architecture/orquestacion-global-y-perfiles-2026-09-29.md). Los 23 manifests conservan `eval_score: null`: los protocolos existen, su pericia profesional aún necesita evaluación. Fuente canónica de perfiles/revisores: `registry/departments.yaml`.

Comprobaciones de esta sesión por lectura/ayuda/metadatos:

| Recurso | Observado | Límite de la observación |
|---|---|---|
| SDK al iniciar la investigación | Ayuda 0.2: `orchestrate`, `doctor`, `handoff`, `review`, `gate-review`, `commercial-accept`, entre otros | El desarrollo 0.3 ocurre en paralelo; este inventario inicial no acredita aún ejecución de runs |
| `.venv-langgraph` | Python 3.14.2; LangGraph 1.2.12; checkpoint 4.2.0; checkpoint SQLite 3.1.1 en la lectura posterior | Paquetes instalados; aceptación del runtime requiere evidencia de ejecución/reanudación y revisión |
| Herramientas PATH | `py`, Git, `rg`, Node, `npx`, `21st`, Docker presentes | Un ejecutable presente no prueba servicio activo, autenticación, licencia de catálogo o entorno de prueba |
| Otros ejecutables PATH | `playwright`, `k6`, `gitleaks`, `trivy` sin resolución directa | Pueden existir como paquetes o runners; no se declara ausencia global |
| Skills personales en disco | `21st-cli-use`, `21st-ui-build`, `frontend-design`, `find-skills`, `playwright-cli`; Supabase, Postgres, Playwright best practices y GitNexus en `.agents/skills` | No se distribuyen automáticamente por instalar este SDK; revisar procedencia/versión antes de incorporarlas |
| Conectores del host | Herramientas MCP GitNexus y Context7 expuestas | Exposición no acredita operación en este proyecto; el documento de arquitectura registra comprobaciones previas y falta de índice para esta raíz |
| `registry/toolchain.json` | 10 candidatos; `enabled: false`, `access: no_access_granted` | Declaración de opciones y requisitos, no instalación/conexión |

**Estados utilizados:** local = procedimiento/artefacto accesible aquí; observado = binario/metadatos leídos; candidato = opción con fuente; pendiente = necesita operación/evaluación. Cada proyecto declara sus capacidades en `.viltrum/capabilities.json`; el host prueba la operación real y registra evidencia sin valores de secretos.

## Fuentes oficiales de skills y runtimes

Consulta web y API pública GitHub el 2026-09-29. Estrellas y fechas son señales de mantenimiento, no validación de seguridad. `find-skills` se aplicó empezando por [skills.sh](https://www.skills.sh/); la recomendación se contrastó con repositorios de los proveedores. No se ejecutó instalación por CLI.

| Fuente | Capacidad concreta y procedencia | Selección para Viltrum |
|---|---|---|
| [LangChain skills](https://github.com/langchain-ai/langchain-skills) | Repo oficial MIT; 1,256 estrellas API; push 2026-09-25. Skills `langgraph-fundamentals`, `langgraph-persistence`, `langgraph-human-in-the-loop`, `eval-engineering`. El README advierte desarrollo temprano | Referencias para D03/D18 y operación; leer skill individual, fijar commit y contrastar API instalada. `eval-engineering` requiere Harbor; no se adopta ese runner por leer la skill |
| [LangGraph](https://docs.langchain.com/oss/python/langgraph/overview) | Orquestación con estado; documentación propia de [interrupciones](https://docs.langchain.com/oss/python/langgraph/interrupts) y [persistencia](https://docs.langchain.com/oss/python/langgraph/persistence) | Núcleo candidato para el runtime propio: transiciones controladas, revisión y continuación. La independencia, ACL, efectos externos y gates son contratos de Viltrum, no garantías implícitas del framework |
| [OpenHands extensions](https://github.com/OpenHands/extensions) | Catálogo oficial MIT; 152 estrellas API; push 2026-09-29. `code-review`, `openhands-sdk`, `agent-memory`, `github-actions`, `security` y `prd` existen como skills | Seleccionar procedimientos por capacidad. Plugins de automatización/review contienen ejecución: revisión individual y sandbox antes de importarlos. No se importa el marketplace completo |
| [OpenHands Software Agent SDK](https://github.com/OpenHands/software-agent-sdk) | Runtime separado del catálogo; API pública reporta MIT, 1,186 estrellas y actividad 2026-09-29 | Posible adaptador futuro para agentes de código en sandbox. Tener sus skills no conecta Agent Server ni acredita herramientas; requiere política de workspace, permisos, proveedor y evidencia |
| [CrewAI](https://github.com/crewAIInc/crewAI) y [skills oficiales](https://github.com/crewAIInc/skills) | Framework MIT; Crews/Flows y salidas estructuradas. Skills `getting-started`, `design-agent`, `design-task`, `ask-docs`. Skills repo: 42 estrellas; README declara MIT, API de licencia devuelve null | Fuente oficial, pero contenido con adopción pequeña: revisar archivos/licencia individual. Framework requiere Python >=3.10,<3.14; esta venv 3.14.2 necesita entorno separado. Mantener como candidato, sin una segunda orquestación simultánea |
| [MetaGPT](https://github.com/FoundationAgents/MetaGPT) | Framework MIT con product manager, architect, project manager, engineer y SOP; 70,693 estrellas; último push API 2026-01-21. README pide Python >=3.9,<3.12 | Referencia de contratos y roles; no equiparar SOP/rol con skill SKILL.md ni copiar el equipo completo. La compatibilidad y mantenimiento observados justifican PoC aislada antes de elegir runtime |
| [Vercel agent skills](https://github.com/vercel-labs/agent-skills) | Colección oficial; React/performance, composición y web design. Leaderboard observado: React 755.3K, web design 680.6K instalaciones. README declara MIT; API no detecta licencia global | Candidatos puntuales D05/D09/D15; revisar licencia del archivo elegido. No importar despliegue automático por usar una guía de React |
| [Anthropic skills](https://github.com/anthropics/skills) | `frontend-design` y ejemplos oficiales; leaderboard frontend 935.9K. El README distingue ejemplos Apache 2.0 de skills de documentos source available | Reutilizar diseño que ya existe en el host. D20 verifica licencia específica de docx/pdf/pptx/xlsx; no tratarlas como colección homogénea abierta |
| [Supabase agent skills](https://github.com/supabase/agent-skills) | Repo oficial MIT; Postgres con revisión de consultas/esquemas. 2,665 estrellas API; push 2026-09-28. Leaderboard Postgres 422.9K | Ya hay instrucciones del host; útiles D10/D11/D15. La skill no conecta DB ni ejecuta migraciones; requiere sandbox, permisos y versión del motor |
| [Microsoft Playwright MCP](https://github.com/microsoft/playwright-mcp) | Servidor oficial Apache 2.0; 37,700 estrellas API; push 2026-09-28 | Candidato de interacción, separado del [runner Playwright](https://playwright.dev/docs/intro) para QA reproducible. Requiere paquetes/navegadores/target autorizado; acceso browser no sustituye suite CI ni lector de pantalla |

No se asigna total construir/comprar a estas colecciones: seguridad efectiva, coste a tres años y compatibilidad por proyecto siguen sin medir. D21 usa los pesos de `core/doctrine/buy-vs-build.md` en cada decisión de adopción y deja criterios desconocidos explícitos. El inventario anterior permite elegir qué PoC realizar; no activa automáticamente umbrales de compra.

## Mapa perfil → skill local → herramientas → evidencia

Cada skill de la tabla vive en `skills/<nombre>/SKILL.md` y enlaza el SOP/contrato de su departamento. Las herramientas externas de esta tabla son candidatas excepto la lectura local observada; el host comprueba acceso en el proyecto receptor. La columna final expresa la evidencia necesaria, no una prueba ya ejecutada.

| Perfil | Skill local | Herramienta real o candidato de fuente conocida | Evidencia y brecha concreta |
|---|---|---|---|
| D00 Orquestación | `orquestar` | CLI local de planificador; runtime LangGraph propio previsto; Git/archivos | Mandato, plan, actor, dependencias y gate; run recuperable y revisión entre actores por demostrar |
| D01 Discovery | `viltrum-discovery` | Fuentes/documentos locales; transcripción/Drive del host; `prd` de OpenHands candidato | SRC→REQ con fragmento/fecha, Q/CI; fuentes sintéticas no demuestran necesidades del cliente |
| D02 Scope | `viltrum-scope` | Archivos/hojas; Trello y Drive si conectados | MVP/exclusiones/rangos con supuestos y C1 humano; herramienta de hojas no decide compromiso comercial |
| D03 Architecture | `viltrum-architecture` | Git/`rg`; GitNexus/Context7; LangGraph references; OpenAPI/AsyncAPI | ADR, contratos e impacto en commit actual; el índice y el diseño de recuperación deben comprobarse |
| D04 UX research | `viltrum-ux-research` | Navegador; Figma/Stitch del host si conectados | Participantes/fuentes/recorridos y resultados reales; validación con usuarios pendiente, distinguir simulación |
| D05 UI design | `viltrum-ui-design-system` | CLI `21st` observado; `frontend-design`; Figma candidato; Vercel web design | Tokens/componentes/anchos/seis estados y revisión D07; ocho casos D05 definidos requieren ejecución |
| D06 UX states | `viltrum-ux-states` | Playwright runner/capacidades de red candidato | Matriz estado/acción, timeout/offline/recuperación y traza; escritura incierta requiere contrato de idempotencia |
| D07 Accessibility | `viltrum-accessibility` | [axe-core](https://github.com/dequelabs/axe-core), Playwright, lector/teclado | WCAG A/AA con evidencia automática y manual; lector real pendiente, cero hallazgos de axe no demuestra conformidad |
| D08 Content/SEO | `viltrum-content-seo` | Navegador, [Lighthouse](https://developer.chrome.com/docs/lighthouse/overview), Search Console si autorizado | Copy con fuentes, indexación/eventos; métricas de campo y propiedad conectada por acreditar |
| D09 Frontend | `viltrum-frontend` | Stack del proyecto; 21st; Vercel React/composición; Playwright | Build/recorridos/roles/estados/capturas por SHA; catálogo/guía de diseño no acredita interfaz funcionando |
| D10 Backend | `viltrum-backend` | Runtime del proyecto; [OpenAPI](https://spec.openapis.org/oas/latest.html); skills Supabase/Postgres | Contrato HTTP, BOLA/tenant/transacción/idempotencia; conexión sandbox y pruebas adversas pendientes |
| D11 Data | `viltrum-data` | Motor/CLI de BD por proyecto; Supabase/Postgres skills | Constraints, acceso, migración/backfill y restore/PITR; instalación de skill no acredita restauración |
| D12 Security | `viltrum-security` | [ASVS](https://github.com/OWASP/ASVS); Gitleaks/Trivy/ZAP/CodeQL candidatos; skill security del host | Control→evidencia, scopes y amenazas; scanners no resueltos PATH necesitan comprobar runner; revisión humana canónica |
| D13 Git governance | `viltrum-git-governance` | Git local; GitHub/Actions; skills GitNexus/OpenHands Actions candidatas | Check→SHA→resultado→URL, política de ramas; Git local no acredita permisos remotos ni revisión CI |
| D14 QA | `viltrum-qa` | [Playwright runner](https://playwright.dev/docs/intro) y fixtures; browser host; axe | Casos reproducibles por build/criterio/estado y bugs; conectar navegador/CI y datasets sintéticos antes de acreditar cobertura |
| D15 Performance | `viltrum-performance` | [k6](https://github.com/grafana/k6), Lighthouse, SQL plans, Vercel React guides | Carga/percentiles/error y límites de aborto; runner k6 y baseline por proyecto pendientes |
| D16 DevOps | `viltrum-devops` | Docker observado; [Actions secure use](https://docs.github.com/en/actions/reference/security/secure-use); plataforma del cliente | SHA/digest/migración, restore/rollback ensayados, A4 humano; Docker PATH no prueba daemon o deploy autorizado |
| D17 Observability | `viltrum-observability` | [OpenTelemetry](https://opentelemetry.io/docs/collector/), backend métricas/logs elegido | Recorrido→señal→SLO→alerta→dueño; Collector/exporter/alerta deben operar y redactar datos |
| D18 AI agents | `viltrum-ai-agents` | LangGraph propio; adaptador de modelo; LangChain skills/Harbor candidato | Tools/ACL/budget/grounding/dataset/trace/fallback; ejecutar casos adversos y revisor D12, no confundir procedimiento con entrenamiento |
| D19 Integrations | `viltrum-integrations` | SDK del proveedor detrás de puerto; [AsyncAPI](https://github.com/asyncapi/spec), OpenAPI | Firma/scopes/replay/duplicados/outbox/DLQ/reconciliación; credenciales sandbox por verificar; contrato sin prueba no acredita webhook |
| D20 Documentation | `viltrum-documentation` | Markdown local; herramientas documentos/PDF del host; skills oficiales con licencia por archivo | Runbook reproducido por otro actor y fuentes por versión; lector independiente y entregables reales pendientes |
| D21 Research | `viltrum-research` | Web/API GitHub oficiales; `find-skills`; 21st/GitNexus cuando pertinentes | Comparación/compatibilidad/licencia/costo/salida; no importar resultados de buscador sin revisar contenido/commit |
| D22 Knowledge ops | `viltrum-knowledge` | Archivos/Git; GitNexus si indexado; Drive/Notion si conectados; OpenHands agent-memory candidata | Fuente/hash→decisión→contexto, contradicciones y recencia; evitar copias independientes de catálogo/estado |

El registro actual ya cubre GitNexus, Context7, Playwright, axe, ASVS, OpenAPI, AsyncAPI, OpenTelemetry, k6 y GitHub Actions. Este informe añade procedencia de skills y referencias; no cambia sus banderas de acceso.

## Dos skills locales y brechas operativas

Se crean instrucciones propias porque ninguna colección externa conoce C1, gates, revisores y evidencia Viltrum:

| Skill | Uso y aporte específico | Criterio de aceptación para integrarla |
|---|---|---|
| [viltrum-runtime](../../skills/viltrum-runtime/SKILL.md) | Operar run por modo/adaptador, comprobar capabilities, conservar estado y recuperar efectos inciertos | CLI 0.3 confirmado por ayuda, ejecución local con ID/artefactos, interrupción y continuación; límites/modo documentados |
| [viltrum-runtime-review](../../skills/viltrum-runtime-review/SKILL.md) | Revisar entrega por otro actor, hashes/criterios actuales; registrar rechazo/aprobación y respetar gate de fase | Mismo productor no puede aprobarse; cambio de artefacto invalida revisión; rechazo no continúa; actor humano requiere evidencia real |

Son complementos de las 23 skills, no nuevos perfiles. Sus enlaces se resuelven desde el repositorio o snapshot OS. D00 confirmó el [contrato de runtime](../architecture/M-runtime-funcional-2026-09-29.md): `run PROJECT --goal --intent --backend host|codex|openhands`, `runs`, `run-status`, `run-submit`, `run-review`, `run-resume` y `run-cancel`. Las skills ya incluyen esa interfaz y la condición lectura/análisis; consultar ayuda de la versión instalada evita atribuir comandos futuros al SDK 0.2. `host` recibe entregas reales; `codex` usa sandbox `read-only`; `openhands` necesita endpoint y sandbox acreditados. Los archivos viven en `.viltrum/runtime/`, con SQLite y run/eventos/prompts/artefactos. Un run `finished` describe paquetes revisados, nunca aprobación de gates o C1. La aceptación funcional final del código queda en la evidencia de D00/D18. No se modifican `orquestar`, manifests, snapshots ni credenciales en este trabajo D21/D22.

Orden de trabajo recomendado: D03/D18 completan puerto/adaptador y recuperación del runtime; D12/D14 revisan sus controles; D00 valida una entrega por dos actores; D05/D09/D14 ejecutan un caso UI en sandbox; D10/D11/D12 prueban contrato/tenant/idempotencia y restauración; D16/D17 verifican operación antes de producción. D22 conserva versiones y D21 registra cada nueva adopción. Cada paso se cierra con evidencia real y su revisor, no con incremento de `eval_score` por editar documentos.

## Registro de validación de este expediente

Se comprobó existencia de archivos locales, ayudas y versiones, paths de herramientas y contenido/metadata de fuentes oficiales. Las dos skills se redactaron específicamente para los invariantes existentes de Viltrum; `skill-creator/scripts/quick_validate.py` aprobó ambas (frontmatter/nombre/esqueleto). Esa validación de estructura no acredita comportamiento del runtime. No se ejecutaron evaluaciones de los 23 perfiles, importaciones externas, prompts de producción, acceso a BD ni deployment. La calidad profesional y conectividad por proyecto conservan los pendientes del mapa.
