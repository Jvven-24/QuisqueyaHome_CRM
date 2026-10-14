# D19 · Enlace Portal ↔ CRM: contrato real (inventario, solo lectura)

- **Fecha:** 2026-10-14. **Modo:** inventario, solo lectura. No se editó ningún archivo de los repositorios analizados. No se abrieron `.env*` ni credenciales. No se llamó a ningún endpoint vivo ni se ejecutaron tests.
- **Prefijos de evidencia:** `P/` = `C:\Users\wilbe\Documents\QuisqueyaHome PortalWeb\` · `C/` = `C:\Users\wilbe\Documents\QuisqueyaHome_CRM\`.
- **Documentos previos citados, no repetidos:** `C/.viltrum/vre-os/spec/inventario/cms-reutilizable.md` (§3, líneas 271-325, contrato I06) y `C/.viltrum/vre-os/spec/modulos/M01-leads.md` (§2 fila Webhook, línea 68; contrato objetivo `capturarLeadExterno`, línea 156).
- **Nota de actualización:** el inventario previo usó `P/` c8cc0a3 y `C/` e7bba17. Hoy los HEAD son `P/` f5a5ac7 y `C/` fcf024c. Varias líneas han cambiado (p. ej. la autenticación del webhook del CRM está en `externo/route.ts:67-70`, no en `:65`).

---

## 0. Resumen

1. **Solo existe un enlace Portal → CRM,** y solo para citas de clientes con sesión (`P/server/client-api.mjs:165`, `:192`). Ningún visitante anónimo genera un registro en el CRM.
2. **Ese enlace no funciona de punta a punta.** El ACK es incompatible (`client-api.mjs:270` lee `leadId`; el CRM devuelve `lead`), la UI nunca crea una cita (`createInquiry` no tiene llamador), no hay reintentos y el payload no lleva origen, UTM ni proyecto/unidad estructurados.
3. **CRM → Portal no existe.** El portal sirve su catálogo desde su propia base PostgreSQL, alimentada por la Base Maestra y scripts de importación. Los flags `isPublished` del CRM se escriben pero nadie fuera del CRM los lee.
4. **Hay un secreto por defecto en código:** `P/server/client-api.mjs:227`. Está en `origin/main` desde el 2026-10-03. Hay que rotarlo y quitar el fallback.
5. **Gate de release:** las cuentas de comprador están bloqueadas por H3 en la documentación (`P/Docs/audits/git-release-audit-2026-10-03.md:42,57,87`) y en el manifiesto de release (`P/deploy/prepare-code-release.py:29`). El código ya está en HEAD y el router de cliente está montado sin condición (`P/server/server.mjs:139-144`).

---

## 1. Repo vigente del portal

| Ruta | Estado |
|---|---|
| `C:\Users\wilbe\Documents\QuisqueyaHome PortalWeb` | **Vigente.** Rama `main`, HEAD `f5a5ac7` (2026-10-04 20:44 -0400). |
| `C:\Users\wilbe\Documents\QHPortalWeb` | Symlink a la carpeta anterior (`ls` lo muestra como `lrwxrwxrwx`). Mismo repo y mismo HEAD. No es un segundo proyecto. |

- **Remoto:** `github.com/wilberdelarosa/QuisqueyaHomedev` (rama `main`). `origin/main` = `c8cc0a3` (2026-10-03 15:46). **`f5a5ac7` no está en origin** (1 commit local).
- **Árbol sucio:** `server/client-api.mjs` con un cambio sin commit del puerto por defecto del CRM (`3000` → `3100`). Archivos sin seguir: `shared/map-parser.mjs`, `shared/zone-coordinates.mjs`. Modificados: `AGENTS.md` y `.viltrum/*`.
- **Stack:** React 19.2.8 + Vite 8.2.2 (`package.json`). Servidor Node propio (`P/server/server.mjs`) con driver `pg` 8.23.0 contra PostgreSQL (`P/server/db.mjs:28`). Supabase aparece en las migraciones (`P/supabase/migrations/`) y en el CLI de devDependencies, pero el runtime no usa `supabase-js` para datos.
- **CRM:** `C/` HEAD `fcf024c` (2026-10-13 17:35 -0400), rama `develop`. Árbol con 243 entradas sin commit (no tocadas).

---

## 2. Diagrama textual de flujos

```
(A) Visitante anónimo
    CTA "Agendar" -> P/src/portal/Appointment.jsx:38 -> wa.me (texto con proyecto, fecha, hora y origen)
    -> asesor humano en WhatsApp. NO hay registro en el portal ni en el CRM.

(B) Cliente con sesión (único camino portal -> CRM)
    [UI] createInquiry (P/src/portal/client-store.jsx:192) -> SIN LLAMADOR en la UI
    POST /api/client/inquiries (P/server/client-api.mjs:165, tras guardia de sesión :80)
      -> INSERT client_inquiries status='requested', crm_sync_status='pending'   (:176-181)
      -> INSERT client_activity_log                                               (:186-189)
      -> 201 al cliente
      -> despacharInquiryACRM, sin await, con .catch que solo escribe log         (:191-199, :225)
           POST CRM /api/leads/externo, cabecera x-webhook-token, timeout 5 s     (:258-266)
             C/src/app/api/leads/externo/route.ts:67-71  token (401)
                                                :74      Zod (parseInput)
                                                :77      capturarLeadExterno
                                                         -> leads + contacts + audit_log (recibo externalId+payloadHash)
                                                :98      200 { ok, lead, creado }
           portal: result.leadId (:270) -> null  => crm_external_id = null, status 'synced'
           HTTP no ok -> 'failed' (:279-287);  excepción de red -> queda 'pending' (:288-291)
      -> NADIE reintenta 'pending' ni 'failed'. No hay worker. El índice parcial
         client_inquiries_crm_pending_idx (P/supabase/migrations/20261003120000...:191-193) no tiene consumidor.

(C) Origen y analítica (no llega al CRM)
    P/src/portal/analytics.js:27,92,113 guarda origen (qh.origin.v1: utm_*, advisor, referrer)
      -> sendBeacon /api/e (:127) -> P/server/analytics.mjs:129-139 visitor_sessions.origin (jsonb)
                                  -> P/server/analytics.mjs:203-206 Mixpanel (utm_*, asesor)

(D) Catálogo (solo portal)
    Base Maestra (BASE_MAESTRA_PROYECTOS/, documentos) + scripts/portal-import.mjs + edición en Studio
      -> Postgres del portal: projects, project_variants, price_snapshots, project_media, construction_phases
      -> P/server/catalog.mjs:130 (cache P/server/catalog-cache.mjs) -> GET /api/catalog -> SPA

(E) CRM -> Portal: no hay canal
    PATCH /api/proyectos/[id]   C/src/app/api/proyectos/[id]/route.ts:66   escribe projects.is_published
    PATCH fases                 C/src/app/api/proyectos/[id]/fases/[faseId]/route.ts:43-45  escribe is_published
      -> nadie lee estos campos fuera del CRM.
    Outbox: C/src/infrastructure/integraciones/outbox/runtime.ts:7-8 sin llamador (ni cron ni ruta).
    CrmPort local: C/src/infrastructure/integraciones/crm/local.ts es un no-op que solo registra referencias.
```

---

## 3. Tabla de contratos

Estado: **vivo** = funciona de extremo a extremo · **parcial** = existe pero le falta una pieza · **ausente** = no existe.

| # | Dirección | Mecanismo | Endpoint / tabla | Campos | Seguridad | Estado | Evidencia |
|---|---|---|---|---|---|---|---|
| 1 | Portal → CRM | HTTP POST JSON, asíncrono tras el 201 | `POST /api/leads/externo`. Destino: `CRM_EXTERNAL_LEADS_URL` o por defecto `http://127.0.0.1:3100/...` (working tree) / `:3000` (HEAD) | `externalId` = `portal_inquiry_<uuid>`; `fullName`; `email?`; `phone?` (de la sesión); `projectInterestText` = **nombre** del proyecto; `operationType`='sale' fijo; `originalMessage` = nota, fecha, hora, canal e intención concatenados | Token compartido en `x-webhook-token`. **Sin firma HMAC ni timestamp.** Timeout 5 s. URL por defecto `http://` | **parcial** | `P/server/client-api.mjs:226-227`, `:241-255`, `:258-266` |
| 2 | Portal → CRM (idempotencia) | Clave `externalId` + huella `payloadHash` en `audit_log`; advisory lock; 409 si la clave llega con otros datos | `C/src/infrastructure/db/schema.ts:653` (índice único parcial `leads_external_id_unq`); `C/src/infrastructure/db/repos/leads.ts:116-131` | Idempotencia real en el CRM. El portal no reintenta, así que no se ejercita | Clave estable (`client-api.mjs:242`) | **vivo en CRM**, sin ejercitar desde el portal | `C/src/application/leads/casos-de-uso.ts:24-27`, `:36-38` |
| 3 | CRM → Portal (ACK) | Respuesta JSON | CRM devuelve `{ ok, lead, creado }` (`externo/route.ts:98`, `casos-de-uso.ts:27`). Portal lee `result.leadId` | Portal guarda `crm_external_id = null` aunque el lead se creó. Marca `synced` igual | — | **parcial / incompatible** | `P/server/client-api.mjs:270-278`; `C/.../externo/route.ts:98` |
| 4 | Estado de sincronización (portal) | Columnas en la base del portal | `public.client_inquiries`: `crm_sync_status` (`pending`/`synced`/`failed`/`ignored`), `crm_external_id`, `crm_synced_at`, `crm_payload` | `crm_payload` guarda el payload completo (email, teléfono, mensaje) y `errorText` del CRM | Datos personales en la base del portal | **parcial** (sin worker de reintento) | `P/supabase/migrations/20261003120000_client_accounts_crm_subsystem.sql:159-193`; `P/server/client-api.mjs:278`, `:286` |
| 5 | Portal → Portal (alta de cita) | HTTP POST | `POST /api/client/inquiries` → `public.client_inquiries` | `projectId`/`projectSlug`, `preferredDate` (regex), `preferredTime` (30), `intentSlug` (50), `meetingChannel` (30), `notes` (1000). Validación manual, sin Zod | Sesión de cliente obligatoria (`client-api.mjs:80`) | **ausente en UI**: `createInquiry` no tiene llamador (`client-store.jsx:192`; búsqueda en `src/` sin otros usos) | `P/server/client-api.mjs:165-202` |
| 6 | Portal (UI → API) | HTTP POST | `POST /api/client/inquiries/:id/cancel` (llamado por `client-store.jsx:216` y `ClientProfile.jsx:684`) | — | — | **ausente en servidor**: no hay ruta, responde 404 | `P/src/portal/client-store.jsx:215-222`; sin ruta en `P/server/client-api.mjs` |
| 7 | Portal (UI → API) | HTTP POST vs DELETE | UI llama `POST /api/client/privacy/purge` (`client-store.jsx:260`). Servidor define `DELETE /api/client/privacy/account` (`client-api.mjs:211`) | Contraseña para confirmar | Sesión + rate limit de privacidad | **ausente** (método y ruta no coinciden; 404) | `P/src/portal/client-store.jsx:259-264`; `P/server/client-api.mjs:211-216` |
| 8 | Portal → CRM (purga) | — | La purga local no emite evento al CRM | Copia comercial del CRM persiste tras borrar la cuenta | — | **ausente** (ya documentado) | `cms-reutilizable.md:307` |
| 9 | Portal → humano (WhatsApp) | Enlace `wa.me` con texto | `https://wa.me/<numero>` (número de `portal_settings` con respaldo) | Texto con proyecto, fecha, hora, objetivo y origen | Ninguna (cliente) | **vivo**, pero **no es captación en el CRM** | `P/src/portal/Appointment.jsx:30-39`; `P/shared/contact.mjs:18`, `:27-29` |
| 10 | Portal → Portal (analítica y origen) | `sendBeacon`/`fetch` | `POST /api/e` (202) → `visitor_sessions.origin` (jsonb) y Mixpanel | `utm_source`, `utm_medium`, `utm_campaign`, `advisor`, referrer; origen guardado en localStorage `qh.origin.v1` | `/api/e` público, sin sesión (`P/server/server.mjs:137`) | **vivo, no llega al CRM** | `P/src/portal/analytics.js:27`, `:92`, `:113`, `:127`; `P/server/analytics.mjs:129-139`, `:203-206` |
| 11 | Portal → CRM (campos de origen) | Campos del contrato receptor | El CRM acepta `projectId` (entero), `sourceId` (entero), `zoneInterest`, `campaign`, `utmSource`, `utmMedium`, `utmCampaign`, `sourceVideoUrl`, presupuesto | El portal **no envía ninguno** de ellos | — | **ausente** (el contrato receptor existe, el emisor no lo usa) | `C/src/app/api/leads/externo/route.ts:25-47`; `P/server/client-api.mjs:241-255` |
| 12 | Portal (lectura pública de catálogo) | HTTP GET | `GET /api/catalog` ← `public.projects`, `project_variants`, `project_media`, etc. | Campos comerciales solo si `validation_status` ∈ {verified, partially_verified} y `price_status` ∈ {verified, reported} | Público, cacheado | **vivo, sin CRM** | `P/server/catalog.mjs:118-130`; `P/shared/public-commercial.mjs:3-13` |
| 13 | CRM → Portal (catálogo) | — | — | — | — | **ausente** | Búsqueda en `C/src` sin cliente del portal |
| 14 | CRM → Portal (publicación de proyecto) | PATCH interno | `projects.is_published` (`C/src/infrastructure/db/schema.ts:455`); escritura en `proyectos/[id]/route.ts:28`, `:66` | Flag booleano | Sesión + RBAC | **ausente en el portal**: nadie lo lee fuera del CRM | `C/src/app/api/proyectos/[id]/route.ts:66` |
| 15 | CRM → Portal (publicación de avance) | PATCH interno | `constructionPhases.is_published` / `published_at` (`schema.ts:546-547`); botón "Publicar en el portal" (`C/src/app/(crm)/avances/vista.tsx:115`, `:150`) | Flag y fecha de publicación | Sesión + RBAC | **ausente en el portal**. El portal tiene su propio `construction_phases` (`P/supabase/migrations/20261003100000_construction_phases_taxonomy.sql:4`) | `C/.../fases/[faseId]/route.ts:43-45` |
| 16 | CRM → Portal (disponibilidad y precio por unidad) | — | `units.status` (`available`/`reserved`/`sold`/`unavailable`, `C/src/domain/catalogs.ts:140-145`); rango público `public_range_min/max_cents` (`schema.ts:475-520`) | Unidades **sin flag de publicación** | — | **ausente** | `C/src/application/pipeline/cierre.ts:124-125`; `C/src/infrastructure/db/repos/pipeline.ts:192` |
| 17 | CRM (evento de dominio) | Outbox transaccional | `outbox` (`schema.ts:1153-1176`; tipos `LeadCreado`, `NegocioCambioEtapa`, `ActividadRegistrada`) | Sin evento de estado de unidad ni de publicación | — | **parcial**: tabla existe, runtime sin llamador (`outbox/runtime.ts:7-8`), `CrmPort` local no-op | `C/src/infrastructure/integraciones/crm/local.ts`; `C/src/application/compartido/crm.ts` |
| 18 | Webhook entrante genérico | Tabla de recepción | `webhook_inbox` (`C/src/infrastructure/db/schema.ts:1203`) | — | — | **ausente**: no localicé ruta que la escriba | Búsqueda de `webhook` en `C/src/app/api` |
| 19 | WhatsApp entrante al CRM | — | `whatsapp_business` está listado solo como salida: "El CRM abre conversaciones desde la ficha" | — | — | **ausente** | `C/src/app/(crm)/configuracion/_integraciones.tsx:24` |
| 20 | Meta Lead Ads | Webhook | — | — | — | **ausente**, "Fase posterior" | `C/src/app/(crm)/configuracion/_integraciones.tsx:28` |
| 21 | Identidad cliente (portal) | Sesión propia | `client_accounts` (`...:33`), `client_profiles` (`:65`), `client_saved_*` (`:121`, `:139`), `private.client_sessions` (`:221`) | Email, teléfono, perfil de inversión | Sesiones propias; H3 pendiente | **parcial**: código en HEAD, release bloqueada (ver §5) | `P/supabase/migrations/20261003120000_client_accounts_crm_subsystem.sql` |
| 22 | Identidad broker (CRM) | Supabase Auth + perfiles | `users`, `broker_profiles` (`schema.ts:214`, `:263`) | Empleados CRM | RBAC `requireScope` | **vivo**, sin cuenta de broker en el portal | `C/src/infrastructure/db/schema.ts` |

---

## 4. Modelos duplicados (portal vs CRM)

| Concepto | Portal (tabla) | CRM (tabla) | Clave común | Estado |
|---|---|---|---|---|
| Proyecto | `projects` (`P/supabase/migrations/20260905_quisqueya_catalog.sql:54`): `id uuid`, `catalog_id`, `slug` único, `price_min/max`, `availability_text`, `validation_status`, `publication_status` | `projects` (`C/.../schema.ts:424-470`): `id serial`, `slug` único, `is_published`, `public_range_*`, `internal_price` (restringido) | **`slug`** (único en ambos). El CRM no tiene `catalog_id` | Duplicado sin mapeo. Ya documentado: UUID vs serial, no compartir BD (`cms-reutilizable.md:286`) |
| Unidad / tipología | `project_variants` (`...:110`): `slug`, rangos, `publication_status`. Sin `unit_id` | `units` (`schema.ts:475-520`): `code`, `status`, `real_price` (restringido), rango público | Ninguna | Modelos distintos. Sin mapeo tipología ↔ unidad |
| Precio | `projects.price_min/max` + `price_snapshots` (`...:138`) con historial | `projects.public_range_*`, `units.public_range_*`, `units.real_price` | Ninguna | Dos fuentes. El CRM no tiene historial de precios |
| Disponibilidad | `projects.availability_text` (texto libre, manual) | `units.status` (enum) | Ninguna | Dos fuentes sin sincronización |
| Medios | `project_media` (`P/supabase/migrations/20260905_quisqueya_catalog.sql:202`, con `rights_status`, `is_public`) | Fotos de fase vía `subirFotos` (`C/src/application/proyectos/casos-de-uso.ts:300`) | Ninguna | Duplicado conceptual |
| Avance / hitos | `construction_phases` (`20261003100000`), `project_delivery_milestones` (`20260906170000`) | `constructionPhases` (`schema.ts:526-547`) con `is_published` | Ninguna | Duplicado conceptual |
| Leads | `leads` (`20260905_quisqueya_catalog.sql:264`): **sin escritor ni lector en el portal** (tabla muerta) | `leads` (`schema.ts:605-660`) con UTM y `external_id` | — | La tabla del portal no se usa |
| Clientes / contactos | `client_accounts`, `client_profiles` | `contacts` (deduplica por teléfono o correo, `C/src/application/leads/casos-de-uso.ts:47-50`) | Ninguna (sin FK ni id de cuenta) | Sin vínculo |
| Solicitudes de cita | `client_inquiries` (`20261003120000...:159`) | `leads` y `activities` | `externalId` = `portal_inquiry_<uuid>` (solo ida) | Enlace unidireccional |

---

## 5. Identidades

- **Cuenta de cliente (portal): existe en código.** Migración `20261003120000` (`client_accounts` `:33`, `client_profiles` `:65`, `client_inquiries` `:159`, `private.client_sessions` `:221`). Su área privada es **`/perfil`**: `P/src/portal/Portal.jsx:41`, `:73`; `P/src/portal/profile/ClientProfile.jsx` (favoritos, citas, criterios de inversión, exportación y purga).
- **Gate de release:** `P/deploy/prepare-code-release.py:29` escribe `'activation': {'buyer_accounts': False, 'crm': False}`. Es un flag **declarativo del generador**. El router `/api/client/` está montado sin condición (`P/server/server.mjs:16`, `:139-144`). No hay interruptor en runtime: si se despliega ese código, las rutas quedan activas.
- **Doctrina H3:** aprobación de Ismael antes de activar cuentas de comprador (`P/Docs/audits/git-release-audit-2026-10-03.md:42`, `:57`, `:87`).
- **Client Room (M18):** no existe en el CRM. `C/.viltrum/vre-os/spec/inventario/crm-mapa-modulos.md:35` ("Sin página dedicada localizada") y la sección M18 en `:290`. El análogo más cercano es `P/perfil`.
- **Tercera identidad:** cuentas editoriales de Studio en `private.studio_accounts` (`P/server/project-tools.mjs:15`). Tres sistemas de identidad sin relación.
- **Vínculo cliente ↔ contacto:** no existe. El CRM deduplica por teléfono o correo (`casos-de-uso.ts:47-50`); el portal no envía identificadores de cuenta.

---

## 6. Lo ya documentado (no repetido)

- **`cms-reutilizable.md` §3.2 (`:288-307`):** recorrido I06; ACK incompatible (`:299`); contexto perdido (`:303`); consentimiento inferido (`:304`); teléfono internacional (`:305`); purga no propagada (`:307`).
- **`cms-reutilizable.md` §3.3 (`:309-325`):** propuesta de contrato I06. Incluye outbox transaccional y que el sobre propuesto no lo acepta el receptor actual.
- **`cms-reutilizable.md:286`:** UUID vs serial; no compartir BD sin adaptación.
- **`M01-leads.md:68`:** estado del webhook (sin firma, conexión del portal no acreditada, sin emisión al outbox). **`:156`:** contrato objetivo `{ok, lead, creado}` con 401/422/409. **`:32-33`:** actores portal e integración.

**Hallazgos nuevos de este informe:** rutas fantasma de cliente (cancelar, purgar), `createInquiry` sin llamador, secreto por defecto en código, incompatibilidad del ACK confirmada en código, ausencia total de CRM → portal, outbox del CRM sin llamador, tabla `leads` muerta en el portal, y el gate de release por flag declarativo.

---

## 7. Hallazgos de seguridad

Los secretos se señalan por ubicación y no se reproducen.

| ID | Severidad | Archivo:línea | Hallazgo |
|---|---|---|---|
| S1 | **Alta** | `P/server/client-api.mjs:227` | **Hay un secreto en archivo:línea.** Token de webhook por defecto (`|| '<valor>'`). Presente en HEAD `f5a5ac7` y en `origin/main` (introducido en `f48edbe`, 2026-10-03). No aparece en código del CRM (búsqueda excluyendo `.env*`). **No verificado** si coincide con `LEADS_WEBHOOK_TOKEN` del CRM. Acción: rotar en ambos lados, quitar el fallback, revisar historial y visibilidad del repo. |
| S2 | Media-baja | `P/server/db.mjs:28` | **Hay un secreto en archivo:línea.** Credencial por defecto en la cadena de conexión de PostgreSQL. Producción exige `DATABASE_URL` (`db.mjs`, lógica `isProduction`), así que el riesgo es de desarrollo. |
| S3 | Baja (verificar) | `P/scripts/data-api-grants-check.mjs:510` | **Hay un secreto en archivo:línea.** Literal de 15 caracteres asignado a una variable `secret`. Probablemente de prueba; no confirmado. |
| S4 | Media | `P/server/client-api.mjs:226`, `:258-263` | Contrato sin firma: token estático en cabecera, sin HMAC, sin timestamp ni nonce, y URL por defecto `http://`. Un token capturado sirve para siempre. |
| S5 | Baja | `P/server/client-api.mjs:278`, `:280-286` | PII en `crm_payload` (email, teléfono, mensaje) y `errorText` del CRM en la base del portal. Revisar retención. |
| S6 | Positivo | `C/src/app/api/leads/externo/route.ts:56-63`, `:70-71`, `:77-96`; `C/src/middleware.ts:19-33` | Comparación en tiempo constante, 401 sin filtrar, asignación campo por campo, exención pública declarada (decisión #20). `casos-de-uso.ts:61-63` no escribe `brokerId` desde el webhook. |

---

## 8. Huecos priorizados

### P0: seguridad e integridad (antes de cualquier activación)

1. **Rotar y quitar el token por defecto** (S1). `P/server/client-api.mjs:227`.
2. **Corregir el ACK:** leer `result.lead.id` y guardar `creado` (`client-api.mjs:270`). Sin esto no hay vínculo portal ↔ CRM. `M01-leads.md:156` ya fija el contrato.
3. **Cablear o retirar las rutas fantasma:** cancelar (`client-store.jsx:216`) y purgar (`:260` → `/privacy/account`). Hoy devuelven 404.
4. **Decidir la activación:** hoy el camino está muerto por falta de llamador UI, así que no hay pérdida. Al activarlo sin P0.1–P0.2 el riesgo es total. El gate H3 debe cerrarse antes.

### P1: objetivo (b), captura única con origen, proyecto y unidad

5. **Outbox durable en la base del portal:** insertar `client_inquiries` y el evento en una transacción; worker con backoff y reintento con la **misma clave**. `externalId` ya es estable (`client-api.mjs:242`). Ya propuesto en `cms-reutilizable.md:325`.
6. **Congelar el payload enviado** (`crm_payload` inmutable). Hoy se reconstruye en cada intento; un cambio de teléfono o nombre entre reintentos produce **409** (`C/.../repos/leads.ts:129-131`).
7. **Enviar el origen:** `utmSource`, `utmMedium`, `utmCampaign`, `campaign` desde `qh.origin.v1` (`P/src/portal/analytics.js:27`) en el body del POST. El portal no guarda estos campos hoy: `client_inquiries` no tiene columnas UTM (`20261003120000...:159-176`).
8. **Enviar `sourceId` por código, no por id numérico.** `'portal_web'` está en `C/db/seed.sql:140` con id 6, que no es estable entre entornos. Sin `sourceId` el lead queda sin fuente.
9. **Proyecto y unidad estructurados:** el portal manda el nombre (`client-api.mjs:246`), el CRM acepta `projectId` entero (`externo/route.ts:33`). Se necesita un mapa `slug` → `projects.id`. La tabla `external_refs` (`C/.../schema.ts:1188`) sirve para ello. Para unidad no hay origen en el portal.
10. **Visitantes anónimos:** el CTA de WhatsApp no genera registro (`Appointment.jsx:38`). Decidir si el CTA crea lead, con consentimiento y bajo H3.
11. **Hacer alcanzable la UI de cita:** conectar `createInquiry` desde "Agendar Nueva Cita" (`ClientProfile.jsx:645-647`, hoy enlaza a `/contacto` y abre WhatsApp).
12. **Consentimiento:** el CRM asigna `consentAt = now` y `consentSource = 'portal_externo'` al recibir (`casos-de-uso.ts:59-60`), sin evidencia del portal. Definir finalidad y evidencia (ya en `cms-reutilizable.md:304`).

### P1: objetivo (a), publicar o despublicar una unidad y que se refleje en el portal

13. **Modelo de publicación por unidad:** `units` no tiene `is_published` (`C/.../schema.ts:475-520`). Solo proyectos y fases lo tienen.
14. **Canal CRM → portal inexistente:** definir uno (evento de outbox `UnidadPublicacionCambio`, export firmado o lectura por API). El outbox solo admite 3 tipos (`schema.ts:1175`), no tiene cron (`outbox/runtime.ts:7-8`) y el `CrmPort` es un no-op (`crm/local.ts`).
15. **Mapa de claves:** `projects.id` es uuid en el portal y serial en el CRM. La clave común es `slug`. El CRM no tiene `catalog_id`. Usar `external_refs` o una columna `slug` estable.
16. **Tipología ↔ unidad:** `project_variants` no tiene `unit_id`. Falta el mapeo.
17. **Política de precio público:** el portal solo muestra precio si `validation_status` ∈ {verified, partially_verified} y `price_status` ∈ {verified, reported} (`P/shared/public-commercial.mjs:3-13`). El CRM no tiene ese estado. Definir quién valida.

### P1: objetivo (c), disponibilidad con una sola fuente de verdad

18. **Fuente propuesta: `units.status` del CRM.** Hoy hay tres escritores: `units.status` (`cierre.ts:124-125`), `availability_text` (texto libre en el portal, editable en Studio) y precios por importación (Base Maestra). Hay que decidir.
19. **Evento de cambio de estado:** `cierre.ts:124-125` marca `sold` o `reserved` sin evento al outbox. El único evento emitido es `NegocioCambioEtapa` (`C/src/application/pipeline/casos-de-uso.ts:182`).
20. **Caché del portal:** `P/server/catalog-cache.mjs` invalida a mano y no tiene fuente externa. Depende de 18–19.

### P2: deuda y limpieza

21. **Tabla `leads` del portal** (`P/supabase/migrations/20260905_quisqueya_catalog.sql:264`): sin escritor ni lector. Decidir si se elimina o se migra. No se tocó.
22. **`outbox_dead`, `external_refs` y `webhook_inbox` del CRM** (`schema.ts:1179`, `:1188`, `:1203`): sin uso productivo localizado.
23. **WhatsApp entrante y Meta Lead Ads:** ausentes (`_integraciones.tsx:24`, `:28`).
24. **Purga no propagada al CRM** (`cms-reutilizable.md:307`).
25. **Puerto del CRM en el portal:** el cambio sin commit (`3000` → `3100`) no está acreditado. `C/package.json` no fija puerto y `next dev` usa 3000 por defecto. Cuál puerto usa el CRM real es UNKNOWN.

---

## 9. Pendientes de verificación (UNKNOWN)

- Valor de `LEADS_WEBHOOK_TOKEN` en el CRM. No se abrieron `.env*`, así que no se sabe si coincide con S1.
- Valor real de `CRM_EXTERNAL_LEADS_URL` en la VPS.
- Visibilidad del repositorio de GitHub. Si es público, S1 está expuesto.
- Si ya existe alguna fila en `client_inquiries` de producción (no consultada).
- Si H3 se cerró después del 2026-10-03.
- Si el CRM corre en 3000 o en 3100 en el entorno real.
