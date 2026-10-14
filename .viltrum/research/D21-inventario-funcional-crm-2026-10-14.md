# D21 · Inventario funcional verificado del CRM (2026-10-14)

Modo: solo lectura. No se editó nada en `src/`. No se ejecutó `npm run dev` ni `build`.
Método: Grep/Glob/lectura de extractos sobre `src/app/(crm)`, `src/app/api`, `src/application`, `src/infrastructure`, `src/domain` y `scripts/`. Los nombres de variables de entorno se listan sin valores; no se abrió ningún `.env*`.

Leyenda de madurez:
- **REAL**: lee y escribe con casos de uso y BD; estados vacío/error presentes.
- **PARCIAL**: BD real, pero faltan acciones (editar, borrar, filtros) o trazabilidad.
- **MAQUETA**: datos fijos o controles sin acción.
- **AUSENTE**: no hay UI.

---

## 1. Tabla resumen

| Módulo | Madurez | UI (ruta) | API (endpoints) | Casos de uso (application) | Pruebas | Huecos principales |
|---|---|---|---|---|---|---|
| inicio | REAL (solo lectura) | `/inicio` | ninguna (lectura en servidor) | `consultarDashboard`, `dashboardScopes` | `dashboard/consultas.test.ts`, `_ui/analitica.test.ts`, `lecturas.db.test.ts` | Sin widgets configurables |
| reportes | REAL (lectura + CSV cliente) | `/reportes` | ninguna (CSV en cliente) | `consultarReportesBi` | `reportes/consultas.test.ts`, `analitica.test.ts`, `lecturas.db.test.ts` | Sin fuente de campañas de marketing; sin error/loading propios de módulo (sí tiene) |
| negocios | REAL | `/negocios` | 4 rutas `/api/pipeline/...` | `cambiarEtapaDeNegocio`, `cerrarNegocioGanado`, `editarNegocio`, `asociarPropiedad`, `marcarPropiedadPrincipal`, `quitarPropiedad`, consultas de tablero/lista/ficha | `negocios/tablero.test.ts`, `pipeline/*.test.ts`, `db/negocios.db.test.ts`, `db/cierre.db.test.ts`, `scripts/test-db` | Sin alta directa de negocio (solo por conversión de lead); sin plan de pagos ni reservas |
| leads | REAL | `/leads` | `POST /api/leads`, `PATCH /api/leads/[id]`, `POST .../convertir`, `POST .../descartar`, `POST /api/leads/externo` (token) | `crearLead`, `asignarResponsableDeLead`, `convertirLead`, `descartarLead`, `capturarLeadExterno` | `leads/casos-de-uso.test.ts`, `leads/conversion.test.ts`, `domain/asignacion-lead.test.ts` | Sin importación masiva; `leads/page.tsx:20` importa desde `app/api` |
| contactos | REAL | `/contactos` | `POST /api/contactos`, `PATCH`/`DELETE /api/contactos/[id]` | `consultarListadoContactos`, `crearContacto`, `editarContacto`, `borrarContacto` | `contactos/casos-de-uso.test.ts` | Sin importar/exportar CSV; sin fusión de duplicados |
| propiedades | REAL | `/propiedades`, `/propiedades/[slug]` | `POST /api/proyectos`, `PATCH`/`DELETE /api/proyectos/[id]`, `POST`/`PATCH`/`DELETE` unidades | `crearProyecto`, `editarProyecto`, `borrarProyecto`, `crearUnidad`, `editarUnidad`, `borrarUnidad` | `proyectos/casos-de-uso.test.ts`, `domain/unidades.test.ts`, `domain/slug.test.ts` | Sin portal público de inventario; tablas de inventario/pagos sin uso |
| avances | REAL | `/avances` | `POST`/`PATCH`/`DELETE /api/proyectos/[id]/fases[/faseId]`, `POST`/`DELETE .../fotos[/fileId]` | `crearFases`, `editarFase`, `borrarFase`, `subirFotos`, `borrarFoto` | `proyectos/casos-de-uso.test.ts`, `domain/avance-obra.test.ts` | Fases fijas en código (`domain/avance-obra.ts:36`); sin error/loading propios |
| brokers | REAL (lectura + asignación) | `/brokers`, `/brokers/[id]` | `PUT /api/brokers/[id]/proyectos`; invitar reutiliza `POST /api/usuarios` | `asignarProyectosABroker`, `brokersEnMemoria` (puerto) | `brokers/casos-de-uso.test.ts` | Sin edición del perfil de broker desde su ficha; sin error/loading propios |
| comisiones | REAL | `/comisiones` | `PATCH /api/comisiones/[id]` (estado y reparto), `GET /api/comisiones/export` (CSV) | `editarComision`, `exportarComisionesCsv` | `comisiones/casos-de-uso.test.ts`, `domain/comision-estado.test.ts`, `lecturas.db.test.ts` | Sin registro de pago al broker (solo estado `paid`); `comisiones/_consulta.ts:28` consulta BD desde carpeta de UI |
| comunicaciones | PARCIAL | `/comunicaciones` | `GET /api/comunicaciones/canales`, `GET`/`POST /api/comunicaciones/plantillas`, `PUT .../plantillas/[id]`, `POST /api/comunicaciones/despachar` | `crearPlantillaMensaje`, `actualizarPlantillaMensaje`, `prepararYDespacharMensaje`, `consultarComunicaciones`, `consultarEstadosCanales` | `comunicaciones/casos-de-uso.test.ts`, `domain/comunicaciones.test.ts`, `infrastructure/comunicaciones/proveedor-despacho.test.ts` | Envíos sin registro ni historial; sin bandeja de entrada; sin borrar plantilla; despacho autorizado con `communications:view` |
| academy | REAL (contenido de solo lectura + progreso) | `/academy` | `GET /api/academy`, `PUT /api/academy/[id]/progreso`, `PUT /api/academy/checklist/[id]` | `consultarAcademy`, `completarContenidoAcademy`, `marcarPasoChecklist`, `obtenerResumenProgresoBroker` | `academy/casos-de-uso.test.ts`, `api/academy/route.test.ts` | Sin administración de contenidos; banner offline promete sincronización que no existe |
| agenda | PARCIAL | `/agenda` | `POST /api/actividades`, `GET /api/actividades/ics` | `crearActividad`, `exportarActividadesIcs` | `actividades/casos-de-uso.test.ts`, `domain/ics.test.ts`, `domain/zona-horaria.test.ts` | Sin editar, reprogramar ni cancelar desde UI; sin vista mes/día |
| tareas | PARCIAL | `/tareas` | `POST /api/actividades`, `PATCH /api/actividades/[id]` (completar) | `crearActividad`, `editarActividad`, `borrarActividad` (sin UI de editar/borrar) | `actividades/casos-de-uso.test.ts` | Sin editar ni borrar desde UI (existe `DELETE` en API); sin filtros |
| metas | REAL | `/metas` | `PUT /api/metas` | `fijarMetaMensual` | `metas/casos-de-uso.test.ts`, `api/metas/route.test.ts`, `domain/metas.test.ts` | Solo fijar/actualizar; sin histórico; sin error/loading propios |
| configuracion | REAL (una pestaña MAQUETA) | `/configuracion` (tabs: usuarios, roles/permisos, catálogos, etapas, papelera, integraciones) | `POST /api/usuarios`, `PATCH`/`DELETE /api/usuarios/[id]`, `POST .../invitacion`, `PATCH /api/roles/[id]/permisos`, `POST`/`PATCH /api/catalogos/[tipo][/id]`, `PATCH /api/etapas/[id]`, `POST /api/papelera/restaurar` | `crearUsuario`, `editarUsuario`, `borrarUsuario`, `reenviarInvitacion`, `editarPermisos`, `crearEntradaCatalogo`, `editarEntradaCatalogo`, `editarEtapa`, `restaurarDePapelera` | `usuarios/`, `roles/`, `catalogos/`, `etapas/`, `papelera/` `casos-de-uso.test.ts` | Integraciones: tarjetas fijas (MAQUETA); papelera con `limit(30)` por tipo |
| ai (sin vista) | API sin UI | ninguna | `POST /api/ai/audio-transcribe` | `procesarNotaDeVozLead` | `ai/casos-de-uso.test.ts` | Ningún componente de `(crm)` llama a la ruta |
| confotur (sin vista) | API sin UI (AUSENTE en UI) | ninguna | `POST /api/cotizador/confotur` | `generarCotizacionConfotur`; dominio `domain/confotur.ts` | `domain/confotur.test.ts` | Ningún componente llama a la ruta; solo aparece el badge "Confotur" en `propiedades/vista.tsx:121-139` |

