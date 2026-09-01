# domain/

Entidades, catálogos y reglas de negocio puras. Sin imports de Next.js, Drizzle
ni Supabase — TypeScript plano, testeable sin infraestructura.

Qué vive aquí hoy:

- `catalogs.ts` — las listas cerradas del vocabulario del sistema (recursos,
  acciones, alcances, estados). El esquema las importa para tipar sus columnas:
  la dependencia va de infraestructura a dominio, nunca al revés.
- `errors.ts` — los errores que lanzan las reglas y los casos de uso. Un caso de
  uso nunca lanza un `Error` genérico: cada adaptador traduce estos una vez
  (`infrastructure/http.ts`).
- `rbac.ts` — resolución de permisos (T3). Decide **si** se puede y **con qué
  alcance**; traducir ese alcance a SQL es cosa de
  `infrastructure/rbac-filter.ts`.

Pendiente de F1: transiciones de etapa válidas (`MAPEO_FRONTEND_CRM.md` §10.1) y
las reglas del cierre transaccional (§10.2).

## Cómo se prueban

```bash
npm test
```

Corre con el runner de Node sobre los `.ts` directamente, sin compilar y sin
instalar ningún framework de pruebas. Es el pago concreto de la arquitectura
hexagonal: las reglas de negocio se verifican sin base de datos, sin servidor y
sin navegador.

**Por eso los imports dentro de `domain/` llevan la extensión `.ts`** — Node la
exige para resolver módulos, y TypeScript lo permite vía
`allowImportingTsExtensions`. Es la única carpeta con esa regla; el resto del
código usa el alias `@/`.

Dos consecuencias de que el dominio corra con el borrado de tipos de Node:

- Nada de propiedades de parámetro en constructores (`constructor(private x)`).
  Declara el campo aparte.
- Nada de `enum` ni `namespace`. Usa `as const` y uniones, como en `catalogs.ts`.

Ver `docs/contexto/arquitectura.md`.
