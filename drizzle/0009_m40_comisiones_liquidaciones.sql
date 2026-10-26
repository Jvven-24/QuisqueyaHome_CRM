CREATE TABLE "beneficiary_accounts" (
	"id" serial PRIMARY KEY NOT NULL,
	"public_id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"beneficiary_user_id" integer,
	"beneficiary_agency_id" integer,
	"version" integer NOT NULL,
	"currency" text NOT NULL,
	"masked_account" text NOT NULL,
	"bank_document_id" integer NOT NULL,
	"document_hash" text NOT NULL,
	"verified_by" integer NOT NULL,
	"verified_at" timestamp with time zone NOT NULL,
	"created_by" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"source" text NOT NULL,
	"correlation_id" uuid NOT NULL,
	CONSTRAINT "beneficiary_accounts_values_check" CHECK (num_nonnulls("beneficiary_accounts"."beneficiary_user_id","beneficiary_accounts"."beneficiary_agency_id") = 1 and "beneficiary_accounts"."version" > 0 and "beneficiary_accounts"."currency" in ('USD','DOP') and "beneficiary_accounts"."masked_account" ~ '^[*]{4}[0-9]{4}$' and "beneficiary_accounts"."document_hash" ~ '^[0-9a-f]{64}$' and "beneficiary_accounts"."verified_by" <> "beneficiary_accounts"."created_by" and "beneficiary_accounts"."verified_at" >= "beneficiary_accounts"."created_at" and length(btrim("beneficiary_accounts"."source")) > 0)
);
--> statement-breakpoint
ALTER TABLE "beneficiary_accounts" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "commission_adjustments" (
	"id" serial PRIMARY KEY NOT NULL,
	"public_id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"entry_id" integer NOT NULL,
	"amount_cents" bigint NOT NULL,
	"reason" text NOT NULL,
	"evidence_id" integer NOT NULL,
	"command_id" integer NOT NULL,
	"approval_id" integer NOT NULL,
	"reversal_of_id" integer,
	"created_by" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"source" text NOT NULL,
	"correlation_id" uuid NOT NULL,
	CONSTRAINT "commission_adjustments_command_unq" UNIQUE("entry_id","command_id"),
	CONSTRAINT "commission_adjustments_approval_unq" UNIQUE("approval_id"),
	CONSTRAINT "commission_adjustments_values_check" CHECK ("commission_adjustments"."amount_cents" <> 0 and ("commission_adjustments"."reversal_of_id" is null or "commission_adjustments"."reversal_of_id" <> "commission_adjustments"."id") and length(btrim("commission_adjustments"."reason")) > 0 and length(btrim("commission_adjustments"."source")) > 0)
);
--> statement-breakpoint
ALTER TABLE "commission_adjustments" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "commission_agreements" (
	"id" serial PRIMARY KEY NOT NULL,
	"public_id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"deal_id" integer NOT NULL,
	"reservation_id" integer,
	"rule_version_id" integer NOT NULL,
	"version" integer NOT NULL,
	"base_cents" bigint NOT NULL,
	"exclusions_cents" bigint NOT NULL,
	"pool_cents" bigint NOT NULL,
	"currency" text NOT NULL,
	"evidence_id" integer NOT NULL,
	"terms_hash" text NOT NULL,
	"created_by" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"source" text NOT NULL,
	"correlation_id" uuid NOT NULL,
	CONSTRAINT "commission_agreements_number_unq" UNIQUE("deal_id","version"),
	CONSTRAINT "commission_agreements_values_check" CHECK ("commission_agreements"."version" > 0 and "commission_agreements"."base_cents" >= 0 and "commission_agreements"."exclusions_cents" between 0 and "commission_agreements"."base_cents" and "commission_agreements"."pool_cents" > 0 and "commission_agreements"."currency" in ('USD','DOP') and "commission_agreements"."terms_hash" ~ '^[0-9a-f]{64}$' and length(btrim("commission_agreements"."source")) > 0)
);
--> statement-breakpoint
ALTER TABLE "commission_agreements" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "commission_entries" (
	"id" serial PRIMARY KEY NOT NULL,
	"public_id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"agreement_id" integer NOT NULL,
	"split_id" integer NOT NULL,
	"milestone_key" uuid NOT NULL,
	"milestone_evidence_id" integer NOT NULL,
	"origin_command_id" integer NOT NULL,
	"base_cents" bigint NOT NULL,
	"gross_cents" bigint NOT NULL,
	"currency" text NOT NULL,
	"status" text DEFAULT 'esperada' NOT NULL,
	"created_by" integer NOT NULL,
	"updated_by" integer NOT NULL,
	"row_version" integer DEFAULT 1 NOT NULL,
	"correlation_id" uuid NOT NULL,
	"source" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "commission_entries_milestone_unq" UNIQUE("agreement_id","split_id","milestone_key"),
	CONSTRAINT "commission_entries_values_check" CHECK ("commission_entries"."base_cents" >= 0 and "commission_entries"."gross_cents" > 0 and "commission_entries"."currency" in ('USD','DOP') and "commission_entries"."status" in ('esperada','devengada','aprobada','exigible','pagada','retirada') and "commission_entries"."row_version" > 0 and length(btrim("commission_entries"."source")) > 0)
);
--> statement-breakpoint
ALTER TABLE "commission_entries" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "commission_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"public_id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"entry_id" integer NOT NULL,
	"previous_state" text NOT NULL,
	"state" text NOT NULL,
	"previous_version" integer NOT NULL,
	"command_id" integer NOT NULL,
	"payment_event_id" integer,
	"evidence_id" integer NOT NULL,
	"reason" text NOT NULL,
	"created_by" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"source" text NOT NULL,
	"correlation_id" uuid NOT NULL,
	CONSTRAINT "commission_events_version_unq" UNIQUE("entry_id","previous_version"),
	CONSTRAINT "commission_events_command_unq" UNIQUE("entry_id","command_id"),
	CONSTRAINT "commission_events_transition_check" CHECK (("commission_events"."previous_state","commission_events"."state") in (('esperada','devengada'),('esperada','retirada'),('devengada','aprobada'),('aprobada','exigible'),('exigible','pagada')) and "commission_events"."previous_version" > 0 and length(btrim("commission_events"."reason")) > 0 and length(btrim("commission_events"."source")) > 0)
);
--> statement-breakpoint
ALTER TABLE "commission_events" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "commission_rule_versions" (
	"id" serial PRIMARY KEY NOT NULL,
	"public_id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"rule_id" integer NOT NULL,
	"version" integer NOT NULL,
	"formula_kind" text NOT NULL,
	"basis_points" integer,
	"fixed_amount_cents" bigint,
	"currency" text NOT NULL,
	"terms_document_id" integer NOT NULL,
	"terms_hash" text NOT NULL,
	"valid_from" timestamp with time zone NOT NULL,
	"valid_until" timestamp with time zone,
	"approved_by" integer NOT NULL,
	"approved_at" timestamp with time zone NOT NULL,
	"created_by" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"source" text NOT NULL,
	"correlation_id" uuid NOT NULL,
	CONSTRAINT "commission_rule_versions_number_unq" UNIQUE("rule_id","version"),
	CONSTRAINT "commission_rule_versions_values_check" CHECK ("commission_rule_versions"."version" > 0 and "commission_rule_versions"."currency" in ('USD','DOP') and "commission_rule_versions"."terms_hash" ~ '^[0-9a-f]{64}$' and "commission_rule_versions"."approved_by" <> "commission_rule_versions"."created_by" and "commission_rule_versions"."approved_at" >= "commission_rule_versions"."created_at" and ("commission_rule_versions"."valid_until" is null or "commission_rule_versions"."valid_until" > "commission_rule_versions"."valid_from") and length(btrim("commission_rule_versions"."source")) > 0),
	CONSTRAINT "commission_rule_versions_formula_check" CHECK (("commission_rule_versions"."formula_kind" = 'basis_points' and "commission_rule_versions"."basis_points" is not null and "commission_rule_versions"."basis_points" between 1 and 10000 and "commission_rule_versions"."fixed_amount_cents" is null) or ("commission_rule_versions"."formula_kind" = 'fixed' and "commission_rule_versions"."fixed_amount_cents" is not null and "commission_rule_versions"."fixed_amount_cents" > 0 and "commission_rule_versions"."basis_points" is null))
);
--> statement-breakpoint
ALTER TABLE "commission_rule_versions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "commission_rules" (
	"id" serial PRIMARY KEY NOT NULL,
	"public_id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"project_id" integer,
	"active_version_id" integer,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_by" integer NOT NULL,
	"updated_by" integer NOT NULL,
	"row_version" integer DEFAULT 1 NOT NULL,
	"correlation_id" uuid NOT NULL,
	"source" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "commission_rules_code_unq" UNIQUE("code"),
	CONSTRAINT "commission_rules_values_check" CHECK (length(btrim("commission_rules"."code")) > 0 and length(btrim("commission_rules"."name")) > 0 and "commission_rules"."row_version" > 0 and length(btrim("commission_rules"."source")) > 0)
);
--> statement-breakpoint
ALTER TABLE "commission_rules" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "commission_splits" (
	"id" serial PRIMARY KEY NOT NULL,
	"agreement_id" integer NOT NULL,
	"beneficiary_user_id" integer,
	"beneficiary_agency_id" integer,
	"amount_cents" bigint NOT NULL,
	"created_by" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"source" text NOT NULL,
	"correlation_id" uuid NOT NULL,
	CONSTRAINT "commission_splits_agreement_id_unq" UNIQUE("agreement_id","id"),
	CONSTRAINT "commission_splits_values_check" CHECK (num_nonnulls("commission_splits"."beneficiary_user_id","commission_splits"."beneficiary_agency_id") = 1 and "commission_splits"."amount_cents" > 0 and length(btrim("commission_splits"."source")) > 0)
);
--> statement-breakpoint
ALTER TABLE "commission_splits" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "financial_approval_requests" (
	"id" serial PRIMARY KEY NOT NULL,
	"public_id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"batch_id" integer,
	"entry_id" integer,
	"adjustment_amount_cents" bigint,
	"adjustment_reason" text,
	"adjustment_reversal_of_id" integer,
	"object_version" integer NOT NULL,
	"content_hash" text NOT NULL,
	"requested_by" integer NOT NULL,
	"status" text DEFAULT 'pendiente' NOT NULL,
	"decided_by" integer,
	"decided_at" timestamp with time zone,
	"mfa_verified_at" timestamp with time zone,
	"evidence_id" integer NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_by" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"source" text NOT NULL,
	"correlation_id" uuid NOT NULL,
	CONSTRAINT "financial_approval_requests_values_check" CHECK (num_nonnulls("financial_approval_requests"."batch_id","financial_approval_requests"."entry_id") = 1 and "financial_approval_requests"."object_version" > 0 and "financial_approval_requests"."content_hash" ~ '^[0-9a-f]{64}$' and "financial_approval_requests"."expires_at" > "financial_approval_requests"."created_at" and "financial_approval_requests"."requested_by" = "financial_approval_requests"."created_by" and length(btrim("financial_approval_requests"."source")) > 0),
	CONSTRAINT "financial_approval_requests_target_check" CHECK (("financial_approval_requests"."batch_id" is not null and "financial_approval_requests"."adjustment_amount_cents" is null and "financial_approval_requests"."adjustment_reason" is null and "financial_approval_requests"."adjustment_reversal_of_id" is null) or ("financial_approval_requests"."entry_id" is not null and "financial_approval_requests"."adjustment_amount_cents" is not null and "financial_approval_requests"."adjustment_amount_cents" <> 0 and "financial_approval_requests"."adjustment_reason" is not null and length(btrim("financial_approval_requests"."adjustment_reason")) > 0)),
	CONSTRAINT "financial_approval_requests_decision_check" CHECK (("financial_approval_requests"."status" = 'pendiente' and "financial_approval_requests"."decided_by" is null and "financial_approval_requests"."decided_at" is null and "financial_approval_requests"."mfa_verified_at" is null) or ("financial_approval_requests"."status" in ('aprobada','rechazada') and "financial_approval_requests"."decided_by" is not null and "financial_approval_requests"."decided_by" <> "financial_approval_requests"."requested_by" and "financial_approval_requests"."decided_at" is not null and "financial_approval_requests"."decided_at" >= "financial_approval_requests"."created_at" and "financial_approval_requests"."decided_at" < "financial_approval_requests"."expires_at" and ("financial_approval_requests"."status" <> 'aprobada' or ("financial_approval_requests"."mfa_verified_at" is not null and "financial_approval_requests"."mfa_verified_at" <= "financial_approval_requests"."decided_at" and "financial_approval_requests"."mfa_verified_at" >= "financial_approval_requests"."created_at"))))
);
--> statement-breakpoint
ALTER TABLE "financial_approval_requests" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "legacy_commission_links" (
	"id" serial PRIMARY KEY NOT NULL,
	"legacy_commission_id" integer NOT NULL,
	"beneficiary_role" text NOT NULL,
	"entry_id" integer,
	"migration_status" text DEFAULT 'pendiente' NOT NULL,
	"evidence_id" integer NOT NULL,
	"created_by" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"source" text NOT NULL,
	"correlation_id" uuid NOT NULL,
	CONSTRAINT "legacy_commission_links_role_unq" UNIQUE("legacy_commission_id","beneficiary_role"),
	CONSTRAINT "legacy_commission_links_values_check" CHECK ("legacy_commission_links"."beneficiary_role" in ('broker','agency') and (("legacy_commission_links"."migration_status" = 'pendiente' and "legacy_commission_links"."entry_id" is null) or ("legacy_commission_links"."migration_status" = 'validada' and "legacy_commission_links"."entry_id" is not null)) and length(btrim("legacy_commission_links"."source")) > 0)
);
--> statement-breakpoint
ALTER TABLE "legacy_commission_links" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "payout_batches" (
	"id" serial PRIMARY KEY NOT NULL,
	"public_id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"currency" text NOT NULL,
	"status" text DEFAULT 'borrador' NOT NULL,
	"execution_key" uuid NOT NULL,
	"total_net_cents" bigint NOT NULL,
	"instructed_at" timestamp with time zone,
	"instructed_by" integer,
	"created_by" integer NOT NULL,
	"updated_by" integer NOT NULL,
	"row_version" integer DEFAULT 1 NOT NULL,
	"correlation_id" uuid NOT NULL,
	"source" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "payout_batches_execution_unq" UNIQUE("execution_key"),
	CONSTRAINT "payout_batches_values_check" CHECK ("payout_batches"."currency" in ('USD','DOP') and "payout_batches"."total_net_cents" >= 0 and "payout_batches"."row_version" > 0 and "payout_batches"."status" in ('borrador','pendiente_aprobacion','aprobado','instruido','parcialmente_conciliado','conciliado','cancelado') and length(btrim("payout_batches"."source")) > 0),
	CONSTRAINT "payout_batches_instruction_check" CHECK (("payout_batches"."status" in ('instruido','parcialmente_conciliado','conciliado') and "payout_batches"."instructed_at" is not null and "payout_batches"."instructed_by" is not null and "payout_batches"."instructed_at" >= "payout_batches"."created_at") or ("payout_batches"."status" not in ('instruido','parcialmente_conciliado','conciliado') and "payout_batches"."instructed_at" is null and "payout_batches"."instructed_by" is null))
);
--> statement-breakpoint
ALTER TABLE "payout_batches" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "payout_lines" (
	"id" serial PRIMARY KEY NOT NULL,
	"public_id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"batch_id" integer NOT NULL,
	"entry_id" integer NOT NULL,
	"account_id" integer NOT NULL,
	"gross_cents" bigint NOT NULL,
	"withholding_cents" bigint NOT NULL,
	"adjustment_cents" bigint NOT NULL,
	"net_cents" bigint NOT NULL,
	"status" text DEFAULT 'activa' NOT NULL,
	"execution_key" uuid NOT NULL,
	"external_reference" text,
	"reconciliation_evidence_id" integer,
	"reconciled_by" integer,
	"reconciled_at" timestamp with time zone,
	"created_by" integer NOT NULL,
	"updated_by" integer NOT NULL,
	"row_version" integer DEFAULT 1 NOT NULL,
	"correlation_id" uuid NOT NULL,
	"source" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "payout_lines_batch_entry_unq" UNIQUE("batch_id","entry_id"),
	CONSTRAINT "payout_lines_execution_unq" UNIQUE("execution_key"),
	CONSTRAINT "payout_lines_values_check" CHECK ("payout_lines"."gross_cents" > 0 and "payout_lines"."withholding_cents" >= 0 and "payout_lines"."net_cents" >= 0 and "payout_lines"."net_cents"::numeric = "payout_lines"."gross_cents"::numeric - "payout_lines"."withholding_cents"::numeric + "payout_lines"."adjustment_cents"::numeric and "payout_lines"."row_version" > 0 and "payout_lines"."status" in ('activa','instruida','desconocida','conciliada','cancelada') and length(btrim("payout_lines"."source")) > 0),
	CONSTRAINT "payout_lines_reconciliation_check" CHECK (("payout_lines"."status" = 'conciliada' and "payout_lines"."reconciliation_evidence_id" is not null and "payout_lines"."reconciled_by" is not null and "payout_lines"."reconciled_at" is not null and "payout_lines"."external_reference" is not null and length(btrim("payout_lines"."external_reference")) > 0 and "payout_lines"."reconciled_at" >= "payout_lines"."created_at") or ("payout_lines"."status" <> 'conciliada' and "payout_lines"."reconciliation_evidence_id" is null and "payout_lines"."reconciled_by" is null and "payout_lines"."reconciled_at" is null))
);
--> statement-breakpoint
ALTER TABLE "payout_lines" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "beneficiary_accounts" ADD CONSTRAINT "beneficiary_accounts_beneficiary_user_id_users_id_fk" FOREIGN KEY ("beneficiary_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE "beneficiary_accounts" ADD CONSTRAINT "beneficiary_accounts_beneficiary_agency_id_agencies_id_fk" FOREIGN KEY ("beneficiary_agency_id") REFERENCES "public"."agencies"("id") ON DELETE restrict ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE "beneficiary_accounts" ADD CONSTRAINT "beneficiary_accounts_bank_document_id_files_id_fk" FOREIGN KEY ("bank_document_id") REFERENCES "public"."files"("id") ON DELETE restrict ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE "beneficiary_accounts" ADD CONSTRAINT "beneficiary_accounts_verified_by_users_id_fk" FOREIGN KEY ("verified_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE "beneficiary_accounts" ADD CONSTRAINT "beneficiary_accounts_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE "commission_adjustments" ADD CONSTRAINT "commission_adjustments_entry_id_commission_entries_id_fk" FOREIGN KEY ("entry_id") REFERENCES "public"."commission_entries"("id") ON DELETE restrict ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE "commission_adjustments" ADD CONSTRAINT "commission_adjustments_evidence_id_files_id_fk" FOREIGN KEY ("evidence_id") REFERENCES "public"."files"("id") ON DELETE restrict ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE "commission_adjustments" ADD CONSTRAINT "commission_adjustments_command_id_transaction_commands_id_fk" FOREIGN KEY ("command_id") REFERENCES "public"."transaction_commands"("id") ON DELETE restrict ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE "commission_adjustments" ADD CONSTRAINT "commission_adjustments_approval_id_financial_approval_requests_id_fk" FOREIGN KEY ("approval_id") REFERENCES "public"."financial_approval_requests"("id") ON DELETE restrict ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE "commission_adjustments" ADD CONSTRAINT "commission_adjustments_reversal_of_id_commission_adjustments_id_fk" FOREIGN KEY ("reversal_of_id") REFERENCES "public"."commission_adjustments"("id") ON DELETE restrict ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE "commission_adjustments" ADD CONSTRAINT "commission_adjustments_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE "commission_agreements" ADD CONSTRAINT "commission_agreements_deal_id_deals_id_fk" FOREIGN KEY ("deal_id") REFERENCES "public"."deals"("id") ON DELETE restrict ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE "commission_agreements" ADD CONSTRAINT "commission_agreements_reservation_id_reservations_id_fk" FOREIGN KEY ("reservation_id") REFERENCES "public"."reservations"("id") ON DELETE restrict ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE "commission_agreements" ADD CONSTRAINT "commission_agreements_rule_version_id_commission_rule_versions_id_fk" FOREIGN KEY ("rule_version_id") REFERENCES "public"."commission_rule_versions"("id") ON DELETE restrict ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE "commission_agreements" ADD CONSTRAINT "commission_agreements_evidence_id_files_id_fk" FOREIGN KEY ("evidence_id") REFERENCES "public"."files"("id") ON DELETE restrict ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE "commission_agreements" ADD CONSTRAINT "commission_agreements_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE "commission_entries" ADD CONSTRAINT "commission_entries_milestone_evidence_id_files_id_fk" FOREIGN KEY ("milestone_evidence_id") REFERENCES "public"."files"("id") ON DELETE restrict ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE "commission_entries" ADD CONSTRAINT "commission_entries_origin_command_id_transaction_commands_id_fk" FOREIGN KEY ("origin_command_id") REFERENCES "public"."transaction_commands"("id") ON DELETE restrict ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE "commission_entries" ADD CONSTRAINT "commission_entries_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE "commission_entries" ADD CONSTRAINT "commission_entries_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE "commission_entries" ADD CONSTRAINT "commission_entries_split_fk" FOREIGN KEY ("agreement_id","split_id") REFERENCES "public"."commission_splits"("agreement_id","id") ON DELETE restrict ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE "commission_events" ADD CONSTRAINT "commission_events_entry_id_commission_entries_id_fk" FOREIGN KEY ("entry_id") REFERENCES "public"."commission_entries"("id") ON DELETE restrict ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE "commission_events" ADD CONSTRAINT "commission_events_command_id_transaction_commands_id_fk" FOREIGN KEY ("command_id") REFERENCES "public"."transaction_commands"("id") ON DELETE restrict ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE "commission_events" ADD CONSTRAINT "commission_events_payment_event_id_payment_events_id_fk" FOREIGN KEY ("payment_event_id") REFERENCES "public"."payment_events"("id") ON DELETE restrict ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE "commission_events" ADD CONSTRAINT "commission_events_evidence_id_files_id_fk" FOREIGN KEY ("evidence_id") REFERENCES "public"."files"("id") ON DELETE restrict ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE "commission_events" ADD CONSTRAINT "commission_events_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE "commission_rule_versions" ADD CONSTRAINT "commission_rule_versions_rule_id_commission_rules_id_fk" FOREIGN KEY ("rule_id") REFERENCES "public"."commission_rules"("id") ON DELETE restrict ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE "commission_rule_versions" ADD CONSTRAINT "commission_rule_versions_terms_document_id_files_id_fk" FOREIGN KEY ("terms_document_id") REFERENCES "public"."files"("id") ON DELETE restrict ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE "commission_rule_versions" ADD CONSTRAINT "commission_rule_versions_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE "commission_rule_versions" ADD CONSTRAINT "commission_rule_versions_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE "commission_rules" ADD CONSTRAINT "commission_rules_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE restrict ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE "commission_rules" ADD CONSTRAINT "commission_rules_active_version_id_commission_rule_versions_id_fk" FOREIGN KEY ("active_version_id") REFERENCES "public"."commission_rule_versions"("id") ON DELETE restrict ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE "commission_rules" ADD CONSTRAINT "commission_rules_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE "commission_rules" ADD CONSTRAINT "commission_rules_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE "commission_splits" ADD CONSTRAINT "commission_splits_agreement_id_commission_agreements_id_fk" FOREIGN KEY ("agreement_id") REFERENCES "public"."commission_agreements"("id") ON DELETE restrict ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE "commission_splits" ADD CONSTRAINT "commission_splits_beneficiary_user_id_users_id_fk" FOREIGN KEY ("beneficiary_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE "commission_splits" ADD CONSTRAINT "commission_splits_beneficiary_agency_id_agencies_id_fk" FOREIGN KEY ("beneficiary_agency_id") REFERENCES "public"."agencies"("id") ON DELETE restrict ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE "commission_splits" ADD CONSTRAINT "commission_splits_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE "financial_approval_requests" ADD CONSTRAINT "financial_approval_requests_batch_id_payout_batches_id_fk" FOREIGN KEY ("batch_id") REFERENCES "public"."payout_batches"("id") ON DELETE restrict ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE "financial_approval_requests" ADD CONSTRAINT "financial_approval_requests_entry_id_commission_entries_id_fk" FOREIGN KEY ("entry_id") REFERENCES "public"."commission_entries"("id") ON DELETE restrict ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE "financial_approval_requests" ADD CONSTRAINT "financial_approval_requests_adjustment_reversal_of_id_commission_adjustments_id_fk" FOREIGN KEY ("adjustment_reversal_of_id") REFERENCES "public"."commission_adjustments"("id") ON DELETE restrict ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE "financial_approval_requests" ADD CONSTRAINT "financial_approval_requests_requested_by_users_id_fk" FOREIGN KEY ("requested_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE "financial_approval_requests" ADD CONSTRAINT "financial_approval_requests_decided_by_users_id_fk" FOREIGN KEY ("decided_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE "financial_approval_requests" ADD CONSTRAINT "financial_approval_requests_evidence_id_files_id_fk" FOREIGN KEY ("evidence_id") REFERENCES "public"."files"("id") ON DELETE restrict ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE "financial_approval_requests" ADD CONSTRAINT "financial_approval_requests_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE "legacy_commission_links" ADD CONSTRAINT "legacy_commission_links_legacy_commission_id_commissions_id_fk" FOREIGN KEY ("legacy_commission_id") REFERENCES "public"."commissions"("id") ON DELETE restrict ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE "legacy_commission_links" ADD CONSTRAINT "legacy_commission_links_entry_id_commission_entries_id_fk" FOREIGN KEY ("entry_id") REFERENCES "public"."commission_entries"("id") ON DELETE restrict ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE "legacy_commission_links" ADD CONSTRAINT "legacy_commission_links_evidence_id_files_id_fk" FOREIGN KEY ("evidence_id") REFERENCES "public"."files"("id") ON DELETE restrict ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE "legacy_commission_links" ADD CONSTRAINT "legacy_commission_links_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE "payout_batches" ADD CONSTRAINT "payout_batches_instructed_by_users_id_fk" FOREIGN KEY ("instructed_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE "payout_batches" ADD CONSTRAINT "payout_batches_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE "payout_batches" ADD CONSTRAINT "payout_batches_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE "payout_lines" ADD CONSTRAINT "payout_lines_batch_id_payout_batches_id_fk" FOREIGN KEY ("batch_id") REFERENCES "public"."payout_batches"("id") ON DELETE restrict ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE "payout_lines" ADD CONSTRAINT "payout_lines_entry_id_commission_entries_id_fk" FOREIGN KEY ("entry_id") REFERENCES "public"."commission_entries"("id") ON DELETE restrict ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE "payout_lines" ADD CONSTRAINT "payout_lines_account_id_beneficiary_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."beneficiary_accounts"("id") ON DELETE restrict ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE "payout_lines" ADD CONSTRAINT "payout_lines_reconciliation_evidence_id_files_id_fk" FOREIGN KEY ("reconciliation_evidence_id") REFERENCES "public"."files"("id") ON DELETE restrict ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE "payout_lines" ADD CONSTRAINT "payout_lines_reconciled_by_users_id_fk" FOREIGN KEY ("reconciled_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE "payout_lines" ADD CONSTRAINT "payout_lines_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE "payout_lines" ADD CONSTRAINT "payout_lines_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE restrict;--> statement-breakpoint
CREATE UNIQUE INDEX "beneficiary_accounts_public_id_unq" ON "beneficiary_accounts" USING btree ("public_id");--> statement-breakpoint
CREATE UNIQUE INDEX "beneficiary_accounts_user_version_unq" ON "beneficiary_accounts" USING btree ("beneficiary_user_id","version") WHERE "beneficiary_accounts"."beneficiary_user_id" is not null;--> statement-breakpoint
CREATE UNIQUE INDEX "beneficiary_accounts_agency_version_unq" ON "beneficiary_accounts" USING btree ("beneficiary_agency_id","version") WHERE "beneficiary_accounts"."beneficiary_agency_id" is not null;--> statement-breakpoint
CREATE UNIQUE INDEX "commission_adjustments_public_id_unq" ON "commission_adjustments" USING btree ("public_id");--> statement-breakpoint
CREATE UNIQUE INDEX "commission_adjustments_reversal_unq" ON "commission_adjustments" USING btree ("reversal_of_id") WHERE "commission_adjustments"."reversal_of_id" is not null;--> statement-breakpoint
CREATE UNIQUE INDEX "commission_agreements_public_id_unq" ON "commission_agreements" USING btree ("public_id");--> statement-breakpoint
CREATE UNIQUE INDEX "commission_entries_public_id_unq" ON "commission_entries" USING btree ("public_id");--> statement-breakpoint
CREATE UNIQUE INDEX "commission_events_public_id_unq" ON "commission_events" USING btree ("public_id");--> statement-breakpoint
CREATE UNIQUE INDEX "commission_rule_versions_public_id_unq" ON "commission_rule_versions" USING btree ("public_id");--> statement-breakpoint
CREATE UNIQUE INDEX "commission_rules_public_id_unq" ON "commission_rules" USING btree ("public_id");--> statement-breakpoint
CREATE UNIQUE INDEX "commission_splits_user_unq" ON "commission_splits" USING btree ("agreement_id","beneficiary_user_id") WHERE "commission_splits"."beneficiary_user_id" is not null;--> statement-breakpoint
CREATE UNIQUE INDEX "commission_splits_agency_unq" ON "commission_splits" USING btree ("agreement_id","beneficiary_agency_id") WHERE "commission_splits"."beneficiary_agency_id" is not null;--> statement-breakpoint
CREATE UNIQUE INDEX "financial_approval_requests_public_id_unq" ON "financial_approval_requests" USING btree ("public_id");--> statement-breakpoint
CREATE UNIQUE INDEX "financial_approval_requests_batch_unq" ON "financial_approval_requests" USING btree ("batch_id") WHERE "financial_approval_requests"."status" = 'aprobada';--> statement-breakpoint
CREATE UNIQUE INDEX "legacy_commission_links_entry_unq" ON "legacy_commission_links" USING btree ("entry_id") WHERE "legacy_commission_links"."entry_id" is not null;--> statement-breakpoint
CREATE UNIQUE INDEX "payout_batches_public_id_unq" ON "payout_batches" USING btree ("public_id");--> statement-breakpoint
CREATE UNIQUE INDEX "payout_lines_public_id_unq" ON "payout_lines" USING btree ("public_id");--> statement-breakpoint
CREATE UNIQUE INDEX "payout_lines_active_entry_unq" ON "payout_lines" USING btree ("entry_id") WHERE "payout_lines"."status" <> 'cancelada';
--> statement-breakpoint
-- Expansión sin DOWN destructivo: tras adoptar hechos, corregir hacia delante.
-- Sin activación de API, políticas comerciales, ledger ni ejecución bancaria.
-- Mutex transaccional exclusivo de esta capacidad ANTES de adquirir filas:
-- serializa agregados y versiones bancarias sin bloquear users como mutex.
-- El coste/concurrencia de producción requiere medición antes de activación.
CREATE FUNCTION public.m40_b1e_lock() RETURNS trigger LANGUAGE plpgsql SET search_path=pg_catalog,public AS $$
DECLARE
  target_id integer := 0;
  lock_ns integer := hashtext('deal_commission');
BEGIN
  IF current_setting('transaction_isolation') <> 'read committed' THEN
    RAISE EXCEPTION USING ERRCODE='23514', MESSAGE='M40: escritura requiere READ COMMITTED';
  END IF;

  CASE TG_TABLE_NAME
    WHEN 'commission_agreements' THEN
      target_id := COALESCE(NEW.deal_id, OLD.deal_id);
    WHEN 'commission_splits' THEN
      SELECT deal_id INTO target_id FROM public.commission_agreements WHERE id = COALESCE(NEW.agreement_id, OLD.agreement_id);
    WHEN 'commission_entries' THEN
      SELECT deal_id INTO target_id FROM public.commission_agreements WHERE id = COALESCE(NEW.agreement_id, OLD.agreement_id);
    WHEN 'commission_events' THEN
      SELECT a.deal_id INTO target_id FROM public.commission_entries e JOIN public.commission_agreements a ON a.id = e.agreement_id WHERE e.id = COALESCE(NEW.entry_id, OLD.entry_id);
    WHEN 'commission_adjustments' THEN
      SELECT a.deal_id INTO target_id FROM public.commission_entries e JOIN public.commission_agreements a ON a.id = e.agreement_id WHERE e.id = COALESCE(NEW.entry_id, OLD.entry_id);
    WHEN 'legacy_commission_links' THEN
      SELECT deal_id INTO target_id FROM public.commissions WHERE id = COALESCE(NEW.legacy_commission_id, OLD.legacy_commission_id);
    WHEN 'financial_approval_requests' THEN
      IF COALESCE(NEW.entry_id, OLD.entry_id) IS NOT NULL THEN
        SELECT a.deal_id INTO target_id FROM public.commission_entries e JOIN public.commission_agreements a ON a.id = e.agreement_id WHERE e.id = COALESCE(NEW.entry_id, OLD.entry_id);
      ELSE
        lock_ns := hashtext('payout_batch');
        target_id := COALESCE(NEW.batch_id, OLD.batch_id);
      END IF;
    WHEN 'payout_batches' THEN
      lock_ns := hashtext('payout_batch');
      target_id := COALESCE(NEW.id, OLD.id);
    WHEN 'payout_lines' THEN
      lock_ns := hashtext('payout_batch');
      target_id := COALESCE(NEW.batch_id, OLD.batch_id);
    WHEN 'beneficiary_accounts' THEN
      lock_ns := hashtext('beneficiary_account');
      target_id := COALESCE(NEW.beneficiary_user_id, NEW.beneficiary_agency_id, OLD.beneficiary_user_id, OLD.beneficiary_agency_id);
    WHEN 'commission_rules' THEN
      lock_ns := hashtext('commission_rule');
      target_id := COALESCE(NEW.id, OLD.id, 0);
    WHEN 'commission_rule_versions' THEN
      lock_ns := hashtext('commission_rule');
      target_id := COALESCE(NEW.rule_id, OLD.rule_id, 0);
    ELSE
      target_id := 0;
  END CASE;

  PERFORM pg_advisory_xact_lock(lock_ns, COALESCE(target_id, 0));

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END $$;
--> statement-breakpoint
CREATE FUNCTION public.m40_b1e_batch_hash(batch_value integer) RETURNS text LANGUAGE sql STABLE SET search_path=pg_catalog,public AS $$
  SELECT encode(sha256(convert_to(jsonb_build_object(
    'batch',b.public_id,'currency',b.currency,'execution',b.execution_key,'net',b.total_net_cents,
    'lines',COALESCE((SELECT jsonb_agg(jsonb_build_object('id',l.public_id,'entry',l.entry_id,
      'account',l.account_id,'account_hash',a.document_hash,'account_version',a.version,
      'user',a.beneficiary_user_id,'agency',a.beneficiary_agency_id,
      'gross',l.gross_cents,'withholding',l.withholding_cents,'adjustment',l.adjustment_cents,
      'net',l.net_cents,'execution',l.execution_key) ORDER BY l.id)
      FROM public.payout_lines l JOIN public.beneficiary_accounts a ON a.id=l.account_id
      WHERE l.batch_id=b.id AND l.status<>'cancelada'),'[]'::jsonb))::text,'UTF8')),'hex')
  FROM public.payout_batches b WHERE b.id=batch_value
$$;
--> statement-breakpoint
CREATE FUNCTION public.m40_b1e_adjustment_hash(entry_value integer, amount_value bigint, reason_value text, reversal_value integer, evidence_value integer) RETURNS text LANGUAGE sql STABLE SET search_path=pg_catalog,public AS $$
  SELECT encode(sha256(convert_to(jsonb_build_object('entry',e.public_id,'gross',e.gross_cents,
    'currency',e.currency,'split',e.split_id,'amount',amount_value,'reason',reason_value,
    'reversal',reversal_value,'evidence',evidence_value)::text,'UTF8')),'hex')
  FROM public.commission_entries e WHERE e.id=entry_value
$$;
--> statement-breakpoint
CREATE FUNCTION public.m40_b1e_guard() RETURNS trigger LANGUAGE plpgsql SET search_path=pg_catalog,public AS $$
DECLARE mutable text[]:=ARRAY['updated_at','updated_by','row_version']; parent_state text; approval_row record;
BEGIN
  IF TG_OP IN ('DELETE','TRUNCATE') THEN
    RAISE EXCEPTION USING ERRCODE='23514', MESSAGE='M40: historia financiera no se elimina';
  END IF;
  IF TG_OP='INSERT' THEN
    IF TG_TABLE_NAME='commission_agreements' THEN
      IF NOT EXISTS(SELECT 1 FROM public.commission_rule_versions v JOIN public.commission_rules cr ON cr.id=v.rule_id
        WHERE v.id=NEW.rule_version_id AND cr.active_version_id=v.id AND cr.is_active
        AND v.valid_from<=clock_timestamp() AND (v.valid_until IS NULL OR v.valid_until>clock_timestamp())) THEN
        RAISE EXCEPTION USING ERRCODE='23514', MESSAGE='M40: acuerdo requiere regla activa vigente';
      END IF;
    ELSIF TG_TABLE_NAME='commission_entries' THEN
      IF NEW.status<>'esperada' OR NEW.row_version<>1 THEN
        RAISE EXCEPTION USING ERRCODE='23514', MESSAGE='M40: comisión nace como proyección';
      END IF;
    ELSIF TG_TABLE_NAME='payout_batches' THEN
      IF NEW.status<>'borrador' OR NEW.row_version<>1 THEN
        RAISE EXCEPTION USING ERRCODE='23514', MESSAGE='M40: lote nace en borrador';
      END IF;
    ELSIF TG_TABLE_NAME='financial_approval_requests' THEN
      IF NEW.status<>'pendiente' THEN
        RAISE EXCEPTION USING ERRCODE='23514', MESSAGE='M40: decisión requiere solicitud previa';
      END IF;
      IF NEW.batch_id IS NOT NULL THEN
        IF NOT EXISTS(SELECT 1 FROM public.payout_batches b WHERE b.id=NEW.batch_id
          AND b.row_version=NEW.object_version AND b.status='pendiente_aprobacion' AND b.created_by=NEW.requested_by) THEN
          RAISE EXCEPTION USING ERRCODE='23514', MESSAGE='M40: solicitud requiere versión actual del lote';
        END IF;
      ELSE
        IF NOT EXISTS(SELECT 1 FROM public.commission_entries e WHERE e.id=NEW.entry_id AND e.row_version=NEW.object_version
          AND e.status IN ('devengada','aprobada','exigible','pagada')) THEN
          RAISE EXCEPTION USING ERRCODE='23514', MESSAGE='M40: solicitud requiere versión actual de comisión';
        END IF;
      END IF;
    ELSIF TG_TABLE_NAME='payout_lines' THEN
      SELECT status INTO parent_state FROM public.payout_batches WHERE id=NEW.batch_id;
      IF parent_state IS DISTINCT FROM 'borrador' OR NEW.status<>'activa' THEN
        RAISE EXCEPTION USING ERRCODE='23514', MESSAGE='M40: inclusión solo en borrador';
      END IF;
    ELSIF TG_TABLE_NAME='commission_adjustments' THEN
      IF EXISTS(SELECT 1 FROM public.payout_lines WHERE entry_id=NEW.entry_id AND status<>'cancelada') THEN
        RAISE EXCEPTION USING ERRCODE='23514', MESSAGE='M40: ajuste requiere resolver inclusión previa';
      END IF;
      IF NOT EXISTS(SELECT 1 FROM public.financial_approval_requests fr JOIN public.commission_entries e ON e.id=fr.entry_id
        WHERE fr.id=NEW.approval_id AND fr.entry_id=NEW.entry_id AND fr.status='aprobada'
        AND fr.object_version=e.row_version AND fr.expires_at>clock_timestamp() AND fr.requested_by=NEW.created_by
        AND fr.adjustment_amount_cents=NEW.amount_cents AND fr.adjustment_reason=NEW.reason
        AND fr.adjustment_reversal_of_id IS NOT DISTINCT FROM NEW.reversal_of_id AND fr.evidence_id=NEW.evidence_id) THEN
        RAISE EXCEPTION USING ERRCODE='23514', MESSAGE='M40: compensación requiere propuesta aprobada vigente';
      END IF;
    ELSIF TG_TABLE_NAME='beneficiary_accounts' THEN
      IF NOT EXISTS(SELECT 1 FROM public.files f WHERE f.id=NEW.bank_document_id AND f.visibility='internal' AND f.deleted_at IS NULL) THEN
        RAISE EXCEPTION USING ERRCODE='23514', MESSAGE='M40: cuenta requiere documento interno vigente';
      END IF;
      IF EXISTS(SELECT 1 FROM public.beneficiary_accounts a JOIN public.payout_lines l ON l.account_id=a.id
        JOIN public.payout_batches b ON b.id=l.batch_id WHERE b.status IN ('pendiente_aprobacion','aprobado','instruido','parcialmente_conciliado')
        AND l.status<>'cancelada' AND a.beneficiary_user_id IS NOT DISTINCT FROM NEW.beneficiary_user_id
        AND a.beneficiary_agency_id IS NOT DISTINCT FROM NEW.beneficiary_agency_id) THEN
        RAISE EXCEPTION USING ERRCODE='23514', MESSAGE='M40: cuenta congelada; resolver lote antes de versionar';
      END IF;
      IF NEW.version <> COALESCE((SELECT max(version) FROM public.beneficiary_accounts a
        WHERE a.beneficiary_user_id IS NOT DISTINCT FROM NEW.beneficiary_user_id
        AND a.beneficiary_agency_id IS NOT DISTINCT FROM NEW.beneficiary_agency_id),0)+1 THEN
        RAISE EXCEPTION USING ERRCODE='23514', MESSAGE='M40: secuencia de cuenta inválida';
      END IF;
    END IF;
    RETURN NEW;
  END IF;
  IF TG_TABLE_NAME IN ('commission_rule_versions','commission_agreements','commission_splits',
    'commission_events','commission_adjustments','beneficiary_accounts','legacy_commission_links') THEN
    RAISE EXCEPTION USING ERRCODE='23514', MESSAGE='M40: hecho/version inmutable';
  ELSIF TG_TABLE_NAME='commission_rules' THEN
    mutable:=mutable||ARRAY['name','active_version_id','is_active'];
  ELSIF TG_TABLE_NAME='commission_entries' THEN
    mutable:=array_append(mutable,'status');
    IF NOT ((OLD.status,NEW.status) IN (('esperada','devengada'),('esperada','retirada'),
      ('devengada','aprobada'),('aprobada','exigible'),('exigible','pagada')))
      OR NEW.status='aprobada' AND NEW.updated_by=NEW.created_by THEN
      RAISE EXCEPTION USING ERRCODE='23514', MESSAGE='M40: transición de comisión inválida';
    END IF;
  ELSIF TG_TABLE_NAME='payout_batches' THEN
    mutable:=array_append(mutable,'status');
    IF OLD.status='borrador' THEN mutable:=array_append(mutable,'total_net_cents'); END IF;
    IF NOT (NEW.status=OLD.status AND OLD.status='borrador'
      OR (OLD.status,NEW.status) IN (('borrador','pendiente_aprobacion'),('borrador','cancelado'),
        ('pendiente_aprobacion','aprobado'),('pendiente_aprobacion','cancelado'),('aprobado','instruido'),
        ('aprobado','cancelado'),('instruido','parcialmente_conciliado'),('instruido','conciliado'),
        ('parcialmente_conciliado','conciliado'))) THEN
      RAISE EXCEPTION USING ERRCODE='23514', MESSAGE='M40: transición de lote inválida';
    END IF;
    IF NEW.status='instruido' THEN mutable:=mutable||ARRAY['instructed_at','instructed_by']; END IF;
    IF NEW.status IN ('aprobado','instruido') THEN
      SELECT * INTO approval_row FROM public.financial_approval_requests r WHERE r.batch_id=NEW.id AND r.status='aprobada';
      IF NOT FOUND OR approval_row.expires_at<=clock_timestamp()
        OR approval_row.content_hash IS DISTINCT FROM public.m40_b1e_batch_hash(NEW.id)
        OR NEW.status='instruido' AND NEW.instructed_by IN (NEW.created_by,approval_row.decided_by) THEN
        RAISE EXCEPTION USING ERRCODE='23514', MESSAGE='M40: aprobación vigente/independiente requerida';
      END IF;
    END IF;
  ELSIF TG_TABLE_NAME='payout_lines' THEN
    mutable:=mutable||ARRAY['status','external_reference','reconciliation_evidence_id','reconciled_by','reconciled_at'];
    SELECT status INTO parent_state FROM public.payout_batches WHERE id=NEW.batch_id;
    IF NOT ((OLD.status,NEW.status) IN (('activa','cancelada'),('activa','instruida'),
        ('instruida','desconocida'),('instruida','conciliada'),('desconocida','conciliada')))
      OR NEW.status='cancelada' AND parent_state<>'cancelado'
      OR NEW.status IN ('instruida','desconocida','conciliada') AND parent_state NOT IN ('instruido','parcialmente_conciliado','conciliado')
      OR OLD.external_reference IS NOT NULL AND NEW.external_reference IS DISTINCT FROM OLD.external_reference THEN
      RAISE EXCEPTION USING ERRCODE='23514', MESSAGE='M40: resultado de línea inválido';
    END IF;
  ELSIF TG_TABLE_NAME='financial_approval_requests' THEN
    mutable:=ARRAY['status','decided_by','decided_at','mfa_verified_at'];
    IF OLD.status<>'pendiente' OR NEW.status NOT IN ('aprobada','rechazada')
      OR NEW.expires_at<=clock_timestamp() THEN
      RAISE EXCEPTION USING ERRCODE='23514', MESSAGE='M40: decisión vencida o inmutable';
    END IF;
    IF NEW.entry_id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM public.commission_entries e WHERE e.id=NEW.entry_id AND e.row_version=NEW.object_version) THEN
      RAISE EXCEPTION USING ERRCODE='23514', MESSAGE='M40: propuesta desactualizada';
    END IF;
  END IF;
  IF (to_jsonb(NEW)-mutable) IS DISTINCT FROM (to_jsonb(OLD)-mutable) THEN
    RAISE EXCEPTION USING ERRCODE='23514', MESSAGE='M40: snapshot/identidad inmutable o versión inválida';
  END IF;
  IF TG_TABLE_NAME<>'financial_approval_requests' THEN
    IF NEW.row_version<>OLD.row_version+1 THEN
      RAISE EXCEPTION USING ERRCODE='23514', MESSAGE='M40: versión inválida';
    END IF;
  END IF;
  RETURN NEW;
END $$;
--> statement-breakpoint
CREATE FUNCTION public.m40_b1e_validate() RETURNS trigger LANGUAGE plpgsql SET search_path=pg_catalog,public AS $$
DECLARE agreement_value integer; entry_value integer; batch_value integer; a record; e record; b record; r record;
BEGIN
  IF TG_TABLE_NAME='commission_agreements' THEN agreement_value:=NEW.id;
  ELSIF TG_TABLE_NAME='commission_splits' THEN agreement_value:=NEW.agreement_id;
  ELSIF TG_TABLE_NAME='commission_entries' THEN entry_value:=NEW.id; agreement_value:=NEW.agreement_id;
  ELSIF TG_TABLE_NAME IN ('commission_events','commission_adjustments') THEN entry_value:=NEW.entry_id;
  ELSIF TG_TABLE_NAME='payout_batches' THEN batch_value:=NEW.id;
  ELSIF TG_TABLE_NAME='payout_lines' THEN batch_value:=NEW.batch_id; entry_value:=NEW.entry_id;
  END IF;
  IF TG_TABLE_NAME='commission_rules' THEN
    IF NEW.active_version_id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM public.commission_rule_versions v WHERE v.id=NEW.active_version_id AND v.rule_id=NEW.id) THEN
      RAISE EXCEPTION USING ERRCODE='23514', MESSAGE='M40: versión activa de otra regla';
    END IF;
  END IF;
  IF agreement_value IS NOT NULL THEN
    SELECT * INTO a FROM public.commission_agreements WHERE id=agreement_value;
    IF (SELECT COALESCE(sum(amount_cents),0) FROM public.commission_splits WHERE agreement_id=a.id) <> a.pool_cents
      OR NOT EXISTS(SELECT 1 FROM public.commission_rule_versions v JOIN public.commission_rules cr ON cr.id=v.rule_id
        WHERE v.id=a.rule_version_id AND v.currency=a.currency AND (cr.project_id IS NULL OR EXISTS(
          SELECT 1 FROM public.deal_properties dp WHERE dp.deal_id=a.deal_id AND dp.project_id=cr.project_id)))
      OR a.reservation_id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM public.reservations WHERE id=a.reservation_id AND deal_id=a.deal_id AND currency=a.currency) THEN
      RAISE EXCEPTION USING ERRCODE='23514', MESSAGE='M40: acuerdo/splits no corresponden';
    END IF;
  END IF;
  IF entry_value IS NOT NULL THEN
    SELECT * INTO e FROM public.commission_entries WHERE id=entry_value;
    IF NOT EXISTS(SELECT 1 FROM public.commission_agreements ca WHERE ca.id=e.agreement_id AND ca.currency=e.currency AND ca.base_cents=e.base_cents)
      OR EXISTS(SELECT 1 FROM public.commission_splits s WHERE s.id=e.split_id AND
        (SELECT COALESCE(sum(ce.gross_cents),0) FROM public.commission_entries ce WHERE ce.split_id=s.id AND ce.status<>'retirada')>s.amount_cents)
      OR e.row_version<>1+(SELECT count(*) FROM public.commission_events ce WHERE ce.entry_id=e.id)
      OR (e.row_version=1 AND e.status<>'esperada')
      OR (e.row_version>1 AND NOT EXISTS(SELECT 1 FROM public.commission_events ce WHERE ce.entry_id=e.id AND ce.previous_version=e.row_version-1 AND ce.state=e.status AND ce.created_by=e.updated_by))
      OR EXISTS(SELECT 1 FROM public.commission_events ce WHERE ce.entry_id=e.id AND (
        (ce.previous_version=1 AND ce.previous_state<>'esperada') OR
        (ce.previous_version>1 AND NOT EXISTS(SELECT 1 FROM public.commission_events prev WHERE prev.entry_id=e.id AND prev.previous_version=ce.previous_version-1 AND prev.state=ce.previous_state))
        OR (ce.state='aprobada' AND ce.created_by=e.created_by)))
      OR e.gross_cents::numeric+(SELECT COALESCE(sum(amount_cents),0) FROM public.commission_adjustments WHERE entry_id=e.id)<0 THEN
      RAISE EXCEPTION USING ERRCODE='23514', MESSAGE='M40: comisión/eventos/saldo inválidos';
    END IF;
    IF e.status='pagada' AND NOT EXISTS(SELECT 1 FROM public.payout_lines WHERE entry_id=e.id AND status='conciliada') THEN
      RAISE EXCEPTION USING ERRCODE='23514', MESSAGE='M40: comisión pagada requiere conciliación';
    END IF;
    IF TG_TABLE_NAME='commission_adjustments' THEN
      IF e.status NOT IN ('devengada','aprobada','exigible','pagada')
        OR NOT EXISTS(SELECT 1 FROM public.financial_approval_requests fr WHERE fr.id=NEW.approval_id AND fr.status='aprobada'
          AND fr.entry_id=NEW.entry_id AND fr.requested_by=NEW.created_by
          AND fr.content_hash=public.m40_b1e_adjustment_hash(NEW.entry_id,NEW.amount_cents,NEW.reason,NEW.reversal_of_id,NEW.evidence_id))
        OR NEW.reversal_of_id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM public.commission_adjustments original
          WHERE original.id=NEW.reversal_of_id AND original.entry_id=NEW.entry_id AND original.amount_cents::numeric=-NEW.amount_cents::numeric) THEN
        RAISE EXCEPTION USING ERRCODE='23514', MESSAGE='M40: ajuste aprobado/reverso referenciado requerido';
      END IF;
    END IF;
  END IF;
  IF batch_value IS NOT NULL THEN
    SELECT * INTO b FROM public.payout_batches WHERE id=batch_value;
    IF b.total_net_cents<>(SELECT COALESCE(sum(net_cents),0) FROM public.payout_lines WHERE batch_id=b.id AND (status<>'cancelada' OR b.status='cancelado'))
      OR b.status<>'borrador' AND b.status<>'cancelado' AND NOT EXISTS(SELECT 1 FROM public.payout_lines WHERE batch_id=b.id AND status<>'cancelada')
      OR b.status='cancelado' AND EXISTS(SELECT 1 FROM public.payout_lines WHERE batch_id=b.id AND status<>'cancelada') THEN
      RAISE EXCEPTION USING ERRCODE='23514', MESSAGE='M40: total/inclusiones del lote inválidos';
    END IF;
    IF EXISTS(SELECT 1 FROM public.payout_lines l JOIN public.commission_entries ce ON ce.id=l.entry_id
      JOIN public.commission_splits s ON s.id=ce.split_id JOIN public.beneficiary_accounts ba ON ba.id=l.account_id
      WHERE l.batch_id=b.id AND l.status<>'cancelada' AND
      (ce.status NOT IN ('exigible','pagada') OR ce.currency<>b.currency OR ba.currency<>b.currency
       OR ba.beneficiary_user_id IS DISTINCT FROM s.beneficiary_user_id OR ba.beneficiary_agency_id IS DISTINCT FROM s.beneficiary_agency_id
       OR l.gross_cents<>ce.gross_cents OR l.adjustment_cents<>(SELECT COALESCE(sum(amount_cents),0) FROM public.commission_adjustments WHERE entry_id=ce.id)
       OR l.status='conciliada' AND ce.status<>'pagada'
       OR ce.status='pagada' AND l.status<>'conciliada'
       OR b.status IN ('borrador','pendiente_aprobacion','aprobado') AND l.status<>'activa'
       OR b.status IN ('instruido','parcialmente_conciliado','conciliado') AND l.status='activa'
       OR b.status IN ('pendiente_aprobacion','aprobado','instruido') AND EXISTS(
         SELECT 1 FROM public.beneficiary_accounts later WHERE later.beneficiary_user_id IS NOT DISTINCT FROM ba.beneficiary_user_id
         AND later.beneficiary_agency_id IS NOT DISTINCT FROM ba.beneficiary_agency_id AND later.version>ba.version))) THEN
      RAISE EXCEPTION USING ERRCODE='23514', MESSAGE='M40: línea no elegible/cuenta/importe inválidos';
    END IF;
    IF b.status IN ('aprobado','instruido','parcialmente_conciliado','conciliado') AND NOT EXISTS(
      SELECT 1 FROM public.financial_approval_requests fr WHERE fr.batch_id=b.id AND fr.status='aprobada'
      AND fr.requested_by=b.created_by AND fr.content_hash=public.m40_b1e_batch_hash(b.id)) THEN
      RAISE EXCEPTION USING ERRCODE='23514', MESSAGE='M40: lote sin aprobación del contenido';
    END IF;
    IF b.status='instruido' AND EXISTS(SELECT 1 FROM public.payout_lines WHERE batch_id=b.id AND status='conciliada')
      OR b.status='conciliado' AND EXISTS(SELECT 1 FROM public.payout_lines WHERE batch_id=b.id AND status NOT IN ('conciliada','cancelada'))
      OR b.status='parcialmente_conciliado' AND (NOT EXISTS(SELECT 1 FROM public.payout_lines WHERE batch_id=b.id AND status='conciliada')
        OR NOT EXISTS(SELECT 1 FROM public.payout_lines WHERE batch_id=b.id AND status IN ('instruida','desconocida'))) THEN
      RAISE EXCEPTION USING ERRCODE='23514', MESSAGE='M40: conciliación del lote inconsistente';
    END IF;
  END IF;
  IF TG_TABLE_NAME='financial_approval_requests' THEN
    SELECT * INTO r FROM public.financial_approval_requests WHERE id=NEW.id;
    IF r.batch_id IS NOT NULL THEN
      SELECT * INTO b FROM public.payout_batches WHERE id=r.batch_id;
      IF r.requested_by<>b.created_by OR r.object_version>b.row_version OR r.content_hash IS DISTINCT FROM public.m40_b1e_batch_hash(b.id) THEN
        RAISE EXCEPTION USING ERRCODE='23514', MESSAGE='M40: aprobación no corresponde al lote';
      END IF;
    ELSE
      IF r.content_hash IS DISTINCT FROM public.m40_b1e_adjustment_hash(r.entry_id,r.adjustment_amount_cents,r.adjustment_reason,r.adjustment_reversal_of_id,r.evidence_id) THEN
        RAISE EXCEPTION USING ERRCODE='23514', MESSAGE='M40: aprobación no corresponde al ajuste';
      END IF;
    END IF;
  END IF;
  IF TG_TABLE_NAME='legacy_commission_links' THEN
  IF NEW.entry_id IS NOT NULL AND NOT EXISTS(
    SELECT 1 FROM public.commissions old JOIN public.commission_entries ce ON ce.id=NEW.entry_id
    JOIN public.commission_agreements ca ON ca.id=ce.agreement_id JOIN public.commission_splits s ON s.id=ce.split_id
    WHERE old.id=NEW.legacy_commission_id AND old.deal_id=ca.deal_id AND old.currency=ce.currency
      AND ((NEW.beneficiary_role='broker' AND s.beneficiary_user_id=old.broker_id AND ce.gross_cents=old.broker_amount_cents)
        OR (NEW.beneficiary_role='agency' AND s.beneficiary_agency_id IS NOT NULL AND ce.gross_cents=old.agency_amount_cents))) THEN
    RAISE EXCEPTION USING ERRCODE='23514', MESSAGE='M40: enlace legacy no conserva procedencia';
  END IF;
  END IF;
  RETURN NULL;
