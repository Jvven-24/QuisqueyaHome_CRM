SET LOCAL lock_timeout = '5s';
--> statement-breakpoint
CREATE OR REPLACE FUNCTION normalizar_codigo_unidad(code text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  resultado text;
BEGIN
  IF code IS NULL THEN
    RAISE EXCEPTION 'El código de unidad no puede estar en blanco.';
  END IF;
  resultado := regexp_replace(
    upper(btrim(
      regexp_replace(
        normalize(normalize(code, NFKC), NFD),
        '[\u0300-\u036f]', '', 'g'
      ),
      E' \t\r\n\v\f'
    )),
    '[\s_\-‐‑–—−]+', '-', 'g'
  );
  IF length(resultado) = 0 THEN
    RAISE EXCEPTION 'El código de unidad no puede estar en blanco.';
  END IF;
  RETURN resultado;
END;
$$;
--> statement-breakpoint
ALTER TABLE unit_sales ADD COLUMN project_id integer;
--> statement-breakpoint
ALTER TABLE unit_sales ADD COLUMN unit_code_normalized text;
--> statement-breakpoint
UPDATE unit_sales s
SET project_id = u.project_id,
    unit_code_normalized = normalizar_codigo_unidad(u.code)
FROM units u
WHERE u.id = s.unit_id;
--> statement-breakpoint
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
