# T-P0-CMS · Inventario reutilizable de Quisqueya Studio / Portal

El CRM ya tiene paleta, DataTable, Bits y tonos: hay que converger contratos, no repetirlos.
El CMS aporta edición con evidencia, galerías, taxonomías, i18n y atribución; algunas piezas son demos o contienen afirmaciones sin respaldo.
Los modelos de proyectos, tipologías, unidades e identidades son distintos: compartir tablas directamente no resuelve la integración.
I06 tiene emisor/receptor parciales, respuesta incompatible y recuperación durable no acreditada.
Esta entrega documenta código local y propone reutilización; ninguna recomendación, ADR o puerta queda aprobada.

**Versión:** 2.0 · **Fecha:** 2026-10-04 · **Productor:** D22 / Codex, criterio de arquitectura D03.
**Mandato:** `.viltrum/dispatch/20261004T220533Z-D22-codex/TAREA.md:1`.
**Clasificación:** CONOCIMIENTO, CRM/ERP ↔ portal/CMS, proyecto R3; pasada P0, análisis revisable.
**Revisor asignado:** D03 de otro proveedor. D00 conserva promoción de conocimiento y puertas.
**Único archivo editable:** este documento. Sin cambios de código/configuración/índices/bases, git, servicios, migraciones ni conectores externos.

## Tabla resumen

| Familia | Resultado observado | Recomendación pendiente de D03 | Riesgo / esfuerzo |
|---|---|---|---|
| Tone, Bits, tabla, utils | Existen en ambos; estilos y mappings divergen | COMPARTIR núcleo/contratos y mantener temas/adaptadores por producto | Medio / M |
| Shell/paleta | CMS busca proyectos/vídeos locales; CRM módulos/acciones de navegación | COMPARTIR mecanismo; PORTAR proveedor de entidades autorizado | Alto / M |
| Formularios/borradores | CMS: error→tab, guardia dirty, wizard/reintento; CRM formularios por módulo | PORTAR mecanismos aislados sobre Zod y primitives existentes | Medio / M |
| Evidencia/publicación | CMS: fuentes, derechos, relaciones masterplan/proyecto e hitos | PORTAR presentación detrás de puertos; contrato de datos previo | Alto / L |
| Drive | Catálogo local, iframe y enlaces; API/OAuth no acreditados | REFERENCIA; IGNORAR cuenta/permisos aparentes | Alto / M; integración real L |
| Medios/vídeos/mapas | Galería, srcset, descubrimiento y Leaflet | PORTAR renderizadores cuando una ficha READY los requiera | Medio–alto / M–L |
| i18n | Ocho diccionarios/runtime CMS; CRM copy español | COMPARTIR utilidades y subconjunto de textos; PORTAR routing Next | Medio / M |
| Cuenta/perfil cliente | Sesiones propias CMS, distintas de empleados CRM | REFERENCIA para M18/M20; IGNORAR copia de identidad | Alto / L |
| Captación/origen | CTA público WhatsApp; API inquiry y envío CRM parciales | COMPARTIR contexto y cerrar contrato I06 en P4 | Alto / L |
| Consentimiento/analítica | Preferencias locales y telemetría web | REFERENCIA; finalidad/retención antes de transferencia | Alto / M |
| PWA/estados/motion/tema | Patrones de experiencia; SW solo cachea página offline | PORTAR piezas acotadas; no prometer datos/escrituras offline | Medio / M |
| Demos/presets/fallbacks | Algunos textos aparentan condiciones confirmadas | IGNORAR como evidencia/regla; REFERENCIA de composición | Alto / S |

**Prefijos de evidencia:** `P/` = `C:/Users/wilbe/Documents/QuisqueyaHome PortalWeb/`; `C/` = `C:/Users/wilbe/Documents/QuisqueyaHome_CRM/`. Cada `:n` es una línea del archivo local leído. En las tablas Studio/Portal, la columna origen es P y la columna equivalente es C, salvo indicación explícita. Las rutas completas se resuelven con estos prefijos.

**Decisiones:** COMPARTIR = paquete común; PORTAR = adaptación; REFERENCIA = patrón sin trasladar negocio; IGNORAR = excluir transferencia. Son propuestas D22, no decisiones aprobadas. **Esfuerzo:** S pieza aislada, M varios componentes/contratos/estados, L datos/identidad/integración/fondo; no plazos ni tareas despachadas. Riesgo se refiere a divergencia y exposición de datos, no certificación de seguridad/accesibilidad.

## 1. Studio y servicios: inventario de reutilización

### 1.1 Método, cobertura y recencia

Se enumeraron **50 archivos Studio**, **52 Portal**, **13 i18n** y **8 componentes compartidos**. Las tablas cubren cada archivo, incluyendo CSS, helpers y `.d.ts`; se siguieron imports, consumidores y handlers. Se distingue existencia de código, conexión al flujo y ejecución verificada. La inspección estática no prueba seis estados ni comportamiento visual.

GitNexus: `list_repos`, `query` de catálogo/captación en ambos repositorios y `context` de `despacharInquiryACRM`, contrastados con lectura actual. CMS HEAD local `main`, ref `c8cc0a3c6baafdb4ade978f7b3232c3ce7f48d20`; índice declara ese commit (`2026-10-04T13:18:44.080Z`). CRM HEAD local `develop`, ref `e7bba174faec0abbb56b976590829b478be4a88f`; índice `7a57988d3d18b81ff47e800436ac79b0ba73dbd8` (`2026-10-04T13:18:58.938Z`): **obsoleto respecto al HEAD**. CMS también mostró desplazamientos de líneas frente al grafo. El grafo orienta; los bytes actuales acreditan la afirmación. No se reindexó porque modificar el índice queda fuera del único archivo autorizado. No se compara con remoto ni se acredita limpieza del worktree, autoría local o despliegue. Evidencia: `.git/HEAD:1`, refs locales y `.gitnexus/meta.json:1` de ambos repositorios.

Lockfiles observados: CMS React 19.2.8/Vite 8.2.2/Router 7.18.3/Tailwind 4.3.3/Motion 13.2.0/Leaflet 1.9.4/pg 8.23.0; CRM React 19.2.8/Next 15.5.24/Tailwind 4.3.3/Motion 13.4.6/Drizzle 0.45.2/Zod 4.5.4/Supabase JS 2.112.4/SSR 0.12.5. **Ambos ya usan Tailwind v4**: portar requiere routing, SSR/cliente, tokens, datos y permisos, no una migración supuesta de v3. `P/package.json:1`, `P/package-lock.json:1`, `C/package.json:1`, `C/package-lock.json:1`.

### 1.2 Los 50 archivos Studio

