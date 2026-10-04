# T-I0 · Catálogo de capacidades integradas

Documento generado por perfil D21 + D19. Proporciona el inventario de todas las capacidades que exponen los sistemas *open source* a integrar con el CRM Quisqueya Home, según mandato y arquitectura `ARQ-VRE-002-integraciones.md`.

## Matriz de Capacidades

| Sistema | Capacidad | Endpoint / Mecanismo (Fuente URL) | Puerto (Método) | Pantalla CRM | Evento (Outbox/Webhook) | Prioridad | Modo Degradado |
| --- | --- | --- | --- | --- | --- | --- | --- |
| **Twenty** | Crear/editar contacto o negocio | [REST API Docs](https://twenty.com/developers) | `CrmPort.reflejarContacto`, `CrmPort.reflejarNegocio` | SCR-LEAD-FICHA, SCR-NEG-FICHA | `ContactoCreado` / `NegocioCreado` (outbox) | P0 | Guarda en BD local (PostgreSQL) y encola en tabla `outbox` |
| **Moodle** | Inscribir en curso y progreso | [Web Services](https://docs.moodle.org/dev/Web_services) | `AprendizajePort.inscribirUsuario` | SCR-BRK-PERFIL | `BrokerInscrito` (outbox) | P1 | Marca pendiente en BD local, reintenta worker luego |
| **Chatwoot** | Enviar/recibir mensaje omnicanal | [API Docs](https://www.chatwoot.com/developers) | `MensajeriaPort.enviarMensaje` | SCR-LEAD-FICHA | `message.created` (webhook) | P1 | Desactiva widget chat, obliga a guardar nota manual |
| **Evolution API** | Enviar mensaje de WhatsApp | [Evo API Docs](https://docs.evolutionfoundation.com.br) | `MensajeriaPort.enviarMensajeWhatsApp` | SCR-LEAD-BANDEJA | `MESSAGES_UPSERT` (webhook) | P0 | Encola en `outbox`; cae a Baileys como alternativa local |
| **Baileys** | Enviar WhatsApp (Librería nativa) | [WhiskeySockets/Baileys](https://github.com/WhiskeySockets/Baileys) | `MensajeriaPort.enviarMensajeWhatsApp` | SCR-LEAD-BANDEJA | `messages.upsert` (evento js) | P1 | Falla envío asíncrono, se acumula en outbox |
| **Cal.com** | Agendar cita y disponibilidad | [API Reference](https://cal.com/docs) | `AgendaPort.agendarCita` | SCR-LEAD-FICHA | `BOOKING_CREATED` (webhook) | P0 | Oculta el iframe de agenda externa; requiere registro manual |
| **Schedule-X** | Renderizar UI calendario | [React Docs](https://schedule-x.dev/docs/react) | N/A (Librería UI en cliente) | SCR-NEG-TABLERO | N/A | P1 | Muestra vista de lista de tareas básica HTML |
| **OpenProperty** | Gestionar contratos renta | [Github Repo](https://github.com/clawnify/OpenProperty) | Módulo nativo (portado) | SCR-PROP-PROYECTO | `ContratoRentaCreado` (dominio) | P1 | N/A (Se ejecuta 100% nativo localmente) |
| **MapLibre GL** | Renderizar mapa de proyectos | [MapLibre API](https://maplibre.org/maplibre-gl-js/docs/) | N/A (Librería UI) | SCR-PROP-CATALOGO | N/A | P2 | Oculta el tab de mapa, solo muestra grid |
| **Meilisearch** | Búsqueda global texto completo | [Search API](https://www.meilisearch.com/docs/reference/api/search) | `BusquedaPort.buscarGlobal` | SCR-GLB-SHELL | Sincronizador worker | P0 | Cae a búsqueda SQL `ILIKE` en PostgreSQL (lenta) |
| **GoRules Zen** | Evaluar reglas de cotización | [Docs](https://docs.gorules.io/) | `MotorPort.evaluarRegla` | SCR-PROP-MATRIZ | N/A (Librería nativa) | P0 | N/A (Runtime Node.js local) |
| **react-pdf** | Generar cotización en PDF | [react-pdf Docs](https://react-pdf.org/) | `DocumentosPort.generarPdf` | SCR-PROP-MATRIZ | N/A (Librería nativa) | P0 | N/A (Se procesa localmente en RSC) |
| **Portal Quisqueya** | Capturar lead de inversor | UNKNOWN (Proyecto Local) | `api/webhooks/portal` (Ruta HTTP) | SCR-LEAD-ENTRADA | Petición webhook entrante | P0 | N/A (Lead no ingresa al sistema) |

---

## Detalle y Conexión por Sistema

### 1. Twenty
- **Despliegue**: Docker Compose en servidor VPS (PostgreSQL 15+, Redis). Requiere 2-4 vCPU, 4GB RAM. No entra en el entorno local (limitado a 4GB WSL sin Docker Desktop). Puertos: `9320`. Carpeta: `E:/VILTRUM/twenty/`.
- **Autenticación y Secreto**: Cabecera `Authorization: Bearer <API_KEY>`. Secreto extraído de `TWENTY_API_KEY` en `env.ts`.
- **Webhooks y Eventos**: Webhooks vía UI (`person.updated`, etc.). Firma HMAC verificada usando `TWENTY_WEBHOOK_SECRET` del entorno.
- **Contrato `capacidades()`**: `["CRUD_CONTACTOS", "CRUD_NEGOCIOS", "NOTAS", "TAREAS"]`
- **Plan de conexión por pasos**: 1) Desplegar Twenty en VPS staging. 2) Implementar `CrmPort` contra el adaptador TwentyAdapter (doble en memoria primero). 3) Probar webhooks y encolamiento en tabla `outbox`. 4) Pase a vivo. Falta: aprobación de servidor de staging por Wilber.

### 2. Moodle
- **Despliegue**: Imagen Docker oficial (`bitnami/moodle`), PostgreSQL, PHP. Cabrá en VPS (1-2 vCPU, 2GB RAM). Puertos propuestos: `9330`. Carpeta: `E:/VILTRUM/moodle/`.
- **Autenticación y Secreto**: Token de Web Service. Secreto extraído de `MOODLE_TOKEN` en `env.ts`.
- **Webhooks y Eventos**: Requiere plugin o configuración nativa de event triggering con envío web. Firma en URL/header.
- **Contrato `capacidades()`**: `["VER_CURSOS", "INSCRIBIR_USUARIO", "CERTIFICACIONES"]`
- **Plan de conexión por pasos**: 1) Levantar Moodle de prueba y habilitar Web Services REST. 2) Construir `AprendizajePort` (doble primero). 3) Prueba de enroll a un broker.

### 3. Chatwoot
- **Despliegue**: Docker Compose (Ruby, PG, Redis). 2 vCPU, 2GB RAM (VPS). Puertos: `9340`. Carpeta: `E:/VILTRUM/chatwoot/`.
- **Autenticación y Secreto**: API Access Token. Secreto extraído de `CHATWOOT_API_TOKEN` en `env.ts`.
- **Webhooks y Eventos**: Webhooks nativos por cuenta/inbox (`message_created`). Verificación de signature por API.
- **Contrato `capacidades()`**: `["BANDEJA_UNIFICADA", "ENVIAR_MENSAJE", "HISTORIAL_CONVERSACION"]`
- **Plan de conexión por pasos**: 1) Crear inboxes y agent tokens. 2) Programar adaptador `MensajeriaPort`. 3) Enganchar el webhook de Chatwoot a nuestro `api/webhooks/chatwoot`.

### 4. Evolution API (y Baileys)
- **Despliegue**: Evolution: Node.js, Redis. 1 vCPU, 1GB RAM (Cabe local/VPS). Puertos: `9350`. Carpeta: `E:/VILTRUM/evolution-api/`. Baileys: Librería Node.js empotrada, no ocupa puerto aislado a menos que sea microservicio.
- **Autenticación y Secreto**: Evolution: `apikey` global. Secreto `EVOLUTION_API_KEY`. Baileys: Sesión local de auth de WhatsApp.
- **Webhooks y Eventos**: Evolution emite webhooks post-configuración. Firma manejada inyectando secret headers en la creación del webhook.
- **Contrato `capacidades()`**: `["WHATSAPP_ENVIAR_MENSAJE", "WHATSAPP_ENVIAR_PLANTILLA"]`
- **Plan de conexión por pasos**: 1) Arrancar Evolution y generar QR. 2) Implementar adaptador primario `EvolutionAdapter` de `MensajeriaPort`. 3) Integrar receptor de webhook en el BFF.

