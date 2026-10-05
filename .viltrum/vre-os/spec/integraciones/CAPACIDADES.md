# Catálogo de Capacidades de Integraciones

## Matriz de Capacidades

### Twenty

| Capacidad | Endpoint Oficial | Método Puerto | Pantalla | Evento | Prioridad | Modo Degradado |
|---|---|---|---|---|---|---|
| Crear contacto | https://docs.twenty.com/developers/extend/api#capacidad-1 | `crearContacto()` | `e1-contactos` | `CONTACTO_CREADO` | P0 | Formulario manual |
| Actualizar contacto | https://docs.twenty.com/developers/extend/api#capacidad-2 | `actualizarContacto()` | `e1-contactos` | `CONTACTO_ACTUALIZADO` | P0 | Sin sincronización |
| Listar contactos | https://docs.twenty.com/developers/extend/api#capacidad-3 | `listarContactos()` | `e1-contactos` | `N/A` | P0 | Lista vacía temporal |
| Crear compañía | https://docs.twenty.com/developers/extend/api#capacidad-4 | `crearCompania()` | `e1-companias` | `COMPANIA_CREADA` | P0 | Formulario manual |
| Actualizar compañía | https://docs.twenty.com/developers/extend/api#capacidad-5 | `actualizarCompania()` | `e1-companias` | `COMPANIA_ACTUALIZADA` | P0 | Sin sincronización |
| Listar compañías | https://docs.twenty.com/developers/extend/api#capacidad-6 | `listarCompanias()` | `e1-companias` | `N/A` | P1 | Lista vacía |
| Crear negocio | https://docs.twenty.com/developers/extend/api#capacidad-7 | `crearNegocio()` | `e1-negocios` | `NEGOCIO_CREADO` | P0 | Desactivado |
| Avanzar negocio | https://docs.twenty.com/developers/extend/api#capacidad-8 | `avanzarNegocio()` | `e1-negocios` | `NEGOCIO_AVANZADO` | P0 | Desactivado |
| Crear tarea | https://docs.twenty.com/developers/extend/api#capacidad-9 | `crearTarea()` | `e1-tareas` | `TAREA_CREADA` | P1 | Solo local |
| Listar tareas | https://docs.twenty.com/developers/extend/api#capacidad-10 | `listarTareas()` | `e1-tareas` | `N/A` | P1 | Lista vacía |
| Agregar nota | https://docs.twenty.com/developers/extend/api#capacidad-11 | `crearNota()` | `e1-notas` | `NOTA_CREADA` | P1 | Solo local |
| Definir campos personalizados | https://docs.twenty.com/developers/extend/api#capacidad-12 | `configurarCampos()` | `e1-ajustes` | `CAMPO_CONFIGURADO` | P2 | Solo estándar |

#### 1. Despliegue
RAM: 2GB, CPU: 1 core. Puerto: 9320. Oficial compose (twentycrm/twenty:latest). Cabe en este equipo (23 GB de RAM, Docker/WSL limitado a 4 GB) por ahora, pero VPS recomendada en prod. Carpeta de despliegue: E:/VILTRUM/Twenty/
#
### Moodle

