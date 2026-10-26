# Quisqueya Home CRM

Repositorio de producción del CRM inmobiliario de Quisqueya Home.

El repo se construye desde cero, sobre una arquitectura hexagonal nueva, no refactorizando el prototipo. Decisión del 30 de agosto de 2026, ver `docs/contexto/decisiones.md` #11–#12.

## Qué hay en este repo

| Ruta | Qué es | Vinculante para el build nuevo |
|---|---|---|
| [`src/app/`](src/app) | Adaptador de entrada — App Router de Next.js (Server Components, route handlers) | Sí — es el código de producción |
| [`src/domain/`](src/domain) | Entidades y reglas de negocio puras, sin dependencias de framework | Sí |
| [`src/application/`](src/application) | Casos de uso y puertos (interfaces) | Sí |
| [`src/infrastructure/`](src/infrastructure) | Adaptadores concretos — Drizzle/Supabase, Supabase Auth | Sí |
| [`MAPEO_FRONTEND_CRM.md`](MAPEO_FRONTEND_CRM.md) | Mapeo exhaustivo del frontend confirmado → entidades, catálogos, reglas de negocio, cronograma (§1–20) | **Sí** — es la fuente de reglas de negocio, entidades y plan de construcción |
| [`AUDITORIA_FUNCIONAL_CRM.md`](AUDITORIA_FUNCIONAL_CRM.md) | Auditoría del prototipo frente a CRMs de referencia (jul 2026) | Sí — contexto de alcance y prioridades |
| [`docs/contexto/`](docs/contexto) | Arquitectura, convenciones, decisiones, glosario, flujo de trabajo y errores conocidos | **Sí** — léelo antes de tocar cualquier módulo |
| [`referencia-prototipo/`](referencia-prototipo) | El prototipo de alta fidelidad (Next.js + vinext + Cloudflare D1, un solo `page.tsx` de 957 líneas) | **No** — es material de consulta para ver cómo se comporta cada pantalla, no código para heredar ni extender |

## Stack de producción

- **Framework:** Next.js 15 (App Router), React 19, TypeScript 5 (`strict`).
- **Arquitectura de aplicación:** Hexagonal (Puertos y Adaptadores) — dominio puro, casos de uso + puertos, adaptadores de infraestructura y de entrada. Detalle de capas en [`docs/contexto/arquitectura.md`](docs/contexto/arquitectura.md).
- **Base de datos:** PostgreSQL vía Supabase (aún por conectar — T1). El esquema de `referencia-prototipo/db/schema.ts` (29 tablas, SQLite/D1) conserva su modelado y sus convenciones, pero debe portarse a `pgTable`.
- **Autenticación:** Supabase Auth (aún por conectar — T2).
- **Hosting:** VPS propio en Hostinger — mecanismo de deploy aún por definir (T8).

Scaffold (T0) listo: proyecto Next.js + TypeScript compila, lintea y buildea. Ver el estado de cada capa en [`docs/contexto/decisiones.md`](docs/contexto/decisiones.md).

## Desarrollo local

```bash
npm install
npm run dev        # http://localhost:3000
npm run typecheck
npm run lint
npm run build
npm test
```

## Cómo se organiza el trabajo

El cronograma vive en los **Milestones** de este repositorio (F0…F5, QA), y cada módulo o capa (`M1`…`M15`, `T0`…`T10` de `MAPEO_FRONTEND_CRM.md` §11–§12) es un **Issue** con su label de código, tamaño y dependencias. Antes de tomar un issue:

1. Lee `docs/contexto/flujo-de-trabajo.md`.
2. Revisa la fila de ese código en `MAPEO_FRONTEND_CRM.md` §18 para saber qué tablas y qué carpeta de ruta te corresponden.
3. Confirma en el issue que sus dependencias ya cerraron antes de asignártelo.

Fecha de entrega: **23 de noviembre de 2026** (12 semanas: 10 de construcción + 2 de QA).
