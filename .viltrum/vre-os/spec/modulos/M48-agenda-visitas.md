---
id: M48
nombre: "Agenda, visitas y colas de tareas (UI-026–029)"
estado: REVIEW
riesgo: R3
owner: D10
revisores: [D03, D12]
fuente_de_verdad: PostgreSQL local
depende_de: [M40, M43, M47, M50]
actualizado: 2026-10-18
---

# M48 · Agenda, visitas y colas de tareas

## 1. Propósito y usuarios

**Problema:** coordinar la agenda comercial, organizar visitas de varias paradas y conservar el resultado y la siguiente acción; mantener tareas con responsable, vencimiento y contexto. Es una necesidad inferida del catálogo, no confirmada en entrevista (.viltrum/vre-os/fuentes/backlog-Pantallas.csv:30-33; .viltrum/client-inputs.md:1).

**Usuarios:** personas con permisos vigentes de agenda y actividades; brokers externos autenticados que participan en una visita y tienen concesión vigente según M50; usuarios de móvil. La traducción de estos usuarios a los roles existentes sigue pendiente de Q-004. El cargo visual nunca concede acceso.

**Verbos del negocio:** consultar, programar, invitar, confirmar, cancelar, recorrer, registrar llegada, registrar resultado, crear tarea, completar, bloquear y reasignar.

**Alcance:** una sola empresa, Quisqueya Home, conforme a decisión #51 (docs/contexto/decisiones.md:348-356). Incluye UI-026 Agenda y disponibilidad, UI-027 Visita y recorrido, y UI-029 Tareas y colas, todos P0. UI-028 y las capacidades avanzadas de §9 quedan fuera. No introduce tenant_id, sucursales, MFA ni roles nuevos.

**Estado de discovery:** G1 permanece en REVIEW. Las decisiones del cliente listadas en §9 deben cerrarse antes de promover a READY. La cobertura de filas de pantalla no equivale a porcentaje ponderado.

## 2. Estado actual (AS-IS)

Lectura estática local; no demuestra comportamiento de base viva, permisos efectivos ni conexión externa.

| Evidencia | Hecho comprobado y límite |
|---|---|
| src/app/(crm)/agenda/page.tsx:27-70; agenda/vista.tsx:183-225, 269-372, 397-495, 774-778 | La agenda consulta una semana, ofrece semana/día/lista, filtro por tipo, ICS y apertura de una plantilla de Google Calendar. No demuestra vista mensual, invitaciones ni sincronización. |
| src/app/(crm)/tareas/vista.tsx:97-120, 218-259, 295-297, 354-428, 662-690, 789-794, 823-925 | La cola existente ordena actividades por vencidas/hoy/próximas y permite crear, editar y completar con resultado. No demuestra dependencias, impedimentos ni bandeja de transición. |
| src/infrastructure/db/schema.ts:807-874 | activities es la entidad canónica de citas, tareas, llamadas y notas; activity_sync guarda vínculos externos. activities hoy no tiene timezone, origen, dependencias, visitas ni participantes múltiples. |
| src/app/api/actividades/route.ts:24-76; src/app/api/actividades/[id]/route.ts:20-89; src/app/api/actividades/ics/route.ts:16-19 | Las rutas existentes usan Zod y permisos; ICS requiere actor y permiso. La ruta por ID existente no prueba el contrato nuevo de visitas. |
| src/application/actividades/casos-de-uso.ts:55, 98, 108; src/domain/catalogs.ts:69-100 | Hay auditoría de actividades y catálogo cerrado de entidades; visit, visit_stop, event_attendee y task_dependency aún no están enumeradas. |
| src/infrastructure/db/schema.ts:807-874; drizzle/0001_enable_rls_public_tables.sql:17-18 | El esquema Drizzle consultado no muestra .enableRLS() para estas tablas; una migración previa sí activa RLS en activities y activity_sync. El estado y grants efectivos de la base no se verificaron. |
| M41-correcciones-1018.md:39, 47-78; fichas M40, M47 y M50 | M48 no reabre funciones de M41, no altera reservas/pagos/comisiones de M40 y debe reutilizar el alcance de inventario M47 y la concesión de brokers M50. La base real de estas dependencias no se verificó. |

## 3. Pantallas

**Ubicación:** módulo N1 Agenda y Tareas, entrada #6 del árbol D04. Las rutas son propuestas de esta ficha; las pantallas nuevas no se consideran implementadas.