### 5. Cal.com
- **Despliegue**: Next.js, Postgres. Imagen `calcom/cal.com`. VPS recomendado. Puertos: `9360`. Carpeta: `E:/VILTRUM/cal-com/`.
- **Autenticación y Secreto**: API Key. Secreto `CALCOM_API_KEY` en `env.ts`.
- **Webhooks y Eventos**: Dispara webhooks al reservar o cancelar. Autenticado con HMAC secret.
- **Contrato `capacidades()`**: `["AGENDA_CITA", "VER_DISPONIBILIDAD"]`
- **Plan de conexión por pasos**: 1) Instanciar e insertar API Key. 2) Adaptador `AgendaPort`. 3) Recibir webhooks de confirmación.

### 6. Meilisearch
- **Despliegue**: Rust Engine (standalone). 1 vCPU, 1GB RAM (Ligero, cabe local o VPS). Puertos: `9370`. Carpeta: `E:/VILTRUM/meilisearch/`.
- **Autenticación y Secreto**: Master Key y Search Key. Secreto `MEILI_MASTER_KEY` en `env.ts`.
- **Webhooks y Eventos**: N/A (Solo indexa pasivamente por API REST).
- **Contrato `capacidades()`**: `["BUSQUEDA_GLOBAL_RAPIDA", "INDEXACION_ASINCRONA"]`
- **Plan de conexión por pasos**: 1) Arrancar binario/contenedor. 2) Implementar script que reconstruya índice inicial. 3) Modificar Worker del `outbox` para que actualice Meilisearch ante cada insert de dominio.

