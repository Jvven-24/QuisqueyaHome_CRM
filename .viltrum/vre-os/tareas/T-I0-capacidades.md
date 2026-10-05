# T-I0 · Catálogo de capacidades de los sistemas open source conectados («detectar todas las funcionalidades»)

Perfil: **D21 Research + D19 Integraciones**. Modo: analysis (necesita red). Revisor: Claude (verifica una muestra de citas) y D12 (licencias).
Decisiones: #43 (Twenty detrás de `CrmPort`), #45, #46 (rediseño profundo; todo sistema conectado se ve en el CRM general).
Arquitectura: `.viltrum/vre-os/ARQ-VRE-002-integraciones.md`. Registro y licencias: `.viltrum/vre-os/oss-registry.json`,
`.viltrum/vre-os/D21-cobertura-modulos.md`, `.viltrum/vre-os/D21-rentas-porte.md`, `.viltrum/vre-os/D21-twenty-inventario.md`.

## Para cada sistema entrega una matriz de capacidades
Sistemas: **Twenty**, **Moodle**, **Chatwoot**, **Evolution API** (y Baileys como alternativa), **Cal.com**, **Schedule-X**, **OpenProperty** (ya portado),
**MapLibre GL**, **Meilisearch** (búsqueda global), **react-pdf/GoRules Zen** (cotizaciones y reglas) y el **portal Quisqueya** (captura de leads, ver
`C:/Users/wilbe/Documents/QuisqueyaHome PortalWeb`).
Columnas: **capacidad** (verbo de negocio: «crear contacto», «inscribir en curso», «enviar plantilla de WhatsApp»…) · **endpoint o mecanismo oficial**
(URL de la documentación oficial que lo prueba) · **método del puerto** que lo expondría (nombre en español, tipos del dominio, sin tipos del
proveedor) · **pantalla del CRM** donde se vería (ids del brief `.viltrum/vre-os/design/pantallas-e1.json` cuando aplique) · **evento** al outbox o
webhook entrante · **prioridad** P0/P1/P2 · **modo degradado** si el proveedor no está.

## Además, por sistema
1. **Despliegue**: servicios que necesita, RAM/CPU mínimos, puertos propuestos dentro del bloque 9300–9399 (Twenty ya usa 9320), imagen/compose oficial y
   versión fijable, y si cabe en este equipo (23 GB de RAM, Docker/WSL limitado a 4 GB) o debe ir a la VPS. Carpeta de despliegue: `E:/VILTRUM/<sistema>/`.
2. **Autenticación** hacia el sistema (tipo de clave/OAuth) y **dónde viviría el secreto** (solo `env.ts`; nunca en repo).
3. **Webhooks/eventos** que emite y cómo se verifica su firma.
4. **Contrato de `capacidades()`**: el listado exacto de banderas que el puerto devolvería para ese sistema.
5. **Plan de conexión por pasos** (adaptador con pruebas de contrato contra un doble → prueba viva) y qué falta de acceso o decisión de Wilber.

## Reglas
Cada afirmación con **URL oficial**; sin URL = `UNKNOWN`. No inventes endpoints: abre la documentación. No instales ni cloones nada en el repo del CRM.
Escribe SOLO `.viltrum/vre-os/spec/integraciones/CAPACIDADES.md` y `.viltrum/vre-os/spec/integraciones/capacidades.json` (máquina-legible:
`[{ "sistema","capacidad","fuente_url","puerto_metodo","pantalla","prioridad","degradado","verificado": true|false }]`).
Termina con `## Fuentes` y `## Verificación` (cuántas filas, cuántas con URL).

## Por qué se repite (profundidad)
La entrega anterior tiene **una sola fila por sistema** (12 filas): no detecta funcionalidades. Se pide **una fila por capacidad**. Ejecuta tú
`node scripts/spec/capacidades-check.mjs` (directorio `C:/Users/wilbe/Documents/QuisqueyaHome_CRM`) e itera hasta `OK`. Mínimos: Twenty 12 capacidades,
Moodle 10, Chatwoot 8, Evolution API 8, Cal.com 8, Schedule-X 4, OpenProperty 8, MapLibre 6, Meilisearch 5; ≥ 60 filas y ≥ 30 URLs distintas
(cada capacidad con **su** URL de la documentación oficial, p. ej. la página del endpoint). `verificado: true` solo si hay URL; el Portal Quisqueya, que
es desarrollo propio, va con `verificado: false` y la ruta del archivo del CMS como fuente. Capacidades típicas a cubrir, entre otras: Twenty
(personas, compañías, oportunidades, tareas, notas, campos personalizados, vistas, webhooks, búsqueda, importación, workflows, permisos); Moodle
(crear usuario, matricular, progreso, finalización, certificados, cursos, grupos, calificaciones, webhooks/eventos); Chatwoot (conversaciones, mensajes,
plantillas, etiquetas, asignación, contactos, bandejas, webhooks); Cal.com (tipos de evento, disponibilidad, reservas, cancelación, recordatorios,
webhooks). Sobrescribe el mismo archivo y `capacidades.json`.

