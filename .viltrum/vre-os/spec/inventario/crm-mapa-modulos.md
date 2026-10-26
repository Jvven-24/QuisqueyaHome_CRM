---
id: T-P0-CRM-mapa
estado: REVIEW
productor: D03 / Codex
revisor_asignado: D22 / otro proveedor
fecha: 2026-10-04
commit_base: 08e7fa96f95ba17b1911201062754a1cce300daa
---

# CRM · Mapa AS-IS para las fichas

21 módulos y 11 globales del catálogo FLUJO-PASADAS §3. Ids del Spec Pack, no ids históricos de comentarios del código. Documento principal: crm-as-is.md §§1–7. Copia de trabajo develop con cambios previos: límites y verificación allí. Cada entrada es un borrador de §2 para ficha DRAFT, no ficha completa/READY ni aprobación. Tablas relacionadas no equivalen a propiedad exclusiva del módulo ni a capacidad completa.

Las ausencias se basan en enumeración completa de src/app, src/application y schema: no pieza dedicada localizada. Integraciones externas no inspeccionadas = UNKNOWN. Pruebas presentes ≠ corrida en verde.

| Ficha | Rutas | Aplicación / complemento | Datos relacionados | Límite actual |
| --- | --- | --- | --- | --- |
| M01 Leads | /leads `src/app/(crm)/leads/page.tsx:32` | crearLead `src/application/leads/casos-de-uso.ts:100`; asignarResponsableDeLead `src/application/leads/casos-de-uso.ts:198`; descartarLead `src/application/leads/casos-de-uso.ts:244`; capturarLeadExterno `src/application/leads/casos-de-uso.ts:299`; convertirLead `src/application/leads/conversion.ts:26` | contacts `src/infrastructure/db/schema.ts:569`; leads `src/infrastructure/db/schema.ts:605`; lead_sources `src/infrastructure/db/schema.ts:324` | Alta/asignación/descarte/conversión presentes; lectura SQL pendiente. |
| M02 Contactos | /contactos `src/app/(crm)/contactos/page.tsx:34` | crearContacto `src/application/contactos/casos-de-uso.ts:29`; editarContacto `src/application/contactos/casos-de-uso.ts:96`; borrarContacto `src/application/contactos/casos-de-uso.ts:145`; consultarListadoContactos `src/application/contactos/consultas.ts:16` | contacts `src/infrastructure/db/schema.ts:569`; activities `src/infrastructure/db/schema.ts:779`; audit_log `src/infrastructure/db/schema.ts:1108` | Listado/casos de uso con puertos propios; duplicados y controles por alcance pendientes de verificación UI. |
| M03 Pipeline | /pipeline `src/app/(crm)/pipeline/page.tsx:44` | cambiarEtapaDeNegocio `src/application/pipeline/casos-de-uso.ts:43`; editarNegocio `src/application/pipeline/casos-de-uso.ts:213`; asociarPropiedad `src/application/pipeline/casos-de-uso.ts:264`; marcarPropiedadPrincipal `src/application/pipeline/casos-de-uso.ts:305`; quitarPropiedad `src/application/pipeline/casos-de-uso.ts:338`; cerrarNegocioGanado `src/application/pipeline/cierre.ts:43` | deals `src/infrastructure/db/schema.ts:672`; deal_properties `src/infrastructure/db/schema.ts:719`; deal_stage_history `src/infrastructure/db/schema.ts:753`; pipeline_stages `src/infrastructure/db/schema.ts:287`; commissions `src/infrastructure/db/schema.ts:887` | Kanban/lista, cambio de etapa y cierre; concurrencia pendiente según H21. |
| M04 Propiedades/Inventario | /propiedades `src/app/(crm)/propiedades/page.tsx:35`; /propiedades/[slug] `src/app/(crm)/propiedades/[slug]/page.tsx:29` | crearProyecto `src/application/proyectos/casos-de-uso.ts:56`; editarProyecto `src/application/proyectos/casos-de-uso.ts:73`; borrarProyecto `src/application/proyectos/casos-de-uso.ts:113`; crearUnidad `src/application/proyectos/casos-de-uso.ts:133`; editarUnidad `src/application/proyectos/casos-de-uso.ts:154`; borrarUnidad `src/application/proyectos/casos-de-uso.ts:177`; crearFases `src/application/proyectos/casos-de-uso.ts:206`; editarFase `src/application/proyectos/casos-de-uso.ts:253`; borrarFase `src/application/proyectos/casos-de-uso.ts:279`; subirFotos `src/application/proyectos/casos-de-uso.ts:300`; borrarFoto `src/application/proyectos/casos-de-uso.ts:366` | projects `src/infrastructure/db/schema.ts:424`; units `src/infrastructure/db/schema.ts:475`; unit_inventory_states `src/infrastructure/db/schema.ts:373` | Proyectos/unidades reales y precios restringidos; lectura SQL/cobertura móvil pendientes. |
| M05 Avances de obra | /avances `src/app/(crm)/avances/page.tsx:36` | crearProyecto `src/application/proyectos/casos-de-uso.ts:56`; editarProyecto `src/application/proyectos/casos-de-uso.ts:73`; borrarProyecto `src/application/proyectos/casos-de-uso.ts:113`; crearUnidad `src/application/proyectos/casos-de-uso.ts:133`; editarUnidad `src/application/proyectos/casos-de-uso.ts:154`; borrarUnidad `src/application/proyectos/casos-de-uso.ts:177`; crearFases `src/application/proyectos/casos-de-uso.ts:206`; editarFase `src/application/proyectos/casos-de-uso.ts:253`; borrarFase `src/application/proyectos/casos-de-uso.ts:279`; subirFotos `src/application/proyectos/casos-de-uso.ts:300`; borrarFoto `src/application/proyectos/casos-de-uso.ts:366` | construction_phases `src/infrastructure/db/schema.ts:526`; files `src/infrastructure/db/schema.ts:1034`; projects `src/infrastructure/db/schema.ts:424` | Gestión de fases/fotos existente; dataset local vacío; subida end-to-end UNKNOWN. |
| M06 Agenda | /agenda `src/app/(crm)/agenda/page.tsx:27` | crearActividad `src/application/actividades/casos-de-uso.ts:14`; editarActividad `src/application/actividades/casos-de-uso.ts:63`; borrarActividad `src/application/actividades/casos-de-uso.ts:93`; exportarActividadesIcs `src/application/actividades/consultas.ts:6` | activities `src/infrastructure/db/schema.ts:779`; activity_sync `src/infrastructure/db/schema.ts:821` | Agenda semanal, creación e ICS; OAuth/sincronización externa no acreditados. |
| M07 Tareas | /tareas `src/app/(crm)/tareas/page.tsx:27` | crearActividad `src/application/actividades/casos-de-uso.ts:14`; editarActividad `src/application/actividades/casos-de-uso.ts:63`; borrarActividad `src/application/actividades/casos-de-uso.ts:93`; exportarActividadesIcs `src/application/actividades/consultas.ts:6` | activities `src/infrastructure/db/schema.ts:779` | Pendientes y completar/reabrir; no tabla tasks separada. |
| M08 Brokers y co-broking | /brokers `src/app/(crm)/brokers/page.tsx:23`; /brokers/[id] `src/app/(crm)/brokers/[id]/page.tsx:33` | asignarProyectosABroker `src/application/brokers/casos-de-uso.ts:16`; crearUsuario `src/application/usuarios/casos-de-uso.ts:10`; editarUsuario `src/application/usuarios/casos-de-uso.ts:54`; borrarUsuario `src/application/usuarios/casos-de-uso.ts:94`; reenviarInvitacion `src/application/usuarios/casos-de-uso.ts:117` | broker_profiles `src/infrastructure/db/schema.ts:213`; users `src/infrastructure/db/schema.ts:160`; projects `src/infrastructure/db/schema.ts:424`; agencies `src/infrastructure/db/schema.ts:353` | Perfiles, invitación y asignación; agencies existe, co-broking operativo no acreditado. |
| M09 Metas | /metas `src/app/(crm)/metas/page.tsx:32` | fijarMetaMensual `src/application/metas/casos-de-uso.ts:22` | goals `src/infrastructure/db/schema.ts:852`; broker_profiles `src/infrastructure/db/schema.ts:213` | Meta mensual y lectura por periodo; SQL/carrera de auditoría pendientes. |
| M10 Comisiones | /comisiones `src/app/(crm)/comisiones/page.tsx:22` | editarComision `src/application/comisiones/casos-de-uso.ts:25`; exportarComisionesCsv `src/application/comisiones/casos-de-uso.ts:114`; cambiarEtapaDeNegocio `src/application/pipeline/casos-de-uso.ts:43`; editarNegocio `src/application/pipeline/casos-de-uso.ts:213`; asociarPropiedad `src/application/pipeline/casos-de-uso.ts:264`; marcarPropiedadPrincipal `src/application/pipeline/casos-de-uso.ts:305`; quitarPropiedad `src/application/pipeline/casos-de-uso.ts:338`; cerrarNegocioGanado `src/application/pipeline/cierre.ts:43` | commissions `src/infrastructure/db/schema.ts:887`; deals `src/infrastructure/db/schema.ts:672` | Aprobar/pagar/anular, reparto y CSV; lectura/tipos del CSV pendientes R4.3. |
| M11 Comunicaciones | /comunicaciones `src/app/(crm)/comunicaciones/page.tsx:17` | listarPlantillasMensajes `src/application/comunicaciones/casos-de-uso.ts:19`; obtenerPlantillaMensaje `src/application/comunicaciones/casos-de-uso.ts:27`; crearPlantillaMensaje `src/application/comunicaciones/casos-de-uso.ts:38`; actualizarPlantillaMensaje `src/application/comunicaciones/casos-de-uso.ts:67`; prepararYDespacharMensaje `src/application/comunicaciones/casos-de-uso.ts:89`; consultarEstadosCanales `src/application/comunicaciones/casos-de-uso.ts:119`; consultarComunicaciones `src/application/comunicaciones/consultas.ts:11` | message_templates `src/infrastructure/db/schema.ts:1020`; integration_accounts `src/infrastructure/db/schema.ts:1081` | Plantillas persistidas y despacho; email/sin configuración simulan éxito, previsualización fija. |
| M12 Reportes | /reportes `src/app/(crm)/reportes/page.tsx:12` | assertMonetaryTotals `src/application/reportes/consultas.ts:10`; percentage `src/application/reportes/consultas.ts:19`; reportQuery `src/application/reportes/consultas.ts:22`; requireReadScope `src/application/reportes/consultas.ts:38`; presentReport `src/application/reportes/consultas.ts:41`; consultarReportesBi `src/application/reportes/consultas.ts:61`; dashboardScopes `src/application/dashboard/consultas.ts:7`; dashboardQuery `src/application/dashboard/consultas.ts:15`; consultarDashboard `src/application/dashboard/consultas.ts:23` | deals `src/infrastructure/db/schema.ts:672`; deal_stage_history `src/infrastructure/db/schema.ts:753`; leads `src/infrastructure/db/schema.ts:605`; marketing_campaigns `src/infrastructure/db/schema.ts:388`; campaign_spend `src/infrastructure/db/schema.ts:407`; units `src/infrastructure/db/schema.ts:475`; commissions `src/infrastructure/db/schema.ts:887` | Nueve tabs BI y CSV de embudo; comparativas/intervalos/distribuciones no se inventan. |
| M13 Academy | /academy `src/app/(crm)/academy/page.tsx:17` | listarContenidosAcademy `src/application/academy/casos-de-uso.ts:7`; obtenerDetalleContenido `src/application/academy/casos-de-uso.ts:15`; completarContenidoAcademy `src/application/academy/casos-de-uso.ts:25`; marcarPasoChecklist `src/application/academy/casos-de-uso.ts:35`; obtenerResumenProgresoBroker `src/application/academy/casos-de-uso.ts:44`; consultarAcademy `src/application/academy/consultas.ts:11` | academy_items `src/infrastructure/db/schema.ts:937`; academy_checklist_items `src/infrastructure/db/schema.ts:951`; academy_progress `src/infrastructure/db/schema.ts:970`; academy_checklist_progress `src/infrastructure/db/schema.ts:993` | Formación/checklist con progreso por usuario; contenido local vacío, sin Moodle conectado acreditado. |
| M14 Configuración | /configuracion `src/app/(crm)/configuracion/page.tsx:46` | crearUsuario `src/application/usuarios/casos-de-uso.ts:10`; editarUsuario `src/application/usuarios/casos-de-uso.ts:54`; borrarUsuario `src/application/usuarios/casos-de-uso.ts:94`; reenviarInvitacion `src/application/usuarios/casos-de-uso.ts:117`; editarPermisos `src/application/roles/casos-de-uso.ts:10`; esTipoCatalogo `src/application/catalogos/casos-de-uso.ts:23`; crearEntradaCatalogo `src/application/catalogos/casos-de-uso.ts:29`; editarEntradaCatalogo `src/application/catalogos/casos-de-uso.ts:51`; editarEtapa `src/application/etapas/casos-de-uso.ts:13`; restaurarDePapelera `src/application/papelera/casos-de-uso.ts:13` | users `src/infrastructure/db/schema.ts:160`; roles `src/infrastructure/db/schema.ts:146`; permissions `src/infrastructure/db/schema.ts:233`; pipeline_stages `src/infrastructure/db/schema.ts:287`; loss_reasons `src/infrastructure/db/schema.ts:307`; lead_sources `src/infrastructure/db/schema.ts:324`; integration_accounts `src/infrastructure/db/schema.ts:1081` | Seis paneles; no confundir tarjetas anunciadas con proveedores conectados. |
| M15 Rentas | Sin página dedicada localizada | `src/infrastructure/db/schema.ts:17` | units `src/infrastructure/db/schema.ts:475`; projects `src/infrastructure/db/schema.ts:424`; leads `src/infrastructure/db/schema.ts:605`; deals `src/infrastructure/db/schema.ts:672` | No ruta/módulo dedicado localizado; operationType/pricePeriod compartidos no equivalen a gestión de rentas. |
| M16 Cotizaciones y planes de pago | Sin página dedicada localizada | generarCotizacionConfotur `src/application/confotur/casos-de-uso.ts:7` | Sin tabla propia localizada | Endpoint cotizador/confotur y cálculo puro JSON; sin cotización persistida, pantalla/PDF acreditados. |
| M17 Reservas | Sin página dedicada localizada | `src/domain/catalogs.ts:140` | units `src/infrastructure/db/schema.ts:475` | Estado de unidad reserved no acredita reserva, caducidad ni workflow propio. |
| M18 Client Room | Sin página dedicada localizada | Sin módulo dedicado localizado | Sin tabla propia localizada | No ruta, carpeta application ni tabla dedicada localizadas en árboles enumerados; capacidad externa UNKNOWN. |
| M19 Deal Room | Sin página dedicada localizada | cambiarEtapaDeNegocio `src/application/pipeline/casos-de-uso.ts:43`; editarNegocio `src/application/pipeline/casos-de-uso.ts:213`; asociarPropiedad `src/application/pipeline/casos-de-uso.ts:264`; marcarPropiedadPrincipal `src/application/pipeline/casos-de-uso.ts:305`; quitarPropiedad `src/application/pipeline/casos-de-uso.ts:338`; cerrarNegocioGanado `src/application/pipeline/cierre.ts:43` | deals `src/infrastructure/db/schema.ts:672`; deal_properties `src/infrastructure/db/schema.ts:719`; files `src/infrastructure/db/schema.ts:1034` | Inspector interno no equivale a colaboración externa; sin ruta/módulo dedicado localizado. |
| M20 Portal del broker | Sin página dedicada localizada | `src/app/(crm)/layout.tsx:33` | users `src/infrastructure/db/schema.ts:160`; broker_profiles `src/infrastructure/db/schema.ts:213` | Vistas del CRM por rol; no portal externo dedicado localizado. |
| M21 Inicio | /inicio `src/app/(crm)/inicio/page.tsx:9` | dashboardScopes `src/application/dashboard/consultas.ts:7`; dashboardQuery `src/application/dashboard/consultas.ts:15`; consultarDashboard `src/application/dashboard/consultas.ts:23` | leads `src/infrastructure/db/schema.ts:605`; deals `src/infrastructure/db/schema.ts:672`; activities `src/infrastructure/db/schema.ts:779`; goals `src/infrastructure/db/schema.ts:852`; projects `src/infrastructure/db/schema.ts:424`; academy_progress `src/infrastructure/db/schema.ts:970` | Dashboard real por recurso/alcance; no inventa comparativas sin histórico. |
| G01 Shell y navegación | Sin página dedicada localizada | `src/app/(crm)/layout.tsx:39`; `src/app/(crm)/modulos.ts:1`; `src/app/(crm)/_ui/mobile-dock.tsx:1` | users `src/infrastructure/db/schema.ts:160` | Layout, RBAC, sidebar/dock/cabecera; paleta de cabecera no recibe módulos filtrados. |
| G02 Búsqueda global y paleta de comandos | Sin página dedicada localizada | `src/app/(crm)/_ui/command-palette.tsx:78` | Sin tabla propia localizada | Paleta navega catálogo/atajos; no búsqueda global de entidades en servidor acreditada. |
| G03 Notificaciones | Sin página dedicada localizada | `src/app/(crm)/_ui/crm-header.tsx:42` | notifications `src/infrastructure/db/schema.ts:1056` | Tabla con cero filas; cabecera con tres avisos fijos y contador local. Backend de avisos no acreditado. |
| G04 Autenticación, roles y alcance | /login `src/app/login/page.tsx:12`; /recuperar `src/app/recuperar/page.tsx:5` | crearUsuario `src/application/usuarios/casos-de-uso.ts:10`; editarUsuario `src/application/usuarios/casos-de-uso.ts:54`; borrarUsuario `src/application/usuarios/casos-de-uso.ts:94`; reenviarInvitacion `src/application/usuarios/casos-de-uso.ts:117`; editarPermisos `src/application/roles/casos-de-uso.ts:10` | roles `src/infrastructure/db/schema.ts:146`; users `src/infrastructure/db/schema.ts:160`; permissions `src/infrastructure/db/schema.ts:233`; sessions `src/infrastructure/db/schema.ts:259` | Supabase SSR/actor/RBAC/evaluación local; sessions heredada sin uso, recuperación incompleta. |
| G05 Auditoría | Sin página dedicada localizada | `src/infrastructure/audit.ts:1`; `src/app/(crm)/_ui/historial.tsx:24` | audit_log `src/infrastructure/db/schema.ts:1108` | Puerto transaccional/adaptador/historial por entidad; no pantalla global dedicada localizada. |
| G06 i18n (es/en) | Sin página dedicada localizada | `src/app/(crm)/_ui/analitica-copy.ts:1` | Sin tabla propia localizada | Español y catálogo compartido de analítica; runtime multilingüe no acreditado. |
| G07 PWA y sin conexión | Sin página dedicada localizada | `src/app/(crm)/_ui/analytics-state.ts:5`; `src/app/(crm)/_ui/mobile-dock.tsx:35` | Sin tabla propia localizada | Dock/estados offline parciales; service worker/cache durable/sync offline UNKNOWN. |
| G08 Importación/exportación | Sin página dedicada localizada | editarComision `src/application/comisiones/casos-de-uso.ts:25`; exportarComisionesCsv `src/application/comisiones/casos-de-uso.ts:114`; crearActividad `src/application/actividades/casos-de-uso.ts:14`; editarActividad `src/application/actividades/casos-de-uso.ts:63`; borrarActividad `src/application/actividades/casos-de-uso.ts:93`; exportarActividadesIcs `src/application/actividades/consultas.ts:6` | Sin tabla propia localizada | CSV comisiones/embudo e ICS; permiso import sin endpoint dedicado localizado. |
| G09 Deduplicación E.164 | Sin página dedicada localizada | crearContacto `src/application/contactos/casos-de-uso.ts:29`; editarContacto `src/application/contactos/casos-de-uso.ts:96`; borrarContacto `src/application/contactos/casos-de-uso.ts:145`; consultarListadoContactos `src/application/contactos/consultas.ts:16`; crearLead `src/application/leads/casos-de-uso.ts:100`; asignarResponsableDeLead `src/application/leads/casos-de-uso.ts:198`; descartarLead `src/application/leads/casos-de-uso.ts:244`; capturarLeadExterno `src/application/leads/casos-de-uso.ts:299`; convertirLead `src/application/leads/conversion.ts:26` | contacts `src/infrastructure/db/schema.ts:569`; leads `src/infrastructure/db/schema.ts:605` | Normalización/duplicados en altas y clave externa; duplicado de contacto es aviso, no unicidad absoluta. |
| G10 Integraciones y salud (outbox/DLQ) | Sin página dedicada localizada | `src/infrastructure/integraciones/outbox/runtime.ts:7`; `src/infrastructure/integraciones/outbox/worker.ts:28`; `src/infrastructure/integraciones/crm/local.ts:8` | outbox `src/infrastructure/db/schema.ts:1131`; outbox_dead `src/infrastructure/db/schema.ts:1157`; external_refs `src/infrastructure/db/schema.ts:1166`; webhook_inbox `src/infrastructure/db/schema.ts:1181`; integration_accounts `src/infrastructure/db/schema.ts:1081` | CrmPort/worker/no-op local; scheduler/UI DLQ/replay/inbox real no acreditados. |
| G11 IA/asistente | Sin página dedicada localizada | procesarNotaDeVozLead `src/application/ai/casos-de-uso.ts:4` | Sin tabla propia localizada | Extracción desde texto/propuesta humana/puerto ASR; ruta sin transcriptor; asistente/RAG no acreditados. |


