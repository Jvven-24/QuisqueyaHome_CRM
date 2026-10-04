---
id: T-P0-CRM
estado: REVIEW
nivel: L1 (inventario, no ficha READY de construcción)
productor: D03 / Codex
revisor_asignado: D22 / otro proveedor
fecha: 2026-10-04
commit_base: 08e7fa96f95ba17b1911201062754a1cce300daa
---

# CRM Quisqueya Home · Inventario AS-IS

Entrega P0 propuesta para revisión; sin aceptación ni cierre de G0/G2. Alcance: copia local de `develop`, sin comparación remota ni inspección de producción. Mandato: `.viltrum/dispatch/20261004T220027Z-D03-codex/TAREA.md:1`. Clasificación: CONOCIMIENTO sobre CRM/ERP R3, productor D03 por despacho, revisión documental D22; decisiones irreversibles requieren revisión humana conforme al perfil (`.viltrum/dispatch/20261004T220027Z-D03-codex/PERFIL.md:1`, `.viltrum/os/core/routing.md:16`). P0 es documentación: no construye producto ni exige una ficha READY.

Base observada mediante `git rev-parse HEAD` y `git branch --show-current`: commit completo en cabecera. Existen cambios previos, incluidos `src/infrastructure/db/repos/dashboard.ts` y `reportes.ts`; las citas describen la copia de trabajo, no atribuyen todo su contenido al commit base. `docs/R_RELEVO.md:15` conserva fecha/rama históricas y sus secciones 1 y 3 divergen: sirve de contexto, el código prevalece para AS-IS. No se ejecutó fetch ni se comparó con remoto.

Método: enumeración de archivos, lectura de código y extracción AST de TypeScript; conteos agregados y banderas RLS en transacción local de solo lectura. **UNKNOWN** = no verificado. Una referencia demuestra presencia en código, no funcionamiento end-to-end ni aprobación. No se abrió ningún subagente. Solo se producen los dos documentos asignados; no se cambian fichas ni el índice.

GitNexus MCP disponible, índice `QuisqueyaHome_CRM` en `7a57988d3d18b81ff47e800436ac79b0ba73dbd8` (`.gitnexus/meta.json:3`), anterior a HEAD. Consulta `CrmPort outbox LeadCreado` sin resultados; no se interpreta como ausencia. No se reindexa porque escribiría fuera del alcance autorizado; se aplica lectura local del SOP D03 (`.viltrum/os/departments/D03-architecture/sops/delivery.md:5`). No se edita ningún símbolo: análisis de impacto no aplicable.

Stack observado en `package-lock.json` (entradas `node_modules/<paquete>`), no solo rangos de `package.json:1`: Next 15.5.24, React 19.2.8, TypeScript 5.9.3, Drizzle 0.45.2, Zod 4.5.4, Tailwind 4.3.3, Supabase JS 2.112.4, postgres-js 3.4.9. El contexto histórico que dice «sin Tailwind» no describe esta copia.

## 1. Pantallas

19 páginas: 17 de `(crm)`, incluidas dos de detalle, más login y recuperar. Tabs/selectores no son rutas adicionales. Acciones = controles localizados, sin ejecución funcional aprobada. Los ids Mxx nuevos del Spec Pack se cruzan en `crm-mapa-modulos.md`; comentarios históricos del código no determinan esa numeración.

| Ruta | Contenido / tabs | Acciones | Fuente de datos / límite | Evidencia |
| --- | --- | --- | --- | --- |
| `/inicio` | KPI por actor, leads recientes, proyectos/meta, embudo, próximas actividades. Tabs Resumen/Embudo/Agenda | Enlaces a leads/pipeline/agenda; registrar lead | Consulta real dashboard; comparativas y revisión no disponibles se explicitan | `src/app/(crm)/inicio/page.tsx:12`; `src/app/(crm)/inicio/vista.tsx:27`; `src/app/(crm)/_ui/analitica-copy.ts:26` |
| `/leads` | Listado paginado, fuente/estado/broker, búsqueda e inspector. Todos/Nuevos/Asignados/Contactados/Convertidos/Descartados | Crear, asignar, descartar, convertir, WhatsApp, llamada | SQL en page; filtros por query; historial en inspector | `src/app/(crm)/leads/page.tsx:38`; `src/app/(crm)/leads/vista.tsx:271`; `src/app/(crm)/leads/inspector.tsx:1` |
| `/contactos` | Listado paginado, fuente/broker, búsqueda e inspector; sin tabs explícitas en vista principal | Crear, editar, borrar, WhatsApp, llamada | Consulta de application/contactos | `src/app/(crm)/contactos/page.tsx:58`; `src/app/(crm)/contactos/vista.tsx:177`; `src/app/(crm)/contactos/inspector.tsx:1` |
| `/pipeline` | Negocios por etapa, proyecto y broker; inspector. Kanban/Vista Lista | Mover etapa, perder con motivo, editar, asociar propiedad, WhatsApp | SQL en page; mutaciones en application/pipeline | `src/app/(crm)/pipeline/page.tsx:50`; `src/app/(crm)/pipeline/vista.tsx:192`; `src/app/(crm)/pipeline/inspector.tsx:1` |
| `/propiedades` | Rejilla de proyectos, disponibilidad, zona/tipo; sin tabs explícitas | Filtrar, crear proyecto, abrir detalle | SQL en page; precio real neutralizado antes de serializar | `src/app/(crm)/propiedades/page.tsx:58`; `src/app/(crm)/propiedades/page.tsx:101`; `src/app/(crm)/propiedades/vista.tsx:80` |
| `/propiedades/[slug]` | Detalle del proyecto y tabla de unidades; sin tabs explícitas | Editar proyecto; crear/editar/eliminar unidad; abrir avances | SQL en page; reaches y restricción de precio | `src/app/(crm)/propiedades/[slug]/page.tsx:44`; `src/app/(crm)/propiedades/[slug]/vista.tsx:132` |
| `/avances` | Selector de proyecto/fase, progreso, fotos/video/publicación. Selector de fases, no ModuleTabs | Crear plantilla/fase, editar, borrar, publicar, subir/borrar foto | SQL en page; fases/files vacíos en BD local | `src/app/(crm)/avances/page.tsx:42`; `src/app/(crm)/avances/vista.tsx:139`; `src/app/(crm)/avances/vista.tsx:220` |
| `/agenda` | Rejilla semanal, responsable; anterior/hoy/siguiente; sin tabs explícitas | Crear cita, exportar ICS, enlace Google Calendar | SQL en page; semana laboral de cinco días | `src/app/(crm)/agenda/page.tsx:37`; `src/app/(crm)/agenda/vista.tsx:70`; `src/app/(crm)/agenda/vista.tsx:85` |
| `/tareas` | Prioridades y actividades abiertas; sin tabs explícitas | Crear, completar/reabrir | SQL en page; comparte activities con agenda | `src/app/(crm)/tareas/page.tsx:29`; `src/app/(crm)/tareas/vista.tsx:56`; `src/app/(crm)/tareas/vista.tsx:77` |
| `/brokers` | Tarjetas, meta/ventas/proyectos; sin tabs explícitas | Invitar, ver perfil, asignar propiedades | SQL en page; reutiliza formulario de configuración | `src/app/(crm)/brokers/page.tsx:25`; `src/app/(crm)/brokers/vista.tsx:54`; `src/app/(crm)/brokers/vista.tsx:126` |
| `/brokers/[id]` | Perfil solo lectura, proyectos, negocios abiertos y metas recientes; secciones sin tabs | Volver, abrir propiedad/pipeline | SQL en page; id y alcance antes del detalle | `src/app/(crm)/brokers/[id]/page.tsx:35`; `src/app/(crm)/brokers/[id]/page.tsx:62`; `src/app/(crm)/brokers/[id]/page.tsx:150` |
| `/metas` | Meta compañía/broker, selector de periodo, tabla y cierres por mes; sin tabs explícitas | Fijar meta | SQL en page; application/metas para escribir | `src/app/(crm)/metas/page.tsx:38`; `src/app/(crm)/metas/vista.tsx:61`; `src/app/(crm)/metas/vista.tsx:240` |
| `/comisiones` | KPI/tabla, filtros broker/periodo/estado; sin tabs explícitas | Aprobar, pagar, anular, repartir, CSV | SQL en page/_consulta; alert/prompt en mutaciones | `src/app/(crm)/comisiones/page.tsx:37`; `src/app/(crm)/comisiones/vista.tsx:107`; `src/app/(crm)/comisiones/vista.tsx:307` |
| `/comunicaciones` | Plantillas, canales, editor/previsualización/destinatario; filtro por canal | Crear/guardar plantilla, copiar, despachar | Plantillas reales; valores de simulación y destinatario fijos; plantilla fallback id=0 | `src/app/(crm)/comunicaciones/page.tsx:21`; `src/app/(crm)/comunicaciones/vista.tsx:54`; `src/app/(crm)/comunicaciones/vista.tsx:69`; `src/app/(crm)/comunicaciones/vista.tsx:101` |
| `/reportes` | Embudo/Canales/Tendencia/Zonas/Brokers/Velocidad/Inventario/Comisiones/Pronóstico | Filtros fecha/proyecto/broker; CSV de embudo | Consulta BI real; exportación local de datos recibidos | `src/app/(crm)/reportes/page.tsx:19`; `src/app/(crm)/reportes/vista.tsx:61`; `src/app/(crm)/_ui/analitica-copy.ts:19` |
| `/academy` | Contenidos/checklists/progreso. Filtros todas/sesiones/checklists/pendientes/completadas | Buscar, recargar, completar/reabrir, marcar paso | Consulta real; contenido local vacío | `src/app/(crm)/academy/page.tsx:21`; `src/app/(crm)/academy/vista.tsx:290`; `src/app/(crm)/academy/vista.tsx:337` |
| `/configuracion` | Usuarios y roles/Permisos/Etapas/Catálogos/Papelera/Integraciones | Invitar/editar/borrar, permisos/etapas/catálogos, restaurar | SQL en page; tarjetas de integración parcialmente históricas | `src/app/(crm)/configuracion/page.tsx:52`; `src/app/(crm)/configuracion/vista.tsx:14`; `src/app/(crm)/configuracion/vista.tsx:72` |
| `/login` | Marca/formulario; sin tabs | Ingresar, recuperar, evaluación por rol | Auth real y acceso local de evaluación autorizado en servidor | `src/app/login/page.tsx:12`; `src/app/login/login-form.tsx:19`; `src/app/login/login-form.tsx:89` |
| `/recuperar` | Correo o confirmación genérica; sin tabs | Enviar enlace, volver | Confirma tras fetch sin comprobar status; no formulario de nueva contraseña aquí | `src/app/recuperar/page.tsx:11`; `src/app/recuperar/page.tsx:17`; `src/app/recuperar/page.tsx:29` |

En la tabla anterior, rutas abreviadas de la última columna se resuelven desde `src/app/(crm)/`; las demás son rutas completas. El anexo generado de estados usa rutas completas.

### Móvil y datos fijos

| Ámbito | Evidencia estática | Límite |
| --- | --- | --- |
| Todas las rutas CRM | Shell con padding móvil/sidebar/dock: `src/app/(crm)/layout.tsx:92`, `src/app/(crm)/_ui/mobile-dock.tsx:35`; PageHeader responsive: `src/app/(crm)/_ui/prototipo-ui.tsx:23`; CSS `src/app/globals.css:439`, `src/app/globals.css:460` | Capturas/operación 320/390/768/1440 UNKNOWN por ruta. Shell móvil no prueba usabilidad de cada tabla/formulario |
| Inicio/Reportes | KPI desplazables, una columna, tarjetas de valores y hojas de filtros: `src/app/tokens.css:274`, `src/app/tokens.css:279`, `src/app/tokens.css:293`; `src/app/(crm)/reportes/filtros-vista.tsx:1` | Foco, scroll, objetivos táctiles, gráficas y accesibilidad UNKNOWN |
| Login/Recuperar | Login pasa a una columna: `src/app/globals.css:460`; recuperar es formulario básico: `src/app/recuperar/page.tsx:29` | 320/390 UNKNOWN; adaptación específica de recuperar UNKNOWN |
| Cabecera de todas las pantallas CRM | Contador inicial 3; tres avisos fijos; marcar leídas solo modifica estado: `src/app/(crm)/_ui/crm-header.tsx:42`, `src/app/(crm)/_ui/crm-header.tsx:179`, `src/app/(crm)/_ui/crm-header.tsx:186` | Notifications local tiene cero filas; esos avisos no son persistidos |
| Comunicaciones | Variables/defaults de simulación, destinatario inicial y fallback no persistido: `src/app/(crm)/comunicaciones/vista.tsx:54`, `src/app/(crm)/comunicaciones/vista.tsx:69`, `src/app/(crm)/comunicaciones/vista.tsx:92`, `src/app/(crm)/comunicaciones/vista.tsx:101` | Plantillas sí persistidas; no atribuir los ejemplos a clientes reales |
| Inicio/Reportes/Academy/Comunicaciones | Sus páginas llaman consultas reales (tabla anterior) | Los documentos históricos que los describen como módulos de muestra están desfasados; conexión a datos y validación UI son evidencias distintas |

CrmLayout resuelve actor, filtra módulos y consulta identidad (`src/app/(crm)/layout.tsx:44`). Middleware devuelve 401 JSON a API sin sesión y redirige páginas (`src/middleware.ts:74`). Paleta filtra catálogo local de módulos/acciones, no entidades comerciales (`src/app/(crm)/_ui/command-palette.tsx:116`). Cabecera no le pasa modulosVisibles y la paleta usa MODULOS completo por defecto (`src/app/(crm)/_ui/crm-header.tsx:250`; `src/app/(crm)/_ui/command-palette.tsx:81`): expone navegación, sin demostrar lectura indebida de datos.


### Seis estados por pantalla

