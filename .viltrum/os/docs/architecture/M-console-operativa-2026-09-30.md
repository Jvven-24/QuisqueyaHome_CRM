---
id: M-console-operativa
fecha: 2026-09-30
estado: implementado_con_limites_documentados
riesgo: R2
---

# Consola operativa observable de Viltrum

## Intención y autorización

El usuario solicita completar los pendientes y desarrollar un dashboard propio que
muestre ejecuciones, tareas, comunicación, entrada de perfiles, departamentos,
habilidades y arquitectura de agentes en tiempo real. Autoriza desarrollo local y
subagentes en la conversación. Esta mejora mantiene herramientas internas existentes;
no representa aceptación comercial de un proyecto cliente.

## Hechos

- SDK 0.4: LangGraph/SQLite, cinco backends, 23 contratos y revisión independiente.
- Existe panel HTML/API local, con eventos y entregas pero sin explorador de capacidades.
- Existe receptor autenticado y cola durable; los servicios 8765/8771 estaban detenidos.
- El Gateway 18789 está activo; el transporte local de OpenClaw necesita estado exclusivo.
- La última entrega OpenClaw fue rechazada por D03 y debe conservar su evidencia histórica.

## Enfoque y alcance

Extender el panel y API existentes, sin segundo motor de estado. La consola tendrá
selector de proyectos permitidos, inspector de departamentos, catálogo de skills/tools,
entradas y comunicaciones efectivas, pipeline y detalles de cada ejecución. Lectura
periódica cada dos segundos; sin actividad ni métricas de entrenamiento inventadas.

Agregar arranque/estado/cierre cooperativo de los servicios propios. El administrador
acredita PID, fecha de creación y serviceId; nunca adopta procesos ajenos. El estado
privado permanece fuera del SDK. Las entradas de cliente son datos no confiables.

## Departamentos y delegación

D00 coordina; D09/D05 producen UI; D19/D17 producen proyección y operación;
D12 revisa límites; D14 revisa integración. Subagentes separados: console_backend
(console.py), console_ui (template), runtime_pending (adaptador/investigación).
El anfitrión integra CLI, lifecycle y documentación; se solicita revisión independiente.

La clasificación automática INTEGRACION/F0 conserva puertas pendientes. Para esta
corrección interna autorizada se aplica la ruta de mantenimiento descrita en
core/orchestration.md; no se emite aprobación ficticia de G0–G8 ni C1.

## Criterios

- APIs reales y seguras, 23 fichas con revisor, capacidades y límites actuales.
- Filtros/navegación/proyectos/inspector usables; seis estados UI explícitos.
- Ejecuciones, eventos, intake y handoffs reales; lectura acotada y sin secretos.
- Un comando de arranque; repetirlo no duplica servicios; cierre sólo con cola libre.
- Panel y webhook operativos, documentación de cambios y diagrama para Claude Code.
- Distinguir integración configurada, disponibilidad actual y atestación por ejecución.

## Verificación y reversión

Revisión de código independiente y comprobación operativa de HTTP/arranque/UI.
Conservar registros anteriores, datos privados y contratos. Detener servicios propios
con services stop; se mantienen artefactos y estados de ejecución para reconciliación.