## M01 · Leads

### Borrador para §2 Estado actual

Alta/asignación/descarte/conversión presentes; lectura SQL pendiente.

- Pantallas: /leads `src/app/(crm)/leads/page.tsx:32`.
- Aplicación/contratos: crearLead `src/application/leads/casos-de-uso.ts:100`; asignarResponsableDeLead `src/application/leads/casos-de-uso.ts:198`; descartarLead `src/application/leads/casos-de-uso.ts:244`; capturarLeadExterno `src/application/leads/casos-de-uso.ts:299`; convertirLead `src/application/leads/conversion.ts:26`.
- Datos relacionados: contacts `src/infrastructure/db/schema.ts:569`; leads `src/infrastructure/db/schema.ts:605`; lead_sources `src/infrastructure/db/schema.ts:324`.
- Evidencia complementaria: crm-as-is.md §§1–7 para APIs/estados/permisos y límites de búsqueda.
- Pruebas presentes: `src/application/leads/casos-de-uso.test.ts:1`; `src/application/leads/conversion.test.ts:1`. Ejecución actual UNKNOWN.
- Antes de READY: concretar permisos/seis estados por función, móvil 320/390, eventos/integraciones, criterios de aceptación y NFR; P0 no los inventa.


## M02 · Contactos

### Borrador para §2 Estado actual

