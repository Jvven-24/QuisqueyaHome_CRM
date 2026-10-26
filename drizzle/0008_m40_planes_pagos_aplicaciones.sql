CREATE TABLE "allocation_carryforwards" (
	"id" serial PRIMARY KEY NOT NULL,
	"allocation_id" integer NOT NULL,
	"installment_id" integer NOT NULL,
	"destination_version_id" integer NOT NULL,
	"currency" text NOT NULL,
	"amount_cents" bigint NOT NULL,
	"command_id" integer NOT NULL,
	"line_number" integer NOT NULL,
	"reversal_of_id" integer,
	"created_by" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"source" text NOT NULL,
	"correlation_id" uuid NOT NULL,
	CONSTRAINT "allocation_carryforwards_command_line_unq" UNIQUE("command_id","line_number"),
	CONSTRAINT "allocation_carryforwards_values_check" CHECK ("allocation_carryforwards"."amount_cents" > 0 and "allocation_carryforwards"."line_number" > 0 and "allocation_carryforwards"."currency" in ('USD','DOP') and length(btrim("allocation_carryforwards"."source")) > 0 and ("allocation_carryforwards"."reversal_of_id" is null or "allocation_carryforwards"."reversal_of_id" <> "allocation_carryforwards"."id"))
);
--> statement-breakpoint
ALTER TABLE "allocation_carryforwards" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "fx_rates" (
	"id" serial PRIMARY KEY NOT NULL,
	"public_id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"base_currency" text NOT NULL,
	"quote_currency" text NOT NULL,
	"rate" numeric(24, 12) NOT NULL,
	"rounding" text NOT NULL,
	"version" text NOT NULL,
	"effective_at" timestamp with time zone NOT NULL,
	"agreement_document_id" integer NOT NULL,
	"created_by" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"source" text NOT NULL,
	"correlation_id" uuid NOT NULL,
	CONSTRAINT "fx_rates_values_check" CHECK ("fx_rates"."base_currency" in ('USD','DOP') and "fx_rates"."quote_currency" in ('USD','DOP') and "fx_rates"."base_currency" <> "fx_rates"."quote_currency" and "fx_rates"."rate" > 0 and "fx_rates"."rate" < 1000000000000 and "fx_rates"."rounding" in ('towards_zero','floor','ceil','half_even') and length(btrim("fx_rates"."version")) > 0 and length(btrim("fx_rates"."source")) > 0)
);
--> statement-breakpoint
ALTER TABLE "fx_rates" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "payment_allocations" (
	"id" serial PRIMARY KEY NOT NULL,
	"public_id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"payment_id" integer NOT NULL,
	"installment_id" integer NOT NULL,
	"source_amount_cents" bigint NOT NULL,
	"applied_amount_cents" bigint NOT NULL,
	"source_currency" text NOT NULL,
	"applied_currency" text NOT NULL,
	"fx_rate_id" integer,
	"event_id" integer NOT NULL,
	"line_number" integer NOT NULL,
	"reversal_of_id" integer,
	"created_by" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"source" text NOT NULL,
	"correlation_id" uuid NOT NULL,
	CONSTRAINT "payment_allocations_event_line_unq" UNIQUE("event_id","line_number"),
	CONSTRAINT "payment_allocations_values_check" CHECK ("payment_allocations"."source_amount_cents" > 0 and "payment_allocations"."applied_amount_cents" > 0 and "payment_allocations"."line_number" > 0 and "payment_allocations"."source_currency" in ('USD','DOP') and "payment_allocations"."applied_currency" in ('USD','DOP') and length(btrim("payment_allocations"."source")) > 0 and ("payment_allocations"."reversal_of_id" is null or "payment_allocations"."reversal_of_id" <> "payment_allocations"."id")),
	CONSTRAINT "payment_allocations_fx_check" CHECK (("payment_allocations"."source_currency" = "payment_allocations"."applied_currency" and "payment_allocations"."fx_rate_id" is null and "payment_allocations"."source_amount_cents" = "payment_allocations"."applied_amount_cents") or ("payment_allocations"."source_currency" <> "payment_allocations"."applied_currency" and "payment_allocations"."fx_rate_id" is not null))
);
--> statement-breakpoint
ALTER TABLE "payment_allocations" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "payment_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"public_id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"payment_id" integer NOT NULL,
	"connection_id" integer,
	"external_event_id" text,
	"event_type" text NOT NULL,
	"request_hash" text NOT NULL,
	"evidence_id" integer NOT NULL,
	"effective_at" timestamp with time zone NOT NULL,
	"created_by" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"source" text NOT NULL,
	"correlation_id" uuid NOT NULL,
	CONSTRAINT "payment_events_payment_id_unq" UNIQUE("payment_id","id"),
	CONSTRAINT "payment_events_external_check" CHECK (("payment_events"."connection_id" is null and "payment_events"."external_event_id" is null) or ("payment_events"."connection_id" is not null and "payment_events"."external_event_id" is not null and length(btrim("payment_events"."external_event_id")) > 0)),
	CONSTRAINT "payment_events_values_check" CHECK ("payment_events"."event_type" in ('presentado','confirmado','rechazado','aplicado','reverso','contracargo') and "payment_events"."request_hash" ~ '^[0-9a-f]{64}$' and length(btrim("payment_events"."source")) > 0)
);
--> statement-breakpoint
ALTER TABLE "payment_events" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "payment_installments" (
	"id" serial PRIMARY KEY NOT NULL,
	"public_id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"version_id" integer NOT NULL,
	"sequence" integer NOT NULL,
	"concept" text NOT NULL,
	"due_date" date NOT NULL,
	"amount_cents" bigint NOT NULL,
	"currency" text NOT NULL,
	"created_by" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"source" text NOT NULL,
	"correlation_id" uuid NOT NULL,
	CONSTRAINT "payment_installments_sequence_unq" UNIQUE("version_id","sequence"),
	CONSTRAINT "payment_installments_values_check" CHECK ("payment_installments"."sequence" > 0 and "payment_installments"."amount_cents" > 0 and "payment_installments"."currency" in ('USD','DOP') and isfinite("payment_installments"."due_date") and length(btrim("payment_installments"."concept")) > 0 and length(btrim("payment_installments"."source")) > 0)
);
--> statement-breakpoint
ALTER TABLE "payment_installments" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "payment_plan_templates" (
	"id" serial PRIMARY KEY NOT NULL,
	"public_id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"project_id" integer,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"version" integer NOT NULL,
	"status" text DEFAULT 'borrador' NOT NULL,
	"calendar" jsonb NOT NULL,
	"approved_by" integer,
	"approved_at" timestamp with time zone,
	"approval_evidence_id" integer,
	"created_by" integer NOT NULL,
	"updated_by" integer NOT NULL,
	"row_version" integer DEFAULT 1 NOT NULL,
	"correlation_id" uuid NOT NULL,
	"source" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "payment_plan_templates_values_check" CHECK ("payment_plan_templates"."version" > 0 and "payment_plan_templates"."row_version" > 0 and length(btrim("payment_plan_templates"."code")) > 0 and length(btrim("payment_plan_templates"."name")) > 0 and length(btrim("payment_plan_templates"."source")) > 0 and jsonb_typeof("payment_plan_templates"."calendar") = 'array' and jsonb_array_length("payment_plan_templates"."calendar") > 0),
	CONSTRAINT "payment_plan_templates_approval_check" CHECK ("payment_plan_templates"."status" in ('borrador','aprobada','retirada') and (("payment_plan_templates"."status" = 'borrador' and "payment_plan_templates"."approved_by" is null and "payment_plan_templates"."approved_at" is null and "payment_plan_templates"."approval_evidence_id" is null) or ("payment_plan_templates"."status" <> 'borrador' and "payment_plan_templates"."approved_by" is not null and "payment_plan_templates"."approved_by" <> "payment_plan_templates"."created_by" and "payment_plan_templates"."approved_at" is not null and "payment_plan_templates"."approved_at" >= "payment_plan_templates"."created_at" and "payment_plan_templates"."approval_evidence_id" is not null)))
);
--> statement-breakpoint
ALTER TABLE "payment_plan_templates" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "payment_plan_versions" (
	"id" serial PRIMARY KEY NOT NULL,
	"public_id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"plan_id" integer NOT NULL,
	"version" integer NOT NULL,
	"previous_version_id" integer,
	"template_id" integer,
	"currency" text NOT NULL,
	"total_cents" bigint NOT NULL,
	"status" text DEFAULT 'borrador' NOT NULL,
	"agreement_document_id" integer,
	"agreement_hash" text,
	"agreed_at" timestamp with time zone,
	"created_by" integer NOT NULL,
	"updated_by" integer NOT NULL,
	"row_version" integer DEFAULT 1 NOT NULL,
	"correlation_id" uuid NOT NULL,
	"source" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "payment_plan_versions_number_unq" UNIQUE("plan_id","version"),
	CONSTRAINT "payment_plan_versions_id_currency_unq" UNIQUE("id","currency"),
	CONSTRAINT "payment_plan_versions_values_check" CHECK ("payment_plan_versions"."version" > 0 and "payment_plan_versions"."total_cents" > 0 and "payment_plan_versions"."row_version" > 0 and "payment_plan_versions"."currency" in ('USD','DOP') and length(btrim("payment_plan_versions"."source")) > 0 and ("payment_plan_versions"."previous_version_id" is null or "payment_plan_versions"."previous_version_id" <> "payment_plan_versions"."id")),
	CONSTRAINT "payment_plan_versions_agreement_check" CHECK ("payment_plan_versions"."status" in ('borrador','acordado_activo','completado','sustituido') and (("payment_plan_versions"."status" = 'borrador' and "payment_plan_versions"."agreed_at" is null and "payment_plan_versions"."agreement_document_id" is null and "payment_plan_versions"."agreement_hash" is null) or ("payment_plan_versions"."status" <> 'borrador' and "payment_plan_versions"."agreed_at" is not null and "payment_plan_versions"."agreed_at" >= "payment_plan_versions"."created_at" and "payment_plan_versions"."agreement_document_id" is not null and "payment_plan_versions"."agreement_hash" is not null and "payment_plan_versions"."agreement_hash" ~ '^[0-9a-f]{64}$')))
);
--> statement-breakpoint
ALTER TABLE "payment_plan_versions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "payment_plans" (
	"id" serial PRIMARY KEY NOT NULL,
	"public_id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"reservation_id" integer,
	"legacy_unit_sale_id" uuid,
	"currency" text NOT NULL,
	"active_version_id" integer,
	"created_by" integer NOT NULL,
	"updated_by" integer NOT NULL,
	"row_version" integer DEFAULT 1 NOT NULL,
	"correlation_id" uuid NOT NULL,
	"source" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "payment_plans_origin_check" CHECK (num_nonnulls("payment_plans"."reservation_id", "payment_plans"."legacy_unit_sale_id") = 1),
	CONSTRAINT "payment_plans_values_check" CHECK ("payment_plans"."currency" in ('USD','DOP') and "payment_plans"."row_version" > 0 and length(btrim("payment_plans"."source")) > 0)
);
--> statement-breakpoint
ALTER TABLE "payment_plans" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "payment_reversals" (
	"id" serial PRIMARY KEY NOT NULL,
	"public_id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"payment_id" integer NOT NULL,
	"amount_cents" bigint NOT NULL,
	"currency" text NOT NULL,
	"event_id" integer NOT NULL,
	"reason" text NOT NULL,
	"created_by" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"source" text NOT NULL,
	"correlation_id" uuid NOT NULL,
	CONSTRAINT "payment_reversals_event_unq" UNIQUE("event_id"),
	CONSTRAINT "payment_reversals_values_check" CHECK ("payment_reversals"."amount_cents" > 0 and "payment_reversals"."currency" in ('USD','DOP') and length(btrim("payment_reversals"."reason")) > 0 and length(btrim("payment_reversals"."source")) > 0)
);
--> statement-breakpoint
ALTER TABLE "payment_reversals" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "payments" (
	"id" serial PRIMARY KEY NOT NULL,
	"public_id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"reservation_id" integer,
	"legacy_unit_sale_id" uuid,
	"payer_id" integer NOT NULL,
	"payment_method_id" integer NOT NULL,
	"connection_id" integer,
	"external_id" text,
	"amount_cents" bigint NOT NULL,
	"currency" text NOT NULL,
	"status" text DEFAULT 'pendiente' NOT NULL,
	"evidence_id" integer NOT NULL,
	"verified_by" integer,
	"verified_at" timestamp with time zone,
	"received_at" timestamp with time zone NOT NULL,
	"created_by" integer NOT NULL,
	"updated_by" integer NOT NULL,
	"row_version" integer DEFAULT 1 NOT NULL,
	"correlation_id" uuid NOT NULL,
	"source" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "payments_origin_check" CHECK (num_nonnulls("payments"."reservation_id","payments"."legacy_unit_sale_id") = 1),
	CONSTRAINT "payments_external_check" CHECK (("payments"."connection_id" is null and "payments"."external_id" is null) or ("payments"."connection_id" is not null and "payments"."external_id" is not null and length(btrim("payments"."external_id")) > 0)),
	CONSTRAINT "payments_values_check" CHECK ("payments"."amount_cents" > 0 and "payments"."currency" in ('USD','DOP') and "payments"."row_version" > 0 and length(btrim("payments"."source")) > 0),
	CONSTRAINT "payments_state_check" CHECK ("payments"."status" in ('pendiente','confirmado','rechazado','reversado_parcial','reversado_total','contracargo') and (("payments"."status" = 'pendiente' and "payments"."verified_by" is null and "payments"."verified_at" is null) or ("payments"."status" <> 'pendiente' and "payments"."verified_by" is not null and "payments"."verified_by" <> "payments"."created_by" and "payments"."verified_at" is not null and "payments"."verified_at" >= "payments"."created_at")))
);
--> statement-breakpoint
ALTER TABLE "payments" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "allocation_carryforwards" ADD CONSTRAINT "allocation_carryforwards_allocation_id_payment_allocations_id_fk" FOREIGN KEY ("allocation_id") REFERENCES "public"."payment_allocations"("id") ON DELETE restrict ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE "allocation_carryforwards" ADD CONSTRAINT "allocation_carryforwards_installment_id_payment_installments_id_fk" FOREIGN KEY ("installment_id") REFERENCES "public"."payment_installments"("id") ON DELETE restrict ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE "allocation_carryforwards" ADD CONSTRAINT "allocation_carryforwards_command_id_transaction_commands_id_fk" FOREIGN KEY ("command_id") REFERENCES "public"."transaction_commands"("id") ON DELETE restrict ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE "allocation_carryforwards" ADD CONSTRAINT "allocation_carryforwards_reversal_of_id_allocation_carryforwards_id_fk" FOREIGN KEY ("reversal_of_id") REFERENCES "public"."allocation_carryforwards"("id") ON DELETE restrict ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE "allocation_carryforwards" ADD CONSTRAINT "allocation_carryforwards_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE "allocation_carryforwards" ADD CONSTRAINT "allocation_carryforwards_version_currency_fk" FOREIGN KEY ("destination_version_id","currency") REFERENCES "public"."payment_plan_versions"("id","currency") ON DELETE restrict ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE "fx_rates" ADD CONSTRAINT "fx_rates_agreement_document_id_files_id_fk" FOREIGN KEY ("agreement_document_id") REFERENCES "public"."files"("id") ON DELETE restrict ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE "fx_rates" ADD CONSTRAINT "fx_rates_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE "payment_allocations" ADD CONSTRAINT "payment_allocations_payment_id_payments_id_fk" FOREIGN KEY ("payment_id") REFERENCES "public"."payments"("id") ON DELETE restrict ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE "payment_allocations" ADD CONSTRAINT "payment_allocations_installment_id_payment_installments_id_fk" FOREIGN KEY ("installment_id") REFERENCES "public"."payment_installments"("id") ON DELETE restrict ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE "payment_allocations" ADD CONSTRAINT "payment_allocations_fx_rate_id_fx_rates_id_fk" FOREIGN KEY ("fx_rate_id") REFERENCES "public"."fx_rates"("id") ON DELETE restrict ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE "payment_allocations" ADD CONSTRAINT "payment_allocations_reversal_of_id_payment_allocations_id_fk" FOREIGN KEY ("reversal_of_id") REFERENCES "public"."payment_allocations"("id") ON DELETE restrict ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE "payment_allocations" ADD CONSTRAINT "payment_allocations_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE "payment_allocations" ADD CONSTRAINT "payment_allocations_payment_event_fk" FOREIGN KEY ("payment_id","event_id") REFERENCES "public"."payment_events"("payment_id","id") ON DELETE restrict ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE "payment_events" ADD CONSTRAINT "payment_events_payment_id_payments_id_fk" FOREIGN KEY ("payment_id") REFERENCES "public"."payments"("id") ON DELETE restrict ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE "payment_events" ADD CONSTRAINT "payment_events_connection_id_integration_accounts_id_fk" FOREIGN KEY ("connection_id") REFERENCES "public"."integration_accounts"("id") ON DELETE restrict ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE "payment_events" ADD CONSTRAINT "payment_events_evidence_id_files_id_fk" FOREIGN KEY ("evidence_id") REFERENCES "public"."files"("id") ON DELETE restrict ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE "payment_events" ADD CONSTRAINT "payment_events_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE "payment_installments" ADD CONSTRAINT "payment_installments_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE "payment_installments" ADD CONSTRAINT "payment_installments_version_currency_fk" FOREIGN KEY ("version_id","currency") REFERENCES "public"."payment_plan_versions"("id","currency") ON DELETE restrict ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE "payment_plan_templates" ADD CONSTRAINT "payment_plan_templates_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE restrict ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE "payment_plan_templates" ADD CONSTRAINT "payment_plan_templates_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE "payment_plan_templates" ADD CONSTRAINT "payment_plan_templates_approval_evidence_id_files_id_fk" FOREIGN KEY ("approval_evidence_id") REFERENCES "public"."files"("id") ON DELETE restrict ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE "payment_plan_templates" ADD CONSTRAINT "payment_plan_templates_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE "payment_plan_templates" ADD CONSTRAINT "payment_plan_templates_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE "payment_plan_versions" ADD CONSTRAINT "payment_plan_versions_plan_id_payment_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."payment_plans"("id") ON DELETE restrict ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE "payment_plan_versions" ADD CONSTRAINT "payment_plan_versions_previous_version_id_payment_plan_versions_id_fk" FOREIGN KEY ("previous_version_id") REFERENCES "public"."payment_plan_versions"("id") ON DELETE restrict ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE "payment_plan_versions" ADD CONSTRAINT "payment_plan_versions_template_id_payment_plan_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."payment_plan_templates"("id") ON DELETE restrict ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE "payment_plan_versions" ADD CONSTRAINT "payment_plan_versions_agreement_document_id_files_id_fk" FOREIGN KEY ("agreement_document_id") REFERENCES "public"."files"("id") ON DELETE restrict ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE "payment_plan_versions" ADD CONSTRAINT "payment_plan_versions_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE "payment_plan_versions" ADD CONSTRAINT "payment_plan_versions_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE "payment_plans" ADD CONSTRAINT "payment_plans_reservation_id_reservations_id_fk" FOREIGN KEY ("reservation_id") REFERENCES "public"."reservations"("id") ON DELETE restrict ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE "payment_plans" ADD CONSTRAINT "payment_plans_legacy_unit_sale_id_unit_sales_id_fk" FOREIGN KEY ("legacy_unit_sale_id") REFERENCES "public"."unit_sales"("id") ON DELETE restrict ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE "payment_plans" ADD CONSTRAINT "payment_plans_active_version_id_payment_plan_versions_id_fk" FOREIGN KEY ("active_version_id") REFERENCES "public"."payment_plan_versions"("id") ON DELETE restrict ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE "payment_plans" ADD CONSTRAINT "payment_plans_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE "payment_plans" ADD CONSTRAINT "payment_plans_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE "payment_reversals" ADD CONSTRAINT "payment_reversals_payment_id_payments_id_fk" FOREIGN KEY ("payment_id") REFERENCES "public"."payments"("id") ON DELETE restrict ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE "payment_reversals" ADD CONSTRAINT "payment_reversals_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE "payment_reversals" ADD CONSTRAINT "payment_reversals_payment_event_fk" FOREIGN KEY ("payment_id","event_id") REFERENCES "public"."payment_events"("payment_id","id") ON DELETE restrict ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_reservation_id_reservations_id_fk" FOREIGN KEY ("reservation_id") REFERENCES "public"."reservations"("id") ON DELETE restrict ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_legacy_unit_sale_id_unit_sales_id_fk" FOREIGN KEY ("legacy_unit_sale_id") REFERENCES "public"."unit_sales"("id") ON DELETE restrict ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_payer_id_contacts_id_fk" FOREIGN KEY ("payer_id") REFERENCES "public"."contacts"("id") ON DELETE restrict ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_payment_method_id_payment_methods_id_fk" FOREIGN KEY ("payment_method_id") REFERENCES "public"."payment_methods"("id") ON DELETE restrict ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_connection_id_integration_accounts_id_fk" FOREIGN KEY ("connection_id") REFERENCES "public"."integration_accounts"("id") ON DELETE restrict ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_evidence_id_files_id_fk" FOREIGN KEY ("evidence_id") REFERENCES "public"."files"("id") ON DELETE restrict ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_verified_by_users_id_fk" FOREIGN KEY ("verified_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE restrict;--> statement-breakpoint
CREATE UNIQUE INDEX "fx_rates_public_id_unq" ON "fx_rates" USING btree ("public_id");--> statement-breakpoint
CREATE UNIQUE INDEX "payment_allocations_public_id_unq" ON "payment_allocations" USING btree ("public_id");--> statement-breakpoint
CREATE UNIQUE INDEX "payment_events_public_id_unq" ON "payment_events" USING btree ("public_id");--> statement-breakpoint
CREATE UNIQUE INDEX "payment_events_external_unq" ON "payment_events" USING btree ("connection_id","external_event_id") WHERE "payment_events"."external_event_id" is not null;--> statement-breakpoint
CREATE UNIQUE INDEX "payment_events_decision_unq" ON "payment_events" USING btree ("payment_id") WHERE "payment_events"."event_type" in ('confirmado','rechazado');--> statement-breakpoint
CREATE UNIQUE INDEX "payment_installments_public_id_unq" ON "payment_installments" USING btree ("public_id");--> statement-breakpoint
CREATE UNIQUE INDEX "payment_plan_templates_public_id_unq" ON "payment_plan_templates" USING btree ("public_id");--> statement-breakpoint
CREATE UNIQUE INDEX "payment_plan_templates_project_version_unq" ON "payment_plan_templates" USING btree ("project_id","code","version") WHERE "payment_plan_templates"."project_id" is not null;--> statement-breakpoint
CREATE UNIQUE INDEX "payment_plan_templates_global_version_unq" ON "payment_plan_templates" USING btree ("code","version") WHERE "payment_plan_templates"."project_id" is null;--> statement-breakpoint
CREATE UNIQUE INDEX "payment_plan_versions_public_id_unq" ON "payment_plan_versions" USING btree ("public_id");--> statement-breakpoint
CREATE UNIQUE INDEX "payment_plan_versions_current_unq" ON "payment_plan_versions" USING btree ("plan_id") WHERE "payment_plan_versions"."status" in ('acordado_activo','completado');--> statement-breakpoint
CREATE UNIQUE INDEX "payment_plans_public_id_unq" ON "payment_plans" USING btree ("public_id");--> statement-breakpoint
CREATE UNIQUE INDEX "payment_plans_reservation_unq" ON "payment_plans" USING btree ("reservation_id") WHERE "payment_plans"."reservation_id" is not null;--> statement-breakpoint
CREATE UNIQUE INDEX "payment_plans_legacy_sale_unq" ON "payment_plans" USING btree ("legacy_unit_sale_id") WHERE "payment_plans"."legacy_unit_sale_id" is not null;--> statement-breakpoint
CREATE UNIQUE INDEX "payment_reversals_public_id_unq" ON "payment_reversals" USING btree ("public_id");--> statement-breakpoint
CREATE UNIQUE INDEX "payments_public_id_unq" ON "payments" USING btree ("public_id");--> statement-breakpoint
CREATE UNIQUE INDEX "payments_external_unq" ON "payments" USING btree ("connection_id","external_id") WHERE "payments"."external_id" is not null;
--> statement-breakpoint
-- Extensión SQL del esquema generado: agregados, locks y hechos inmutables.
-- No activa cobros ni contabiliza dinero. Reversión: desactivar consumidores;
-- después del primer hecho financiero, solo correcciones hacia delante.
CREATE FUNCTION m40_b1d_round(n numeric, d numeric, mode text) RETURNS numeric
LANGUAGE plpgsql IMMUTABLE STRICT SET search_path = pg_catalog, public AS $$
DECLARE q numeric; r numeric;
BEGIN
  IF n < 0 OR d <= 0 OR mode NOT IN ('towards_zero','floor','ceil','half_even') THEN
    RAISE EXCEPTION USING ERRCODE='23514', MESSAGE='M40: conversión inválida';
  END IF;
  q := div(n,d); r := mod(n,d);
  IF mode='ceil' AND r>0 OR mode='half_even' AND (r*2>d OR r*2=d AND mod(q,2)=1) THEN q:=q+1; END IF;
  RETURN q;
