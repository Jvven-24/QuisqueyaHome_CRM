# T-P0-CMS · Inventario reutilizable de Quisqueya Studio / Portal

El CRM ya tiene paleta, DataTable, Bits y tonos: hay que converger contratos, no repetirlos.
El CMS aporta edición con evidencia, galerías, taxonomías, i18n y atribución; algunas piezas son demos o contienen afirmaciones sin respaldo.
Los modelos de proyectos, tipologías, unidades e identidades son distintos: compartir tablas directamente no resuelve la integración.
I06 tiene emisor/receptor parciales, respuesta incompatible y recuperación durable no acreditada.
Esta entrega documenta código local y propone reutilización; D22 no aprueba recomendaciones, ADR ni puertas. Las aprobaciones previas se atribuyen a su fuente.

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
| `server/catalog-cache.mjs:6`, `:28`, `:45`, `:66`, `:89` | TTL/ETag, refresh único, generación de invalidación/último resultado válido y snapshot en arranque frío; crypto/fs/Node | No caché pública de catálogo localizada en C/src; RSC tiene otro ámbito | REFERENCIA para futura API pública; proyectar también el snapshot y nunca cache global por actor | Alto: snapshot sin allowlist, ámbitos/obsolescencia / M |
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
| `src/portal/store.jsx:5`, `:21`, `:27`, `:107`, `:126`, `:134`, `:142` | GET catálogo/cache navegador/retry/snapshot importado, favoritos/sync/undo, comparación máximo 3 y colecciones; React/fetch/storage | C1; favoritos/comparador/colecciones no localizados | REFERENCIA / L / alto: snapshot debe tener la misma proyección pública; cache/lifecycle y fallos de sincronización requieren contrato |
| `src/portal/store.jsx:150`, `:155`, `:158` | Helpers zona/URL/foto/rango monetario, filtros zona/tipo/moneda/precio/dormitorios/recencia y ordenación | C1/C10 | COMPARTIR funciones puras por contrato / M / alto: decimales CMS frente centavos CRM; locale y acceso al precio separados |
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
- Cache/reintento: `P/src/portal/store.jsx:11` sin control de edad; `:56` comparte AbortController con reintentos `:60`, abortado por timeout `:64`. Copiar a datos privados agravaría exposición/obsolescencia; recuperación tras abort requiere prueba.
- Snapshot añadido durante la lectura: `P/src/portal/store.jsx:5`, `:21` importa/usa catálogo estático; `P/server/catalog-cache.mjs:67`, `:69` serializa el snapshot sin llamar publicCatalogProjection. Inspección estructural de `P/src/data/catalog.json:1`: 28 proyectos, fuentes por proyecto, metadata database y estados de publicación distintos de published presentes; editorial=false no elimina esos campos. Escenario: arranque sin BD sirve ese JSON completo; frontend también lo importa. D03/D12 deben revisar proyección/recencia/filtrado antes del reuso. Contenido configurado/desplegado, sensibilidad de metadata y exposición real **UNKNOWN**; no se reprodujeron sus valores.
- Recencia: `P/src/portal/store.jsx:164` exige sources para el filtro, mientras `P/server/catalog.mjs:69` los excluye del DTO público. Con catálogo recibido de esa API, el filtro podría vaciar resultados; con snapshot puede comportarse distinto. D03 contrato público de recencia sin documentos privados; runtime UNKNOWN.
- Ingesta analítica: `P/server/analytics.mjs:66` limita tamaño pero no claves de props; `:129`, `:141` guardan origin arbitrario y `:207` propaga props al proveedor. Escenario: cliente manipulado envía datos personales/campos reservados pese al comentario de no guardar formularios. REFERENCIA del flujo, no copiarlo sin allowlist; no se enviaron peticiones ni datos reales.
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
| Zonas/taxonomías | Catálogos editoriales `P/server/catalog.mjs:161` | Catálogos/relaciones `C/src/application/catalogos/casos-de-uso.ts:1`, `C/src/infrastructure/db/schema.ts:1` | Solapamiento semántico; compartir códigos/traducciones realmente comunes y mapear IDs; no sustituir permisos/estados CRM por listas CMS |

**UNKNOWN:** localización/configuración viva BD, migraciones aplicadas, filas y sincronización. Se leyó código/SQL, no bases reales. Ambos llaman public.projects a esquemas incompatibles (UUID vs serial); compartir misma BD/esquema sin adaptación no es válido. `C/.viltrum/vre-os/ARQ-VRE-002-integraciones.md:65` fija fuente única por entidad y `:75` refs. Su cabecera `:3`, actualizada durante la lectura, declara **APROBADA por Wilber**, decisión #45, corroborada por `C/docs/contexto/decisiones.md:301`. La constitución exige puertos/fuente única/outbox/webhook verificado. Ese ADR no fija por sí solo la partición de campos CMS↔CRM propuesta aquí ni aprueba el contrato I06; tampoco acredita implementación o bases vivas.

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

La comparación acredita implementaciones funcionales paralelas y diferencias actuales. Orden histórico, autoría y cuál se escribió primero son **UNKNOWN** sin investigación de historia autorizada. “Mejor” se limita al mecanismo concreto observado, no a una evaluación visual o de producción.

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
| ARQ inicialmente PROPUESTA, ahora APROBADA | Cabecera actual `C/.viltrum/vre-os/ARQ-VRE-002-integraciones.md:3` y decisión #45 `C/docs/contexto/decisiones.md:301` | Reconocida la aprobación externa previa de Wilber; propuestas CMS/I06 de esta entrega siguen pendientes D03 |
| Fuentes mutaron durante inventario | 12 diferencias SHA-256 frente captura inicial; detalle en Fuentes | Reread/citas ajustadas para catálogo/store/ADR; db.mjs solo hash, configuración no consumida; ejecución y autor del cambio UNKNOWN |

Documentado en esta lectura: piezas/equivalentes/limitaciones, frontera editorial-comercial y captación. **UNKNOWN:** runtime/UI/QA, bases vivas, autoría/licencia propia, recencia catálogo Drive, configuración efectiva, migraciones aplicadas, autoridad fiscal/privacidad. Sin transcripciones ni DEC inventadas. Duplicados de contratos/modelos observados; filas/binarios no comprobados. Paquete mínimo receptor: esta entrega+TAREA/PERFIL, enlaces a constitución/ARQ-VRE-002; detalle bajo demanda.

## Fuentes

Fuentes internas observadas el 2026-10-04. Autor individual/aceptación del negocio UNKNOWN salvo atribución explícita del despacho/doctrina. SHA-256 acredita bytes, no veracidad/autor/despliegue/revisión. No mover originales privados ni duplicar conectores.

Original rechazado sustituido por mandato: cms-reutilizable.md de72líneas, SHA-256 `7e70b643243f78e2b1581830cb0cd3bb126739d10ba60df874710bd593c2de28`; rechazo TAREA actual, run 20261004T213724Z. No otra copia fuera de único archivo permitido.

### Procedencia, recencia y comprobación

Productor D22 / Codex. Inventarios mecánicos apoyados por `/root/inventario_studio` y `/root/inventario_portal`, ambos tras leer el mismo PERFIL completo; D22 consolidó y contrastó las comparaciones. Son productores del mismo proveedor. D03 todavía no ha revisado esta entrega.

