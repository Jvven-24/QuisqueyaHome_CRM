-- Fase 3 · aplicar únicamente tras respaldo. Reejecutable sin alterar concesiones existentes.
CREATE TABLE IF NOT EXISTS "user_permission_overrides" (
  "id" serial PRIMARY KEY,
  "user_id" integer NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "resource" text NOT NULL,
  "action" text NOT NULL CHECK ("action" IN ('view','create','edit','delete','import','export')),
  "scope" text NOT NULL CONSTRAINT "user_permission_overrides_scope_check" CHECK ("scope" IN ('none','own','team','all')),
  "granted_by" integer NOT NULL REFERENCES "users"("id"),
  "reason" text NOT NULL CONSTRAINT "user_permission_overrides_reason_check" CHECK (length(btrim("reason")) > 0),
  "created_at" timestamptz NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "user_permission_overrides_cell_unq" ON "user_permission_overrides" ("user_id", "resource", "action");
--> statement-breakpoint
ALTER TABLE "user_permission_overrides" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "manager_scopes" (
  "manager_id" integer NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "team_id" integer NOT NULL REFERENCES "teams"("id") ON DELETE CASCADE,
  CONSTRAINT "manager_scopes_pk" PRIMARY KEY ("manager_id", "team_id")
);
--> statement-breakpoint
ALTER TABLE "manager_scopes" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
INSERT INTO "roles" ("slug", "name", "description", "is_protected", "is_active")
VALUES ('manager', 'Gerente/Supervisor', 'Supervisión de equipos comerciales', false, true)
ON CONFLICT ("slug") DO NOTHING;
--> statement-breakpoint
-- Edición de leads conserva la guarda existente de reasignación (requiere all).
INSERT INTO "permissions" ("role_id", "resource", "action", "scope")
SELECT r.id, p.resource, p.action, 'team'
FROM "roles" r CROSS JOIN (VALUES
 ('dashboard','view'), ('brokers','view'),
 ('leads','view'), ('leads','create'), ('leads','edit'),
 ('contacts','view'), ('contacts','create'), ('contacts','edit'),
 ('deals','view'), ('deals','create'), ('deals','edit'),
 ('activities','view'), ('activities','create'), ('activities','edit'),
 ('projects','view'), ('projects','create'), ('projects','edit'),
 ('units','view'), ('units','create'), ('units','edit'),
 ('goals','view'), ('goals','edit'), ('commissions','view'), ('reservations','view')
) AS p(resource, action)
WHERE r.slug = 'manager'
ON CONFLICT ("role_id", "resource", "action") DO NOTHING;
