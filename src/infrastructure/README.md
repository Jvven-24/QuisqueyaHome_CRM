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
- `page-guard.ts` — la misma autorización, pero para páginas: `forbidden()` de
  Next produce un 403 real, mientras que dejar escapar la excepción produce un
  500 con la pantalla de error genérica.
- `http.ts` — traduce errores de dominio a códigos HTTP y valida la entrada.
- `audit.ts` — escribe en `audit_log` (T6): `auditar(tx, actor, { accion,
  entidad, entidadId, antes, despues })`. Recibe la transacción a propósito, no
  abre la suya: la escritura de auditoría va **dentro** de la misma
  transacción que el cambio, nunca después (§18.1 / criterio de terminado #2).

## El patrón que sigue cada módulo

**Lecturas** desde componentes de servidor; **escrituras** por route handlers
(`MAPEO_FRONTEND_CRM.md` §20.2).

Leer (ver cualquier `src/app/(crm)/*/page.tsx`):

```ts
const actor = await requireActor();
const scope = requireScopeInPage(actor, "contacts", "view");
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

Escribir con auditoría (T6), dentro de la misma transacción que el cambio:

```ts
await transaction(async (tx) => {
  const [contacto] = await tx.insert(contacts).values(datos).returning();
  await auditar(tx, actor, {
    accion: "crear",
    entidad: "contact",
    entidadId: contacto.id,
    despues: contacto,
  });
  return contacto;
});
```

`requireScopeInPage` en páginas, `requireScope` en route handlers: la decisión de
permiso es la misma, cambia cómo se presenta la negativa (403 con pantalla vs.
403 con JSON).

**No hay repositorios ni puertos todavía, y es a propósito.** Un puerto con una
implementación y ningún consumidor es código muerto con nombre elegante. Nacen
en F1, con el caso de uso que los necesite.

Ver `docs/contexto/arquitectura.md`.
