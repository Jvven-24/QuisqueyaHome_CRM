---
id: I04
sistema: Portal web Quisqueya Home (repositorio QuisqueyaHome PortalWeb)
repo: https://github.com/wilberdelarosa/QuisqueyaHomedev
licencia: código propio de Quisqueya Home; sin proveedor externo
modo: APP
puerto: PortalPort (CRM hacia Portal; propuesto) y receptor existente POST /api/leads/externo (Portal hacia CRM)
estado: REVIEW
riesgo: R3
owner: D19
revisores: [D11, D12, D14]
actualizado: 2026-10-14
---

# I04 · Enlace CRM y Portal web

**Nivel L1, estado REVIEW.** Fuente principal: `.viltrum/research/D19-enlace-portal-crm-2026-10-14.md` (HEAD del Portal `f5a5ac7`, HEAD del CRM `fcf024c`; `origin/main` del Portal está en `c8cc0a3`). Esta ficha cubre el CRM completo y **describe** el lado Portal; el repositorio del Portal es de lectura para los agentes del CRM y cualquier cambio allí requiere autorización propia de Wilber y las reglas de ese repositorio. Correspondencia con el encargo: (a) Portal hacia CRM en §3.1; (b) CRM hacia Portal en §3.2; (c) fuente única de disponibilidad en §2 y §2.1; (d) P0 de seguridad en §10. Prefijos de rutas: `P/` es el repositorio del Portal.

## 1. Para qué lo usamos y para qué no

**Sí:**
1. **Portal hacia CRM:** captar en el CRM, de forma idempotente y con origen, proyecto y unidad por código estable, las solicitudes de clientes del Portal.
2. **CRM hacia Portal:** publicar, retirar y mantener al día las **unidades** del inventario del CRM en el catálogo público, con un solo origen de disponibilidad y de precio público.