| Origen P / archivo:línea | Función y dependencias verificadas | Equivalente C / archivo:línea | Recomendación, razón, riesgo y esfuerzo |
|---|---|---|---|
| `src/studio/Studio.jsx:152`, `:308`, `:673`; `src/studio/studio.css:5`, `:972` | Shell SPA sesión/setup/login, sidebar agrupada/buscable, drawer móvil, catálogo, publicar con confirmación; React/Lucide/CSS capa portal | `src/app/(crm)/_ui/crm-header.tsx:37`, `src/app/(crm)/_ui/crm-sidebar-menu.tsx:22`, `src/app/(crm)/layout.tsx:1` | REFERENCIA / M / alto: conservar Next/alcances; composición útil, navegación SPA y permisos editoriales no transferibles. CSS/tokens propios |
| `src/studio/Studio.jsx:545`, `:569`, `:573`, `:596` | Editor proyecto por secciones/dirty/beforeunload/PATCH; borra procedencia al mover coordenada, paneles medios/fuentes/amenidades/variantes/hitos | `src/app/(crm)/propiedades/_formulario-proyecto.tsx:30`, `:51`, `:105` | PORTAR patrón / L / alto: profundidad editorial mayor; mantener centavos, broker, alcance y borrado lógico CRM; no copiar negocio/DELETE permanente |
| `src/studio/Projects.tsx:75`, `:135`, `:251`, `:446`, `:568` | Filtros/búsqueda/evidencia, tabla/grid/kanban, CSV y readiness/portadas aprobadas; React/Motion/UI/Creator | `src/app/(crm)/propiedades/vista.tsx:46`, `src/application/proyectos/casos-de-uso.ts:56` | PORTAR filtros/vistas / M / medio-alto: readiness no es gate; bandas inversión fijas y estados editoriales distintos; lógica readiness duplicada en Studio |
| `src/studio/ProjectJourney.jsx:13`, `:30`, `:40`, `:72`, `:80`; `src/studio/project-journey.css:1`, `:9` | Wizard de 7 pasos, validadores/rangos/coordenadas, resumen, formato blur; Creator recuerda ID creado ante refresh fallido; React/Lucide/lazyLeaflet/Hoja | Formulario proyecto anterior; `src/app/(crm)/propiedades/[slug]/vista.tsx:209` unidad; wizard equivalente no localizado | PORTAR / L; COMPARTIR validadores por contrato / M / alto: UUID/decimales/tipologías ≠ serial/centavos/unidades. Guardias/reintento útiles; no CSS bruto con sobrescrituras |
| `src/studio/ProjectLocationMap.jsx:8`, `:13`, `:22` | Leaflet/OSM, click/drag marcador, ResizeObserver, error tiles y distinción navegación/ubicación documentada | `src/infrastructure/db/schema.ts:431` zona; `src/app/(crm)/propiedades/_formulario-proyecto.tsx:122` texto; no mapa/coordenadas encontrado | PORTAR / M / alto: contrato de precisión/fuente previo, client-only/SSR y cartografía externa |
| `src/studio/ProjectAdvanced.jsx:3`, `:7`, `:13`, `:21` | Upload FileReader/base64≤8MB/caption/tipo; VariantEditor rangos CRUD; exports legacy | `src/app/(crm)/avances/vista.tsx:120` FormData; `src/application/proyectos/casos-de-uso.ts:300` compensación; unidad CRM `src/app/(crm)/propiedades/[slug]/vista.tsx:209` | REFERENCIA upload/tipología / M / alto: conservar puerto CRM, variante ≠ unidad. IGNORAR NewProject sin uso/ProjectAdvancedFields importado no renderizado; presets comerciales fijos `:5` no evidencia |
| `src/studio/SourceEditor.jsx:3`, `:5` | Vincular título/fecha/URL privada/estado/notas a proyecto; React/FormData/request/Lucide | No gestor source_document/SourceEditor encontrado; archivos de fase `src/application/proyectos/puertos.ts:86`, `:125` | PORTAR / M / alto: puerto documental/permiso; privado ≠ público; etiqueta verified solo admin no es guarda; no copiar spread FormData a servidor |
| `src/studio/AmenityEditor.jsx:16`, `:32`, `:54`, `:94`; `src/studio/amenity-editor.css:1`, `:17` | Catálogo/selección/creación por proyecto con evidencia y revision concurrencia; React/request/sharedenum | No amenidades/evidencia equivalente localizado; proyectos CRM | PORTAR / M; COMPARTIR DTO / S / medio-alto: planned/reportado no hecho confirmado; servidor debe probar conflicto/publicación; adaptar CSS |
| `src/studio/DeliveryMilestones.jsx:24`, `:46`, `:58` | Entregas por proyecto/fase/bloque, fecha/rango/precisión/fuente/validación/publicación ES/EN; React/request | `src/application/proyectos/puertos.ts:13`, `:66`; `src/app/(crm)/avances/vista.tsx:278`; no milestones equivalente | REFERENCIA / M / alto: fecha estimada/avance ≠ entrega documentada, contrato antes de portar |
| `src/studio/UnsavedChangesDialog.jsx:4`, `:6` | Seguir/descartar, Escape/trap/foco/restauración; React/DOM/Lucide, Studio/Creator consumidores | `src/hooks/use-focus-trap.ts:10`, `:61`, `:98`; no dirty/beforeunload común localizado | PORTAR política / S / medio: usar primitives/trap CRM existentes, proteger salida Next/borrador, no duplicar trap |
| `src/studio/OriginLinks.jsx:50`, `:70`, `:104`, `:125`, `:142` | Builder UTM/asesor/destino/proyecto, clipboard/historial8local/QR; Motion/Lucide/attribution; WhatsApp mostrado simulado | `src/infrastructure/db/schema.ts:637` UTM; generador no encontrado | PORTAR generador / M; COMPARTIR builder / S / alto: QR transmite URL a servicio externo; historial no auditoría; asesor texto no broker autorizado |
| `src/studio/GoogleDriveExplorer.jsx:30`, `:44`, `:316`, `:478`, `:639`, `:685`, `:742`; `src/studio/drive-explorer.css:7`, `:235`, `:482` | Árbol/lista/grid/búsqueda, iframe/preview/enlaces; cuentas/ficheros/hasAccess constantes locales; cambiar cuenta es setState, enlaceOAuth sin callback; no fetch/request | `src/app/(crm)/configuracion/_integraciones.tsx:14`, `:20`, `:28`, explica ausenciaOAuth; explorador no encontrado | REFERENCIA layout / M; IGNORAR cuenta/permiso aparente / S / alto: no API/OAuth acreditados; acceso/recencia/procedencia UNKNOWN; CSS global propio |
| `src/studio/Sources.tsx:4` | Wrapper Drive; separa repositorio documental y evidencia por ficha | Sin repositorio editorial; integracionesCRM anterior | REFERENCIA / S / medio: esta pantalla no es SourceEditor real |
| `src/studio/Videos.tsx:91`, `:135`, `:209`, `:220`, `:560`, `:603`, `:738` | Videoteca tabla/cards/filtros/altaURL/editorTabs/preview/bulk parcial/categorías sugeridas; React/Motion/useForm/helpers | `src/app/(crm)/avances/vista.tsx:381` URLfase y Academy; videoteca editorial no localizada | PORTAR tras ficha / L; REFERENCIA hoy / alto: taxonomía/evidencia/derechos, bulk parcial ≠ transacciónCRM |
| `src/studio/VideoBatch.jsx:5`, `:7`, `:13`, `:15` | Parsear≤100 URL-título YouTube/prevalidación/lote/creados-duplicados; no descarga | Sin importación editorial vídeo | REFERENCIA / S / medio: patrón prevalidar/resumir; idempotencia servidor UNKNOWN; no Drive aunque videoteca sí |
| `src/studio/VideoRelations.jsx:4`, `:10`, `:19`, `:21`, `:30`, `:37` | Links multi-proyecto scope project/masterplan y evidencia; fechaUTC/tema/visibilidad/clase/prioridad/tags; React/request | `src/application/proyectos/puertos.ts:107` URLfase única; sin relaciones editoriales | REFERENCIA / M / alto: masterplan no prueba torre; datetime-local interpreta UTC explícita |
| `src/studio/editorial-media.mjs:4`, `:12` | Elegibilidad portada derechos/zona/publicación y parser/embed/thumbYouTube/Drive; validación compartida | Fotos URLs firmadas `src/app/(crm)/avances/page.tsx:113`; sin editorial-media/derechos | COMPARTIR parser/render / S; REFERENCIA regla portada / medio-alto: filtro UI no permiso, privado no pasa a público |
| `src/studio/VideoCategoriesModal.jsx:28`, `:97`, `:161` | CRUD slug/ES/EN/descripcion/order/active, referencias y desactivación; React/Motion/request | `src/app/(crm)/configuracion/_catalogos.tsx:14`, `:29`, catálogos aplicación | PORTAR patrón genérico / M / medio: distinta taxonomía/referencias, modal/slugify duplicados |
| `src/studio/PropertyTypesModal.jsx:29`, `:61`, `:102`, `:163` | CRUD tipos inmueble, slug estable/labels/orden/active/refcounts; React/Motion/request | Catálogos y domaincatalogsCRM | PORTAR patrón / M / alto: tipo inmueble CMS ≠ PROJECT_TYPES CRM de etapa/proyecto; no fusionar conceptos |
| `src/studio/PhasesManagerModal.jsx:34`, `:52`, `:129`, `:190` | Catálogo fases globales ES/EN/color/order/active/refcounts/CRUD, fallback DEFAULT_PHASES | `src/application/proyectos/puertos.ts:66`, `src/application/proyectos/casos-de-uso.ts:206`, `:253`; fases instanciadas | REFERENCIA / M / alto: taxonomía global ≠ instancia/responsable/progreso; fuzzy nombre no ID |
| `src/studio/PoiCategoriesModal.jsx:46`, `:73`, `:163`, `:214` | CRUD categorías POI/labels/color/orden/active, icono por texto, refs/confirmación; React/Motion/request | Catálogos, zones `src/infrastructure/db/schema.ts:342`; sin POI equivalente | REFERENCIA / M; COMPARTIR DTO solo dueño común / S / medio: icono fuzzy/fallbacks divergentes |
| `src/studio/EditorialModules.jsx:258`, `:270`, `:287`, `:686`, `:781`, `:1071`, `:1388`; `src/studio/editorial-modules.css:5`, `:277` | Bundle/editor/CRUDupdates-zones-POI-pages; fotos aprobadas/video confirmado/publicación separada; ContentSections y showcases; React/Motion/helper/modals | Proyectos/fases/catálogos/AcademyCRM; avances existente | REFERENCIA coordinación / L; PORTAR patrones aislados / M / alto: monolito/lógicaUI/requests/listasfijas. IGNORAR SettingsModulelegacy`:1313` sin uso; router usa SettingsShowcase`:1408` |
| `src/studio/UpdatesTimeline.jsx:29`, `:87`, `:139`, `:174`, `:623` | Cards/timeline/kanban/búsqueda/fase/progreso clamped/previews/gestor; React/Motion/parser | `src/app/(crm)/avances/vista.tsx:27`, `:185`, `:278`, fases/fotos/responsableCRUD | PORTAR vistas / M; COMPARTIR anillo / S / alto: no reimplementarCRUD; agrupación fuzzy y porcentaje editorial no evidencian obra |
| `src/studio/ZonesShowcase.jsx:54`, `:78`, `:89`, `:111`, `:124` | Destinos/POI/búsqueda/filtros/portadas/count/grupos, callbacks editor; React/Motion/modal POI | Zones `src/infrastructure/db/schema.ts:342`, métricas `src/application/reportes/puertos.ts:22`; sin showcase POI | REFERENCIA / M / medio: evitar doble catálogo/fallbacks; URL portada no adjudica derechos |
| `src/studio/ContentSections.jsx:4`, `:9`, `:29`, `:39`, `:45` | Editor intro/note/heading-body, add/delete/reorder, keys estables, máximo 40/mínimo 1; React/useRef/Lucide | Academy contenido parcial `src/app/(crm)/academy/vista.tsx:54`; editor secciones no encontrado | COMPARTIR DTO/editor / M / medio: schema/migracióntexto legacy; REFERENCIA si CRM solo consume |
| `src/studio/PagesShowcase.jsx:51`, `:62`, `:79`, `:88` | FAQ/guías/legal, búsqueda cuerpo, expandir/copyrespuesta y callbacks; React/Motion | Academy; `src/domain/confotur.ts:72` es cálculo, no página legal | REFERENCIA / M / alto: tipospágina/copyfijos; texto legal no certifica elegibilidad |
| `src/studio/SettingsShowcase.jsx:40`, `:57`, `:68`, `:90`, `:165`, `:177` | Settings marca/contacto/horario/advisor tabs/preview/copyWhatsApp/PATCH; status desde data.settings/host del navegador; React/Lucide/Bits | `src/app/(crm)/configuracion/vista.tsx:34`: usuarios/permisos/catalogos/integraciones; otro contrato | REFERENCIA / M / medio: dueño contacto público único, window en SSR/PATCH de draft; no otra fuente editorial |
| `src/studio/Overview.tsx:53`, `:67`, `:77`, `:89` | Conteos editoriales sobre props: publicación/revisión/medios/videos/conflictos/geografía; React/Motion/Bits | `src/application/dashboard/consultas.ts:1`, reportes/gráficos | REFERENCIA radar / S / medio: editorial no comercial; completitud no certeza; KPI imagen approved no exige is_public |
| `src/studio/CommandPalette.tsx:42`, `:77`, `:95`, `:105`, `:118`; `src/studio/Studio.jsx:705` | CtrlCmdK/Escape/arrows/Enter, módulos/proyectos nombre-zona-dev/vídeos title-category; proyecto detalle, vídeo→videoteca; React/Lucide/DOM | **Existe** `src/app/(crm)/_ui/command-palette.tsx:78`, `:115`, `:124`, `:142`, Header`:250` | COMPARTIR motor/adaptadores y PORTAR entidades / M / alto: CRM sin búsqueda de entidades; Header no pasa modulosVisibles, default todos. Revisar alcance/teclado/trap, no bypass de API afirmado |
| `src/studio/Accounts.tsx:212`, `:227`, `:326`, `:351`, `:371`, `:383` | Usuarios tabla/cards/roles-capacidades/alta contraseña/cambio-borrado, guardas UI sobre cuenta propia/últimoadmin; React/request/UI | `src/app/(crm)/configuracion/_usuarios.tsx:31`, `:166`; `src/application/usuarios/casos-de-uso.ts:10`, `:117` invitación | REFERENCIA presentación / M; IGNORAR flujocontraseña / alto: roles editoriales ≠ alcances CRM; guardas/sessionrevocation deben comprobarse servidor |
| `src/studio/Audit.tsx:78`, `:93`, `:108`, `:119`, `:131`, `:427` | Bitácora stream/tabla/facetas/actor/diff before/after/copy value, hasta 500; React/Motion/DataTable/Hoja | `src/infrastructure/audit.ts:64`, `src/application/compartido/auditoria.ts:20`, `src/app/(crm)/_ui/historial.tsx:53` | PORTAR inspector / M / alto: allowlist por permiso/PII/precio interno, no JSONgenérico;500 registros no total |
| `src/studio/Analytics.tsx:99`, `:114`, `:132`, `:219`, `:234`, `:247` | Panorama/proyectos/recorridos/contenido, requests paralelos, sesiones≤80 y detalle; React/Motion/UI | `src/app/(crm)/reportes/vista.tsx:28`, `src/app/(crm)/_ui/analytics-details.tsx:6`, consultas | REFERENCIA drilldown/origen / M / alto: WhatsApp abierto no contacto; porcentaje eventos/sesiones clamp a 100 y geografía muestra limitada |
| `src/studio/ComponentGallery.jsx:27`, `:33`, `:249`, `:291` | Demo local beneficios/POI/tema/seis estados useState; sin requests/persistencia/consumidor encontrado | `src/components/ui/chart-card.tsx:6`, `src/app/(crm)/_ui/estados.tsx:14` reales | REFERENCIA ejemplos / S; IGNORAR datos/promesas / alto: texto cache offline/sync no implementación, distancias/beneficios no evidencia |
| `src/studio/Library21st.tsx:26`, `:92`, `:129`, `:150`, `:172`, `:187`, `:199` | Curación componentes/apps/recipes/tokens/licence/preview/filtros/paginación/copy commands via /api/studio/21st; React/Lucide | src/components/ui; sin Library21st/endpoints CRM | REFERENCIA herramienta agentes / S; IGNORAR módulocomercial / medio: metadata licencia no validación, fetch sin res.ok/errores solo consola |