END $$;
--> statement-breakpoint
CREATE FUNCTION m40_b1d_history() RETURNS trigger LANGUAGE plpgsql SET search_path = pg_catalog, public AS $$
DECLARE mutable text[] := ARRAY['row_version','updated_at','updated_by','source','correlation_id'];
BEGIN
  IF TG_OP IN ('DELETE','TRUNCATE') THEN
    RAISE EXCEPTION USING ERRCODE='23514', MESSAGE='M40: historia financiera no eliminable';
  END IF;
  IF TG_TABLE_NAME IN ('fx_rates','payment_events','payment_allocations','allocation_carryforwards','payment_reversals') THEN
    RAISE EXCEPTION USING ERRCODE='23514', MESSAGE='M40: hecho financiero inmutable';
  ELSIF TG_TABLE_NAME='payment_installments' THEN
    IF NEW.version_id<>OLD.version_id OR NEW.id<>OLD.id OR NEW.public_id<>OLD.public_id OR NEW.created_by<>OLD.created_by OR NEW.created_at<>OLD.created_at
      OR EXISTS (SELECT 1 FROM public.payment_plan_versions WHERE id=OLD.version_id AND status<>'borrador') THEN
      RAISE EXCEPTION USING ERRCODE='23514', MESSAGE='M40: cuota acordada inmutable';
    END IF;
    RETURN NEW;
  ELSIF TG_TABLE_NAME='payment_plan_templates' THEN
    IF OLD.status<>'borrador' AND (NEW.status<>'retirada' OR (to_jsonb(NEW)-mutable-'status') IS DISTINCT FROM (to_jsonb(OLD)-mutable-'status')) THEN
      RAISE EXCEPTION USING ERRCODE='23514', MESSAGE='M40: plantilla aprobada requiere nueva versión';
    END IF;
  ELSIF TG_TABLE_NAME='payment_plan_versions' THEN
    IF NEW.plan_id<>OLD.plan_id OR NEW.version<>OLD.version OR OLD.status='sustituido'
      OR OLD.status<>'borrador' AND ((to_jsonb(NEW)-mutable-'status') IS DISTINCT FROM (to_jsonb(OLD)-mutable-'status')
        OR NOT (NEW.status=OLD.status OR OLD.status='acordado_activo' AND NEW.status IN ('completado','sustituido') OR OLD.status='completado' AND NEW.status='acordado_activo')) THEN
      RAISE EXCEPTION USING ERRCODE='23514', MESSAGE='M40: versión acordada inmutable';
    END IF;
  ELSIF TG_TABLE_NAME='payment_plans' THEN
    IF (to_jsonb(NEW)-mutable-'active_version_id') IS DISTINCT FROM (to_jsonb(OLD)-mutable-'active_version_id') THEN
      RAISE EXCEPTION USING ERRCODE='23514', MESSAGE='M40: origen y moneda del plan inmutables';
    END IF;
  ELSIF TG_TABLE_NAME='payments' THEN
    IF (to_jsonb(NEW)-mutable-ARRAY['status','verified_by','verified_at']) IS DISTINCT FROM (to_jsonb(OLD)-mutable-ARRAY['status','verified_by','verified_at'])
      OR OLD.status<>'pendiente' AND (NEW.verified_by,NEW.verified_at) IS DISTINCT FROM (OLD.verified_by,OLD.verified_at)
      OR NOT (NEW.status=OLD.status OR OLD.status='pendiente' AND NEW.status IN ('confirmado','rechazado')
        OR OLD.status='confirmado' AND NEW.status IN ('reversado_parcial','reversado_total','contracargo')
        OR OLD.status='reversado_parcial' AND NEW.status IN ('reversado_total','contracargo')) THEN
      RAISE EXCEPTION USING ERRCODE='23514', MESSAGE='M40: cobro original y verificación inmutables';
    END IF;
  END IF;
  IF NEW.id<>OLD.id OR NEW.public_id<>OLD.public_id OR NEW.created_by<>OLD.created_by OR NEW.created_at<>OLD.created_at THEN
    RAISE EXCEPTION USING ERRCODE='23514', MESSAGE='M40: identidad financiera inmutable';
  END IF;
  RETURN NEW;