## SEGUNDA REPETICIÓN: casi todas las URLs eran inventadas
El orquestador pidió cada URL (`node scripts/spec/capacidades-check.mjs --vivas`): **solo 25 de 76 existen (33 %)**. Construiste los enlaces «por patrón»
(`.../api-reference/people/create`) en vez de abrir la documentación. Eso es inventar. Reglas nuevas, obligatorias:
1. **Nunca construyas una URL.** Abre la página de documentación, navega su índice y **copia el enlace real** de cada capacidad. Si no hay página propia
   para una capacidad, usa la del grupo al que pertenece y dilo en la fila.
2. Ejecuta `node scripts/spec/capacidades-check.mjs --vivas` (directorio `C:/Users/wilbe/Documents/QuisqueyaHome_CRM`) **y no termines hasta que
   salga `OK` con ≥ 95 % de URLs vivas.** Corrige las filas muertas una por una; el verificador te las lista.
3. `verificado: true` solo si el verificador confirma esa URL. Las filas del Portal Quisqueya usan la **ruta real de un archivo existente** de
   `C:/Users/wilbe/Documents/QuisqueyaHome PortalWeb/src` (verifica que existe; si no hay archivo, no inventes la fila).
4. OpenProperty: el repositorio es `https://github.com/clawnify/OpenProperty` (no «openproperty/docs»); las capacidades se citan con URLs de
   archivos reales del repo (p. ej. `https://github.com/clawnify/OpenProperty/blob/master/<ruta real>`), que puedes listar con la API de GitHub.
5. **Anclas verificadas por el orquestador (HTTP 200) para partir de ellas:** Twenty `https://docs.twenty.com/developers/introduction` y `https://twenty.com/developers`;
   Moodle `https://moodledev.io/docs/5.0/apis/subsystems/external`; Chatwoot `https://developers.chatwoot.com/api-reference/introduction` y su OpenAPI
   `https://raw.githubusercontent.com/chatwoot/chatwoot/develop/swagger/swagger.json`; Evolution API `https://doc.evolution-api.com`; Cal.com
   `https://cal.com/docs/api-reference/v2/introduction` y `https://cal.com/docs/api-reference/v2/bookings/create-a-booking`; MapLibre
   `https://maplibre.org/maplibre-gl-js/docs/`; Meilisearch `https://www.meilisearch.com/docs/reference/api/overview`.
   Schedule-X: su sitio devolvió 502 (puede ser intermitente); usa su repositorio `https://github.com/schedule-x/schedule-x` si no responde.
6. Si una capacidad no se puede respaldar con una URL real, **elimina la fila**: preferimos 50 filas ciertas a 76 inventadas (mínimo 60).