Lectura local: `rg --files`, `rg -n` con búsquedas positivas/negativas, `Get-Content -LiteralPath` con numeración y navegación GitNexus indicada en §1.1. Huellas y controles documentales: Python por stdin (`pathlib`/`hashlib.sha256`/`json`/`re`), sin guardar scripts ni consultar configuración secreta. No se ejecutaron tests de aplicación ni llamadas a APIs reales.

Captura inicial de **580 huellas**: `2026-10-04T22:13:31.151924+00:00`. Cotejo posterior de **579 archivos**, excluyendo el entregable: 12 diferencias en ese momento; 567 sin diferencia. Consolidación de **253 fuentes citadas**: `2026-10-04T22:51:18.616966+00:00`; aparecieron además cambios en motion.css, notifications.css y arquitectura.test.ts, y volvió a cambiar package.json CRM. En conjunto se observaron **15 rutas distintas que mutaron**. Esto acredita un workspace cambiante, no una revisión atómica ni una relación con remoto. Los hashes finales son los de la captura indicada; futuros cambios pueden invalidar citas.

Se ajustaron las citas de store/catalog/cache y se releyeron el ADR/constitución y CSS afectados. Los cambios de manifests se comprobaron por estructura/dependencias/nombres de scripts; `server/db.mjs` solo por huella, sin leer configuración. Pruebas/implementación nuevas concurrentes no se acreditan en ejecución. La aprobación ARQ se atribuye a las fuentes actuales, y las propuestas de este informe siguen pendientes.

| Fuente que cambió | SHA-256 inicial | SHA-256 al último cotejo |
|---|---|---|
| P/`package.json` | `49f08d3a068172a3cf27e3ec55f3e4e47392772e80e67de24a141645b9bd06cd` | `442de6059152798e20eab91f30c6ab5c134e3cd59e226f3cda0379d3e3f44825` |
| P/`server/analytics.mjs` | `17a2f3889713366ff0bc1c3c91198486a408b6f353a32f0213f6cd33113d9f3f` | `0725eea3079301f1c02b409a2bd86109a61f4e8bd0a0ec2c131a3e3f112f70bd` |
| P/`server/catalog-cache.mjs` | `f19dad48609bda52e50388c2edb1fb70b7af5c5791b9c02ae8ac88790f4e9892` | `0042f804d49530d4fb1c99378a4713990fb45e245240963e77aba2425f4c9979` |
| P/`server/catalog.mjs` | `90e40ebebfabf13b7fcb047064132c8fb8c2880b23174577d7a7f50a11190362` | `d5bf5958fe21428a6a1589645436e93b69fb18b815953c9cb029157fcb56a8e3` |
| P/`server/db.mjs` | `89c9bfb0f5ce34f8322174bb9e2f3247e4fb2cf7ed2eed50b697329a3bd4e72a` | `543477e677f053a9c6a2aa173b2bf973b525e2114ce247606ae4823335143801` |
| P/`server/server.mjs` | `d9e2711188b8b391dcc6c553f3a198aa800cac3cb99860ac31e59f2fa36880bf` | `396f888d99fdbfc240fb7545ecc78f87f165f103f97ec2d9a1a0468f19a22446` |
| P/`src/portal/media.js` | `71f79762f3a0b9b8b3f1646a03f74fe107a384186aaef5f0c329243ef99fd6b5` | `391186f06d1d05e4649b791b011087ae5fde4cd6de94d961691282d5ab4f4f62` |
| P/`src/portal/motion/motion.css` | `bec8159c667a061dbea6eb805448622c15481b3572f78bbd486ae64b3687be64` | `b7988c85e12acf5bbb800d444c753615998629c48de28669facc19dac375bc1a` |
| P/`src/portal/notifications.css` | `7412cf4779c82c4a704a088907674e694b17071c111c9f780a79c97aa0aee8ce` | `9e9676f2576cdc0360d0e4c1d118147096dabdecd0c91e7da023ef18a1bde998` |
| P/`src/portal/store.jsx` | `741717d1176e8fdd732152291e861f5e49c24bf693b4bd62bf2b4f979bfc7da9` | `687166849a84684cf972a4d71b5474d83dc1ac32ada9a640ac5380e13c5c7d75` |
| P/`src/studio/Studio.jsx` | `0a61e0737b230f3121bc792b8aa0d7a16535af9f6cb2b5618d2c47d4856de6e5` | `8ae984e55996b8222fab331288f66ba3ff64c8a55738895117281e0936236c4d` |
| C/`.specify/memory/constitution.md` | `b5769a56790d1249131903c4bc95547c81707182e9e9f67ab5e48ef4c4273621` | `88b02a3168435acb0c4b2a3cae324eba586133d8fe61a4e0cba70a832fd69a82` |
| C/`.viltrum/vre-os/ARQ-VRE-002-integraciones.md` | `e01b44b2c7f44b47362424366a1b8d0d3e3058d1ec6bfd5539b3ba75cbf21cc5` | `eff3fa91ba433127f071eec41998f587695db4f7f5a0f489034f349fed962b18` |
| C/`package.json` | `b1719d65e75cea2dfc830c2039810bce1d7c1ad2738236c1b3675f5a56f3edf4` | `3d5a481a4bf2830be3208bed8903c2791c0f2a2f1d4d46cccb036cc5ce60501c` |
| C/`src/infrastructure/arquitectura.test.ts` | `807c3af1730f6f0bdbd74fb4bea42e38d7192a6510c1189286db979e5db84002` | `b4d0c30b76f718fe8836e00638f1c55ad5ac109cd8ab11b2e26f2e058cb0b91d` |

**Controles del inventario:** 123/123 archivos primarios representados antes de Fuentes; 326 citas explícitas distintas con ruta existente y línea dentro del archivo; cero rutas faltantes, líneas fuera de rango o marcadores de inventario pendientes. Las referencias abreviadas C1–C12/`:n` remiten a la tabla/fila correspondiente y no aumentan ese contador. No se detectaron caracteres de reemplazo, errores de codificación buscados ni patrones de credencial en el documento. Estas comprobaciones validan cobertura y localización; no equivalen a revisión semántica independiente, pruebas o certificación de ausencia universal de secretos.

### Manifiesto SHA-256 de fuentes citadas

Las rutas P/C se resuelven con los prefijos del inicio. “Líneas” cuenta líneas del archivo completo, no líneas ejecutadas ni una declaración de lectura exhaustiva de cada backend. CSS se inspeccionó estáticamente; el snapshot JSON solo por estructura y booleanos, sin reproducir datos. Manifests/locks/SQL/contexto son evidencia de declaración/modelo. Autoría individual, licencias propias, bases aplicadas y despliegue siguen UNKNOWN. El archivo de entrega queda fuera de su propio manifiesto para evitar una huella circular.

<details>
<summary>CMS: inventario y dependencias (160 archivos)</summary>