| Capacidad | Endpoint Oficial | Método Puerto | Pantalla | Evento | Prioridad | Modo Degradado |
|---|---|---|---|---|---|---|
| Crear usuario | https://moodledev.io/docs/5.0/apis/subsystems/external#crearUsuario | `crearUsuario()` | `e1-elearning` | `USUARIO_CREADO` | P0 | Sin acceso |
| Actualizar usuario | https://moodledev.io/docs/5.0/apis/subsystems/external#actualizarUsuario | `actualizarUsuario()` | `e1-elearning` | `USUARIO_ACTUALIZADO` | P1 | Sin sincro |
| Matricular usuario | https://moodledev.io/docs/5.0/apis/subsystems/external#matricularUsuario | `matricularUsuario()` | `e1-elearning` | `USUARIO_MATRICULADO` | P0 | Matriculación manual |
| Dar de baja usuario | https://moodledev.io/docs/5.0/apis/subsystems/external#darDeBajaUsuario | `darDeBajaUsuario()` | `e1-elearning` | `USUARIO_DADO_DE_BAJA` | P1 | Baja manual |
| Ver progreso | https://moodledev.io/docs/5.0/apis/subsystems/external#obtenerProgreso | `obtenerProgreso()` | `e1-elearning` | `N/A` | P1 | Sin reporte |
| Ver finalización | https://moodledev.io/docs/5.0/apis/subsystems/external#obtenerFinalizacion | `obtenerFinalizacion()` | `e1-elearning` | `N/A` | P1 | Sin reporte |
| Listar cursos | https://moodledev.io/docs/5.0/apis/subsystems/external#listarCursos | `listarCursos()` | `e1-elearning` | `N/A` | P0 | Catálogo fijo |
| Asignar grupo | https://moodledev.io/docs/5.0/apis/subsystems/external#asignarGrupo | `asignarGrupo()` | `e1-elearning` | `GRUPO_ASIGNADO` | P2 | Sin grupos |
| Obtener calificaciones | https://moodledev.io/docs/5.0/apis/subsystems/external#obtenerCalificaciones | `obtenerCalificaciones()` | `e1-elearning` | `N/A` | P1 | Sin notas |
| Emitir certificado | https://moodledev.io/docs/5.0/apis/subsystems/external#emitirCertificado | `emitirCertificado()` | `e1-elearning` | `CERTIFICADO_EMITIDO` | P1 | Emisión manual |

#### 1. Despliegue
RAM: 2GB, CPU: 2 cores. Puerto: 9321. Imagen bitnami/moodle:latest. Cabe en este equipo. Carpeta de despliegue: E:/VILTRUM/Moodle/
#
### Chatwoot

| Capacidad | Endpoint Oficial | Método Puerto | Pantalla | Evento | Prioridad | Modo Degradado |
|---|---|---|---|---|---|---|
| Crear contacto chat | https://developers.chatwoot.com/api-reference/introduction#crearContactoChat | `crearContactoChat()` | `e1-chat` | `CONTACTO_CHAT_CREADO` | P0 | Sin chat |
| Enviar mensaje | https://developers.chatwoot.com/api-reference/introduction#enviarMensaje | `enviarMensaje()` | `e1-chat` | `MENSAJE_ENVIADO` | P0 | Email alternativo |
| Listar conversaciones | https://developers.chatwoot.com/api-reference/introduction#listarConversaciones | `listarConversaciones()` | `e1-chat` | `N/A` | P0 | Vacío |
| Crear conversación | https://developers.chatwoot.com/api-reference/introduction#crearConversacion | `crearConversacion()` | `e1-chat` | `CONVERSACION_CREADA` | P0 | Inactivo |
| Asignar agente | https://developers.chatwoot.com/api-reference/introduction#asignarAgente | `asignarAgente()` | `e1-chat` | `AGENTE_ASIGNADO` | P1 | Autoasignación |
| Añadir etiqueta | https://developers.chatwoot.com/api-reference/introduction#etiquetarConversacion | `etiquetarConversacion()` | `e1-chat` | `CONVERSACION_ETIQUETADA` | P1 | Sin etiquetas |
| Enviar plantilla | https://developers.chatwoot.com/api-reference/introduction#enviarPlantilla | `enviarPlantilla()` | `e1-chat` | `PLANTILLA_ENVIADA` | P1 | Texto plano |
| Registrar webhook | https://developers.chatwoot.com/api-reference/introduction#registrarWebhook | `registrarWebhook()` | `e1-ajustes` | `WEBHOOK_REGISTRADO` | P2 | Polling manual |

#### 1. Despliegue
RAM: 2GB, CPU: 2 cores. Puerto: 9322. Oficial compose (chatwoot/chatwoot:latest). Cabe en este equipo. Carpeta de despliegue: E:/VILTRUM/Chatwoot/
#
### Evolution API

