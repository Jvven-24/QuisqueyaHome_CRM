CREATE TABLE "agencies" (
	"id" serial PRIMARY KEY NOT NULL,
	"public_id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "agencies" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "campaign_spend" (
	"id" serial PRIMARY KEY NOT NULL,
	"public_id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"campaign_id" integer NOT NULL,
	"month" date NOT NULL,
	"amount_cents" bigint NOT NULL,
	"currency" text DEFAULT 'USD' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" integer,
	"updated_by" integer,
	CONSTRAINT "campaign_spend_amount_check" CHECK ("campaign_spend"."amount_cents" >= 0),
	CONSTRAINT "campaign_spend_currency_check" CHECK ("campaign_spend"."currency" = 'USD'),
	CONSTRAINT "campaign_spend_month_check" CHECK (extract(day from "campaign_spend"."month") = 1)
);
--> statement-breakpoint
ALTER TABLE "campaign_spend" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "marketing_campaigns" (
	"id" serial PRIMARY KEY NOT NULL,
	"public_id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"source_id" integer NOT NULL,
	"starts_on" date NOT NULL,
	"ends_on" date NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" integer,
	"updated_by" integer,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "marketing_campaigns_dates_check" CHECK ("marketing_campaigns"."ends_on" >= "marketing_campaigns"."starts_on")
);
--> statement-breakpoint
ALTER TABLE "marketing_campaigns" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "payment_methods" (
	"id" serial PRIMARY KEY NOT NULL,
	"public_id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "payment_methods" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "unit_inventory_states" (
	"id" serial PRIMARY KEY NOT NULL,
	"public_id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"legacy_status" text NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "unit_inventory_states_legacy_check" CHECK ("unit_inventory_states"."legacy_status" in ('available','reserved','sold','unavailable'))
);
--> statement-breakpoint
ALTER TABLE "unit_inventory_states" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "zones" (
	"id" serial PRIMARY KEY NOT NULL,
	"public_id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "zones" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "activities" ADD COLUMN "lead_id" integer;--> statement-breakpoint
ALTER TABLE "broker_profiles" ADD COLUMN "agency_id" integer;--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "zone_interest_id" integer;--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "campaign_id" integer;--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "delivery_horizon_months" integer;--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "payment_method_id" integer;--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "confotur_interest" boolean;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "zone_id" integer;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "confotur_eligible" boolean;--> statement-breakpoint
ALTER TABLE "units" ADD COLUMN "tower" text;--> statement-breakpoint
ALTER TABLE "units" ADD COLUMN "inventory_state_id" integer;--> statement-breakpoint
ALTER TABLE "campaign_spend" ADD CONSTRAINT "campaign_spend_campaign_id_marketing_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."marketing_campaigns"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "campaign_spend" ADD CONSTRAINT "campaign_spend_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_spend" ADD CONSTRAINT "campaign_spend_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "marketing_campaigns" ADD CONSTRAINT "marketing_campaigns_source_id_lead_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."lead_sources"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "marketing_campaigns" ADD CONSTRAINT "marketing_campaigns_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "marketing_campaigns" ADD CONSTRAINT "marketing_campaigns_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "agencies_slug_unq" ON "agencies" USING btree ("slug");--> statement-breakpoint
CREATE UNIQUE INDEX "agencies_public_id_unq" ON "agencies" USING btree ("public_id");--> statement-breakpoint
CREATE UNIQUE INDEX "campaign_spend_campaign_month_unq" ON "campaign_spend" USING btree ("campaign_id","month");--> statement-breakpoint
CREATE UNIQUE INDEX "campaign_spend_public_id_unq" ON "campaign_spend" USING btree ("public_id");--> statement-breakpoint
CREATE UNIQUE INDEX "marketing_campaigns_slug_unq" ON "marketing_campaigns" USING btree ("slug");--> statement-breakpoint
CREATE UNIQUE INDEX "marketing_campaigns_public_id_unq" ON "marketing_campaigns" USING btree ("public_id");--> statement-breakpoint
CREATE UNIQUE INDEX "payment_methods_slug_unq" ON "payment_methods" USING btree ("slug");--> statement-breakpoint
CREATE UNIQUE INDEX "payment_methods_public_id_unq" ON "payment_methods" USING btree ("public_id");--> statement-breakpoint
CREATE UNIQUE INDEX "unit_inventory_states_slug_unq" ON "unit_inventory_states" USING btree ("slug");--> statement-breakpoint
CREATE UNIQUE INDEX "unit_inventory_states_public_id_unq" ON "unit_inventory_states" USING btree ("public_id");--> statement-breakpoint
CREATE UNIQUE INDEX "zones_slug_unq" ON "zones" USING btree ("slug");--> statement-breakpoint
CREATE UNIQUE INDEX "zones_public_id_unq" ON "zones" USING btree ("public_id");--> statement-breakpoint
ALTER TABLE "activities" ADD CONSTRAINT "activities_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "broker_profiles" ADD CONSTRAINT "broker_profiles_agency_id_agencies_id_fk" FOREIGN KEY ("agency_id") REFERENCES "public"."agencies"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_zone_interest_id_zones_id_fk" FOREIGN KEY ("zone_interest_id") REFERENCES "public"."zones"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_campaign_id_marketing_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."marketing_campaigns"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_payment_method_id_payment_methods_id_fk" FOREIGN KEY ("payment_method_id") REFERENCES "public"."payment_methods"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_zone_id_zones_id_fk" FOREIGN KEY ("zone_id") REFERENCES "public"."zones"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "units" ADD CONSTRAINT "units_inventory_state_id_unit_inventory_states_id_fk" FOREIGN KEY ("inventory_state_id") REFERENCES "public"."unit_inventory_states"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_horizon_check" CHECK ("leads"."delivery_horizon_months" >= 0);--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_budget_min_check" CHECK ("leads"."budget_min_cents" >= 0);--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_budget_max_check" CHECK ("leads"."budget_max_cents" >= 0);--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_budget_order_check" CHECK ("leads"."budget_min_cents" <= "leads"."budget_max_cents");