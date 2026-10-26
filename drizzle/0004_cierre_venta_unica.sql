SET LOCAL lock_timeout = '5s';
--> statement-breakpoint
-- S-303-H: conservar legado sin unidad; nunca inventar relaciones ni actores.
DO $$ DECLARE historicas_sin_unidad bigint; BEGIN
  SELECT count(*) INTO historicas_sin_unidad
  FROM deals d JOIN pipeline_stages s ON s.id=d.stage_id
  WHERE s.kind='won' AND d.operation_type='sale'
    AND NOT EXISTS (SELECT 1 FROM deal_properties p
      WHERE p.deal_id=d.id AND p.is_primary AND p.unit_id IS NOT NULL);
  RAISE NOTICE 'S-303-H: % ventas historicas sin unidad; conservadas sin fila en unit_sales', historicas_sin_unidad;
END $$;
--> statement-breakpoint
CREATE TABLE "unit_sales" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"unit_id" integer NOT NULL,
	"deal_id" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" integer NOT NULL
);
--> statement-breakpoint
ALTER TABLE "unit_sales" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "deal_properties" DROP CONSTRAINT "deal_properties_deal_id_deals_id_fk";
--> statement-breakpoint
DROP INDEX "deal_properties_deal_unit_unq";--> statement-breakpoint
DROP INDEX "deal_properties_deal_project_unq";--> statement-breakpoint
ALTER TABLE "deal_properties" ADD COLUMN "deleted_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "deal_properties" ADD COLUMN "deleted_by" integer;--> statement-breakpoint
ALTER TABLE "deal_properties" ADD COLUMN "deletion_reason" text;--> statement-breakpoint
ALTER TABLE "unit_sales" ADD CONSTRAINT "unit_sales_unit_id_units_id_fk" FOREIGN KEY ("unit_id") REFERENCES "public"."units"("id") ON DELETE restrict ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE "unit_sales" ADD CONSTRAINT "unit_sales_deal_id_deals_id_fk" FOREIGN KEY ("deal_id") REFERENCES "public"."deals"("id") ON DELETE restrict ON UPDATE restrict;--> statement-breakpoint
ALTER TABLE "unit_sales" ADD CONSTRAINT "unit_sales_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE restrict;--> statement-breakpoint
CREATE UNIQUE INDEX "unit_sales_unit_unq" ON "unit_sales" USING btree ("unit_id");--> statement-breakpoint
CREATE UNIQUE INDEX "unit_sales_deal_unq" ON "unit_sales" USING btree ("deal_id");--> statement-breakpoint
INSERT INTO unit_sales (unit_id,deal_id,created_at,created_by)
SELECT p.unit_id,d.id,coalesce(d.closed_at,d.stage_changed_at,d.created_at),coalesce(d.created_by,d.updated_by,d.broker_id)
FROM deals d JOIN pipeline_stages s ON s.id=d.stage_id JOIN deal_properties p ON p.deal_id=d.id AND p.is_primary
WHERE s.kind='won' AND d.operation_type='sale' AND p.unit_id IS NOT NULL;
--> statement-breakpoint
ALTER TABLE "deal_properties" ADD CONSTRAINT "deal_properties_deleted_by_users_id_fk" FOREIGN KEY ("deleted_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deal_properties" ADD CONSTRAINT "deal_properties_deal_id_deals_id_fk" FOREIGN KEY ("deal_id") REFERENCES "public"."deals"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "deal_properties_primary_live_unq" ON "deal_properties" USING btree ("deal_id") WHERE "deal_properties"."is_primary" and "deal_properties"."deleted_at" is null;--> statement-breakpoint
CREATE UNIQUE INDEX "deal_properties_deal_unit_unq" ON "deal_properties" USING btree ("deal_id","unit_id") WHERE "deal_properties"."deleted_at" is null;--> statement-breakpoint
CREATE UNIQUE INDEX "deal_properties_deal_project_unq" ON "deal_properties" USING btree ("deal_id","project_id") WHERE "deal_properties"."unit_id" is null and "deal_properties"."deleted_at" is null;--> statement-breakpoint
ALTER TABLE "deal_properties" ADD CONSTRAINT "deal_properties_deletion_reason" CHECK ("deal_properties"."deleted_at" is null or ("deal_properties"."deleted_by" is not null and "deal_properties"."deletion_reason" is not null and length(btrim("deal_properties"."deletion_reason")) > 0));--> statement-breakpoint
ALTER TABLE "deals" ADD CONSTRAINT "deals_amount_nonnegative" CHECK ("deals"."amount_cents" >= 0);--> statement-breakpoint
ALTER TABLE "deals" ADD CONSTRAINT "deals_probability_range" CHECK ("deals"."probability" between 0 and 100);--> statement-breakpoint
ALTER TABLE "deals" ADD CONSTRAINT "deals_loss_comment_required" CHECK ("deals"."loss_reason_id" is null or length(btrim("deals"."loss_comment")) > 0 and "deals"."loss_comment" is not null) NOT VALID;