---

## 2. Hallazgos transversales

**Seguridad y permisos (verificado)**
- Las 48 rutas de `src/app/api/` existen. Cada ruta de negocio llama a `requireScope` o `requireFullScope`. Excepciones: `auth/login`, `auth/logout`, `auth/recuperar`, `auth/demo` (públicas por diseño; `demo` solo funciona con `NODE_ENV=development`, `CRM_EVAL_LOGIN=1` y host loopback, `infrastructure/env.ts:87`).
- `POST /api/leads/externo` no llama a `requireScope` (verificado con Grep: sin coincidencias). Se autentica con `x-webhook-token` contra `LEADS_WEBHOOK_TOKEN` (`src/app/api/leads/externo/route.ts:65-70`). Es excepción documentada.
- `POST /api/comunicaciones/despachar` exige solo `communications:view` (`src/app/api/comunicaciones/despachar/route.ts:24`). El caso de uso `prepararYDespacharMensaje` (`src/application/comunicaciones/casos-de-uso.ts:89`) no hace ninguna comprobación adicional. Enviar mensajes externos con un permiso de lectura es un punto a revisar.
- Ninguna ruta usa el permiso `import` (`PERMISSION_ACTIONS` en `src/domain/catalogs.ts:19-26` lo define, sin uso en API).
- Rutas `[id]` sin `visibleRows`/`reaches` en el propio route.ts: 21 casos. La mayoría delega en casos de uso con alcance (`proyectos/[id]/route.ts` aplica el alcance en `borrarProyecto`/`editarProyecto`). Para catálogos y etapas, que son globales, no hace falta filtro por fila. No se verificó caso por caso `brokers/[id]/proyectos` ni `academy/[id]/progreso`.
- Las 11 tablas con `.enableRLS()` están en `src/infrastructure/db/schema.ts`. El resto de tablas tiene RLS en las migraciones `drizzle/*.sql` (`seguridad.test.ts:15` acepta ambas formas).

