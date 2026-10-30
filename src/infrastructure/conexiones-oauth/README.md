# Conexiones OAuth (Google y Meta)

Permite al **administrador** conectar cuentas de Google Search Console, Google Analytics 4, Gmail, Google Calendar y Meta Ads
desde **Configuración → Conexiones** (`/configuracion?tab=conexiones`). Varias cuentas por servicio.

## Variables de entorno (solo nombres; los valores van en el servidor, nunca en el repo)

| Variable | Obligatoria | Uso |
|---|---|---|
| `INTEGRATIONS_TOKEN_ENC_KEY` | sí | Clave AES-256-GCM (64 hex o 32 bytes base64). `openssl rand -hex 32`. Alternativa heredada: `GOOGLE_TOKEN_ENC_KEY`. **Si se pierde o rota, hay que reconectar todas las cuentas.** |
| `INTEGRATIONS_PUBLIC_URL` | sí | Origen público del CRM sin barra final. Si falta, se deriva de `GOOGLE_OAUTH_REDIRECT_URI`. |
| `GOOGLE_OAUTH_CLIENT_ID` / `GOOGLE_OAUTH_CLIENT_SECRET` | para Google | Cliente OAuth «Aplicación web» (el mismo que ya usa Calendar/login). |
| `META_APP_ID` / `META_APP_SECRET` | para Meta | App de Meta con Facebook Login for Business. |
| `META_LOGIN_CONFIG_ID` | no | Configuración de Login for Business. Sin ella se pide `ads_read` con `scope`. |
| `META_GRAPH_VERSION` | no | Por defecto `v24.0`. |

La página muestra qué variables faltan y deshabilita el botón de conexión hasta que estén.

## URIs de redirección que hay que registrar

- Google (Credenciales → cliente OAuth → *URIs de redireccionamiento autorizados*): `{INTEGRATIONS_PUBLIC_URL}/api/integraciones/oauth/google/callback`
  (Calendar y el login siguen con su URI actual `/api/integraciones/google/callback`.)
- Meta (Facebook Login → *URI de redirección de OAuth válidos*): `{INTEGRATIONS_PUBLIC_URL}/api/integraciones/oauth/meta/callback`

## Scopes (mínimos) y verificación de la app

| Servicio | Scopes | Clasificación Google |
|---|---|---|
| Search Console | `webmasters.readonly` | sensible |
| Analytics 4 | `analytics.readonly` | sensible |
| Gmail (lectura) | `gmail.readonly` | **restringido** (requiere evaluación de seguridad CASA) |
| Gmail (envío, opcional) | `gmail.send` | sensible; se pide **de forma incremental** solo si el administrador lo activa |
| Calendar | `calendar.calendarlist.readonly`, `calendar.events` | sensible |
| Meta Ads | `ads_read` | acceso Standard de Marketing API sin revisión para cuentas propias; Advanced requiere App Review |

Mientras la app de Google esté en modo *Testing*, solo los usuarios de prueba pueden consentir y el refresh token caduca a los 7 días.
Para producción hay que publicar la app y pasar la verificación de scopes sensibles; Gmail lectura exige además la evaluación de seguridad anual.
APIs a habilitar en Google Cloud: Search Console API, Analytics Admin API, Analytics Data API, Gmail API, Google Calendar API.

## Cómo funciona (seguridad)

- **Google**: Authorization Code + **PKCE S256**, `state` aleatorio, `access_type=offline`, `prompt=select_account consent` (permite elegir otra cuenta y obtener refresh token),
  `include_granted_scopes=true` (autorización **incremental**). Si el usuario desmarca un scope obligatorio, se revoca el token y no se guarda nada.
- **Meta**: Login for Business (`config_id`) o `scope=ads_read`; el código se cambia por un token corto y luego por uno **largo** (`fb_exchange_token`).
  Meta no documenta PKCE: la protección es `state` + cookie cifrada. Meta no emite refresh token: el token largo se renueva al re-canjearlo cuando faltan < 7 días.
- `state`, verificador PKCE, usuario y servicio viajan en **una cookie httpOnly/Secure/SameSite=Lax cifrada** (`qh_oauth`, 10 min, ruta `/api/integraciones/oauth`); el `state` se compara en tiempo constante y debe ser del mismo administrador.
- Tokens en la tabla `oauth_connections` **cifrados AES-GCM** (`v1.iv.tag.cifrado`). Ninguna API ni pantalla los devuelve. Los errores guardados son mensajes cortos propios, no el cuerpo del proveedor.
- **Refresco automático** al pedir un token (`accessTokenDe`): Google con 60 s de margen; Meta dentro de los 7 días finales. Si el permiso ya no vale pasa a *Reconectar*.
- **Desconectar** revoca en el proveedor (Google `revoke`, Meta `DELETE /me/permissions`) y borra los tokens; la fila queda como histórico (`revoked_at`).
- **RBAC**: todas las rutas exigen `requireFullScope(settings, edit)` y rol `admin` no solo-lectura. Calendar es por usuario (`google_accounts`); aquí se muestra a título informativo y cada quien desconecta la suya.

## Estados de cada tarjeta

`Sin conectar` · `Conectado` (con cuenta, resumen y hora de la última comprobación) · `Con error` (la llamada de comprobación falló: API sin habilitar, 403, 5xx) · `Reconectar` (revocado/caducado).

## Migración

`drizzle/0018_oauth_conexiones.sql` (tabla `oauth_connections`, RLS activa). **No se aplica sola**: en producción requiere `pg_dump` previo y el OK del responsable.
Es idempotente (`IF NOT EXISTS`).

## Pruebas

`node --test src/infrastructure/conexiones-oauth/*.test.ts` — cripto, PKCE, state, URLs de autorización, canje, refresco, revocación con proveedores simulados,
rutas (RBAC antes de tocar nada), migración, contraste AA y reglas del botón de Google.