END $$;
--> statement-breakpoint
-- Orden de aplicación: origen contractual, plan ASC, pago ASC, versión/cuota ASC. El adaptador debe
-- adquirir estos padres ANTES de UPDATE (PostgreSQL bloquea la fila objetivo antes
-- del trigger). SQL directo en orden inverso puede abortar por deadlock, nunca
-- puede confirmar un agregado inválido. REPEATABLE READ se rechaza para no usar
-- un snapshot anterior a la espera del lock en comprobaciones entre filas.
CREATE FUNCTION m40_b1d_lock() RETURNS trigger LANGUAGE plpgsql SET search_path = pg_catalog, public AS $$
DECLARE plan_id_value integer; payment_id_value integer; installment_id_value integer; template_changed boolean:=false;
  reservation_id_value integer; deal_id_value integer;
BEGIN
  IF current_setting('transaction_isolation')<>'read committed' THEN
    RAISE EXCEPTION USING ERRCODE='23514', MESSAGE='M40: escritura financiera requiere READ COMMITTED y protocolo de padres';
  END IF;
  CASE TG_TABLE_NAME
    WHEN 'payment_plan_versions' THEN plan_id_value:=NEW.plan_id;
    WHEN 'payment_installments' THEN
      SELECT plan_id INTO plan_id_value FROM public.payment_plan_versions WHERE id=NEW.version_id;
    WHEN 'payment_plans' THEN plan_id_value:=NEW.id;
    WHEN 'payments' THEN
      SELECT id INTO plan_id_value FROM public.payment_plans WHERE reservation_id=NEW.reservation_id OR legacy_unit_sale_id=NEW.legacy_unit_sale_id;
      payment_id_value:=NEW.id;
    WHEN 'payment_events','payment_reversals','payment_allocations' THEN
      payment_id_value:=NEW.payment_id;
      SELECT p.id INTO plan_id_value FROM public.payment_plans p JOIN public.payments m
        ON p.reservation_id=m.reservation_id OR p.legacy_unit_sale_id=m.legacy_unit_sale_id WHERE m.id=payment_id_value;
      IF TG_TABLE_NAME='payment_allocations' THEN installment_id_value:=NEW.installment_id; END IF;
    WHEN 'allocation_carryforwards' THEN
      SELECT a.payment_id,v.plan_id INTO payment_id_value,plan_id_value FROM public.payment_allocations a
        JOIN public.payment_installments i ON i.id=a.installment_id JOIN public.payment_plan_versions v ON v.id=i.version_id WHERE a.id=NEW.allocation_id;
      installment_id_value:=NEW.installment_id;
  END CASE;
  IF TG_TABLE_NAME='payment_plans' THEN
    reservation_id_value:=NEW.reservation_id;
    SELECT deal_id INTO deal_id_value FROM public.unit_sales WHERE id=NEW.legacy_unit_sale_id;
  ELSIF plan_id_value IS NOT NULL THEN
    SELECT p.reservation_id,s.deal_id INTO reservation_id_value,deal_id_value
      FROM public.payment_plans p LEFT JOIN public.unit_sales s ON s.id=p.legacy_unit_sale_id WHERE p.id=plan_id_value;
  ELSIF TG_TABLE_NAME='payments' THEN
    reservation_id_value:=NEW.reservation_id;
    SELECT deal_id INTO deal_id_value FROM public.unit_sales WHERE id=NEW.legacy_unit_sale_id;
  ELSIF payment_id_value IS NOT NULL THEN
    SELECT m.reservation_id,s.deal_id INTO reservation_id_value,deal_id_value
      FROM public.payments m LEFT JOIN public.unit_sales s ON s.id=m.legacy_unit_sale_id WHERE m.id=payment_id_value;
  END IF;
  PERFORM id FROM public.reservations WHERE id=reservation_id_value ORDER BY id FOR UPDATE;
  PERFORM id FROM public.deals WHERE id=deal_id_value ORDER BY id FOR UPDATE;
  PERFORM id FROM public.payment_plans WHERE id=plan_id_value ORDER BY id FOR UPDATE;
  IF TG_TABLE_NAME='payment_plan_versions' THEN
    IF NEW.template_id IS NOT NULL THEN
      IF TG_OP='INSERT' THEN template_changed:=true;
      ELSE template_changed:=NEW.template_id IS DISTINCT FROM OLD.template_id;
      END IF;
      IF template_changed THEN
        PERFORM id FROM public.payment_plan_templates WHERE id=NEW.template_id AND status='aprobada' FOR SHARE;
        IF NOT FOUND THEN RAISE EXCEPTION USING ERRCODE='23514', MESSAGE='M40: solo se asignan plantillas aprobadas vigentes'; END IF;
      END IF;
    END IF;
  END IF;
  PERFORM id FROM public.payments WHERE id=payment_id_value ORDER BY id FOR UPDATE;
  IF TG_TABLE_NAME='payment_allocations' THEN
    IF NOT EXISTS (SELECT 1 FROM public.payment_installments i JOIN public.payment_plan_versions v ON v.id=i.version_id
      WHERE i.id=NEW.installment_id AND v.plan_id=plan_id_value) THEN
      RAISE EXCEPTION USING ERRCODE='23514', MESSAGE='M40: cuota fuera del expediente del pago';
    END IF;
    IF NEW.reversal_of_id IS NULL AND NOT EXISTS (SELECT 1 FROM public.payment_installments i JOIN public.payment_plans p ON p.active_version_id=i.version_id
      WHERE i.id=NEW.installment_id AND p.id=plan_id_value) THEN
      RAISE EXCEPTION USING ERRCODE='23514', MESSAGE='M40: nuevas aplicaciones solo al calendario vigente';
    END IF;
  ELSIF TG_TABLE_NAME='allocation_carryforwards' THEN
    IF NEW.reversal_of_id IS NULL AND NOT EXISTS (SELECT 1 FROM public.payment_plans p JOIN public.payment_installments i ON i.version_id=p.active_version_id
      WHERE p.id=plan_id_value AND p.active_version_id=NEW.destination_version_id AND i.id=NEW.installment_id) THEN
      RAISE EXCEPTION USING ERRCODE='23514', MESSAGE='M40: nuevo crédito trasladado solo al calendario vigente';
    END IF;
  END IF;
  PERFORM id FROM public.payment_installments WHERE id=installment_id_value ORDER BY id FOR UPDATE;
  IF TG_TABLE_NAME='payment_installments' THEN
    IF EXISTS (SELECT 1 FROM public.payment_plan_versions WHERE id=NEW.version_id AND status<>'borrador') THEN
      RAISE EXCEPTION USING ERRCODE='23514', MESSAGE='M40: no se añaden cuotas a una versión acordada';
    END IF;
  END IF;
  RETURN NEW;
