# infrastructure/

Implementaciones concretas de los puertos definidos en `application/ports/`.

- `db/` — repositorios con Drizzle sobre Postgres/Supabase.
- `auth/` — adaptador de autenticación sobre Supabase Auth.

Cuando haga falta un adaptador para una integración externa (Google Calendar, WhatsApp — ver `AUDITORIA_FUNCIONAL_CRM.md` §6), va aquí también, en su propia carpeta.

Ver `docs/contexto/arquitectura.md`.