**Los 12 archivos `studio/ui/`:**

| Origen P / archivo:línea | Función/dependencias | Equivalente C / propuesta, razón y riesgo |
|---|---|---|
| `src/studio/ui/DataTable.tsx:21`, `:63`, `:98`, `:245` | Columnas/bulk/sort/paging/selección visible/skeleton/vacío/cardsmóvil; React/Lucide/cn | `src/components/ui/data-table.tsx:5`, `:39`, `:57`, `:87`, `:257` mismo contrato/algoritmo. COMPARTIR / M / medio: divergencia de bugs/temas, IDsselección retenidos al cambiar filas, sort local no servidor, revisar teclado de fila |
| `src/studio/ui/Bits.tsx:7`, `:30`, `:58`, `:71` | Insignia/Botón busy/Encabezado/Nota/status/alert; React/Lucide/cn/tone | `src/components/ui/bits.tsx:7`, `:50`, `:80`; PageHeader `src/app/(crm)/_ui/prototipo-ui.tsx:11`. COMPARTIR / S / medio: no duplicar, tokens/busy/motion |
| `src/studio/ui/tone.ts:10`, `:12`, `:31` | Seis tonos y mapping publicación | `src/components/ui/tone.ts:7`, `:9`, `:54` mapping lead. COMPARTIR vocabulario/tema / S / medio: mappings de negocio separados |
| `src/studio/ui/useForm.ts:18`, `:44`, `:53`, `:69` | Values/touched/blur/submit/rules/reset, solo React | Sin hook useForm/Formik/RHF encontrado; formularios CRM nativos. COMPARTIR UX con adaptador Zod / M / medio: no dos schemas ni guardia async inexistente |
| `src/studio/ui/Field.tsx:30`, `:50`, `:67`, `:90`, `:111` | Input/textarea/select/grid labels-id-aria-pista/error-counter; React/Lucide/cn | input/label/select y `src/app/(crm)/_ui/alerta-error-formulario.tsx:1`. PORTAR marco / S / medio: primitives/tokens CRM, descrita pista debe existir, asterisco no impone required |
| `src/studio/ui/Filtros.tsx:14`, `:80` | Buscador y filtroplegablemóvil/badge activos/clear/select; React/Lucide/cn | `src/app/(crm)/reportes/filtros-vista.tsx:8`, filtros por módulo. PORTAR / S / medio: conservar URL/contexto, no estilos duros |
| `src/studio/ui/Disclosure.tsx:18`, `:74` | Acordeón y Hoja desktop/bottomsheetmóvil; React/Motion/Lucide/cn | Dialog `src/components/ui/dialog.tsx:50`, Sheet`:46`, Drawer y trap CRM. REFERENCIA / S / medio: Hoja no implementa trap/Escape/restore aquí; no reemplazar Radix |
| `src/studio/ui/Notifications.tsx:43`, `:50`, `:83`, `:132` | Queue 4, error persistente, otros 5200 ms/acción/aria/Motion | `src/components/ui/sonner.tsx:13`, layout CRM`:100` montado. REFERENCIA / S / medio: adaptar política Sonner, no segunda cola; sin provider no-op |
| `src/studio/ui/EditorTabs.jsx:5`, `:8`, `:10`, `:11` | Roving/flechas/Home/End/panel/reset/error servidor-invalid→tab; React/helper/CSS | Radix `src/components/ui/tabs.tsx:6`, `:90`, `src/app/(crm)/_ui/module-tabs.tsx:21`. PORTAR error→tab / M / medio: keywords/locale frágiles, ocultar panel conserva inputs |
| `src/studio/ui/editor-tabs-logic.mjs:1`, `:2` | nextTabIndex/errorTabkeywords/errorPriority puros | Radix existente; COMPARTIR error routing / S / medio: no duplicar teclado; preferir codes de campo sobre matching de texto |
| `src/studio/ui/EditorTabs.d.ts:3`, `:10` | Props JSX tipadas pero retorna any/omite errorPriority | TS/Radix CRM. REFERENCIA / S / medio: migración temporal, no copiar any/desajuste implementación/tipos |
| `src/studio/ui/editor-tabs.css:1` | Tabs/panel/foco/mínimo 44/scroll/input 16 móvil | Clases/tokens CRM. REFERENCIA / S / medio: colores fijos y selector input global no paquete CSS |

Dependencias comunes adicionales: `P/src/lib/utils.ts:1` es clsx+tailwind-merge/cn, equivalente `C/src/lib/utils.ts:1`: **COMPARTIR / S / bajo**. `P/shared/validation.mjs:18`, `:41` y `P/shared/amenities.mjs:3` se consumen en vídeo/evidencia: **COMPARTIR / S / medio**, DTO y validación, nunca permiso. Browser clipboard/localStorage/FileReader/ResizeObserver/Leaflet necesitan frontera cliente Next; datos/API son dependencia principal, no basta mover JSX.

Ausencias Studio contrastadas con búsquedas en C/src: `ProjectJourney|beforeunload|SourceEditor|source_document_id|delivery_milestones|GoogleDriveExplorer|OriginLinks|Library21st|amenit|video_project_links|useForm|react-hook-form|Formik|Leaflet`. Equivalentes parciales se citan en cada fila; no se extiende ausencia a servicios externos. ComponentGallery, NewProject, ProjectAdvancedFields y SettingsModule son código existente con consumo ausente/legacy, no funcionalidades terminadas. Drive texto “verificado” (`P/src/studio/GoogleDriveExplorer.jsx:521`) no acredita procedencia o acceso.

### 1.3 Servicios y utilidades detrás de las vistas

| Origen P / evidencia | Función/dependencias | Equivalente C observado | Propuesta y razón | Divergencia / esfuerzo |
|---|---|---|---|---|
| `server/catalog.mjs:28`, `shared/public-commercial.mjs:20` | DTO público por allowlist recursiva, redacción comercial; pg/reglas puras | RBAC/consultas restringen precios: `src/domain/rbac.ts:133`; contrato editorial distinto | COMPARTIR contrato público/regla parametrizada; PORTAR proyección | Alto: originales privados, derechos y validación / L |
| `server/catalog-cache.mjs:10` | TTL/ETag, refresh único, generación de invalidación y último resultado válido; crypto/Node | No caché pública de catálogo localizada en C/src; RSC tiene otro ámbito | REFERENCIA para futura API pública; nunca cache global de datos por actor | Alto: cruce de ámbitos/datos obsoletos / M |
| `server/editorial.mjs:270`, `:334`, `:363` | Bundle/CRUD avances, zonas, POI, páginas, settings, taxonomías; pg/audit/can | `src/application/catalogos/casos-de-uso.ts:1`, `src/application/proyectos/casos-de-uso.ts:56` | REFERENCIA de publicación/validación; PORTAR por contrato | Alto: roles/tablas/editorial vs comercial / L |
| `server/project-tools.mjs:42`, `:50`, `:65`, `:117` | Fuentes; upload firma-formato/8MB/hash/compensación; variantes/hitos; fs/crypto/pg | `src/application/proyectos/casos-de-uso.ts:310`, `src/application/compartido/almacenamiento.ts:25` | PORTAR evidencia/derechos detrás del puerto existente | Alto: disco público CMS vs URLs firmadas CRM / L |
| `server/amenities.mjs:42`, `shared/amenities.mjs:3` | Selecciones/evidencia/revisión; hash y transacción | Catálogos CRM; sin selección editorial equivalente localizada | COMPARTIR vocabulario/DTO; PORTAR editor | Medio: planned/reported ≠ comprobado / M |
| `server/video-import.mjs:3`, `server/video-links.mjs:3`, `shared/validation.mjs:18` | Importar enlaces, relaciones explícitas y parsers YouTube/Drive/HTTPS; pg/roles | CRM URL vídeo de proyecto/fase; sin biblioteca relacional | COMPARTIR parsers; PORTAR servicio tras ficha | Alto: proveedor/ID/derechos/ámbito / M–L |
| `server/zone-cover.mjs:12`, `shared/project-facts.mjs:2` | Portada elegible y consistencia de rangos/coordenadas | Schemas/validación por ruta/dominio, otros campos | COMPARTIR helpers puros; REFERENCIA de guardas | Medio: concepto/contrato distinto / M |
| `server/auth.mjs:4`, `:19`, `server/roles.mjs:8` | Studio: scrypt, cookies y tablas privadas; capacidades editoriales | `src/infrastructure/auth/actor.ts:29`, `src/domain/rbac.ts:73`: SupabaseAuth/permisos | IGNORAR backend de identidad; REFERENCIA de sesiones revocables | Alto: autoridades/privilegios distintos / L |
| `server/client-auth.mjs:109`, `:289`, `:336`, `:399`, `server/client-api.mjs:20` | Cuenta/perfil/favoritos/consultas/export/purge; crypto/limits/SQL | Contactos/usuarios/Auth interno; no autoservicio cliente con ese contrato | REFERENCIA M18/M20/I06; no fusionar comprador con empleado | Alto: PII, sesiones y borrado externo / L |
| `server/saved.mjs:5`, `:17`, `:32` | Sanitización/límites y colecciones anónimas por visitor UUID | Sin colecciones públicas localizadas | REFERENCIA tras definir identidad/autorización | Alto: visitor UUID ≠ sesión CRM / M |
| `server/analytics.mjs:86`, `:233`, `:300`, `shared/request-limits.mjs:47` | Ingesta/métricas navegación/limits y envío opcional externo; pg | `src/application/dashboard/consultas.ts:1`, `src/application/reportes/consultas.ts:1` | REFERENCIA adquisición; COMPARTIR evento permitido tras finalidad/retención | Alto: clic ≠ lead/venta, PII / M |
| `server/assistant.mjs:265`, `server/assistant-guardrails.mjs:15` | Asistente catálogo/herramientas/limits/guardrails, proveedor servidor/pg | `src/application/ai/puertos.ts:1`, `src/application/ai/casos-de-uso.ts:1`, otro uso | REFERENCIA; PORTAR guardrails pertinentes por puerto | Alto: no exponer CRM privado al asistente público / L |
| `server/translator.mjs:86`, `src/i18n/protected-terms.js:61` | Traducción por lotes y preservación términos; IA servidor | Sin servicio traducción localizado | REFERENCIA; COMPARTIR términos/validadores | Medio: traducir no confirma condición comercial / M |
| `shared/contact.mjs:27`, `:33`, `shared/advisor-content.mjs:67` | Builder contacto y contenido asesor validado; JS puro | Acciones contacto `src/app/(crm)/leads/inspector.tsx:1`, agenda/contactos | COMPARTIR builder configurable; no copiar número ni identidad | Medio: configuración/PII/origen / S |
| `shared/public-errors.mjs:2`, `server/static.mjs:16` | Errores públicos y guardas de medios estáticos | `src/infrastructure/http.ts:1`, puerto almacenamiento | REFERENCIA; COMPARTIR forma error, adaptar hosting | Alto: mensajes/paths privados o medios expuestos / M |
| `server/seo.mjs:14`, `:45` | Metadata/robots/sitemap públicos | Layout privado Next | IGNORAR traslado al backoffice | Bajo: no indexar CRM / S |