**Maquetas y datos fijos**
- `src/app/(crm)/_ui/datos-muestra.ts` (110 líneas, mock portado del prototipo) no tiene ningún importador en `src`. Es código muerto.
- `src/app/(crm)/configuracion/_integraciones.tsx:20-29`: `TARJETAS` fijas. Los botones están deshabilitados con motivo. La tarjeta de Outbox dice "Worker transaccional activo" (línea 23), pero el worker no tiene ningún disparador (ver abajo).
- `src/app/(crm)/comunicaciones/vista.tsx:54-61`: `VARIABLES_DISPONIBLES` con valores de ejemplo para vista previa. Es ejemplo, no dato de producción.
- `src/app/(crm)/academy/vista.tsx:249`: el banner dice "Los cambios locales se sincronizarán al recuperar la red", pero `estaOffline` solo muestra el banner (líneas 59, 246). No hay cola de cambios offline. Afirmación falsa en UI.

**Estados de vista (vacío / error / carga)**
- `error.tsx` y `loading.tsx` a nivel de módulo: solo en `contactos`, `inicio`, `leads`, `negocios` y `reportes`. Falta en `academy`, `agenda`, `avances`, `brokers`, `comisiones`, `comunicaciones`, `configuracion`, `metas`, `propiedades` y `tareas`. Sí existen `error.tsx` y `loading.tsx` a nivel raíz de `(crm)`.
- Estados vacíos presentes: `comisiones/vista.tsx:372`, `brokers/vista.tsx:76,183`, `metas/vista.tsx:92`.

**Capas (arquitectura)**
- Muchas `page.tsx` consultan BD directamente con `getDb()` y no pasan por `application`: `agenda`, `avances`, `brokers`, `brokers/[id]`, `comisiones` (vía `_consulta.ts`), `configuracion`, `leads`, `metas`, `propiedades`, `propiedades/[slug]`, `tareas`. `_ui/historial.tsx:60` también.
- `src/app/(crm)/leads/page.tsx:20` importa `candidatosBroker` desde `src/app/api/leads/_broker-candidatos.ts` (capa de presentación importa de rutas API).
- `avances/page.tsx:22,126` usa `adminClient()` (service role) en servidor, con captura de error en la línea 110.

**Outbox y comunicaciones**
- `ejecutarLoteOutbox` (`src/infrastructure/integraciones/outbox/runtime.ts:7`) no tiene ningún invocador en `src`, `scripts` ni `.github` (no hay workflows con cron). El outbox acumula eventos (`pipeline.ts` escribe en `outbox`), pero nada los entrega.
- `prepararYDespacharMensaje` (`comunicaciones/casos-de-uso.ts:103-118`) solo llama a `proveedor.despachar(payload)` y devuelve el resultado. No persiste nada ni audita el envío.

---

## 3. Detalle por módulo

