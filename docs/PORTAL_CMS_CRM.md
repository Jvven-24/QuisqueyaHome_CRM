# Capa Portal web ↔ CMS ↔ CRM (diseño y estado)

## Lo que existe hoy (investigación de solo lectura)

- **No hay un CMS de terceros.** El sitio público `quisqueyahome.com` es un portal propio (repo «QuisqueyaHome PortalWeb»): Node/Express + SPA Vite, contenedor `quisqueya-portal` en el puerto 8787, base de datos propia `quisqueya_portal` (tablas `client_inquiries`, `client_accounts`, `advisors`…). Su «CMS» es su propia API y base de datos. Fuentes: `AUDITORIA_ARQUITECTURA_Y_PLAN_MAESTRO_CRM_VILTRUM.md` (arquitectura, §«Aislamiento de fallos»), `docs/infra/inventario-docker.md` (contenedores `quisqueya-portal` y `quisqueya-portal-staging`).
- El código del portal **no está en este repo ni en `/workspace`** (solo la copia espejo de otro sitio en `/workspace/wport`, que no es el portal inmobiliario). No se tocó ningún sitio en vivo.
- En el CRM: `projects.is_published` / `published_at` ya existen («Publicar en el portal»), `/api/leads/externo` ya recibe los leads del portal, y el módulo `app/(crm)/portal` es hoy solo una vista previa editorial (`docs/modulos/portal.md`).
- WordPress (`exp-demo-wp`) y Moodle de la VPS son otros proyectos, no el portal.

## Decisión: el CRM es la fuente de verdad del inventario

| Dato | Dueño | Dirección |
|---|---|---|
| Proyectos y unidades publicados (precio público, estado, avance, video) | **CRM** | CRM → portal (empuje) |
| Leads/consultas del formulario web | Portal las captura, el **CRM** las gestiona | portal → CRM (`/api/leads/externo`, ya existe, ahora con `trackingCode`/`visitorId`) |
| Contenido editorial propio del portal (textos, SEO, blog) | Portal | no se sincroniza; el CRM nunca lo retira |

Por qué empujar y no leer: el portal no puede tener acceso a la base del CRM (precios reales, comisiones); el CRM decide qué sale. Una sola fuente evita la sobreventa entre sitio, CRM y brokers.

## Cómo sincroniza

1. **Proyección pública** (`application/portal-sync/proyeccion.ts`): lista blanca explícita de campos. Nunca sale el precio real, el precio interno, notas internas ni el broker. `sold` y `unavailable` salen igual como «no disponible».
2. **Huella**: hash SHA-256 del JSON canónico de la proyección. El portal guarda la huella que recibió.
3. **Reconciliación idempotente** (`casos-de-uso.ts`): compara lo publicado en el CRM contra lo que el portal dice tener de origen `crm`: crea lo que falta, actualiza si la huella difiere, retira lo que el CRM ya no publica. Repetirla no cambia nada. Un proyecto que falla no frena a los demás; el siguiente ciclo lo reintenta. Soporta simulacro.
4. **Disparadores**:
   - Botón/llamada de administración: `GET /api/portal-sync/reconciliar` (simulacro) y `POST` (ejecuta), con `settings:view` / `settings:edit` de alcance total.
   - Temporizador de la VPS: `POST /api/portal-sync/cron` firmado con HMAC (ventana de 5 min), cada 5–10 min.
   - (Fase siguiente, no implementada) *webhook al publicar*: llamar a la misma reconciliación desde el cambio de `is_published`/estado de unidad para latencia de segundos. El temporizador garantiza la consistencia aunque ese aviso se pierda.
5. **Seguridad**: todas las llamadas CRM → portal van firmadas (`x-qh-timestamp`, `x-qh-signature` = HMAC-SHA256 de `ts.MÉTODO.ruta.cuerpo` con `PORTAL_SYNC_SECRET`), con `Idempotency-Key` = huella, https obligatorio (http solo en localhost), sin seguir redirecciones y con tiempo máximo de 10 s. El secreto no viaja ni se registra.
6. **Bandera**: `PORTAL_SYNC_ENABLED=false` por defecto. Apagada, las rutas responden 409 y no se llama al portal.

## Contrato que debe implementar el portal (repo PortalWeb, pendiente)

Verifica la firma y la ventana de tiempo en cada petición.

- `GET /api/crm-sync/projects` → `{ items: [{ slug, huella, origen }] }` (todos; el CRM solo considera `origen: "crm"`).
- `PUT /api/crm-sync/projects/:slug` con `{ huella, origen: "crm", proyecto }` → upsert por slug; guarda `origen` y `huella`. Idempotente por `Idempotency-Key`.
- `DELETE /api/crm-sync/projects/:slug` → marca como retirado (solo si `origen = "crm"`). Idempotente (404 → conviene responder 200).
- Tras escribir, invalida su caché de catálogo.

## Estado

| Pieza | Estado |
|---|---|
| Proyección, huella, reconciliación, firma | Hecho, con pruebas (adaptador en memoria como doble del portal) |
| Adaptador HTTP firmado | Hecho, probado con `fetch` simulado |
| Rutas admin y cron, bandera, `.env.example` | Hecho |
| Endpoints `/api/crm-sync/*` en el portal | **Pendiente** (otro repo) |
| Instalación en la VPS | **No instalado**: guía en `docs/infra/PORTAL_SYNC_VPS.md`, requiere OK de Wilber |
| Webhook «al publicar» (latencia baja) | Diseñado, no implementado |
| Sincronizar imágenes/planos, bidireccional de avances de obra | Fuera de alcance de esta entrega |