Presencia estática, no seis estados aprobados. Boundary heredado cubre lectura, no todas las mutaciones; render de éxito no significa confirmación de guardado; offline de formulario no implica lectura/cola durable sin conexión. UNKNOWN significa no acreditado en esta inspección. Recorridos reales por rol, sesiones vencidas y errores de red permanecen UNKNOWN.

| Ruta | Carga | Vacío | Error | Sin conexión | éxito | Permiso insuficiente |
| --- | --- | --- | --- | --- | --- | --- |
| /academy | `src/app/(crm)/loading.tsx:1` | `src/app/(crm)/academy/vista.tsx:337` | `src/app/(crm)/error.tsx:1` | `src/app/(crm)/academy/vista.tsx:61` | `src/app/(crm)/academy/vista.tsx:62` | `src/app/(crm)/academy/page.tsx:19`; `src/app/forbidden.tsx:1` |
| /agenda | `src/app/(crm)/loading.tsx:1` | UNKNOWN | `src/app/(crm)/error.tsx:1` | `src/app/(crm)/agenda/vista.tsx:183` | `src/app/(crm)/agenda/page.tsx:65` (render; feedback de cada mutación UNKNOWN) | `src/app/(crm)/agenda/page.tsx:33`; `src/app/forbidden.tsx:1` |
| /avances | `src/app/(crm)/loading.tsx:1` | `src/app/(crm)/avances/vista.tsx:9` | `src/app/(crm)/error.tsx:1` | UNKNOWN | `src/app/(crm)/avances/page.tsx:54` (render; feedback de cada mutación UNKNOWN) | `src/app/(crm)/avances/page.tsx:42`; `src/app/forbidden.tsx:1` |
| /brokers/[id] | `src/app/(crm)/loading.tsx:1` | `src/app/(crm)/brokers/[id]/page.tsx:26` | `src/app/(crm)/error.tsx:1` | UNKNOWN | `src/app/(crm)/brokers/[id]/page.tsx:103` (render; feedback de cada mutación UNKNOWN) | `src/app/(crm)/brokers/[id]/page.tsx:35`; `src/app/forbidden.tsx:1` |
| /brokers | `src/app/(crm)/loading.tsx:1` | `src/app/(crm)/brokers/vista.tsx:11` | `src/app/(crm)/error.tsx:1` | UNKNOWN | `src/app/(crm)/brokers/page.tsx:104` (render; feedback de cada mutación UNKNOWN) | `src/app/(crm)/brokers/page.tsx:25`; `src/app/forbidden.tsx:1` |
| /comisiones | `src/app/(crm)/loading.tsx:1` | UNKNOWN | `src/app/(crm)/error.tsx:1` | UNKNOWN | `src/app/(crm)/comisiones/page.tsx:89` (render; feedback de cada mutación UNKNOWN) | `src/app/(crm)/comisiones/page.tsx:28`; `src/app/forbidden.tsx:1` |
| /comunicaciones | `src/app/(crm)/loading.tsx:1` | UNKNOWN | `src/app/(crm)/error.tsx:1` | `src/app/(crm)/comunicaciones/vista.tsx:105` | `src/app/(crm)/comunicaciones/vista.tsx:111` | `src/app/(crm)/comunicaciones/page.tsx:19`; `src/app/forbidden.tsx:1` |
| /configuracion | `src/app/(crm)/loading.tsx:1` | UNKNOWN | `src/app/(crm)/error.tsx:1` | UNKNOWN | `src/app/(crm)/configuracion/page.tsx:86` (render; feedback de cada mutación UNKNOWN) | `src/app/(crm)/configuracion/page.tsx:52`; `src/app/forbidden.tsx:1` |
| /contactos | `src/app/(crm)/contactos/loading.tsx:1` | UNKNOWN | `src/app/(crm)/contactos/error.tsx:1` | `src/app/(crm)/contactos/vista.tsx:314` | `src/app/(crm)/contactos/page.tsx:65` (render; feedback de cada mutación UNKNOWN) | `src/app/(crm)/contactos/page.tsx:41`; `src/app/forbidden.tsx:1` |
| /inicio | `src/app/(crm)/inicio/loading.tsx:1` | `src/app/(crm)/inicio/vista.tsx:49` | `src/app/(crm)/inicio/error.tsx:1` | `src/app/(crm)/inicio/vista.tsx:11` | `src/app/(crm)/inicio/page.tsx:15` (render; feedback de cada mutación UNKNOWN) | `src/app/(crm)/inicio/page.tsx:11`; `src/app/forbidden.tsx:1` |
| /leads | `src/app/(crm)/leads/loading.tsx:1` | UNKNOWN | `src/app/(crm)/leads/error.tsx:1` | `src/app/(crm)/leads/vista.tsx:453` | `src/app/(crm)/leads/page.tsx:146` (render; feedback de cada mutación UNKNOWN) | `src/app/(crm)/leads/page.tsx:38`; `src/app/forbidden.tsx:1` |
| /metas | `src/app/(crm)/loading.tsx:1` | `src/app/(crm)/metas/vista.tsx:9` | `src/app/(crm)/error.tsx:1` | UNKNOWN | `src/app/(crm)/metas/page.tsx:104` (render; feedback de cada mutación UNKNOWN) | `src/app/(crm)/metas/page.tsx:38`; `src/app/forbidden.tsx:1` |
| /pipeline | `src/app/(crm)/pipeline/loading.tsx:1` | `src/app/(crm)/pipeline/vista.tsx:8` | `src/app/(crm)/pipeline/error.tsx:1` | UNKNOWN | `src/app/(crm)/pipeline/page.tsx:178` (render; feedback de cada mutación UNKNOWN) | `src/app/(crm)/pipeline/page.tsx:50`; `src/app/forbidden.tsx:1` |
| /propiedades/[slug] | `src/app/(crm)/loading.tsx:1` | `src/app/(crm)/propiedades/[slug]/vista.tsx:12` | `src/app/(crm)/error.tsx:1` | `src/app/(crm)/propiedades/[slug]/vista.tsx:274` | `src/app/(crm)/propiedades/[slug]/page.tsx:63` (render; feedback de cada mutación UNKNOWN) | `src/app/(crm)/propiedades/[slug]/page.tsx:31`; `src/app/forbidden.tsx:1` |
| /propiedades | `src/app/(crm)/loading.tsx:1` | `src/app/(crm)/propiedades/vista.tsx:9` | `src/app/(crm)/error.tsx:1` | UNKNOWN | `src/app/(crm)/propiedades/page.tsx:108` (render; feedback de cada mutación UNKNOWN) | `src/app/(crm)/propiedades/page.tsx:41`; `src/app/forbidden.tsx:1` |
| /reportes | `src/app/(crm)/reportes/loading.tsx:1` | `src/app/(crm)/reportes/vista.tsx:22` | `src/app/(crm)/reportes/error.tsx:1` | `src/app/(crm)/reportes/vista.tsx:12` | `src/app/(crm)/reportes/vista.tsx:32` | `src/app/(crm)/reportes/page.tsx:14`; `src/app/forbidden.tsx:1` |
| /tareas | `src/app/(crm)/loading.tsx:1` | `src/app/(crm)/tareas/vista.tsx:7` | `src/app/(crm)/error.tsx:1` | UNKNOWN | `src/app/(crm)/tareas/page.tsx:67` (render; feedback de cada mutación UNKNOWN) | `src/app/(crm)/tareas/page.tsx:29`; `src/app/forbidden.tsx:1` |
| /login | UNKNOWN | UNKNOWN | `src/app/login/login-form.tsx:35` | UNKNOWN | UNKNOWN (redirect) | N/A pública |
| /recuperar | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | `src/app/recuperar/page.tsx:20` (confirmación UI) | N/A pública |

## 2. API

47 archivos route.ts, 56 handlers HTTP. Lecturas principales también ocurren en RSC: ausencia de GET de módulo no implica ausencia de lectura. La tabla muestra permiso en handler, esquema utilizado y llamada real. Alcance por fila vive en casos de uso/adaptadores; el guard aislado no demuestra toda la seguridad.

