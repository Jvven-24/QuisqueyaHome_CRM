# Integraciones CRM: listas para conectar (27 oct 2026, 7:20 AM hora RD)
Commit 04b27a0 (rama codex/wilber-crm-20261026), desplegado con `remoto.sh desplegar`, health OK. Tests: 1078 de 1078 pasan, tsc y eslint limpios.

## Qué se construyó
- `src/infrastructure/proveedores-externos.ts`: adaptadores que se eligen por env.
  - WhatsApp: YCloud o Cloud API (`WHATSAPP_PROVIDER`).
  - Correo: Resend; si no hay, queda simulado.
  - Meta: webhook de Lead Ads (firma HMAC + reto) y CAPI con hash de los datos personales y `test_event_code`.
  - Google: OAuth, crear eventos en Calendar y listar carpetas de Drive.
- Rutas:
  - `GET/POST /api/integraciones/webhooks/meta`: crea el lead idempotente (`meta_lead_<id>`).
  - `GET/POST /api/integraciones/webhooks/whatsapp`: firma YCloud o Meta; crea o actualiza el lead por teléfono.
  - `GET /api/integraciones/estado`: requiere settings:view y solo muestra presencia de variables.
  - `POST /api/integraciones/prueba`: requiere settings:edit, solo funciona con `INTEGRATIONS_TEST_MODE=1` y solo envía a la allowlist.
- Configuración > Integraciones: panel "Proveedores activos" que dice Conectado / Pendiente y qué variable falta.

## Probado en vivo con Viltrum
| Prueba | Resultado |
|---|---|
| WhatsApp YCloud (número del bot Viltrum +18494870092) a Wilber +18098556302 | OK, YCloud aceptó (id 6ae080c1…) |
| Envío a un número fuera de la allowlist | Bloqueado |
| Reto del webhook Meta (token correcto / incorrecto) | 200 / 403 |
| POST Meta sin firma | 401 |
| Webhook WA con firma YCloud válida / inválida | 200 / 401 |
| Correo | Simulado (no hay Resend) |
| CAPI | "sin configurar": no hay pixel ni token de CAPI en Viltrum |
| Google | Sin cliente OAuth |

Notas:
- `IG_APP_SECRET` está vacío en el env de Viltrum, así que `META_APP_SECRET` sigue vacío.
- Recuperar contraseña usa Supabase Auth, que hoy manda a `supabase-mail` (buzón local de prueba), no a un correo real.
- Respaldo del env: /opt/qh-dev/app.env.bak-20261027-integraciones.

## Variables a cambiar para Quisqueya (/opt/qh-dev/app.env, luego `remoto.sh desplegar`)
- Modo prueba: `INTEGRATIONS_TEST_MODE=0` (o borrarla) e `INTEGRATIONS_TEST_ALLOWLIST`.
- WhatsApp por YCloud: `WHATSAPP_PROVIDER=ycloud`, `YCLOUD_API_KEY`, `YCLOUD_WHATSAPP_FROM`, `YCLOUD_WEBHOOK_SECRET`.
- WhatsApp por Cloud API: `WHATSAPP_PROVIDER=cloud`, `WHATSAPP_API_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`.
- Meta: `META_APP_ID`, `META_APP_SECRET`, `META_PAGE_ACCESS_TOKEN`, `META_WEBHOOK_VERIFY_TOKEN`, `META_PIXEL_ID`, `META_CAPI_ACCESS_TOKEN`, `META_CAPI_TEST_EVENT_CODE` (solo para pruebas).
[línea omitida: posible secreto]
[línea omitida: posible secreto]

## Solo Wilber puede hacer
1. Google Cloud: crear el cliente OAuth (web), activar las APIs de Calendar y Drive y registrar el redirect de arriba.
2. Resend: verificar el dominio quisqueyahome.com (DNS) y crear la API key.
3. Meta: crear o usar la App y conectar la Página. En webhooks:
   - URL: https://crm.quisqueyahome.com/api/integraciones/webhooks/meta
   - Campo: `leadgen`
   - Permisos: leads_retrieval y pages_manage_metadata
   - Pixel y token de CAPI
4. WhatsApp:
   - Elegir YCloud o Cloud API para el número de Quisqueya.
   - Webhook: https://crm.quisqueyahome.com/api/integraciones/webhooks/whatsapp
   - Aprobar plantillas para el primer contacto y los seguimientos, porque fuera de la ventana de 24 h el texto libre no se entrega.