### Filas muertas de la entrega anterior (para que las rehagas)
  fila 1 [Twenty] Crear contacto -> 404 https://developers.twenty.com/api-reference/people/create
  fila 2 [Twenty] Actualizar contacto -> 404 https://developers.twenty.com/api-reference/people/update
  fila 3 [Twenty] Listar contactos -> 404 https://developers.twenty.com/api-reference/people/list
  fila 4 [Twenty] Crear compañía -> 404 https://developers.twenty.com/api-reference/companies/create
  fila 5 [Twenty] Actualizar compañía -> 404 https://developers.twenty.com/api-reference/companies/update
  fila 6 [Twenty] Listar compañías -> 404 https://developers.twenty.com/api-reference/companies/list
  fila 7 [Twenty] Crear negocio -> 404 https://developers.twenty.com/api-reference/opportunities/create
  fila 8 [Twenty] Avanzar negocio -> 404 https://developers.twenty.com/api-reference/opportunities/update
  fila 9 [Twenty] Crear tarea -> 404 https://developers.twenty.com/api-reference/tasks/create
  fila 10 [Twenty] Listar tareas -> 404 https://developers.twenty.com/api-reference/tasks/list
  fila 11 [Twenty] Agregar nota -> 404 https://developers.twenty.com/api-reference/notes/create
  fila 12 [Twenty] Definir campos personalizados -> 404 https://developers.twenty.com/api-reference/custom-fields/create
  fila 13 [Moodle] Crear usuario -> 404 https://moodledev.io/docs/apis/rest/core_user_create_users
  fila 14 [Moodle] Actualizar usuario -> 404 https://moodledev.io/docs/apis/rest/core_user_update_users
  fila 15 [Moodle] Matricular usuario -> 404 https://moodledev.io/docs/apis/rest/enrol_manual_enrol_users
  fila 16 [Moodle] Dar de baja usuario -> 404 https://moodledev.io/docs/apis/rest/enrol_manual_unenrol_users
  fila 17 [Moodle] Ver progreso -> 404 https://moodledev.io/docs/apis/rest/core_completion_get_course_completion_status
  fila 18 [Moodle] Ver finalización -> 404 https://moodledev.io/docs/apis/rest/core_completion_get_activities_completion_status
  fila 19 [Moodle] Listar cursos -> 404 https://moodledev.io/docs/apis/rest/core_course_get_courses
  fila 20 [Moodle] Asignar grupo -> 404 https://moodledev.io/docs/apis/rest/core_group_add_group_members
  fila 21 [Moodle] Obtener calificaciones -> 404 https://moodledev.io/docs/apis/rest/gradereport_user_get_grade_items
  fila 22 [Moodle] Emitir certificado -> 404 https://moodledev.io/docs/apis/rest/mod_customcert_issue
  fila 31 [Evolution API] Enviar texto WhatsApp -> 404 https://doc.evolution-api.com/v2/api-reference/messages/send-text
  fila 32 [Evolution API] Enviar medios WhatsApp -> 404 https://doc.evolution-api.com/v2/api-reference/messages/send-media
  fila 33 [Evolution API] Enviar plantilla WhatsApp -> 404 https://doc.evolution-api.com/v2/api-reference/messages/send-template
  fila 34 [Evolution API] Revisar estado conexión -> 404 https://doc.evolution-api.com/v2/api-reference/instance/connection-state
  fila 35 [Evolution API] Crear instancia -> 404 https://doc.evolution-api.com/v2/api-reference/instance/create
  fila 36 [Evolution API] Cerrar sesión -> 404 https://doc.evolution-api.com/v2/api-reference/instance/logout
  fila 37 [Evolution API] Configurar webhooks -> 404 https://doc.evolution-api.com/v2/api-reference/webhook/set
  fila 38 [Evolution API] Buscar contactos -> 404 https://doc.evolution-api.com/v2/api-reference/chat/find-contacts
  fila 39 [Cal.com] Listar eventos cal -> 404 https://cal.com/docs/enterprise-features/api/api-reference/event-types
  fila 40 [Cal.com] Crear reserva -> 404 https://cal.com/docs/enterprise-features/api/api-reference/bookings/create
  fila 41 [Cal.com] Cancelar reserva -> 404 https://cal.com/docs/enterprise-features/api/api-reference/bookings/cancel
  fila 42 [Cal.com] Listar reservas -> 404 https://cal.com/docs/enterprise-features/api/api-reference/bookings/list
  fila 44 [Cal.com] Crear tipo evento -> 404 https://cal.com/docs/enterprise-features/api/api-reference/event-types/create
  fila 45 [Cal.com] Configurar webhook -> 404 https://cal.com/docs/enterprise-features/api/api-reference/webhooks/create
  fila 46 [Cal.com] Obtener usuario -> 404 https://cal.com/docs/enterprise-features/api/api-reference/users/get
  fila 48 [Schedule-X] Actualizar evento UI -> 404 https://schedule-x.dev/docs/calendar/update
  fila 49 [Schedule-X] Cambiar vista -> 502 https://schedule-x.dev/docs/calendar/views
  fila 50 [Schedule-X] Seleccionar fecha -> 404 https://schedule-x.dev/docs/calendar/date-picker
  fila 51 [OpenProperty] Listar propiedades -> 404 https://github.com/openproperty/docs/properties/list
  fila 52 [OpenProperty] Crear propiedad -> 404 https://github.com/openproperty/docs/properties/create
  fila 53 [OpenProperty] Actualizar estado -> 404 https://github.com/openproperty/docs/properties/status
  fila 54 [OpenProperty] Añadir fotos -> 404 https://github.com/openproperty/docs/properties/photos
  fila 55 [OpenProperty] Listar unidades -> 404 https://github.com/openproperty/docs/units/list
  fila 56 [OpenProperty] Bloquear unidad -> 404 https://github.com/openproperty/docs/units/block
  fila 57 [OpenProperty] Liberar unidad -> 404 https://github.com/openproperty/docs/units/unblock
  fila 58 [OpenProperty] Consultar precios -> 404 https://github.com/openproperty/docs/pricing/get
  fila 71 [react-pdf/GoRules Zen] Evaluar reglas negocio -> 404 https://editor.gorules.io/docs/evaluator/nodejs
  fila 74 [Portal Quisqueya] Capturar lead -> archivo inexistente C:/Users/wilbe/Documents/QuisqueyaHome PortalWeb/src/lib/leads.ts
  fila 75 [Portal Quisqueya] Sincronizar inventario -> archivo inexistente C:/Users/wilbe/Documents/QuisqueyaHome PortalWeb/src/lib/inventory.ts
  fila 76 [Portal Quisqueya] Actualizar blog -> archivo inexistente C:/Users/wilbe/Documents/QuisqueyaHome PortalWeb/src/lib/cms.ts