| Endpoint | Método | Handler | Permiso / protección | Zod / entrada | Caso de uso / operación |
| --- | --- | --- | --- | --- | --- |
| /api/academy/[id]/progreso | PUT | `src/app/api/academy/[id]/progreso/route.ts:17` | academy:view `src/app/api/academy/[id]/progreso/route.ts:23` | ProgresoInput `src/app/api/academy/[id]/progreso/route.ts:32` | completarContenidoAcademy `src/app/api/academy/[id]/progreso/route.ts:35` |
| /api/academy/checklist/[id] | PUT | `src/app/api/academy/checklist/[id]/route.ts:16` | academy:view `src/app/api/academy/checklist/[id]/route.ts:22` | ChecklistInput `src/app/api/academy/checklist/[id]/route.ts:31` | marcarPasoChecklist `src/app/api/academy/checklist/[id]/route.ts:34` |
| /api/academy | GET | `src/app/api/academy/route.ts:11` | academy:view `src/app/api/academy/route.ts:14` | N/A: sin JSON validado; ids/query manuales cuando aplican | listarContenidosAcademy `src/app/api/academy/route.ts:20`; obtenerResumenProgresoBroker `src/app/api/academy/route.ts:21` |
| /api/actividades/[id] | PATCH | `src/app/api/actividades/[id]/route.ts:55` | activities:edit `src/app/api/actividades/[id]/route.ts:66` | EditarActividadInput `src/app/api/actividades/[id]/route.ts:58` | editarActividad `src/app/api/actividades/[id]/route.ts:67` |
| /api/actividades/[id] | DELETE | `src/app/api/actividades/[id]/route.ts:74` | activities:delete `src/app/api/actividades/[id]/route.ts:78` | N/A: sin JSON validado; ids/query manuales cuando aplican | borrarActividad `src/app/api/actividades/[id]/route.ts:79` |
| /api/actividades/ics | GET | `src/app/api/actividades/ics/route.ts:16` | activities:view `src/app/api/actividades/ics/route.ts:19` | N/A: sin JSON validado; ids/query manuales cuando aplican | exportarActividadesIcs `src/app/api/actividades/ics/route.ts:21` |
| /api/actividades | POST | `src/app/api/actividades/route.ts:53` | activities:create `src/app/api/actividades/route.ts:60` | CrearActividadInput `src/app/api/actividades/route.ts:55` | crearActividad `src/app/api/actividades/route.ts:61` |
| /api/ai/audio-transcribe | POST | `src/app/api/ai/audio-transcribe/route.ts:13` | leads:create `src/app/api/ai/audio-transcribe/route.ts:16` | TranscribirAudioInput `src/app/api/ai/audio-transcribe/route.ts:19` | procesarNotaDeVozLead `src/app/api/ai/audio-transcribe/route.ts:26` |
| /api/auth/demo | POST | `src/app/api/auth/demo/route.ts:16` | Pública: evaluación local y host autorizado `src/app/api/auth/demo/route.ts:17` | input.safeParse `src/app/api/auth/demo/route.ts:21` | Actor/cookie de evaluación |
| /api/auth/demo | DELETE | `src/app/api/auth/demo/route.ts:45` | Pública: evaluación local y host autorizado `src/app/api/auth/demo/route.ts:17` | N/A: sin JSON validado; ids/query manuales cuando aplican | Actor/cookie de evaluación |
| /api/auth/login | POST | `src/app/api/auth/login/route.ts:27` | Pública: Supabase Auth `src/app/api/auth/login/route.ts:27` | LoginInput `src/app/api/auth/login/route.ts:29` | signInWithPassword y SQL último acceso `src/app/api/auth/login/route.ts:46` |
| /api/auth/logout | POST | `src/app/api/auth/logout/route.ts:5` | Pública: Supabase Auth `src/app/api/auth/logout/route.ts:5` | N/A: sin JSON validado; ids/query manuales cuando aplican | signOut `src/app/api/auth/logout/route.ts:7` |
| /api/auth/recuperar | POST | `src/app/api/auth/recuperar/route.ts:11` | Pública: Supabase Auth `src/app/api/auth/recuperar/route.ts:11` | RecoverInput `src/app/api/auth/recuperar/route.ts:13` | resetPasswordForEmail `src/app/api/auth/recuperar/route.ts:18` |
| /api/brokers/[id]/proyectos | PUT | `src/app/api/brokers/[id]/proyectos/route.ts:30` | projects:edit `src/app/api/brokers/[id]/proyectos/route.ts:38` | AsignarProyectosInput `src/app/api/brokers/[id]/proyectos/route.ts:36` | asignarProyectosABroker `src/app/api/brokers/[id]/proyectos/route.ts:40` |
| /api/catalogos/[tipo]/[id] | PATCH | `src/app/api/catalogos/[tipo]/[id]/route.ts:23` | settings:edit `src/app/api/catalogos/[tipo]/[id]/route.ts:31` | EditarEntradaInput `src/app/api/catalogos/[tipo]/[id]/route.ts:29` | esTipoCatalogo `src/app/api/catalogos/[tipo]/[id]/route.ts:27`; editarEntradaCatalogo `src/app/api/catalogos/[tipo]/[id]/route.ts:38` |
| /api/catalogos/[tipo] | POST | `src/app/api/catalogos/[tipo]/route.ts:23` | settings:create `src/app/api/catalogos/[tipo]/route.ts:30` | CrearEntradaInput `src/app/api/catalogos/[tipo]/route.ts:28` | esTipoCatalogo `src/app/api/catalogos/[tipo]/route.ts:26`; crearEntradaCatalogo `src/app/api/catalogos/[tipo]/route.ts:35` |
| /api/comisiones/[id] | PATCH | `src/app/api/comisiones/[id]/route.ts:35` | commissions:edit `src/app/api/comisiones/[id]/route.ts:43` | EditarComisionInput `src/app/api/comisiones/[id]/route.ts:41` | editarComision `src/app/api/comisiones/[id]/route.ts:50` |
| /api/comisiones/export | GET | `src/app/api/comisiones/export/route.ts:21` | commissions:export `src/app/api/comisiones/export/route.ts:24` | N/A: sin JSON validado; ids/query manuales cuando aplican | exportarComisionesCsv `src/app/api/comisiones/export/route.ts:29` |
| /api/comunicaciones/canales | GET | `src/app/api/comunicaciones/canales/route.ts:11` | communications:view `src/app/api/comunicaciones/canales/route.ts:14` | N/A: sin JSON validado; ids/query manuales cuando aplican | consultarEstadosCanales `src/app/api/comunicaciones/canales/route.ts:17` |
| /api/comunicaciones/despachar | POST | `src/app/api/comunicaciones/despachar/route.ts:21` | communications:view `src/app/api/comunicaciones/despachar/route.ts:24` | DespacharInput `src/app/api/comunicaciones/despachar/route.ts:27` | prepararYDespacharMensaje `src/app/api/comunicaciones/despachar/route.ts:30` |
| /api/comunicaciones/plantillas/[id] | PUT | `src/app/api/comunicaciones/plantillas/[id]/route.ts:20` | communications:edit `src/app/api/comunicaciones/plantillas/[id]/route.ts:26` | ActualizarPlantillaInput `src/app/api/comunicaciones/plantillas/[id]/route.ts:35` | actualizarPlantillaMensaje `src/app/api/comunicaciones/plantillas/[id]/route.ts:38` |
| /api/comunicaciones/plantillas | GET | `src/app/api/comunicaciones/plantillas/route.ts:23` | communications:view `src/app/api/comunicaciones/plantillas/route.ts:26` | N/A: sin JSON validado; ids/query manuales cuando aplican | listarPlantillasMensajes `src/app/api/comunicaciones/plantillas/route.ts:33` |
| /api/comunicaciones/plantillas | POST | `src/app/api/comunicaciones/plantillas/route.ts:42` | communications:create `src/app/api/comunicaciones/plantillas/route.ts:45` | CrearPlantillaInput `src/app/api/comunicaciones/plantillas/route.ts:48` | crearPlantillaMensaje `src/app/api/comunicaciones/plantillas/route.ts:51` |
| /api/contactos/[id] | PATCH | `src/app/api/contactos/[id]/route.ts:37` | contacts:edit `src/app/api/contactos/[id]/route.ts:48` | EditarContactoInput `src/app/api/contactos/[id]/route.ts:43` | editarContacto `src/app/api/contactos/[id]/route.ts:64` |
| /api/contactos/[id] | DELETE | `src/app/api/contactos/[id]/route.ts:72` | contacts:delete `src/app/api/contactos/[id]/route.ts:79` | N/A: sin JSON validado; ids/query manuales cuando aplican | borrarContacto `src/app/api/contactos/[id]/route.ts:81` |
| /api/contactos | POST | `src/app/api/contactos/route.ts:48` | contacts:create `src/app/api/contactos/route.ts:55` | CrearContactoInput `src/app/api/contactos/route.ts:50` | crearContacto `src/app/api/contactos/route.ts:58` |
| /api/cotizador/confotur | POST | `src/app/api/cotizador/confotur/route.ts:26` | projects:view `src/app/api/cotizador/confotur/route.ts:29` | CotizadorConfoturInput `src/app/api/cotizador/confotur/route.ts:32` | generarCotizacionConfotur `src/app/api/cotizador/confotur/route.ts:34` |
| /api/etapas/[id] | PATCH | `src/app/api/etapas/[id]/route.ts:30` | settings:edit `src/app/api/etapas/[id]/route.ts:38` | EditarEtapaInput `src/app/api/etapas/[id]/route.ts:36` | editarEtapa `src/app/api/etapas/[id]/route.ts:46` |
| /api/leads/[id]/convertir | POST | `src/app/api/leads/[id]/convertir/route.ts:16` | leads:edit `src/app/api/leads/[id]/convertir/route.ts:25`; deals:create `src/app/api/leads/[id]/convertir/route.ts:26` | N/A: sin JSON validado; ids/query manuales cuando aplican | convertirLead `src/app/api/leads/[id]/convertir/route.ts:28` |
| /api/leads/[id]/descartar | POST | `src/app/api/leads/[id]/descartar/route.ts:17` | leads:edit `src/app/api/leads/[id]/descartar/route.ts:33` | NO Zod: validación manual `src/app/api/leads/[id]/descartar/route.ts:23` | descartarLead `src/app/api/leads/[id]/descartar/route.ts:35` |
| /api/leads/[id] | PATCH | `src/app/api/leads/[id]/route.ts:22` | leads:edit `src/app/api/leads/[id]/route.ts:30` | AsignarBrokerInput `src/app/api/leads/[id]/route.ts:28` | asignarResponsableDeLead `src/app/api/leads/[id]/route.ts:32` |
| /api/leads/externo | POST | `src/app/api/leads/externo/route.ts:65` | Pública: secreto compartido / coincideToken `src/app/api/leads/externo/route.ts:56` | LeadExternoInput `src/app/api/leads/externo/route.ts:74` | capturarLeadExterno `src/app/api/leads/externo/route.ts:77` |
| /api/leads | POST | `src/app/api/leads/route.ts:82` | leads:create `src/app/api/leads/route.ts:86` | CrearLeadInput `src/app/api/leads/route.ts:84` | crearLead `src/app/api/leads/route.ts:89` |
| /api/metas | PUT | `src/app/api/metas/route.ts:28` | goals:edit `src/app/api/metas/route.ts:32` | FijarMetaInput `src/app/api/metas/route.ts:30` | fijarMetaMensual `src/app/api/metas/route.ts:43` |
| /api/papelera/restaurar | POST | `src/app/api/papelera/restaurar/route.ts:31` | settings:edit `src/app/api/papelera/restaurar/route.ts:35` | RestaurarInput `src/app/api/papelera/restaurar/route.ts:33` | restaurarDePapelera `src/app/api/papelera/restaurar/route.ts:37` |
| /api/pipeline/[id]/etapa | PATCH | `src/app/api/pipeline/[id]/etapa/route.ts:28` | deals:edit `src/app/api/pipeline/[id]/etapa/route.ts:36` | CambiarEtapaInput `src/app/api/pipeline/[id]/etapa/route.ts:34` | cambiarEtapaDeNegocio `src/app/api/pipeline/[id]/etapa/route.ts:43` |
| /api/pipeline/[id]/propiedades/[propId] | PATCH | `src/app/api/pipeline/[id]/propiedades/[propId]/route.ts:20` | deals:edit `src/app/api/pipeline/[id]/propiedades/[propId]/route.ts:27` | MarcarPrincipalInput `src/app/api/pipeline/[id]/propiedades/[propId]/route.ts:25` | marcarPropiedadPrincipal `src/app/api/pipeline/[id]/propiedades/[propId]/route.ts:29` |
| /api/pipeline/[id]/propiedades/[propId] | DELETE | `src/app/api/pipeline/[id]/propiedades/[propId]/route.ts:37` | deals:edit `src/app/api/pipeline/[id]/propiedades/[propId]/route.ts:43` | N/A: sin JSON validado; ids/query manuales cuando aplican | quitarPropiedad `src/app/api/pipeline/[id]/propiedades/[propId]/route.ts:45` |
| /api/pipeline/[id]/propiedades | POST | `src/app/api/pipeline/[id]/propiedades/route.ts:30` | deals:edit `src/app/api/pipeline/[id]/propiedades/route.ts:38`; projects:view `src/app/api/pipeline/[id]/propiedades/route.ts:41` | AsociarPropiedadInput `src/app/api/pipeline/[id]/propiedades/route.ts:36` | asociarPropiedad `src/app/api/pipeline/[id]/propiedades/route.ts:47` |
| /api/pipeline/[id] | PATCH | `src/app/api/pipeline/[id]/route.ts:28` | deals:edit `src/app/api/pipeline/[id]/route.ts:44` | EditarNegocioInput `src/app/api/pipeline/[id]/route.ts:34` | editarNegocio `src/app/api/pipeline/[id]/route.ts:54` |
| /api/proyectos/[id]/fases/[faseId]/fotos/[fileId] | DELETE | `src/app/api/proyectos/[id]/fases/[faseId]/fotos/[fileId]/route.ts:12` | construction_phases:edit `src/app/api/proyectos/[id]/fases/[faseId]/fotos/[fileId]/route.ts:22` | N/A: sin JSON validado; ids/query manuales cuando aplican | borrarFoto `src/app/api/proyectos/[id]/fases/[faseId]/fotos/[fileId]/route.ts:23` |
| /api/proyectos/[id]/fases/[faseId]/fotos | POST | `src/app/api/proyectos/[id]/fases/[faseId]/fotos/route.ts:14` | construction_phases:edit `src/app/api/proyectos/[id]/fases/[faseId]/fotos/route.ts:24` | Multipart; validación en subirFotos | subirFotos `src/app/api/proyectos/[id]/fases/[faseId]/fotos/route.ts:42` |
| /api/proyectos/[id]/fases/[faseId] | PATCH | `src/app/api/proyectos/[id]/fases/[faseId]/route.ts:50` | construction_phases:edit `src/app/api/proyectos/[id]/fases/[faseId]/route.ts:67` | Entrada `src/app/api/proyectos/[id]/fases/[faseId]/route.ts:59` | editarFase `src/app/api/proyectos/[id]/fases/[faseId]/route.ts:68` |
| /api/proyectos/[id]/fases/[faseId] | DELETE | `src/app/api/proyectos/[id]/fases/[faseId]/route.ts:82` | construction_phases:delete `src/app/api/proyectos/[id]/fases/[faseId]/route.ts:92` | N/A: sin JSON validado; ids/query manuales cuando aplican | borrarFase `src/app/api/proyectos/[id]/fases/[faseId]/route.ts:93` |
| /api/proyectos/[id]/fases | POST | `src/app/api/proyectos/[id]/fases/route.ts:20` | construction_phases:create `src/app/api/proyectos/[id]/fases/route.ts:28` | Entrada `src/app/api/proyectos/[id]/fases/route.ts:26` | crearFases `src/app/api/proyectos/[id]/fases/route.ts:29` |
| /api/proyectos/[id] | PATCH | `src/app/api/proyectos/[id]/route.ts:32` | projects:edit `src/app/api/proyectos/[id]/route.ts:50` | Entrada `src/app/api/proyectos/[id]/route.ts:38` | editarProyecto `src/app/api/proyectos/[id]/route.ts:68` |
| /api/proyectos/[id] | DELETE | `src/app/api/proyectos/[id]/route.ts:81` | projects:delete `src/app/api/proyectos/[id]/route.ts:88` | N/A: sin JSON validado; ids/query manuales cuando aplican | borrarProyecto `src/app/api/proyectos/[id]/route.ts:89` |
| /api/proyectos/[id]/unidades/[unitId] | PATCH | `src/app/api/proyectos/[id]/unidades/[unitId]/route.ts:45` | units:edit `src/app/api/proyectos/[id]/unidades/[unitId]/route.ts:65` | Entrada `src/app/api/proyectos/[id]/unidades/[unitId]/route.ts:54` | editarUnidad `src/app/api/proyectos/[id]/unidades/[unitId]/route.ts:67` |
| /api/proyectos/[id]/unidades/[unitId] | DELETE | `src/app/api/proyectos/[id]/unidades/[unitId]/route.ts:81` | units:delete `src/app/api/proyectos/[id]/unidades/[unitId]/route.ts:91` | N/A: sin JSON validado; ids/query manuales cuando aplican | borrarUnidad `src/app/api/proyectos/[id]/unidades/[unitId]/route.ts:92` |
| /api/proyectos/[id]/unidades | POST | `src/app/api/proyectos/[id]/unidades/route.ts:28` | units:create `src/app/api/proyectos/[id]/unidades/route.ts:36` | Entrada `src/app/api/proyectos/[id]/unidades/route.ts:34` | crearUnidad `src/app/api/proyectos/[id]/unidades/route.ts:38` |
| /api/proyectos | POST | `src/app/api/proyectos/route.ts:44` | projects:create `src/app/api/proyectos/route.ts:48` | Entrada `src/app/api/proyectos/route.ts:46` | crearProyecto `src/app/api/proyectos/route.ts:51` |
| /api/roles/[id]/permisos | PATCH | `src/app/api/roles/[id]/permisos/route.ts:22` | settings:edit `src/app/api/roles/[id]/permisos/route.ts:29` | GuardarPermisosInput `src/app/api/roles/[id]/permisos/route.ts:27` | editarPermisos `src/app/api/roles/[id]/permisos/route.ts:30` |
| /api/usuarios/[id]/invitacion | POST | `src/app/api/usuarios/[id]/invitacion/route.ts:10` | users:edit:all `src/app/api/usuarios/[id]/invitacion/route.ts:17` | N/A: sin JSON validado; ids/query manuales cuando aplican | reenviarInvitacion `src/app/api/usuarios/[id]/invitacion/route.ts:18` |
| /api/usuarios/[id] | PATCH | `src/app/api/usuarios/[id]/route.ts:33` | users:edit:all `src/app/api/usuarios/[id]/route.ts:46` | EditarUsuarioInput `src/app/api/usuarios/[id]/route.ts:36` | editarUsuario `src/app/api/usuarios/[id]/route.ts:47` |
| /api/usuarios/[id] | DELETE | `src/app/api/usuarios/[id]/route.ts:72` | users:delete:all `src/app/api/usuarios/[id]/route.ts:80` | N/A: sin JSON validado; ids/query manuales cuando aplican | borrarUsuario `src/app/api/usuarios/[id]/route.ts:81` |
| /api/usuarios | POST | `src/app/api/usuarios/route.ts:32` | users:create:all `src/app/api/usuarios/route.ts:38` | CrearUsuarioInput `src/app/api/usuarios/route.ts:34` | crearUsuario `src/app/api/usuarios/route.ts:39` |