### inicio
- UI: `src/app/(crm)/inicio/page.tsx` (17 líneas), `vista.tsx` (69), `error.tsx`, `loading.tsx`. Usa `requireScopeInPage(actor,"dashboard","view")`.
- API: ninguna.
- Casos de uso: `src/application/dashboard/consultas.ts` (`consultarDashboard`, `dashboardScopes`). Repo: `src/infrastructure/db/repos/dashboard.ts`.
- Tablas: `academy_progress`, `activities`, `contacts`, `deals`, `goals`, `leads`, `projects`, `users`.
- Pruebas: `src/application/dashboard/consultas.test.ts`, `src/app/(crm)/_ui/analitica.test.ts`, `src/infrastructure/db/lecturas.db.test.ts`.
- Madurez: REAL.
- Huecos: no hay widgets configurables ni comparativas de periodo anterior verificadas.

### reportes
- UI: `reportes/page.tsx` (25), `vista.tsx` (92), `filtros-vista.tsx`, `filtros.ts`, `error.tsx`, `loading.tsx`. Exporta CSV en cliente con `generarCsv` (`domain/csv.ts`). El botón de exportar depende de `can(actor,"reports","export")`.
- Casos de uso: `src/application/reportes/consultas.ts` (`consultarReportesBi`), `consultarDashboard`. Repo: `repos/reportes.ts`.
- Tablas: `commissions`, `deals`, `leads`, `loss_reasons`, `projects`, `units`, `users`.
- Pruebas: `application/reportes/consultas.test.ts`, `_ui/analitica.test.ts`, `db/lecturas.db.test.ts`.
- Madurez: REAL.
- Huecos: ninguna tabla de marketing (`marketing_campaigns` y `campaign_spend` sin uso fuera de `schema.ts`). El CSV no se genera en servidor ni deja registro de auditoría.

### negocios
- UI: `negocios/page.tsx` (54), `vista.tsx` (1079: tablero, lista, análisis, cambio de etapa), `inspector.tsx` (510), `antiguedad.ts`, `error.tsx`, `loading.tsx`, `tablero.test.ts`.
- API: `PATCH /api/pipeline/[id]` (cierre y preselección), `PATCH /api/pipeline/[id]/etapa`, `POST /api/pipeline/[id]/propiedades`, `PATCH`/`DELETE /api/pipeline/[id]/propiedades/[propId]` (motivo obligatorio en DELETE).
- Casos de uso: `application/pipeline/casos-de-uso.ts` (`cambiarEtapaDeNegocio`, `cerrarNegocioGanado`, `editarNegocio`, `asociarPropiedad`, `marcarPropiedadPrincipal`, `quitarPropiedad`, `retirarPropiedadSchema`); `consultas.ts` (`consultarTableroNegocios`, `consultarListaNegocios`, `consultarFichaNegocio`, `consultarCatalogosNegocios`, `consultarVentasHistoricasSinUnidad`); `cierre.ts`; `dto.ts`, `entrada.ts`. Pasar a `lost` exige motivo y comentario (`casos-de-uso.ts:149-153`).
- Repos: `repos/pipeline.ts`, `repos/pipeline-lectura.ts`.
- Tablas: `activities`, `brokers` (`broker_profiles`), `commissions`, `contacts`, `deal_properties`, `deal_stage_history`, `deals`, `goals`, `lead_sources`, `loss_reasons`, `outbox`, `pipeline_stages`, `projects`, `unit_sales`, `units`, `users`.
- Pruebas: `application/pipeline/{casos-de-uso,cierre,consultas,entrada-dto}.test.ts`, `src/infrastructure/db/negocios.db.test.ts` y `cierre.db.test.ts` (son envoltorios de `scripts/test-db/negocios.ts` y `cierre.ts`, que se activan con `npm run test:db`), `lecturas.db.test.ts`.
- Madurez: REAL. Es el módulo más completo.
- Huecos: sin alta directa de negocio; `deals` se crean solo al convertir lead (`application/leads/conversion.ts`). Sin plan de pagos, apartado ni contrato.

### leads
- UI: `leads/page.tsx` (160), `vista.tsx` (571), `inspector.tsx` (250), `error.tsx`, `loading.tsx`.
- API: `POST /api/leads`, `PATCH /api/leads/[id]`, `POST /api/leads/[id]/convertir`, `POST /api/leads/[id]/descartar`, `POST /api/leads/externo` (token).
- Casos de uso: `application/leads/casos-de-uso.ts` (`crearLead`, `asignarResponsableDeLead`, `convertirLead`, `descartarLead`, `capturarLeadExterno`), `conversion.ts`. Repo: `repos/leads.ts`.
- Tablas: `audit_log`, `broker_profiles`, `contacts`, `deals`, `leads`, `pipeline_stages`, `users`, `lead_sources`, `projects`.
- Pruebas: `leads/casos-de-uso.test.ts`, `leads/conversion.test.ts`, `domain/asignacion-lead.test.ts`, `lecturas.db.test.ts` (candidatos duplicados).
- Madurez: REAL.
- Huecos: sin importación masiva; no se encontró SLA ni recordatorio de primer contacto en el código; `leads/page.tsx:20` importa desde `app/api`.