| Pantalla P0 | Contenido y acciones | Alcance de acceso |
|---|---|---|
| **UI-026 Agenda y disponibilidad** /agenda | Vistas día/semana/mes de visitas, llamadas y tareas; horas en UTC con zona IANA del evento; organizador, participantes, ubicación, proyecto, estado y origen. Crear, mover con alternativa accesible, invitar/confirmar/cancelar con motivo y exportar ICS. Filtros de responsable, proyecto, tipo, estado y origen. Conflictos y traslados se presentan según la decisión Q-001. | Permiso de servidor y alcance de cada actividad. La agenda compartida solo muestra “ocupado” cuando faltan permisos sobre sus detalles. |
| **UI-027 Visita y recorrido** /visitas/:publicId | Visita con varias paradas, proyecto y unidad autorizados, orden, hora, duración, punto de encuentro, confirmaciones, llegada manual opcional, resultado y próxima acción. Reordenar, invitar a una cuenta autenticada, confirmar, cancelar una parada con motivo y volver a consultar disponibilidad. Programar no reserva inventario. | Acceso autenticado a la visita y sus padres. Un broker solo recibe la proyección permitida por su invitación y concesión M50. No hay enlace anónimo en P0. |
| **UI-029 Tareas y colas** /tareas | Actividad de tipo tarea, expediente, responsable, vencimiento, prioridad, estado, origen manual/automático, dependencia e impedimento. Crear, completar con resultado/evidencia cuando la regla lo requiera, reprogramar, delegar, añadir subtarea y registrar impedimento. Las tareas críticas pasan a una bandeja de transición al salir su responsable. | Permiso de actividades y alcance del expediente. Reasignar exige permiso sobre la tarea y acceso del nuevo responsable al expediente. |

**Presentación y estados**

- En 320/390 px la agenda usa tarjetas/lista y filtros en hoja inferior, sin desplazamiento horizontal; la ficha de visita usa hoja inferior bajo 768 px. En 768/1440 px conserva filtros y controles de escritorio (D04-arquitectura-ui.md:402-410).
- Las tres pantallas implementan carga, vacío, error, sin conexión, éxito y permiso insuficiente. El estado de error conserva datos y filtros; el estado sin conexión indica posible antigüedad y bloquea escrituras. Solo el servidor puede confirmar éxito o disponibilidad.
- Conflicto, cambio de disponibilidad, invitación pendiente y permiso denegado tienen texto y acción de recuperación; no dependen solo del color.
- Teclado y control alternativo a arrastrar, foco, etiquetas y tamaños táctiles se revisan en D07/D14.
- UI-028 Viaje de inspección e incentivos es P1, excluida; no crear pantalla, tabla, ruta, política de incentivo ni reembolso (backlog-Pantallas.csv:32; D21-ensamblaje-oss.md:38).

## 4. Funciones (casos de uso)

Las rutas de visitas y dependencias son propuestas; aún no existen. Actividades continúa como fuente canónica para eventos y tareas.

| Caso de uso | Entrada y reglas | Salida y errores | Permiso, auditoría e idempotencia |
|---|---|---|---|
| Consultar agenda | Query Zod estricta; rango finito; filtros de responsable/proyecto/tipo/estado/origen. | Eventos dentro del alcance; los demás se proyectan como ocupado. 400 si el rango es inválido. | activities:view; consulta filtrada por visibleRows/reaches. |
| Crear, editar o cancelar evento | JSON Zod con campos permitidos; inicio/fin UTC, zona IANA, duración y motivo de cancelación. fin > inicio. Validar zona con Intl; asignar cada campo desde el objeto parseado. | 201/200; 422 por campo; 409 por conflicto o versión obsoleta. Cancelar conserva fila, motivo y auditoría. | activities:create/edit; permiso del expediente y proyecto. |
| Crear recorrido | POST /api/visitas requiere Idempotency-Key UUID, oportunidad/cliente autorizados y lista ordenada de paradas. Cada unidad debe pertenecer al proyecto indicado. No acepta IDs ajenos ni crea hold/reserva. Se calcula SHA-256 del cuerpo Zod normalizado; misma clave y hash retorna el recorrido previo; misma clave con otro hash responde 409. | 201 con UUID público del recorrido; 422 estructura inválida; 404 padre no visible; 409 por conflicto o versión obsoleta. | activities:create y lectura autorizada de cada padre; auditoría de visita/paradas; clave y hash se persisten en la transacción que crea actividad, visita y paradas. |
| Consultar/cambiar recorrido o parada | GET/PATCH /api/visitas/:visitPublicId; PATCH /api/visitas/:visitPublicId/tramos/:stopPublicId. Validar ambos parámetros con z.string().uuid(), buscar por public_id y validar que la parada pertenece a la visita. No usar idsDeRuta para UUID. | 200; 404 para inexistente o ajeno; 409 para versión obsoleta; 422 para orden/transición inválida. Cancelar parada conserva su ordinal y no borra las demás. | activities:view/edit más reachesVisita; auditoría de cambios. Notificaciones externas se difieren en §9. |
| Invitar o confirmar participante | POST /api/visitas/:visitPublicId/participantes registra un usuario/contacto validado; PATCH /api/visitas/:visitPublicId/participantes/me cambia la respuesta del usuario CRM autenticado. Un contacto sin sesión puede ser registrado por personal autorizado, sin enlace público. | Respuesta pending/accepted/declined/tentative; conservar actor y hora. La invitación no concede permiso general al CRM. | activities:create/edit o acción de respuesta del invitado exacto; auditar respuesta bajo event_attendee. |
| Registrar llegada y resultado | Llegada es manual y opcional; resultado narrativo en visits.result_note; crear la próxima acción como actividad task relacionada. GPS no se recopila por defecto. | Actualización confirmada por servidor; no completar tarea ni registrar venta/pago por inferencia. | Permiso de visita y padres; auditar llegada, resultado y tarea. |
| Crear o editar tarea | activityType="task"; Zod valida descripción, responsable, expediente, prioridad, vencimiento, origen, impedimento y criticidad. El servidor confirma acceso del responsable al objeto relacionado. | 201/200; 422 campo inválido; 404 referencia ajena; 409 por versión obsoleta. | activities:create/edit; asignación campo por campo y auditoría. Esta ficha no crea automatizaciones nuevas; su idempotencia se especifica en el expediente que las despache. |
| Delegar, completar o cambiar dependencias | Dependencias entre actividades tipo task; rechazar vínculo consigo misma y ciclos por tipo de relación. No completar tarea con bloqueadores abiertos o impedimento activo. La salida de agente crea una bandeja auditable para reasignar tareas marcadas críticas. | 200; 404 fuera de alcance; 409 versión obsoleta; 422 vínculo/ciclo/transición inválida. | activities:edit; delegación requiere acceso del nuevo responsable al expediente. El usuario que procesa la salida y la regla de evidencia se resuelven en Q-005. |
| Exportar agenda | ICS generado en servidor con filtro del actor; conservar la convención vigente. | text/calendar; no incluye eventos fuera del alcance. | activities:view; no es sincronización bidireccional. |

