# Seguimiento de origen por video (Facebook → portal / WhatsApp → lead)

Saber de qué video o anuncio llegó cada lead, y qué tan rápido lo contactamos.

## Flujo

1. En **Leads → Origen y enlaces → Enlaces de seguimiento** (solo con acceso total a Integraciones) se crea un enlace por video/anuncio:
   nombre, destino (portal o WhatsApp), video, campaña, UTM y, opcionalmente, `ad_id` / `creative_id`.
2. El CRM entrega una URL corta `https://<INTEGRATIONS_PUBLIC_URL>/v/<codigo>` (código de 7 caracteres, sin 0/1/i/l/o). Se pega en el anuncio o en la descripción del video.
3. `/v/<codigo>` registra el clic, pone la cookie `qh_vid` y redirige (302, sin caché):
   - **Portal**: `PORTAL_PUBLIC_URL` + ruta del enlace + `utm_*` + `qh_c=<codigo>` + `qh_v=<visitante>`.
   - **WhatsApp**: `https://wa.me/<telefono>?text=<mensaje> [QH-<codigo>]`.
   El destino sale siempre de la base de datos (host del portal fijado por entorno o `wa.me`): no hay redirección abierta. Un código desconocido va al portal (o 404 si no está configurado).
4. **Cómo llega el código al lead**
   - *Portal*: el formulario debe leer `qh_c` y `qh_v` de la URL, guardarlos en su sesión y reenviarlos a `POST /api/leads/externo` como `trackingCode` y `visitorId` (campos opcionales, ya aceptados).
   - *WhatsApp*: el webhook detecta `[QH-xxxxxxx]` en el primer mensaje.
   - *Meta Lead Ads*: el webhook toma `ad_id` y busca el enlace con ese anuncio.
5. Al crear el lead se guardan dos filas en `lead_attributions`: **first** (primer toque; cómo nos conoció) y **last** (último toque; qué lo decidió). Ventana de 30 días. Los campos `sourceVideoUrl`, `campaign` y `utm*` del lead se rellenan con el primer toque solo si la captura no los traía.
6. Si hay Meta Ads conectado (Conexiones), al crear el enlace con `ad_id` el CRM completa creativo y campaña con la API de Meta (mejor esfuerzo; si falla, el enlace se crea igual).

## Privacidad

- No se guarda la IP. Se guarda el agente de usuario recortado, el referente y un identificador aleatorio de visitante en la cookie `qh_vid` (httpOnly, 90 días).
- Las previsualizaciones y bots (Facebook, WhatsApp, crawlers) se marcan `is_bot` y no cuentan como visitantes.
- La atribución es de mejor esfuerzo: si falla, el lead se captura igual.
- Recomendación legal (Ley 172-13): mencionar la cookie en el aviso de privacidad del portal.

## Variables de entorno

| Variable | Uso |
|---|---|
| `INTEGRATIONS_PUBLIC_URL` | Origen público del CRM para armar `…/v/<codigo>` |
| `PORTAL_PUBLIC_URL` | Origen fijo del portal para los enlaces de portal |

## Migración

`drizzle/0019_seguimiento_origen.sql` (tablas `tracking_links`, `tracking_clicks`, `lead_attributions`, con RLS). **No aplicada en producción**: requiere `pg_dump` previo y el OK de Wilber.

## Analítica

`/leads/origen`: por video, fuente/medio, campaña y día; embudo visitantes → leads → contactados → convertidos; conversión y Speed To Lead (mediana y % contactado en ≤ 5 min). Filtros de fecha y modelo (primer / último toque). Los días se cortan en hora de República Dominicana (UTC−4). Respeta el alcance RBAC de leads; los clics solo los ve quien tiene acceso total.