### contactos
- UI: `contactos/page.tsx` (81), `vista.tsx` (410), `inspector.tsx` (215), `error.tsx`, `loading.tsx`. Búsqueda y paginación con `TAMANIO_PAGINA_CONTACTOS`.
- API: `POST /api/contactos`, `PATCH`/`DELETE /api/contactos/[id]`.
- Casos de uso: `application/contactos/consultas.ts` (`consultarListadoContactos`), `casos-de-uso.ts` (`crearContacto`, `editarContacto`, `borrarContacto`). Repo: `repos/contactos.ts`.
- Tablas: `contacts`, `lead_sources`, `roles`, `users`.
- Pruebas: `application/contactos/casos-de-uso.test.ts`.
- Madurez: REAL.
- Huecos: sin importar ni exportar CSV (no hay ruta); sin detección ni fusión de duplicados en UI.

### propiedades
- UI: `propiedades/page.tsx` (117), `vista.tsx` (191), `_formulario-proyecto.tsx`, `[slug]/page.tsx` (detalle), `[slug]/vista.tsx` (~270). El precio se oculta con `stripRestrictedPrices` según rol.
- API: `POST /api/proyectos`, `PATCH`/`DELETE /api/proyectos/[id]`, `POST /api/proyectos/[id]/unidades`, `PATCH`/`DELETE .../unidades/[unitId]`.
- Casos de uso: `application/proyectos/casos-de-uso.ts` (`crearProyecto`, `editarProyecto`, `borrarProyecto`, `crearUnidad`, `editarUnidad`, `borrarUnidad`). Repo: `repos/proyectos.ts`.
- Tablas: `projects`, `units`, `construction_phases`, `files`.
- Pruebas: `application/proyectos/casos-de-uso.test.ts`, `domain/unidades.test.ts`, `domain/slug.test.ts`.
- Madurez: REAL.
- Huecos: sin portal público de proyectos (`src/app` solo tiene `login`, `recuperar`, `forbidden`). Sin uso fuera de schema: `unit_inventory_states` (0 archivos), `payment_methods` (0), `agencies` (0), `zones` (5, solo lectura). Sin reservas ni plan de pagos.

### avances
- UI: `avances/page.tsx` (144), `vista.tsx` (411). Sin `error.tsx` ni `loading.tsx` de módulo.
- API: `POST`/`PATCH`/`DELETE /api/proyectos/[id]/fases[/faseId]`, `POST`/`DELETE .../fases/[faseId]/fotos[/fileId]`. Publicar avance se hace con `PATCH`.
- Casos de uso: `application/proyectos/casos-de-uso.ts` (`crearFases`, `editarFase`, `borrarFase`, `subirFotos`, `borrarFoto`).
- Tablas: `construction_phases`, `files`, `projects`, `users`.
- Pruebas: `application/proyectos/casos-de-uso.test.ts`, `domain/avance-obra.test.ts`.
- Madurez: REAL.
- Huecos: la lista de fases es fija en `domain/avance-obra.ts:36` (no hay plantillas configurables). `files` solo guarda fotos, sin documentos.

### brokers
- UI: `brokers/page.tsx` (113), `vista.tsx` (232), `brokers/[id]/page.tsx` (sin vista propia). Invitar abre `FormularioUsuario` de `configuracion/_usuarios.tsx` (`brokers/vista.tsx:8`).
- API: `PUT /api/brokers/[id]/proyectos`. Invitación: `POST /api/usuarios`.
- Casos de uso: `application/brokers/casos-de-uso.ts` (`asignarProyectosABroker`).
- Tablas: `broker_profiles`, `projects`, `users`, `roles`, `deals`, `goals`, `pipeline_stages`, `contacts`.
- Pruebas: `application/brokers/casos-de-uso.test.ts`.
- Madurez: REAL (lectura y asignación).
- Huecos: sin edición del perfil desde su ficha; sin error/loading propios.

### comisiones
- UI: `comisiones/page.tsx` (103), `vista.tsx` (379), `_consulta.ts` (consulta BD con `getDb`, línea 28).
- API: `PATCH /api/comisiones/[id]` (`approved`, `paid`, `void`, reparto), `GET /api/comisiones/export` (`requireScope(actor,"commissions","export")`, línea 24).
- Casos de uso: `application/comisiones/casos-de-uso.ts` (`editarComision`, `exportarComisionesCsv`). Las comisiones se generan al cerrar negocio (`application/pipeline/cierre.ts`).
- Tablas: `commissions`, `deals`, `contacts`, `projects`, `users`, `roles`, `deal_properties`.
- Pruebas: `application/comisiones/casos-de-uso.test.ts`, `domain/comision-estado.test.ts`, `lecturas.db.test.ts`.
- Madurez: REAL.
- Huecos: sin registro de pago (fecha, referencia); `_consulta.ts` salta la capa de aplicación; sin error/loading propios.

