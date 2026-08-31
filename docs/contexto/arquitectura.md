# Arquitectura — CRM Quisqueya Home

## Qué es esto
Prototipo de alta fidelidad del CRM inmobiliario de Quisqueya Home. Hoy es **una sola pantalla cliente** (`app/page.tsx`, 956 líneas) sin backend real ni persistencia. El repo también contiene el esquema de base de datos ya diseñado (no desplegado) para la siguiente fase.

> **Este `CRM/` es solo el prototipo.** El repositorio de producción todavía no se ha creado (decisión del 30 de agosto de 2026, mientras se trabaja el cronograma). Las secciones "Stack objetivo" y "Arquitectura objetivo" describen la decisión tomada para ese repositorio nuevo, no lo que hay hoy en este código. El resto del documento (mapa de carpetas, flujo de datos, qué no existe) describe el prototipo actual tal cual está.

## Stack objetivo (decidido, repo de producción — aún no creado)
- **Framework:** Next.js (App Router), React, TypeScript.
- **Arquitectura de aplicación:** Hexagonal (Puertos y Adaptadores) — ver sección siguiente.
- **Base de datos:** PostgreSQL vía **Supabase**.
- **ORM:** Drizzle (se mantiene del prototipo, pero apuntando a Postgres/Supabase en vez de SQLite/D1).
- **Hosting:** VPS propio en **Hostinger** — reemplaza el runtime de Cloudflare Workers del prototipo. Esto implica que `wrangler`, `vinext`, `.openai/hosting.json` y los bindings D1/R2 **no aplican** al repo de producción.
- **Autenticación:** Supabase Auth (integrada con la base de datos elegida — ver decisiones.md #12).
- Elección de Supabase y Hostinger por confianza y experiencia previa del desarrollador con ambas plataformas, no por comparación técnica formal (detalle en decisiones.md #12).
- [PENDIENTE: proceso de deploy hacia el VPS de Hostinger — se está definiendo en paralelo como parte del cronograma general del proyecto, en otra sesión de trabajo].

## Arquitectura objetivo: Hexagonal (Puertos y Adaptadores)
Decisión tomada el 30 de agosto de 2026. Objetivo: aislar las reglas de negocio del CRM (lo documentado en `MAPEO_FRONTEND_CRM.md` y `AUDITORIA_FUNCIONAL_CRM.md`) de Next.js, Drizzle y Supabase, para poder testear el dominio sin infraestructura y para poder cambiar de proveedor (ej. Hostinger → otro VPS, o Supabase → otro Postgres) sin tocar la lógica de negocio.

Capas propuestas (nomenclatura de referencia — [PENDIENTE: confirmar convención exacta de carpetas cuando se cree el repo]):
- **Dominio (`domain/`):** entidades y reglas de negocio puras, sin dependencias de framework — ej. `Lead`, `Deal`, transiciones de etapa válidas (`MAPEO_FRONTEND_CRM.md` §10.1), reglas de cierre transaccional (§10.2). TypeScript puro, sin imports de Next.js, Drizzle ni Supabase.
- **Aplicación (`application/`):** casos de uso (ej. "crear lead", "mover negocio de etapa", "cerrar negocio") y los **puertos** (interfaces) que esos casos de uso necesitan — ej. `LeadRepository`, `NotificationGateway`, `AuthProvider`. Los casos de uso dependen de interfaces, nunca de Drizzle o Supabase directamente.
- **Adaptadores de infraestructura (`infrastructure/`):** implementaciones concretas de los puertos — repositorios con Drizzle sobre Postgres/Supabase, adaptador de autenticación, adaptador de integraciones externas (Google Calendar, WhatsApp, etc. de `AUDITORIA_FUNCIONAL_CRM.md` §6).
- **Adaptadores de entrada (`app/` de Next.js):** App Router, Server Components y route handlers como adaptadores que invocan los casos de uso de `application/` — coherente con la recomendación ya documentada en decisiones.md (lecturas por Server Components, escrituras por route handlers), ahora enmarcada explícitamente como el adaptador de entrada del hexágono.

Esto reemplaza, para el repo de producción, la decisión pendiente #9 de decisiones.md ("Server Components + route handlers" sin marco arquitectónico explícito) — ese patrón se conserva, pero ahora vive dentro de la capa de adaptadores de entrada de la arquitectura hexagonal.

## Stack del prototipo actual (`CRM/`, en este repo)
- **Framework:** Next.js 16.2.6 (App Router) sobre **vinext** (`vinext dev|build|start`), runtime Cloudflare Workers.
- **UI:** React 19.2.6, TypeScript 5.9.3 (`strict: true`), Tailwind CSS 4.2.1 vía `@tailwindcss/postcss`.
- **Datos:** Drizzle ORM 0.45.2 sobre Cloudflare D1 (`db/schema.ts`, `db/index.ts`). **D1 aún no está enlazado**: `.openai/hosting.json` tiene `"d1": null, "r2": null`.
- **Build/deploy:** `wrangler` 4.92.0, `@cloudflare/vite-plugin`, Vite 8.
- **Fuentes:** Hanken Grotesk + Atkinson Hyperlegible Next (`next/font/google`, ver [layout.tsx](../../app/layout.tsx)).
- **Lint:** ESLint 9 con `eslint-config-next` (core-web-vitals + typescript).
- **Node:** `>=22.13.0`.

Nota: el esquema `db/schema.ts` (29 tablas, ver decisiones.md) está escrito para SQLite/D1 (`sqliteTable`). Al migrar a Postgres/Supabase para el repo de producción, ese esquema debe reescribirse con las primitivas Postgres de Drizzle (`pgTable`) — las decisiones de modelado (tablas, relaciones, convenciones de dinero/fechas/teléfonos) se conservan, pero la sintaxis del esquema no es portable tal cual.

## Mapa de carpetas (CRM/)
```
app/               UI actual — page.tsx (single client component), layout.tsx, chatgpt-auth.ts, globals.css
db/                schema.ts (29 tablas Drizzle, ver decisiones.md), index.ts (getDb() con binding D1)
drizzle/           migración generada (0000_adorable_forge.sql) — no aplicada, no comiteada aún
examples/d1/       ejemplo de route handler con D1 + Drizzle (patrón de referencia para T7)
worker/            entry point del Worker de Cloudflare (index.ts) — sirve la app + optimización de imágenes
public/stitch/     capturas y HTML de referencia de diseño (Stitch) por pantalla — material de diseño, no código en producción
tests/             rendered-html.test.mjs — únicos tests existentes
.openai/hosting.json  config del binding D1/R2 (ambos null hoy)
AUDITORIA_FUNCIONAL_CRM.md   auditoría del prototipo vs. CRMs de referencia (jul 2026)
MAPEO_FRONTEND_CRM.md        mapeo exhaustivo frontend → entidades/reglas (ago 2026) — documento vinculante para el backend
```
Fuera de `CRM/`, el resto del repositorio (`Pagina_web/`, `Diseno_Figma/`, `Propuesta/`, PDFs sueltos) son documentos de especificación y diseño, no código ejecutable.

## Flujo de datos (estado actual)
Todo vive en `useState` dentro de `app/page.tsx`: 12 estados en el componente raíz (leads, citas, avance de obra, permisos, Academy, rol activo, etc.). No hay fetch a servidor, no hay rutas por módulo — la navegación es un `active: ModuleId` que conmuta el render. **Recargar la página borra todo.**

Flujo previsto (documentado, no implementado): lecturas desde componentes de servidor + escrituras por route handlers (ver `examples/d1/app/api/notes/route.ts` como prueba de patrón), contra D1 vía `getDb()` en `db/index.ts`.

## Qué NO existe (verificado en código)
- Backend/API real: no hay `app/api/**` en producción (solo el ejemplo en `examples/d1/`).
- Autenticación: `setLoggedIn(true)` sin validar nada; el rol se elige desde un selector.
- Persistencia: `db/schema.ts` está escrito pero **no comiteado** (`git status` lo marca modificado) y D1 no está enlazado.
- Rutas por módulo (todo es un solo componente cliente).
- Tests más allá de `tests/rendered-html.test.mjs` (smoke test de render + presencia de módulos).
- Auditoría, papelera, importación CSV, MFA, recuperación de contraseña.

[PENDIENTE: URL o entorno de despliegue actual (staging/producción) — no se encontró en el repo].
