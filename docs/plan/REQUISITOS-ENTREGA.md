# Requisitos CRM Quisqueya Home: extraídos de la reunión de inducción ("Entrada")
Fecha: 27/10/2026 (hora RD). Elaborado por Viltrum Docs. Uso interno; no se ha subido ni enviado.

## 0. Fuente y alcance
- **No hay un documento escrito** de roles y permisos en una carpeta "entrega". Se buscó en `/workspace` (find/rg por `entrega`, `quisqueya`, `matriz de permisos`) y en ambos Drive (folders y texto). Lo único nuevo es un **audio** en la carpeta de Drive **«03 Entrada (subir audios aquí)»**: `Quisqueya 1- inducción CRM.m4a` (id `1cVwEVNrEfPp7lDiIxPaLAxV_2HtmKm2H`, 89:49 min, subido el 26/10/2026 a las 11:02 PM, hora RD).
- Copia local: `/workspace/crm-plan/fuente/quisqueya-1-induccion-crm.m4a`. Transcripción Whisper local (large-v3-turbo) en `fuente/quisqueya-1-induccion-crm.{txt,md,srt,json}`. La transcripción es interna: tiene nombres y una contraseña dicha en voz alta, así que **no se debe compartir ni subir**.
- Es una demo del CRM al equipo comercial del cliente: dos personas desarrollan y presentan, y el resto escucha. Las personas aparecen por rol (Ley 172-13): **Administrador** (dueño o líder de la inmobiliaria), **Director comercial** (sucursal Punta Cana; también sería administrador), **Gerente/Supervisor (manager)**, **Broker/Agente/Asesor** y **Equipo Viltrum**.
- Marcas de tiempo `[mm:ss]` del audio. **(inferido)** = criterio de aceptación que no se dijo literalmente. Columna **vs PLAN** = comparación con `PLAN-EQUIPO.md`: cubierto, parcial o falta. El PLAN trata sobre todo la infraestructura, la auditoría y el RBAC, así que "falta" significa que **no figura en el plan**, no que el CRM no lo tenga.
- La transcripción tiene ruido: hay tramos ininteligibles (por ejemplo 01:53–02:24 y 12:31–15:16).

## 1. Matriz de permisos por rol (según la fuente)
La fuente **no trae una matriz formal**. Esto es lo que se dijo:

| Capacidad | Administrador | Gerente/Supervisor | Broker | Fuente |
|---|---|---|---|---|
| Ver todo (leads, actividades, dashboard general) | Sí | — (no se dijo) | No; vista personalizada | 32:30, 33:10, 10:35 |
| Ver leads que "requieren atención" / sin asignar | Sí | Sí (inferido) | Sí, solo ver, para avisar | 32:43–33:05, 45:46 |
| Asignar / reasignar lead | Sí | Solo si el Administrador le activa el permiso | No, salvo que se le dé el permiso | 1:04:31–1:05:12 |
| Conceder permisos a cualquier usuario | Sí ("controla los permisos de cada quien") | No | No | 1:04:54 |
| Monitorear a todo el equipo (vista general) | Sí | (inferido: su equipo) | No; su espacio y sus asignaciones | 10:35 |
| Asignar tareas (to-do por broker) | Sí | (inferido) | Recibe y marca como hechas | 36:45–37:56 |
| Asignar proyectos a un broker | Sí (Red de brokers) | — | Solo recibe avisos de sus proyectos | 1:07:22–1:07:46 |
| Ver metas, ranking y su % | Sí, el de todos | — | Sí ("cada uno puede verlo") | 23:31–23:47 |
| Crear contenido en Academy y quizzes | Sí | — | Consume y hace los quizzes | 39:36–40:33 |

## 2. Requisitos