Listado/casos de uso con puertos propios; duplicados y controles por alcance pendientes de verificación UI.

- Pantallas: /contactos `src/app/(crm)/contactos/page.tsx:34`.
- Aplicación/contratos: crearContacto `src/application/contactos/casos-de-uso.ts:29`; editarContacto `src/application/contactos/casos-de-uso.ts:96`; borrarContacto `src/application/contactos/casos-de-uso.ts:145`; consultarListadoContactos `src/application/contactos/consultas.ts:16`.
- Datos relacionados: contacts `src/infrastructure/db/schema.ts:569`; activities `src/infrastructure/db/schema.ts:779`; audit_log `src/infrastructure/db/schema.ts:1108`.
- Evidencia complementaria: crm-as-is.md §§1–7 para APIs/estados/permisos y límites de búsqueda.
- Pruebas presentes: `src/application/contactos/casos-de-uso.test.ts:1`. Ejecución actual UNKNOWN.
- Antes de READY: concretar permisos/seis estados por función, móvil 320/390, eventos/integraciones, criterios de aceptación y NFR; P0 no los inventa.


## M03 · Pipeline

### Borrador para §2 Estado actual

Kanban/lista, cambio de etapa y cierre; concurrencia pendiente según H21.

- Pantallas: /pipeline `src/app/(crm)/pipeline/page.tsx:44`.
- Aplicación/contratos: cambiarEtapaDeNegocio `src/application/pipeline/casos-de-uso.ts:43`; editarNegocio `src/application/pipeline/casos-de-uso.ts:213`; asociarPropiedad `src/application/pipeline/casos-de-uso.ts:264`; marcarPropiedadPrincipal `src/application/pipeline/casos-de-uso.ts:305`; quitarPropiedad `src/application/pipeline/casos-de-uso.ts:338`; cerrarNegocioGanado `src/application/pipeline/cierre.ts:43`.
- Datos relacionados: deals `src/infrastructure/db/schema.ts:672`; deal_properties `src/infrastructure/db/schema.ts:719`; deal_stage_history `src/infrastructure/db/schema.ts:753`; pipeline_stages `src/infrastructure/db/schema.ts:287`; commissions `src/infrastructure/db/schema.ts:887`.
- Evidencia complementaria: crm-as-is.md §§1–7 para APIs/estados/permisos y límites de búsqueda.
- Pruebas presentes: `src/application/pipeline/casos-de-uso.test.ts:1`; `src/application/pipeline/cierre.test.ts:1`. Ejecución actual UNKNOWN.
- Antes de READY: concretar permisos/seis estados por función, móvil 320/390, eventos/integraciones, criterios de aceptación y NFR; P0 no los inventa.