| Archivo | Líneas | SHA-256 |
|---|---|---|
| `package-lock.json` | 4009 | `eb528a34d220354466a486a5a170a365ac9285da12354d51c8a00b3cd4d44621` |
| `package.json` | 73 | `442de6059152798e20eab91f30c6ab5c134e3cd59e226f3cda0379d3e3f44825` |
| `public/manifest.webmanifest` | 1 | `057a4b54dcb6ff7ec581ce8c0dbba8ea74137c1b5fb7ef61905d9e97e52e47a5` |
| `public/sw.js` | 5 | `a98d59ff18430ed89ce12d3b39fc1706b9f1f51f39c4ebd7a5e73d989f8fd54e` |
| `server/amenities.mjs` | 105 | `011cb360b72e99f5b30f04e1889578eb7d2e59619f4a5941f2f8476813aa6ad1` |
| `server/analytics.mjs` | 371 | `0725eea3079301f1c02b409a2bd86109a61f4e8bd0a0ec2c131a3e3f112f70bd` |
| `server/assistant-guardrails.mjs` | 73 | `ae12261b873a81f9c75d447e462201ef2e827c71a00de1c77eeec129ee16596d` |
| `server/assistant.mjs` | 287 | `f694a9a09dca0ffd718694dc6a44b9e7aeddfdf6bd5899e5ae2ae57986f3820b` |
| `server/auth.mjs` | 47 | `441034b45f30dd5492b4203b219813adc6924fc5cc8b074b40b63e4f5c0d43f4` |
| `server/catalog-cache.mjs` | 122 | `0042f804d49530d4fb1c99378a4713990fb45e245240963e77aba2425f4c9979` |
| `server/catalog.mjs` | 225 | `d5bf5958fe21428a6a1589645436e93b69fb18b815953c9cb029157fcb56a8e3` |
| `server/client-api.mjs` | 293 | `e3cab96f464f0b1e7bccbe8df762f6c25ee290137c60417f95b8b65194ca9ba4` |
| `server/client-auth.mjs` | 440 | `eab019324ad971884d57688e28b5213cc49f417eedcc97e9f6335abbf6584626` |
| `server/editorial.mjs` | 725 | `fa7fe3b133fc96bf4d522c4beb515cd83b4c6383e56ac93aee0c5bec2b1757b1` |
| `server/project-tools.mjs` | 128 | `be42c2b0b56df15d846df2843dd96b26db5f9472a70a0fc6e33a5c370dc971c3` |
| `server/roles.mjs` | 26 | `3020f320c69fe8859ff3ea6fc223828c77029a847cdcc71ac705cf70fc036473` |
| `server/saved.mjs` | 46 | `c94b9ca065259d8f428a8238dee07180f0bc72a00882ccdc6690a1165d7d6d59` |
| `server/seo.mjs` | 51 | `4b53d410bd13bed13359acaf7d60652481f3979a839f454b0062a0a16c117aff` |
| `server/server.mjs` | 297 | `396f888d99fdbfc240fb7545ecc78f87f165f103f97ec2d9a1a0468f19a22446` |
| `server/static.mjs` | 68 | `e45f2b350278989420a3cf0d392b68641b961f55d65446b8655fe705c5036695` |
| `server/translator.mjs` | 116 | `6e3a06010c8d0018d1bf1315039b3ed26ae168b43e9a450b6579f9c7911bd070` |
| `server/video-import.mjs` | 21 | `03b64049b2bec5c9e73e6a3ae1564bf262c8c460d9d084e675efb02730fe9a61` |
| `server/video-links.mjs` | 32 | `fef6e54f630759830807cdfed508f22c004902a584c346cbabcef61af05c2ccd` |
| `server/zone-cover.mjs` | 23 | `fc7cbef5dae62bd618af26f6260e3c4e4952eb50b5e3f5ed3186849d57e3b2a2` |
| `shared/advisor-content.mjs` | 139 | `5bfb1489c2232d1797e8abc8bbf0c1c548954ed6b9bd0e38f1394dfd2711ade3` |
| `shared/amenities.mjs` | 5 | `280fbd1d7d2a2d238219d25cb83d620f75dc2d99b5fa47b79812af429cd6e7f1` |
| `shared/contact.mjs` | 36 | `04046042986654faf0a3d4db2a181a305aab80fd6caf4825f73875f7db68e4ac` |
| `shared/project-facts.mjs` | 12 | `da93505ab1f402d4de773cfb24784515ead2b62fe9990e5d3a0b32f67b206492` |
| `shared/public-commercial.mjs` | 32 | `118f8001af50288f4accd8ddbf1618c0ddb50b877e2150df1663a309f535d25e` |
| `shared/public-errors.mjs` | 29 | `ac4f0e4ae94ddf093dd9a9c321c541c53c11e0c654a092471b7d34d4083cea8d` |
| `shared/request-limits.mjs` | 91 | `8ac41deeaac34a4ff28ff3fbedfe7df5e60ee52321e896f4f7b5b9b9b76efc34` |
| `shared/validation.mjs` | 64 | `568ab28534b9acad3408850e53b88f584c9f9b5cdbd7bc89c5bfa67bbb887ec5` |
| `src/components/ui/ai-citation.tsx` | 5 | `5422083c489f6584b3fbfbe27b7077e636033427f7c53b068806fcb160f99ba6` |
| `src/components/ui/arrow-fill-button.tsx` | 7 | `4d2d6e897c760b7651f5bc3569fd7768315efa6b4a957ddd9db0418548346ecf` |
| `src/components/ui/assistant-rich-text.tsx` | 58 | `1236377afddd6c19ab3725f48340ac6e0019d7e6cdb3d0361d67a0c82b0b7d16` |
| `src/components/ui/model-selector.tsx` | 5 | `f79ebd84af0d744fbf1e54d0d56d6f9e1f510a4cfa05106a576699f1236635ba` |
| `src/components/ui/quisqueya-ai-mark.tsx` | 19 | `96d95c60eb88803ec1baa694d007bcc1bdabef88716d22be9bb140bc8c66da29` |
| `src/components/ui/select.tsx` | 9 | `c7ac1f939bd8926581486e21d13ca9cf041e51becdf1c459f01843072000273c` |
| `src/components/ui/text-rotate.tsx` | 40 | `c85689e17a1bd967a5dcd29cec3063b19b498c8f5d19b5162d9985c3e9f99a33` |
| `src/components/ui/tool-calls-section.tsx` | 6 | `a9969f11f0bf58b37095752eee1e7a93de822acf8055c32dbb4839791e7512a7` |
| `src/data/catalog.json` | 13758 | `ccd3c6d450c89b45a1f5f1e7d0771e724135d696244380b4bfdf512d3f4e3b8e` |
| `src/data/media-widths.json` | 1 | `4efb44969706c59a2a5dcffc417ac874d7087240cfd120e3ef4e953450b74b87` |
| `src/i18n/de.json` | 516 | `203357f2315802f8a9ef16dbdbcda6fc639c12f5b7bcb2a17e390eba593e467a` |
| `src/i18n/en.json` | 517 | `f8a396c88aa08af825429f67594d518ade7dde26b7f7c8509eac63fea6637957` |
| `src/i18n/es.json` | 517 | `8c1a84b7cb18727a22f31fec445647b7cfec92fef822507929c309e61d480f38` |
| `src/i18n/fr.json` | 516 | `da6e227294a1baf95476b992a67b20c83218d33f23907404b62831cd7105f4ba` |
| `src/i18n/ht.json` | 516 | `c129689bca1c98b4d8cf74becf365b25d8052a38ba6081e2dc0f7d780ea4957b` |
| `src/i18n/index.jsx` | 92 | `bcfb792001e8a1e81b54746fd8e95292e9d5db0f1ffe08039aaf4cad94bf9718` |
| `src/i18n/it.json` | 516 | `b1b82f1ce0b26fec2dab7992095a0742a6a6849822ddb8f864fe2ea0708fddaa` |
| `src/i18n/LanguagePicker.jsx` | 64 | `e6d8df7759bad61eeb53a889c22869f7828fca70199fe3c1ce1c0974e0bc89b5` |
| `src/i18n/Link.tsx` | 44 | `f5ef7ea25c820e7913fa45820f44914eb0d83c540049da62f588a7deb2dc602f` |
| `src/i18n/locales.js` | 73 | `c6bbd29cc176ac39a658de5cf3ac753d5be9cd439be9950fb555029e8d918815` |
| `src/i18n/protected-terms.js` | 81 | `11dccb31795441fee46affa2d03fb9417c1a94562822c22b36f3f6841c8572e6` |
| `src/i18n/pt.json` | 516 | `e1608d8728af8b5d608cdfd2a7baa798e66ad1ea6d991fa31c4fce277dec7d09` |
| `src/i18n/ru.json` | 516 | `d4a026431d94832dc73db461dd5428ce600a4f01382f98e07c305da835a9b3d4` |
| `src/lib/utils.ts` | 3 | `0c97f5ec0478867d5369a4369f811e1b779c7f2548f671ef252f1503a6392d9d` |
| `src/main.jsx` | 109 | `5adddce32578ea1f8d5d207b9550240cb6df1fd805641c86f06e2ae044863440` |
| `src/portal/advances.css` | 237 | `dada272c9007381a0f9af119ebd218a307fdce37a442a0b688096ec4672f8630` |
| `src/portal/Advances.jsx` | 232 | `bad766c77d3eb8530ad0705fa6bbd57b96f1aa19ca46b613ff5ab38e8439932f` |
| `src/portal/amenity-details.css` | 7 | `39507e5a47285c372e73868b796b5ed8527e5963aca0bf9f67d2f895502e43d5` |
| `src/portal/AmenityDetails.jsx` | 15 | `e30098809aec92698eb7dfb1f5822a3b8cb4aae85fbe3b89b28e9da3e53e54e7` |
| `src/portal/analytics.js` | 241 | `7f0710719cb27773bbfc02fc1ac61791bbd71a08a84b9c323603fd0aca234d7c` |
| `src/portal/AnimatedViewSwitch.jsx` | 12 | `1afee6ecdeeaaceb3b50e63abba7dff7ccf5c2b48d551d2ad9d03117977a3902` |
| `src/portal/Appointment.jsx` | 40 | `54b0f5d8aaf2a5f53d0e1f7db8797beda1732e3eb3586139bb1455086c2c1924` |
| `src/portal/AppStatus.jsx` | 24 | `8500a8186e699614324547052ee7fd59e41d623c54f3a6515d61c86e4ceabf8f` |
| `src/portal/assistant/Assistant.jsx` | 289 | `f0a98182bc8b75272b620e2dec59dfa6f06a279ea9e1b77138b06ffe4afbff4a` |
| `src/portal/assistant/engine.js` | 96 | `b74569d33a2f7b049f27302f0c04a04e1f5ffad84c79bdb2cd38b5b7f88376e6` |
| `src/portal/attribution.js` | 124 | `0ecd38a056961c3e0bb9c78f7c938c7ff099429e6cbb653cc425b4b3eb0eade7` |
| `src/portal/auth/client-auth.css` | 388 | `5899d94f8ee4fccf9b6babb39e3ee298a85f5709b5df9f89f8fb9ad69ad3b08c` |
| `src/portal/auth/ClientAuthModal.jsx` | 326 | `a968a3e07ce442163e34bfa8710b50dda2e40b27305f030362626ef32a98d50b` |
| `src/portal/catalog.jsx` | 42 | `a0e74704bbfc65de481b582801428879e23947a3ed9442dc28e5c467ca1be59c` |
| `src/portal/client-store.jsx` | 327 | `82c2faba0cd7d98255f810aea2959ef1aaa6cf74751ef0470d0269fe4deb379b` |
| `src/portal/compare.css` | 760 | `d4c908635113d7c601147b41f85bb536616506691358d766554f07fa76c7d226` |
| `src/portal/CompareDock.jsx` | 108 | `7105315e2fa082b0e7cec9eaacc64e5401b84a3f5124dec7172b68b8120caabc` |
| `src/portal/ComparePage.jsx` | 758 | `369fc4277e7cde6d8334b5c813e4bb8e1adbf580e42c886d698f46a02e4db62d` |
| `src/portal/ConsentNotice.jsx` | 71 | `31f8246047b861e62950002e806a47bfe97fe7e083ab8900a57adffbcd08138f` |
| `src/portal/detail.jsx` | 123 | `18737d578a42a53e274cc3b8a1f3ae60c736785c23886f724af0812d3a1b22c4` |
| `src/portal/DetailSections.jsx` | 71 | `7c02721b3aa175d6292a0f09f03af2cdf47239bff6c2f3244290c32df7b5cfea` |
| `src/portal/discovery.css` | 41 | `583f7a3b6c8514dc4e232d487d6c80a04c471fb224ff0fd5348c6dc18551369d` |
| `src/portal/Discovery.jsx` | 73 | `9500699213b4e31ad4d035e29df1bb23456585a8a1971a461ccea583d2c9abc7` |
| `src/portal/effects.jsx` | 42 | `8745d9f9730634f3df8525e252b293cd4891469655ba4180132017a2fa502a3b` |
| `src/portal/hero/hero.css` | 60 | `6b038a6d3ec37852d8d62e94d460eab97c401a7970357af996bd6035257164f6` |
| `src/portal/hero/Hero.tsx` | 72 | `79cb2ccf31c6cd3d122d58cb47346fd7b9370b80bb39de97235c21d67b341d5f` |
| `src/portal/hero/pointer.ts` | 77 | `fe8fc7d4a9b39994a72f6609fc4bfece887e7c87ef48fdd9f3e08f9abe8c88e1` |
| `src/portal/hero/RotatingWord.tsx` | 49 | `2e28a6eacd21656cc95fbaa3bb4dff45a0d45878b8a4cf1c7ef1ea41b953a3f1` |
| `src/portal/HomeSearch.jsx` | 38 | `f2818b299b5e5b545c3d5d06491a25b84b0b58b5eb96178354a2a3b707720c8d` |
| `src/portal/install.js` | 59 | `1eadada907414f2a03b9d9b7d2efbfe11f935bf2377a280a3c6c7cf448244789` |
| `src/portal/map.jsx` | 409 | `ca7dec3112685038cc5242d20c18808328f003902ba82808cad2d474b3ba3311` |
| `src/portal/media.js` | 72 | `391186f06d1d05e4649b791b011087ae5fde4cd6de94d961691282d5ab4f4f62` |
| `src/portal/motion/auto-reveal.js` | 63 | `82856540b4dc12ef14d635b21608b7a4784c9cff6f324fe89fa253b27a5af144` |
| `src/portal/motion/motion.css` | 247 | `b7988c85e12acf5bbb800d444c753615998629c48de28669facc19dac375bc1a` |
| `src/portal/motion/pointer.tsx` | 143 | `22bb13f3f85f26ac64921cbd81dac4537e474867b079a0162158a0b68d0fbb30` |
| `src/portal/motion/scroll.tsx` | 329 | `c19f83562be025be03a6d39b2d36d64237d0009a52fc9b1124efc39024531473` |
| `src/portal/notifications.css` | 77 | `9e9676f2576cdc0360d0e4c1d118147096dabdecd0c91e7da023ef18a1bde998` |
| `src/portal/Onboarding.jsx` | 99 | `54c27092b753682a391ba6bcad0f242f2d14f348d00cce29a629fcef81e8f0ca` |
| `src/portal/Portal.jsx` | 135 | `d09766fe327a6a563d8000b84a9129292e24eacf8b417549ee5cfd3e32296d07` |
| `src/portal/primitives.jsx` | 107 | `3f2c9e954c5234b21aff91076d3cbdc0dcc2c40b9496b034cdf49c4f17a830e4` |
| `src/portal/profile/client-profile.css` | 583 | `0815d43c9b552192ea2eb988a70dfd0f6fe56a304056a9c1e64e0e5aa26b1a07` |
| `src/portal/profile/ClientProfile.jsx` | 699 | `fe331ef29fc5663d209e7e7ee21639b2bdebb52fdf7bce6514282a70414f4794` |
| `src/portal/SavedDrawer.jsx` | 28 | `c5d6faecec5cbaa558c480b5ca18f9ce2f128891b01dd6006a40e66e6588c020` |
| `src/portal/Splash.jsx` | 60 | `7141463ffc22d1cfcf2e71f0c0112cccd5c2727dd8ea0e61432aa116d072dc25` |
| `src/portal/store.jsx` | 178 | `687166849a84684cf972a4d71b5474d83dc1ac32ada9a640ac5380e13c5c7d75` |
| `src/portal/support.jsx` | 97 | `2a8dece557d453514e6df21d19c2563348655e042cbc0b80b796314a20a90ac9` |
| `src/portal/theme.js` | 37 | `d819b0f75fdb5b98354eab1b4f0e94fa3579d1e374126273a752ac6d671d63ed` |
| `src/portal/Toast.jsx` | 81 | `3a9128eba928f8a41c40b189d9b6c0689e6c731a8b9edd2d496af78fde3d8b3a` |
| `src/portal/video-discovery.js` | 39 | `0942125134b5920901b9d5f276236be7c4b96f16259d805c2540fe873c5ad890` |
| `src/portal/Videos.jsx` | 227 | `830cd34f4af7aab5d2f576e3fb2df669bcba0c2321ca41cd65279315f5f1cee6` |
| `src/portal/zone-places.css` | 7 | `04df9cd2e88f9b2ad20120f75ca60b57dacd3c09700af171f6a57c9389dfdb69` |
| `src/portal/ZonePlaces.jsx` | 49 | `86ebc469a53ce51513c8bc6e28eee8bf8007dccc8ef75146e975f1dbf87eb5e4` |
| `src/studio/Accounts.tsx` | 891 | `8c8ef0918ba54d4c20859002275333aeb9a6a2e680273644259cc10fc3e352ba` |
| `src/studio/amenity-editor.css` | 17 | `37f78be233d09e1cbf9d9448c7ca60042a38491785c0680b3b4879e2705fdd1e` |
| `src/studio/AmenityEditor.jsx` | 124 | `3033e05c36a7f0930e606288517852fa2e5fc6d44021ef24bfd656607de1a257` |
| `src/studio/Analytics.tsx` | 680 | `741d01386161c0ca03ca15c85e29ae783674154417a5cf31cf4f1c26f9577ecc` |
| `src/studio/Audit.tsx` | 470 | `5112696c799959a92a533fe1b6db451b07519a4128a9aaad221f24f3052c2c12` |
| `src/studio/CommandPalette.tsx` | 413 | `8b2a87f23273536a14e886e6f2c38bab7df1787c7e71af1cc94dcabcd079ac5c` |
| `src/studio/ComponentGallery.jsx` | 325 | `6f40b751d30ceb05ac07c8d89d27584b152583f84bc8d99ff544abae9d653181` |
| `src/studio/ContentSections.jsx` | 175 | `b56d49b3855401f50fb2705b1303f24d1b4a34d9dd9ae2c9ea8716f37dbb4d90` |
| `src/studio/DeliveryMilestones.jsx` | 75 | `1b1ff91a6670183dd66469af000dd900e6d826787c4cc0b58f7d7c59d51a027d` |
| `src/studio/drive-explorer.css` | 622 | `adb9f87ec6c41e05d5c3095256b6ae6361c59b96ff0c27962686174e2c3ba617` |
| `src/studio/editorial-media.mjs` | 21 | `3bc3dff8c2f0483cef55e9235e84d4deb67540aef7b626747df30202debd69d9` |
| `src/studio/editorial-modules.css` | 333 | `facfa5bb85fcb3810bbc8a2d6918bf86bacce81777abe583a5c19f55f38941b3` |
| `src/studio/EditorialModules.jsx` | 1411 | `7567a2d03287b3008d07302d05de6bcca9ed6db213721b3a69a9a935803ecdf8` |
| `src/studio/GoogleDriveExplorer.jsx` | 774 | `a118481316b0ac63e64b8a90485baf07fde095d4c3db07b9a1f7057457c5dba4` |
| `src/studio/Library21st.tsx` | 1175 | `11e866219f713a1d3b145d648be8c43e1ef1174b8b6c4af1005d25cc6b2ce26f` |
| `src/studio/OriginLinks.jsx` | 550 | `629483192283163aaa3fd146080bcb4f7c93b6fd1f55dd5d23c7b3eac5d60bae` |
| `src/studio/Overview.tsx` | 530 | `c6b6be0dadbd868d90721b9d5d04d96b3f95a6b1605ed587cd5041d57e13d48f` |
| `src/studio/PagesShowcase.jsx` | 460 | `d72ae2675d3757773cd87efc1f72b7a1385f667e730b7183b999711950c3cb39` |
| `src/studio/PhasesManagerModal.jsx` | 545 | `a430c2bb82dd3b0f394dfc8cd2c310c2f3a537268eac57dce91a26f5f604ac42` |
| `src/studio/PoiCategoriesModal.jsx` | 548 | `3e855c6aa913ca0635a6d895ab2cdb6384f573cdd98b7edf3b0e0d823c201e3f` |
| `src/studio/project-journey.css` | 70 | `de5ed3e41ddd8d80f3a456bbe97f4439ae850139bb68a0aa2fcb0cb20e1a9037` |
| `src/studio/ProjectAdvanced.jsx` | 25 | `e8b9128a42960dba3c5dd33a55685442342f377e6410287f59dc91e4ba161df7` |
| `src/studio/ProjectJourney.jsx` | 84 | `a0c59d014c6c7477bc0e593de25b4a0f53c3dd103473b56101a57c0f7b3b021d` |
| `src/studio/ProjectLocationMap.jsx` | 28 | `883ba8b15a39619f7a9f8d7f6067865309bd31281b7945e530148bd1cf1871d1` |
| `src/studio/Projects.tsx` | 651 | `d97576f645a9f68bfb32729bd5d6e43e7d1b786c5e5f6c4c828feeea3bda0ac3` |
| `src/studio/PropertyTypesModal.jsx` | 520 | `6b2eaa56d1432edf181bef566482efe3145dc2fd1a23345bcdb3983f6e427eb8` |
| `src/studio/SettingsShowcase.jsx` | 546 | `421adc73746eb27b5b39b513ce68b3e32362923c0667edd4fd561a5ede3743f0` |
| `src/studio/SourceEditor.jsx` | 6 | `ddc6bdf98653b1cc300e2c6475256308a3690029411fa22b19ee81a974f749db` |
| `src/studio/Sources.tsx` | 6 | `795c757685eb9198a19fd9fb60af723a3b1d55ee38eb96847cd607240309aeb4` |
| `src/studio/studio.css` | 1083 | `bd94aec218f50648a9d0152783ada96f76a4a0e0a52a191872221b29ca13eee3` |
| `src/studio/Studio.jsx` | 749 | `8ae984e55996b8222fab331288f66ba3ff64c8a55738895117281e0936236c4d` |
| `src/studio/ui/Bits.tsx` | 80 | `dcfeb7d3061bbf17a3e4ae3ba63ed9681b7a62e657e6dbcc407c5b0685edae78` |
| `src/studio/ui/DataTable.tsx` | 356 | `aaeaf3776d5e6bd7084dc6eeac60e00d7217f862a78289dcf1575bd8f3ce353b` |
| `src/studio/ui/Disclosure.tsx` | 128 | `36434a1c9b9a9833b8cdb97281e65577210ca5f01aca20f30a862b5ec387cfc6` |
| `src/studio/ui/editor-tabs-logic.mjs` | 2 | `e64560422bf37eb59306fa383735d2ab5eb0dc796347925990a878a546850321` |
| `src/studio/ui/editor-tabs.css` | 1 | `68ecde73c37c3dd6c81597dec28b4dbdb0eed0c38773357112b0697326d0a0b8` |
| `src/studio/ui/EditorTabs.d.ts` | 14 | `60dcd82d7d66ab6952f17193522965d5793f39df5c20b9cba171703793039c91` |
| `src/studio/ui/EditorTabs.jsx` | 12 | `4de33619130e4d620685b9eb4f20a969bbd18ddefb62207da15b731dfc854ddc` |
| `src/studio/ui/Field.tsx` | 113 | `649ec0171edef5708d62ecc523901bd62724d8ed601d02c2ebf01c9932e48b8b` |
| `src/studio/ui/Filtros.tsx` | 98 | `ee2d843c3aa599a30520de247ebcdc3dde6982de6dfac3f50cc6bd01f4ea83e1` |
| `src/studio/ui/Notifications.tsx` | 135 | `8344c463c27637f40e91d759d72ee8d896b9eef1f01d014cf4eb9606aa8b70cc` |
| `src/studio/ui/tone.ts` | 36 | `2f28a41971509fc3d2cba49120a16baad2b8570486e91faf108069832f5949f8` |
| `src/studio/ui/useForm.ts` | 105 | `c2c31473d25ac13a7d6ff51f588073ff8736d37d8fc1c3dede61039b0bc350e4` |
| `src/studio/UnsavedChangesDialog.jsx` | 8 | `88ee7ed1583ad635af881303c323c160f9a151725c30d147219e14371ece1c14` |
| `src/studio/UpdatesTimeline.jsx` | 801 | `ddcfe9bbdc9984cfa5d6a8408ea6e8ceebdb948ae5198ed6fb5ac5276582ae7c` |
| `src/studio/VideoBatch.jsx` | 26 | `8f5feb3f86160891ae698da16daca044c7a85e55ee1fbc8b5b295aa4bfa56325` |
| `src/studio/VideoCategoriesModal.jsx` | 468 | `897f12c8befbd21b21d8e2dfa497fbbc1a8d02ff9232b4e4aa242a63c3b9277d` |
| `src/studio/VideoRelations.jsx` | 50 | `1be960c7a9cee5fddf2d90b9d6762abfe1d1fda590fbdbadc4e32f5e3df0d623` |
| `src/studio/Videos.tsx` | 817 | `d353ffae744f52d434a9cedad6c6eb7e10f2eeee171d4faf1e9adf2d593e2898` |
| `src/studio/ZonesShowcase.jsx` | 523 | `b3d94517e06fc0e8a45f3678cefbf4c620dba13ce81a7a75cf5c801e0b30f39e` |
| `supabase/migrations/20260905_quisqueya_catalog.sql` | 541 | `b60e8294d95fc45aaf1a16dde010528fca7b35ff676223538037871b980b246e` |