END $$;
--> statement-breakpoint
-- Una modificación legacy no puede deshacer el contrato de un calendario acordado.
CREATE FUNCTION m40_b1d_origin_guard() RETURNS trigger LANGUAGE plpgsql SET search_path = pg_catalog, public AS $$
BEGIN
  IF TG_TABLE_NAME='reservations' THEN
    IF (NEW.currency,NEW.total_cents) IS NOT DISTINCT FROM (OLD.currency,OLD.total_cents) THEN RETURN NEW; END IF;
    PERFORM id FROM public.payment_plans WHERE reservation_id=OLD.id ORDER BY id FOR UPDATE;
    IF EXISTS (SELECT 1 FROM public.payment_plans p JOIN public.payment_plan_versions v ON v.plan_id=p.id
      WHERE p.reservation_id=OLD.id AND v.status<>'borrador') THEN
      RAISE EXCEPTION USING ERRCODE='23514', MESSAGE='M40: reserva con calendario acordado requiere modificación contractual explícita';
    END IF;
  ELSE
    IF (NEW.currency,NEW.amount_cents) IS NOT DISTINCT FROM (OLD.currency,OLD.amount_cents) THEN RETURN NEW; END IF;
    PERFORM p.id FROM public.payment_plans p JOIN public.unit_sales s ON s.id=p.legacy_unit_sale_id WHERE s.deal_id=OLD.id ORDER BY p.id FOR UPDATE OF p;
    IF EXISTS (SELECT 1 FROM public.payment_plans p JOIN public.unit_sales s ON s.id=p.legacy_unit_sale_id JOIN public.payment_plan_versions v ON v.plan_id=p.id
      WHERE s.deal_id=OLD.id AND v.status<>'borrador') THEN
      RAISE EXCEPTION USING ERRCODE='23514', MESSAGE='M40: venta adoptada con calendario acordado conserva su importe';
    END IF;
  END IF;
  RETURN NEW;
