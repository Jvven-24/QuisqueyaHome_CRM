-- Seeds de catálogos (T1) — CRM Quisqueya Home
--
-- Idempotente: correrlo dos veces no duplica nada. Los permisos se reafirman en
-- cada corrida (ON CONFLICT DO UPDATE) porque esta matriz **es** la seguridad
-- del sistema: si alguien la cambia a mano en la base, la siguiente corrida la
-- devuelve a lo que dice este archivo, que es lo revisado en el PR.
--
-- Alcances según MAPEO_FRONTEND_CRM.md §10.4:
--   - El broker solo ve contactos, leads, negocios, propiedades y actividades
--     donde es responsable  → scope 'own'.
--   - `unit_real_price` y `global_metrics` son permisos aparte, no van al broker.
--   - Los permisos del rol administrador no son editables → roles.is_protected.

BEGIN;

/* ---------------------------------------------------------------- Roles -- */

INSERT INTO roles (slug, name, description, is_protected) VALUES
  ('admin',     'Administrador', 'Acceso total. Sus permisos no son editables.', true),
  ('assistant', 'Asistente',     'Apoya la operación comercial completa, sin configuración ni precios internos.', false),
  ('broker',    'Broker',        'Ve y trabaja únicamente su propia cartera.', false)
ON CONFLICT (slug) DO UPDATE
  SET name = EXCLUDED.name,
      description = EXCLUDED.description,
      is_protected = EXCLUDED.is_protected;

/* ----------------------------------------------------------- Permisos -- */

-- Administrador: todo sobre todo. Se genera cruzando recursos por acciones en
-- vez de escribir 126 filas a mano.
INSERT INTO permissions (role_id, resource, action, scope)
SELECT r.id, recurso, accion, 'all'
FROM roles r
CROSS JOIN unnest(ARRAY[
  'dashboard','leads','contacts','deals','activities','projects','units',
  'unit_real_price','construction_phases','brokers','academy','goals',
  'commissions','communications','reports','global_metrics','settings',
  'users','roles','audit_log','integrations'
]) AS recurso
CROSS JOIN unnest(ARRAY['view','create','edit','delete','import','export']) AS accion
WHERE r.slug = 'admin'
ON CONFLICT (role_id, resource, action) DO UPDATE SET scope = EXCLUDED.scope;

-- Asistente: opera todo el ciclo comercial sobre la cartera completa, pero no
-- borra, no configura y no ve precios internos ni métricas globales.
INSERT INTO permissions (role_id, resource, action, scope)
SELECT r.id, v.resource, v.action, v.scope
FROM roles r
CROSS JOIN (VALUES
  ('dashboard','view','all'),
  ('leads','view','all'), ('leads','create','all'), ('leads','edit','all'),
  ('leads','import','all'), ('leads','export','all'),
  ('contacts','view','all'), ('contacts','create','all'), ('contacts','edit','all'),
  ('contacts','import','all'), ('contacts','export','all'),
  ('deals','view','all'), ('deals','create','all'), ('deals','edit','all'),
  ('deals','export','all'),
  ('activities','view','all'), ('activities','create','all'), ('activities','edit','all'),
  ('projects','view','all'), ('projects','create','all'), ('projects','edit','all'),
  ('units','view','all'), ('units','create','all'), ('units','edit','all'),
  ('construction_phases','view','all'), ('construction_phases','edit','all'),
  ('brokers','view','all'),
  ('academy','view','all'),
  ('goals','view','all'),
  ('commissions','view','all'),
  ('communications','view','all'), ('communications','create','all'),
  ('communications','edit','all'),
  ('reports','view','all'), ('reports','export','all')
) AS v(resource, action, scope)
WHERE r.slug = 'assistant'
ON CONFLICT (role_id, resource, action) DO UPDATE SET scope = EXCLUDED.scope;