</details>

<details>
<summary>CRM: equivalentes y contexto (92 archivos)</summary>

| Archivo | Líneas | SHA-256 |
|---|---|---|
| `.specify/memory/constitution.md` | 44 | `88b02a3168435acb0c4b2a3cae324eba586133d8fe61a4e0cba70a832fd69a82` |
| `.viltrum/dispatch/20261004T220533Z-D22-codex/PERFIL.md` | 642 | `a1bed0d4af3e745c5271b9dc48da63309aa4ee28aa40e0ec62b3f9711efc91d3` |
| `.viltrum/dispatch/20261004T220533Z-D22-codex/TAREA.md` | 29 | `96acc06a146eb2f122eaea773224b1ef8833a4f507071c6de1cad79ba2f54fd4` |
| `.viltrum/os/CLAUDE.md` | 153 | `7e9dc4cec88dbada13d759faadf213ff8f5ebbeb3e4ff96970c02159e299c62d` |
| `.viltrum/os/core/orchestration.md` | 157 | `af0b2c06310dadd35aaa53fcb1d42acbf7690b6f3bcc3ffbb521cbdea1efb335` |
| `.viltrum/os/core/routing.md` | 165 | `7cc3091b2021cabc22b56bb0bbfbaec6bec74bdab156270091e5f8beb51f5e0a` |
| `.viltrum/project.md` | 17 | `3b20a8911ad6d82c0d1ad0d377767b3e8254e2a0db6ac90436c07061c3cac889` |
| `.viltrum/status.md` | 20 | `13c9df42a0e9fdeb41e2a3424d79b7474996ecd586178551dc42c51a76046b27` |
| `.viltrum/vre-os/ARQ-VRE-002-integraciones.md` | 134 | `eff3fa91ba433127f071eec41998f587695db4f7f5a0f489034f349fed962b18` |
| `.viltrum/vre-os/FLUJO-PASADAS.md` | 71 | `3480a74bb021dfcaa86d7916f5e22fb5b15b3b9ff545ff224eda22dd5b4db8b5` |
| `.viltrum/vre-os/spec/00-indice.md` | 25 | `0b6ed864fbaba3ec16440d68444864f51223562e01e4ff840453af71b757023c` |
| `docs/contexto/arquitectura.md` | 166 | `b92f015186844b003c246085a211cf80fff836e4b358bfe2b63e416e5f714498` |
| `docs/contexto/convenciones.md` | 159 | `e0fc25e77a06fc2c8c7ce9f3c19db4837733c00d689c9c02cb5698f0972a356a` |
| `docs/contexto/decisiones.md` | 308 | `3e0b85fba98754e3dc041c619b50e631296f1698bfccc50f905a7922f6746142` |
| `docs/contexto/errores-conocidos.md` | 225 | `ab54e90c0956b84960945a6ffed229c4cc18a17cf9d84f73da879db4d272d136` |
| `docs/contexto/flujo-de-trabajo.md` | 251 | `ed8486fc02600454c74c445a57a0d43ec4703f56af53958d7ffaaaad90e61b47` |
| `docs/DESIGN.md` | 165 | `3f6da9dd0360dece295ade609fb3319638be48adfc3272a22e473c0b14d160bd` |
| `docs/R_RELEVO.md` | 158 | `47219b3424099c4ac100fd2800f46458a9f251e53a57f3f8e6b1183259e9a7c9` |
| `package-lock.json` | 10319 | `b0949dd140bee3124e32f53420db8adad3c13e4213bf76e2953275dfc6789a79` |
| `package.json` | 63 | `3d5a481a4bf2830be3208bed8903c2791c0f2a2f1d4d46cccb036cc5ce60501c` |
| `public/manifest.json` | 30 | `cd9acb9b747d7e2efa1da0e69658461df6c4a2f3d90fd3019cb0d23d65f5cce9` |
| `src/app/(crm)/_ui/alerta-error-formulario.tsx` | 61 | `5a33e3d20d9a29105f95885731eedd6af7235d1c752b5ad8f51fb8fb59576b2a` |
| `src/app/(crm)/_ui/analytics-details.tsx` | 12 | `8c6b5eb2e207ba93a2b8a1de2e17ff97b6b972e857a8ef9e83de4dcd5f918d77` |
| `src/app/(crm)/_ui/analytics-state.ts` | 17 | `0baa9f41be1bc275d8568a315f8e6a29858e3bfed865fb23b4120620ce05ab24` |
| `src/app/(crm)/_ui/command-palette.tsx` | 400 | `e4b615b7b9ff10840769a479efae28ae3c9d753d3eed58bdfb36eea4609f884d` |
| `src/app/(crm)/_ui/crm-header.tsx` | 253 | `f30523e4646dd934bd3eadd754442b0d3e9f6699ced93e55e14a0f2cf76dcc29` |
| `src/app/(crm)/_ui/crm-sidebar-menu.tsx` | 135 | `0bfbdf7b683d19a1662d2a03ea4e50a581621f4c5d59ab9499d066d33beef25c` |
| `src/app/(crm)/_ui/estados.tsx` | 75 | `d748ea5f845d42a8ac6e47d63ad7a087745e3ba3cad6b767d21f4083feb6e082` |
| `src/app/(crm)/_ui/formato.ts` | 36 | `33de85c187e8683f4ab026dce4a7693ce6947b643a9dc812291f887df821edce` |
| `src/app/(crm)/_ui/historial.tsx` | 103 | `aae1c385b42412c319aabd05038ca3ce6a9483a40b03dc3678d378f72c717f0b` |
| `src/app/(crm)/_ui/mobile-dock.tsx` | 247 | `74ec623ede5018939b92a2efa548110e272ba76c778cb03caa945a7c1565e319` |
| `src/app/(crm)/_ui/module-tabs.tsx` | 107 | `885f2642765736abb17222f33feced7b7c64d19477066a766e1a7afad3a85962` |
| `src/app/(crm)/_ui/prototipo-ui.tsx` | 152 | `a5c585bb5cd1742aef2ab9e4cd7088160a2e1ae12226cb3852a13d4cd9f24731` |
| `src/app/(crm)/academy/vista.tsx` | 549 | `68f98ff195ded40b9f4ef699ab56da706de487d0d8fedf8d568d0ddd97d5b5f3` |
| `src/app/(crm)/agenda/vista.tsx` | 254 | `0326e8d5d47e5789ac87074da3ec4294c99bd2bca1839fa837d2c842e7957943` |
| `src/app/(crm)/avances/page.tsx` | 144 | `09362b645e6a7b1ba4500f4245cfbc6dc416dca4792b0e19bc12fdda5f12ef89` |
| `src/app/(crm)/avances/vista.tsx` | 411 | `e4c4778bcd0e9c6019f8963c632309ba0a177ffeb918228e5f29f0c5823f25bc` |
| `src/app/(crm)/configuracion/_catalogos.tsx` | 141 | `5eb62a93f6bb5138632109f5556f6ad4cdf994f1084fa5f99313ee73c3a941e7` |
| `src/app/(crm)/configuracion/_integraciones.tsx` | 60 | `09ee4c861dd062d9e87d0b28f2f669f432a2f92d0f7c4276cbb05da87f8afd1f` |
| `src/app/(crm)/configuracion/_usuarios.tsx` | 294 | `26d2a34030fb20c89f00c0096491921a896b3e76dbcca294f51fd3d5ac4d5de1` |
| `src/app/(crm)/configuracion/vista.tsx` | 82 | `268d505a3821963687077f51aa0836aee828f52c635fa896e99d1b2e2d6860db` |
| `src/app/(crm)/layout.tsx` | 103 | `dcb9fdd5056ea0d9bb255eb765ddbd3fe82020ff3ebd3397b464ea4f6234a295` |
| `src/app/(crm)/leads/inspector.tsx` | 250 | `16a46115b3760a80b64250e56c003579a21d4a5096fec9394a37f0a19bdbc821` |
| `src/app/(crm)/propiedades/_formulario-proyecto.tsx` | 185 | `d900ee3450916424ddf9b8b890d3c52cec2bc0fda025f5799b838bdde319a2be` |
| `src/app/(crm)/propiedades/[slug]/vista.tsx` | 404 | `f3113ca0b784ed876a5fe049680072b317b1008576d7b3f5f53a8d232f55f8db` |
| `src/app/(crm)/propiedades/vista.tsx` | 191 | `7a29cf85245ab03798d8e3cbc4c9e4ec46e99ec7a8febef51b2bfcce3f3df8bd` |
| `src/app/(crm)/reportes/filtros-vista.tsx` | 55 | `2fd05cafbf1f61ab3b218287d22c6df00f5a4277adddd95eaa3172728686b0bf` |
| `src/app/(crm)/reportes/vista.tsx` | 92 | `b5c651bf335e893b5bb5642213381a9b9e0df0204792a3b46a688b7fd4af6295` |
| `src/app/api/ai/audio-transcribe/route.ts` | 36 | `811b9d895b44f14f879f19ed0b99ca55d189b547a620c928d147ef74b5219c9c` |
| `src/app/api/cotizador/confotur/route.ts` | 50 | `b8bf7beda0c89cbac77224fe38a2d0d3949e9817ad5e3cb77293475aeb590d89` |
| `src/app/api/leads/externo/route.ts` | 102 | `d42daa888f9605d6a065e4da61c536839c9f7e6983e6baeb5858e5126bb91f96` |
| `src/app/layout.tsx` | 59 | `4b47c67edcb59008c3cf41b57ca0819cfce220e177d67e02e50e13b77944b609` |
| `src/app/login/login-form.tsx` | 116 | `1b9755b5e55b469be9899d727efb71e7aa1801b3cd09909e3404a8311fef0e22` |
| `src/application/ai/casos-de-uso.ts` | 25 | `b0b54c1bebcc79981d718b726cf039e328576f321d212448bd59740e8e609e85` |
| `src/application/ai/puertos.ts` | 11 | `d4b8e8e3f4e9fc71781d58d4d858766a73ea1f6ac7528dd917a7da2d2398d052` |
| `src/application/catalogos/casos-de-uso.ts` | 73 | `e593c1683af052e76130de4ed6aa80741213772a8c47d00a3daabef09281507e` |
| `src/application/compartido/almacenamiento.ts` | 32 | `9860b6e85c519e5ea6949637912fd1290ff575fb003177b020d6baf6c24817f1` |
| `src/application/compartido/auditoria.ts` | 32 | `7879bd3cb9f982a0a5dab72cdb1a75e851e8da1b325ed1e1f9c5a06aa020137d` |
| `src/application/compartido/unidad-de-trabajo.ts` | 17 | `154ac29b8685626b5d5f78dcfad420c0dea406826df33fc1ef9dab427b5fbcf5` |
| `src/application/confotur/casos-de-uso.ts` | 9 | `c57c1cf6b287f821bdb880d3afe728b806a26df8aa02183da5645791df25e6a8` |
| `src/application/dashboard/consultas.ts` | 48 | `0d9a0b0519c327cd493d8aff8059d3c7b42babb8d4232f26e65f017c67e6f5e4` |
| `src/application/leads/casos-de-uso.ts` | 367 | `4429fbb8bd193235999cb7718be5b373fe69f1b3889db5ec4ff1a0f8c1dcd4af` |
| `src/application/proyectos/casos-de-uso.ts` | 389 | `8a13e02281d807af184d10184f52daa3f4f1231dc0510580c120f15b4bab828e` |
| `src/application/proyectos/puertos.ts` | 130 | `05b2b4246a80d339679ae7691c50200daa87bce12bb624685c5c6faad197cfb0` |
| `src/application/reportes/consultas.ts` | 65 | `212f9204e49d5c1ea7ff3e2c37b6bde3a40b7130d22d02db424ff2066e64bde3` |
| `src/application/reportes/puertos.ts` | 48 | `913f0e1f4f2c0631ba7cf9334462dd836af4cf01a25aeaf33f6cf5a66f1a4d67` |
| `src/application/usuarios/casos-de-uso.ts` | 126 | `1f750410ef8ee63acc6a2171fd9fb614e68031e72803018e0ebc880302f952a2` |
| `src/components/ui/bits.tsx` | 100 | `117e69dfa34a13818dd306a1564cbaa043141a528014804cb14a065cb22d3318` |
| `src/components/ui/chart-card.tsx` | 28 | `103a7f75a7569bc05a2e590930c863eb667dde13181cd197f1c638af6845a9a7` |
| `src/components/ui/data-table.tsx` | 381 | `be7b4d49d24e95fc684d91abdc6c6ed70606ff7d8191c950d6c9a447a0ebd6ab` |
| `src/components/ui/dialog.tsx` | 158 | `914609811127177fda0ce9ac47922f9a788a361330a9e2eef3d145be3fe85818` |
| `src/components/ui/drawer.tsx` | 134 | `2190d08dca91983fd03eb15e52ac77f1ad0bb05c97ecf35191ecd7c1ef415654` |
| `src/components/ui/select.tsx` | 189 | `9de3f2a5458ca457b8ed267946990a3710331df7df0eef45f1513c2c17026513` |
| `src/components/ui/sheet.tsx` | 142 | `6e8260fd099f0b3be712d315ca812fe5b9c1eb38a9926dc53a9ceb4374f01f30` |
| `src/components/ui/sonner.tsx` | 38 | `9d3398dfef09dfb8532d05d0ed7e83f47c1bc5327ebca883e1ea3ae3cea0e0fc` |
| `src/components/ui/tabs.tsx` | 90 | `d707c15a2682b7a82e5340922a2eaefd6aa7917c5b09cba1f8a6237baecdf12d` |
| `src/components/ui/tone.ts` | 60 | `fcdc234af7c33f4a7b17d722690f240b3d67d34ac11f7f98440f8764ce165961` |
| `src/domain/confotur.ts` | 144 | `03d576c2de871bf042414cd65f7c75d0d4e88235c48e90aafb23e18ed3b769bd` |
| `src/domain/rbac.ts` | 150 | `c9268792d9d9553364f51d51d094c802420371417bbbdb5b0a45313f21c1b1fc` |
| `src/domain/telefono.ts` | 44 | `0cfe5dd288892e83b7037b133e6ba9e56077814857676dc58a34148f88b2169a` |
| `src/hooks/use-focus-trap.ts` | 105 | `d96e1f91fc18ae05cb21b47c19b87accfae1e6f87e1ba79fec07af795ec750b7` |
| `src/infrastructure/arquitectura.test.ts` | 174 | `b4d0c30b76f718fe8836e00638f1c55ad5ac109cd8ab11b2e26f2e058cb0b91d` |
| `src/infrastructure/audit.ts` | 85 | `547d1e93e23d9d5aae3a3024dae9fdfc5e39055b0a3be6a40f43e388affb8cb9` |
| `src/infrastructure/auth/actor.ts` | 102 | `e855ccaa154d66d94a421b4f042cfb23062f9cedfd27f67a7882d88186462ab9` |
| `src/infrastructure/db/repos/leads.ts` | 350 | `83327d775e16df1014273a4abff696f98115fe7261d4bbc08f32dc376514f131` |
| `src/infrastructure/db/schema.ts` | 1195 | `5be892527a22a54c6e075536fbc9cf1d1c32deab179aeced825bf3c59605d823` |
| `src/infrastructure/http.ts` | 98 | `b8b01631c362de0a5975b5a5e6920ad20adb4f181819cd2192e4d51bbdc3868d` |
| `src/infrastructure/integraciones/outbox/politica.ts` | 23 | `731e3af86af8f15861cde2d4cc88e1fde343c6d5b9d0005949ca37331a9b631c` |
| `src/infrastructure/integraciones/outbox/worker.ts` | 64 | `a2834a7d5ba9d329eefdefb019cb6fa7915f77eb41b16f8b988055ac30d5ee4c` |
| `src/infrastructure/rbac-filter.ts` | 58 | `d2da6b7366c10f2595a72dc56320f19c3978e41222edfc0b641080ec591cb866` |
| `src/infrastructure/seguridad.test.ts` | 98 | `344474b4eb91be312c2887665e5fd8dc9bb38f8712df7b43f303195bdc61c81a` |
| `src/lib/utils.ts` | 12 | `3b0d09c4bd66fc028e7eb8708e32444bd7ee7ceeca98dc90f3f2d68e35dfd5e9` |