END $$;
--> statement-breakpoint
CREATE TRIGGER m40_b1d_reservation_contract BEFORE UPDATE OF currency,total_cents ON public.reservations FOR EACH ROW EXECUTE FUNCTION m40_b1d_origin_guard();
--> statement-breakpoint
CREATE TRIGGER m40_b1d_legacy_contract BEFORE UPDATE OF currency,amount_cents ON public.deals FOR EACH ROW EXECUTE FUNCTION m40_b1d_origin_guard();
--> statement-breakpoint
CREATE FUNCTION m40_b1d_check_plan(target_id integer) RETURNS void LANGUAGE plpgsql SET search_path = pg_catalog, public AS $$
DECLARE p public.payment_plans%ROWTYPE; v public.payment_plan_versions%ROWTYPE; origin_currency text; origin_total bigint;
BEGIN
  SELECT * INTO p FROM public.payment_plans WHERE id=target_id;
  IF NOT FOUND THEN RETURN; END IF;
  IF p.reservation_id IS NOT NULL THEN
    SELECT currency,total_cents INTO origin_currency,origin_total FROM public.reservations WHERE id=p.reservation_id;
  ELSE
    SELECT d.currency,d.amount_cents INTO origin_currency,origin_total FROM public.unit_sales s JOIN public.deals d ON d.id=s.deal_id WHERE s.id=p.legacy_unit_sale_id;
  END IF;
  IF p.currency IS DISTINCT FROM origin_currency THEN
    RAISE EXCEPTION USING ERRCODE='23514', MESSAGE='M40: moneda de plan distinta de su contrato';
  END IF;
  IF p.active_version_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.payment_plan_versions WHERE id=p.active_version_id AND plan_id=p.id AND status IN ('acordado_activo','completado'))
    OR p.active_version_id IS NULL AND EXISTS (SELECT 1 FROM public.payment_plan_versions WHERE plan_id=p.id AND status<>'borrador') THEN
    RAISE EXCEPTION USING ERRCODE='23514', MESSAGE='M40: versión activa ajena o ausente';
  END IF;
  FOR v IN SELECT * FROM public.payment_plan_versions WHERE plan_id=p.id LOOP
    IF v.currency<>p.currency OR v.status IN ('acordado_activo','completado') AND v.id IS DISTINCT FROM p.active_version_id
      OR v.previous_version_id IS NULL AND v.version<>1 OR v.previous_version_id IS NOT NULL AND NOT EXISTS
        (SELECT 1 FROM public.payment_plan_versions prev WHERE prev.id=v.previous_version_id AND prev.plan_id=p.id AND prev.version=v.version-1 AND prev.total_cents=v.total_cents AND prev.currency=v.currency)
      OR v.template_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.payment_plan_templates t WHERE t.id=v.template_id AND t.status IN ('aprobada','retirada')) THEN
      RAISE EXCEPTION USING ERRCODE='23514', MESSAGE='M40: historial, plantilla o moneda de versión inválidos';
    END IF;
    IF v.status<>'borrador' AND (origin_total IS NULL OR v.total_cents<>origin_total
      OR v.total_cents<>(SELECT coalesce(sum(amount_cents),0) FROM public.payment_installments WHERE version_id=v.id)) THEN
      RAISE EXCEPTION USING ERRCODE='23514', MESSAGE='M40: calendario acordado no suma el total contractual';
    END IF;
    IF v.status='sustituido' AND NOT EXISTS (SELECT 1 FROM public.payment_plan_versions n WHERE n.previous_version_id=v.id AND n.status<>'borrador') THEN
      RAISE EXCEPTION USING ERRCODE='23514', MESSAGE='M40: sustitución sin calendario acordado';
    END IF;
    IF v.previous_version_id IS NOT NULL AND v.status<>'borrador' AND NOT EXISTS
      (SELECT 1 FROM public.payment_plan_versions prev WHERE prev.id=v.previous_version_id AND prev.status='sustituido') THEN
      RAISE EXCEPTION USING ERRCODE='23514', MESSAGE='M40: versión anterior debe quedar histórica';
    END IF;
  END LOOP;
