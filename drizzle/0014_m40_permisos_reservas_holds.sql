-- M40 · Reservas y holds: el RBAC no tenía ninguna fila de `reservations` ni de
-- `holds`, así que hasta el Administrador veía "Sin permiso" (auditoría 27/10/2026).
-- Admin y asistente: alcance `all`; broker: solo lo propio. Idempotente.
INSERT INTO "permissions" ("role_id", "resource", "action", "scope")
SELECT r."id", v."resource", v."action", v."scope"
FROM (VALUES
  ('admin','holds','view','all'), ('admin','holds','create','all'), ('admin','holds','edit','all'), ('admin','holds','delete','all'),
  ('admin','reservations','view','all'), ('admin','reservations','create','all'), ('admin','reservations','edit','all'), ('admin','reservations','delete','all'),
  ('assistant','holds','view','all'), ('assistant','holds','create','all'), ('assistant','holds','edit','all'),
  ('assistant','reservations','view','all'), ('assistant','reservations','create','all'), ('assistant','reservations','edit','all'),
  ('broker','holds','view','own'), ('broker','holds','create','own'), ('broker','holds','edit','own'),
  ('broker','reservations','view','own'), ('broker','reservations','create','own')
) AS v("slug", "resource", "action", "scope")
JOIN "roles" r ON r."slug" = v."slug"
ON CONFLICT ("role_id", "resource", "action") DO NOTHING;