Ausencias acotadas: búsquedas en **C/src** de `publicCatalogProjection|getCachedCatalog|createCatalogCache|video_project_links|project_sources|source_documents|client_accounts|client_inquiries|visitor_saved|translateEntries|amenity|google.?drive|OriginLinks` no localizaron contrato CMS equivalente. Sí existen catálogos, archivos, contactos y Auth. Ausencia aquí no significa ausencia en sistemas externos o en fichas futuras.

## 2. Portal, componentes compartidos, i18n y patrón de consola

### 2.1 Los 42 archivos de código Portal

Equivalentes CRM abreviados para evitar repetir rutas. Una referencia Cn remite a los archivos y líneas de esta tabla; no significa equivalencia de negocio ni runtime probado.

| Ref | Equivalente CRM verificado |
|---|---|
| C1 | `src/app/(crm)/propiedades/vista.tsx:46`: listado/filtros; `:4` Next Image, `:30` rangos |
| C2 | `src/app/(crm)/propiedades/[slug]/vista.tsx:36`: detalle operativo; `:153` unidades, `:209` formulario |
| C3 | `src/app/(crm)/avances/vista.tsx:27`: fases; `:111` publicar, `:120` upload, `:225` fotos, `:228` URLs firmadas, `:278` formulario, `:381` URL vídeo |
| C4 | `src/app/(crm)/agenda/vista.tsx:49`: agenda; `:132` formulario, `:30` Google Calendar; `:6` zona Santo Domingo, `:5` ICS |
| C5 | `src/app/(crm)/_ui/estados.tsx:14`, `:26`, `:62`: vacío/resultado/permiso; `src/app/(crm)/_ui/analytics-state.ts:10`: conectividad con useSyncExternalStore/SSR |
| C6 | `src/components/ui/sonner.tsx:13`: Sonner; `:12` comentario sin tema oscuro, `:16` tema light |
| C7 | `src/app/login/login-form.tsx:6`, `:13`, `:78`: acceso empleado/recuperación; identidad pública cliente y preferencias no localizadas |
| C8 | `src/app/(crm)/_ui/mobile-dock.tsx:24`, `src/app/(crm)/_ui/crm-header.tsx:37`: navegación y acceso a paleta |
| C9 | `src/components/ui/dialog.tsx:50`, `drawer.tsx:47`, `tabs.tsx:8`, `:58`, `select.tsx:26`, `:52`, `:102`, `sheet.tsx:1`: primitives Radix ya existentes |
| C10 | `src/app/(crm)/_ui/formato.ts:13`, `:23`, `:31`: centavos/formatos; `src/domain/telefono.ts:25`: teléfono RD |
| C11 | `src/app/api/leads/externo/route.ts:25`, `:65`, `:98`; `src/application/leads/casos-de-uso.ts:299`, `:334`: captación externa y consentimiento asignado al recibir |
| C12 | `src/app/layout.tsx:35`, `public/manifest.json:1`: manifest del CRM; no hook de instalación localizado |

