CREATE TABLE "external_refs" (
	"id" serial PRIMARY KEY NOT NULL,
	"entity_type" text NOT NULL,
	"local_id" integer NOT NULL,
	"system" text NOT NULL,
	"external_id" text NOT NULL,
	"version" integer NOT NULL,
	"synced_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "external_refs_version_check" CHECK ("external_refs"."version" > 0)
);
--> statement-breakpoint
ALTER TABLE "external_refs" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "outbox" (
	"event_id" uuid PRIMARY KEY NOT NULL,
	"event_type" text NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"aggregate_id" integer NOT NULL,
	"correlation_id" uuid NOT NULL,
	"payload" jsonb NOT NULL,
	"idempotency_key" text NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"available_at" timestamp with time zone DEFAULT now() NOT NULL,
	"sent_at" timestamp with time zone,
	"dead_at" timestamp with time zone,
	"last_failure" text,
	"attempt_history" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "outbox_version_check" CHECK ("outbox"."version" > 0),
	CONSTRAINT "outbox_attempts_check" CHECK ("outbox"."attempts" >= 0),
	CONSTRAINT "outbox_terminal_check" CHECK ("outbox"."sent_at" is null or "outbox"."dead_at" is null),
	CONSTRAINT "outbox_type_check" CHECK ("outbox"."event_type" in ('LeadCreado','NegocioCambioEtapa','ActividadRegistrada'))
);
--> statement-breakpoint
ALTER TABLE "outbox" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "outbox_dead" (
	"event_id" uuid PRIMARY KEY NOT NULL,
	"reason" text NOT NULL,
	"failed_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "outbox_dead_reason_check" CHECK ("outbox_dead"."reason" in ('RETRYABLE','NON_RETRYABLE','HUMAN_REQUIRED'))
);
--> statement-breakpoint
ALTER TABLE "outbox_dead" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "webhook_inbox" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"system" text NOT NULL,
	"account_id" text NOT NULL,
	"event_id" text NOT NULL,
	"correlation_id" uuid NOT NULL,
	"version" integer NOT NULL,
	"received_at" timestamp with time zone DEFAULT now() NOT NULL,
	"processed_at" timestamp with time zone,
	"payload" jsonb NOT NULL,
	CONSTRAINT "webhook_inbox_version_check" CHECK ("webhook_inbox"."version" > 0)
);
--> statement-breakpoint
ALTER TABLE "webhook_inbox" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "outbox_dead" ADD CONSTRAINT "outbox_dead_event_id_outbox_event_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."outbox"("event_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "external_refs_local_system_unq" ON "external_refs" USING btree ("entity_type","local_id","system");--> statement-breakpoint
CREATE UNIQUE INDEX "external_refs_system_external_unq" ON "external_refs" USING btree ("system","external_id");--> statement-breakpoint
CREATE UNIQUE INDEX "outbox_idempotency_unq" ON "outbox" USING btree ("idempotency_key");--> statement-breakpoint
CREATE INDEX "outbox_pending_idx" ON "outbox" USING btree ("available_at","created_at") WHERE "outbox"."sent_at" is null and "outbox"."dead_at" is null;--> statement-breakpoint
CREATE INDEX "outbox_aggregate_idx" ON "outbox" USING btree ("event_type","aggregate_id","created_at");--> statement-breakpoint
CREATE INDEX "outbox_dead_failed_idx" ON "outbox_dead" USING btree ("failed_at");--> statement-breakpoint
CREATE UNIQUE INDEX "webhook_inbox_account_event_unq" ON "webhook_inbox" USING btree ("system","account_id","event_id");--> statement-breakpoint
CREATE INDEX "webhook_inbox_pending_idx" ON "webhook_inbox" USING btree ("received_at") WHERE "webhook_inbox"."processed_at" is null;