Excepciones públicas explícitas en `src/infrastructure/seguridad.test.ts:36`. Descartar lee JSON sin Zod (`src/app/api/leads/[id]/descartar/route.ts:23`). Fotos es multipart; archivo/MIME/tamaño y compensación en `src/application/proyectos/casos-de-uso.ts:300`. Despachar exige communications:view; completar contenido/checklist exige academy:view: comportamiento observado, sin redefinir política.


## 3. Aplicación

21 carpetas, incluidas compartido/testing. Puertos, escrituras y consultas enumerados; nombres de contratos de datos además de interfaces. Pruebas presentes en fuente, resultado actual UNKNOWN: no se ejecutaron para cerrar issues ni aprobar esta entrega. confotur/puertos reexporta tipos de domain/confotur; testing contiene dobles y contratos transversales.

| Carpeta | Puertos / contratos exportados | Casos de uso | Consultas | Adaptador / composición | Pruebas presentes |
| --- | --- | --- | --- | --- | --- |
| academy | TipoContenidoAcademy `src/application/academy/puertos.ts:5`; ChecklistItemAcademy `src/application/academy/puertos.ts:7`; ItemAcademy `src/application/academy/puertos.ts:15`; ResumenProgresoAcademy `src/application/academy/puertos.ts:30`; RepositorioAcademy `src/application/academy/puertos.ts:37` | listarContenidosAcademy `src/application/academy/casos-de-uso.ts:7`; obtenerDetalleContenido `src/application/academy/casos-de-uso.ts:15`; completarContenidoAcademy `src/application/academy/casos-de-uso.ts:25`; marcarPasoChecklist `src/application/academy/casos-de-uso.ts:35`; obtenerResumenProgresoBroker `src/application/academy/casos-de-uso.ts:44` | consultarAcademy `src/application/academy/consultas.ts:11` | `src/infrastructure/db/repos/academy.ts:1`; `src/infrastructure/contenedor/academy.ts:1` | `src/application/academy/casos-de-uso.test.ts:12` |
| actividades | Actividad `src/application/actividades/puertos.ts:4`; DatosNuevaActividad `src/application/actividades/puertos.ts:28`; CambiosActividad `src/application/actividades/puertos.ts:48`; EventoActividad `src/application/actividades/puertos.ts:67`; RepositorioActividades `src/application/actividades/puertos.ts:69`; ReposActividades `src/application/actividades/puertos.ts:79` | crearActividad `src/application/actividades/casos-de-uso.ts:14`; editarActividad `src/application/actividades/casos-de-uso.ts:63`; borrarActividad `src/application/actividades/casos-de-uso.ts:93` | exportarActividadesIcs `src/application/actividades/consultas.ts:6` | `src/infrastructure/db/repos/actividades.ts:1`; `src/infrastructure/contenedor/actividades.ts:1` | `src/application/actividades/casos-de-uso.test.ts:48` |
| ai | ProveedorTranscripcionAudio `src/application/ai/puertos.ts:3`; PropuestaLeadAudio `src/application/ai/puertos.ts:7` | procesarNotaDeVozLead `src/application/ai/casos-de-uso.ts:4` | — | Sin adaptador DB dedicado localizado | `src/application/ai/casos-de-uso.test.ts:6` |
| brokers | BrokerAsignable `src/application/brokers/puertos.ts:14`; RepositorioBrokers `src/application/brokers/puertos.ts:16`; ReposBrokers `src/application/brokers/puertos.ts:32` | asignarProyectosABroker `src/application/brokers/casos-de-uso.ts:16` | — | `src/infrastructure/db/repos/brokers.ts:1`; `src/infrastructure/contenedor/brokers.ts:1` | `src/application/brokers/casos-de-uso.test.ts:57` |
| catalogos | TipoCatalogo `src/application/catalogos/puertos.ts:27`; EntradaCatalogo `src/application/catalogos/puertos.ts:30`; DatosNuevaEntradaCatalogo `src/application/catalogos/puertos.ts:40`; CambiosEntradaCatalogo `src/application/catalogos/puertos.ts:43`; RepositorioCatalogos `src/application/catalogos/puertos.ts:49`; ReposCatalogos `src/application/catalogos/puertos.ts:57` | esTipoCatalogo `src/application/catalogos/casos-de-uso.ts:23`; crearEntradaCatalogo `src/application/catalogos/casos-de-uso.ts:29`; editarEntradaCatalogo `src/application/catalogos/casos-de-uso.ts:51` | — | `src/infrastructure/db/repos/catalogos.ts:1`; `src/infrastructure/contenedor/catalogos.ts:1` | `src/application/catalogos/casos-de-uso.test.ts:43` |
| comisiones | Comision `src/application/comisiones/puertos.ts:29`; ComisionBloqueada `src/application/comisiones/puertos.ts:53`; CambiosComision `src/application/comisiones/puertos.ts:60`; RepositorioComisiones `src/application/comisiones/puertos.ts:72`; ReposComisiones `src/application/comisiones/puertos.ts:78`; FiltrosComisiones `src/application/comisiones/puertos.ts:81`; FilaComision `src/application/comisiones/puertos.ts:90`; LeerFilasComisiones `src/application/comisiones/puertos.ts:114` | editarComision `src/application/comisiones/casos-de-uso.ts:25`; exportarComisionesCsv `src/application/comisiones/casos-de-uso.ts:114` | — | `src/infrastructure/db/repos/comisiones.ts:1`; `src/infrastructure/contenedor/comisiones.ts:1` | `src/application/comisiones/casos-de-uso.test.ts:59` |
| compartido | AdminAuth `src/application/compartido/admin-auth.ts:10`; ArchivoASubir `src/application/compartido/almacenamiento.ts:16`; AlmacenamientoArchivos `src/application/compartido/almacenamiento.ts:25`; RegistroAuditoria `src/application/compartido/auditoria.ts:20`; Auditoria `src/application/compartido/auditoria.ts:30`; ContactoDominio `src/application/compartido/crm.ts:6`; NegocioDominio `src/application/compartido/crm.ts:7`; ActividadDominio `src/application/compartido/crm.ts:8`; RefExterna `src/application/compartido/crm.ts:9`; EstadoIntegracion `src/application/compartido/crm.ts:10`; ContextoCrm `src/application/compartido/crm.ts:11`; CrmPort `src/application/compartido/crm.ts:13`; EventoCrm `src/application/compartido/crm.ts:21`; OutboxCrm `src/application/compartido/crm.ts:27`; ClaseFalloCrm `src/application/compartido/crm.ts:32`; FalloCrm `src/application/compartido/crm.ts:35`; UnidadDeTrabajo `src/application/compartido/unidad-de-trabajo.ts:15` | — | — | `src/infrastructure/db/repos/compartido.ts:1`; `src/infrastructure/contenedor/compartido.ts:1` | `src/application/compartido/contrato.test.ts:53` |
| comunicaciones | PlantillaMensaje `src/application/comunicaciones/puertos.ts:7`; MensajeADespachar `src/application/comunicaciones/puertos.ts:19`; ResultadoDespacho `src/application/comunicaciones/puertos.ts:27`; EstadoCanal `src/application/comunicaciones/puertos.ts:35`; RepositorioComunicaciones `src/application/comunicaciones/puertos.ts:46`; ProveedorDespachoCanal `src/application/comunicaciones/puertos.ts:59` | listarPlantillasMensajes `src/application/comunicaciones/casos-de-uso.ts:19`; obtenerPlantillaMensaje `src/application/comunicaciones/casos-de-uso.ts:27`; crearPlantillaMensaje `src/application/comunicaciones/casos-de-uso.ts:38`; actualizarPlantillaMensaje `src/application/comunicaciones/casos-de-uso.ts:67`; prepararYDespacharMensaje `src/application/comunicaciones/casos-de-uso.ts:89`; consultarEstadosCanales `src/application/comunicaciones/casos-de-uso.ts:119` | consultarComunicaciones `src/application/comunicaciones/consultas.ts:11` | `src/infrastructure/db/repos/comunicaciones.ts:1`; `src/infrastructure/contenedor/comunicaciones.ts:1` | `src/application/comunicaciones/casos-de-uso.test.ts:94` |
| confotur | Auxiliares/reexports; ver archivo | generarCotizacionConfotur `src/application/confotur/casos-de-uso.ts:7` | — | Sin adaptador DB dedicado localizado | Sin *.test.ts propio; dominio/contratos cuando aplican |
| contactos | Contacto `src/application/contactos/puertos.ts:19`; CandidatoDuplicado `src/application/contactos/puertos.ts:41`; DatosNuevoContacto `src/application/contactos/puertos.ts:49`; CambiosContacto `src/application/contactos/puertos.ts:62`; RepositorioContactos `src/application/contactos/puertos.ts:73`; ReposContactos `src/application/contactos/puertos.ts:89`; FiltrosListado `src/application/contactos/puertos.ts:95`; FilaListadoContacto `src/application/contactos/puertos.ts:109`; Canal `src/application/contactos/puertos.ts:123`; BrokerAsignable `src/application/contactos/puertos.ts:124`; ListadoContactos `src/application/contactos/puertos.ts:126`; LecturaContactos `src/application/contactos/puertos.ts:134` | crearContacto `src/application/contactos/casos-de-uso.ts:29`; editarContacto `src/application/contactos/casos-de-uso.ts:96`; borrarContacto `src/application/contactos/casos-de-uso.ts:145` | consultarListadoContactos `src/application/contactos/consultas.ts:16` | `src/infrastructure/db/repos/contactos.ts:1`; `src/infrastructure/contenedor/contactos.ts:1` | `src/application/contactos/casos-de-uso.test.ts:57` |
| dashboard | DashboardLeadSummary `src/application/dashboard/puertos.ts:3`; DashboardActivity `src/application/dashboard/puertos.ts:4`; DashboardSnapshot `src/application/dashboard/puertos.ts:5`; DashboardMetrics `src/application/dashboard/puertos.ts:13`; DashboardQuery `src/application/dashboard/puertos.ts:20`; DashboardScopes `src/application/dashboard/puertos.ts:21`; DashboardRepositorio `src/application/dashboard/puertos.ts:22`; DashboardFilters `src/application/dashboard/puertos.ts:25` | — | dashboardScopes `src/application/dashboard/consultas.ts:7`; dashboardQuery `src/application/dashboard/consultas.ts:15`; consultarDashboard `src/application/dashboard/consultas.ts:23` | `src/infrastructure/db/repos/dashboard.ts:1`; `src/infrastructure/contenedor/dashboard.ts:1` | `src/application/dashboard/consultas.test.ts:11` |
| etapas | Etapa `src/application/etapas/puertos.ts:23`; CambiosEtapa `src/application/etapas/puertos.ts:36`; RepositorioEtapas `src/application/etapas/puertos.ts:46`; ReposEtapas `src/application/etapas/puertos.ts:51` | editarEtapa `src/application/etapas/casos-de-uso.ts:13` | — | `src/infrastructure/db/repos/etapas.ts:1`; `src/infrastructure/contenedor/etapas.ts:1` | `src/application/etapas/casos-de-uso.test.ts:42` |
| leads | EstadoLead `src/application/leads/puertos.ts:44`; TipoOperacion `src/application/leads/puertos.ts:45`; Lead `src/application/leads/puertos.ts:48`; CandidatoBroker `src/application/leads/puertos.ts:82`; CandidatoDuplicado `src/application/leads/puertos.ts:91`; DatosCapturaLead `src/application/leads/puertos.ts:100`; DatosNuevoLead `src/application/leads/puertos.ts:120`; DatosNuevoLeadExterno `src/application/leads/puertos.ts:123`; DatosNuevoContactoManual `src/application/leads/puertos.ts:126`; DatosNuevoContactoExterno `src/application/leads/puertos.ts:138`; DatosNuevoNegocioDeLead `src/application/leads/puertos.ts:148`; RegistroAuditoriaSinActor `src/application/leads/puertos.ts:162`; RepositorioLeads `src/application/leads/puertos.ts:171`; ReposLeads `src/application/leads/puertos.ts:220` | crearLead `src/application/leads/casos-de-uso.ts:100`; asignarResponsableDeLead `src/application/leads/casos-de-uso.ts:198`; descartarLead `src/application/leads/casos-de-uso.ts:244`; capturarLeadExterno `src/application/leads/casos-de-uso.ts:299`; convertirLead `src/application/leads/conversion.ts:26` | — | `src/infrastructure/db/repos/leads.ts:1`; `src/infrastructure/contenedor/leads.ts:1` | `src/application/leads/casos-de-uso.test.ts:104`; `src/application/leads/conversion.test.ts:17` |
| metas | Meta `src/application/metas/puertos.ts:24`; DatosMetaMensual `src/application/metas/puertos.ts:40`; RepositorioMetas `src/application/metas/puertos.ts:51`; ReposMetas `src/application/metas/puertos.ts:58` | fijarMetaMensual `src/application/metas/casos-de-uso.ts:22` | — | `src/infrastructure/db/repos/metas.ts:1`; `src/infrastructure/contenedor/metas.ts:1` | `src/application/metas/casos-de-uso.test.ts:45` |
| papelera | EntidadPapelera `src/application/papelera/puertos.ts:27`; FilaPapelera `src/application/papelera/puertos.ts:30`; RepositorioPapelera `src/application/papelera/puertos.ts:32`; ReposPapelera `src/application/papelera/puertos.ts:39` | restaurarDePapelera `src/application/papelera/casos-de-uso.ts:13` | — | `src/infrastructure/db/repos/papelera.ts:1`; `src/infrastructure/contenedor/papelera.ts:1` | `src/application/papelera/casos-de-uso.test.ts:29` |
| pipeline | Negocio `src/application/pipeline/puertos.ts:45`; EtapaPipeline `src/application/pipeline/puertos.ts:73`; PropiedadDeNegocio `src/application/pipeline/puertos.ts:86`; NegocioConEtapa `src/application/pipeline/puertos.ts:97`; CambiosNegocio `src/application/pipeline/puertos.ts:100`; DatosNuevaPropiedad `src/application/pipeline/puertos.ts:108`; DatosNuevaComision `src/application/pipeline/puertos.ts:117`; RepositorioPipeline `src/application/pipeline/puertos.ts:135`; ReposPipeline `src/application/pipeline/puertos.ts:219` | cambiarEtapaDeNegocio `src/application/pipeline/casos-de-uso.ts:43`; editarNegocio `src/application/pipeline/casos-de-uso.ts:213`; asociarPropiedad `src/application/pipeline/casos-de-uso.ts:264`; marcarPropiedadPrincipal `src/application/pipeline/casos-de-uso.ts:305`; quitarPropiedad `src/application/pipeline/casos-de-uso.ts:338`; cerrarNegocioGanado `src/application/pipeline/cierre.ts:43` | — | `src/infrastructure/db/repos/pipeline.ts:1`; `src/infrastructure/contenedor/pipeline.ts:1` | `src/application/pipeline/casos-de-uso.test.ts:122`; `src/application/pipeline/cierre.test.ts:133` |
| proyectos | Proyecto `src/application/proyectos/puertos.ts:13`; Unidad `src/application/proyectos/puertos.ts:40`; Fase `src/application/proyectos/puertos.ts:66`; Foto `src/application/proyectos/puertos.ts:86`; DatosProyecto `src/application/proyectos/puertos.ts:102`; CambiosProyecto `src/application/proyectos/puertos.ts:103`; DatosUnidad `src/application/proyectos/puertos.ts:104`; CambiosUnidad `src/application/proyectos/puertos.ts:105`; DatosFase `src/application/proyectos/puertos.ts:106`; CambiosFase `src/application/proyectos/puertos.ts:107`; RepositorioProyectos `src/application/proyectos/puertos.ts:109`; ReposProyectos `src/application/proyectos/puertos.ts:130` | crearProyecto `src/application/proyectos/casos-de-uso.ts:56`; editarProyecto `src/application/proyectos/casos-de-uso.ts:73`; borrarProyecto `src/application/proyectos/casos-de-uso.ts:113`; crearUnidad `src/application/proyectos/casos-de-uso.ts:133`; editarUnidad `src/application/proyectos/casos-de-uso.ts:154`; borrarUnidad `src/application/proyectos/casos-de-uso.ts:177`; crearFases `src/application/proyectos/casos-de-uso.ts:206`; editarFase `src/application/proyectos/casos-de-uso.ts:253`; borrarFase `src/application/proyectos/casos-de-uso.ts:279`; subirFotos `src/application/proyectos/casos-de-uso.ts:300`; borrarFoto `src/application/proyectos/casos-de-uso.ts:366` | — | `src/infrastructure/db/repos/proyectos.ts:1`; `src/infrastructure/contenedor/proyectos.ts:1` | `src/application/proyectos/casos-de-uso.test.ts:152` |
| reportes | ReadScope `src/application/reportes/puertos.ts:4`; ReportFilters `src/application/reportes/puertos.ts:6`; ReportQuery `src/application/reportes/puertos.ts:7`; FunnelRow `src/application/reportes/puertos.ts:8`; FunnelStep `src/application/reportes/puertos.ts:13`; SourceRow `src/application/reportes/puertos.ts:14`; SourceDistribution `src/application/reportes/puertos.ts:18`; ZoneInterestMetric `src/application/reportes/puertos.ts:22`; LossReasonMetric `src/application/reportes/puertos.ts:23`; MonthlyTrendPoint `src/application/reportes/puertos.ts:24`; BrokerMetric `src/application/reportes/puertos.ts:25`; InventoryMetric `src/application/reportes/puertos.ts:26`; CommissionMetric `src/application/reportes/puertos.ts:27`; MonthlyProjectionPoint `src/application/reportes/puertos.ts:28`; PipelineProjection `src/application/reportes/puertos.ts:29`; ReportSnapshot `src/application/reportes/puertos.ts:34`; ReportesBiData `src/application/reportes/puertos.ts:42`; ReportesRepositorio `src/application/reportes/puertos.ts:46` | — | assertMonetaryTotals `src/application/reportes/consultas.ts:10`; percentage `src/application/reportes/consultas.ts:19`; reportQuery `src/application/reportes/consultas.ts:22`; requireReadScope `src/application/reportes/consultas.ts:38`; presentReport `src/application/reportes/consultas.ts:41`; consultarReportesBi `src/application/reportes/consultas.ts:61` | `src/infrastructure/db/repos/reportes.ts:1`; `src/infrastructure/contenedor/reportes.ts:1` | `src/application/reportes/consultas.test.ts:13` |
| roles | Rol `src/application/roles/puertos.ts:6`; Permiso `src/application/roles/puertos.ts:11`; RepositorioRoles `src/application/roles/puertos.ts:17`; ReposRoles `src/application/roles/puertos.ts:24`; DependenciasRoles `src/application/roles/puertos.ts:29`; ActorRoles `src/application/roles/puertos.ts:34` | editarPermisos `src/application/roles/casos-de-uso.ts:10` | — | `src/infrastructure/db/repos/roles.ts:1`; `src/infrastructure/contenedor/roles.ts:1` | `src/application/roles/casos-de-uso.test.ts:15` |
| testing | Auxiliares/reexports; ver archivo | — | — | Sin adaptador DB dedicado localizado | Sin *.test.ts propio; dominio/contratos cuando aplican |
| usuarios | Usuario `src/application/usuarios/puertos.ts:10`; Rol `src/application/usuarios/puertos.ts:27`; PerfilBroker `src/application/usuarios/puertos.ts:38`; Permiso `src/application/usuarios/puertos.ts:49`; EntradaCrearUsuario `src/application/usuarios/puertos.ts:55`; EntradaEditarUsuario `src/application/usuarios/puertos.ts:66`; RepositorioUsuarios `src/application/usuarios/puertos.ts:77`; ReposUsuarios `src/application/usuarios/puertos.ts:92`; DependenciasUsuarios `src/application/usuarios/puertos.ts:94`; DependenciasReenvio `src/application/usuarios/puertos.ts:100`; AlcanceUsuarios `src/application/usuarios/puertos.ts:102`; ActorUsuarios `src/application/usuarios/puertos.ts:103` | crearUsuario `src/application/usuarios/casos-de-uso.ts:10`; editarUsuario `src/application/usuarios/casos-de-uso.ts:54`; borrarUsuario `src/application/usuarios/casos-de-uso.ts:94`; reenviarInvitacion `src/application/usuarios/casos-de-uso.ts:117` | — | `src/infrastructure/db/repos/usuarios.ts:1`; `src/infrastructure/contenedor/usuarios.ts:1` | `src/application/usuarios/casos-de-uso.test.ts:30` |

