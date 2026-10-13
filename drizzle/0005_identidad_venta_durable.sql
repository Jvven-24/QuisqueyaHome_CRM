SET LOCAL lock_timeout = '5s';
--> statement-breakpoint
-- El runner prepara este mapa con normalizarCodigoUnidad (única fuente S-303-N).
-- Migrar con scripts/test-db/identidad-migracion.mjs, no con migrator sin hook.
CREATE TEMP TABLE IF NOT EXISTS qh_sale_identity_backfill (
  unit_id integer PRIMARY KEY, project_id integer NOT NULL, code_normalized text NOT NULL
);
--> statement-breakpoint
ALTER TABLE unit_sales ADD COLUMN project_id integer;
--> statement-breakpoint
ALTER TABLE unit_sales ADD COLUMN unit_code_normalized text;
--> statement-breakpoint
UPDATE unit_sales s SET project_id=m.project_id, unit_code_normalized=m.code_normalized
FROM qh_sale_identity_backfill m WHERE m.unit_id=s.unit_id;
--> statement-breakpoint
-- NOT NULL/UNIQUE abortan sin perder ni conciliar registros si el mapa está incompleto o duplicado.
ALTER TABLE unit_sales ALTER COLUMN project_id SET NOT NULL;
--> statement-breakpoint
ALTER TABLE unit_sales ALTER COLUMN unit_code_normalized SET NOT NULL;
--> statement-breakpoint
ALTER TABLE unit_sales ADD CONSTRAINT unit_sales_project_id_projects_id_fk
FOREIGN KEY (project_id) REFERENCES "public".projects(id) ON DELETE RESTRICT ON UPDATE RESTRICT;
--> statement-breakpoint
ALTER TABLE unit_sales ADD CONSTRAINT unit_sales_code_normalized
CHECK (length(btrim(unit_code_normalized)) > 0 AND unit_code_normalized = upper(btrim(unit_code_normalized)));
--> statement-breakpoint
CREATE UNIQUE INDEX unit_sales_identity_unq ON unit_sales (project_id, unit_code_normalized);