| ID | Requisito | Prioridad | Criterios de aceptación probables | Fuente | vs PLAN |
|---|---|---|---|---|---|
| RQ-01 | Cada persona tiene su propio usuario y su espacio, con sus asignaciones | Alta | Login individual; el broker ve solo lo suyo y lo que se le asigna (inferido: filtro `own`) | 10:25–10:35 | **Cubierto** (roles, scope `own`) |
| RQ-02 | Rol Administrador con vista general de todo y monitoreo de todo el equipo | Alta | El administrador ve los leads, las actividades y el dashboard de todos | 10:35, 11:20, 32:30 | **Cubierto** (admin con 126 permisos) |
| RQ-03 | Rol Gerente/Supervisor ("manager") como categoría propia | Alta | Existe el rol; algunos permisos, como asignar leads, solo se activan si el Administrador los concede | 1:04:42–1:05:12 | **Parcial**: diseñado en §4 (migración 0014), sin implementar |
| RQ-04 | Permisos por persona: el Administrador concede capacidades sueltas (por ejemplo, asignar leads) a cualquier usuario | Alta | Se puede activar o desactivar una capacidad para un usuario concreto sin cambiarle el rol; queda auditado (inferido) | 1:04:54–1:05:07 | **Parcial**: `user_permission_overrides` diseñado, sin implementar |
| RQ-05 | Asignar y reasignar un lead a un broker o asesor | Alta | Desde la ficha del lead: quitar al responsable, poner otro y guardar; el campo "asesor responsable" se puede editar | 44:57–45:12, 1:04:13–1:05:49 | **Falta** en el plan (no se menciona el flujo de asignación) |
| RQ-06 | Historial de responsables del lead: quién lo captó, quién le da seguimiento y quién cerró | Alta | La ficha muestra los tres roles con sus fechas; no se pierde al reasignar (inferido) | 1:05:49–1:06:01, 1:13:05 | **Falta** |
| RQ-07 | Notas o bitácora de interacciones con el cliente (llamó, no contestó, interesado…) para quien lo reciba después | Alta | Registro cronológico visible al nuevo asignado | 1:06:11–1:06:37 | **Falta** (no está en el plan) |
| RQ-08 | Leads multicanal: Meta/Facebook, página web, WhatsApp y entrada manual; categorías de origen configurables | Alta | Cada lead guarda su canal; el usuario puede crear un origen nuevo | 42:46–43:57 | **Falta** |
| RQ-09 | Ficha del lead con proyecto de interés, vía, presupuesto, zona, operación, estado de asignación, fecha de ingreso y acceso directo a WhatsApp | Alta | Campos visibles y filtrables; botón que abre WhatsApp | 42:01–42:25, 44:25–44:54 | **Falta** |
| RQ-10 | Acciones sobre el lead: convertir a negocio, registrar contacto o próxima tarea, descartar | Alta | Tres acciones disponibles; el descarte guarda el motivo (inferido) | 45:14–45:37 | **Parcial**: el E2E lead → negocio está en el backlog #3 |
| RQ-11 | Distribución de leads orgánicos: el Administrador reparte de forma equitativa según la carga de cada broker | Media | Vista de leads por broker y semana para decidir; asignación manual (la regla automática no está definida) | 45:50–46:30, 1:03:44 | **Falta** |
| RQ-12 | Enlace personalizado por broker y proyecto (también para videos de YouTube): el lead que entra por él se asigna o atribuye a ese broker | Media | Se genera el enlace en el CMS; el lead entrante queda con ese broker; integración en el CRM pendiente | 46:43–49:47, 1:03:31–1:04:11 | **Falta** |
| RQ-13 | Analítica de comportamiento en la página: tiempo en cada proyecto y videos vistos, visibles en el lead | Media | El lead muestra los proyectos vistos y el tiempo (por ejemplo, "25 min en X") | 06:39–06:59, 08:31–09:17, 51:01 | **Falta** |
| RQ-14 | Pipeline "Negocios" con Kanban de arrastrar y soltar o botón "mover etapa"; etapas configurables | Alta | Se pueden crear, editar y añadir etapas intermedias; se puede mover por arrastre y por botón | 21:14–21:26, 57:06–57:53 | **Falta** (el backlog #4 de la demo menciona un fallo al mover leads) |
| RQ-15 | Reglas para cambiar de etapa: hay que registrar al menos una actividad; requisitos configurables por etapa (por ejemplo, pasaporte para pasar de bloqueo a reserva) | Alta | Sin actividad aparece el aviso "debe registrar al menos una actividad"; los campos obligatorios se configuran por etapa | 59:16–1:01:03 | **Falta** |
| RQ-16 | Cierre sin venta con motivo obligatorio | Alta | No se puede marcar como "perdido" sin una descripción | 21:37–21:57 | **Falta** |
| RQ-17 | Agenda y tareas: calendario y lista; categorías por color (reunión, visita, llamada de seguimiento); tipo, prioridad y estado; vista móvil | Alta | Vista mes/día y lista; formulario de actividad; usable en móvil | 05:45–05:58, 33:58–36:14 | **Parcial**: las pantallas cargan en móvil (§3); el flujo con escritura tarea → agenda está pendiente (#3) |
| RQ-18 | Integración con Google Calendar, con recordatorio en el teléfono (por ejemplo, 1 hora antes) | Alta (muy pedida por el equipo) | La cita creada en el CRM aparece en el Google Calendar del usuario y avisa en el móvil | 05:25–05:40, 35:04–35:36, 1:07:48–1:08:03 | **Falta** |
| RQ-19 | To-do por broker: el Administrador asigna tareas con prioridad; el broker las ve ordenadas de mayor a menor prioridad, recibe un aviso y, al completarlas, el Administrador recibe un aviso con la hora | Alta | Notificación de asignación; orden por prioridad; aviso de "hecho a las hh:mm"; la tarea queda pendiente hasta que se marca | 05:58–06:16, 36:28–38:22 | **Parcial**: el plan sugiere un recurso `tasks` separado (§4.4) |
| RQ-20 | Notificaciones en el portal del usuario (nueva tarea asignada, etc.) | Media | Un indicador o lista de avisos en la app | 06:06 | **Falta** |
| RQ-21 | Metas trimestrales de la inmobiliaria (meta general por trimestre, revisable cada trimestre) | Alta (arranque con la meta del trimestre) | Se define la meta por trimestre; se ven el acumulado real, el % de avance, lo que falta y los días restantes | 16:16–19:17, 1:09:47 | **Parcial**: existen las tablas `teams` para Metas y el permiso `goals`; el modelo trimestral no se describe |
| RQ-22 | Avance semanal de la meta con días hábiles (lunes a viernes, o lunes a sábado; domingos excluidos) y gráfico de línea "ritmo ideal vs real" | Media | Corte semanal; gráfico con la línea objetivo semanal; tendencias por mes y trimestre | 20:05–20:43, 22:17–22:43, 24:49–25:17 | **Falta** (el backlog #8 corrige solo el render de los gráficos) |
| RQ-23 | Qué se hizo en cada semana: actividades por broker (llamadas → cierres) ligadas al avance | Media | Vista semanal con actividades y resultados por broker (inferido: viene del pipeline) | 20:55–21:08 | **Falta** |
| RQ-24 | Metas individuales opcionales y ranking de asesores (top 1-2-3; una "copa" visual como en Duolingo, por definir) | Baja (las metas individuales "se hablarán después") | Ranking por % de cumplimiento; leaderboard en Red de brokers | 18:48–19:13, 24:06–24:45, 1:09:14–1:11:49 | **Falta** |
| RQ-25 | Diseño del gráfico de metas por votación del equipo | Baja | El equipo de desarrollo presenta varias opciones | 19:40, 22:04 | — (decisión de diseño) |
| RQ-26 | Red de brokers: lista de brokers activos; asignar proyectos a cada broker; el broker solo recibe avisos de sus proyectos | Media | Selección de proyectos por broker; avisos filtrados | 1:07:22–1:07:46 | **Parcial**: existe /brokers (auditada); asignar proyectos no figura |
| RQ-27 | Proyectos/inventario: búsqueda y filtros (zona, metros, habitaciones, precio); ficha con barra de % de campos completos; zona y ubicación en el mapa | Alta | Filtros que funcionan; el porcentaje sube al completar campos; el enlace de ubicación pinta el punto en el mapa | 03:37–04:24, 15:08–15:16, 53:12–56:42 | **Parcial**: las pantallas existen; en la demo **el mapa no se pintó** (55:43) |
| RQ-28 | Campo desarrolladora o constructora en el proyecto (opcional, con la zona como eje principal) | Media | El proyecto tiene una etiqueta de desarrolladora; se puede filtrar por ella (inferido) | 1:14:20–1:17:12 | **Falta** |
| RQ-29 | Acceso directo a la documentación del Drive del cliente desde el CRM | Media | Enlace al Drive desde el proyecto o el módulo | 30:15–30:45 | **Falta** |
| RQ-30 | Dashboard de inicio personalizado por usuario: leads del mes, negocios activos, monto, cierres del mes, captaciones, accesos directos, leads que requieren atención y próximas actividades | Alta | El broker ve sus números; el administrador ve el total | 30:48–33:21 | **Parcial**: la pantalla carga (auditoría); los datos por usuario y `team` dependen del RBAC (#10) |
| RQ-31 | Analítica del pipeline: conteo por etapa y gráficos de pedidos, negociados y cerrados (3 vistas) | Media | Conteos por etapa correctos | 58:16–58:52 | **Parcial**: el backlog #8 arregla el render de los gráficos |
| RQ-32 | Reportes por broker exportables | Media | Se puede exportar (formato no definido) | 22:55–23:22 | **Falta** |
| RQ-33 | Academy (estilo Moodle): contenido de capacitación (texto o video) y quizzes con puntaje y reintentos | Baja (en desarrollo) | El administrador crea un curso y un quiz; el broker lo hace y ve su %; puede reintentar | 38:50–40:33 | **Parcial**: existe /academy/administracion (#4 error #418) |
| RQ-34 | Comisiones estándar por ahora (la división captación/seguimiento/cierre queda para más adelante) | Baja | Una regla de comisión simple; el reparto porcentual por rol queda como configurable a futuro (inferido) | 1:13:05–1:14:15 | **Parcial**: hay pantallas de comisiones; el modelo no se describe |
| RQ-35 | Videos alojados en YouTube y mostrados en la página (no subidos al servidor); el broker puede publicar videos propios (por negociar con el dueño) | Baja (portal/CMS) | Embed de YouTube; opción de broker como autor | 51:08–53:08 | — (CMS/portal, fuera del plan del CRM) |
| RQ-36 | Seguridad y disponibilidad: pruebas de intrusión y alerta de caída tras cada despliegue | Alta | Alerta si el sitio no responde; verificación posterior al despliegue | 1:19:54–1:22:30 | **Cubierto**: `remoto.sh` comprueba `/api/health` y revierte (§2) |
| RQ-37 | Entrega con inducción: un documento por sección con capturas, videos y un mes de capacitación con casos reales del cliente | Media | Guía por módulo y sesiones con casos | 29:13, 1:23:30–1:24:27 | **Falta** |
| RQ-38 | Fecha de entrega comprometida: noviembre (posible) | Alta | Los módulos de flujo (leads, negocios, inventario, agenda/tareas, comunicaciones, metas) estables para noviembre | 1:12:20–1:12:37, 1:19:21, 1:21:28 | **Falta**: el plan no tiene calendario; estimación RBAC de 2–3 pasadas |

**Total: 38 requisitos** (RQ-01…RQ-38).

## 3. Principales brechas frente a PLAN-EQUIPO
1. **El flujo de leads no figura en el plan.** Faltan la asignación y reasignación (RQ-05), el historial captó/siguió/cerró (RQ-06), la bitácora de notas (RQ-07), el origen multicanal y los enlaces por broker (RQ-08, RQ-12), y el reparto equitativo (RQ-11). El RBAC del plan cubre quién puede hacer cada cosa, pero no esta lógica.
2. **Reglas del pipeline.** No están en el plan el bloqueo del cambio de etapa sin actividad, los campos obligatorios por etapa (pasaporte para reservar) ni el motivo obligatorio de pérdida (RQ-14 a RQ-16). En la demo **falló mover leads** (1:19:35).
3. **Google Calendar con recordatorios** (RQ-18) es lo que más pidió el equipo y el plan no lo contempla. Tampoco están las notificaciones de tareas asignadas y completadas (RQ-19, RQ-20).
4. **Metas trimestrales.** Faltan el corte semanal en días hábiles, el gráfico "ritmo vs real", el ranking y la vista por semana (RQ-21 a RQ-24). El plan solo crea `teams` para Metas y arregla errores de render.
5. **RBAC.** La fuente confirma el diseño del §4: rol manager más permisos concedidos por persona. Pero **no hay una matriz formal**: falta que el cliente defina qué hace el Gerente/Supervisor por defecto y qué ve el broker. Además, el **mapa de proyectos no se pintó** en la demo (RQ-27) y no hay cronograma para la meta de **noviembre** (RQ-38).

## 4. Pendiente de confirmar con el cliente
- La matriz formal de permisos del Gerente/Supervisor y del Broker; la fuente solo trae ejemplos.
- La regla de reparto de leads (manual o automática) y la regla de comisiones futura.
- Las metas: la cifra exacta del primer trimestre (se mencionan 1 y 3 millones de forma ambigua) y si se cuenta de lunes a viernes o de lunes a sábado.