### SQL que sigue en app

Barrido de imports de db/client. Las escrituras de negocio migradas no acreditan migración completa de lecturas.

| Archivo:línea | Responsabilidad |
| --- | --- |
| `src/app/(crm)/_ui/historial.tsx:24` | Historial de auditoría |
| `src/app/(crm)/agenda/page.tsx:14` | Lectura de página pendiente de application |
| `src/app/(crm)/avances/page.tsx:24` | Lectura de página pendiente de application |
| `src/app/(crm)/brokers/[id]/page.tsx:21` | Lectura de página pendiente de application |
| `src/app/(crm)/brokers/page.tsx:15` | Lectura de página pendiente de application |
| `src/app/(crm)/comisiones/_consulta.ts:28` | Lectura compartida página/CSV (R4.3) |
| `src/app/(crm)/comisiones/page.tsx:14` | Lectura de página pendiente de application |
| `src/app/(crm)/configuracion/page.tsx:19` | Lectura de página pendiente de application |
| `src/app/(crm)/layout.tsx:23` | Identidad del shell |
| `src/app/(crm)/leads/page.tsx:16` | Lectura de página pendiente de application |
| `src/app/(crm)/metas/page.tsx:20` | Lectura de página pendiente de application |
| `src/app/(crm)/pipeline/page.tsx:19` | Lectura de página pendiente de application |
| `src/app/(crm)/propiedades/[slug]/page.tsx:19` | Lectura de página pendiente de application |
| `src/app/(crm)/propiedades/page.tsx:23` | Lectura de página pendiente de application |
| `src/app/(crm)/tareas/page.tsx:18` | Lectura de página pendiente de application |
| `src/app/api/auth/login/route.ts:13` | Auth pública: último acceso |

CSV de comisiones inyecta consultarFilas ubicado en app, con tipos duplicados (`src/app/api/comisiones/export/route.ts:19`; `src/application/comisiones/puertos.ts:81`; `src/app/(crm)/comisiones/_consulta.ts:28`), deuda R4.3 declarada en relevo. Grafo observado: app → application/contenedor; contenedor → repos/proveedores; repos → schema/client/domain; application → domain/puertos compartidos. Las lecturas anteriores también van app → DB. Ausencia exhaustiva de ciclos UNKNOWN; no se ejecutó análisis de ciclos ni suite arquitectura. Proveedores viven en infrastructure, sin imponer retroactivamente un directorio adapters distinto del patrón real.


## 4. Datos

39 tablas del schema. Conteos totales locales (incluyen papelera/inactivos), observados el 2026-10-04 durante esta sesión; no conteos por alcance. --counts recorrió 18 tablas y una consulta adicional BEGIN READ ONLY completó las 39. Destino verificado: quisqueyahome_crm en loopback:5432 (`scripts/seed/local.ts:4`; `scripts/seed/index.ts:28`). Solo agregados y banderas, sin registros personales ni secretos.

En pg_class se observó RLS=true, FORCE=false en las 39. Las 29 originales activan RLS en 0001, sin .enableRLS en schema; las diez añadidas sí lo declaran. No hay CREATE POLICY en los cuatro SQL de migración inspeccionados; políticas instaladas y privilegios efectivos de conexión UNKNOWN. Un flag RLS no demuestra aislamiento si la conexión puede eludirlo: siguen siendo necesarios permisos y filtro de aplicación.