## M04 · Propiedades/Inventario

### Borrador para §2 Estado actual

Proyectos/unidades reales y precios restringidos; lectura SQL/cobertura móvil pendientes.

- Pantallas: /propiedades `src/app/(crm)/propiedades/page.tsx:35`; /propiedades/[slug] `src/app/(crm)/propiedades/[slug]/page.tsx:29`.
- Aplicación/contratos: crearProyecto `src/application/proyectos/casos-de-uso.ts:56`; editarProyecto `src/application/proyectos/casos-de-uso.ts:73`; borrarProyecto `src/application/proyectos/casos-de-uso.ts:113`; crearUnidad `src/application/proyectos/casos-de-uso.ts:133`; editarUnidad `src/application/proyectos/casos-de-uso.ts:154`; borrarUnidad `src/application/proyectos/casos-de-uso.ts:177`; crearFases `src/application/proyectos/casos-de-uso.ts:206`; editarFase `src/application/proyectos/casos-de-uso.ts:253`; borrarFase `src/application/proyectos/casos-de-uso.ts:279`; subirFotos `src/application/proyectos/casos-de-uso.ts:300`; borrarFoto `src/application/proyectos/casos-de-uso.ts:366`.
- Datos relacionados: projects `src/infrastructure/db/schema.ts:424`; units `src/infrastructure/db/schema.ts:475`; unit_inventory_states `src/infrastructure/db/schema.ts:373`.
- Evidencia complementaria: crm-as-is.md §§1–7 para APIs/estados/permisos y límites de búsqueda.
- Pruebas presentes: `src/application/proyectos/casos-de-uso.test.ts:1`. Ejecución actual UNKNOWN.
- Antes de READY: concretar permisos/seis estados por función, móvil 320/390, eventos/integraciones, criterios de aceptación y NFR; P0 no los inventa.


## M05 · Avances de obra

### Borrador para §2 Estado actual

Gestión de fases/fotos existente; dataset local vacío; subida end-to-end UNKNOWN.

- Pantallas: /avances `src/app/(crm)/avances/page.tsx:36`.
- Aplicación/contratos: crearProyecto `src/application/proyectos/casos-de-uso.ts:56`; editarProyecto `src/application/proyectos/casos-de-uso.ts:73`; borrarProyecto `src/application/proyectos/casos-de-uso.ts:113`; crearUnidad `src/application/proyectos/casos-de-uso.ts:133`; editarUnidad `src/application/proyectos/casos-de-uso.ts:154`; borrarUnidad `src/application/proyectos/casos-de-uso.ts:177`; crearFases `src/application/proyectos/casos-de-uso.ts:206`; editarFase `src/application/proyectos/casos-de-uso.ts:253`; borrarFase `src/application/proyectos/casos-de-uso.ts:279`; subirFotos `src/application/proyectos/casos-de-uso.ts:300`; borrarFoto `src/application/proyectos/casos-de-uso.ts:366`.
- Datos relacionados: construction_phases `src/infrastructure/db/schema.ts:526`; files `src/infrastructure/db/schema.ts:1034`; projects `src/infrastructure/db/schema.ts:424`.
- Evidencia complementaria: crm-as-is.md §§1–7 para APIs/estados/permisos y límites de búsqueda.
- Pruebas presentes: `src/application/proyectos/casos-de-uso.test.ts:1`. Ejecución actual UNKNOWN.
- Antes de READY: concretar permisos/seis estados por función, móvil 320/390, eventos/integraciones, criterios de aceptación y NFR; P0 no los inventa.


## M06 · Agenda

### Borrador para §2 Estado actual

Agenda semanal, creación e ICS; OAuth/sincronización externa no acreditados.

- Pantallas: /agenda `src/app/(crm)/agenda/page.tsx:27`.
- Aplicación/contratos: crearActividad `src/application/actividades/casos-de-uso.ts:14`; editarActividad `src/application/actividades/casos-de-uso.ts:63`; borrarActividad `src/application/actividades/casos-de-uso.ts:93`; exportarActividadesIcs `src/application/actividades/consultas.ts:6`.
- Datos relacionados: activities `src/infrastructure/db/schema.ts:779`; activity_sync `src/infrastructure/db/schema.ts:821`.
- Evidencia complementaria: crm-as-is.md §§1–7 para APIs/estados/permisos y límites de búsqueda.
- Pruebas presentes: `src/application/actividades/casos-de-uso.test.ts:1`. Ejecución actual UNKNOWN.
- Antes de READY: concretar permisos/seis estados por función, móvil 320/390, eventos/integraciones, criterios de aceptación y NFR; P0 no los inventa.


## M07 · Tareas

### Borrador para §2 Estado actual

Pendientes y completar/reabrir; no tabla tasks separada.

- Pantallas: /tareas `src/app/(crm)/tareas/page.tsx:27`.
- Aplicación/contratos: crearActividad `src/application/actividades/casos-de-uso.ts:14`; editarActividad `src/application/actividades/casos-de-uso.ts:63`; borrarActividad `src/application/actividades/casos-de-uso.ts:93`; exportarActividadesIcs `src/application/actividades/consultas.ts:6`.
- Datos relacionados: activities `src/infrastructure/db/schema.ts:779`.
- Evidencia complementaria: crm-as-is.md §§1–7 para APIs/estados/permisos y límites de búsqueda.
- Pruebas presentes: `src/application/actividades/casos-de-uso.test.ts:1`. Ejecución actual UNKNOWN.
- Antes de READY: concretar permisos/seis estados por función, móvil 320/390, eventos/integraciones, criterios de aceptación y NFR; P0 no los inventa.


