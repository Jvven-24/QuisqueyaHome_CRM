-- Idempotencia de escrituras HTTP de la UI (comisiones, metas, pack de tareas).
-- Tabla propia: `transaction_commands` exige completar el comando dentro de la
-- misma transacción (m40_commands_complete) y no sirve para reservar la clave
-- antes del caso de uso.
CREATE TABLE IF NOT EXISTS "http_idempotency" (
  "id" serial PRIMARY KEY NOT NULL,
  "actor_id" integer NOT NULL REFERENCES "users"("id"),
  "operation" text NOT NULL,
  "idempotency_key" uuid NOT NULL,
  "request_hash" text NOT NULL,
  "status" text DEFAULT 'processing' NOT NULL,
  "http_status" integer,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "completed_at" timestamp with time zone,
  CONSTRAINT "http_idempotency_status_chk" CHECK ("status" in ('processing','completed'))
);--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "http_idempotency_key_unq" ON "http_idempotency" ("actor_id","operation","idempotency_key");--> statement-breakpoint
ALTER TABLE "http_idempotency" ENABLE ROW LEVEL SECURITY;