### comunicaciones
- UI: `comunicaciones/page.tsx` (37), `vista.tsx` (647). Filtro por canal (`todos`, `telegram`, `whatsapp`, `email`).
- API: `GET /api/comunicaciones/canales`, `GET`/`POST /api/comunicaciones/plantillas`, `PUT /api/comunicaciones/plantillas/[id]` (sin `DELETE`), `POST /api/comunicaciones/despachar` (`communications:view`).
- Casos de uso: `application/comunicaciones/casos-de-uso.ts` (`crearPlantillaMensaje`, `actualizarPlantillaMensaje`, `obtenerPlantillaMensaje`, `listarPlantillasMensajes`, `prepararYDespacharMensaje`), `consultas.ts` (`consultarComunicaciones`, `consultarEstadosCanales`).
- Infra: `src/infrastructure/comunicaciones/proveedor-despacho.ts` (`ProveedorDespachoMulticanal`): Telegram Bot API, WhatsApp Cloud API `graph.facebook.com/v21.0`, webhook solo a destinos de `CRM_WEBHOOK_DESTINATIONS` (allowlist, timeout 10 s). Sin token configurado devuelve error de canal.
- Repo: `repos/comunicaciones.ts` (`message_templates`).
- Pruebas: `application/comunicaciones/casos-de-uso.test.ts`, `domain/comunicaciones.test.ts`, `infrastructure/comunicaciones/proveedor-despacho.test.ts`.
- Madurez: PARCIAL (plantillas y despacho reales; sin trazabilidad ni bandeja).
- Huecos: los envíos no quedan registrados (`casos-de-uso.ts:103-118`); sin bandeja de respuestas entrantes (`webhook_inbox` sin uso en TypeScript); sin borrar plantilla; despacho autorizado con `view`.

### academy
- UI: `academy/page.tsx` (37), `vista.tsx` (521): filtros (todas, sesiones, checklists, pendientes, completadas), búsqueda, reintento. Texto fijo "Ley 158-01 (Confotur)" en `vista.tsx:505`.
- API: `GET /api/academy`, `PUT /api/academy/[id]/progreso`, `PUT /api/academy/checklist/[id]`.
- Casos de uso: `application/academy/casos-de-uso.ts` (`completarContenidoAcademy`, `marcarPasoChecklist`), `consultas.ts` (`consultarAcademy`, `listarContenidosAcademy`, `obtenerDetalleContenido`, `obtenerResumenProgresoBroker`). Repo: `repos/academy.ts`.
- Tablas: `academy_items`, `academy_checklist_items`, `academy_progress`, `academy_checklist_progress`.
- Pruebas: `application/academy/casos-de-uso.test.ts`, `src/app/api/academy/route.test.ts`.
- Madurez: REAL (consumo y progreso). No hay administración de contenidos.
- Huecos: el banner offline es falso (`vista.tsx:249`); sin editor de contenidos.

### agenda
- UI: `agenda/page.tsx` (66, consulta BD directa a `activities` y `users`), `vista.tsx` (254): semana con navegación, creación de cita, enlace ICS. Sin `error.tsx`/`loading.tsx`.
- API: `POST /api/actividades`, `GET /api/actividades/ics`.
- Casos de uso: `application/actividades/casos-de-uso.ts` (`crearActividad`, `exportarActividadesIcs`; `editarActividad` y `borrarActividad` no tienen UI aquí).
- Tablas: `activities`, `users`, `deals`.
- Pruebas: `application/actividades/casos-de-uso.test.ts`, `domain/ics.test.ts`, `domain/zona-horaria.test.ts`.
- Madurez: PARCIAL.
- Huecos: no se puede editar, reprogramar ni cancelar cita desde la UI; sin vista mes/día; sin sincronización con Google Calendar (solo ICS).

### tareas
- UI: `tareas/page.tsx` (68, consulta BD directa), `vista.tsx` (232): cola del día, completar (`PATCH`, `vista.tsx:57`), crear tarea, carga del equipo (solo alcance `all`).
- API: `POST /api/actividades`, `PATCH /api/actividades/[id]`. `DELETE /api/actividades/[id]` existe pero sin UI.
- Casos de uso: `crearActividad`, `editarActividad`, `borrarActividad` (`application/actividades/casos-de-uso.ts`).
- Tablas: `activities`, `users`.
- Pruebas: `application/actividades/casos-de-uso.test.ts`.
- Madurez: PARCIAL.
- Huecos: sin editar ni borrar; sin filtros; sin error/loading propios.