## M08 · Brokers y co-broking

### Borrador para §2 Estado actual

Perfiles, invitación y asignación; agencies existe, co-broking operativo no acreditado.

- Pantallas: /brokers `src/app/(crm)/brokers/page.tsx:23`; /brokers/[id] `src/app/(crm)/brokers/[id]/page.tsx:33`.
- Aplicación/contratos: asignarProyectosABroker `src/application/brokers/casos-de-uso.ts:16`; crearUsuario `src/application/usuarios/casos-de-uso.ts:10`; editarUsuario `src/application/usuarios/casos-de-uso.ts:54`; borrarUsuario `src/application/usuarios/casos-de-uso.ts:94`; reenviarInvitacion `src/application/usuarios/casos-de-uso.ts:117`.
- Datos relacionados: broker_profiles `src/infrastructure/db/schema.ts:213`; users `src/infrastructure/db/schema.ts:160`; projects `src/infrastructure/db/schema.ts:424`; agencies `src/infrastructure/db/schema.ts:353`.
- Evidencia complementaria: crm-as-is.md §§1–7 para APIs/estados/permisos y límites de búsqueda.
- Pruebas presentes: `src/application/brokers/casos-de-uso.test.ts:1`; `src/application/usuarios/casos-de-uso.test.ts:1`. Ejecución actual UNKNOWN.
- Antes de READY: concretar permisos/seis estados por función, móvil 320/390, eventos/integraciones, criterios de aceptación y NFR; P0 no los inventa.


## M09 · Metas

### Borrador para §2 Estado actual

Meta mensual y lectura por periodo; SQL/carrera de auditoría pendientes.

- Pantallas: /metas `src/app/(crm)/metas/page.tsx:32`.
- Aplicación/contratos: fijarMetaMensual `src/application/metas/casos-de-uso.ts:22`.
- Datos relacionados: goals `src/infrastructure/db/schema.ts:852`; broker_profiles `src/infrastructure/db/schema.ts:213`.
- Evidencia complementaria: crm-as-is.md §§1–7 para APIs/estados/permisos y límites de búsqueda.
- Pruebas presentes: `src/application/metas/casos-de-uso.test.ts:1`. Ejecución actual UNKNOWN.
- Antes de READY: concretar permisos/seis estados por función, móvil 320/390, eventos/integraciones, criterios de aceptación y NFR; P0 no los inventa.


## M10 · Comisiones

### Borrador para §2 Estado actual

Aprobar/pagar/anular, reparto y CSV; lectura/tipos del CSV pendientes R4.3.

- Pantallas: /comisiones `src/app/(crm)/comisiones/page.tsx:22`.
- Aplicación/contratos: editarComision `src/application/comisiones/casos-de-uso.ts:25`; exportarComisionesCsv `src/application/comisiones/casos-de-uso.ts:114`; cambiarEtapaDeNegocio `src/application/pipeline/casos-de-uso.ts:43`; editarNegocio `src/application/pipeline/casos-de-uso.ts:213`; asociarPropiedad `src/application/pipeline/casos-de-uso.ts:264`; marcarPropiedadPrincipal `src/application/pipeline/casos-de-uso.ts:305`; quitarPropiedad `src/application/pipeline/casos-de-uso.ts:338`; cerrarNegocioGanado `src/application/pipeline/cierre.ts:43`.
- Datos relacionados: commissions `src/infrastructure/db/schema.ts:887`; deals `src/infrastructure/db/schema.ts:672`.
- Evidencia complementaria: crm-as-is.md §§1–7 para APIs/estados/permisos y límites de búsqueda.
- Pruebas presentes: `src/application/comisiones/casos-de-uso.test.ts:1`; `src/application/pipeline/casos-de-uso.test.ts:1`; `src/application/pipeline/cierre.test.ts:1`. Ejecución actual UNKNOWN.
- Antes de READY: concretar permisos/seis estados por función, móvil 320/390, eventos/integraciones, criterios de aceptación y NFR; P0 no los inventa.


## M11 · Comunicaciones

### Borrador para §2 Estado actual

Plantillas persistidas y despacho; email/sin configuración simulan éxito, previsualización fija.

- Pantallas: /comunicaciones `src/app/(crm)/comunicaciones/page.tsx:17`.
- Aplicación/contratos: listarPlantillasMensajes `src/application/comunicaciones/casos-de-uso.ts:19`; obtenerPlantillaMensaje `src/application/comunicaciones/casos-de-uso.ts:27`; crearPlantillaMensaje `src/application/comunicaciones/casos-de-uso.ts:38`; actualizarPlantillaMensaje `src/application/comunicaciones/casos-de-uso.ts:67`; prepararYDespacharMensaje `src/application/comunicaciones/casos-de-uso.ts:89`; consultarEstadosCanales `src/application/comunicaciones/casos-de-uso.ts:119`; consultarComunicaciones `src/application/comunicaciones/consultas.ts:11`.
- Datos relacionados: message_templates `src/infrastructure/db/schema.ts:1020`; integration_accounts `src/infrastructure/db/schema.ts:1081`.
- Evidencia complementaria: crm-as-is.md §§1–7 para APIs/estados/permisos y límites de búsqueda.
- Pruebas presentes: `src/application/comunicaciones/casos-de-uso.test.ts:1`. Ejecución actual UNKNOWN.
- Antes de READY: concretar permisos/seis estados por función, móvil 320/390, eventos/integraciones, criterios de aceptación y NFR; P0 no los inventa.


## M12 · Reportes

### Borrador para §2 Estado actual

Nueve tabs BI y CSV de embudo; comparativas/intervalos/distribuciones no se inventan.

- Pantallas: /reportes `src/app/(crm)/reportes/page.tsx:12`.
- Aplicación/contratos: assertMonetaryTotals `src/application/reportes/consultas.ts:10`; percentage `src/application/reportes/consultas.ts:19`; reportQuery `src/application/reportes/consultas.ts:22`; requireReadScope `src/application/reportes/consultas.ts:38`; presentReport `src/application/reportes/consultas.ts:41`; consultarReportesBi `src/application/reportes/consultas.ts:61`; dashboardScopes `src/application/dashboard/consultas.ts:7`; dashboardQuery `src/application/dashboard/consultas.ts:15`; consultarDashboard `src/application/dashboard/consultas.ts:23`.
- Datos relacionados: deals `src/infrastructure/db/schema.ts:672`; deal_stage_history `src/infrastructure/db/schema.ts:753`; leads `src/infrastructure/db/schema.ts:605`; marketing_campaigns `src/infrastructure/db/schema.ts:388`; campaign_spend `src/infrastructure/db/schema.ts:407`; units `src/infrastructure/db/schema.ts:475`; commissions `src/infrastructure/db/schema.ts:887`.
- Evidencia complementaria: crm-as-is.md §§1–7 para APIs/estados/permisos y límites de búsqueda.
- Pruebas presentes: `src/application/reportes/consultas.test.ts:1`; `src/application/dashboard/consultas.test.ts:1`. Ejecución actual UNKNOWN.
- Antes de READY: concretar permisos/seis estados por función, móvil 320/390, eventos/integraciones, criterios de aceptación y NFR; P0 no los inventa.


## M13 · Academy

### Borrador para §2 Estado actual

Formación/checklist con progreso por usuario; contenido local vacío, sin Moodle conectado acreditado.