| Origen P / archivo:línea | Función y dependencias verificadas | Equivalente CRM real o ausencia buscada | Recomendación, razón, riesgo y esfuerzo |
|---|---|---|---|
| `src/portal/Portal.jsx:31`, `:80`, `:122` | Shell/rutas lazy, catálogo/perfil/asistente, header/footer/consent/onboarding y dwell; React Router/Motion/i18n/stores | C8; Next y shell por permisos | REFERENCIA / M / medio: composición pública útil; adaptar routing/document globals y autorización |
| `src/portal/store.jsx:22`, `:97`, `:116`, `:124`, `:132` | GET catálogo/cache navegador/retry, sincronización favoritos, undo, comparación máximo 3 y colecciones; React/fetch/storage | C1; favoritos/comparador/colecciones no localizados | REFERENCIA / L / alto: separar datos públicos de privados; cache/lifecycle y fallos de sincronización requieren contrato |
| `src/portal/store.jsx:140`, `:145`, `:148` | Helpers zona/URL/foto/rango monetario, filtros zona/tipo/moneda/precio/dormitorios/recencia y ordenación | C1/C10 | COMPARTIR funciones puras por contrato / M / alto: decimales CMS frente centavos CRM; locale y acceso al precio separados |
| `src/portal/client-store.jsx:6`, `:68`, `:101`, `:159`, `:192`, `:235`, `:259` | Context de sesión/registro/perfil/inquiries/export/purge; fetch/toasts/eventos | C7/C4; no client/profile ni privacy/export/purge CRM | REFERENCIA / L / alto: identidad pública distinta; datos personales/consentimiento y contrato I06 previos |
| `src/portal/auth/ClientAuthModal.jsx:8`, `:47`, `:79` | Dialog nativo login/registro, password visible/fuerza, contacto/+18/remember me; React/i18n/Lucide/store/CSS | C7/C9/C10 | REFERENCIA / M / alto: no copiar sesión cliente a empleados; textos/validación teléfono y foco por comprobar |
| `src/portal/profile/ClientProfile.jsx:45`, `:106`, `:133`, `:149`, `:180`, `:638` | Perfil/inversión/favoritos/solicitudes/recomendación/export/purge; catálogo/store | C2/C4/C7; no perfil inversor público | REFERENCIA / L / alto: matching con listas fijas y sin moneda; errores silenciosos; preferencias ≠ evaluación comercial |
| `src/portal/Appointment.jsx:26`, `:37`, `:39` | Fecha/hora/proyecto/+18/revisión y WhatsApp con origen; React/i18n/attribution | C4 agenda; C11 lead | REFERENCIA / M / alto: preferencia no reserva ni escritura lead; zona horaria navegador frente RD y copy requieren revisión |
| `src/portal/attribution.js:27`, `:58`, `:73`, `:93`, `:118` | Primer origen por sesión, UTM/alias asesor/referrer host, builder/WhatsApp/bridge analítica; URL/storage | C11 recibe campos UTM; generador/frontend no localizado | COMPARTIR parser/builders; PORTAR storage / M / alto: identificador asesor de URL no autoriza asignación; allowlist y retención |
| `src/portal/analytics.js:69`, `:121`, `:145`, `:166`, `:187`, `:228` | Visita/sesión/consent básico y replay opt-in, lote 20/5 s, /api/e/sendBeacon, dwell/hooks; navegador/fetch | C5 conectividad y reportes comerciales; no esta telemetría | REFERENCIA / L / alto: privacidad/finalidad propias; eventos no clientes; dedupe global afecta retornos |
| `src/portal/ConsentNotice.jsx:20`, `:25`, `:34` | Aviso tras 2,6 s/tres opciones/storage; React/Motion/i18n/analytics | No consentimiento web equivalente localizado | REFERENCIA / M / alto: mecanismo de reapertura incompleto; definición jurídica no verificada |
| `src/portal/catalog.jsx:14`, `:31` | URL filtros/búsqueda/orden/chips/Sheet móvil/lista/mapa/load more; Router/store/primitives/Motion | C1 | PORTAR filtros/vistas / M / medio: DTO público no sustituye inventario privado filtrado en servidor |
| `src/portal/HomeSearch.jsx:8`, `:15`, `:28` | Sheet búsqueda, zona/precio/tipo/dormitorios/count/URL; store/Router | C1 | REFERENCIA / S / medio: límite fuerza USD y tipo/textos ES; no extender regla comercial |
| `src/portal/AnimatedViewSwitch.jsx:5`, `:7` | Selector animado/lista-grid, flechas/Home/End/reduced motion; React/Motion | C9 tabs/selector | COMPARTIR selector desacoplado / S / medio: corregir labels ES y probar teclado/ARIA |
| `src/portal/detail.jsx:22`, `:28`, `:41`, `:71`, `:81`, `:98`, `:121` | Detalle público, tabs/galería teclado-swipe/preload/share/relacionados/CTA/timeline entrega; Router/store/i18n/media/Motion | C2/C3 | PORTAR renderizadores / L / alto: separar DTO y URLs privadas; evidencias/rangos/fecha no hechos físicos de unidad |
| `src/portal/DetailSections.jsx:48`, `:54`, `:59` | Condiciones/pago/beneficios/avances/vídeos contextuales, mapa lazy/precisión/Maps/POI; Observer/ZonePlaces | C2/C3 | PORTAR presentación / L / alto: fuente explícita; no publicar documentos o avances privados |
| `src/portal/AmenityDetails.jsx:4`, `:6` | Estado amenidad verificada/reportada/prevista y alcance/traducción; CSS/i18n | C2 sin DTO amenidad/evidencia equivalente | PORTAR / S / medio: necesita DTO y badges de evidencia; no presentar planned como confirmed |
| `src/portal/ZonePlaces.jsx:6`, `:9`, `:11`, `:40` | POI publicado por zona/categoría/color/fuente HTTPS/nota | C2; POI no localizado | REFERENCIA / M / medio: CMS dueño editorial; no segundo catálogo CRM sin contrato |
| `src/portal/Discovery.jsx:13`, `:22`, `:43` | ZoneChoices multiselección/mosaico zonas/vídeos curados por rank; React/Motion/store/video-discovery/media | C1 sin discovery editorial | REFERENCIA; COMPARTIR selector desacoplado / M / medio: ranking no regla comercial ni certeza |
| `src/portal/Videos.jsx:18`, `:53`, `:65`, `:71`, `:100` | Filtros query proyecto/multi-zona/lugar/tipo/duración/categoría, orden/count/load more/tracking | C3 URL fase; `src/app/(crm)/academy/vista.tsx:54` | PORTAR biblioteca / L / medio-alto: permisos/taxonomía/relaciones y DTO antes del feed |
| `src/portal/video-discovery.js:2`, `:5`, `:12`, `:17`, `:23`, `:31`, `:34` | Relaciones explícitas, zonas/proyectos, alcance/evidencia, duración y featured-score; funciones JS puras | C3 sin helper editorial | COMPARTIR relaciones/duración; REFERENCIA score / M / medio: pesos fijos y update ≠ fase |
| `src/portal/Advances.jsx:11`, `:29`, `:33`, `:67`, `:79`, `:111`, `:183`, `:195`, `:207` | Predicate revisado/evidencia/cards/library/timeline/story/panorama/cola sin vínculo; fecha conocida/desconocida; store/media | C3 | PORTAR library/timeline; REFERENCIA panorama / L / alto: fecha vídeo no fecha avance; contexto global no prueba unidad. Cola final no renderizada `:230` |
| `src/portal/map.jsx:14`, `:21`, `:54`, `:173`, `:195`, `:255`, `:390` | Leaflet validación coordenadas/precisión/clusters/POI/tiles según tema, lista y drawer móvil, escape HTML | Sin Leaflet/coordenadas CRM localizado | REFERENCIA / L / alto: client-only, cartografía externa/derechos, precisión y CSS complejos |
| `src/portal/media.js:34`, `:48`, `:67` | Srcset/tamaños por contexto solo para medios registrados en media-widths.json | C1 Next Image; C3 signed URL | REFERENCIA pipeline; COMPARTIR metadata / M / medio: no tratar firmado como asset público; inventario de variantes real UNKNOWN |
| `src/portal/ComparePage.jsx:49`, `:67`, `:145`, `:305`, `:339`, `:603` | Comparar hasta 3/share URL/matriz diferencias/amenidades/tabs móvil; inferencias regex/store/CSS | Comparador no localizado; C2 contrato operativo distinto | REFERENCIA UI / L / alto: IGNORAR fallbacks comerciales; columnas no garantizan fuentes verificadas |
| `src/portal/CompareDock.jsx:10`, `:22`, `:42` | Dock selección/remover/clear/CTA, oculto en ruta comparar; Motion/Router/store | C8 dock navegación, no comparación | REFERENCIA / S / medio: límite/overlays y permisos; no duplicar dock global |
| `src/portal/SavedDrawer.jsx:8`, `:14`, `:22`, `:24` | Favoritos/colecciones/mover/badge sync, foco inicial/retorno/Escape/scroll lock | C9; favoritos/colecciones no localizados | REFERENCIA / M / alto: aside sin trap completo; identidad/sync y consentimiento antes del porte |
| `src/portal/support.jsx:16`, `:36`, `:73`, `:79`, `:88`, `:97` | SavedPage/zonas/guías/FAQ/LegalPage desde DB o fallback ES/EN, notfound y reexports | C1/C5/Academy; no páginas públicas legales equivalentes | REFERENCIA / M / alto: inglés puede ignorar DB, legal otras lenguas usa fallback; no copiar texto jurídico como válido |
| `src/portal/primitives.jsx:20`, `:24`, `:25`, `:35` | TextReveal/Header/MobileDock públicos, idioma/tema/auth/favoritos/install | C8 | REFERENCIA / M / medio: navegación pública no permisos CRM; desacoplar store/routes/tokens |
| `src/portal/primitives.jsx:44`, `:66`, `:67`, `:76`, `:85`, `:95`, `:96` | Sheet nativo con drag/imgfallback/ProjectCard/fav-compare/estados catálogo error-offline-403/heading/breadcrumb | C1/C5/C9 | PORTAR img/estados; REFERENCIA Sheet / M / medio: preferir Radix/foco existente; globals navegador/CSS propios |
| `src/portal/primitives.jsx:97`, `:98`, `:105`, `:106`, `:107` | Parsers YouTube/Drive/date, VideoCard/player nocookie/Drive preview/Sheet/external fallback | C3 URL vídeo sin player común | COMPARTIR parsers; PORTAR player cliente / M / alto: allowlist hosts/Drive regex amplio, permisos y autoplay |
| `src/portal/Toast.jsx:20`, `:26`, `:64` | Singleton máximo 3/dedupe/undo/action/pausa hover-focus/aria-live; Motion | C6 Sonner | REFERENCIA undo/estados / S / medio: CRM conserva un solo bus; no segundo toast provider |
| `src/portal/AppStatus.jsx:13`, `:16` | Banner online/offline navigator; React/i18n/Lucide | C5 hook SSR ya existente | REFERENCIA / S / medio: inicialización directa navigator no SSR; no indica recuperación datos |
| `src/portal/install.js:21`, `:38` | Suscripción temprana beforeinstallprompt/appinstalled/standalone/userChoice | C12; hook/SW en src CRM no localizado | PORTAR / S / medio: manifest existe; installability/runtime UNKNOWN |
| `src/portal/theme.js:8`, `:18`, `:28` | Light/dark persistido, html/color/meta/hook | C6 explícitamente light; no ThemeProvider funcional | REFERENCIA / M / alto: dark requiere decisión/tokens/SSR completos, no copiar mutación global |
| `src/portal/Onboarding.jsx:22`, `:35`, `:94`, `:97` | Dialog 3 pasos/skip/back/next/dots/primer storage/tracking | C9 dialog; no onboarding específico | REFERENCIA / S / medio: anuncios de capacidades/privacidad deben ser reales y probar foco |
| `src/portal/Splash.jsx:10`, `:15` | Overlay marca aria-hidden, cancelable, duración reducida; Motion/assets | C8 sin splash equivalente | IGNORAR / S / bajo: demora en tarea operativa frecuente; REFERENCIA marca solamente |
| `src/portal/effects.jsx:6`, `:13`, `:31` | ArrowFillLink/RotatingText/SourcePreview fuente-fecha-alcance; React/Motion/Lucide; consumidores no localizados | C9 button; no SourcePreview | REFERENCIA fuente; IGNORAR wrappers duplicados / S / medio: conexión no acreditada |
| `src/portal/motion/scroll.tsx:71`, `:105`, `:138`, `:173`, `:229`, `:252`, `:269`, `:307` | Reveal/grupo/item/title/parallax/progress/header/countup; React/Motion/reduced motion | CSS/animación CRM, sin helpers homónimos | COMPARTIR primitives opt-in; REFERENCIA parallax/header / M / medio: SSR/locale/números y presupuesto motion |
| `src/portal/motion/pointer.tsx:22`, `:58`, `:104` | Spotlight CSS vars/magnetic/tilt/springs/mouse/reduced | Sin helpers equivalentes localizados | COMPARTIR opcional / S / medio: decoración con presupuesto CSS/motion y teclado |
| `src/portal/motion/auto-reveal.js:16`, `:34` | Selectores DOM Portal/Observer/data-reveal/cleanup ruta/reduced | Sin equivalente localizado | IGNORAR implementación; REFERENCIA progressive enhancement / M / alto: mutación global fuera React, no pegar al shell |
| `src/portal/hero/Hero.tsx:18`, `:31`, `:45`, `:56` | Hero villa/parallax/pointer/rails/image/theme/TextRotate/ArrowFill/Outfit | C1/C8 sin hero público | IGNORAR conjunto; REFERENCIA marca / M / medio: assets y estilos no son sistema CRM |
| `src/portal/hero/pointer.ts:29`, `:59`, `:66`, `:73` | PointerField normalizado/layers/spring/tilt-glow; React/Motion | Sin equivalente localizado | COMPARTIR opcional / S / medio: decoración reusable si cumple presupuesto |
| `src/portal/hero/RotatingWord.tsx:10`, `:15` | Palabra rotativa/sr-only/intervalo/reduced motion | Sin equivalente; Hero usa TextRotate | IGNORAR duplicado / S / medio: export sin consumidor encontrado; preferir implementación activa |
| `src/portal/assistant/Assistant.jsx:146`, `:172`, `:180`, `:238`, `:239` | UI conversación/modelo/cards/comparación/precio/progreso, POST /api/assistant y respuesta local al fallar; engine/shared UI/catalog | No asistente conversacional catálogo CRM; `src/app/api/ai/audio-transcribe/route.ts:13` es audio, no equivalente | REFERENCIA / L / alto: DTO público/fallback no negocio autorizado; fuentes, historial y error por distinguir. No crea inquiry |
| `src/portal/assistant/engine.js:21`, `:31`, `:45`, `:74`, `:89` | Parse presupuesto/dormitorios/intención, matching/describir filtros local | Sin readIntent/matchProjects CRM localizado | REFERENCIA; COMPARTIR parser solo tras contrato / M / alto: heurísticas/CONFOTUR no elegibilidad verificada; comentario `:4` obsoleto frente POST real |

### 2.2 Los 10 archivos CSS Portal

Cada archivo se inspeccionó por alcance/selectores, responsive y reduced motion. Eso no acredita apariencia, contraste o todos los estados en navegador.

| Archivo P | Función/dependencias | Equivalente C | Recomendación, razón, riesgo / esfuerzo |
|---|---|---|---|
| `src/portal/advances.css:1`, `:233` | Library/cards/story/panorama; capa portal, responsive/reduced | C3/tokens CRM | REFERENCIA / medio / M: adaptar vistas, no aplicar capa/globales enteros |
| `src/portal/amenity-details.css:1` | Grid evidencia/alcance, responsive; AmenityDetails | C2 sin amenity UI | PORTAR con tokens / medio / S |
| `src/portal/compare.css:1`, `:183`, `:319`, `:570` | Dock/toolbar/sticky/mobile; sin capa propia ni reduced local | Sin comparador | REFERENCIA / alto / M: 760 líneas/overlays, no CSS bruto |
| `src/portal/discovery.css:5`, `:6`, `:20`, `:24` | Mosaicos/selector zona/responsive | C1 | REFERENCIA / medio / S: selección desacoplada, tema CRM |
| `src/portal/notifications.css:5`, `:9`, `:32`, `:70` | SourcePreview/consent/install, capa portal | C6/C8 | REFERENCIA / medio / S: z-index/buses y propósito propios |
| `src/portal/zone-places.css:1` | POI cards/grid responsive | C2 sin POI UI | REFERENCIA / medio / S: adaptar tokens una vez definido DTO |
| `src/portal/auth/client-auth.css:3` | Dialog/contacto/password/meter responsive; sin capa/reduced propios | C7/C9 | REFERENCIA / medio / M: identidad/foco/primitives distintos |
| `src/portal/profile/client-profile.css:3`, `:321`, `:382`, `:495` | Tabs/intereses/solicitudes/privacidad/danger responsive | C2/C4/C7 | REFERENCIA / alto / M: 583 líneas/tokens/overlays; no perfil CRM equivalente |
| `src/portal/hero/hero.css:5` | Hero/rails capa portal/reduced | C8 | IGNORAR conjunto / bajo / S: marketing no shell operativo |
| `src/portal/motion/motion.css:10`, `:57`, `:203`, `:223` | Header/cards/button/data-reveal globales/reduced | C8/C9 | REFERENCIA / alto / M: selectores globales pueden alterar CRM |