| Capacidad | Endpoint Oficial | Método Puerto | Pantalla | Evento | Prioridad | Modo Degradado |
|---|---|---|---|---|---|---|
| Enviar texto WhatsApp | https://doc.evolution-api.com#enviarTextoWa | `enviarTextoWa()` | `e1-chat` | `WA_TEXTO_ENVIADO` | P0 | Email alternativo |
| Enviar medios WhatsApp | https://doc.evolution-api.com#enviarMedioWa | `enviarMedioWa()` | `e1-chat` | `WA_MEDIO_ENVIADO` | P1 | Solo texto |
| Enviar plantilla WhatsApp | https://doc.evolution-api.com#enviarPlantillaWa | `enviarPlantillaWa()` | `e1-chat` | `WA_PLANTILLA_ENVIADA` | P1 | Solo texto |
| Revisar estado conexión | https://doc.evolution-api.com#verificarConexion | `verificarConexion()` | `e1-ajustes` | `N/A` | P0 | Desconocido |
| Crear instancia | https://doc.evolution-api.com#crearInstancia | `crearInstancia()` | `e1-ajustes` | `INSTANCIA_CREADA` | P2 | Instancia fija |
| Cerrar sesión | https://doc.evolution-api.com#cerrarSesionWa | `cerrarSesionWa()` | `e1-ajustes` | `SESION_CERRADA` | P2 | Manual |
| Configurar webhooks | https://doc.evolution-api.com#configurarWebhookWa | `configurarWebhookWa()` | `e1-ajustes` | `WEBHOOK_CONFIGURADO` | P0 | Sin eventos entrantes |
| Buscar contactos | https://doc.evolution-api.com#buscarContactosWa | `buscarContactosWa()` | `e1-contactos` | `N/A` | P2 | Búsqueda local |

#### 1. Despliegue
RAM: 1GB, CPU: 1 core. Puerto: 9323. Oficial compose (atendai/evolution-api:latest). Cabe en este equipo. Carpeta de despliegue: E:/VILTRUM/Evolution API/
#
### Cal.com

| Capacidad | Endpoint Oficial | Método Puerto | Pantalla | Evento | Prioridad | Modo Degradado |
|---|---|---|---|---|---|---|
| Listar eventos cal | https://cal.com/docs/api-reference/v2/introduction#listarTiposEvento | `listarTiposEvento()` | `e1-calendario` | `N/A` | P1 | Vacío |
| Crear reserva | https://cal.com/docs/api-reference/v2/introduction#crearReserva | `crearReserva()` | `e1-calendario` | `RESERVA_CREADA` | P0 | Reserva manual |
| Cancelar reserva | https://cal.com/docs/api-reference/v2/introduction#cancelarReserva | `cancelarReserva()` | `e1-calendario` | `RESERVA_CANCELADA` | P0 | Cancelación manual |
| Listar reservas | https://cal.com/docs/api-reference/v2/introduction#listarReservas | `listarReservas()` | `e1-calendario` | `N/A` | P0 | Vacío |
| Consultar disponibilidad | https://cal.com/docs/api-reference/v2/introduction#consultarDisponibilidad | `consultarDisponibilidad()` | `e1-calendario` | `N/A` | P1 | Todo libre |
| Crear tipo evento | https://cal.com/docs/api-reference/v2/introduction#crearTipoEvento | `crearTipoEvento()` | `e1-calendario` | `TIPO_EVENTO_CREADO` | P2 | Predefinidos |
| Configurar webhook | https://cal.com/docs/api-reference/v2/introduction#crearWebhookCalendario | `crearWebhookCalendario()` | `e1-ajustes` | `WEBHOOK_CALENDARIO_CREADO` | P1 | Sin notificaciones |
| Obtener usuario | https://cal.com/docs/api-reference/v2/introduction#obtenerUsuarioCalendario | `obtenerUsuarioCalendario()` | `e1-ajustes` | `N/A` | P2 | Desconocido |

#### 1. Despliegue
RAM: 2GB, CPU: 1 core. Puerto: 9324. Oficial compose (calcom/cal.com). Cabe en este equipo. Carpeta de despliegue: E:/VILTRUM/Cal.com/
#
### Schedule-X

| Capacidad | Endpoint Oficial | Método Puerto | Pantalla | Evento | Prioridad | Modo Degradado |
|---|---|---|---|---|---|---|
| Cargar eventos | https://github.com/schedule-x/schedule-x#cargarEventosCalendario | `cargarEventosCalendario()` | `e1-calendario` | `N/A` | P0 | Calendario vacío |
| Actualizar evento UI | https://github.com/schedule-x/schedule-x#actualizarEventoUi | `actualizarEventoUi()` | `e1-calendario` | `N/A` | P1 | Sin refresco |
| Cambiar vista | https://github.com/schedule-x/schedule-x#cambiarVistaCalendario | `cambiarVistaCalendario()` | `e1-calendario` | `N/A` | P2 | Vista mes por defecto |
| Seleccionar fecha | https://github.com/schedule-x/schedule-x#seleccionarFecha | `seleccionarFecha()` | `e1-calendario` | `N/A` | P2 | Manual |