## Pendiente técnico
- Mostrar el historial de mensajes de WhatsApp en la ficha del lead.

---
# Google multi-cuenta (27 oct 2026, 7:35 AM hora RD). Commits c78d481 y f60a922, desplegados; health 200
## Qué hace
- Cada usuario (admin o broker) puede conectar **varias cuentas Google**. Por cada cuenta se ven sus calendarios con permiso de escritura y se puede:
  - activar o desactivar cada calendario;
  - marcar uno como "Usar para visitas";
  - activar o desactivar la cuenta entera;
  - **desconectarla**: se revoca el acceso en Google y se borran los tokens.
- Tablas `google_accounts` y `google_calendars` (migración 0016, respaldo previo `/opt/qh-dev/backups/crm-pre-0016-20261027-1124.dump`, hora del VPS en UTC = 7:24 AM hora RD).
- Los tokens se guardan cifrados con AES-256-GCM usando `GOOGLE_TOKEN_ENC_KEY`, ya generada en app.env. Se renuevan solos cuando vencen.
- Rutas:
  - `/api/integraciones/google/conectar`: el state va firmado con HMAC y hay una cookie httpOnly con un nonce.
  - `/api/integraciones/google/callback`: valida el state, el usuario y la cookie.
  - `/api/integraciones/google/cuentas`, `/cuentas/[id]` (PATCH/DELETE), `/cuentas/[id]/calendarios` (POST, resincroniza), `/calendarios/[id]` (PATCH).
- UI: Configuración > Integraciones y Agenda > "Mis calendarios de Google", para el broker (no hay una página de perfil aparte).
- Al crear una cita, el formulario muestra "Calendario de Google" con el predeterminado ya elegido. Las visitas (meeting con hora) se crean en ese calendario. Si Google falla, la cita se guarda igual en el CRM.
- Tests: 1084 de 1084 pasan, con mocks de cifrado, state, canje, refresh, calendarios, evento y revocación.
- Probado en vivo:
  - `conectar` responde 503 "falta CLIENT_ID/SECRET";
  - un callback con state falso redirige a `/agenda?google=estado-invalido`;
  - una cuenta ajena da 404.

## Guía para Wilber: crear el cliente OAuth (unos 10 minutos)
1. Entra a https://console.cloud.google.com, arriba elige **Seleccionar proyecto > Proyecto nuevo** y ponle "Quisqueya CRM".
2. **APIs y servicios > Biblioteca**: activa **Google Calendar API**. Para Drive más adelante, activa también **Google Drive API**.
3. **APIs y servicios > Pantalla de consentimiento de OAuth** (Google Auth Platform):
   - Tipo de usuario: **Externo**.
   - Nombre de la app: "Quisqueya Home CRM". Correo de asistencia: el tuyo.
   - Dominio autorizado: `quisqueyahome.com`.
   - **Acceso a los datos > Agregar scopes**, exactamente estos:
     - `openid`
     - `.../auth/userinfo.email` (aparece como "email")
     - `https://www.googleapis.com/auth/calendar.calendarlist.readonly`
     - `https://www.googleapis.com/auth/calendar.events`
   - **Público > Estado de publicación: En prueba**. En **Usuarios de prueba** agrega tu email y el de cada cuenta que quieras conectar (hasta 100). En modo prueba los permisos vencen a los 7 días y hay que reconectar. Para que no venzan, luego se pide "Publicar app" (calendar.events es un scope sensible y Google lo verifica).
4. **APIs y servicios > Credenciales > Crear credenciales > ID de cliente de OAuth**:
   - Tipo: **Aplicación web**. Nombre: "CRM web".
   - Orígenes de JavaScript autorizados: `https://crm.quisqueyahome.com`
   - **URI de redireccionamiento autorizado**, exacto y sin barra al final: `https://crm.quisqueyahome.com/api/integraciones/google/callback`
   - Crear: copia el **ID de cliente** y el **Secreto**.
[línea omitida: posible secreto]
6. Prueba: CRM > Agenda > Mis calendarios de Google > **Conectar Google**. Elige la cuenta, acepta y vuelve con la cuenta y sus calendarios. Repite **Conectar otra cuenta** con cada cuenta que quieras usar.

Las variables `GOOGLE_OAUTH_REDIRECT_URI` y `GOOGLE_TOKEN_ENC_KEY` ya están puestas. **No cambies `GOOGLE_TOKEN_ENC_KEY`**: si cambia, las cuentas ya conectadas tienen que reconectarse.
