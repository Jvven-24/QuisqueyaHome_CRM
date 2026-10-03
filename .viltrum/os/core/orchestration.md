# Orquestación por etapas y contratos

Entrada global: `/orquestar <objetivo>` en Claude Code o `$orquestar <objetivo>` en Codex.
Preparación determinista: `viltrum orchestrate . --goal "<objetivo>"`.

El CLI inventaría archivos locales y prepara `.viltrum/orchestration/plan.json`,
`plan.md` y `context.md`. El asistente anfitrión lee el contexto, decide con evidencia y
ejecuta las herramientas que realmente tiene. El CLI no llama modelos, publica ni crea
agentes externos. SwarmClaw es un adaptador opcional; su bundle no acredita conectividad.

## Comprender el proyecto

1. Lee el objetivo y las instrucciones aplicables. Ubica la raíz real, proyecto,
   estados/gates, requisitos, diagramas, ADR, catálogo de roles/datos y registro de fuentes.
   En repositorios existentes, inventaría manifiestos, scripts, rutas críticas y deuda;
   GitNexus/Context7 ayudan si están disponibles; `rg` y documentación oficial son alternativas.
2. Registra un mandato que declare resultado, límites autorizados, evidencia existente,
   incertidumbres, fase y definición de terminado. La clasificación automática del CLI
   es provisional: confirma intención, dominio, superficie de UI/API, integraciones,
   datos personales, riesgo, restricciones de infraestructura y negocio.
3. Mantén los desconocidos explícitos. El código prueba lo implementado, no la aceptación
   del negocio. Una transcripción aporta declaraciones atribuibles. Una simulación aporta
   escenarios de práctica. Ninguna equivale por sí misma a una decisión aprobada.
4. En proyectos nuevos sigue G0 → G1 → investigación/propuesta → C1 → G2 → G3 → G4
   → G5 → G6 → G7 → G8. Investigación y seguridad participan temprano. En mantenimiento,
   bugs o incidentes usa la ruta acotada y conserva la evidencia anterior que aún es válida.
   C1 corresponde a compromiso comercial/construcción nueva; las correcciones locales ya
   autorizadas no necesitan inventar una nueva propuesta comercial.

## Activar y delegar

- `registry/orchestration.json` define etapas y rutas; `registry/departments.yaml`
  fija identidad, revisor y autonomía. `departments/*/delivery.json` define contrato,
  herramientas por capacidad, entregables y especialistas condicionales.
- Carga para cada perfil SOUL, AGENTS, su skill local, SOP de entrega y la checklist
  aplicable; agrega solo mandato, estado, artefactos de entrada y fuentes pertinentes.
- Activa perfiles con una salida necesaria en la etapa actual. No confundir un perfil
  disponible con un agente ejecutándose. Separa productor y revisor aunque ambos usen
  el mismo modelo. En ausencia de delegación real, trabajar por perfiles secuenciales
  deja la revisión independiente pendiente; cambiar de nombre no constituye revisión.
- Delegar subtareas independientes con contrato: id, perfil padre, objetivo, archivos
  que puede editar, insumos, outputs, criterios de salida, herramientas, revisor y límite.
  Paralelizar investigación/inventario/revisión o módulos independientes; serializar
  dependencias y evitar dos agentes editando el mismo archivo. Ajustar al límite del host.
  Mantener el modelo configurado por el usuario; opus/sonnet/haiku son categorías locales,
  no una orden de cambiar modelo en otros proveedores.
- Inventariar herramientas del host antes de invocarlas. En `.viltrum/capabilities.json`
  se declaran disponibilidad, alcance, comprobación y responsable. Declarar una fuente,
  skill o candidato no instala servidores MCP ni concede credenciales/permisos.
  `viltrum doctor .` muestra binarios y skills observables, no autentica servicios remotos.
  `registry/toolchain.json` ofrece candidatos por perfil, requisitos y alternativas;
  comprueba el catálogo MCP del host además de los binarios. GitNexus requiere un
  índice de este proyecto y su vigencia; no usar el grafo de otro repositorio. Context7
  resuelve biblioteca/versión antes de consultar documentación y no debe recibir secretos.

## Arquitectura y trazabilidad transversal

Cadena mínima: fuente → REQ → criterio de aceptación → flujo/estado/rol → ADR/contrato
→ módulo/API/datos → evidencia QA → release → telemetría. Registrar impacto de un cambio
en todos los eslabones. Los perfiles deben cerrar su paquete con outputs reales y rutas,
decisiones/razones, riesgos, supuestos y pendientes heredados.

Cada módulo documenta actores, permisos, entradas/salidas, transiciones, invariantes,
concurrencia, errores, validación, auditoría, NFR medibles y cómo se verifica. Elegir
arquitectura según límites del negocio y costo operativo; monolito modular es una opción,
microservicios requieren evidencia que justifique su costo. Los proveedores viven detrás
de contratos propios; no prometer escalabilidad sin carga/latencia/costo medidos.

## Handoff, revisión y puerta

`viltrum handoff . --department Dxx --gate Gx --actor <productor> --summary <archivo>
--evidence <archivo>` prepara un registro con hashes. Repetir `--evidence` para incluir
artefactos. `viltrum review . --handoff HND-nnn --reviewer Dyy --actor <revisor>
--result approved|rejected --report <archivo>` registra revisión con evidencia.

Estos registros son declaraciones trazables en disco, no un sistema de identidad
autenticada. El host debe acreditar actor/sesión y una revisión realmente independiente.
Una revisión humana nunca se genera en nombre del cliente: se registra su aceptación
explícita y la referencia a ella. La revisión no aprueba por sí sola una fase.