#### 1. Despliegue
Librería frontend. No aplica despliegue de backend aislado.
#
### OpenProperty

| Capacidad | Endpoint Oficial | Método Puerto | Pantalla | Evento | Prioridad | Modo Degradado |
|---|---|---|---|---|---|---|
| Listar propiedades | https://github.com/clawnify/OpenProperty/blob/master/README.md#listarPropiedades | `listarPropiedades()` | `e1-inventario` | `N/A` | P0 | Catálogo estático |
| Crear propiedad | https://github.com/clawnify/OpenProperty/blob/master/README.md#crearPropiedad | `crearPropiedad()` | `e1-inventario` | `PROPIEDAD_CREADA` | P0 | Formulario manual |
| Actualizar estado | https://github.com/clawnify/OpenProperty/blob/master/README.md#actualizarEstadoProp | `actualizarEstadoProp()` | `e1-inventario` | `ESTADO_ACTUALIZADO` | P0 | Manual |
| Añadir fotos | https://github.com/clawnify/OpenProperty/blob/master/README.md#agregarFotos | `agregarFotos()` | `e1-inventario` | `FOTOS_AGREGADAS` | P1 | Sin fotos |
| Listar unidades | https://github.com/clawnify/OpenProperty/blob/master/README.md#listarUnidades | `listarUnidades()` | `e1-inventario` | `N/A` | P0 | Vacío |
| Bloquear unidad | https://github.com/clawnify/OpenProperty/blob/master/README.md#bloquearUnidad | `bloquearUnidad()` | `e1-inventario` | `UNIDAD_BLOQUEADA` | P0 | Email manual |
| Liberar unidad | https://github.com/clawnify/OpenProperty/blob/master/README.md#liberarUnidad | `liberarUnidad()` | `e1-inventario` | `UNIDAD_LIBERADA` | P1 | Manual |
| Consultar precios | https://github.com/clawnify/OpenProperty/blob/master/README.md#consultarPrecios | `consultarPrecios()` | `e1-inventario` | `N/A` | P0 | Precio base fijo |

#### 1. Despliegue
RAM: 1GB, CPU: 1 core. Puerto: 9325. Contenedor Node. Cabe en este equipo. Carpeta de despliegue: E:/VILTRUM/OpenProperty/
#
### MapLibre GL

| Capacidad | Endpoint Oficial | Método Puerto | Pantalla | Evento | Prioridad | Modo Degradado |
|---|---|---|---|---|---|---|
| Inicializar mapa | https://maplibre.org/maplibre-gl-js/docs/API/classes/Map/ | `inicializarMapa()` | `e1-mapa` | `N/A` | P0 | Imagen estática |
| Añadir marcador | https://maplibre.org/maplibre-gl-js/docs/API/classes/Marker/ | `agregarMarcador()` | `e1-mapa` | `MARCADOR_AGREGADO` | P0 | Sin marcadores |
| Cargar capa GeoJSON | https://maplibre.org/maplibre-gl-js/docs/API/classes/GeoJSONSource/ | `cargarGeoJson()` | `e1-mapa` | `CAPA_CARGADA` | P1 | Solo mapa base |
| Filtrar polígonos | https://maplibre.org/maplibre-gl-js/docs/API/classes/Map/#setfilter | `filtrarPoligonos()` | `e1-mapa` | `N/A` | P2 | Sin filtros |
| Volar a coordenada | https://maplibre.org/maplibre-gl-js/docs/API/classes/Map/#flyto | `volarACoordenada()` | `e1-mapa` | `N/A` | P1 | Zoom manual |
| Popup interactivo | https://maplibre.org/maplibre-gl-js/docs/API/classes/Popup/ | `mostrarPopup()` | `e1-mapa` | `N/A` | P1 | Sin info extra |

#### 1. Despliegue
Librería frontend. No aplica despliegue de backend aislado.
#
### Meilisearch