**Autorización por visita**

Todas las rutas autentican primero y comprueban requireScope/requireFullScope antes de leer o mutar datos. Los cuerpos y queries se validan con Zod, y el DTO se construye con campos permitidos; nunca se asigna ...body.

reachesVisita(actor, visitId, action) es un predicado de aplicación sobre la visita, su actividad canónica y sus padres:

1. Requiere el scope vigente de actividades para la acción solicitada.
2. Para personal CRM, permite si visibleRows alcanza la actividad o reaches alcanza el negocio/proyecto relacionado.
3. Para broker externo, exige invitación de usuario autenticado en event_attendees y concesión activa M50 para cada proyecto/unidad cuyos detalles solicita. La invitación sola no concede lectura de contacto, inventario ni expediente.
4. Si solo puede ver el compromiso del invitado, devuelve busy. No revela existencia de visitas no alcanzables.

VisitaBrokerDTO es una proyección positiva: visitPublicId, horas, zona IANA, estado pending/completed/cancelled, respuesta del propio participante y paradas autorizadas con identificadores públicos, orden, hora, duración y estado. El proyecto/unidad y punto de encuentro solo se incluyen cuando la concesión M47/M50 y visibility=full lo permiten. Excluye result_note, notas privadas del anfitrión, access_notes, datos personales de contactos no vinculados, precios internos, comisiones, IDs seriales y datos de otras paradas no autorizadas. No existe ruta de itinerario anónimo en P0.

## 5. Datos

**Fuente canónica:** PostgreSQL existente. calendar_events y tasks son nombres lógicos del backlog; no se duplican las tablas canónicas activities ni activity_sync.

### 5.1 Contrato físico propuesto

D11 materializa este contrato de forma aditiva. Los tipos citados son PostgreSQL y corresponden a serial, integer, text, boolean, uuid y timestamptz en Drizzle.