END $$;
--> statement-breakpoint
CREATE FUNCTION m40_b1d_check_payment(target_id integer) RETURNS void LANGUAGE plpgsql SET search_path = pg_catalog, public AS $$
DECLARE p public.payments%ROWTYPE; reversed numeric; allocated numeric; expected_status text;
BEGIN
  SELECT * INTO p FROM public.payments WHERE id=target_id;
  IF NOT FOUND THEN RETURN; END IF;
  SELECT coalesce(sum(amount_cents),0) INTO reversed FROM public.payment_reversals WHERE payment_id=p.id;
  SELECT coalesce(sum(CASE WHEN reversal_of_id IS NULL THEN source_amount_cents::numeric ELSE -source_amount_cents::numeric END),0)
    INTO allocated FROM public.payment_allocations WHERE payment_id=p.id;
  IF reversed>p.amount_cents OR allocated<0 OR allocated+reversed>p.amount_cents
    OR p.status IN ('pendiente','rechazado') AND (reversed<>0 OR allocated<>0) THEN
    RAISE EXCEPTION USING ERRCODE='23514', MESSAGE='M40: pago no confirmado, sobreaplicado o reversado en exceso';
  END IF;
  IF p.status<>'pendiente' AND NOT EXISTS (SELECT 1 FROM public.payment_events e WHERE e.payment_id=p.id
    AND e.event_type=CASE WHEN p.status='rechazado' THEN 'rechazado' ELSE 'confirmado' END AND e.created_by=p.verified_by) THEN
    RAISE EXCEPTION USING ERRCODE='23514', MESSAGE='M40: verificación sin evento atribuible independiente';
  END IF;
  IF p.status IN ('pendiente','rechazado') AND EXISTS (SELECT 1 FROM public.payment_events WHERE payment_id=p.id AND event_type IN ('confirmado','aplicado','reverso','contracargo')) THEN
    RAISE EXCEPTION USING ERRCODE='23514', MESSAGE='M40: evento monetario sin confirmación';
  END IF;
  IF p.status NOT IN ('pendiente','rechazado') THEN
    expected_status:=CASE WHEN EXISTS (SELECT 1 FROM public.payment_reversals r JOIN public.payment_events e ON e.id=r.event_id WHERE r.payment_id=p.id AND e.event_type='contracargo') THEN 'contracargo'
      WHEN reversed=p.amount_cents THEN 'reversado_total' WHEN reversed>0 THEN 'reversado_parcial' ELSE 'confirmado' END;
    IF p.status<>expected_status THEN RAISE EXCEPTION USING ERRCODE='23514', MESSAGE='M40: estado de pago no corresponde a compensaciones'; END IF;
  END IF;
  IF EXISTS (SELECT 1 FROM public.payment_reversals r JOIN public.payment_events e ON e.id=r.event_id WHERE r.payment_id=p.id AND (r.currency<>p.currency OR e.event_type NOT IN ('reverso','contracargo')))
    OR EXISTS (SELECT 1 FROM public.payment_events e WHERE e.payment_id=p.id AND (e.connection_id IS NOT NULL AND e.connection_id IS DISTINCT FROM p.connection_id
      OR e.event_type IN ('reverso','contracargo') AND NOT EXISTS (SELECT 1 FROM public.payment_reversals r WHERE r.event_id=e.id))) THEN
    RAISE EXCEPTION USING ERRCODE='23514', MESSAGE='M40: evento, conexión o reverso incoherentes';
  END IF;
