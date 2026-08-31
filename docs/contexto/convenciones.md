# Convenciones — CRM Quisqueya Home

## Estilo de código
- TypeScript **strict** (`tsconfig.json`), `moduleResolution: bundler`, alias `@/*` → raíz.
- Componentes marcados `"use client"` explícitamente cuando usan estado/eventos (ver cabecera de `app/page.tsx`); `app/layout.tsx` es Server Component (sin la directiva).
- Tipos con `type`, no `interface`, para modelos de dominio (`type Role`, `type Stage`, `type Lead`, `type Appointment`).
- Uniones de string literal para catálogos cerrados en frontend (`Role`, `ModuleId`, `Stage`) — el equivalente en `db/schema.ts` usa arrays `as const` (`STAGE_KINDS`, `PERMISSION_ACTIONS`, `PERMISSION_SCOPES`) en vez de enums de SQLite.
- Funciones auxiliares puras y con nombre descriptivo en minúscula camelCase (`appointmentDates`, `googleCalendarUrl`, `exportCalendar`).

## Naming
- Identificadores de código en **inglés** (`db/schema.ts`, tipos, ids de módulo); texto visible al usuario en **español** (labels, mensajes, catálogos editables).
- Tablas y columnas Drizzle en `snake_case` en SQL, `camelCase` en TS (convención estándar de Drizzle).
- Dinero: siempre `*_cents` entero — **nunca punto flotante** para importes.
- Porcentajes de dinero: puntos básicos enteros (`450` = 4.5%).
- Teléfonos: E.164 en `phone`, formato mostrado al usuario en `phone_display` aparte.
- Fechas: texto ISO-8601 **UTC**, incluidos los defaults de la base (`CURRENT_TIMESTAMP` de SQLite y la app deben coincidir en formato — ver errores-conocidos.md). Conversión a `America/Santo_Domingo` solo en la capa de aplicación.
- `updated_at` se actualiza vía `$onUpdate` de Drizzle (SQLite no tiene `ON UPDATE`).
- Recursos/entidades como listas cerradas (`PERMISSION_RESOURCES`, `ENTITY_TYPES`), no strings libres — evita que `"Leads"` vs `"leads"` rompa un permiso en silencio.

## Patrones que usamos
- Etapas de pipeline como **tabla configurable** (`pipeline_stages`), no enum fijo — `kind` (`open`/`won`/`lost`) es lo que enganchan las reglas de negocio, nunca el nombre visible.
- Permisos como **recurso + acción + alcance** (`permissions(role_id, resource, action, scope)`), con `scope="own"` reemplazando comparaciones de string por nombre.
- Índices únicos parciales `WHERE deleted_at IS NULL` para soportar papelera sin bloquear reutilización de email/teléfono.
- Campos transversales en toda tabla operativa: `id`, `created_at`, `updated_at`, `created_by`, `updated_by`, `deleted_at` donde aplique.

## Prohibido / a evitar
- Coma flotante para dinero o comisiones.
- Claves foráneas cíclicas: `deals.next_activity_id` y `leads.converted_deal_id` se resuelven en la aplicación, no con FK.
- Filtrado por rol comparando strings de nombre (patrón actual del frontend con `broker === "Yostar Medina"`) — se reemplaza por `scope=own` centralizado en RBAC.
- Que cada módulo implemente su propio filtro de permisos — la consulta filtrada vive en un solo lugar (capa RBAC).
- Modificar `db/schema.ts` fuera de un PR dedicado con su migración generada (ver flujo-de-trabajo.md) — está declarado "congelado".

## Tests
- Único archivo hoy: `tests/rendered-html.test.mjs`, usando `node:test` + `node:assert/strict` (sin framework externo).
- `npm test` = `npm run build && node --test tests/rendered-html.test.mjs` — el test corre contra el **build**, no contra fuente (importa `dist/server/index.js`).
- Dos pruebas existentes: (1) smoke test de render del login (status 200, `<title>`, ausencia de `screen.png`/`iframe`); (2) verificación de que los 14 módulos y los hooks de integración (Google Calendar, `.ics`, WhatsApp) siguen presentes en `app/page.tsx` vía regex sobre el archivo fuente.
- [PENDIENTE: convención de tests para el backend/DB que se construya — no hay precedente en el repo].

## Commits
Solo 2 commits en el historial, autor único (`Jvven <jevenssenmartinezm24@gmail.com>`):
- `Deploy Quisqueya CRM preview` — scaffold inicial.
- `Build functional Quisqueya Home CRM prototype` — construcción del prototipo funcional.

Mensajes en inglés, imperativo, sin prefijo tipo Conventional Commits. [PENDIENTE: no hay suficiente historial para confirmar si esto es una convención deliberada o solo el estilo del único autor hasta ahora].