### 2.3 Los 13 archivos i18n

| Archivo P | Función/dependencias verificadas | Equivalente C / ausencia | Recomendación, razón, riesgo / esfuerzo |
|---|---|---|---|
| `src/i18n/locales.js:16`, `:45`, `:50`, `:60`, `:73` | Registro 8 idiomas, normalize/base/preferred/dir/Intl; declara curado | C10 formato ES; sin registro | COMPARTIR metadata / medio / S: calidad curada es declaración, revisión humana UNKNOWN |
| `src/i18n/index.jsx:24`, `:35`, `:89` | Provider/lang routing/fallback ES/key/interpolación/format/row/document lang-dir-hreflang; Router/8 JSON eager | I18nProvider/useI18n/hreflang no localizados | PORTAR adapter Next / alto / M: metadata SSR, fallback y bundles |
| `src/i18n/Link.tsx:20`, `:31`, `:35`, `:40` | Link/NavLink/navigate locale; externos/studio especiales; React Router | C1 Next Link | REFERENCIA adapter / medio / M: preservar URL/query y rutas autorizadas |
| `src/i18n/LanguagePicker.jsx:11`, `:29` | Cambia prefijo conservando query, lock/open/Escape/outside | No LanguagePicker localizado | PORTAR acotado / medio / S: teclado/listbox requiere UI, no acreditado |
| `src/i18n/protected-terms.js:61`, `:68`, `:75` | Marcas/geografía/legal/extra terms, prompt y detección términos perdidos; puro | No protectedTerms localizado | COMPARTIR / medio / S: cambios vocabulario y falsos positivos; no aprobación legal |
| `src/i18n/es.json:13`, `:257`, `:502` | 515 claves ES para shell/estados/negocio; import eager | Copy CRM español disperso | COMPARTIR subconjunto común / medio / M: dominio y tono por producto |
| `src/i18n/en.json:13`, `:256`, `:502` | 515 claves EN, mismo conjunto ES | Sin diccionario CRM | COMPARTIR subconjunto / medio / M: calidad humana UNKNOWN |
| `src/i18n/fr.json:256`, `:501` | 514 claves FR; falta nav.profile | Sin diccionario CRM | COMPARTIR subconjunto / medio / M: fallback ES y revisión pendientes |
| `src/i18n/pt.json:256`, `:501` | 514 claves PT; falta nav.profile | Sin diccionario CRM | COMPARTIR subconjunto / medio / M: fallback ES y revisión pendientes |
| `src/i18n/de.json:256`, `:501` | 514 claves DE; falta nav.profile | Sin diccionario CRM | COMPARTIR subconjunto / medio / M: fallback ES y revisión pendientes |
| `src/i18n/it.json:256`, `:501` | 514 claves IT; falta nav.profile | Sin diccionario CRM | COMPARTIR subconjunto / medio / M: fallback ES y revisión pendientes |
| `src/i18n/ru.json:256`, `:501` | 514 claves RU; falta nav.profile | Sin diccionario CRM | COMPARTIR subconjunto / medio / M: fallback ES y revisión pendientes |
| `src/i18n/ht.json:256`, `:501` | 514 claves HT; falta nav.profile | Sin diccionario CRM | COMPARTIR subconjunto / medio / M: fallback ES y revisión pendientes |

Ocho diccionarios no equivalen a ocho idiomas completos: auth/perfil/comparador tienen copy ES/EN o fijo; store usa etiquetas ES/EN y assistant-rich-text solo esas variantes para su prefijo. Se compararon conjuntos de claves, no calidad lingüística. No portar promesas económicas/jurídicas como strings certificados.

### 2.4 Los 8 componentes UI compartidos CMS y riesgos de uso

| Archivo P | Función/dependencias/consumidor real | Equivalente CRM / ausencia | Recomendación, razón, riesgo / esfuerzo |
|---|---|---|---|
| `src/components/ui/assistant-rich-text.tsx:7`, `:23`, `:33` | Markdown limitado sin HTML, links/listas/bold/code y respuesta progresiva/sr-full; React/Motion/i18n; Assistant `:13`, `:238` | Sin AssistantReply; no equiparar con audio | COMPARTIR renderer; REFERENCIA animación / alto / M: protocolo enlaces/relativos y locales requieren prueba |
| `src/components/ui/ai-citation.tsx:5` | Enlace fuente/tooltip hover-focus/reduced; Motion/icons; Assistant `:10`, `:239` | Tooltip primitives C9, sin AICitation | PORTAR / alto / S: validar destino/etiqueta, copy fija, fuente no certeza |
| `src/components/ui/arrow-fill-button.tsx:5` | CTA polimórfico/cn; Hero `:7`, `:50` | Bits `src/components/ui/bits.tsx:50`, Button | REFERENCIA variante / bajo / S: no duplicar primitive ni estilo marketing |
| `src/components/ui/model-selector.tsx:3`, `:5` | Dos modelos fijos/Radix/icons; Assistant `:11`, `:218` | C9 Select; no selector IA | REFERENCIA / medio / S: capacidad/nombre servidor no garantizados por selector |
| `src/components/ui/quisqueya-ai-mark.tsx:4` | SVG propio/orbit/star/aria-label/Motion; Assistant `:12`, `:207`, `:218` | C8 marca, sin distintivo IA | COMPARTIR asset / medio / S: reducir movimiento y confirmar autoría/licencia |
| `src/components/ui/select.tsx:6`, `:7`, `:8`, `:9` | Radix wrapper mínimo/cn/Tailwind; model-selector consumidor | C9 más completo | IGNORAR copia; REFERENCIA tokens / bajo / S: mantener primitive CRM existente |
| `src/components/ui/tool-calls-section.tsx:6` | Disclosure tool/output/i18n/cn/Lucide; consumidor no localizado | Sin ToolCallsSection localizado | REFERENCIA / alto / S: nunca volcar output con PII/secretos; conexión UNKNOWN |
| `src/components/ui/text-rotate.tsx:4`, `:9` | Reset por texto/locale, intervalo suspendido en reduced; React/Motion/cn; Hero `:8`, `:45` | Sin TextRotate localizado | COMPARTIR opt-in / medio / S: preferir pieza activa a duplicados RotatingWord/effects |

**Ausencias buscadas, no universales:** en C/src se buscaron ClientAuth/client-profile/privacy-export-purge/inquiries; favoritos/savedCollections/comparador (solo localeCompare/comparaciones de token); I18nProvider/useI18n/LanguagePicker/protectedTerms/hreflang; Leaflet/coordenadas; AssistantReply/AICitation/ToolCallsSection/TextRotate/readIntent/matchProjects; captureOrigin/originAdvisor/sendBeacon/useDwell (UTM existe en schema/contrato lead); beforeinstallprompt/appinstalled/useInstallPrompt/serviceWorker (manifest sí existe); ThemeProvider/useTheme (solo comentario Sonner). Búsqueda negativa acotada a código local, no prueba ausencia en sistemas externos, ramas o dependencias.

**Escenarios concretos que impiden copiar tal cual:**

- Comparador: `P/src/portal/ComparePage.jsx:156` pago estándar, `:220` vialidad, `:231` plusvalía, `:252` gestión independiente, `:258` desarrollador documentado, `:271` preventa/construcción y `:295` fuentes derivadas. Fallback/regex `:49` no valida evidence_status; `:625` etiqueta documental no acredita esos hechos. IGNORAR como reglas/datos.
- Consentimiento: `P/src/portal/ConsentNotice.jsx:25` retorna si ya hay elección antes del listener `:30`; footer `P/src/portal/Portal.jsx:121` sin acción de reapertura. `P/src/portal/analytics.js:71` usa básico por defecto. Son observaciones de código, no dictamen jurídico.
- Perfil: `P/src/portal/profile/ClientProfile.jsx:142`, `:161` silencian fallo suponiendo gestión por store, que lanza `P/src/portal/client-store.jsx:167`; matching `:106` ignora moneda/usa catálogo fijo `:28`, `:33`, `:37`; setState dentro useMemo `:86`. Riesgo: guardar parece exitoso o recomendación económica equivocada; no ejecutado aquí.
- Logout: `P/src/portal/client-store.jsx:144`, `:146` ignora error DELETE y limpia local `:148`; sesión servidor podría seguir activa si request falla. Runtime UNKNOWN.
- Cache/reintento: `P/src/portal/store.jsx:10` sin control de edad; `:51` comparte AbortController con reintentos `:55`, abortado `:59`. Copiar a datos privados agravaría exposición/obsolescencia; recuperación tras abort requiere prueba.
- Analítica: `P/src/portal/analytics.js:225`, `:235` Set de dedupe vive durante carga y puede suprimir retorno a ruta. No prometer sesiones/contactos exactos.
- PWA: `P/public/sw.js:1` cachea offline.html/theme-init y fallback navegación GET; no catálogo/API ni escrituras. `P/src/main.jsx:46` registra en producción; `:85` configura reduced motion. C12 manifest ya existe; installability/offline real de ambos UNKNOWN.

Las recomendaciones no autorizan funcionalidades nuevas durante el milestone. Portar solo detrás de ficha READY/despacho y revisión independiente; accesibilidad, responsive, rutas, permisos y seis estados se verifican después en entorno permitido.

### 2.5 Skill patron-consola y límites

`E:/PERFILES AI/skills/patron-consola/SKILL.md:7` describe anatomía por tareas; `:19` continuidad; `:43` estados; `:63` responsive; `:76` accesibilidad; `:93` elección de componentes. **REFERENCIA / S / riesgo bajo**, con fuente única. Equivalentes documentales C: `docs/DESIGN.md:1`, constitución `.specify/memory/constitution.md:1`. Es guía, no componente/requisito comercial. Su declaración de origen es auditoría UX D04 CMS revisada por D05/D07; actas originales/autoría individual **UNKNOWN** aquí.

No se acreditó WCAG AA, seis estados o 320/390/768/1440 por inspección/imports. `P/src/main.jsx:85` configura reducedMotion, no certifica todos los efectos. `P/public/sw.js:1` cachea solo offline.html/theme-init.js; no catálogo, documentos ni cola escrituras. Antes de paquete común: D03 API/propietario/versionado, D07 accesibilidad, D12 datos/fronteras. Licencia/derecho de extracción y autoría individual **UNKNOWN**: el barrido LICENSE/COPYING/NOTICE del producto, fuera de dependencias, no encontró licencia. No se instala ni aprueba candidato externo.