| Tabla / símbolo | Propósito | Esquema | Filas locales | RLS código/migración/BD | Columnas sin uso |
| --- | --- | --- | --- | --- | --- |
| roles (roles) | Roles | `src/infrastructure/db/schema.ts:146` | 3 | solo migración; `drizzle/0001_enable_rls_public_tables.sql:38`; BD=true / FORCE=false | UNKNOWN: ausencia de consumo por columna no acreditada |
| users (users) | Identidad y puente Auth | `src/infrastructure/db/schema.ts:160` | 15 | solo migración; `drizzle/0001_enable_rls_public_tables.sql:41`; BD=true / FORCE=false | passwordHash sin uso declarado `src/infrastructure/db/schema.ts:175` |
| broker_profiles (brokerProfiles) | Perfil/desempeño comercial | `src/infrastructure/db/schema.ts:213` | 13 | solo migración; `drizzle/0001_enable_rls_public_tables.sql:20`; BD=true / FORCE=false | UNKNOWN: ausencia de consumo por columna no acreditada |
| permissions (permissions) | Recurso/acción/alcance por rol | `src/infrastructure/db/schema.ts:233` | 183 | solo migración; `drizzle/0001_enable_rls_public_tables.sql:35`; BD=true / FORCE=false | UNKNOWN: ausencia de consumo por columna no acreditada |
| sessions (sessions) | Sesiones heredadas sin uso | `src/infrastructure/db/schema.ts:259` | 0 | solo migración; `drizzle/0001_enable_rls_public_tables.sql:39`; BD=true / FORCE=false | Tabla sin uso declarado `src/infrastructure/db/schema.ts:254` |
| pipeline_stages (pipelineStages) | Etapas del embudo | `src/infrastructure/db/schema.ts:287` | 7 | solo migración; `drizzle/0001_enable_rls_public_tables.sql:36`; BD=true / FORCE=false | UNKNOWN: ausencia de consumo por columna no acreditada |
| loss_reasons (lossReasons) | Motivos de pérdida | `src/infrastructure/db/schema.ts:307` | 7 | solo migración; `drizzle/0001_enable_rls_public_tables.sql:32`; BD=true / FORCE=false | UNKNOWN: ausencia de consumo por columna no acreditada |
| lead_sources (leadSources) | Fuentes de captación | `src/infrastructure/db/schema.ts:324` | 8 | solo migración; `drizzle/0001_enable_rls_public_tables.sql:30`; BD=true / FORCE=false | UNKNOWN: ausencia de consumo por columna no acreditada |
| zones (zones) | Zonas | `src/infrastructure/db/schema.ts:342` | 13 | schema enableRLS; `drizzle/0002_messy_gwen_stacy.sql:84`; BD=true / FORCE=false | UNKNOWN: ausencia de consumo por columna no acreditada |
| agencies (agencies) | Agencias | `src/infrastructure/db/schema.ts:353` | 3 | schema enableRLS; `drizzle/0002_messy_gwen_stacy.sql:11`; BD=true / FORCE=false | UNKNOWN: ausencia de consumo por columna no acreditada |
| payment_methods (paymentMethods) | Formas de pago | `src/infrastructure/db/schema.ts:362` | 3 | schema enableRLS; `drizzle/0002_messy_gwen_stacy.sql:58`; BD=true / FORCE=false | UNKNOWN: ausencia de consumo por columna no acreditada |
| unit_inventory_states (unitInventoryStates) | Disponibilidad y estado anterior | `src/infrastructure/db/schema.ts:373` | 5 | schema enableRLS; `drizzle/0002_messy_gwen_stacy.sql:72`; BD=true / FORCE=false | UNKNOWN: ausencia de consumo por columna no acreditada |
| marketing_campaigns (marketingCampaigns) | Campañas por fuente | `src/infrastructure/db/schema.ts:388` | 8 | schema enableRLS; `drizzle/0002_messy_gwen_stacy.sql:46`; BD=true / FORCE=false | UNKNOWN: ausencia de consumo por columna no acreditada |
| campaign_spend (campaignSpend) | Gasto mensual de campaña | `src/infrastructure/db/schema.ts:407` | 152 | schema enableRLS; `drizzle/0002_messy_gwen_stacy.sql:28`; BD=true / FORCE=false | UNKNOWN: ausencia de consumo por columna no acreditada |
| projects (projects) | Proyectos comercializables | `src/infrastructure/db/schema.ts:424` | 24 | solo migración; `drizzle/0001_enable_rls_public_tables.sql:37`; BD=true / FORCE=false | UNKNOWN: ausencia de consumo por columna no acreditada |
| units (units) | Inventario de unidades | `src/infrastructure/db/schema.ts:475` | 404 | solo migración; `drizzle/0001_enable_rls_public_tables.sql:40`; BD=true / FORCE=false | UNKNOWN: ausencia de consumo por columna no acreditada |
| construction_phases (constructionPhases) | Fases/progreso de obra | `src/infrastructure/db/schema.ts:526` | 0 | solo migración; `drizzle/0001_enable_rls_public_tables.sql:22`; BD=true / FORCE=false | UNKNOWN: ausencia de consumo por columna no acreditada |
| contacts (contacts) | Identidad comercial del cliente | `src/infrastructure/db/schema.ts:569` | 458 | solo migración; `drizzle/0001_enable_rls_public_tables.sql:23`; BD=true / FORCE=false | UNKNOWN: ausencia de consumo por columna no acreditada |
| leads (leads) | Oportunidades de captación | `src/infrastructure/db/schema.ts:605` | 648 | solo migración; `drizzle/0001_enable_rls_public_tables.sql:31`; BD=true / FORCE=false | UNKNOWN: ausencia de consumo por columna no acreditada |
| deals (deals) | Negocios por etapa | `src/infrastructure/db/schema.ts:672` | 184 | solo migración; `drizzle/0001_enable_rls_public_tables.sql:26`; BD=true / FORCE=false | UNKNOWN: ausencia de consumo por columna no acreditada |
| deal_properties (dealProperties) | Propiedades asociadas al negocio | `src/infrastructure/db/schema.ts:719` | 184 | solo migración; `drizzle/0001_enable_rls_public_tables.sql:24`; BD=true / FORCE=false | UNKNOWN: ausencia de consumo por columna no acreditada |
| deal_stage_history (dealStageHistory) | Movimientos del negocio | `src/infrastructure/db/schema.ts:753` | 592 | solo migración; `drizzle/0001_enable_rls_public_tables.sql:25`; BD=true / FORCE=false | UNKNOWN: ausencia de consumo por columna no acreditada |
| activities (activities) | Tareas/citas/seguimientos | `src/infrastructure/db/schema.ts:779` | 1803 | solo migración; `drizzle/0001_enable_rls_public_tables.sql:17`; BD=true / FORCE=false | UNKNOWN: ausencia de consumo por columna no acreditada |
| activity_sync (activitySync) | Referencias de calendario | `src/infrastructure/db/schema.ts:821` | 0 | solo migración; `drizzle/0001_enable_rls_public_tables.sql:18`; BD=true / FORCE=false | UNKNOWN: ausencia de consumo por columna no acreditada |
| goals (goals) | Meta mensual broker/compañía | `src/infrastructure/db/schema.ts:852` | 247 | solo migración; `drizzle/0001_enable_rls_public_tables.sql:28`; BD=true / FORCE=false | UNKNOWN: ausencia de consumo por columna no acreditada |
| commissions (commissions) | Liquidación/reparto de comisión | `src/infrastructure/db/schema.ts:887` | 17 | solo migración; `drizzle/0001_enable_rls_public_tables.sql:21`; BD=true / FORCE=false | UNKNOWN: ausencia de consumo por columna no acreditada |
| academy_items (academyItems) | Contenidos formativos | `src/infrastructure/db/schema.ts:937` | 0 | solo migración; `drizzle/0001_enable_rls_public_tables.sql:15`; BD=true / FORCE=false | UNKNOWN: ausencia de consumo por columna no acreditada |
| academy_checklist_items (academyChecklistItems) | Pasos de checklist | `src/infrastructure/db/schema.ts:951` | 0 | solo migración; `drizzle/0001_enable_rls_public_tables.sql:13`; BD=true / FORCE=false | UNKNOWN: ausencia de consumo por columna no acreditada |
| academy_progress (academyProgress) | Progreso por usuario/contenido | `src/infrastructure/db/schema.ts:970` | 0 | solo migración; `drizzle/0001_enable_rls_public_tables.sql:16`; BD=true / FORCE=false | UNKNOWN: ausencia de consumo por columna no acreditada |
| academy_checklist_progress (academyChecklistProgress) | Progreso por paso | `src/infrastructure/db/schema.ts:993` | 0 | solo migración; `drizzle/0001_enable_rls_public_tables.sql:14`; BD=true / FORCE=false | UNKNOWN: ausencia de consumo por columna no acreditada |
| message_templates (messageTemplates) | Plantillas multicanal | `src/infrastructure/db/schema.ts:1020` | 4 | solo migración; `drizzle/0001_enable_rls_public_tables.sql:33`; BD=true / FORCE=false | UNKNOWN: ausencia de consumo por columna no acreditada |
| files (files) | Metadatos polimórficos de archivo | `src/infrastructure/db/schema.ts:1034` | 0 | solo migración; `drizzle/0001_enable_rls_public_tables.sql:27`; BD=true / FORCE=false | UNKNOWN: ausencia de consumo por columna no acreditada |
| notifications (notifications) | Avisos por usuario | `src/infrastructure/db/schema.ts:1056` | 0 | solo migración; `drizzle/0001_enable_rls_public_tables.sql:34`; BD=true / FORCE=false | UNKNOWN: ausencia de consumo por columna no acreditada |
| integration_accounts (integrationAccounts) | Cuentas de proveedores | `src/infrastructure/db/schema.ts:1081` | 0 | solo migración; `drizzle/0001_enable_rls_public_tables.sql:29`; BD=true / FORCE=false | UNKNOWN: ausencia de consumo por columna no acreditada |
| audit_log (auditLog) | Rastro de cambios | `src/infrastructure/db/schema.ts:1108` | 1 | solo migración; `drizzle/0001_enable_rls_public_tables.sql:19`; BD=true / FORCE=false | UNKNOWN: ausencia de consumo por columna no acreditada |
| outbox (outbox) | Salida durable/reintentos | `src/infrastructure/db/schema.ts:1131` | 0 | schema enableRLS; `drizzle/0003_curly_charles_xavier.sql:34`; BD=true / FORCE=false | UNKNOWN: ausencia de consumo por columna no acreditada |
| outbox_dead (outboxDead) | Salida fallida/DLQ | `src/infrastructure/db/schema.ts:1157` | 0 | schema enableRLS; `drizzle/0003_curly_charles_xavier.sql:42`; BD=true / FORCE=false | UNKNOWN: ausencia de consumo por columna no acreditada |
| external_refs (externalRefs) | Referencias externas | `src/infrastructure/db/schema.ts:1166` | 0 | schema enableRLS; `drizzle/0003_curly_charles_xavier.sql:12`; BD=true / FORCE=false | UNKNOWN: ausencia de consumo por columna no acreditada |
| webhook_inbox (webhookInbox) | Entrada deduplicable | `src/infrastructure/db/schema.ts:1181` | 0 | schema enableRLS; `drizzle/0003_curly_charles_xavier.sql:56`; BD=true / FORCE=false | UNKNOWN: ausencia de consumo por columna no acreditada |

### Catálogos y convenciones de datos

| Fuente | Conceptos y evidencia | Límite |
| --- | --- | --- |
| Tablas | roles/permissions, pipeline_stages, loss_reasons, lead_sources, zones, agencies, payment_methods, unit_inventory_states, marketing_campaigns; declaración y conteo en tabla anterior | La UI de catálogos genéricos expone motivos/fuentes (`src/app/(crm)/configuracion/vista.tsx:40`), no todos los catálogos nuevos |
| Enum de dominio | Recursos/acciones/alcances, entidades, estados, tipos, niveles y visibilidades (`src/domain/catalogs.ts:16`; reexports `src/infrastructure/db/schema.ts:65`) | Existir en enum no significa administrable |
| Eventos/fallos CRM | Tres eventos y RETRYABLE/NON_RETRYABLE/HUMAN_REQUIRED (`src/application/compartido/crm.ts:20`, `src/application/compartido/crm.ts:31`) | Productores/worker no acreditan entrega externa |
| Identidad | Un negocio, sin organization_id (`src/infrastructure/db/schema.ts:21`); team equivale a own (`src/domain/rbac.ts:114`) | Multi-tenant entre organizaciones no implementado en este modelo |
| Dinero/fechas/teléfono | Centavos bigint y basis points, timestamptz/date, UTC/Santo Domingo, E.164/phoneDisplay (`src/infrastructure/db/schema.ts:26`, `src/infrastructure/db/schema.ts:29`, `src/infrastructure/db/schema.ts:31`) | Precisión/capacidad monetaria end-to-end no ensayadas aquí |
| Borrado/históricos | deletedAt y visibleRows (`src/infrastructure/db/schema.ts:33`; `src/infrastructure/rbac-filter.ts:1`); catálogos isActive | Tratamiento completo de referencias a catálogos inactivos UNKNOWN |

Solo se afirma ausencia de uso donde el esquema la declara: users.passwordHash y sessions. Tabla vacía no equivale a columna inútil; select(), tipos inferidos, JSON y escrituras parciales impiden demostrar ausencia mediante un grep simple. NFR aprobados de volumen/concurrencia, p95/p99, retención, RPO/RTO y presupuesto UNKNOWN; tamaño del seed no es compromiso de capacidad.


## 5. Permisos

21 recursos; seis acciones view/create/edit/delete/import/export; alcances none/own/team/all. Roles sembrados admin/assistant/broker. Fuentes: `src/domain/catalogs.ts:19`, `src/domain/catalogs.ts:29`, `src/domain/catalogs.ts:36`; `db/seed.sql:18`. Matriz del **seed versionado**, no consulta de permisos efectivos: solo se contó permissions (183 filas).

| Recurso | Admin (seed) | Asistente (seed) | Broker (seed) | Fuente recurso |
| --- | --- | --- | --- | --- |
| dashboard | view/create/edit/delete/import/export:all | view:all | view:own | `src/domain/catalogs.ts:37` |
| leads | view/create/edit/delete/import/export:all | view:all, create:all, edit:all, import:all, export:all | view:own, create:own, edit:own | `src/domain/catalogs.ts:10` |
| contacts | view/create/edit/delete/import/export:all | view:all, create:all, edit:all, import:all, export:all | view:own, create:own, edit:own | `src/domain/catalogs.ts:39` |
| deals | view/create/edit/delete/import/export:all | view:all, create:all, edit:all, export:all | view:own, create:own, edit:own | `src/domain/catalogs.ts:40` |
| activities | view/create/edit/delete/import/export:all | view:all, create:all, edit:all | view:own, create:own, edit:own | `src/domain/catalogs.ts:41` |
| projects | view/create/edit/delete/import/export:all | view:all, create:all, edit:all | view:own | `src/domain/catalogs.ts:42` |
| units | view/create/edit/delete/import/export:all | view:all, create:all, edit:all | view:own | `src/domain/catalogs.ts:43` |
| unit_real_price | view/create/edit/delete/import/export:all | none (ausencia) | none (ausencia) | `src/domain/catalogs.ts:44` |
| construction_phases | view/create/edit/delete/import/export:all | view:all, edit:all | view:own | `src/domain/catalogs.ts:45` |
| brokers | view/create/edit/delete/import/export:all | view:all | view:own | `src/domain/catalogs.ts:46` |
| academy | view/create/edit/delete/import/export:all | view:all | view:all | `src/domain/catalogs.ts:47` |
| goals | view/create/edit/delete/import/export:all | view:all | view:own | `src/domain/catalogs.ts:48` |
| commissions | view/create/edit/delete/import/export:all | view:all | view:own | `src/domain/catalogs.ts:49` |
| communications | view/create/edit/delete/import/export:all | view:all, create:all, edit:all | view:all, create:own | `src/domain/catalogs.ts:50` |
| reports | view/create/edit/delete/import/export:all | view:all, export:all | none (ausencia) | `src/domain/catalogs.ts:51` |
| global_metrics | view/create/edit/delete/import/export:all | none (ausencia) | none (ausencia) | `src/domain/catalogs.ts:52` |
| settings | view/create/edit/delete/import/export:all | none (ausencia) | none (ausencia) | `src/domain/catalogs.ts:53` |
| users | view/create/edit/delete/import/export:all | none (ausencia) | none (ausencia) | `src/domain/catalogs.ts:54` |
| roles | view/create/edit/delete/import/export:all | none (ausencia) | none (ausencia) | `src/domain/catalogs.ts:55` |
| audit_log | view/create/edit/delete/import/export:all | none (ausencia) | none (ausencia) | `src/domain/catalogs.ts:56` |
| integrations | view/create/edit/delete/import/export:all | none (ausencia) | none (ausencia) | `src/domain/catalogs.ts:57` |

Concesiones: `db/seed.sql:31` admin, `db/seed.sql:46` assistant, `db/seed.sql:76` broker. Ausencia = none (`src/domain/rbac.ts:49`); requireFullScope exige all para users (`src/domain/rbac.ts:93`); reaches limita own/team por responsable (`src/domain/rbac.ts:114`); stripRestrictedPrices neutraliza precio real/interno antes de enviarlo (`src/domain/rbac.ts:142`). Actor cruza sesión verificada con usuario/rol/permisos activos (`src/infrastructure/auth/actor.ts:59`). Un recurso/acción catalogado no prueba endpoint ni UI implementado: import está en vocabulario, sin ruta de importación localizada en §2.


