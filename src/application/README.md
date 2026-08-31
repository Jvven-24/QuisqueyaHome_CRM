# application/

Casos de uso (`use-cases/`) y los puertos — interfaces — que necesitan (`ports/`). Los casos de uso dependen de interfaces, nunca de Drizzle o Supabase directamente.

Ejemplos de casos de uso: "crear lead", "mover negocio de etapa", "cerrar negocio".
Ejemplos de puertos: `LeadRepository`, `NotificationGateway`, `AuthProvider`.

Ver `docs/contexto/arquitectura.md`.