### metas
- UI: `metas/page.tsx` (115), `vista.tsx` (277): meta de compañía y por broker con edición por diálogo.
- API: `PUT /api/metas`.
- Casos de uso: `application/metas/casos-de-uso.ts` (`fijarMetaMensual`). Repo: `repos/metas.ts`.
- Tablas: `goals`, `broker_profiles`, `users`.
- Pruebas: `application/metas/casos-de-uso.test.ts`, `api/metas/route.test.ts`, `domain/metas.test.ts`.
- Madurez: REAL.
- Huecos: sin histórico de metas; sin error/loading propios.

### configuracion
- UI: `configuracion/page.tsx` (148), `vista.tsx` (82) y subcomponentes: `_usuarios.tsx`, `_permisos.tsx` (matriz recurso × acción × alcance), `_catalogos.tsx`, `_etapas.tsx`, `_papelera.tsx`, `_integraciones.tsx`.
- API: `POST /api/usuarios`, `PATCH`/`DELETE /api/usuarios/[id]`, `POST /api/usuarios/[id]/invitacion`, `PATCH /api/roles/[id]/permisos`, `POST /api/catalogos/[tipo]`, `PATCH /api/catalogos/[tipo]/[id]`, `PATCH /api/etapas/[id]`, `POST /api/papelera/restaurar`.
- Casos de uso: `usuarios` (`crearUsuario`, `editarUsuario`, `borrarUsuario`, `reenviarInvitacion`), `roles` (`editarPermisos`), `catalogos` (`crearEntradaCatalogo`, `editarEntradaCatalogo`), `etapas` (`editarEtapa`), `papelera` (`restaurarDePapelera`).
- Repos: `usuarios.ts`, `roles.ts`, `catalogos.ts`, `etapas.ts`, `papelera.ts`.
- Tablas: `users`, `roles`, `permissions`, `broker_profiles`, `pipeline_stages`, `lead_sources`, `loss_reasons`, y en papelera `contacts`, `leads`, `deals`, `projects`, `units`.
- Pruebas: `application/{usuarios,roles,catalogos,etapas,papelera}/casos-de-uso.test.ts`.
- Madurez: REAL, salvo la pestaña de integraciones (MAQUETA).
- Huecos: `configuracion/page.tsx` (~líneas 128-141) trae `limit(30)` por tipo de entidad y ordena en memoria; la papelera queda incompleta más allá de 30 por tipo. Sin tests de `_integraciones` (la pestaña es fija).

### Módulos de application sin vista propia
- **ai**: `application/ai/casos-de-uso.ts` (`procesarNotaDeVozLead`). API `POST /api/ai/audio-transcribe` (`requireScope`). Ningún componente de `(crm)` la llama (búsqueda por "transcrib", "grabar", "MediaRecorder" sin resultados). Prueba: `application/ai/casos-de-uso.test.ts`. Madurez: API sin UI.
- **confotur**: `application/confotur/casos-de-uso.ts` (`generarCotizacionConfotur`), `domain/confotur.ts`, `POST /api/cotizador/confotur` (`requireScope`). Sin llamadas desde `(crm)`. Prueba: `domain/confotur.test.ts`. Madurez: AUSENTE en UI.
- **dashboard, actividades, etapas, papelera, roles, usuarios, catalogos, proyectos, pipeline**: cubiertos en las filas de sus módulos de UI.
- **compartido** (puertos y adaptadores transversales: `crm.ts`, `almacenamiento.ts`, `auditoria.ts`, `unidad-de-trabajo.ts`, `admin-auth.ts`) y **testing** (dobles en memoria): no son módulos de UI.

---

## 4. Huecos frente a un CRM inmobiliario completo (lista corta)