-- Broker: alcance 'own' en todo lo comercial. Academy es 'all' porque la
-- formación es para todos. Sin acceso a precios internos, métricas globales,
-- configuración, usuarios, auditoría ni integraciones — la ausencia de fila ya
-- significa 'none', pero aquí se ve de un vistazo qué no tiene.
INSERT INTO permissions (role_id, resource, action, scope)
SELECT r.id, v.resource, v.action, v.scope
FROM roles r
CROSS JOIN (VALUES
  ('dashboard','view','own'),
  ('leads','view','own'), ('leads','create','own'), ('leads','edit','own'),
  ('contacts','view','own'), ('contacts','create','own'), ('contacts','edit','own'),
  ('deals','view','own'), ('deals','create','own'), ('deals','edit','own'),
  ('activities','view','own'), ('activities','create','own'), ('activities','edit','own'),
  ('projects','view','own'),
  ('units','view','own'),
  ('construction_phases','view','own'),
  ('brokers','view','own'),
  ('academy','view','all'),
  ('goals','view','own'),
  ('commissions','view','own'),
  ('communications','view','all'), ('communications','create','own')
) AS v(resource, action, scope)
WHERE r.slug = 'broker'
ON CONFLICT (role_id, resource, action) DO UPDATE SET scope = EXCLUDED.scope;

/* --------------------------------------------- Etapas del pipeline -- */

-- Seis etapas abiertas más la salida lateral 'Perdido' (regla R1, §7).
-- `kind` es lo que leen las reglas de negocio: el administrador puede renombrar
-- una etapa sin romper nada (decisión #1).
INSERT INTO pipeline_stages (slug, name, position, kind, default_probability) VALUES
  ('nuevo',        'Nuevo',        1, 'open', 10),
  ('contactado',   'Contactado',   2, 'open', 25),
  ('presentacion', 'Presentación', 3, 'open', 40),
  ('preseleccion', 'Preselección', 4, 'open', 60),
  ('negociacion',  'Negociación',  5, 'open', 80),
  ('cierre',       'Cierre',       6, 'won',  100),
  ('perdido',      'Perdido',      7, 'lost', 0)
ON CONFLICT (slug) DO UPDATE
  SET name = EXCLUDED.name,
      position = EXCLUDED.position,
      kind = EXCLUDED.kind;

/* ------------------------------------------- Motivos de pérdida -- */

-- Obligatorio al mover un negocio a una etapa 'lost' (§10.1). Alimenta el
-- reporte "Motivos de pérdida", que hoy muestra cifras literales.
INSERT INTO loss_reasons (slug, name, position) VALUES
  ('precio',           'Precio fuera de presupuesto', 1),
  ('otra_opcion',      'Eligió otra opción',          2),
  ('sin_financiamiento','No consiguió financiamiento', 3),
  ('sin_respuesta',    'Dejó de responder',           4),
  ('zona',             'Zona no deseada',             5),
  ('solo_consultaba',  'Solo consultaba',             6),
  ('otro',             'Otro',                        7)
ON CONFLICT (slug) DO UPDATE
  SET name = EXCLUDED.name, position = EXCLUDED.position;

/* ------------------------------------------ Canales de captación -- */

-- Alimenta el reporte "Leads por canal". Meta Lead Ads queda sembrado pero
-- inactivo: la integración entra en una fase posterior.
INSERT INTO lead_sources (slug, name, position, is_active) VALUES
  ('youtube',       'YouTube',           1, true),
  ('instagram',     'Instagram',         2, true),
  ('facebook',      'Facebook',          3, true),
  ('whatsapp',      'WhatsApp',          4, true),
  ('referido',      'Referido',          5, true),
  ('portal_web',    'Portal web',        6, true),
  ('llamada',       'Llamada directa',   7, true),
  ('meta_lead_ads', 'Meta Lead Ads',     8, false)
ON CONFLICT (slug) DO UPDATE
  SET name = EXCLUDED.name, position = EXCLUDED.position;

/* ---------------------------------------------- Storage (M6, decisión #33) -- */

-- Bucket privado para fotos de obra: nada se filtra antes de publicarse desde
-- la fase (`is_published`). La subida y las URLs firmadas las genera el
-- servidor con `adminClient()` (`infrastructure/auth/supabase.ts`); el bucket
-- en sí solo hace falta que exista una vez, de ahí el `ON CONFLICT DO NOTHING`.
INSERT INTO storage.buckets (id, name, public)
VALUES ('avances-obra', 'avances-obra', false)
ON CONFLICT (id) DO NOTHING;

COMMIT;