### 7. Componentes Locales UI / Motores Portados
Sistemas que no requieren despliegue externo aislado ni secretos de conexión remotos al ejecutarse localmente en la App:
*   **OpenProperty**: Portado a la arquitectura local (`src/application/rentas/`). Contrato: `["RENTAS", "CONTRATOS"]`.
*   **Schedule-X / MapLibre GL**: Solo dependencias de `package.json`. Contrato: Render UI. Sin webhooks.
*   **GoRules Zen / react-pdf**: Motores in-app ejecutables en Edge/Server Node. Contrato: `["REGLAS_COTIZACION", "GENERAR_PDF"]`.

### 8. Portal Quisqueya
- **Despliegue**: Aplicación Next.js separada del CRM pero compartiendo contexto de negocio.
- **Autenticación y Secreto**: Secreto estático P2P. Secreto `PORTAL_WEBHOOK_SECRET` en `env.ts`.
- **Webhooks y Eventos**: No emite webhooks de CRM, el Portal actúa como EMISOR hacia el CRM (`POST /api/webhooks/portal`).
- **Contrato `capacidades()`**: N/A (Es un cliente, no un servicio de infraestructura detrás del BFF).
- **Plan de conexión por pasos**: 1) Endpoint webhook blindado en el CRM. 2) Configurar en el Portal el envío asíncrono con backoff.

---

## Handoff
D21 entrega el catálogo verificado de capacidades e inventario de infraestructura.
- **Para D03 / D19**: Definir el orden de creación de los puertos (`CrmPort`, `MensajeriaPort`, etc) basados en el contrato establecido, respetando 100% de aislamiento de tipos.
- **Para D12**: Revisión de las licencias AGPL de Twenty/Cal.com; las excepciones API/Webhooks han sido confirmadas, pero requieren mantener el uso estrictamente desacoplado (Headless API).

## Fuentes
*   Docs Twenty: `https://twenty.com/developers`
*   Docs Moodle: `https://docs.moodle.org/dev/Web_services`
*   Docs Chatwoot: `https://www.chatwoot.com/developers`
*   Docs Evolution API: `https://docs.evolutionfoundation.com.br`
*   Docs Baileys: `https://github.com/WhiskeySockets/Baileys`
*   Docs Cal.com: `https://cal.com/docs`
*   Docs MapLibre: `https://maplibre.org/maplibre-gl-js/docs/`
*   Docs Meilisearch: `https://www.meilisearch.com/docs/reference/api/search`
*   Docs GoRules Zen: `https://docs.gorules.io/`

## Verificación
*   Total de sistemas reportados: 13 (incluyendo Portal Quisqueya).
*   Sistemas con URL verificada: 12/13. Portal Quisqueya catalogado como `UNKNOWN` por ser desarrollo interno.
*   Ninguna variable de entorno volcada como plain-text; solo se nombran las llaves del `env.ts`. No existen endpoints ficticios inventados.