- Pantallas: /academy `src/app/(crm)/academy/page.tsx:17`.
- Aplicación/contratos: listarContenidosAcademy `src/application/academy/casos-de-uso.ts:7`; obtenerDetalleContenido `src/application/academy/casos-de-uso.ts:15`; completarContenidoAcademy `src/application/academy/casos-de-uso.ts:25`; marcarPasoChecklist `src/application/academy/casos-de-uso.ts:35`; obtenerResumenProgresoBroker `src/application/academy/casos-de-uso.ts:44`; consultarAcademy `src/application/academy/consultas.ts:11`.
- Datos relacionados: academy_items `src/infrastructure/db/schema.ts:937`; academy_checklist_items `src/infrastructure/db/schema.ts:951`; academy_progress `src/infrastructure/db/schema.ts:970`; academy_checklist_progress `src/infrastructure/db/schema.ts:993`.
- Evidencia complementaria: crm-as-is.md §§1–7 para APIs/estados/permisos y límites de búsqueda.
- Pruebas presentes: `src/application/academy/casos-de-uso.test.ts:1`. Ejecución actual UNKNOWN.
- Antes de READY: concretar permisos/seis estados por función, móvil 320/390, eventos/integraciones, criterios de aceptación y NFR; P0 no los inventa.


## M14 · Configuración

### Borrador para §2 Estado actual

Seis paneles; no confundir tarjetas anunciadas con proveedores conectados.

- Pantallas: /configuracion `src/app/(crm)/configuracion/page.tsx:46`.
- Aplicación/contratos: crearUsuario `src/application/usuarios/casos-de-uso.ts:10`; editarUsuario `src/application/usuarios/casos-de-uso.ts:54`; borrarUsuario `src/application/usuarios/casos-de-uso.ts:94`; reenviarInvitacion `src/application/usuarios/casos-de-uso.ts:117`; editarPermisos `src/application/roles/casos-de-uso.ts:10`; esTipoCatalogo `src/application/catalogos/casos-de-uso.ts:23`; crearEntradaCatalogo `src/application/catalogos/casos-de-uso.ts:29`; editarEntradaCatalogo `src/application/catalogos/casos-de-uso.ts:51`; editarEtapa `src/application/etapas/casos-de-uso.ts:13`; restaurarDePapelera `src/application/papelera/casos-de-uso.ts:13`.
- Datos relacionados: users `src/infrastructure/db/schema.ts:160`; roles `src/infrastructure/db/schema.ts:146`; permissions `src/infrastructure/db/schema.ts:233`; pipeline_stages `src/infrastructure/db/schema.ts:287`; loss_reasons `src/infrastructure/db/schema.ts:307`; lead_sources `src/infrastructure/db/schema.ts:324`; integration_accounts `src/infrastructure/db/schema.ts:1081`.
- Evidencia complementaria: crm-as-is.md §§1–7 para APIs/estados/permisos y límites de búsqueda.
- Pruebas presentes: `src/application/usuarios/casos-de-uso.test.ts:1`; `src/application/roles/casos-de-uso.test.ts:1`; `src/application/catalogos/casos-de-uso.test.ts:1`; `src/application/etapas/casos-de-uso.test.ts:1`; `src/application/papelera/casos-de-uso.test.ts:1`. Ejecución actual UNKNOWN.
- Antes de READY: concretar permisos/seis estados por función, móvil 320/390, eventos/integraciones, criterios de aceptación y NFR; P0 no los inventa.


## M15 · Rentas

### Borrador para §2 Estado actual

No ruta/módulo dedicado localizado; operationType/pricePeriod compartidos no equivalen a gestión de rentas.

- Pantallas: sin página dedicada localizada en el árbol inventariado.
- Aplicación/contratos: sin caso de uso dedicado localizado.
- Datos relacionados: units `src/infrastructure/db/schema.ts:475`; projects `src/infrastructure/db/schema.ts:424`; leads `src/infrastructure/db/schema.ts:605`; deals `src/infrastructure/db/schema.ts:672`.
- Evidencia complementaria: `src/infrastructure/db/schema.ts:17`.
- Pruebas presentes: sin suite de aplicación dedicada atribuible; suites transversales/dominio en crm-as-is.md §7. Ejecución actual UNKNOWN.
- Antes de READY: concretar permisos/seis estados por función, móvil 320/390, eventos/integraciones, criterios de aceptación y NFR; P0 no los inventa.


## M16 · Cotizaciones y planes de pago

### Borrador para §2 Estado actual

Endpoint cotizador/confotur y cálculo puro JSON; sin cotización persistida, pantalla/PDF acreditados.

- Pantallas: sin página dedicada localizada en el árbol inventariado.
- Aplicación/contratos: generarCotizacionConfotur `src/application/confotur/casos-de-uso.ts:7`.
- Datos relacionados: sin persistencia propia localizada; no inferir tablas futuras.
- Evidencia complementaria: `src/app/api/cotizador/confotur/route.ts:26`; `src/domain/confotur.ts:1`.
- Pruebas presentes: sin suite de aplicación dedicada atribuible; suites transversales/dominio en crm-as-is.md §7. Ejecución actual UNKNOWN.
- Antes de READY: concretar permisos/seis estados por función, móvil 320/390, eventos/integraciones, criterios de aceptación y NFR; P0 no los inventa.


## M17 · Reservas

### Borrador para §2 Estado actual

Estado de unidad reserved no acredita reserva, caducidad ni workflow propio.

- Pantallas: sin página dedicada localizada en el árbol inventariado.
- Aplicación/contratos: sin caso de uso dedicado localizado.
- Datos relacionados: units `src/infrastructure/db/schema.ts:475`.
- Evidencia complementaria: `src/domain/catalogs.ts:140`.
- Pruebas presentes: sin suite de aplicación dedicada atribuible; suites transversales/dominio en crm-as-is.md §7. Ejecución actual UNKNOWN.
- Antes de READY: concretar permisos/seis estados por función, móvil 320/390, eventos/integraciones, criterios de aceptación y NFR; P0 no los inventa.


## M18 · Client Room

### Borrador para §2 Estado actual

No ruta, carpeta application ni tabla dedicada localizadas en árboles enumerados; capacidad externa UNKNOWN.

- Pantallas: sin página dedicada localizada en el árbol inventariado.
- Aplicación/contratos: sin caso de uso dedicado localizado.
- Datos relacionados: sin persistencia propia localizada; no inferir tablas futuras.
- Evidencia complementaria: crm-as-is.md §§1–7 para APIs/estados/permisos y límites de búsqueda.
- Pruebas presentes: sin suite de aplicación dedicada atribuible; suites transversales/dominio en crm-as-is.md §7. Ejecución actual UNKNOWN.
- Antes de READY: concretar permisos/seis estados por función, móvil 320/390, eventos/integraciones, criterios de aceptación y NFR; P0 no los inventa.


## M19 · Deal Room

### Borrador para §2 Estado actual

Inspector interno no equivale a colaboración externa; sin ruta/módulo dedicado localizado.

- Pantallas: sin página dedicada localizada en el árbol inventariado.
- Aplicación/contratos: cambiarEtapaDeNegocio `src/application/pipeline/casos-de-uso.ts:43`; editarNegocio `src/application/pipeline/casos-de-uso.ts:213`; asociarPropiedad `src/application/pipeline/casos-de-uso.ts:264`; marcarPropiedadPrincipal `src/application/pipeline/casos-de-uso.ts:305`; quitarPropiedad `src/application/pipeline/casos-de-uso.ts:338`; cerrarNegocioGanado `src/application/pipeline/cierre.ts:43`.
- Datos relacionados: deals `src/infrastructure/db/schema.ts:672`; deal_properties `src/infrastructure/db/schema.ts:719`; files `src/infrastructure/db/schema.ts:1034`.
- Evidencia complementaria: `src/app/(crm)/pipeline/inspector.tsx:1`.
- Pruebas presentes: `src/application/pipeline/casos-de-uso.test.ts:1`; `src/application/pipeline/cierre.test.ts:1`. Ejecución actual UNKNOWN.
- Antes de READY: concretar permisos/seis estados por función, móvil 320/390, eventos/integraciones, criterios de aceptación y NFR; P0 no los inventa.