| Tabla | Columnas y restricciones |
|---|---|
| activities existente | Añadir timezone text NOT NULL DEFAULT 'America/Santo_Domingo'; origin text NOT NULL DEFAULT 'manual' CHECK (origin IN ('manual','automation')); impediment_reason text NULL; is_critical boolean NOT NULL DEFAULT false. Validar timezone como zona IANA mediante Intl en el servidor. Solo tareas usan origin, impediment_reason e is_critical; conservar activity.status, assignee_id, instantes UTC y claves actuales. |
| visits nueva | id serial PRIMARY KEY; public_id uuid NOT NULL DEFAULT gen_random_uuid() con UNIQUE; activity_id integer NOT NULL UNIQUE REFERENCES activities(id) ON DELETE RESTRICT; create_command_key uuid NOT NULL UNIQUE; request_hash bytea NOT NULL CHECK (octet_length(request_hash) = 32); result_note text NULL; created_at timestamptz NOT NULL DEFAULT now(); updated_at timestamptz NOT NULL DEFAULT now(); created_by integer NOT NULL REFERENCES users(id) ON DELETE RESTRICT; updated_by integer NULL REFERENCES users(id) ON DELETE RESTRICT; version integer NOT NULL DEFAULT 1 CHECK (version > 0). La aplicación exige que la actividad referenciada tenga activity_type=meeting. El estado programado/completado/cancelado deriva de activities.status; no se duplica. |
| visit_stops nueva | id serial PRIMARY KEY; public_id uuid NOT NULL DEFAULT gen_random_uuid() con UNIQUE; visit_id integer NOT NULL REFERENCES visits(id) ON DELETE RESTRICT; ordinal integer NOT NULL CHECK (ordinal > 0); project_id integer NOT NULL REFERENCES projects(id) ON DELETE RESTRICT; unit_id integer NULL REFERENCES units(id) ON DELETE RESTRICT; starts_at timestamptz NOT NULL; duration_minutes integer NOT NULL CHECK (duration_minutes > 0); meeting_point text NULL; access_notes text NULL; status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','arrived','completed','cancelled')); arrived_at timestamptz NULL; cancellation_reason text NULL; created_at timestamptz NOT NULL DEFAULT now(); updated_at timestamptz NOT NULL DEFAULT now(); created_by integer NOT NULL REFERENCES users(id) ON DELETE RESTRICT; version integer NOT NULL DEFAULT 1 CHECK (version > 0). Añadir UNIQUE (visit_id, ordinal) y CHECK (status <> 'cancelled' OR (cancellation_reason IS NOT NULL AND length(btrim(cancellation_reason)) > 0)). Si hay unidad, el servidor verifica que pertenece a project_id. Cancelar conserva el ordinal original. |
| event_attendees nueva | id serial PRIMARY KEY; activity_id integer NOT NULL REFERENCES activities(id) ON DELETE CASCADE; user_id integer NULL REFERENCES users(id) ON DELETE RESTRICT; contact_id integer NULL REFERENCES contacts(id) ON DELETE RESTRICT; CHECK ((user_id IS NOT NULL AND contact_id IS NULL) OR (user_id IS NULL AND contact_id IS NOT NULL)); response text NOT NULL DEFAULT 'pending' CHECK (response IN ('pending','accepted','declined','tentative')); visibility text NOT NULL DEFAULT 'full' CHECK (visibility IN ('full','busy')); responded_at timestamptz NULL; created_at timestamptz NOT NULL DEFAULT now(); created_by integer NOT NULL REFERENCES users(id) ON DELETE RESTRICT. Índices únicos parciales (activity_id,user_id) cuando user_id IS NOT NULL y (activity_id,contact_id) cuando contact_id IS NOT NULL; índice por activity_id. No requiere public_id, pues no tiene ruta externa propia. |
| task_dependencies nueva | id serial PRIMARY KEY; task_id integer NOT NULL REFERENCES activities(id) ON DELETE RESTRICT; depends_on_id integer NOT NULL REFERENCES activities(id) ON DELETE RESTRICT; dependency_type text NOT NULL CHECK (dependency_type IN ('blocks','subtask')); created_at timestamptz NOT NULL DEFAULT now(); created_by integer NOT NULL REFERENCES users(id) ON DELETE RESTRICT; CHECK (task_id <> depends_on_id); UNIQUE (task_id,depends_on_id,dependency_type); índices por ambos IDs. En blocks, task_id espera a depends_on_id; en subtask, task_id es padre de depends_on_id. El caso de uso verifica que ambos sean tareas y previene ciclos transaccionalmente. No requiere public_id, pues no se expone como recurso independiente. |

activity.status mantiene el catálogo existente pending/completed/cancelled. “Bloqueada” es una condición derivada: impedimento no resuelto o dependencia blocks sin completar; no se añade un cuarto estado incompatible. Cambiar impediment_reason a vacío o completar la dependencia puede desbloquearla. result_note es narrativa; no se inventa un catálogo de resultados comerciales. task_dependencies comprueba ciclos por separado para blocks y subtask.

El timezone de evento conserva la zona en que se programó; starts_at/ends_at siguen siendo instantes UTC. El servidor valida el identificador IANA y usa Intl al presentar en la zona del evento o del invitado. La zona por evento es una ampliación propuesta a la decisión #24 y requiere ratificación D01/Wilber en Q-009 antes de READY; no cambia los instantes almacenados.

### 5.2 Índices, auditoría y límites