END $$;
--> statement-breakpoint
CREATE FUNCTION m40_b1d_check_allocations(target_plan integer) RETURNS void LANGUAGE plpgsql SET search_path = pg_catalog, public AS $$
DECLARE allocation_row record; carry_row record; installment_row record; p public.payment_plans%ROWTYPE; rate_row public.fx_rates%ROWTYPE; converted numeric; net numeric;
BEGIN
  SELECT * INTO p FROM public.payment_plans WHERE id=target_plan;
  IF NOT FOUND THEN RETURN; END IF;
  FOR allocation_row IN SELECT a.*,i.currency AS installment_currency,i.version_id,v.status AS version_status,e.event_type,m.currency AS payment_currency,m.reservation_id,m.legacy_unit_sale_id,m.status AS payment_status
    FROM public.payment_allocations a JOIN public.payment_installments i ON i.id=a.installment_id
    JOIN public.payment_plan_versions v ON v.id=i.version_id JOIN public.payments m ON m.id=a.payment_id JOIN public.payment_events e ON e.id=a.event_id WHERE v.plan_id=p.id LOOP
    IF allocation_row.reservation_id IS DISTINCT FROM p.reservation_id OR allocation_row.legacy_unit_sale_id IS DISTINCT FROM p.legacy_unit_sale_id
      OR allocation_row.source_currency<>allocation_row.payment_currency OR allocation_row.applied_currency<>allocation_row.installment_currency OR allocation_row.version_status='borrador'
      OR allocation_row.payment_status IN ('pendiente','rechazado') THEN
      RAISE EXCEPTION USING ERRCODE='23514', MESSAGE='M40: imputación fuera de expediente, moneda o calendario acordado';
    END IF;
    IF allocation_row.reversal_of_id IS NULL AND allocation_row.event_type NOT IN ('confirmado','aplicado')
      OR allocation_row.reversal_of_id IS NOT NULL AND (allocation_row.event_type NOT IN ('reverso','contracargo') OR NOT EXISTS
        (SELECT 1 FROM public.payment_allocations orig WHERE orig.id=allocation_row.reversal_of_id AND orig.reversal_of_id IS NULL AND orig.payment_id=allocation_row.payment_id
          AND orig.installment_id=allocation_row.installment_id AND orig.fx_rate_id IS NOT DISTINCT FROM allocation_row.fx_rate_id AND orig.source_currency=allocation_row.source_currency AND orig.applied_currency=allocation_row.applied_currency)) THEN
      RAISE EXCEPTION USING ERRCODE='23514', MESSAGE='M40: compensación sin aplicación original compatible';
    END IF;
    IF allocation_row.fx_rate_id IS NOT NULL THEN
      SELECT * INTO rate_row FROM public.fx_rates WHERE id=allocation_row.fx_rate_id;
      IF allocation_row.source_currency=rate_row.base_currency AND allocation_row.applied_currency=rate_row.quote_currency THEN
        converted:=public.m40_b1d_round(allocation_row.source_amount_cents::numeric*(rate_row.rate*1000000000000),1000000000000,rate_row.rounding);
      ELSIF allocation_row.source_currency=rate_row.quote_currency AND allocation_row.applied_currency=rate_row.base_currency THEN
        converted:=public.m40_b1d_round(allocation_row.source_amount_cents::numeric*1000000000000,rate_row.rate*1000000000000,rate_row.rounding);
      ELSE RAISE EXCEPTION USING ERRCODE='23514', MESSAGE='M40: dirección FX inválida'; END IF;
      IF allocation_row.reversal_of_id IS NOT NULL THEN
        -- La última compensación absorbe el residual de conversión del original.
        SELECT CASE WHEN allocation_row.source_amount_cents=orig.source_amount_cents-
          (SELECT coalesce(sum(r.source_amount_cents),0) FROM public.payment_allocations r WHERE r.reversal_of_id=orig.id AND r.id<allocation_row.id)
          THEN orig.applied_amount_cents-(SELECT coalesce(sum(r.applied_amount_cents),0) FROM public.payment_allocations r WHERE r.reversal_of_id=orig.id AND r.id<allocation_row.id)
          ELSE converted END INTO converted FROM public.payment_allocations orig WHERE orig.id=allocation_row.reversal_of_id;
      END IF;
      IF converted<>allocation_row.applied_amount_cents THEN RAISE EXCEPTION USING ERRCODE='23514', MESSAGE='M40: conversión no coincide con tasa pactada'; END IF;
    END IF;
    IF allocation_row.reversal_of_id IS NULL AND EXISTS (SELECT 1 FROM public.payment_allocations r WHERE r.reversal_of_id=allocation_row.id GROUP BY r.reversal_of_id
      HAVING sum(r.source_amount_cents)>allocation_row.source_amount_cents OR sum(r.applied_amount_cents)>allocation_row.applied_amount_cents
        OR sum(r.source_amount_cents)=allocation_row.source_amount_cents AND sum(r.applied_amount_cents)<>allocation_row.applied_amount_cents
        OR sum(r.applied_amount_cents)=allocation_row.applied_amount_cents AND sum(r.source_amount_cents)<>allocation_row.source_amount_cents) THEN
      RAISE EXCEPTION USING ERRCODE='23514', MESSAGE='M40: compensación excede o no liquida su aplicación original';
    END IF;
    IF allocation_row.reversal_of_id IS NULL THEN
      net:=allocation_row.applied_amount_cents-(SELECT coalesce(sum(applied_amount_cents),0) FROM public.payment_allocations WHERE reversal_of_id=allocation_row.id);
      IF EXISTS (SELECT 1 FROM public.allocation_carryforwards c WHERE c.allocation_id=allocation_row.id GROUP BY c.destination_version_id
        HAVING sum(CASE WHEN c.reversal_of_id IS NULL THEN c.amount_cents::numeric ELSE -c.amount_cents::numeric END)>net) THEN
        RAISE EXCEPTION USING ERRCODE='23514', MESSAGE='M40: traslado excede crédito neto original';
      END IF;
    END IF;
  END LOOP;
  FOR carry_row IN SELECT c.*,v.plan_id,v.version,d.version AS destination_number,orig.reversal_of_id AS original_compensation,orig.applied_currency,
    i.version_id AS actual_destination FROM public.allocation_carryforwards c
    JOIN public.payment_allocations orig ON orig.id=c.allocation_id JOIN public.payment_installments oi ON oi.id=orig.installment_id
    JOIN public.payment_plan_versions v ON v.id=oi.version_id JOIN public.payment_plan_versions d ON d.id=c.destination_version_id
    JOIN public.payment_installments i ON i.id=c.installment_id WHERE v.plan_id=p.id OR d.plan_id=p.id LOOP
    IF carry_row.plan_id<>p.id OR carry_row.original_compensation IS NOT NULL OR carry_row.actual_destination<>carry_row.destination_version_id OR carry_row.currency<>carry_row.applied_currency
      OR carry_row.destination_number<=carry_row.version OR NOT EXISTS (SELECT 1 FROM public.payment_plan_versions WHERE id=carry_row.destination_version_id AND plan_id=p.id AND status<>'borrador')
      OR carry_row.reversal_of_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.allocation_carryforwards orig WHERE orig.id=carry_row.reversal_of_id AND orig.reversal_of_id IS NULL
        AND orig.allocation_id=carry_row.allocation_id AND orig.installment_id=carry_row.installment_id AND orig.destination_version_id=carry_row.destination_version_id AND orig.currency=carry_row.currency) THEN
      RAISE EXCEPTION USING ERRCODE='23514', MESSAGE='M40: traslado ajeno, cíclico o compensación inválida';
    END IF;
    IF carry_row.reversal_of_id IS NULL AND carry_row.amount_cents<(SELECT coalesce(sum(amount_cents),0) FROM public.allocation_carryforwards WHERE reversal_of_id=carry_row.id) THEN
      RAISE EXCEPTION USING ERRCODE='23514', MESSAGE='M40: compensación de traslado excesiva';
    END IF;
  END LOOP;
  FOR installment_row IN SELECT i.* FROM public.payment_installments i JOIN public.payment_plan_versions v ON v.id=i.version_id WHERE v.plan_id=p.id LOOP
    SELECT (SELECT coalesce(sum(CASE WHEN reversal_of_id IS NULL THEN applied_amount_cents::numeric ELSE -applied_amount_cents::numeric END),0) FROM public.payment_allocations WHERE installment_id=installment_row.id)
      +(SELECT coalesce(sum(CASE WHEN reversal_of_id IS NULL THEN amount_cents::numeric ELSE -amount_cents::numeric END),0) FROM public.allocation_carryforwards WHERE installment_id=installment_row.id) INTO net;
    IF net<0 OR net>installment_row.amount_cents THEN RAISE EXCEPTION USING ERRCODE='23514', MESSAGE='M40: cuota sobreimputada'; END IF;
    IF net<>installment_row.amount_cents AND EXISTS (SELECT 1 FROM public.payment_plan_versions WHERE id=installment_row.version_id AND status='completado') THEN
      RAISE EXCEPTION USING ERRCODE='23514', MESSAGE='M40: plan completado con deuda pendiente';
    END IF;
  END LOOP;