## 6. Integraciones existentes

| Capacidad | Puerto / consumidor | Adaptador / persistencia | Estado AS-IS y límite |
| --- | --- | --- | --- |
| Auth | Actor/RBAC; AdminAuth para invitaciones (src/application/compartido/admin-auth.ts:10) | Supabase SSR/cookies y puente users (src/infrastructure/auth/supabase.ts:27; src/infrastructure/auth/actor.ts:59; src/infrastructure/contenedor/compartido.ts:58) | getUser verifica identidad; evaluación local condicionada a habilitación/host (src/app/api/auth/demo/route.ts:17). Corrida real por rol UNKNOWN |
| Almacenamiento | AlmacenamientoArchivos (src/application/compartido/almacenamiento.ts:25), fotos de obra | Upload/remove/URLs firmadas (src/infrastructure/contenedor/compartido.ts:32); bucket privado en seed (db/seed.sql:152); files | Contratos presentes, cero files/fases locales; permisos reales del bucket y upload completo UNKNOWN |
| Telegram/WhatsApp/email | ProveedorDespachoCanal (src/application/comunicaciones/puertos.ts:59), prepararYDespacharMensaje (src/application/comunicaciones/casos-de-uso.ts:89) | ProveedorDespachoMulticanal (src/infrastructure/comunicaciones/proveedor-despacho.ts:16) | Telegram/WhatsApp simulan éxito sin configuración (src/infrastructure/comunicaciones/proveedor-despacho.ts:57 y src/infrastructure/comunicaciones/proveedor-despacho.ts:109); email/default siempre simulado (src/infrastructure/comunicaciones/proveedor-despacho.ts:42). Entrega/disponibilidad externa UNKNOWN |
| Webhook saliente | Mismo puerto de despacho | Destino registrado/HTTPS/IP pública/DNS fijado/sin redirects/timeout (src/infrastructure/comunicaciones/proveedor-despacho.ts:166, src/infrastructure/comunicaciones/proveedor-despacho.ts:184, src/infrastructure/comunicaciones/proveedor-despacho.ts:231) | Controles leídos, no envío ejecutado. Error webhook neutralizado; otros canales devuelven mensajes externos, revisión D12 pendiente |
| Portal: captura de lead | capturarLeadExterno (src/application/leads/casos-de-uso.ts:299) | POST leads/externo, Zod, secreto compartido, clave externalId (src/app/api/leads/externo/route.ts:65) | Entrada propia existente; no webhook firmado con replay/inbox. H27/H28 documentales pendientes; concurrencia real UNKNOWN |
| CrmPort | Identidades mínimas y version/idempotency/correlation (src/application/compartido/crm.ts:13) | crmLocal no-op en proceso (src/infrastructure/integraciones/crm/local.ts:8); composición (src/infrastructure/contenedor/crm.ts:1) | Puerto real, solo adapter local localizado. Twenty conectado NO acreditado; salud local no representa proveedor externo |
| Outbox/DLQ | OutboxCrm dentro de unidad de trabajo; tres eventos (src/application/compartido/crm.ts:20 y src/application/compartido/crm.ts:27) | outbox/outbox_dead/external_refs; FOR UPDATE SKIP LOCKED (src/infrastructure/integraciones/outbox/repositorio.ts:29) | Worker por lotes, versión 1 (src/infrastructure/integraciones/outbox/worker.ts:28); cinco intentos/jitter (src/infrastructure/integraciones/outbox/politica.ts:5); runtime no inicia scheduler (src/infrastructure/integraciones/outbox/runtime.ts:6). Scheduler vivo/replay/recuperación UNKNOWN; tablas vacías |
| Inbox entrante | webhook_inbox deduplicable | src/infrastructure/db/schema.ts:1181; guarda de firmas src/infrastructure/seguridad.test.ts:86 | Tabla/guarda presentes; sin rutas api/webhooks en enumeración. Fixtures de guarda no prueban recepción real |
| Calendario/video/reuniones | exportarActividadesIcs (src/application/actividades/consultas.ts:6); URLs manuales | ICS/Google Calendar/YouTube/Meet/Zoom (src/app/(crm)/configuracion/_integraciones.tsx:20), activity_sync | Enlaces e ICS; OAuth/sync bidireccional no acreditados; activity_sync vacía |
| Academy | RepositorioAcademy (src/application/academy/puertos.ts:37) | Persistencia propia (src/infrastructure/db/repos/academy.ts:1) | Moodle NO conectado en módulos inspeccionados; contenido local vacío |
| Audio/IA | ProveedorTranscripcionAudio opcional (src/application/ai/puertos.ts:3) | Extracción desde texto (src/application/ai/casos-de-uso.ts:14), ruta JSON (src/app/api/ai/audio-transcribe/route.ts:26) | Ruta no pasa transcriptor: audio solo no se transcribe. Propuesta requiere confirmación humana; proveedor ASR/LLM y RAG NO acreditados |
| Cotizador | generarCotizacionConfotur puro (src/application/confotur/casos-de-uso.ts:7) | POST cotizador/confotur (src/app/api/cotizador/confotur/route.ts:26) | JSON calculado, sin cotización persistida/pantalla/PDF. Defaults de negocio en ruta (src/app/api/cotizador/confotur/route.ts:14). Validez fiscal/comercial UNKNOWN; no evaluada por D03 |

No se enviaron mensajes ni peticiones a proveedores externos. Estos estados derivan del código, no de disponibilidad real. integration_accounts tiene cero filas locales; su existencia no acredita configuración activa.

## 7. Deuda y riesgos

### Hallazgos abiertos según registro

Se conserva el estado de docs/R_HALLAZGOS.md; no se cierran ni se presentan como bugs reproducidos ahora. H11/H12/H22/H33 figuran cerrados; H15 cerrado en parte. H8 se cita sin abrir el script histórico ni copiar credenciales: su vigencia no fue comprobada. No apareció ninguna credencial en las salidas inspeccionadas.

| ID | Hallazgo registrado | Ubicación documental | Estado documental | Fuente / vigencia |
| --- | --- | --- | --- | --- |
| H1 | El orden de capas CSS no lo protege nada: si se descuadra, se descoloca el CRM entero | `src/app/tokens.css`, `src/app/globals.css` | Abierto | docs/R_HALLAZGOS.md:31; reproducción actual UNKNOWN |
| H2 | `globals.css` es un punto único de fallo de 500 líneas con selectores globales | `src/app/globals.css` | Abierto | docs/R_HALLAZGOS.md:32; reproducción actual UNKNOWN |
| H3 | `http.ts` no se puede probar: su `import` de valores usa el alias `@/` | `src/infrastructure/http.ts` | Abierto | docs/R_HALLAZGOS.md:33; reproducción actual UNKNOWN |
| H4 | La traducción de `ForbiddenError` a HTTP 403 no tiene prueba automática | `src/infrastructure/http.ts` | Abierto (depende de H3) | docs/R_HALLAZGOS.md:34; reproducción actual UNKNOWN |
| H5 | `--muted` significa cosas distintas en `globals.css` y en shadcn | `src/app/tokens.css` | Abierto, desactivado a propósito | docs/R_HALLAZGOS.md:35; reproducción actual UNKNOWN |
| H6 | `contactosParaEscritura()` construye el pool aunque la respuesta sea 403 | `src/infrastructure/contenedor/contactos.ts` | Abierto, sin efecto observable | docs/R_HALLAZGOS.md:36; reproducción actual UNKNOWN |
| H7 | Las referencias `archivo:línea` de la documentación caducan solas | `src/application/README.md` | Abierto | docs/R_HALLAZGOS.md:37; reproducción actual UNKNOWN |
| H8 | Credenciales de prueba en el repositorio | `scripts/crear-usuario-prueba.mjs` | Abierto desde la decisión #39 | docs/R_HALLAZGOS.md:38; reproducción actual UNKNOWN |
| H9 | Sin línea base de regresión en 12 de los 13 módulos | `docs/R_REGRESION.md` | Abierto por diseño | docs/R_HALLAZGOS.md:39; reproducción actual UNKNOWN |
| H10 | Datos de prueba dejados en la base | base de datos de desarrollo | Abierto | docs/R_HALLAZGOS.md:40; reproducción actual UNKNOWN |
| H15 | **Un broker podía sobrescribir la «próxima acción» del negocio de otro** | `src/app/api/actividades/route.ts` | **Cerrado en parte**: la escritura entre alcances, arreglada; `assigneeId`, `contactId` y `projectId` siguen abiertos para R3.3 | docs/R_HALLAZGOS.md:43; reproducción actual UNKNOWN |
| H16 | Reasignar un lead propio no exige alcance `all`; reasignar un contacto sí | `src/app/api/leads/[id]/route.ts` | Abierto | docs/R_HALLAZGOS.md:44; reproducción actual UNKNOWN |
| H17 | El correo de recuperación apunta a una ruta que no existe | `src/app/api/auth/recuperar/route.ts` | Abierto | docs/R_HALLAZGOS.md:45; reproducción actual UNKNOWN |
| H18 | Una invitación recién enviada se muestra como «Aceptada» | `src/app/api/usuarios/route.ts` | Abierto | docs/R_HALLAZGOS.md:46; reproducción actual UNKNOWN |
| H19 | El historial muestra el texto crudo de `asignar` y `descartar` | `src/app/(crm)/_ui/historial.tsx` | Abierto | docs/R_HALLAZGOS.md:47; reproducción actual UNKNOWN |
| H20 | Ocho desajustes menores entre el código, el glosario y los scripts | varios | Abierto | docs/R_HALLAZGOS.md:48; reproducción actual UNKNOWN |
| H21 | **El cambio simple de etapa no bloquea la fila: una pérdida concurrente puede pisar un cierre ya hecho** | `src/application/pipeline/casos-de-uso.ts` | Abierto | docs/R_HALLAZGOS.md:49; reproducción actual UNKNOWN |
| H23 | `isPrimary` con `z.coerce.boolean()` convierte la cadena `"false"` en `true` | `src/app/api/pipeline/[id]/propiedades/route.ts` | Abierto | docs/R_HALLAZGOS.md:51; reproducción actual UNKNOWN |
| H24 | `expectedCloseDate` no valida formato: una fecha inválida da 500 | `src/app/api/pipeline/[id]/route.ts` | Abierto | docs/R_HALLAZGOS.md:52; reproducción actual UNKNOWN |
| H25 | El paso 7 cancela las actividades futuras pero no limpia `deals.next_activity_id` | `src/application/pipeline/cierre.ts` | Abierto | docs/R_HALLAZGOS.md:53; reproducción actual UNKNOWN |
| H26 | Cinco comentarios citan `_cierre.ts`, archivo que R3.1 eliminó | `domain/`, `api/metas`, `api/comisiones`, `(crm)/comisiones` | Abierto | docs/R_HALLAZGOS.md:54; reproducción actual UNKNOWN |
| H27 | **El webhook repetido sin teléfono ni correo deja contactos huérfanos y audita de más** | `src/app/api/leads/externo/route.ts` | Abierto | docs/R_HALLAZGOS.md:55; reproducción actual UNKNOWN |
| H28 | El `SELECT` de respaldo del webhook no filtra `deleted_at` | `src/infrastructure/db/repos/leads.ts` | Abierto | docs/R_HALLAZGOS.md:56; reproducción actual UNKNOWN |
| H29 | La conversión de lead no bloquea la fila: dos conversiones simultáneas, dos negocios | `src/application/leads/conversion.ts` | Abierto | docs/R_HALLAZGOS.md:57; reproducción actual UNKNOWN |
| H30 | Dos rutas validan la entrada antes de autenticar: 422 donde debería haber 401 | `api/leads/[id]/descartar`, `api/leads/[id]` | Abierto | docs/R_HALLAZGOS.md:58; reproducción actual UNKNOWN |
| H31 | Los contactos que entran por el webhook nacen sin responsable ni autor | `src/app/api/leads/externo/route.ts` | Abierto | docs/R_HALLAZGOS.md:59; reproducción actual UNKNOWN |
| H32 | Editar una actividad puede reapuntarla al negocio de otro broker | `src/application/actividades/casos-de-uso.ts` | Abierto | docs/R_HALLAZGOS.md:60; reproducción actual UNKNOWN |
| H34 | La auditoría de metas lee el estado anterior fuera del upsert | `src/application/metas/casos-de-uso.ts` | Abierto | docs/R_HALLAZGOS.md:62; reproducción actual UNKNOWN |
| H35 | Asignar proyectos a un broker no bloquea filas: gana el último | `src/application/brokers/casos-de-uso.ts` | Abierto | docs/R_HALLAZGOS.md:63; reproducción actual UNKNOWN |
| H36 | La consulta del CSV carga todas las propiedades principales, no las filtradas | `src/app/(crm)/comisiones/_consulta.ts` | Abierto | docs/R_HALLAZGOS.md:64; reproducción actual UNKNOWN |
| H37 | Los montos del CSV salen como texto, contra lo que `csv.ts` documenta | `src/application/comisiones/casos-de-uso.ts` | Abierto | docs/R_HALLAZGOS.md:65; reproducción actual UNKNOWN |
| H38 | Se puede fijar meta a un broker inactivo o borrado | `src/application/metas/casos-de-uso.ts` | Abierto | docs/R_HALLAZGOS.md:66; reproducción actual UNKNOWN |
| H39 | **El sufijo del slug de catálogo puede colisionar y dar un 500** | `src/infrastructure/db/repos/catalogos.ts` | Abierto | docs/R_HALLAZGOS.md:67; reproducción actual UNKNOWN |
| H40 | El `like` del slug base interpreta `_` y `%` como comodines | `src/infrastructure/db/repos/catalogos.ts` | Abierto, hoy inalcanzable | docs/R_HALLAZGOS.md:68; reproducción actual UNKNOWN |
| H41 | Un comentario de configuración cita `_tablas.ts`, que R3.7 eliminó | `src/app/(crm)/configuracion/_catalogos.tsx` | Abierto | docs/R_HALLAZGOS.md:69; reproducción actual UNKNOWN |
| H13 | El CLI de shadcn no funciona en el contenedor: `ui.shadcn.com` da 403 | entorno | Abierto | docs/R_HALLAZGOS.md:70; reproducción actual UNKNOWN |
| H14 | Las 15 primitivas de shadcn entran sin prueba ni revisión visual | `src/components/ui/` | Abierto | docs/R_HALLAZGOS.md:71; reproducción actual UNKNOWN |