## M20 · Portal del broker

### Borrador para §2 Estado actual

Vistas del CRM por rol; no portal externo dedicado localizado.

- Pantallas: sin página dedicada localizada en el árbol inventariado.
- Aplicación/contratos: sin caso de uso dedicado localizado.
- Datos relacionados: users `src/infrastructure/db/schema.ts:160`; broker_profiles `src/infrastructure/db/schema.ts:213`.
- Evidencia complementaria: `src/app/(crm)/layout.tsx:33`.
- Pruebas presentes: sin suite de aplicación dedicada atribuible; suites transversales/dominio en crm-as-is.md §7. Ejecución actual UNKNOWN.
- Antes de READY: concretar permisos/seis estados por función, móvil 320/390, eventos/integraciones, criterios de aceptación y NFR; P0 no los inventa.


## M21 · Inicio

### Borrador para §2 Estado actual

Dashboard real por recurso/alcance; no inventa comparativas sin histórico.

- Pantallas: /inicio `src/app/(crm)/inicio/page.tsx:9`.
- Aplicación/contratos: dashboardScopes `src/application/dashboard/consultas.ts:7`; dashboardQuery `src/application/dashboard/consultas.ts:15`; consultarDashboard `src/application/dashboard/consultas.ts:23`.
- Datos relacionados: leads `src/infrastructure/db/schema.ts:605`; deals `src/infrastructure/db/schema.ts:672`; activities `src/infrastructure/db/schema.ts:779`; goals `src/infrastructure/db/schema.ts:852`; projects `src/infrastructure/db/schema.ts:424`; academy_progress `src/infrastructure/db/schema.ts:970`.
- Evidencia complementaria: crm-as-is.md §§1–7 para APIs/estados/permisos y límites de búsqueda.
- Pruebas presentes: `src/application/dashboard/consultas.test.ts:1`. Ejecución actual UNKNOWN.
- Antes de READY: concretar permisos/seis estados por función, móvil 320/390, eventos/integraciones, criterios de aceptación y NFR; P0 no los inventa.


## G01 · Shell y navegación

### Borrador para §2 Estado actual

Layout, RBAC, sidebar/dock/cabecera; paleta de cabecera no recibe módulos filtrados.

- Pantallas: sin página dedicada localizada en el árbol inventariado.
- Aplicación/contratos: sin caso de uso dedicado localizado.
- Datos relacionados: users `src/infrastructure/db/schema.ts:160`.
- Evidencia complementaria: `src/app/(crm)/layout.tsx:39`; `src/app/(crm)/modulos.ts:1`; `src/app/(crm)/_ui/mobile-dock.tsx:1`.
- Pruebas presentes: sin suite de aplicación dedicada atribuible; suites transversales/dominio en crm-as-is.md §7. Ejecución actual UNKNOWN.
- Antes de READY: concretar permisos/seis estados por función, móvil 320/390, eventos/integraciones, criterios de aceptación y NFR; P0 no los inventa.


## G02 · Búsqueda global y paleta de comandos

### Borrador para §2 Estado actual

Paleta navega catálogo/atajos; no búsqueda global de entidades en servidor acreditada.

- Pantallas: sin página dedicada localizada en el árbol inventariado.
- Aplicación/contratos: sin caso de uso dedicado localizado.
- Datos relacionados: sin persistencia propia localizada; no inferir tablas futuras.
- Evidencia complementaria: `src/app/(crm)/_ui/command-palette.tsx:78`.
- Pruebas presentes: sin suite de aplicación dedicada atribuible; suites transversales/dominio en crm-as-is.md §7. Ejecución actual UNKNOWN.
- Antes de READY: concretar permisos/seis estados por función, móvil 320/390, eventos/integraciones, criterios de aceptación y NFR; P0 no los inventa.


## G03 · Notificaciones

### Borrador para §2 Estado actual

Tabla con cero filas; cabecera con tres avisos fijos y contador local. Backend de avisos no acreditado.

- Pantallas: sin página dedicada localizada en el árbol inventariado.
- Aplicación/contratos: sin caso de uso dedicado localizado.
- Datos relacionados: notifications `src/infrastructure/db/schema.ts:1056`.
- Evidencia complementaria: `src/app/(crm)/_ui/crm-header.tsx:42`.
- Pruebas presentes: sin suite de aplicación dedicada atribuible; suites transversales/dominio en crm-as-is.md §7. Ejecución actual UNKNOWN.
- Antes de READY: concretar permisos/seis estados por función, móvil 320/390, eventos/integraciones, criterios de aceptación y NFR; P0 no los inventa.


## G04 · Autenticación, roles y alcance

### Borrador para §2 Estado actual

Supabase SSR/actor/RBAC/evaluación local; sessions heredada sin uso, recuperación incompleta.

- Pantallas: /login `src/app/login/page.tsx:12`; /recuperar `src/app/recuperar/page.tsx:5`.
- Aplicación/contratos: crearUsuario `src/application/usuarios/casos-de-uso.ts:10`; editarUsuario `src/application/usuarios/casos-de-uso.ts:54`; borrarUsuario `src/application/usuarios/casos-de-uso.ts:94`; reenviarInvitacion `src/application/usuarios/casos-de-uso.ts:117`; editarPermisos `src/application/roles/casos-de-uso.ts:10`.
- Datos relacionados: roles `src/infrastructure/db/schema.ts:146`; users `src/infrastructure/db/schema.ts:160`; permissions `src/infrastructure/db/schema.ts:233`; sessions `src/infrastructure/db/schema.ts:259`.
- Evidencia complementaria: `src/middleware.ts:38`; `src/infrastructure/auth/actor.ts:59`; `src/domain/rbac.ts:73`.
- Pruebas presentes: `src/application/usuarios/casos-de-uso.test.ts:1`; `src/application/roles/casos-de-uso.test.ts:1`. Ejecución actual UNKNOWN.
- Antes de READY: concretar permisos/seis estados por función, móvil 320/390, eventos/integraciones, criterios de aceptación y NFR; P0 no los inventa.


## G05 · Auditoría

### Borrador para §2 Estado actual

Puerto transaccional/adaptador/historial por entidad; no pantalla global dedicada localizada.

- Pantallas: sin página dedicada localizada en el árbol inventariado.
- Aplicación/contratos: sin caso de uso dedicado localizado.
- Datos relacionados: audit_log `src/infrastructure/db/schema.ts:1108`.
- Evidencia complementaria: `src/infrastructure/audit.ts:1`; `src/app/(crm)/_ui/historial.tsx:24`.
- Pruebas presentes: `src/application/compartido/contrato.test.ts:1`. Ejecución actual UNKNOWN.
- Antes de READY: concretar permisos/seis estados por función, móvil 320/390, eventos/integraciones, criterios de aceptación y NFR; P0 no los inventa.


## G06 · i18n (es/en)

### Borrador para §2 Estado actual

Español y catálogo compartido de analítica; runtime multilingüe no acreditado.

- Pantallas: sin página dedicada localizada en el árbol inventariado.
- Aplicación/contratos: sin caso de uso dedicado localizado.
- Datos relacionados: sin persistencia propia localizada; no inferir tablas futuras.
- Evidencia complementaria: `src/app/(crm)/_ui/analitica-copy.ts:1`.
- Pruebas presentes: sin suite de aplicación dedicada atribuible; suites transversales/dominio en crm-as-is.md §7. Ejecución actual UNKNOWN.
- Antes de READY: concretar permisos/seis estados por función, móvil 320/390, eventos/integraciones, criterios de aceptación y NFR; P0 no los inventa.