1. Sin sitio público ni portal de proyectos (`src/app`: solo `login`, `recuperar`, `forbidden` fuera de `(crm)`).
2. Sin reservas, apartado, plan de pagos ni contratos. Tablas `payment_methods`, `unit_inventory_states` y `agencies` sin uso fuera de schema.
3. Sin marketing ni atribución: `marketing_campaigns` y `campaign_spend` sin uso; reportes no los consultan.
4. Sin trazabilidad de comunicaciones enviadas ni bandeja de entrada (`comunicaciones/casos-de-uso.ts:103-118`; `webhook_inbox` sin uso).
5. Outbox sin disparador: `ejecutarLoteOutbox` (`integraciones/outbox/runtime.ts:7`) no se invoca desde ningún lado; la UI dice que el worker está activo (`configuracion/_integraciones.tsx:23`).
6. Academy: banner de sincronización offline sin cola real (`academy/vista.tsx:249`).
7. Agenda y tareas: sin editar, reprogramar, cancelar ni borrar en UI, aunque la API tiene `PATCH`/`DELETE` en `/api/actividades/[id]`.
8. Sin importación masiva de contactos ni leads; el permiso `import` no lo usa ninguna ruta.
9. Autorización de envío: despachar comunicaciones con `communications:view` (`api/comunicaciones/despachar/route.ts:24`). Requiere revisión.
10. Confotur e IA: API sin UI (`api/cotizador/confotur`, `api/ai/audio-transcribe`).
11. Fases de obra fijas en código (`domain/avance-obra.ts:36`).
12. Papelera incompleta: `configuracion/page.tsx` `limit(30)` por tipo.
13. Límites de capa: 10 `page.tsx` consultan BD directamente; `leads/page.tsx:20` importa desde `app/api`; `comisiones/_consulta.ts:28`.
14. Sin error/loading por módulo en 10 de 15 módulos (ver sección 2).

---

## 5. Integraciones (`src/infrastructure/integraciones/**`, y adaptadores relacionados)

- `crm/local.ts`: `crmLocal`, adaptador `CrmPort` del motor local. `contenedor/crm.ts` expone `crmParaIntegraciones`. `crmMotor()` (`env.ts`) solo admite `"local"`.
- `outbox/politica.ts`: `POLITICA_OUTBOX` (5 intentos, base 1000 ms, tope 60000 ms), `clasificarFallo`, `decidirReintento`.
- `outbox/repositorio.ts`: `outboxDrizzle`, `colaOutboxDrizzle`.
- `outbox/worker.ts`: `procesarOutbox`. Sin invocador de producción.
- `outbox/runtime.ts`: `ejecutarLoteOutbox`. Sin invocador (hueco 5).
- Pruebas: `crm/local.test.ts`, `outbox/politica.test.ts`, `outbox/worker.test.ts`.
- `src/infrastructure/comunicaciones/proveedor-despacho.ts`: Telegram, WhatsApp Cloud API v21.0 y webhook con allowlist. Prueba: `proveedor-despacho.test.ts`.
- `src/infrastructure/auth/supabase.ts`: `adminClient()` (invitaciones con `auth.admin`, almacenamiento de fotos).
- Entrada webhook: `POST /api/leads/externo` (token `x-webhook-token`).
- `integration_accounts`: leída en `configuracion/page.tsx:146`. La UI indica que está vacía.
- `webhook_inbox`: tabla sin uso en TypeScript.

Variables de entorno declaradas (solo nombres, desde `src/infrastructure/env.ts` y su contrato `.env.example`):
- Obligatorias: `DATABASE_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `LEADS_WEBHOOK_TOKEN`.
- Pruebas de fixture: `CRM_TEST_ADMIN_PASSWORD`, `CRM_TEST_ASISTENTE_PASSWORD`, `CRM_TEST_BROKER_PASSWORD`.
- Opcionales: `CRM_MOTOR`, `CRM_WEBHOOK_DESTINATIONS`, `TELEGRAM_BOT_TOKEN`, `WHATSAPP_API_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, `CRM_EVAL_LOGIN`, `NODE_ENV`.

---

## 6. Pruebas de integración de base de datos

- `npm run test:db` → `scripts/test-db/run.mjs`. Incluye `negocios.ts`, `cierre.ts` y `fixture.ts`/`shapes.ts`. Las mutaciones (`alias`, `boolean`, `venta-unica`, `negocios-join`) están en `package.json`.
- `npm run test:db:guards` → `scripts/test-db/guards.mjs`.
- `src/infrastructure/db/seed-invariantes.test.ts` (15 casos) se ejecuta con `npm test`.
- `src/infrastructure/db/lecturas.db.test.ts` (206 líneas): consultas de dashboard y reportes con alcance; no registra casos fuera de la ejecución con BD.
- Sin pruebas de integración de BD para academy, comunicaciones, contactos ni proyectos.

---

## 7. Notas de verificación

- Todas las cifras de líneas de vistas salen de `wc -l` y de los `export function` registrados en esta sesión.
- "Sin invocador" se verificó con Grep sobre `src`, `scripts` y `.github`. No se revisó `.next` ni dependencias.
- No se verificó la matriz de permisos seed (quién tiene `communications:view`); el hallazgo de despacho es sobre el código, no sobre datos.
- No se ejecutó la suite de pruebas ni se revisó la UI en navegador.