## 3. Datos compartidos y contrato I06 propuesto

### 3.1 Fuente de verdad AS-IS: escritores observados

| Entidad | Fuente CMS observada | Fuente CRM observada | Duplicación/frontera/propuesta pendiente |
|---|---|---|---|
| Proyectos | `P/supabase/migrations/20260905_quisqueya_catalog.sql:54`: UUID/catalog_id/slug, zona, rangos numeric, evidencia/editorial/publicación; lee `P/server/catalog.mjs:130`, escribe `P/server/server.mjs:197` | `C/src/infrastructure/db/schema.ts:424`: serial, rangos centavos, broker/publicación; casos de uso `C/src/application/proyectos/casos-de-uso.ts:56` | Modelos/escritores paralelos; duplicados de filas no comprobados. Proponer CRM dueño comercial y CMS dueño editorial/evidencia, proyección pública versionada y refs. No bidireccionalidad de todo |
| Tipologías/unidades | `P/supabase/migrations/20260905_quisqueya_catalog.sql:110`: variants con rangos, no unidad/reserva individual | `C/src/infrastructure/db/schema.ts:475`: units code/tower/status/precio/operación/broker | No equivalencia 1:1. CRM dueño disponibilidad/venta; CMS consume agregado publicable; no mapear por nombre |
| Captación | WhatsApp `P/src/portal/Appointment.jsx:37`; inquiries escribe/envía `P/server/client-api.mjs:165`; store define API creación sin consumidor UI localizado | `C/src/app/api/leads/externo/route.ts:65`, `C/src/application/leads/casos-de-uso.ts:299` | Portal original solicitud; CRM seguimiento comercial. CMS también define leads histórica en migración `:264`; no lectura/escritura public.leads localizada en P/src/server/shared. Aplicación/desuso real UNKNOWN |
| Cuenta/persona/contacto | client_accounts/profiles/sessions `P/server/client-auth.mjs:109`, `:289` | contacts/leads/users IDs/permisos distintos, `C/src/infrastructure/db/schema.ts:569`, `:605`; actor `C/src/infrastructure/auth/actor.ts:29` | Mismo individuo puede existir en ambos; no se comprobó duplicado real. Cuenta pública ≠ empleado. Referencia cliente/contacto y reglas de actualización requieren ficha |
| Confotur/beneficios | Texto benefits/legal/payment, `P/shared/public-commercial.mjs:2`, `P/src/portal/DetailSections.jsx:50`; presets `P/src/studio/ProjectAdvanced.jsx:4` | Elegibilidad/interés `C/src/infrastructure/db/schema.ts:434`, `:622`; cálculo `C/src/domain/confotur.ts:72`; API `C/src/app/api/cotizador/confotur/route.ts:26` | Texto ≠ certificado; cálculo ≠ elegibilidad documental. No contrato fiscal/certificación verificados. Proponer fuente/fecha/alcance y UNKNOWN hasta autoridad; cifras/ROI de código no se promueven a política fiscal validada |
| Medios/fuentes | Derechos/hash/publicación/documentos/vínculos `P/supabase/migrations/20260905_quisqueya_catalog.sql:170`, `:199`; upload disco `P/server/project-tools.mjs:50`; filtro `P/server/catalog.mjs:134` | files por entidad/visibilidad `C/src/infrastructure/db/schema.ts:1034`; compensación/puerto `C/src/application/proyectos/casos-de-uso.ts:310`, `C/src/application/compartido/almacenamiento.ts:25` | Metadatos paralelos; duplicado binario no comprobado. Proponer assetId/ref/proyección pública, original privado. Host/bucket/derechos efectivos UNKNOWN |
| Avances/entregas | Updates editoriales e hitos/evidencia `P/server/editorial.mjs:270`, `P/server/project-tools.mjs:65` | Fases por proyecto/progreso `C/src/infrastructure/db/schema.ts:526`, `C/src/application/proyectos/casos-de-uso.ts:17` | Fase, noticia e hito distintos. Dueño por campo; vídeo/masterplan no prueba porcentaje de unidad |
| Zonas/taxonomías | Catálogos editoriales `P/server/catalog.mjs:151` | Catálogos/relaciones `C/src/application/catalogos/casos-de-uso.ts:1`, `C/src/infrastructure/db/schema.ts:1` | Solapamiento semántico; compartir códigos/traducciones realmente comunes y mapear IDs; no sustituir permisos/estados CRM por listas CMS |

**UNKNOWN:** localización/configuración viva BD, migraciones aplicadas, filas y sincronización. Se leyó código/SQL, no bases reales. Ambos llaman public.projects a esquemas incompatibles (UUID vs serial); compartir misma BD/esquema sin adaptación no es válido. `C/.viltrum/vre-os/ARQ-VRE-002-integraciones.md:65` propone propietario por entidad, `:75` refs; cabecera dice **PROPUESTA**. La constitución exige puertos/fuente única/outbox/webhook verificado; este documento no aprueba el ADR ni la propiedad objetivo.

### 3.2 I06 existente: recorrido y huecos

1. `P/src/portal/Appointment.jsx:26`, `:37`, `:39` prepara WhatsApp con proyecto/preferencia/origen. Clic no acredita lead persistido, reserva o mensaje recibido.
2. `P/src/portal/client-store.jsx:192` define POST /api/client/inquiries; búsqueda global P/src solo definición y export `:310`: **sin consumidor UI creación localizado**. No atribuirlo al CTA público.
3. `P/server/client-api.mjs:78` requiere sesión, `:176` inserta inquiry, `:186` registra actividad y `:192` envía sin esperar; `:201` responde 201. Insert/log no forman transacción conjunta en ese handler. Respuesta no acredita recepción CRM.
4. `P/server/client-api.mjs:241` genera externalId estable portal_inquiry_<UUID>, contacto, interés texto, sale y mensaje notas/fecha/hora/canal/intención. `:258` POST con token y timeout 5 s; `:273` synced, `:283` failed HTTP, `:288` conserva pending si excepción. Configuración efectiva UNKNOWN. Fallback estático de destino (`:226`): host 127.0.0.1, puerto 3000, ruta /api/leads/externo; no acredita servidor ni el bloque9300–9399. Sin reproducir nombres/valores de configuración secreta.
5. CRM `C/src/app/api/leads/externo/route.ts:25` valida Zod, `:65` autentica token y `:77` asigna campos; excepción pública declarada `C/src/infrastructure/seguridad.test.ts:36`. No sustituir por alta manual /api/leads, que requiere actor.
6. `C/src/application/leads/casos-de-uso.ts:299` normaliza/reserva clave antes de efectos/reutiliza contacto/audita. `C/src/infrastructure/db/repos/leads.ts:116` advisory lock y recibo/hash; misma clave/otro payload da conflicto `:130`. Diseño implementado observado; concurrencia/servicio real UNKNOWN en esta entrega.

| Hueco observado | Evidencia y escenario | Consecuencia/dueño propuesto |
|---|---|---|
| ACK incompatible | CMS lee result.leadId `P/server/client-api.mjs:270`; CRM devuelve {ok,lead,creado} `C/src/app/api/leads/externo/route.ts:98`, `C/src/application/leads/casos-de-uso.ts:302` | 2xx puede marcar synced con crm_external_id null. D19 reproduce/fija ACK tipado; no corregido aquí |
| Envío no durable | Fire-and-forget `P/server/client-api.mjs:192`; pending al fallar red`:288`; no worker reenvío localizado al buscar retry/outbox/crm_sync en P/server/scripts | Crash/timeout tras commit remoto/fallo log dejan efecto incierto. D19/D11 outbox+snapshot+reintentos |
| Payload mutable | Relee nombre proyecto `P/server/client-api.mjs:229`, sesión/campos actuales construyen`:241`; CRM compara hash `C/src/infrastructure/db/repos/leads.ts:130` | Retry tras renombrar perfil/proyecto puede dar 409. Persistir payload normalizado original |
| Proyecto sin mapa | Emisor manda interés/nombre, no projectId CRM`:246`; UUID vs serial | Sin FK comercial. D03/D11 refs explícitas, no nombre/email. Tabla generic external_refs existe `C/src/infrastructure/db/schema.ts:1166`; adaptador Portal no localizado |
| Contexto perdido | Payload`:241` no incluye UTM/campaña/vídeo/asesor; receptor tiene campos `C/src/app/api/leads/externo/route.ts:41` | D19 conserva contexto permitido y mapea asesor autorizado; broker de URL no confiere permiso |
| Consentimiento inferido | CRM crea consentAt recepción/portal_externo `C/src/application/leads/casos-de-uso.ts:328`; payload CMS no aporta evidencia | D02/D12 definen instante/finalidad/evidencia/retención. Consent analytics/adult no equivalen a contacto; validez legal UNKNOWN |
| Teléfono internacional | Perfil phone/país `P/server/client-auth.mjs:148`; despacho solo phone`:245`; CRM solo normaliza RD `C/src/domain/telefono.ts:25` | Internacional puede conservarse solo en phoneDisplay, sin dedup E.164. G09/I06 sin país inventado ni pérdida del original |
| Cancelación incompleta | store POST sin JSON header `P/src/portal/client-store.jsx:215`, consumidor `P/src/portal/profile/ClientProfile.jsx:684`; server exige JSON `P/server/server.mjs:121`, sin handler hasta404 `P/server/client-api.mjs:218` | Escenario 415; añadiendo header,404. No cancelar automáticamente lead/actividad. D19 contrato/transición; runtime UNKNOWN |
| Purge no propagado | `P/server/client-auth.mjs:421` elimina localmente solicitudes/perfil/cuenta/sesiones sin evento CRM | Copia comercial/vínculo pendiente pueden persistir/desaparecer respectivamente. D12/D02 retención y efecto externo explícitos |

### 3.3 Propuesta para ficha I06 en P4, no READY

Portal conserva solicitud original; CRM decide seguimiento/asignación/conversión. WhatsApp abierto no es lead confirmado. Cuenta pública no hereda rol empleado/editorial.

Conservar /api/leads/externo como adaptador legacy y compartir esquema request/ACK. El sobre nuevo propuesto **no es aceptado por el receptor actual**: requiere adaptador/versionado, no enviarlo como si ya existiera.