END $$;
--> statement-breakpoint
CREATE FUNCTION m40_b1d_check() RETURNS trigger LANGUAGE plpgsql SET search_path = pg_catalog, public AS $$
DECLARE plan_id_value integer; payment_id_value integer; item jsonb; seq integer:=0;
BEGIN
  CASE TG_TABLE_NAME
    WHEN 'payment_plan_templates' THEN
      FOR item IN SELECT value FROM jsonb_array_elements(NEW.calendar) LOOP
        seq:=seq+1;
        IF jsonb_typeof(item)<>'object' OR NOT (item ?& ARRAY['sequence','concept','weight','offsetDays'])
          OR (item-ARRAY['sequence','concept','weight','offsetDays'])<>'{}'::jsonb
          OR jsonb_typeof(item->'sequence')<>'number' OR (item->>'sequence') !~ '^[1-9][0-9]{0,8}$' OR (item->>'sequence')::numeric<>seq
          OR jsonb_typeof(item->'weight')<>'number' OR (item->>'weight') !~ '^[1-9][0-9]{0,8}$'
          OR jsonb_typeof(item->'offsetDays')<>'number' OR (item->>'offsetDays') !~ '^(0|[1-9][0-9]{0,8})$'
          OR jsonb_typeof(item->'concept')<>'string' OR length(btrim(item->>'concept'))=0 THEN
          RAISE EXCEPTION USING ERRCODE='23514', MESSAGE='M40: calendario de plantilla no tipado';
        END IF;
      END LOOP;
      RETURN NULL;
    WHEN 'payment_plans' THEN plan_id_value:=NEW.id;
    WHEN 'payment_plan_versions' THEN plan_id_value:=NEW.plan_id;
    WHEN 'payment_installments' THEN SELECT plan_id INTO plan_id_value FROM public.payment_plan_versions WHERE id=NEW.version_id;
    WHEN 'payments' THEN payment_id_value:=NEW.id;
    WHEN 'payment_events','payment_reversals','payment_allocations' THEN payment_id_value:=NEW.payment_id;
    WHEN 'allocation_carryforwards' THEN
      SELECT payment_id INTO payment_id_value FROM public.payment_allocations WHERE id=NEW.allocation_id;
  END CASE;
  IF payment_id_value IS NOT NULL THEN
    PERFORM public.m40_b1d_check_payment(payment_id_value);
    SELECT p.id INTO plan_id_value FROM public.payment_plans p JOIN public.payments m
      ON p.reservation_id=m.reservation_id OR p.legacy_unit_sale_id=m.legacy_unit_sale_id WHERE m.id=payment_id_value;
    IF TG_TABLE_NAME IN ('payment_allocations','allocation_carryforwards') AND plan_id_value IS NULL THEN
      RAISE EXCEPTION USING ERRCODE='23514', MESSAGE='M40: aplicación sin plan del pago';
    END IF;
  END IF;
  PERFORM public.m40_b1d_check_plan(plan_id_value);
  PERFORM public.m40_b1d_check_allocations(plan_id_value);
  RETURN NULL;
END $$;
--> statement-breakpoint
DO $$
DECLARE table_name text; role_name text;
BEGIN
  FOREACH table_name IN ARRAY ARRAY['payment_plan_templates','payment_plans','payment_plan_versions','payment_installments','fx_rates','payments','payment_events','payment_allocations','allocation_carryforwards','payment_reversals'] LOOP
    EXECUTE format('CREATE TRIGGER m40_b1d_00_history BEFORE UPDATE OR DELETE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.m40_b1d_history()',table_name);
    EXECUTE format('CREATE TRIGGER m40_b1d_no_truncate BEFORE TRUNCATE ON public.%I FOR EACH STATEMENT EXECUTE FUNCTION public.m40_b1d_history()',table_name);
    IF table_name NOT IN ('fx_rates','payment_plan_templates') THEN
      EXECUTE format('CREATE TRIGGER m40_b1d_10_lock BEFORE INSERT OR UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.m40_b1d_lock()',table_name);
    END IF;
    IF table_name<>'fx_rates' THEN
      EXECUTE format('CREATE CONSTRAINT TRIGGER m40_b1d_complete AFTER INSERT OR UPDATE ON public.%I DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION public.m40_b1d_check()',table_name);
    END IF;
    EXECUTE format('REVOKE ALL ON TABLE public.%I FROM PUBLIC',table_name);
    EXECUTE format('REVOKE ALL ON SEQUENCE public.%I FROM PUBLIC',table_name||'_id_seq');
    FOREACH role_name IN ARRAY ARRAY['anon','authenticated'] LOOP
      IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname=role_name) THEN
        EXECUTE format('REVOKE ALL ON TABLE public.%I FROM %I',table_name,role_name);
        EXECUTE format('REVOKE ALL ON SEQUENCE public.%I FROM %I',table_name||'_id_seq',role_name);
      END IF;
    END LOOP;
  END LOOP;
END $$;
--> statement-breakpoint
REVOKE ALL ON FUNCTION m40_b1d_round(numeric,numeric,text),m40_b1d_history(),m40_b1d_lock(),m40_b1d_origin_guard(),m40_b1d_check_plan(integer),m40_b1d_check_payment(integer),m40_b1d_check_allocations(integer),m40_b1d_check() FROM PUBLIC;
