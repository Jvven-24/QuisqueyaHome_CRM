# infrastructure/

Adaptadores concretos: lo que habla con Postgres, con Supabase y con HTTP.

- `env.ts` — el único sitio donde se leen variables de entorno. Contrato en
  `.env.example`.
- `db/schema.ts` — el esquema Drizzle sobre Postgres (T1). **Congelado**: todo
  cambio va en su propio PR con la migración generada (§18.1).
- `db/client.ts` — la única conexión a la base y el helper de transacción (T4).
  Ningún módulo abre su propia conexión.
- `auth/supabase.ts` — clientes de Supabase Auth para servidor y navegador (T2).
- `auth/actor.ts` — cruza la sesión de Supabase con `users` y sus permisos, una
  vez por petición. Es lo que convierte "hay sesión" en "quién es y qué puede".
- `rbac-filter.ts` — traduce el alcance de T3 a condiciones SQL. **El único
  lugar donde se escribe el filtro por responsable** (§18.1): si un módulo
  escribe su propio `WHERE broker_id = ?`, la seguridad deja de ser auditable.
- `http.ts` — traduce errores de dominio a códigos HTTP y valida la entrada.

## El patrón que sigue cada módulo

**Lecturas** desde componentes de servidor; **escrituras** por route handlers
(`MAPEO_FRONTEND_CRM.md` §20.2).

Leer (ver cualquier `src/app/(crm)/*/page.tsx`):

```ts
const actor = await requireActor();
const scope = requireScope(actor, "contacts", "view");
const filas = await getDb()
  .select()
  .from(contacts)
  .where(visibleRows(actor, scope, contacts.brokerId, contacts.deletedAt));
```

Escribir (ver `src/app/api/auth/login/route.ts`):

```ts
try {
  const datos = parseInput(EsquemaZod, await request.json());
  const actor = await requireActor();
  requireScope(actor, "contacts", "create");
  // … trabajo, en `transaction()` si toca más de una tabla
  return Response.json({ ok: true });
} catch (error) {
  return errorResponse(error);
}
```

**No hay repositorios ni puertos todavía, y es a propósito.** Un puerto con una
implementación y ningún consumidor es código muerto con nombre elegante. Nacen
en F1, con el caso de uso que los necesite.

Ver `docs/contexto/arquitectura.md`.
