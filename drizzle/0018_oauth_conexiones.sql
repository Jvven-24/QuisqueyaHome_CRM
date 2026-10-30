-- Conexiones OAuth de la organización (Google Search Console, GA4, Gmail, Meta Ads).
-- NO aplicar en producción sin pg_dump previo y OK de Wilber. Reejecutable.
CREATE TABLE IF NOT EXISTS "oauth_connections" (
  "id" serial PRIMARY KEY NOT NULL,
  "service" text NOT NULL,
  "provider" text NOT NULL,
  "external_account_id" text NOT NULL,
  "account_label" text NOT NULL,
  "connected_by" integer NOT NULL REFERENCES "users"("id"),
  "access_token_enc" text NOT NULL,
  "refresh_token_enc" text,
  "expires_at" timestamp with time zone,
  "scopes" text DEFAULT '' NOT NULL,
  "status" text DEFAULT 'connected' NOT NULL,
  "last_error" text,
  "summary" text,
  "last_checked_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  "revoked_at" timestamp with time zone,
  CONSTRAINT "oauth_connections_service_check" CHECK ("service" IN ('search_console','analytics','gmail','calendar','meta_ads')),
  CONSTRAINT "oauth_connections_provider_check" CHECK ("provider" IN ('google','meta')),
  CONSTRAINT "oauth_connections_status_check" CHECK ("status" IN ('connected','error','reauth'))
);--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "oauth_connections_service_account_unq" ON "oauth_connections" ("service","external_account_id") WHERE "revoked_at" IS NULL;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "oauth_connections_service_idx" ON "oauth_connections" ("service");--> statement-breakpoint
ALTER TABLE "oauth_connections" ENABLE ROW LEVEL SECURITY;