- La migración de visits, visit_stops y event_attendees requiere activities, projects, units, contacts y users. La migración de dependencias requiere activities y solo admite actividades de tipo task.
- Añadir visit, visit_stop, event_attendee y task_dependency a ENTITY_TYPES en src/domain/catalogs.ts; cambios de participantes se auditan como event_attendee. Auditar altas, edición, cancelación, respuesta, llegada, resultado y cambios de dependencias; conservar autor/fecha.
- Cada tabla nueva lleva .enableRLS() en schema.ts y ENABLE ROW LEVEL SECURITY en su migración. Los endpoints son server-only; no crear políticas de lectura directa mientras no exista un caso autorizado de cliente. D11/D12 verifican rol PostgreSQL efectivo y grants antes de habilitar cualquier acceso adicional (docs/contexto/flujo-de-trabajo.md §6).
- Las FKs de historia usan ON DELETE RESTRICT, salvo la asociación event_attendees.activity_id que se elimina en cascada con su actividad. El flujo normal usa borrado lógico en actividades y conserva auditoría.
- public_id solo se expone para visitas y paradas; nunca exponer PK serial en enlaces. No hay tenant_id para la empresa única (#51). No tocar reservas, holds, pagos, comisiones ni guardas M40.

### 5.3 Disponibilidad y concurrencia

La disponibilidad se reconsulta al crear o modificar un recorrido. El estado leído no crea reserva ni bloquea una unidad. UNIQUE(visit_id, ordinal) protege orden; cancelar una parada mantiene su ordinal y no renumera las restantes. Reordenar es una mutación versionada del recorrido/paradas y ante versión obsoleta devuelve 409. La política ante solapamiento/tiempo de traslado se rige por Q-001.

### 5.4 Tareas

origin distingue entrada manual de automatización existente; esta ficha no crea nuevas automatizaciones. impediment_reason conserva la explicación introducida por una persona autorizada. is_critical es una marca explícita, independiente de prioridad. La salida de un responsable no borra ni completa tareas: las marcadas críticas aparecen en la bandeja de transición y exigen reasignación por un actor autorizado según Q-005. La tarea permanece en activities; dependencias y subtareas se conservan en task_dependencies.

### 5.5 Evolución no incluida en DDL P0

No añadir ahora calendar_connections, sync_cursors, tokens de itinerario, tabla de idempotencia externa ni artefactos de viaje. La idempotencia de creación del recorrido se guarda en visits. activity_sync queda intacta hasta que se aprueben proveedor y dirección de sincronización en Q-002.

## 6. Integraciones y puertos

- **Agenda visual:** evolucionar el componente React/Tailwind ya presente en src/app/(crm)/agenda/vista.tsx; mantener la exportación ICS. La rebanada P0 no instala Schedule-X ni otra dependencia. Si se desea sustituir el componente, D21 debe revisar el expediente y abrir una rebanada separada; la existencia del expediente Schedule-X no demuestra que el paquete esté instalado (D21-ensamblaje-oss.md:19, 38, 97, 230).
- **Calendario externo:** sincronización unidireccional/bidireccional, tokens, cursores, recuperación de 429/timeout y revocación son Fase B, fuera de P0 y no despachables sin Q-002 y expediente D21. ICS es exportación generada en servidor; activity_sync no se modifica conforme a decisión #25 (docs/contexto/decisiones.md:131-135).
- **Autoridad:** PostgreSQL/CRM conserva agenda, permisos, visitas, respuestas y disponibilidad registrada. Ningún proveedor externo confirma reserva o amplía permisos. Los accesos a proyecto/unidad reutilizan los predicados de M47/M50; no duplicar concesiones.
- **Fallo de proveedor futuro:** conservar el evento CRM, mostrar sincronización pendiente/error y no interpretar una página incompleta como borrado. Este contrato se completa al abrir Fase B, no habilita su implementación ahora.

## 7. Métricas y reportes que alimenta

- **Agenda:** eventos programados, confirmados, cancelados, por origen y conflictos reportados, siempre en el alcance autorizado.
- **Visitas:** recorridos por estado derivado, paradas completadas/canceladas, llegada manual y resultado registrado.
- **Tareas:** abiertas, vencidas, sin fecha, bloqueadas, críticas en transición, y completadas con resultado.
- No publicar ranking personal ni inferir visita, venta o pago desde una tarea completada. Los objetivos numéricos, volumen esperado, concurrencia, retención y latencia deben fijarse en Q-008 y Q-007 antes de READY; hoy no están confirmados.

## 8. Criterios de aceptación (verificables)

Los criterios son oráculos futuros de P0; no se ejecutaron como parte de esta corrección documental.

1. **Agenda:** una persona autorizada consulta día/semana/mes y filtros de responsable, proyecto, tipo, estado y origen; crea, edita, cancela con motivo y exporta ICS. Prueba de componente, API y E2E.
2. **Zona horaria:** se persiste zona IANA de evento y se conserva el instante UTC; anfitrión e invitado ven la hora correcta con Intl, incluido QA-030 de cambio estacional. Prueba de contrato con zonas distintas.
3. **Conflicto:** el resultado de solape/traslado coincide con la política aprobada en Q-001; los eventos fuera de alcance solo se muestran ocupados. Pruebas API, privacidad y concurrencia.
4. **Recorrido:** crear varias paradas de proyectos autorizados, reconsultar disponibilidad, registrar llegada/resultado y crear próxima acción. Cancelar una parada conserva su ordinal y las demás; probar caso de uso, API y E2E.
5. **Autorización de visita:** scopes antes de datos; acceso por reachesVisita; IDs UUID consultados por public_id; broker sin concesión no recibe detalles de inventario. Prueba hostil own/all, 404 y DTO positivo.
6. **Participantes:** respuestas válidas, unicidad por usuario/contacto y sin permiso general por invitación; un contacto sin sesión no obtiene acceso anónimo. Prueba de caso de uso y API.
7. **Tarea y dependencias:** crear/reprogramar/delegar, cambiar origen, registrar impedimento y subtarea; ciclos, actividad no-task, autorreferencia o completar con bloqueador activo fallan con error específico. Pruebas unitarias, API y DB para FKs/checks.
8. **Transición:** al salir un responsable, todas las tareas marcadas críticas aparecen en bandeja auditable y no se cierran hasta asignación autorizada. Prueba de caso de uso y concurrencia.
9. **Datos y auditoría:** migraciones aditivas, FKs, únicos, checks, .enableRLS(), RLS SQL y ENTITY_TYPES; probar en DB desechable y verificar rol/grants con D11/D12.
10. **Calendario externo:** P0 verifica ICS autorizado y ausencia de datos ajenos; no exige conexión externa. La sincronización solo se acepta en Fase B tras sus gates.
11. **Estados y móvil:** carga, vacío, error, sin conexión, éxito y permiso insuficiente a 320/390 px; revisión adicional a 768/1440 px, teclado, foco, etiquetas y alternativa a arrastrar; sin desborde horizontal.
12. **Privacidad y errores:** API valida Zod, permiso antes de datos y cada objeto relacionado; cuerpos asignados campo por campo; no hay escritura offline ni afirmación de éxito/disponibilidad desde caché obsoleta. Prueba de rutas y revisión D12.

## 9. Fuera de alcance y preguntas abiertas

### 9.1 Evolución excluida / Fase B

- UI-028, viajes de inspección, gastos, incentivos y reembolsos.
- Multiempresa/G12/tenant_id, sucursales, MFA/AAL2, roles nuevos y jerarquías de equipos.
- Enlaces anónimos con token para visitantes, portal público de respuestas, invitaciones complejas, avisos por correo/WhatsApp y expiración automática de invitación. P0 requiere sesión CRM y participantes registrados.
- Sincronización externa de calendario, conexión/cursor/tokens y reparación avanzada de fallos; no despachar la rebanada Fase B antes de cerrar Q-002 y aprobar expediente D21.
- Escrituras offline, cola/reconciliación de cambios offline, persistencia privada en navegador y geolocalización continua/historial.
- Automatizaciones nuevas, ranking personal, aprobaciones multinivel, política de incentivos y dependencia de Schedule-X.
- Borrado físico de actividades/visitas/paradas; el flujo P0 conserva historia y auditoría.

### 9.2 Preguntas que bloquean G1/READY

| ID | Pregunta pendiente | Responsable | Efecto |
|---|---|---|---|
| Q-001 | Para solape o tiempo insuficiente de traslado, ¿se permite, se advierte o se bloquea y quién resuelve la excepción? | Cliente / D01-D02 | Bloquea contrato de conflicto P0. |
| Q-002 | ¿Qué calendario externo, dirección de sincronización, política de 429/timeout/revocación y responsable de fallos? | Cliente / D21-D03-D16 | Bloquea solo Fase B; no bloquea P0 ICS. |
| Q-003 | ¿Quién recibe avisos de invitación/cancelación, por qué canal y cuándo expira una invitación? | Cliente / D01-D02 | Bloquea avisos automáticos; en P0 solo existe estado dentro del CRM. |
| Q-004 | ¿Qué permisos actuales corresponden a Admin, Broker y Asistente para agenda, equipo, broker invitado, delegación y tareas de Finanzas/Legal? | Wilber / D02-D03-D12 | Bloquea matriz de permisos antes de READY. |
| Q-005 | ¿Qué tareas requieren resultado/evidencia, quién puede marcar criticidad y quién acepta/reasigna las tareas críticas al salir un agente? | Cliente / D01-D02 | Bloquea transición de responsable y reglas de finalización. |
| Q-007 | ¿Qué plazo de retención aplica a resultados, respuestas, llegada manual, notas y auditoría; quién autoriza compartir/retirar itinerario? | Cliente / Legal / D01-D12 | Bloquea promoción a READY. |
| Q-008 | ¿Cuántos eventos/visitas/tareas por día/mes, qué concurrencia y qué umbral de respuesta debe cumplir M48? | Cliente / D01-D02-D11 | Bloquea decisiones de capacidad y aceptación de desempeño. |
| Q-009 | ¿Se ratifica guardar zona IANA por evento, además del UTC, como extensión de la decisión #24 para cumplir QA-030? | Wilber / D01-D11 | Bloquea la migración de activities.timezone y READY. |

Q-006 queda resuelta para P0 por límite de alcance: sin conexión se marca la caché como obsoleta y se bloquean escrituras; no hay cola offline ni confirmaciones locales. Si se requiere escritura offline, se abre como evolución con su política propia.

**Cierre técnico previo a READY:** D11 confirma el número de migración siguiente al 0011, tipos/FKs, snapshots y DDL; D11/D12 verifican RLS/grants efectivos y compatibilidad del timezone con decisión #24; D03 revisa el contrato del broker contra M50; D14 define evidencia de ejecución. Este documento no acredita migraciones aplicadas, datos vivos, proveedor externo, concurrencia real, capturas ni pruebas de interfaz.

## Rebanadas de construcción

Cada tarea es de máximo 45 minutos y depende de G1/revisión independiente. Las rutas listadas son propuestas de archivos permitidos, no reservas vigentes. D11 serializa los cambios de migración; confirmar con D11 que 0011 sigue siendo la última antes de generar 0012/0013.

| Orden | Corte (≤45 min) | Archivos permitidos exactos | Evidencia |
|---|---|---|---|
| 1 | D11: visitas, paradas, participantes y zona de evento | src/infrastructure/db/schema.ts; src/domain/catalogs.ts; drizzle/0012_m48_visits.sql; drizzle/meta/0012_snapshot.json; drizzle/meta/_journal.json; scripts/test-db/m48-visits.mjs; scripts/test-db/m48-visits.db.test.ts | npm run test:db; FKs, únicos, checks, RLS, zona/historia y auditoría. |
| 2 | D11: dependencias y campos de tareas | src/infrastructure/db/schema.ts; src/domain/catalogs.ts; drizzle/0013_m48_task_dependencies.sql; drizzle/meta/0013_snapshot.json; drizzle/meta/_journal.json; scripts/test-db/m48-task-dependencies.mjs; scripts/test-db/m48-task-dependencies.db.test.ts | npm run test:db; autorreferencia, FKs, índices y RLS se comprueban en DB; ciclo y tipo no-task se rechazan en caso de uso/API. |
| 3 | D10: puertos, casos de uso y persistencia de visitas/participantes | src/application/visitas/puertos.ts; src/application/visitas/casos-de-uso.ts; src/application/visitas/en-memoria.ts; src/application/visitas/casos-de-uso.test.ts; src/infrastructure/db/repos/visitas.ts; src/infrastructure/contenedor/visitas.ts | npm test; dobles y PostgreSQL respetan autorización, ordinal, resultado, respuestas e idempotencia. |
| 4 | D10: casos de uso y persistencia de dependencias/tareas | src/application/actividades/dependencias.ts; src/application/actividades/dependencias.test.ts; src/application/actividades/casos-de-uso.ts; src/application/actividades/casos-de-uso.test.ts; src/infrastructure/db/repos/actividades.ts; src/infrastructure/contenedor/actividades.ts | npm test; ciclo concurrente no entra; impedimento y delegación respetan permisos. |
| 5 | D10: contratos API de visitas/participantes | src/app/api/visitas/route.ts; src/app/api/visitas/route.test.ts; src/app/api/visitas/[id]/route.ts; src/app/api/visitas/[id]/route.test.ts; src/app/api/visitas/[id]/tramos/[tramoId]/route.ts; src/app/api/visitas/[id]/tramos/[tramoId]/route.test.ts; src/app/api/visitas/[id]/participantes/route.ts; src/app/api/visitas/[id]/participantes/me/route.ts; pruebas de ambas rutas | npm test; Zod UUID, permiso antes de datos, filtro por padre, DTO, respuestas, idempotencia y 403/404/409. |
| 6 | D10: contratos API de tareas/participantes | src/app/api/actividades/route.ts; src/app/api/actividades/[id]/route.ts; src/app/api/actividades/[id]/route.test.ts; src/app/api/tareas/[id]/dependencias/route.ts; src/app/api/tareas/[id]/dependencias/route.test.ts | npm test; campos permitidos, Zod, autorización y alcance del expediente. |
| 7 | D09: agenda sobre componente nativo | src/app/(crm)/agenda/page.tsx; src/app/(crm)/agenda/vista.tsx | npm test; capturas 320/390/768/1440, zona, estados y teclado; sin dependencia nueva. |
| 8 | D09: ficha de recorrido | src/app/(crm)/visitas/[id]/page.tsx; src/app/(crm)/visitas/[id]/vista.tsx | npm test; capturas responsivas, permisos y parada cancelada que conserva ordinal. |
| 9 | D09: cola de tareas | src/app/(crm)/tareas/page.tsx; src/app/(crm)/tareas/vista.tsx | npm test; seis estados, filtros, resultado, impedimento, delegación y teclado. |
| B | D10/D21: sincronización externa (Fase B bloqueada) | src/application/agenda/sincronizacion.ts; src/application/agenda/sincronizacion.test.ts; src/infrastructure/integraciones/agenda/calendario.ts; src/infrastructure/integraciones/agenda/calendario.test.ts; src/infrastructure/env.ts | No despachar hasta decisión Q-002, expediente/licencia D21 y revisión D12. |

## Handoff

Productor: Codex D03, con colaboración documental D01/D11. Estado REVIEW; este documento no aprueba arquitectura, no promueve a READY y no certifica código o base de datos.

- **Revisor independiente de otro proveedor:** revisar los 12 hallazgos contestados al final, especialmente DDL/RLS, reachesVisita, DTO de broker, zona horaria vs decisión #24 y cortes de repositorio/contenedor.
- **D01/Wilber:** resolver Q-001, Q-004, Q-005, Q-007, Q-008 y Q-009; responder Q-003 si se desea avisos en una fase posterior. Q-002 se necesita solo para Fase B.
- **D11:** confirmar DDL, número real de migración, FKs/índices y esquema efectivo; no tratar esta propuesta como migración aplicada.
- **D12:** revisar scope, privacidad de participantes, RLS/grants, UUID y DTO.
- **D14:** revisar pruebas y capturas futuras. Ninguna se ejecutó en este corte.
- No se modificaron M40, M50, código, migraciones, índice Spec Pack ni configuración externa.

## Respuesta a la revisión R2

| Hallazgo R1 | Respuesta y evidencia |
|---|---|
| H-M48-R1-B01 · DDL físico | Resuelto en §5.1–5.4: columnas, tipos, nullabilidad, defaults, FKs, ON DELETE, checks, únicos e índices para las extensiones de activities y tablas nuevas. Migración real pendiente de D11. |
| H-M48-R1-B02 · Repositorios/contenedores | Resuelto en §Rebanadas, cortes 3–6: se incluyen repos/visitas.ts, contenedor/visitas.ts y reutilización de repos/actividades.ts/contenedor/actividades.ts. |
| H-M48-R1-M01 · event_attendees | Resuelto en §5.1, §4 y cortes 1/3/5: entidad física, XOR usuario/contacto, estados, visibilidad, unicidad, caso de uso y rutas de invitación/confirmación. |
| H-M48-R1-M02 · Zona IANA | Resuelto como propuesta en §5.1 y cortes 1/6: activities.timezone con default explícito y validación Intl; UTC no cambia. Q-009 exige ratificación de su compatibilidad con decisión #24 antes de READY. |
| H-M48-R1-M03 · Enlace público | Resuelto por recorte P0 en §3, §4, §9.1 y CA-5: solo sesiones CRM autorizadas; enlace anónimo y token revocable pasan a evolución. |
| H-M48-R1-M04 · Alcance/DTO broker | Resuelto en §4 y CA-5: predicado reachesVisita, concesión por objeto M50/M47 y VisitaBrokerDTO con lista positiva de campos. |
| H-M48-R1-M05 · ENTITY_TYPES | Resuelto en §5.2 y corte 1/2: ampliar src/domain/catalogs.ts con visit, visit_stop, event_attendee y task_dependency para tipar auditoría. |
| H-M48-R1-M06 · Schedule-X | Resuelto en §6 y corte 7: P0 evoluciona React/Tailwind existente, sin instalar dependencia; revaluación solo por expediente y corte separado. |
| H-M48-R1-m01 · UUID en rutas | Resuelto en §4, §8 CA-5 y corte 5: Zod UUID y public_id; idsDeRuta queda para IDs enteros existentes. |
| H-M48-R1-m02 · Ordinal cancelado | Resuelto en §4, §5.1/5.3, CA-4 y corte 8: conservar ordinal; no renumerar ni borrar paradas canceladas. |
| H-M48-R1-m03 · Origen/impedimento | Resuelto en §5.1/5.4 y cortes 2/4/6: origen manual/automation, impedimento persistido y bloqueado derivado de dependencia/impedimento. |
| H-M48-R1-m04 · Gate sincronización | Resuelto en §6, §9.1 y rebanada B: Fase B explícita, no despachable hasta Q-002 y aprobación D21/D12. |
