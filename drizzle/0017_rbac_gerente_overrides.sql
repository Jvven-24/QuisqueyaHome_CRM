-- RBAC fase 2: rol Gerente/Supervisor, sobrescrituras por usuario y supervisión de equipos.
INSERT INTO "roles" ("slug","name","description","is_protected")
SELECT 'manager','Gerente/Supervisor','Supervisa a los brokers de sus equipos',false
WHERE NOT EXISTS (SELECT 1 FROM "roles" WHERE "slug"='manager');--> statement-breakpoint
INSERT INTO "permissions" ("role_id","resource","action","scope")
SELECT r.id, v.resource, v.action, v.scope
FROM "roles" r, (VALUES
  ('dashboard','view','team'),
  ('leads','view','team'),('leads','create','team'),('leads','edit','team'),('leads','export','team'),
  ('contacts','view','team'),('contacts','create','team'),('contacts','edit','team'),
  ('deals','view','team'),('deals','create','team'),('deals','edit','team'),
  ('activities','view','team'),('activities','create','team'),('activities','edit','team'),
  ('projects','view','team'),('projects','edit','team'),
  ('units','view','team'),
  ('goals','view','team'),('goals','create','team'),('goals','edit','team'),
  ('brokers','view','team'),
  ('commissions','view','team'),
  ('reservations','view','team'),('holds','view','team'),
  ('communications','view','team'),('communications','create','team'),
  ('construction_phases','view','team'),
  ('reports','view','team'),
  ('academy','view','all')
) AS v(resource,action,scope)
WHERE r.slug='manager'
  AND NOT EXISTS (SELECT 1 FROM "permissions" p WHERE p.role_id=r.id AND p.resource=v.resource AND p.action=v.action);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user_permission_overrides" (
  "id" serial PRIMARY KEY NOT NULL,
  "user_id" integer NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "resource" text NOT NULL,
  "action" text NOT NULL,
  "scope" text NOT NULL CHECK ("scope" IN ('none','own','team','all')),
  "granted_by" integer REFERENCES "users"("id"),
  "reason" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "user_permission_overrides_unq" ON "user_permission_overrides" ("user_id","resource","action");--> statement-breakpoint
ALTER TABLE "user_permission_overrides" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "manager_scopes" (
  "manager_id" integer NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "team_id" integer NOT NULL REFERENCES "teams"("id") ON DELETE CASCADE,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "manager_scopes_pk" PRIMARY KEY ("manager_id","team_id")
);--> statement-breakpoint
ALTER TABLE "manager_scopes" ENABLE ROW LEVEL SECURITY;