## G07 · PWA y sin conexión

### Borrador para §2 Estado actual

Dock/estados offline parciales; service worker/cache durable/sync offline UNKNOWN.

- Pantallas: sin página dedicada localizada en el árbol inventariado.
- Aplicación/contratos: sin caso de uso dedicado localizado.
- Datos relacionados: sin persistencia propia localizada; no inferir tablas futuras.
- Evidencia complementaria: `src/app/(crm)/_ui/analytics-state.ts:5`; `src/app/(crm)/_ui/mobile-dock.tsx:35`.
- Pruebas presentes: sin suite de aplicación dedicada atribuible; suites transversales/dominio en crm-as-is.md §7. Ejecución actual UNKNOWN.
- Antes de READY: concretar permisos/seis estados por función, móvil 320/390, eventos/integraciones, criterios de aceptación y NFR; P0 no los inventa.


## G08 · Importación/exportación

### Borrador para §2 Estado actual

CSV comisiones/embudo e ICS; permiso import sin endpoint dedicado localizado.

- Pantallas: sin página dedicada localizada en el árbol inventariado.
- Aplicación/contratos: editarComision `src/application/comisiones/casos-de-uso.ts:25`; exportarComisionesCsv `src/application/comisiones/casos-de-uso.ts:114`; crearActividad `src/application/actividades/casos-de-uso.ts:14`; editarActividad `src/application/actividades/casos-de-uso.ts:63`; borrarActividad `src/application/actividades/casos-de-uso.ts:93`; exportarActividadesIcs `src/application/actividades/consultas.ts:6`.
- Datos relacionados: sin persistencia propia localizada; no inferir tablas futuras.
- Evidencia complementaria: `src/domain/csv.ts:1`; `src/domain/ics.ts:1`; `src/app/(crm)/reportes/vista.tsx:52`.
- Pruebas presentes: `src/application/comisiones/casos-de-uso.test.ts:1`; `src/application/actividades/casos-de-uso.test.ts:1`. Ejecución actual UNKNOWN.
- Antes de READY: concretar permisos/seis estados por función, móvil 320/390, eventos/integraciones, criterios de aceptación y NFR; P0 no los inventa.


## G09 · Deduplicación E.164

### Borrador para §2 Estado actual

Normalización/duplicados en altas y clave externa; duplicado de contacto es aviso, no unicidad absoluta.

- Pantallas: sin página dedicada localizada en el árbol inventariado.
- Aplicación/contratos: crearContacto `src/application/contactos/casos-de-uso.ts:29`; editarContacto `src/application/contactos/casos-de-uso.ts:96`; borrarContacto `src/application/contactos/casos-de-uso.ts:145`; consultarListadoContactos `src/application/contactos/consultas.ts:16`; crearLead `src/application/leads/casos-de-uso.ts:100`; asignarResponsableDeLead `src/application/leads/casos-de-uso.ts:198`; descartarLead `src/application/leads/casos-de-uso.ts:244`; capturarLeadExterno `src/application/leads/casos-de-uso.ts:299`; convertirLead `src/application/leads/conversion.ts:26`.
- Datos relacionados: contacts `src/infrastructure/db/schema.ts:569`; leads `src/infrastructure/db/schema.ts:605`.
- Evidencia complementaria: `src/domain/telefono.ts:1`; `src/application/contactos/casos-de-uso.ts:29`.
- Pruebas presentes: `src/application/contactos/casos-de-uso.test.ts:1`; `src/application/leads/casos-de-uso.test.ts:1`; `src/application/leads/conversion.test.ts:1`. Ejecución actual UNKNOWN.
- Antes de READY: concretar permisos/seis estados por función, móvil 320/390, eventos/integraciones, criterios de aceptación y NFR; P0 no los inventa.


## G10 · Integraciones y salud (outbox/DLQ)

### Borrador para §2 Estado actual

CrmPort/worker/no-op local; scheduler/UI DLQ/replay/inbox real no acreditados.

- Pantallas: sin página dedicada localizada en el árbol inventariado.
- Aplicación/contratos: sin caso de uso dedicado localizado.
- Datos relacionados: outbox `src/infrastructure/db/schema.ts:1131`; outbox_dead `src/infrastructure/db/schema.ts:1157`; external_refs `src/infrastructure/db/schema.ts:1166`; webhook_inbox `src/infrastructure/db/schema.ts:1181`; integration_accounts `src/infrastructure/db/schema.ts:1081`.
- Evidencia complementaria: `src/infrastructure/integraciones/outbox/runtime.ts:7`; `src/infrastructure/integraciones/outbox/worker.ts:28`; `src/infrastructure/integraciones/crm/local.ts:8`.
- Pruebas presentes: `src/application/compartido/contrato.test.ts:1`. Ejecución actual UNKNOWN.
- Antes de READY: concretar permisos/seis estados por función, móvil 320/390, eventos/integraciones, criterios de aceptación y NFR; P0 no los inventa.


## G11 · IA/asistente

### Borrador para §2 Estado actual

Extracción desde texto/propuesta humana/puerto ASR; ruta sin transcriptor; asistente/RAG no acreditados.

- Pantallas: sin página dedicada localizada en el árbol inventariado.
- Aplicación/contratos: procesarNotaDeVozLead `src/application/ai/casos-de-uso.ts:4`.
- Datos relacionados: sin persistencia propia localizada; no inferir tablas futuras.
- Evidencia complementaria: `src/app/api/ai/audio-transcribe/route.ts:26`; `src/domain/audio-lead-extractor.ts:1`.
- Pruebas presentes: `src/application/ai/casos-de-uso.test.ts:1`. Ejecución actual UNKNOWN.
- Antes de READY: concretar permisos/seis estados por función, móvil 320/390, eventos/integraciones, criterios de aceptación y NFR; P0 no los inventa.


## Fuentes

- Catálogo: `.viltrum/vre-os/FLUJO-PASADAS.md:49`; plantilla §2: `.viltrum/vre-os/spec/_plantilla-modulo.md:18`.
- Referencias archivo:línea en cada fila; árbol/API/permisos/estados/controles en crm-as-is.md.
- Tarea/perfil: `.viltrum/dispatch/20261004T220027Z-D03-codex/TAREA.md:1`, `.viltrum/dispatch/20261004T220027Z-D03-codex/PERFIL.md:1`; constitución `.specify/memory/constitution.md:1`.

## Pruebas

Comandos usados: rg --files, lectura Node/AST por stdin, git status/rev-parse/branch; GitNexus list_repos/query (índice anterior/sin resultados pertinentes); conteos --counts y SELECT agregados en transacción local read only; npm.cmd run lint (exit 1: 2 errores y 15 warnings). Detalle en crm-as-is.md ## Pruebas. Verificación documental final: 32 ids únicos, una subsección por ficha y referencias existentes. Sin tests/build/dev ni UI; resultado actual UNKNOWN.


Verificador documental final: PASS de integridad documental (sin aceptación de contenido): 19 páginas, 47 route.ts, 56 handlers, 39 tablas, 21 carpetas application, 32 fichas únicas; 947 referencias únicas con archivo existente/línea válida; secciones 1–7, Fuentes, Pruebas y Handoff presentes. Patrón automatizado de credenciales sin coincidencias; no equivale a auditoría completa de secretos.

## Handoff

Estado REVIEW. D22 de otro proveedor verifica cruce e ids contra P0; D00 decide siguiente pasada. P1/P2 reciben borradores con capacidades parciales, datos vacíos y ausencias explícitas. D03 no aprueba inventario ni marca módulos READY. Únicos documentos producidos: crm-as-is.md y crm-mapa-modulos.md; cms-reutilizable.md existente se conserva.