| Parte | Contrato propuesto | Regla/estado |
|---|---|---|
| Sobre | system/accountId/schemaVersion/eventId/correlationId/occurredAt/eventType/idempotencyKey | Nombres ilustrativos a fijar D03/D19. UUID/clave estable por solicitud y namespace; inexistente en legacy |
| Contacto mínimo | fullName, email opcional, phone original/país declarado | Validación servidor/normalización central; sin contraseña/sesión/hash/perfil completo/IP/favoritos |
| Interés | portalProjectIdUUID, referencia comercial mapeada opcional, texto original/operación | Refs por sistema/cuenta/entidad; no UUID→number ni mapear por nombre; conservar interés si falta FK |
| Contexto | UTM/campaña/vídeo/origen/ref asesor permitido; notes/date/time/timezone/intent/channel | Límites/lista permitida. Preferencia no es cita confirmada; URL no autoriza broker |
| Consentimiento | Finalidad/versión aviso/instante real/fuente/evidencia | D02/D12 deciden; falta queda explícita, no se inventa aceptación jurídica |
| ACK | schemaVersion/eventId/correlationId/accepted/created-or-replayed/crmLeadId-or-ref/receivedAt | Forma única; legacy puede mapear lead.id. synced solo con ACK válido y referencia guardada; ACK mínimo sin todo el lead/PII |
| Error | code/clase RETRYABLE-NON_RETRYABLE-HUMAN_REQUIRED/mensaje público/correlationId | No guardar respuesta remota completa, URLs de configuración o token en log/payload compartido |

Guardar inquiry+evento/outbox+payload inmutable en **una transacción**; worker timeout/backoff/jitter/límite configurado. Timeout/429/5xx: misma clave/cuerpo. 401/403: suspender hasta configuración corregida. 400/422: revisión del dato. 409: reconciliar, no otra clave para ocultarlo. 2xx sin ACK válido: efecto incierto. Intentos/próximo intento/clase/dead-letter durables; no anunciar cita confirmada por solicitud aceptada. Son propuestas, no scheduler acreditado.

Reuso inverso: `C/src/infrastructure/integraciones/outbox/worker.ts:28`, `politica.ts:1`, outbox/dead/inbox/refs. Worker actual usa CrmPort/tres eventos propios (`:7`), **no inquiries**; compartir política/envolvente por puertos, no adaptador sin cambio contractual.

Futuras pruebas de contrato: legacy/ACK/versiones; token ausente/incorrecto sin efectos; payload inválido; repetido/concurrente; misma clave distinto cuerpo; crash insert→envío y ACK→persistencia; timeout tras commit remoto; perfil/proyecto renombrado; extranjero/proyecto sin mapa;401/403/409/429/5xx; consumidor UI; cancel/purge; seis estados. Entorno aislado autorizado, sin secretos en fixtures/scripts/logs.

## 4. Reimplementaciones y contradicciones

### 4.1 Lo existente en CMS que CRM volvió a implementar

| Capacidad | Comparación verificada | Qué conservar/límite |
|---|---|---|
| Paleta | CMS módulos+catálogo; CRM quick actions/módulos `C/src/app/(crm)/_ui/command-palette.tsx:113` | CMS mayor búsqueda entidades local; converger teclado/shell con proveedor autorizado. Quick action navega, no crea registro; vídeo CMS tampoco abre entidad |
| DataTable | P/ui/DataTable y C/components/ui/data-table comparten contrato/algoritmo, cards móviles en ambos | COMPARTIR núcleo/temas/adaptadores; no ausencia ni novedad móvil exclusiva CMS |
| Tone/Bits/utils | Vocabulario visual en ambos, mappings/clases diferentes | Paquete común con dominio aparte; leadStatusTone no enum universal |
| Tabs/formularios | CMS error→sección/dirty guard/wizard; CRM tabs/dialogs/formularios | Mecanismos concretos CMS más completos; conservar Zod/mutaciones/Radix CRM; superioridad visual global UNKNOWN |
| Evidencia editorial | CMS fuentes/derechos/hitos/video scopes; CRM proyecto/unidad/fase/foto | CMS más procedencia, CRM más precisión comercial. Portar evidencia, no presets/aproximaciones |
| Estados/avisos | Ambos tienen loading/error/empty/offline y primitives parciales | Contrato de estados común, pruebas por pantalla; demo no acredita completitud; Sonner único CRM |
| Geografía/i18n/media/origen | CMS Leaflet/runtime idioma/galería/origen; equivalentes completos CRM no localizados | Candidatos G06/I05/I06/M04; no autorización nueva durante milestone |

### 4.2 Lo existente en CRM que CMS puede seguir

| Capacidad | Evidencia CRM | Reuso/cautela |
|---|---|---|
| Autorización alcance | `src/domain/rbac.ts:73`, `:114`, `src/infrastructure/auth/actor.ts:29`, `src/infrastructure/rbac-filter.ts:1` | REFERENCIA mínimo privilegio, no copiar sesiones/roles sobre capacidad editorial CMS |
| Puertos/UoW/guardas | `src/application/compartido/unidad-de-trabajo.ts:1`, `almacenamiento.ts:25`, `src/infrastructure/arquitectura.test.ts:1`, `seguridad.test.ts:1` | Separación application/infrastructure frente SQL en handlers CMS; pruebas existentes no ejecutadas aquí |
| Captura idempotente | `src/application/leads/casos-de-uso.ts:299`, `src/infrastructure/db/repos/leads.ts:116` | Reusar patrón clave/cuerpo/recibo, no ampliar normalización RD a todos países sin ficha |
| Unidades/centavos/precio restringido | `src/infrastructure/db/schema.ts:475`, `src/app/(crm)/_ui/formato.ts:13` | CMS debe consumir proyección comercial; variants no son units |
| Outbox/recuperación | `src/infrastructure/integraciones/outbox/worker.ts:28`, `src/infrastructure/db/schema.ts:1166`, `:1181` | Política útil I06; legacy todavía no usa webhookInbox ni este worker; tabla ≠ integración durable |
| Foto/compensación/URLs firmadas | `src/application/proyectos/casos-de-uso.ts:310`, `src/application/compartido/almacenamiento.ts:25` | Adoptar patrón + derechos/alt/hash CMS; ubicación/visibilidad requieren contrato |
| Analítica comercial/gráficos | `src/application/reportes/consultas.ts:1`, `src/components/ui/chart-card.tsx:6`, `src/app/(crm)/_ui/analytics-state.ts:10` | Métricas web no reemplazan ventas/funnel/comisiones; distinguir desconocido de cero |
| Cotización dominio | `src/domain/confotur.ts:72`, `src/application/confotur/casos-de-uso.ts:7` | REFERENCIA motor puro; parámetros/eligibilidad/validez normativa UNKNOWN; no promesa ahorro/ROI |
| Invitaciones/primitives | `src/application/usuarios/casos-de-uso.ts:117`, `src/hooks/use-focus-trap.ts:10`, `src/components/ui/select.tsx:142` | CRM invitación y Radix/hook/Sonner ya existentes; no introducir contraseñas iniciales/doble provider CMS |

### 4.3 Registro de contradicciones y cobertura de conocimiento

| Fuente/afirmación | Evidencia actual | Tratamiento/dueño |
|---|---|---|
| Entrega rechazada: paleta CRM no existe | CommandPalette CRM real; rechazo explícito TAREA | Rectificación v2; hash anterior en Fuentes; no heredar creación duplicada |
| Entrega anterior: Drive privado/API implícita, cards novedad | Drive constantes/visores; DataTable CRM cards | Rectificación; Drive permisos/runtime UNKNOWN. D03 futuro contrato |
| R_RELEVO del 02/10 y arquitectura histórica: sin Tailwind, solo Contactos, Codex solo UI | Manifests/árbol/decisión44 y despacho actual | Histórico no vigente para esta tarea; no se cambia fuera alcance; D00 reconcilia |
| status del 03/10 F3/cifras QA/sync Obsidian | Spec Pack actual P0; sin ejecutar tests ni acceder vault | Declaración anterior, no evidencia sesión; D00 actualiza |
| Comparador/presets aparentan condiciones confirmadas | Fallbacks/presets citados §1/2 | No hechos/certificación/negocio; D02/D12/D05 revisan |
| ComponentGallery offline, Drive verificado | Demo/local sin mecanismo de sync/verificación | REFERENCIA/IGNORAR, nunca capacidad acreditada |
| Índices GitNexus vs bytes actuales | CRM commit distinto, CMS líneas desplazadas | Grafo navegación; bytes/hashes evidencia; reindex otro despacho |

Documentado en esta lectura: piezas/equivalentes/limitaciones, frontera editorial-comercial y captación. **UNKNOWN:** runtime/UI/QA, bases vivas, autoría/licencia propia, recencia catálogo Drive, configuración efectiva, migraciones aplicadas, autoridad fiscal/privacidad. Sin transcripciones ni DEC inventadas. Duplicados de contratos/modelos observados; filas/binarios no comprobados. Paquete mínimo receptor: esta entrega+TAREA/PERFIL, enlaces a constitución/ARQ-VRE-002; detalle bajo demanda.

## Fuentes

Fuentes internas observadas el 2026-10-04. Autor individual/aceptación del negocio UNKNOWN salvo atribución explícita del despacho/doctrina. SHA-256 acredita bytes, no veracidad/autor/despliegue/revisión. No mover originales privados ni duplicar conectores.

Original rechazado sustituido por mandato: cms-reutilizable.md de72líneas, SHA-256 `7e70b643243f78e2b1581830cb0cd3bb126739d10ba60df874710bd593c2de28`; rechazo TAREA actual, run 20261004T213724Z. No otra copia fuera de único archivo permitido.

<!-- MANIFIESTO-FUENTES -->

## Handoff

**D03 de otro proveedor:** revisar cobertura/citas/comparaciones antes de aceptar propuestas. Prioridades: ACK I06, envío no durable, propiedad/mapeo proyectos-unidades, claims inventados, Drive de referencia, fronteras de identidad. **D00:** promoción/contexto tras revisión; sin aprobar G0/C1/ADR ni cambiar índice de fichas. D22 y subagentes son productores del mismo proveedor, no revisión independiente.

**D19/D11/D12 en P4:** ficha I06 con consumidor UI/ACK/snapshot/retry/refs/consent/privacidad. **D05/D07:** tokens, teclado/foco, estados y 320/390/768/1440. Construcción espera ficha READY y despacho con archivos permitidos.

**Seguridad del cambio documental (§6 flujo):** no crea tabla/ruta/JSON operativo/variable/HTML usuario/exportador, por lo que esas casillas no aplican a esta edición. Futuro porte conserva RLS, requireScope/visibleRows, Zod/campos explícitos/env central/almacenamiento privado. Sin credenciales ni cadenas de conexión en entregable; sin leer .env ni volcar configuración/inspect. No apareció secreto real en salidas revisadas. Riesgos concretos/escenarios citados §3.2 y tablas; no declarados corregidos.

**Verificación:** citas/rutas/cobertura/manifiesto de fuentes al consolidar. Typecheck/lint/npm test/build/UI **no ejecutados**: tarea de análisis, sin código ni issue/flujo cerrado. Build/dev expresamente prohibidos aquí a Codex. QA de aplicación/reproducción corresponde al despacho autorizado independiente.

**Estado:** entregado para revisión, sin autoaprobación. Desconocidos y alcance/datos permanecen con sus dueños.