**No:**
- No se comparte base de datos ni se exponen las tablas de uno al otro (UUID en el Portal, serial en el CRM; D19 §4).
- El Portal nunca llama a las rutas internas del CRM ni lee sus tablas. El CRM nunca escribe en la base del Portal; entrega eventos firmados a un receptor del Portal.
- **Precio real, precio interno, comisiones, brokers, negocios y notas internas no salen del CRM** (decisión #47: el precio de lista real solo lo ve el Admin).
- Fuera de esta ficha: publicación de avances de obra (`construction_phases` duplicadas, tiene su propia ficha), propagación de la purga de cuenta (D19 hueco 24), cuentas de comprador (bloqueadas por H3), captura de visitantes anónimos por WhatsApp, WhatsApp entrante y Meta Lead Ads.

## 2. Fuente de verdad

| Concepto | Dueño | Regla |
|---|---|---|
| Lead, contacto y su consentimiento | **CRM** una vez recibido | El Portal conserva `client_inquiries` y el estado de sincronización, no el lead. |
| **Disponibilidad de una unidad** | **CRM, `units.status` y solo ese campo** | `available`, `reserved`, `sold`, `unavailable` (`src/domain/catalogs.ts`). El Portal lo refleja; no lo edita. |
| Publicación de una unidad | CRM (bandera nueva por unidad) | Visible en el Portal solo si proyecto y unidad están publicados. |
| Precio público (rango) | CRM, `units.public_range_min/max_cents` aprobado por Admin | El Portal conserva su propio filtro de verificación comercial (`validation_status`, `price_status`) encima del CRM. |
| **Precio real** | CRM, `units.real_price_cents`, recurso `unit_real_price` | **Nunca sale.** Solo Admin lo ve (decisión #47). |
| Contenido editorial del proyecto (narrativa, medios, Studio) | Portal | El CRM no lo toca. |
| Clave de enlace de proyecto | `slug` (único en ambos) | El CRM guarda `external_refs(entity_type='project', system='portal')`. |
| Clave de enlace de unidad | `(proyectoSlug, unidadCodigo)`; `units.code` es único por proyecto | El código de una unidad publicada es inmutable (ver §3.2). |

### 2.1 Escritores actuales de disponibilidad y su destino

| Escritor | Evidencia | Destino |
|---|---|---|
| Cierre de negocio (`sold`, o `reserved` en alquiler) | `src/application/pipeline/cierre.ts:124-125` y `marcarUnidad` en `src/infrastructure/db/repos/pipeline.ts:193` | **Se conserva**, pero pasa por el caso de uso único `cambiarEstadoUnidad` que emite `DisponibilidadCambiada` en la misma transacción. Hoy no emite ningún evento (D19 hueco 19). |
| Edición de unidad con campo `status` | `src/app/api/proyectos/[id]/unidades/[unitId]/route.ts:24,41` (y alta en `.../unidades/route.ts`) | **Se retira de la edición genérica.** Cambiar estado a mano pasa a una acción propia, con motivo, auditoría y el mismo caso de uso. |
| Reserva con caducidad (A5, futura) | D21 A5; aún no existe | Obligada a usar `cambiarEstadoUnidad`. Criterio de revisión: ningún otro `UPDATE units SET status`. |
| `projects.availability_text` en el Portal (texto libre, Studio) | D19 §4 y hueco 18 | **Se retira para proyectos enlazados:** pasa a valor derivado de solo lectura calculado por el Portal desde las unidades recibidas. Proyectos sin enlace conservan el flujo actual hasta enlazarse. |
| Importación de Base Maestra de precios y disponibilidad | `scripts/portal-import.mjs` (D19 §2 D) | **Se retira para unidades enlazadas:** la importación sigue sirviendo al contenido editorial, no a estado ni precio de una unidad que el CRM ya publica. |

Guarda propuesta: prueba de arquitectura que falle si aparece un `set({ status` sobre `units` fuera de `cambiarEstadoUnidad` y de la creación.

## 3. Contrato del puerto

### 3.1 Portal hacia CRM: `POST /api/leads/externo`

**Estado real hoy** (`src/app/api/leads/externo/route.ts`): cabecera `x-webhook-token`, comparación en tiempo constante, 401 sin detalle, cuerpo validado con Zod y asignado campo por campo, excepción pública declarada (decisión #20). Respuesta 200: `{ ok, lead, creado, leadId }`; `leadId === lead.id` y se **añadió el 14-oct** para el acuse del Portal, que lee `result.leadId` (`client-api.mjs:270`). Errores: 401 token, 400 validación, 409 mismo `externalId` con otro payload (`leads.ts:129-131`). `M01-leads.md:156` fija `{ok, lead, creado}` y nombra 422; D03 alinea 400 o 422 al revisar M01.

**Cuerpo v1 (vigente):** `externalId` (obligatorio, `portal_inquiry_<uuid>`), `fullName`, `phone?`, `email?`, `sourceId?`, `projectId?`, `projectInterestText?`, `zoneInterest?`, `operationType?`, presupuesto, `campaign?`, `utmSource?`, `utmMedium?`, `utmCampaign?`, `originalMessage?`, `sourceVideoUrl?`. Hoy el Portal envía solo nombre, correo, teléfono, `projectInterestText` (nombre del proyecto), `operationType='sale'` y `originalMessage` concatenado.

**Cuerpo v2 (aditivo, compatible hacia atrás; campos desconocidos se siguen ignorando):**

| Campo nuevo | Origen en el Portal | Resolución en el CRM |
|---|---|---|
| `sourceCode` | constante `portal_web` | `lead_sources.slug` (el id numérico 6 no es estable entre entornos: `db/seed.sql:140`). Prevalece sobre `sourceId` si ambos llegan. |
| `projectSlug` | `projects.slug` de la solicitud | `projects.slug` → `projectId`. |
| `unitCode` | solo cuando la solicitud nace de una unidad publicada | `units.code` dentro del proyecto resuelto. |
| `utmSource`, `utmMedium`, `utmCampaign`, `campaign` | `qh.origin.v1` (`analytics.js:27`) congelado en la solicitud | Campos que el CRM ya acepta; el Portal hoy no los guarda y no los envía. |
| `consent` | `{ textVersion, grantedAt }` | El CRM hoy asigna `consentAt = now` y `consentSource='portal_externo'` sin evidencia (`casos-de-uso.ts:59-60`). Finalidad y texto los define Wilber (D19 hueco 12). |

**Códigos desconocidos no pierden el lead:** si `sourceCode`, `projectSlug` o `unitCode` no resuelven, el lead se crea con `projectInterestText`, el CRM lo registra en `audit_log` y responde 200 con `avisos: ["projectSlug_desconocido"]` (por ejemplo). Rechazar un lead por un código mal escrito es peor que revisarlo a mano.

**Autenticación: del token estático a HMAC con marca de tiempo.**
- Cabeceras: `x-qh-key-id` (identificador de la clave activa), `x-qh-timestamp` (segundos Unix) y `x-qh-signature: v1=<hex>`, con `HMAC-SHA256(clave, timestamp + "." + cuerpoCrudo)`.
- El CRM lee el cuerpo como **texto crudo**, verifica firma y ventana **antes de parsear JSON** (regla 4 de ARQ-VRE-002 §4) y compara en tiempo constante.
- **Ventana anti-replay:** ±300 s del reloj del CRM (SUPUESTO reversible, dueño D12). Fuera de ventana: 401 genérico.
- Dentro de la ventana, un replay es inocuo porque la operación es idempotente por `externalId` y `payloadHash`: devuelve el mismo lead con `creado:false`. D12 decide si además se registra la firma en `webhook_inbox` para rechazar repeticiones.
- Rotación sin corte: el CRM acepta dos `key-id` simultáneos (`LEADS_WEBHOOK_SECRETS`, JSON `{keyId: secreto}`, solo en `src/infrastructure/env.ts`).
- **Transición:** `LEADS_WEBHOOK_AUTH = token | ambos | hmac`. Orden: (1) el CRM acepta `ambos`; (2) el Portal envía HMAC; (3) se verifica en logs que ya no llegan tokens; (4) el CRM pasa a `hmac` y se elimina `LEADS_WEBHOOK_TOKEN`. Un valor inválido o ausente falla cerrado.
- `coincideToken` deja de ser el filtro de la ruta; `seguridad.test.ts` debe actualizarse para reconocer la verificación HMAC como filtro de la única ruta pública.

**Lado Portal (descrito, no ejecutado desde el CRM):** insertar `client_inquiries` y un evento de salida en **una transacción**; un worker con backoff reintenta con la **misma clave** y con el **payload congelado** (`crm_payload` inmutable, para no provocar 409 si cambia el teléfono entre intentos); guarda `leadId` y `creado` del acuse; HTTPS obligatorio fuera de `localhost`; sin valor por defecto para URL ni secreto.

### 3.2 CRM hacia Portal: `PortalPort`

Ubicación propuesta: `src/application/compartido/portal.ts`. Nombres en español, importes en centavos.

```ts
export type EstadoPublicoUnidad = "disponible" | "reservada" | "vendida";
export type UnidadPublica = {
  proyectoSlug: string; unidadCodigo: string;
  operacion: "sale" | "rent"; periodoPrecio: "one_time" | "monthly";
  tipologia?: string; torre?: string; nivel?: number;
  dormitorios?: number; banos?: number; areaConstruidaM2?: number;
  estadoPublico: EstadoPublicoUnidad;
  moneda: string; rangoPublicoMinCents: number | null; rangoPublicoMaxCents: number | null;
};
export type ContextoPortal = { idempotencyKey: string; correlationId: string; revision: number };

export interface PortalPort {
  publicarUnidad(u: UnidadPublica, c: ContextoPortal): Promise<RefExterna>;
  retirarUnidad(r: { proyectoSlug: string; unidadCodigo: string; motivo: "despublicada" | "no_disponible" | "eliminada" }, c: ContextoPortal): Promise<void>;
  cambiarDisponibilidad(r: { proyectoSlug: string; unidadCodigo: string; estadoPublico: EstadoPublicoUnidad }, c: ContextoPortal): Promise<void>;
  cambiarPrecioPublico(r: { proyectoSlug: string; unidadCodigo: string; moneda: string; rangoPublicoMinCents: number | null; rangoPublicoMaxCents: number | null }, c: ContextoPortal): Promise<void>;
  salud(): Promise<"disponible" | "no_disponible">;
}
```

Todas las operaciones son **idempotentes y comparan `revision`**: el Portal ignora (200, `applied:false`) un evento con revisión menor o igual a la última aplicada de esa unidad. `RefExterna` es el de `src/application/compartido/crm.ts`. Fallos con las clases `RETRYABLE | NON_RETRYABLE | HUMAN_REQUIRED` del patrón `FalloCrm`.

**Reglas de publicación:**
- Bandera nueva por unidad: `units.is_published boolean not null default false` más `published_at` y `published_by` (D11 diseña). El proyecto ya tiene `is_published` (`schema.ts:455`).
- Una unidad es visible en el Portal si `projects.is_published` y `units.is_published` y `deleted_at is null` y `status` ∈ {available, reserved, sold}. `unavailable` equivale a **retirada** (SUPUESTO, confirma Wilber; también si las `sold` se muestran con etiqueta o se ocultan).
- Quién publica: Admin; el permiso exacto lo fija D12 (hoy la publicación de proyecto va por `PATCH /api/proyectos/[id]` con RBAC). Cada cambio queda en `audit_log`.
- Con unidades publicadas quedan **inmutables** el `slug` del proyecto y el `code` de la unidad (el cambio se rechaza con `ConflictError`); renombrar exige despublicar, cambiar y republicar. D03 verifica si hoy el PATCH permite cambiar el slug (UNKNOWN).

**Política de precio público ≠ precio real.** El payload sale de un serializador por **lista blanca campo a campo** (`aUnidadPublica`), nunca de `...fila`. Solo viaja el rango público si `units.public_price_approved_at` no es nulo (columna nueva, aprobación Admin); sin aprobación, `rangoPublico*` va `null` y el Portal muestra "Consultar". Prohibido en cualquier evento: `realPriceCents`, `internalPriceCents`, comisión, `brokerId`, `internalNotes`, `inventoryStateId` y cualquier dato de negocio o contacto. Quién valida el precio del lado Portal (`price_status`) es decisión de su D03.

**Transporte:** el worker del outbox (destino `portal`) hace `POST` HTTPS a un receptor interno nuevo del Portal (`/api/internal/crm-events`, propuesto), firmado con el mismo esquema HMAC y secretos propios (`PORTAL_EVENTS_URL`, `PORTAL_EVENTS_SECRET` en `env.ts`, sin valores por defecto). El receptor verifica antes de parsear, aplica en transacción con la regla de revisión y debe quedar **detrás de una bandera de runtime** (hoy el router de cliente del Portal se monta sin condición, D19 §5). Reconciliación: ruta de solo lectura del CRM `GET /api/portal/instantanea?proyecto=<slug>` firmada, con la lista blanca de arriba, para que el Portal repare divergencias; el CRM es la autoridad.

## 4. Mapeo de datos y enlace por `external_refs`

| CRM | Portal | Enlace |
|---|---|---|
| `projects.slug` | `projects.slug` | Igualdad de slug; antes de activar, un script de solo lectura compara ambas listas y publica las diferencias (UNKNOWN: no está verificado que los valores coincidan). `external_refs('project', local_id, 'portal', slug)`. |
| `units.code` por proyecto | tabla nueva del Portal, p. ej. `crm_units(project_slug, unit_code, estado_publico, rango_min, rango_max, revision, published_at)` | `external_refs('unit', local_id, 'portal', '<slug>:<code>')`. El Portal hoy **no tiene unidades**: `project_variants` no tiene `unit_id` (D19 hueco 16); su D03 decide la relación tipología ↔ unidad. |
| `units.status` | `estado_publico` | `available→disponible`, `reserved→reservada`, `sold→vendida`, `unavailable→retirada`. |
| `units.public_range_*` | `crm_units.rango_*` y, al cambiar, una fila en `price_snapshots` | Da al Portal el historial de precios que el CRM no tiene. |
| `lead_sources.slug='portal_web'` | constante del Portal | `sourceCode`. |
| `client_inquiries.crm_external_id` | `leads.id` del CRM | Se llena con `leadId` del acuse. |
| `client_inquiries.crm_payload` | — | Congelado al crear; contiene PII, retención por definir (D19 S5). |

`external_refs` tiene único `(entity_type, local_id, system)` y `(system, external_id)`; nunca se enlaza por nombre o correo.

## 5. Eventos

**Salientes del CRM (outbox, destino `portal`, agregado `unidad`):** `UnidadPublicada`, `UnidadRetirada`, `DisponibilidadCambiada`, `PrecioPublicoCambiado`. Sobre común: `eventId`, `schemaVersion`, `occurredAt`, `correlationId`, `revision` (cursor por agregado de I00) y el payload de lista blanca. Se emiten en la misma transacción que el cambio (`cambiarEstadoUnidad`, publicar/despublicar, aprobar precio público, edición del rango). Una despublicación seguida de un cambio de estado conserva el orden por agregado (r2 espera a r1). Dependencia: I00 en READY y ampliación del check de tipos de `outbox`, que hoy solo admite `LeadCreado`, `NegocioCambioEtapa` y `ActividadRegistrada` (`schema.ts:1175`); `runtime.ts:7-8` no tiene llamador ni planificador (D19 hueco 14).

**Entrantes al CRM:** solo `POST /api/leads/externo` (§3.1). No hay otro webhook entrante; `webhook_inbox` queda disponible si D12 decide registrar firmas.

**Entrantes al Portal:** `/api/internal/crm-events` (§3.2). El Portal responde 200 con `applied` verdadero o falso para que un reintento nunca provoque error.

## 6. Catálogo de fallos

| Situación | Dirección | Comportamiento |
|---|---|---|
| Timeout, corte o respuesta perdida | ambas | Resultado incierto: se reintenta con la **misma clave y el mismo payload**; ambos lados son idempotentes (`externalId`; `revision`). Nunca se crea otro evento. |
| 401 (firma inválida, fuera de ventana, clave desconocida, reloj desfasado) | ambas | No reintentar. `HUMAN_REQUIRED`: alerta a operador; diagnosticar reloj o rotación. Respuesta genérica, sin decir cuál validación falló. |
| 403 / destino no permitido | CRM → Portal | `HUMAN_REQUIRED`. |
| 400 / 422 (payload inválido) | ambas | `NON_RETRYABLE`. En el Portal queda `failed` con código visible, sin reenviar hasta corregir. |
| 404 (proyecto o unidad desconocidos en el Portal) | CRM → Portal | `HUMAN_REQUIRED`: falta enlace de slug; se publica primero el proyecto. En el lado lead, un código desconocido **no** devuelve 404 (§3.1). |
| 409 mismo `externalId` con otro payload | Portal → CRM | `HUMAN_REQUIRED`; solo ocurre si el payload no se congeló. No reescribir el lead. |
| 429 / 5xx | ambas | `RETRYABLE` con backoff, jitter y `Retry-After`; tope y luego DLQ visible en G10. |
| Evento duplicado | CRM → Portal | 200, `applied:false`. |
| Evento fuera de orden o revisión menor | CRM → Portal | 200, `applied:false`; el Portal no retrocede. |
| Portal caído | CRM → Portal | El CRM sigue operando; se acumula el outbox. La disponibilidad pública puede quedar vieja: el Portal muestra la fecha de la última sincronización por proyecto. |
| CRM caído | Portal → CRM | La solicitud queda `pending` y se reintenta; el cliente ve su 201. |
| Divergencia detectada por instantánea | CRM → Portal | El Portal repara desde el CRM y registra la diferencia. |
| Unidad publicada que pasa a `unavailable`, se elimina o su proyecto se despublica | CRM → Portal | `UnidadRetirada` con motivo. |
| Payload con campo fuera de la lista blanca | CRM | La prueba de contrato falla; en ejecución se descarta el campo y se registra el incidente. |
| Reloj del servidor desfasado | ambas | 401 sistemático en la ventana: alerta específica, no se amplía la ventana. |

Logs: correlación y códigos; nunca token, firma, secreto, cuerpo ni PII.

## 7. Despliegue

- **CRM local:** la aplicación corre en el puerto 9301 (I00 §7). El Portal local usa `CRM_EXTERNAL_LEADS_URL=http://127.0.0.1:9301/api/leads/externo`; el valor por defecto del Portal (3000/3100) no está acreditado como el del CRM real (D19 hueco 25). Ambos procesos con PostgreSQL propio; el Portal usa `DATABASE_URL` y `pg`, no `supabase-js` para datos.
- **Variables (solo `src/infrastructure/env.ts` en el CRM):** `LEADS_WEBHOOK_AUTH`, `LEADS_WEBHOOK_SECRETS`, `PORTAL_EVENTS_URL`, `PORTAL_EVENTS_SECRET`, `PORTAL_EVENTS_TIMEOUT_MS`; `PORTAL_MOTOR` (`local` por defecto = no-op como `CrmPort` local; otro valor sin adaptador falla cerrado). En el Portal, las equivalentes en su configuración de servidor, **sin valores por defecto en el código** y con producción exigiendo HTTPS.
- **Secretos:** de al menos 32 bytes aleatorios, generados fuera del repositorio y del chat, distintos por dirección y por entorno. Nunca en archivos versionados (decisión #39).
- **Migraciones nuevas:** CRM (`units.is_published`, `published_at`, `published_by`, `public_price_approved_at/by`; ampliación de tipos de `outbox`) con el migrador oficial y revisión D11; Portal (`crm_outbox` o equivalente, columnas UTM y `consent` en `client_inquiries`, `crm_units`) en su repositorio.
- **Orden de activación:** (1) rotación de P0, §10; (2) CRM acepta `ambos`; (3) Portal envía HMAC y outbox; (4) H3 aprobado por Ismael; (5) bandera de unidades y receptor `crm-events`. Sin VPS, nube ni push en esta fase.

## 8. Pantallas nuestras que lo representan

- **Propiedades · ficha de proyecto** (`src/app/(crm)/propiedades/[slug]/vista.tsx`): interruptor "Publicar en el Portal" por unidad, aprobación del rango público, estado del último envío (publicada, pendiente, error con código) y motivo al cambiar estado. Solo Admin.
- **Propiedades · lista y formulario de proyecto:** bandera de publicación del proyecto y aviso de bloqueo de slug.
- **Leads** (`src/app/(crm)/leads/*`): origen "Portal web", UTM, proyecto y unidad resueltos; aviso cuando un código no resolvió.
- **Negocios:** el cierre ya cambia la unidad; ahora el resultado muestra que la disponibilidad pública se actualizará.
- **Configuración · Integraciones** (`_integraciones.tsx`) y **G10**: estado del canal Portal, cola `portal`, DLQ, reintento administrativo y última sincronización.
- Los avances (`avances/vista.tsx`, botón "Publicar en el portal") no cambian en esta ficha.

Cada pantalla define seis estados (carga, vacío, error, sin conexión, éxito, permiso insuficiente) a 320/390/768/1440 en su propia ficha; un Portal caído no bloquea guardar en el CRM.

## 9. Pruebas y criterios de aceptación

**Contrato Portal → CRM:**
1. Firma válida → 200 `{ok, lead, creado, leadId}`; `leadId === lead.id`; repetición idéntica → `creado:false`, mismo `leadId`.
2. Mismo `externalId` con otro payload → 409.
3. Firma alterada, cuerpo alterado, clave desconocida, marca de tiempo fuera de ventana (±) y cabeceras ausentes → 401 idéntico en todos los casos, sin parsear el cuerpo.
4. Modo `ambos` acepta token y HMAC; modo `hmac` rechaza token; valor inválido de `LEADS_WEBHOOK_AUTH` falla cerrado.
5. `sourceCode`, `projectSlug` y `unitCode` válidos resuelven; inválidos crean el lead con aviso y rastro en `audit_log`.
6. Campo `brokerId` o asignación enviados por el Portal se ignoran (`casos-de-uso.ts:61-63`).

**Contrato CRM → Portal:** el doble en memoria de `PortalPort` y un receptor simulado pasan la misma suite: publicar, cambiar disponibilidad, cambiar precio, retirar, duplicado, fuera de orden, 401, 404, 429, 5xx, timeout con efecto.

**Disponibilidad única:** (a) cierre de negocio y cambio manual producen exactamente un `DisponibilidadCambiada` con revisión creciente; (b) guarda de arquitectura que prohíbe escribir `units.status` fuera del caso de uso; (c) un reintento de cierre no emite dos eventos; (d) reconciliación detecta y repara una divergencia inducida.

**Precio:** prueba con un precio real centinela en fixture: el JSON serializado de cada evento y de la instantánea **no lo contiene**, tampoco cualquier clave fuera de la lista blanca (continuar el patrón de `src/infrastructure/precios-respuestas.test.ts`). Sin `public_price_approved_at`, el rango va `null`. El rol broker no ve el precio real.

**Seguridad:** ninguna ruta nueva sin firma; RLS en tablas nuevas; ningún secreto en el repositorio ni en logs; `npm run typecheck && npm run lint && npm test && npm run build` en verde en worktree limpio, con revisión de otro proveedor.

### Precondiciones de READY

1. **P0 de seguridad cerrado y verificado** (§10): token rotado en ambos lados y fallback retirado. Sin esto no se activa ningún envío real.
2. Wilber confirma: si `unavailable` equivale a retirada, si las unidades `sold` se muestran, quién aprueba el precio público (Admin), el texto y la finalidad del consentimiento, y qué hace el WhatsApp anónimo.
3. D03 verifica que los slugs de proyecto coinciden entre CRM y Portal (script de solo lectura) y si el PATCH de proyecto puede cambiar el slug.
4. Portal: su D03 decide `crm_units` y su relación con `project_variants`, y la bandera de runtime del receptor; el repositorio del Portal recibe autorización de Wilber para esos cambios.
5. I00 en READY (claim/lease, orden por agregado, tipos de evento ampliados); D11 valida DDL y RLS de `units.is_published` y precios; D12 aprueba HMAC, ventana, rotación, lista blanca y permisos.
6. H3 (aprobación de Ismael para cuentas de comprador) cerrado antes de que el Portal envíe solicitudes reales.
7. D14 define las pruebas de arriba, incluidas las negativas.

### Lotes pequeños de implementación tras READY (no despachados)

| Lote | Entrega y prueba | Archivos permitidos propuestos | Revisor |
|---|---|---|---|
| I04-A | Verificación HMAC con ventana y rotación, modo `LEADS_WEBHOOK_AUTH`, cuerpo crudo antes de parsear, ajuste de `seguridad.test.ts`. Contrato 1–4. | `src/app/api/leads/externo/route.ts`, `src/infrastructure/seguridad/firma-webhook.ts` (nuevo) y su prueba, `src/infrastructure/env.ts`, `src/infrastructure/seguridad.test.ts` | D12 + D14 |
| I04-B | Campos v2 (`sourceCode`, `projectSlug`, `unitCode`, `consent`) y resolución con aviso; contrato 5–6. | `src/app/api/leads/externo/route.ts`, `src/application/leads/casos-de-uso.ts` y `puertos.ts`, `src/infrastructure/db/repos/leads.ts`, pruebas | D14 + D12 |
| I04-C | `PortalPort`, tipos, serializador de lista blanca, doble en memoria y suite de contrato. | `src/application/compartido/portal.ts`, `src/application/portal/**`, pruebas | D12 + D14 |
| I04-D | Columnas de publicación y aprobación de precio, `cambiarEstadoUnidad` único, publicación/retirada y emisión transaccional al outbox; guarda de escritor único. Requiere I00. | `src/infrastructure/db/schema.ts` (solo `units`), `drizzle/**` generado, `src/application/proyectos/**`, `src/application/pipeline/cierre.ts` y su prueba, `src/infrastructure/db/repos/proyectos.ts` y `pipeline.ts`, `src/app/api/proyectos/[id]/unidades/**`, guardas | D11 + D12 + D14 |
| I04-E | Adaptador HTTP firmado contra receptor simulado, ruta `GET /api/portal/instantanea`, contenedor y variables. | `src/infrastructure/integraciones/portal/**`, `src/infrastructure/contenedor/portal.ts`, `src/app/api/portal/**`, `src/infrastructure/env.ts` | D12 + D14 |
| I04-F | Pantallas de §8 con seis estados y cuatro anchos. | `src/app/(crm)/propiedades/**`, `src/app/(crm)/leads/**`, `src/app/(crm)/configuracion/_integraciones.tsx`, evidencia `.viltrum/` | D07 + D12 + D14 |
| I04-P | **Repositorio del Portal, no se despacha desde el CRM:** outbox y worker, payload congelado, HMAC, códigos y UTM, receptor `crm-events`, `crm_units`, retiro del escritor `availability_text`. | Los que fije el D03 del Portal con autorización de Wilber | D12 + D14, proveedor distinto del productor |

Cada lote cita esta ficha solo tras READY, va a worktree aislado con `TAREA.md`, dura como máximo 45 minutos y lo revisa otro proveedor. Ningún lote hace push.

## 10. Riesgos, licencia y plan de salida

### P0 de seguridad: secreto por defecto en el código del Portal

- **Hallazgo S1** (D19 §7): `P/server/client-api.mjs:227` contiene un valor por defecto para el token del webhook (`|| '<valor>'`). Está en HEAD y en `origin/main` desde el 2026-10-03 (commit `f48edbe`). **Esta ficha no reproduce el valor.** No se sabe si coincide con `LEADS_WEBHOOK_TOKEN` del CRM ni si el repositorio de GitHub es público (UNKNOWN); hay que tratarlo como comprometido.
- **Acción de Wilber (rotación):** (1) generar un secreto nuevo de al menos 32 bytes aleatorios fuera del repositorio y del chat; (2) fijarlo a la vez en el entorno del CRM y en el del Portal; (3) desplegar y comprobar que el valor viejo recibe 401 en el CRM, mirando solo códigos de estado; (4) confirmar que ese valor no se reutiliza en otro servicio; (5) revisar la visibilidad del repositorio en GitHub. Como el camino Portal → CRM no tiene llamador en la UI hoy (D19 §0), la ventana de corte no pierde solicitudes.
- **Retirada del fallback (lote Portal I04-P, autorización de Wilber):** leer el secreto solo del entorno y, si falta, no despachar y registrar un error sin valor. Mismo tratamiento para la URL por defecto `http://`. Reescribir el historial de Git es opcional una vez rotado, porque el valor viejo deja de servir.
- **Relacionados menores (D19 S2, S3):** credencial por defecto de PostgreSQL en `P/server/db.mjs:28` (producción exige `DATABASE_URL`) y literal `secret` en `P/scripts/data-api-grants-check.mjs:510` (sin confirmar). Se revisan en el mismo lote; no se reproducen.
- El HMAC de §3.1 corrige el diseño (S4: token capturado sirve para siempre) pero **no sustituye la rotación**.

### Otros riesgos
- **Fuga de precio real o de datos internos** por serializar la fila completa: mitigada con lista blanca y prueba centinela.
- **Divergencia de disponibilidad** si sobrevive un segundo escritor (`availability_text`, importación): mitigada con el escritor único y la instantánea.
- **Reloj desfasado** entre servidores y 401 sistemático: sincronización horaria y alerta específica.
- **PII en `crm_payload`** de la base del Portal y consentimiento inferido: retención y evidencia por definir.
- **Router de cliente del Portal montado sin condición** (`server.mjs:139-144`) mientras H3 sigue pendiente: bandera de runtime obligatoria para el receptor nuevo.
- **Slugs divergentes** entre sistemas: verificación previa a la activación.
- Licencia: código propio en ambos lados, sin dependencias nuevas de terceros.

### Plan de salida
Detener el worker del destino `portal`; el CRM conserva sus unidades, banderas y referencias; el Portal vuelve a su flujo editorial anterior para los proyectos enlazados; se sustituye el adaptador detrás de `PortalPort` o se vuelve al adaptador `local` no-op. Los eventos pendientes se conservan para conciliar.

## Evidencia

- `.viltrum/research/D19-enlace-portal-crm-2026-10-14.md` (contratos §3, modelos duplicados §4, identidades §5, seguridad §7, huecos §8). Ficha previa citada allí: `spec/inventario/cms-reutilizable.md` §3 y `spec/modulos/M01-leads.md:68,156`.
- Código del CRM leído: `src/app/api/leads/externo/route.ts` (contrato, `leadId` aditivo), `src/infrastructure/env.ts` (`leadsWebhookToken`, `crmMotor`), `src/infrastructure/db/schema.ts` (`units`, `outbox`, `external_refs`, `webhook_inbox`), `src/application/compartido/crm.ts` (patrón de puerto y fallos), `src/application/pipeline/cierre.ts:115-130`, `src/app/api/proyectos/[id]/unidades/[unitId]/route.ts`, `db/seed.sql:140`.
- Código del Portal leído (solo lectura): `server/client-api.mjs` líneas 218-295 (despacho al CRM). El secreto por defecto no se copia.
- `.viltrum/vre-os/PLAN-INTEGRAL-2026-10-14.md` §§2, 5, 6, 7; `ARQ-VRE-002-integraciones.md` §§2.4–2.6, 4; `I00-outbox-base.md`; decisiones #20, #39 y #47 en `docs/contexto/decisiones.md`.
- Sin verificar (UNKNOWN): valor y visibilidad del repositorio del token, coincidencia de slugs, puerto real del CRM en producción, filas existentes en `client_inquiries`, cierre de H3.
