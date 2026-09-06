# Arquitectura — CRM Quisqueya Home

Describe el **repositorio de producción**, al cierre de F0 (1 de septiembre de
2026). El prototipo (Next sobre `vinext`, Cloudflare Workers, D1, Tailwind) vive
congelado en `referencia-prototipo/` como material de consulta y **no aplica a
nada de aquí**.

## Stack

- **Framework:** Next.js 15 (App Router), React 19, TypeScript estricto.
- **Base de datos:** PostgreSQL vía **Supabase**. ORM **Drizzle** (`pgTable`)
  sobre `postgres-js`.
- **Autenticación:** Supabase Auth con `@supabase/ssr` (decisión #12).
- **Validación:** Zod.
- **Hosting:** VPS propio en Hostinger. El despliegue se hace **al final, en una
  sola operación** (decisión #17): hoy no existen staging ni producción, y es
  deliberado.
- **Node:** `>=22.13.0`. Sin Tailwind, sin librería de UI, sin framework de
  pruebas.

## Arquitectura de aplicación: hexagonal, con la dosis justa

Tres carpetas bajo `src/`, y la dependencia va siempre de infraestructura a
dominio:

- **`domain/`** — reglas puras. No importa Next, ni Drizzle, ni Supabase, y por
  eso se prueba entero sin levantar nada.
  - `catalogs.ts` — listas cerradas (recursos, acciones, alcances, entidades,
    estados). El esquema las importa para tipar sus columnas.
  - `rbac.ts` — la decisión de permiso: `scopeFor`, `can`, `requireScope`,
    `reaches`, `stripRestrictedPrices`.
  - `errors.ts` — `ValidationError`, `ForbiddenError`, `UnauthorizedError`,
    `NotFoundError`, `ConflictError`.
- **`application/`** — casos de uso. **Hoy casi vacío, a propósito**
  (decisión #16): un puerto con una implementación y ningún consumidor es código
  muerto con nombre elegante. Se estrena en F1 con la lógica que se prueba sin
  HTTP —transición de etapa y cierre transaccional—, no con un repositorio por
  tabla.
- **`infrastructure/`** — adaptadores concretos:
  - `env.ts` — el único sitio donde se leen variables de entorno.
  - `db/schema.ts` — 29 tablas sobre Postgres. **Congelado** (§18.1).
  - `db/client.ts` — la única conexión (`getDb`) y `transaction()`.
  - `auth/supabase.ts` — clientes de Supabase Auth para servidor y navegador.
  - `auth/actor.ts` — cruza la sesión de Supabase con `users` y sus permisos, una
    vez por petición. Convierte «hay sesión» en «quién es y qué puede».
  - `rbac-filter.ts` — traduce el alcance a SQL (`visibleRows`). **El único sitio
    donde se escribe el filtro por responsable.**
  - `page-guard.ts` — la misma autorización para páginas: `forbidden()` de Next
    da un 403 real, mientras que dejar escapar la excepción da un 500.
  - `http.ts` — errores de dominio → códigos HTTP, y `parseInput` para validar.
- **`app/`** — el adaptador de entrada: App Router. `(crm)/` es el grupo de rutas
  con el shell y una carpeta por módulo; `api/` los route handlers.

## El patrón que sigue cada módulo

**Lecturas desde componentes de servidor, escrituras por route handlers**
(§20.2, decisión #9). Los ejemplos vivos están en `src/infrastructure/README.md`
y en `src/app/(crm)/contactos/page.tsx`.

Tres reglas que sostienen el criterio de terminado #1:

1. El permiso se comprueba **en servidor, siempre**: `requireScopeInPage` en
   páginas, `requireScope` en route handlers. Ocultar un botón no es seguridad.
2. Nadie escribe su propio filtro por responsable — se usa `visibleRows`.
3. Nadie abre su propia conexión ni lee `process.env` por su cuenta.

## Mapa de carpetas

```
src/domain/            reglas puras y catálogos cerrados (se prueban sin infraestructura)
src/application/       casos de uso — se llena en F1, no antes
src/infrastructure/    Postgres, Supabase, RBAC en SQL, errores HTTP
src/app/               App Router: (crm)/ con los 15 módulos, api/, login/, forbidden.tsx
src/middleware.ts      rutas privadas por defecto
db/seed.sql            catálogos que definen el comportamiento (roles, permisos, etapas…)
drizzle/               migración generada, aplicada en Supabase
scripts/               seed idempotente y fixtures de desarrollo
docs/                  análisis y estado por fase, despliegue, Supabase, y este contexto
referencia-prototipo/  el prototipo congelado — consulta, no código de producción
MAPEO_FRONTEND_CRM.md  documento vinculante del backend
```

## Qué NO existe todavía (verificado en el repositorio)

- **Estilos.** No hay `globals.css`: el shell pinta clases que aún no existen.
  Es T5, primer paso de F1.
- **Escritura en `audit_log`.** La tabla está, nadie escribe en ella. Es T6.
- **Consultas reales de negocio.** Los 15 módulos son páginas con guardia de
  permiso y un texto de «pendiente». Es F1 en adelante.
- **Entornos de staging y producción, respaldos probados y monitoreo.** Es T8,
  aplazado a la entrega por decisión #17.
- **Altas de usuario desde la aplicación.** Hoy son manuales (Supabase Auth +
  `INSERT` en `users`) hasta M13, en F2. Documentado en `docs/SUPABASE.md` §5.
