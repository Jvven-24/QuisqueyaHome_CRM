-- Google multi-cuenta: varias cuentas por usuario, tokens cifrados en reposo.
CREATE TABLE IF NOT EXISTS "google_accounts" (
  "id" serial PRIMARY KEY NOT NULL,
  "user_id" integer NOT NULL REFERENCES "users"("id"),
  "email" text NOT NULL,
  "google_sub" text NOT NULL,
  "access_token_enc" text NOT NULL,
  "refresh_token_enc" text,
  "expires_at" timestamp with time zone NOT NULL,
  "scopes" text DEFAULT '' NOT NULL,
  "active" boolean DEFAULT true NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "revoked_at" timestamp with time zone
);--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "google_accounts_user_sub_unq" ON "google_accounts" ("user_id","google_sub");--> statement-breakpoint
ALTER TABLE "google_accounts" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "google_calendars" (
  "id" serial PRIMARY KEY NOT NULL,
  "account_id" integer NOT NULL REFERENCES "google_accounts"("id") ON DELETE CASCADE,
  "calendar_id" text NOT NULL,
  "summary" text NOT NULL,
  "is_primary" boolean DEFAULT false NOT NULL,
  "selected" boolean DEFAULT false NOT NULL,
  "default_for_visits" boolean DEFAULT false NOT NULL
);--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "google_calendars_account_cal_unq" ON "google_calendars" ("account_id","calendar_id");--> statement-breakpoint
ALTER TABLE "google_calendars" ENABLE ROW LEVEL SECURITY;