</details>

<details>
<summary>Skill de origen (1 archivos)</summary>

| Archivo | Líneas | SHA-256 |
|---|---|---|
| `E:/PERFILES AI/skills/patron-consola/SKILL.md` | 109 | `25c2a08e8b547a0aa18d7d04f07204432017814bb7c8af5b9c5b9955c4374c86` |

</details>

## Handoff

**D03 de otro proveedor:** revisar cobertura/citas/comparaciones antes de aceptar propuestas. Prioridades: snapshot público sin proyección, ACK I06, envío no durable, propiedad/mapeo proyectos-unidades, claims inventados, Drive de referencia, fronteras de identidad. **D00:** promoción/contexto tras revisión; esta entrega no cambia puertas, aprobaciones ni índice de fichas. D22 y subagentes son productores del mismo proveedor, no revisión independiente.

**D19/D11/D12 en P4:** ficha I06 con consumidor UI/ACK/snapshot/retry/refs/consent/privacidad. **D05/D07:** tokens, teclado/foco, estados y 320/390/768/1440. Construcción espera ficha READY y despacho con archivos permitidos.

**Seguridad del cambio documental (§6 flujo):** no crea tabla/ruta/JSON operativo/variable/HTML usuario/exportador, por lo que esas casillas no aplican a esta edición. Futuro porte conserva RLS, requireScope/visibleRows, Zod/campos explícitos/env central/almacenamiento privado. Sin credenciales ni cadenas de conexión en entregable; sin leer .env ni volcar configuración/inspect. No apareció secreto real en salidas revisadas. Riesgos concretos/escenarios citados §3.2 y tablas; no declarados corregidos.

**Verificación documental realizada:** 123/123 archivos primarios representados, 326 citas explícitas con rutas y líneas válidas y manifiesto de 253 fuentes; 15 rutas mutaron durante la lectura y quedan registradas. Typecheck/lint/npm test/build/UI **no ejecutados**: tarea de análisis, sin código ni issue/flujo cerrado. Build/dev expresamente prohibidos aquí a Codex. QA de aplicación/reproducción corresponde al despacho autorizado independiente.

**Respuesta esperada del revisor:** aceptado/con observaciones/rechazado, con hallazgos archivo:línea y propuestas que pueden pasar a ficha. Priorizar reproducción del fallback y ACK antes de promover capacidades. El productor no interpreta silencio como aprobación.

**Estado:** entregado para revisión, sin autoaprobación. Desconocidos y alcance/datos permanecen con sus dueños.
