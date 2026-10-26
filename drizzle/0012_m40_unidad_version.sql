ALTER TABLE "units" ADD COLUMN IF NOT EXISTS "row_version" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'units_row_version_check'
  ) THEN
    ALTER TABLE "units" ADD CONSTRAINT "units_row_version_check" CHECK ("units"."row_version" > 0);
  END IF;
END $$;