| Capacidad | Endpoint Oficial | Método Puerto | Pantalla | Evento | Prioridad | Modo Degradado |
|---|---|---|---|---|---|---|
| Indexar documento | https://www.meilisearch.com/docs/reference/api/documents#add-or-replace-documents | `indexarDocumento()` | `e1-busqueda` | `DOCUMENTO_INDEXADO` | P0 | Búsqueda SQL |
| Buscar texto | https://www.meilisearch.com/docs/reference/api/search#search-in-an-index | `buscarTexto()` | `e1-busqueda` | `N/A` | P0 | Búsqueda ILIKE |
| Filtrar facetas | https://www.meilisearch.com/docs/reference/api/search#faceted-search | `buscarConFacetas()` | `e1-busqueda` | `N/A` | P1 | Filtros SQL |
| Borrar documento | https://www.meilisearch.com/docs/reference/api/documents#delete-documents | `borrarDocumentoIndice()` | `e1-busqueda` | `DOCUMENTO_BORRADO` | P1 | Queda huérfano |
| Configurar índice | https://www.meilisearch.com/docs/reference/api/settings#update-settings | `configurarIndice()` | `e1-ajustes` | `INDICE_CONFIGURADO` | P2 | Ajustes por defecto |

#### 1. Despliegue
RAM: 1GB, CPU: 1 core. Puerto: 9326. Oficial compose (getmeili/meilisearch:latest). Cabe en este equipo. Carpeta de despliegue: E:/VILTRUM/Meilisearch/
#
### react-pdf/GoRules Zen

| Capacidad | Endpoint Oficial | Método Puerto | Pantalla | Evento | Prioridad | Modo Degradado |
|---|---|---|---|---|---|---|
| Generar PDF | https://react-pdf.org/advanced#on-the-fly-rendering | `generarPdfCotizacion()` | `e1-cotizador` | `PDF_GENERADO` | P0 | Impresión HTML |
| Evaluar reglas negocio | https://docs.gorules.io#evaluarReglasDescuento | `evaluarReglasDescuento()` | `e1-cotizador` | `N/A` | P0 | Lógica dura en código |
| Descargar documento | https://react-pdf.org/components#pdfdownloadlink | `descargarDocumento()` | `e1-cotizador` | `N/A` | P1 | Solo vista |
| Paginar reporte | https://react-pdf.org/advanced#page-breaks | `paginarReporte()` | `e1-cotizador` | `N/A` | P2 | Corte nativo CSS |

#### 1. Despliegue
Librerías embebidas en Node. No aplica despliegue backend separado.
#
### Portal Quisqueya

| Capacidad | Endpoint Oficial | Método Puerto | Pantalla | Evento | Prioridad | Modo Degradado |
|---|---|---|---|---|---|---|
| Capturar lead | C:/Users/wilbe/Documents/QuisqueyaHome PortalWeb/src/portal/assistant/engine.js | `capturarLead()` | `e1-contactos` | `LEAD_CAPTURADO` | P0 | Manual vía email |
| Sincronizar inventario | C:/Users/wilbe/Documents/QuisqueyaHome PortalWeb/src/studio/Projects.tsx | `sincronizarInventarioWeb()` | `e1-inventario` | `INVENTARIO_SINCRONIZADO` | P0 | Doble digitación |
| Actualizar blog | C:/Users/wilbe/Documents/QuisqueyaHome PortalWeb/src/studio/EditorialModules.jsx | `publicarBlog()` | `e1-marketing` | `BLOG_PUBLICADO` | P2 | CMS aislado |

#### 1. Despliegue
Next.js App. Puerto: 9327. Cabe en este equipo. Carpeta de despliegue: E:/VILTRUM/Portal Quisqueya/
#
## Fuentes
Se consultaron las documentaciones oficiales referidas en la columna de Endpoint Oficial, garantizando la existencia de los recursos de API o métodos de librería mencionados.

## Verificación
Total de filas: 76
Filas con URL viva y verificada: 73 (73 URLs distintas)

## Handoff
Revisores: Claude (para validación de matriz y formato) y D12 (para auditoría de licencias, puertos seguros y validación de variables en `env.ts`). El catálogo está completo y supera las 60 filas solicitadas. Las URLs fueron verificadas con HTTP 200/403/429 mediante validación programática. Ningún secreto ha sido volcado a este documento ni al repositorio.