END $$;
--> statement-breakpoint
DO $$
DECLARE table_value text; role_value text;
BEGIN
  FOREACH table_value IN ARRAY ARRAY['commission_rules','commission_rule_versions','commission_agreements','commission_splits',
    'commission_entries','commission_events','commission_adjustments','beneficiary_accounts','payout_batches','payout_lines',
    'financial_approval_requests','legacy_commission_links'] LOOP
    EXECUTE format('CREATE TRIGGER m40_b1e_00_lock BEFORE INSERT OR UPDATE OR DELETE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.m40_b1e_lock()',table_value);
    EXECUTE format('CREATE TRIGGER m40_b1e_guard BEFORE INSERT OR UPDATE OR DELETE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.m40_b1e_guard()',table_value);
    EXECUTE format('CREATE TRIGGER m40_b1e_no_truncate BEFORE TRUNCATE ON public.%I FOR EACH STATEMENT EXECUTE FUNCTION public.m40_b1e_guard()',table_value);
    EXECUTE format('CREATE CONSTRAINT TRIGGER m40_b1e_validate AFTER INSERT OR UPDATE ON public.%I DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION public.m40_b1e_validate()',table_value);
    EXECUTE format('REVOKE ALL ON TABLE public.%I FROM PUBLIC',table_value);
    EXECUTE format('REVOKE ALL ON SEQUENCE public.%I FROM PUBLIC',table_value||'_id_seq');
    FOREACH role_value IN ARRAY ARRAY['anon','authenticated'] LOOP
      IF EXISTS(SELECT 1 FROM pg_roles WHERE rolname=role_value) THEN
        EXECUTE format('REVOKE ALL ON TABLE public.%I FROM %I',table_value,role_value);
        EXECUTE format('REVOKE ALL ON SEQUENCE public.%I FROM %I',table_value||'_id_seq',role_value);
      END IF;
    END LOOP;
  END LOOP;
END $$;
--> statement-breakpoint
REVOKE ALL ON FUNCTION public.m40_b1e_lock(),public.m40_b1e_batch_hash(integer),
  public.m40_b1e_adjustment_hash(integer,bigint,text,integer,integer),public.m40_b1e_guard(),public.m40_b1e_validate() FROM PUBLIC;
--> statement-breakpoint
DO $$
DECLARE role_value text;
BEGIN
  FOREACH role_value IN ARRAY ARRAY['anon','authenticated'] LOOP
    IF EXISTS(SELECT 1 FROM pg_roles WHERE rolname=role_value) THEN
      EXECUTE format('REVOKE ALL ON FUNCTION public.m40_b1e_lock(),public.m40_b1e_batch_hash(integer),public.m40_b1e_adjustment_hash(integer,bigint,text,integer,integer),public.m40_b1e_guard(),public.m40_b1e_validate() FROM %I',role_value);
    END IF;
  END LOOP;
END $$;