### Observaciones actuales para revisión

| ID | Evidencia y escenario concreto | Dueño sugerido / cierre pendiente |
| --- | --- | --- |
| INV-01 | editarActividad busca la actividad visible, pero copia dealId sin releer el nuevo negocio (src/application/actividades/casos-de-uso.ts:65 y src/application/actividades/casos-de-uso.ts:72). Corrobora estáticamente H32; no se envió petición contra otra cartera | D12/D10: decisión de seguridad y regresión por alcance |
| INV-02 | Descarte valida JSON manualmente, sin Zod (src/app/api/leads/[id]/descartar/route.ts:23); el candado exige guard por archivo, no Zod por handler (src/infrastructure/seguridad.test.ts:50) | D10/D14: especificar contrato y prueba, sin debilitar guardas |
| INV-03 | Recuperar confirma enviado aunque HTTP sea error y no captura rechazo de red (src/app/recuperar/page.tsx:11 y src/app/recuperar/page.tsx:17) | D09/D14: estados y flujo de nueva contraseña; H17 documental |
| INV-04 | Éxito simulado de mensajes puede parecer entrega real; avisos fijos de cabecera frente a notifications=0 (fuentes §§1/6) | D01/D09/D19: distinguir simulación y disponibilidad |
| INV-05 | RLS en BD comprobado; 29 tablas no declaran enableRLS en schema y ninguna fuerza RLS (fuentes §4) | D11/D12: contrastar políticas/rol efectivo; no implica fuga demostrada |
| INV-06 | CrmPort solo local, outbox sin scheduler acreditado, inbox sin endpoints (fuentes §6) | D19/D16: contratos y operación antes de atribuir sync externa |
| INV-07 | Academy/avances vacíos pese a vistas conectadas; lecturas SQL pendientes y contexto desfasado (fuentes §§1/3/4) | D22/P2: separar implementación/dataset/nivel verificado |
| INV-08 | Paleta de cabecera recibe catálogo completo mientras sidebar usa permisos (src/app/(crm)/layout.tsx:47; src/app/(crm)/_ui/crm-header.tsx:250) | D09/D12: coherencia de navegación; controles de servidor siguen siendo obligatorios |

### Lint ejecutado

npm.cmd run lint terminó con **exit 1: 2 errores y 15 warnings** en la copia de trabajo. capture_b.cjs no aparecía en el status inicial y sí en lint; no fue creado por D03. La verificación final distingue trabajo concurrente de los dos documentos propios. No se arreglan archivos fuera del alcance.

| Archivo:línea | Resultado |
| --- | --- |
| capture_b.cjs:1, capture_b.cjs:2 | Dos errores no-require-imports |
| capture_b.cjs:2, capture_b.cjs:18, capture_b.cjs:34 | Tres warnings no-unused-vars |
| scripts/seed/generator.ts:42 | _position sin uso |
| scripts/seed_local_crm.mjs:41, scripts/seed_local_crm.mjs:57, scripts/seed_local_crm.mjs:86 | adminId, assistantId, p4 sin uso |
| src/app/(crm)/_ui/crm-header.tsx:38 | etiquetaRol sin uso |
| src/app/(crm)/_ui/crm-sidebar-menu.tsx:6 | ChevronRight sin uso |
| src/app/(crm)/comisiones/vista.tsx:12, src/app/(crm)/comisiones/vista.tsx:300 | DollarSign sin uso; useMemo sin dependencias cambiarEstado/editarReparto |
| src/app/(crm)/leads/vista.tsx:57 | TONO_ESTADO sin uso |
| src/app/(crm)/propiedades/vista.tsx:11 | Building2 y Sparkles sin uso (dos warnings) |
| src/app/login/page.tsx:17 | no-img-element |

### Pruebas presentes y pruebas no acreditadas

| Cobertura | Evidencia | Resultado/límite |
| --- | --- | --- |
| Aplicación | Suites por módulo de §3; dobles propios y testing compartido | Existencia verificada; ejecución actual UNKNOWN |
| RBAC/filtro/auditoría/precios | src/domain/rbac.test.ts:1; src/infrastructure/rbac-filter.test.ts:1; src/infrastructure/audit.test.ts:1; src/infrastructure/precios-respuestas.test.ts:1 | No equivalen a E2E con sesión/DB |
| Guardas de RLS/rutas/capas/evaluación | src/infrastructure/seguridad.test.ts:15; src/infrastructure/arquitectura.test.ts:1; src/infrastructure/auth/evaluation-login.test.ts:1 | No se ejecutó npm test ni se cerró un issue |
| Seed/outbox/contratos | src/infrastructure/db/seed-invariantes.test.ts:1; src/infrastructure/integraciones/outbox/worker.test.ts:1; src/application/compartido/contrato.test.ts:1 | Conteos no acreditan entrega/reintento/recuperación |
| Cotizador/audio | src/domain/confotur.test.ts:1; src/domain/audio-lead-extractor.test.ts:1; src/application/ai/casos-de-uso.test.ts:1 | Sin suite propia de application/confotur localizada; endpoint de audio no conecta transcriptor |
| Concurrencia | H21/H27/H29/H34/H35; docs/R_HALLAZGOS.md:574 | Ensayos PostgreSQL, duplicados concurrentes, timeouts y rollback reales UNKNOWN |
| Seis estados/móvil/accesibilidad | Matrices §1; docs/R_HALLAZGOS.md:39 y docs/R_HALLAZGOS.md:71 | No capturas ni recorrido de UI. No se afirma ausencia de evidencia de otros agentes; D03 no la revalidó |

Revisión de seguridad del cambio documental: no cambia autorización, esquema, env ni validación; no debilita guardas. Documentos contienen conteos/referencias, sin registros personales, secretos, cadenas de conexión ni volcado de configuración. Checklist de docs/contexto/flujo-de-trabajo.md §6 aplicado a documentación: no hay nueva tabla/API, cuerpo JSON, variable, archivo subido, redirección, exportación de datos ni HTML. Auditoría integral del CRM permanece a D12.


### Versiones resueltas y soporte de pruebas

| Paquete | Versión resuelta | Fuente |
| --- | --- | --- |
| next | 15.5.24 | package-lock.json:7951 |
| react | 19.2.8 | package-lock.json:8464 |
| typescript | 5.9.3 | package-lock.json:10006 |
| drizzle-orm | 0.45.2 | package-lock.json:5513 |
| zod | 4.5.4 | package-lock.json:10309 |
| tailwindcss | 4.3.3 | package-lock.json:9292 |
| @supabase/supabase-js | 2.112.4 | package-lock.json:3627 |
| postgres | 3.4.9 | package-lock.json:8321 |

Dobles de repositorio propios: `src/application/academy/en-memoria.ts:1`; `src/application/actividades/en-memoria.ts:1`; `src/application/brokers/en-memoria.ts:1`; `src/application/catalogos/en-memoria.ts:1`; `src/application/comisiones/en-memoria.ts:1`; `src/application/contactos/en-memoria.ts:1`; `src/application/dashboard/en-memoria.ts:1`; `src/application/etapas/en-memoria.ts:1`; `src/application/leads/en-memoria.ts:1`; `src/application/metas/en-memoria.ts:1`; `src/application/papelera/en-memoria.ts:1`; `src/application/pipeline/en-memoria.ts:1`; `src/application/proyectos/en-memoria.ts:1`; `src/application/reportes/en-memoria.ts:1`; `src/application/roles/en-memoria.ts:1`; `src/application/usuarios/en-memoria.ts:1`; 

Soporte transversal: src/application/testing/contratos.ts:28; unidad-de-trabajo-en-memoria.ts:1; auditoria-en-memoria.ts:1; almacenamiento-en-memoria.ts:1; admin-auth-en-memoria.ts:1; outbox-en-memoria.ts:1; crm-en-memoria.ts:1 (estas rutas se resuelven en src/application/testing/). No son módulos de negocio ni prueba de providers reales.

## Fuentes

- Perfil D03 completo y tarea: .viltrum/dispatch/20261004T220027Z-D03-codex/PERFIL.md:1 y .viltrum/dispatch/20261004T220027Z-D03-codex/TAREA.md:1.
- Constitución, flujo/índice/plantilla: .specify/memory/constitution.md:1; .viltrum/vre-os/FLUJO-PASADAS.md:1; .viltrum/vre-os/spec/00-indice.md:1; .viltrum/vre-os/spec/_plantilla-modulo.md:1.
- Contexto leído: docs/R_RELEVO.md; docs/contexto/arquitectura.md, convenciones.md, flujo-de-trabajo.md, errores-conocidos.md; docs/R_HALLAZGOS.md; src/application/README.md. Discrepancias temporales señaladas, sin reescribir esas fuentes.
- Cada fila de §§1–7 cita código o registro. Stack resuelto en package-lock.json; manifiesto package.json. Líneas corresponden al snapshot de trabajo de esta sesión.
- Datos: scripts/seed/local.ts:4 y scripts/seed/index.ts:28; dos comandos locales de solo lectura, descritos abajo. No producción/remoto.

## Pruebas

| Comando / consulta ejecutados | Resultado observado |
| --- | --- |
| Get-Content -Raw -Encoding UTF8 del perfil/tarea/contexto; rg --files; lectores Node/AST por stdin | Inventario de 19 páginas, 47 route.ts, 56 handlers, 21 carpetas application y 39 tablas; sin crear scripts auxiliares en el repositorio |
| git status --short; git rev-parse HEAD; git branch --show-current | develop y commit de cabecera; cambios previos. Advertencia de lectura del ignore global por permisos, status disponible |
| GitNexus list_repos y query CrmPort outbox LeadCreado | Índice anterior, consulta vacía no usada como prueba de ausencia; no analyze por límite de escritura |
| node --env-file=.env scripts/seed/index.ts --counts | exit 0; destino local confirmado, PostgreSQL 150008; 18 conteos; rama de script retorna sin escritura (scripts/seed/index.ts:30) |
| Node stdin, --env-file=.env --input-type=module; localDatabaseUrl, postgres.begin(read only), SELECT count(*) y relrowsecurity/relforcerowsecurity por tabla | exit 0; 39 conteos/banderas, solo agregados, conexión local y transacción de solo lectura |
| npm.cmd run lint | exit 1; 2 errores y 15 warnings (§7) |
| SHA-256 agregado de 1109 archivos tracked fuera de inventario, antes/después | Verificación final registrada abajo; cambios concurrentes no se atribuyen a D03 |
| Validador documental en stdin | Resultado final registrado abajo: cobertura, 32 fichas, referencias y secciones requeridas |

No ejecutados: typecheck (puede escribir tsbuildinfo fuera del alcance), npm test (no es tarea de cierre/verificación de código publicado; hay cambios previos locales), build/dev (prohibidos en esta carpeta), UI/E2E. Resultados actuales UNKNOWN. Informes históricos no se convierten en corridas observadas. No se hace commit/push ni se aprueba una puerta.


Verificación de límites del workspace: status inicial tenía cinco archivos tracked adicionales modificados además de .gitignore/CLAUDE.md; al final esos cambios se integraron por trabajo concurrente y solo estos dos siguieron modificados. HEAD avanzó externamente a b8e6608892308cb6d1f3105a0d25c15bd4ea7eda. Huella inicial fuera del inventario: 1109 tracked, ef7af1dc06faf1d55167a812ae8ab325709605ebf6f51bc2c389f43fa98f2321; final: 1121 tracked, 75d329f9e6a289d214dcbeebeea991a5b2523af463612bf985bd4a25bfb4b837. **No se puede certificar invariancia global del workspace**; D03 solo escribió los dos documentos asignados. La revisión debe usar el snapshot mutable observado y no atribuir esos commits/cambios a esta tarea.


Verificador documental final: PASS de integridad documental (sin aceptación de contenido): 19 páginas, 47 route.ts, 56 handlers, 39 tablas, 21 carpetas application, 32 fichas únicas; 947 referencias únicas con archivo existente/línea válida; secciones 1–7, Fuentes, Pruebas y Handoff presentes. Patrón automatizado de credenciales sin coincidencias; no equivale a auditoría completa de secretos.

## Handoff

**Estado REVIEW, sin autoaprobación.** Revisor asignado por la tarea: D22 de otro proveedor. Decisiones irreversibles y arquitectura posterior pasan al humano conforme al perfil D03. Entregables: crm-as-is.md y crm-mapa-modulos.md; único alcance de escritura spec/inventario; CMS existente se conserva.

D22 debe contrastar contra el mismo snapshot, incluidos cambios previos; revisar filas/UNKNOWN; conciliar contexto/relevo con código; verificar cobertura M01–M21/G01–G11 y archivos tocados por D03. No usar REVIEW como READY ni abrir construcción con este inventario.

P1/P2 reciben ownership/lecturas SQL pendientes, política RBAC efectiva por confirmar, simulaciones, capacidades sin piezas dedicadas y NFR numéricos pendientes D01/D02. D11/D12 reciben RLS/políticas/rol de conexión y H32; D14 recibe concurrencia/API/estados/capturas por rol; D19/D16 reciben scheduler/inbox/proveedores. Hallazgos siguen abiertos hasta revisión independiente.