Antes de avanzar, `/gate` verifica checklist completa, artefactos/hash vigentes,
revisiones de todos los productores requeridos, alcance de N/A y P0/P1. Toda N/A requiere
razón y revisión. Un P0 bloquea avance; un P1 condicional requiere aceptación, dueño y
fecha. Registra resultado, revisor, fecha y referencias en el archivo de fase.
El plan automático conserva como pendiente cualquier aprobación sin evidencia o revisión.

Registra el cierre efectivo con `viltrum gate-review . --gate Gx --reviewer <revisor>
--actor <actor independiente> --report <informe>`. El SDK coteja checklist canónica,
artefactos revisados, bloqueos y revisiones previas, y liga la aprobación a sus hashes.
G6 siempre exige revisor humano; R3/R4 lo exigen en cada fase. Las N/A quedan firmadas
en el mismo informe y checksum; un cambio de superficie del proyecto invalida su base.

C1 se registra desde aceptación humana explícita ya recibida:
`viltrum commercial-accept . --actor <aprobador> --proposal <propuesta.md>
--terms <condiciones.md> --evidence <aceptacion.md> --version <v> --date <AAAA-MM-DD>`.
La propuesta debe incluir alcance/exclusiones; condiciones, precio y plazo acordados.
El comando no obtiene ni inventa la aceptación. Conserva historia y hashes; cambios a
esos archivos vuelven a bloquear C1. Aceptaciones antiguas sin hashes necesitan que el
host verifique originales y registre ese paquete, sin inventar una nueva aprobación.

`viltrum intake --kind synthetic|customer|document|unknown` conserva clasificación de
fuentes en `sources.json`. Escenarios sintéticos ayudan a QA y entrenamiento, pero
no validan problemas/requisitos reales ni aceptación humana. La clasificación y los
actores son declaraciones del host; el SDK no autentica identidad ni garantiza veracidad.
P0/P1 abiertos en `findings.md` bloquean; las excepciones P1 se registran en
`findings.json` con plan, dueño, fecha, aceptación independiente e informe con hash.
Una excepción no puede habilitar un P0 ni ampliar autorización para producción.
El cierre de P0/P1 requiere `state: closed|resolved`, productor y departamento conocidos y `closure`
con `result: approved`, actor independiente, revisor canónico e informe vigente con hash. Marcar una casilla de
hallazgo como cerrada no reemplaza ese registro en `findings.json`.

Las aprobaciones dependen también de los registros de puertas anteriores: volver a
aprobar G0 exige revisar otra vez las fases posteriores cuya base cambió. El registro
de fuentes mantiene la procedencia sintética al modificar o volver a registrar una
ruta; una fuente modificada exige registrar su nueva versión antes de revisarla.

Cuando falte información/acceso, avanzar trabajo independiente y dejar un bloqueo con
dueño y próximo paso. Producción, migraciones destructivas y acciones externas requieren
la autorización correspondiente; una puerta de proyecto no amplía la autorización del usuario.

## Reanudar

Actualiza `.viltrum/status.md`, requisitos, preguntas, outputs y handoffs al entregar.
Vuelve a preparar el plan tras cada revisión o cambio de alcance. El SDK nunca marca una
fase aceptada solo por ejecutar un comando. D22 promueve lecciones después de revisión.
El panel muestra estado registrado, próxima acción, bloqueos y herramientas pendientes;
no demuestra que un agente externo esté conectado ni mide pericia de los 23 perfiles.

Cuando el host ejecuta perfiles fuera de `viltrum run`, cada productor y revisor
registra su sesión real con `viltrum activity start PROJECT --department Dxx --actor
IDENTIDAD --goal OBJETIVO`, informa avances con `activity update` y cierra con
`activity finish`. La señal caduca tras 120 segundos sin actualización; el panel
la muestra como falta de telemetría, no como prueba de que el proceso terminó.
La identidad del actor es declarativa y no sustituye handoff, revisión ni gates.

## Runtime durable del SDK 0.3

`viltrum run . --goal "<objetivo>" --intent INVESTIGACION --backend codex` despacha
análisis real mediante LangGraph. El checkpoint SQLite, run JSON, prompts, resultados
y eventos viven en `.viltrum/runtime/`. El SDK importa LangGraph solo al ejecutar;
la instalación y el panel siguen disponibles sin dependencias opcionales.

Cada tarea activa un perfil productor y su revisor canónico. D00 coordina. Procesos
Codex separados producen y revisan sin cambiar el modelo configurado. El modo actual
es lectura/análisis: no habilita construcción ni producción. Cada salida se conserva
con hashes/handoff; las aprobaciones humanas y los gates mantienen su protocolo.

`--backend host` interrumpe el grafo para delegación real por el host. `run-submit`
registra la entrega y `run-review` la revisión de otro actor; `run-resume` continúa
el mismo thread. Recuperar un efecto incierto requiere reconciliarlo: nunca repetirlo
silenciosamente. `run-cancel` cancela la continuación; no revierte artefactos emitidos.

Las skills `viltrum-runtime` y `viltrum-runtime-review` describen los comandos y
las restricciones. `runtime-doctor` distingue instalación, autenticación y sandbox.
OpenHands requiere una instalación aislada acreditada; el adaptador debe mostrar el
bloqueo mientras no exista. SwarmClaw conserva su bundle portable y OpenClaw es una
interfaz opcional. Viltrum conserva la autoridad de perfiles/gates frente a esos motores.
