-- M8 · Metas: metas por proyecto/equipo, equipos mínimos y regla versionada de atribución.
CREATE TABLE IF NOT EXISTS "teams" (
  "id" serial PRIMARY KEY NOT NULL,
  "name" text NOT NULL,
  "slug" text NOT NULL,
  "leader_id" integer REFERENCES "users"("id"),
  "is_active" boolean DEFAULT true NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  "created_by" integer REFERENCES "users"("id"),
  "updated_by" integer REFERENCES "users"("id"),
  CONSTRAINT "teams_name_not_blank" CHECK (length(btrim("name")) > 0)
);--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "teams_slug_unq" ON "teams" ("slug");--> statement-breakpoint
ALTER TABLE "teams" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "team_members" (
  "team_id" integer NOT NULL REFERENCES "teams"("id") ON DELETE cascade,
  "user_id" integer NOT NULL REFERENCES "users"("id"),
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "created_by" integer REFERENCES "users"("id"),
  CONSTRAINT "team_members_pk" PRIMARY KEY ("team_id","user_id")
);--> statement-breakpoint
-- Un broker pertenece a un solo equipo: la atribución por equipo es inequívoca.
CREATE UNIQUE INDEX IF NOT EXISTS "team_members_user_unq" ON "team_members" ("user_id");--> statement-breakpoint
ALTER TABLE "team_members" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "scoped_goals" (
  "id" serial PRIMARY KEY NOT NULL,
  "scope_type" text NOT NULL,
  "scope_id" integer NOT NULL,
  "year" integer NOT NULL,
  "month" integer NOT NULL,
  "target_deals" integer DEFAULT 0 NOT NULL,
  "target_amount_cents" bigint,
  "currency" text DEFAULT 'USD' NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  "created_by" integer REFERENCES "users"("id"),
  "updated_by" integer REFERENCES "users"("id"),
  CONSTRAINT "scoped_goals_scope_type_chk" CHECK ("scope_type" in ('project','team')),
  CONSTRAINT "scoped_goals_month_chk" CHECK ("month" between 1 and 12),
  CONSTRAINT "scoped_goals_target_chk" CHECK ("target_deals" >= 0 and ("target_amount_cents" is null or "target_amount_cents" >= 0)),
  CONSTRAINT "scoped_goals_currency_chk" CHECK ("currency" in ('USD','DOP'))
);--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "scoped_goals_period_unq" ON "scoped_goals" ("scope_type","scope_id","year","month");--> statement-breakpoint
ALTER TABLE "scoped_goals" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "attribution_rules" (
  "id" serial PRIMARY KEY NOT NULL,
  "version" integer NOT NULL,
  "scope" text NOT NULL,
  "rule" text NOT NULL,
  "config" jsonb NOT NULL,
  "is_active" boolean DEFAULT false NOT NULL,
  "approved_by" integer REFERENCES "users"("id"),
  "approved_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "created_by" integer REFERENCES "users"("id")
);--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "attribution_rules_version_unq" ON "attribution_rules" ("version");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "attribution_rules_active_unq" ON "attribution_rules" ("is_active") WHERE "is_active";--> statement-breakpoint
ALTER TABLE "attribution_rules" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "deals" ADD COLUMN IF NOT EXISTS "attribution_rule_version" integer;--> statement-breakpoint
ALTER TABLE "deals" ADD COLUMN IF NOT EXISTS "attributed_project_id" integer REFERENCES "projects"("id");--> statement-breakpoint
ALTER TABLE "deals" ADD COLUMN IF NOT EXISTS "attributed_team_id" integer REFERENCES "teams"("id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "deals_attributed_project_idx" ON "deals" ("attributed_project_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "deals_attributed_team_idx" ON "deals" ("attributed_team_id");--> statement-breakpoint
-- Versión 1 de la regla, la que el panel de vista previa describía.
INSERT INTO "attribution_rules" ("version","scope","rule","config","is_active","approved_at")
SELECT 1, 'Compañía, broker, proyecto y equipo',
  'Un negocio ganado cuenta una sola vez, en el mes de su cierre (hora de Santo Domingo). Se atribuye al broker responsable, al proyecto de su propiedad principal y al equipo del broker en el momento del cierre. La asignación queda congelada en el negocio; los ajustes posteriores quedan auditados.',
  '{"proyecto":"propiedad_principal","equipo":"equipo_del_broker_al_cierre","conteo":"una_vez_por_negocio","periodo":"mes_de_cierre_santo_domingo"}'::jsonb,
  true, now()
WHERE NOT EXISTS (SELECT 1 FROM "attribution_rules");--> statement-breakpoint
-- Respaldo: congela la atribución v1 en los negocios ganados que ya existían.
UPDATE "deals" d SET
  "attribution_rule_version" = 1,
  "attributed_project_id" = (SELECT dp."project_id" FROM "deal_properties" dp WHERE dp."deal_id" = d."id" ORDER BY dp."is_primary" DESC, dp."id" LIMIT 1)
FROM "pipeline_stages" s
WHERE s."id" = d."stage_id" AND s."kind" = 'won' AND d."attribution_rule_version" IS NULL;
