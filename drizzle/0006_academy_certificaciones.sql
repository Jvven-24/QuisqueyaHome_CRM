CREATE TABLE "academy_review_requests" (
	"id" serial PRIMARY KEY NOT NULL,
	"public_id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"broker_id" integer NOT NULL,
	"course_code" text NOT NULL,
	"course_name" text NOT NULL,
	"moodle_course_id" integer NOT NULL,
	"progress_percent" integer DEFAULT 0 NOT NULL,
	"grade_percent" integer,
	"evidence_hash" text NOT NULL,
	"evidence_payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"status" text DEFAULT 'pendiente' NOT NULL,
	"decision_by" integer,
	"decision_reason" text,
	"decided_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "academy_review_requests_progress_check" CHECK ("academy_review_requests"."progress_percent" >= 0 and "academy_review_requests"."progress_percent" <= 100),
	CONSTRAINT "academy_review_requests_status_check" CHECK ("academy_review_requests"."status" in ('pendiente','aprobado','rechazado','revocado')),
	CONSTRAINT "academy_review_requests_no_self_approval_check" CHECK ("academy_review_requests"."decision_by" is null or "academy_review_requests"."decision_by" <> "academy_review_requests"."broker_id")
);
--> statement-breakpoint
ALTER TABLE "academy_review_requests" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "academy_certificates" (
	"id" serial PRIMARY KEY NOT NULL,
	"public_id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"review_request_id" integer NOT NULL,
	"broker_id" integer NOT NULL,
	"course_code" text NOT NULL,
	"course_name" text NOT NULL,
	"verification_code" text NOT NULL,
	"cryptographic_hash" text NOT NULL,
	"evidence_snapshot" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"approved_by" integer NOT NULL,
	"status" text DEFAULT 'vigente' NOT NULL,
	"revoked_by" integer,
	"revoked_reason" text,
	"revoked_at" timestamp with time zone,
	"issued_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "academy_certificates_status_check" CHECK ("academy_certificates"."status" in ('vigente','revocada')),
	CONSTRAINT "academy_certificates_no_self_approval_check" CHECK ("academy_certificates"."approved_by" <> "academy_certificates"."broker_id")
);
--> statement-breakpoint
ALTER TABLE "academy_certificates" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "academy_review_requests" ADD CONSTRAINT "academy_review_requests_broker_id_users_id_fk" FOREIGN KEY ("broker_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "academy_review_requests" ADD CONSTRAINT "academy_review_requests_decision_by_users_id_fk" FOREIGN KEY ("decision_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "academy_certificates" ADD CONSTRAINT "academy_certificates_review_request_id_academy_review_requests_id_fk" FOREIGN KEY ("review_request_id") REFERENCES "public"."academy_review_requests"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "academy_certificates" ADD CONSTRAINT "academy_certificates_broker_id_users_id_fk" FOREIGN KEY ("broker_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "academy_certificates" ADD CONSTRAINT "academy_certificates_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "academy_certificates" ADD CONSTRAINT "academy_certificates_revoked_by_users_id_fk" FOREIGN KEY ("revoked_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "academy_review_requests_public_id_unq" ON "academy_review_requests" USING btree ("public_id");--> statement-breakpoint
CREATE INDEX "academy_review_requests_broker_idx" ON "academy_review_requests" USING btree ("broker_id","status");--> statement-breakpoint
CREATE INDEX "academy_review_requests_course_idx" ON "academy_review_requests" USING btree ("course_code","status");--> statement-breakpoint
CREATE UNIQUE INDEX "academy_certificates_public_id_unq" ON "academy_certificates" USING btree ("public_id");--> statement-breakpoint
CREATE UNIQUE INDEX "academy_certificates_review_request_unq" ON "academy_certificates" USING btree ("review_request_id");--> statement-breakpoint
CREATE UNIQUE INDEX "academy_certificates_verification_code_unq" ON "academy_certificates" USING btree ("verification_code");--> statement-breakpoint
CREATE INDEX "academy_certificates_broker_idx" ON "academy_certificates" USING btree ("broker_id","status");
