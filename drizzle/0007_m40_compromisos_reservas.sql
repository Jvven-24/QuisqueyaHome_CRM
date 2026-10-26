-- Generada con drizzle-kit; controles diferidos y privilegios añadidos en SQL.
-- Academy existe en 0006, que no tiene snapshot: se omiten sus 17 sentencias duplicadas.
-- Expansión sin backfill/activación. Tras hechos financieros: corrección hacia delante; no DROP.
SET LOCAL lock_timeout = '5s';
--> statement-breakpoint
ALTER TABLE "unit_sales" ADD CONSTRAINT "unit_sales_commitment_owner_unq" UNIQUE("id","unit_id","project_id","unit_code_normalized");
--> statement-breakpoint
CREATE TABLE "hold_units" (
	"id" serial PRIMARY KEY NOT NULL,
	"hold_id" integer NOT NULL,
	"unit_id" integer NOT NULL,
	"project_id" integer NOT NULL,
	"unit_code_normalized" text NOT NULL,
	"price_version" integer NOT NULL,
	"price_cents" bigint NOT NULL,
	"currency" text NOT NULL,
	"component_role" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" integer NOT NULL,
	CONSTRAINT "hold_units_hold_unit_unq" UNIQUE("hold_id","unit_id"),
	CONSTRAINT "hold_units_commitment_owner_unq" UNIQUE("hold_id","unit_id","project_id","unit_code_normalized"),
	CONSTRAINT "hold_units_values_check" CHECK ("hold_units"."price_version" > 0 and "hold_units"."price_cents" >= 0 and "hold_units"."currency" in ('USD','DOP') and length(btrim("hold_units"."component_role")) > 0 and length("hold_units"."unit_code_normalized") > 0 and "hold_units"."unit_code_normalized" = normalizar_codigo_unidad("hold_units"."unit_code_normalized"))
);
--> statement-breakpoint
ALTER TABLE "hold_units" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE TABLE "holds" (
	"id" serial PRIMARY KEY NOT NULL,
	"public_id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"deal_id" integer NOT NULL,
	"holder_id" integer NOT NULL,
	"status" text DEFAULT 'activo' NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"policy_version" integer NOT NULL,
	"extension_count" integer DEFAULT 0 NOT NULL,
	"reason" text NOT NULL,
	"resolved_at" timestamp with time zone,
	"created_by" integer NOT NULL,
	"updated_by" integer NOT NULL,
	"row_version" integer DEFAULT 1 NOT NULL,
	"correlation_id" uuid NOT NULL,
	"source" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "holds_id_deal_unq" UNIQUE("id","deal_id"),
	CONSTRAINT "holds_state_check" CHECK ("holds"."status" in ('activo','convertido','cancelado','expirado') and (("holds"."status" = 'activo' and "holds"."resolved_at" is null) or ("holds"."status" <> 'activo' and "holds"."resolved_at" is not null and "holds"."resolved_at" >= "holds"."created_at"))),
	CONSTRAINT "holds_values_check" CHECK ("holds"."expires_at" > "holds"."created_at" and "holds"."policy_version" > 0 and "holds"."extension_count" >= 0 and "holds"."row_version" > 0 and length(btrim("holds"."reason")) > 0 and length(btrim("holds"."source")) > 0)
);
--> statement-breakpoint
ALTER TABLE "holds" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE TABLE "inventory_commitments" (
	"id" serial PRIMARY KEY NOT NULL,
	"public_id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"unit_id" integer NOT NULL,
	"project_id" integer NOT NULL,
	"unit_code_normalized" text NOT NULL,
	"kind" text NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"hold_id" integer,
	"reservation_unit_id" integer,
	"unit_sale_id" uuid,
	"expires_at" timestamp with time zone,
	"resolved_at" timestamp with time zone,
	"resolution_reason" text,
	"created_by" integer NOT NULL,
	"updated_by" integer NOT NULL,
	"row_version" integer DEFAULT 1 NOT NULL,
	"correlation_id" uuid NOT NULL,
	"source" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "inventory_commitments_owner_check" CHECK (("inventory_commitments"."kind" = 'hold' and "inventory_commitments"."hold_id" is not null and "inventory_commitments"."reservation_unit_id" is null and "inventory_commitments"."unit_sale_id" is null and "inventory_commitments"."expires_at" is not null) or ("inventory_commitments"."kind" = 'reservation' and "inventory_commitments"."hold_id" is null and "inventory_commitments"."reservation_unit_id" is not null and "inventory_commitments"."unit_sale_id" is null) or ("inventory_commitments"."kind" = 'sale' and "inventory_commitments"."hold_id" is null and "inventory_commitments"."reservation_unit_id" is null and "inventory_commitments"."unit_sale_id" is not null and "inventory_commitments"."expires_at" is null)),
	CONSTRAINT "inventory_commitments_state_check" CHECK (("inventory_commitments"."status" = 'active' and "inventory_commitments"."resolved_at" is null and "inventory_commitments"."resolution_reason" is null) or ("inventory_commitments"."status" = 'resolved' and "inventory_commitments"."resolved_at" is not null and "inventory_commitments"."resolved_at" >= "inventory_commitments"."created_at" and "inventory_commitments"."resolution_reason" is not null and length(btrim("inventory_commitments"."resolution_reason")) > 0)),
	CONSTRAINT "inventory_commitments_values_check" CHECK ("inventory_commitments"."row_version" > 0 and length(btrim("inventory_commitments"."source")) > 0 and length("inventory_commitments"."unit_code_normalized") > 0 and "inventory_commitments"."unit_code_normalized" = normalizar_codigo_unidad("inventory_commitments"."unit_code_normalized") and ("inventory_commitments"."expires_at" is null or "inventory_commitments"."expires_at" > "inventory_commitments"."created_at"))
);
--> statement-breakpoint
ALTER TABLE "inventory_commitments" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE TABLE "reservation_parties" (
	"id" serial PRIMARY KEY NOT NULL,
	"reservation_id" integer NOT NULL,
	"contact_id" integer NOT NULL,
	"role" text NOT NULL,
	"representation_evidence_id" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" integer NOT NULL,
	CONSTRAINT "reservation_parties_role_check" CHECK ("reservation_parties"."role" in ('titular','representante') and ("reservation_parties"."role" <> 'representante' or "reservation_parties"."representation_evidence_id" is not null))
);
--> statement-breakpoint
ALTER TABLE "reservation_parties" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE TABLE "reservation_units" (
	"id" serial PRIMARY KEY NOT NULL,
	"reservation_id" integer NOT NULL,
	"unit_id" integer NOT NULL,
	"project_id" integer NOT NULL,
	"unit_code_normalized" text NOT NULL,
	"price_cents" bigint NOT NULL,
	"currency" text NOT NULL,
	"component_role" text NOT NULL,
	"released_at" timestamp with time zone,
	"release_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" integer NOT NULL,
	CONSTRAINT "reservation_units_reservation_unit_unq" UNIQUE("reservation_id","unit_id"),
	CONSTRAINT "reservation_units_commitment_owner_unq" UNIQUE("id","unit_id","project_id","unit_code_normalized"),
	CONSTRAINT "reservation_units_values_check" CHECK ("reservation_units"."price_cents" >= 0 and "reservation_units"."currency" in ('USD','DOP') and length(btrim("reservation_units"."component_role")) > 0 and length("reservation_units"."unit_code_normalized") > 0 and "reservation_units"."unit_code_normalized" = normalizar_codigo_unidad("reservation_units"."unit_code_normalized")),
	CONSTRAINT "reservation_units_release_check" CHECK (("reservation_units"."released_at" is null and "reservation_units"."release_reason" is null) or ("reservation_units"."released_at" is not null and "reservation_units"."released_at" >= "reservation_units"."created_at" and "reservation_units"."release_reason" is not null and length(btrim("reservation_units"."release_reason")) > 0))
);
--> statement-breakpoint
ALTER TABLE "reservation_units" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE TABLE "reservations" (
	"id" serial PRIMARY KEY NOT NULL,
	"public_id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"deal_id" integer NOT NULL,
	"hold_id" integer,
	"status" text DEFAULT 'borrador' NOT NULL,
	"currency" text NOT NULL,
	"total_cents" bigint NOT NULL,
	"adjustment_cents" bigint DEFAULT 0 NOT NULL,
	"deposit_required_cents" bigint NOT NULL,
	"conditions_version" integer NOT NULL,
	"conditions_document_id" integer NOT NULL,
	"conditions_hash" text NOT NULL,
	"confirmation_evidence_id" integer,
	"confirmed_by" integer,
	"confirmed_at" timestamp with time zone,
	"expires_at" timestamp with time zone,
	"reason" text NOT NULL,
	"created_by" integer NOT NULL,
	"updated_by" integer NOT NULL,
	"row_version" integer DEFAULT 1 NOT NULL,
	"correlation_id" uuid NOT NULL,
	"source" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "reservations_id_currency_unq" UNIQUE("id","currency"),
	CONSTRAINT "reservations_values_check" CHECK ("reservations"."currency" in ('USD','DOP') and "reservations"."total_cents" >= 0 and "reservations"."deposit_required_cents" >= 0 and "reservations"."deposit_required_cents" <= "reservations"."total_cents" and "reservations"."conditions_version" > 0 and "reservations"."row_version" > 0 and "reservations"."conditions_hash" ~ '^[0-9a-f]{64}$' and length(btrim("reservations"."reason")) > 0 and length(btrim("reservations"."source")) > 0 and ("reservations"."expires_at" is null or "reservations"."expires_at" > "reservations"."created_at")),
	CONSTRAINT "reservations_state_check" CHECK ("reservations"."status" in ('borrador','pendiente_pago','en_verificacion','confirmada','expirada','cancelacion_solicitada','cancelada')),
	CONSTRAINT "reservations_confirmation_check" CHECK ((("reservations"."confirmed_at" is null and "reservations"."confirmed_by" is null and "reservations"."confirmation_evidence_id" is null) or ("reservations"."confirmed_at" is not null and "reservations"."confirmed_by" is not null and "reservations"."confirmation_evidence_id" is not null and "reservations"."confirmed_at" >= "reservations"."created_at")) and ("reservations"."status" not in ('confirmada','cancelacion_solicitada','cancelada') or "reservations"."confirmed_at" is not null))
);
--> statement-breakpoint
ALTER TABLE "reservations" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE TABLE "transaction_commands" (
	"id" serial PRIMARY KEY NOT NULL,
	"public_id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"actor_id" integer NOT NULL,
	"operation" text NOT NULL,
	"idempotency_key" uuid NOT NULL,
	"request_hash" text NOT NULL,
	"status" text DEFAULT 'processing' NOT NULL,
	"http_status" integer,
	"result_public_id" uuid,
	"result_code" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone,
	"retain_until" timestamp with time zone,
	CONSTRAINT "transaction_commands_request_check" CHECK (length(btrim("transaction_commands"."operation")) > 0 and "transaction_commands"."request_hash" ~ '^[0-9a-f]{64}$'),
	CONSTRAINT "transaction_commands_result_check" CHECK (("transaction_commands"."status" = 'processing' and "transaction_commands"."completed_at" is null and "transaction_commands"."http_status" is null and "transaction_commands"."retain_until" is null and "transaction_commands"."result_public_id" is null and "transaction_commands"."result_code" is null) or ("transaction_commands"."status" = 'completed' and "transaction_commands"."completed_at" is not null and "transaction_commands"."completed_at" >= "transaction_commands"."created_at" and "transaction_commands"."http_status" between 100 and 599 and "transaction_commands"."http_status" is not null and "transaction_commands"."retain_until" is not null and "transaction_commands"."retain_until" >= "transaction_commands"."completed_at" + interval '5 years' and length(btrim("transaction_commands"."result_code")) > 0 and "transaction_commands"."result_code" is not null))
);
--> statement-breakpoint
ALTER TABLE "transaction_commands" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "commissions" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "hold_units" ADD CONSTRAINT "hold_units_hold_id_holds_id_fk" FOREIGN KEY ("hold_id") REFERENCES "public"."holds"("id") ON DELETE restrict ON UPDATE restrict;
--> statement-breakpoint
ALTER TABLE "hold_units" ADD CONSTRAINT "hold_units_unit_id_units_id_fk" FOREIGN KEY ("unit_id") REFERENCES "public"."units"("id") ON DELETE restrict ON UPDATE restrict;
--> statement-breakpoint
ALTER TABLE "hold_units" ADD CONSTRAINT "hold_units_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE restrict ON UPDATE restrict;
--> statement-breakpoint
ALTER TABLE "hold_units" ADD CONSTRAINT "hold_units_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE restrict;
--> statement-breakpoint
ALTER TABLE "holds" ADD CONSTRAINT "holds_deal_id_deals_id_fk" FOREIGN KEY ("deal_id") REFERENCES "public"."deals"("id") ON DELETE restrict ON UPDATE restrict;
--> statement-breakpoint
ALTER TABLE "holds" ADD CONSTRAINT "holds_holder_id_users_id_fk" FOREIGN KEY ("holder_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE restrict;
--> statement-breakpoint
ALTER TABLE "holds" ADD CONSTRAINT "holds_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE restrict;
--> statement-breakpoint
ALTER TABLE "holds" ADD CONSTRAINT "holds_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE restrict;
--> statement-breakpoint
ALTER TABLE "inventory_commitments" ADD CONSTRAINT "inventory_commitments_unit_id_units_id_fk" FOREIGN KEY ("unit_id") REFERENCES "public"."units"("id") ON DELETE restrict ON UPDATE restrict;
--> statement-breakpoint
ALTER TABLE "inventory_commitments" ADD CONSTRAINT "inventory_commitments_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE restrict ON UPDATE restrict;
--> statement-breakpoint
ALTER TABLE "inventory_commitments" ADD CONSTRAINT "inventory_commitments_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE restrict;
--> statement-breakpoint
ALTER TABLE "inventory_commitments" ADD CONSTRAINT "inventory_commitments_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE restrict;
--> statement-breakpoint
ALTER TABLE "inventory_commitments" ADD CONSTRAINT "inventory_commitments_hold_owner_fk" FOREIGN KEY ("hold_id","unit_id","project_id","unit_code_normalized") REFERENCES "public"."hold_units"("hold_id","unit_id","project_id","unit_code_normalized") ON DELETE restrict ON UPDATE restrict;
--> statement-breakpoint
ALTER TABLE "inventory_commitments" ADD CONSTRAINT "inventory_commitments_reservation_owner_fk" FOREIGN KEY ("reservation_unit_id","unit_id","project_id","unit_code_normalized") REFERENCES "public"."reservation_units"("id","unit_id","project_id","unit_code_normalized") ON DELETE restrict ON UPDATE restrict;
--> statement-breakpoint
ALTER TABLE "inventory_commitments" ADD CONSTRAINT "inventory_commitments_sale_owner_fk" FOREIGN KEY ("unit_sale_id","unit_id","project_id","unit_code_normalized") REFERENCES "public"."unit_sales"("id","unit_id","project_id","unit_code_normalized") ON DELETE restrict ON UPDATE restrict;
--> statement-breakpoint
ALTER TABLE "reservation_parties" ADD CONSTRAINT "reservation_parties_reservation_id_reservations_id_fk" FOREIGN KEY ("reservation_id") REFERENCES "public"."reservations"("id") ON DELETE restrict ON UPDATE restrict;
--> statement-breakpoint
ALTER TABLE "reservation_parties" ADD CONSTRAINT "reservation_parties_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE restrict ON UPDATE restrict;
--> statement-breakpoint
ALTER TABLE "reservation_parties" ADD CONSTRAINT "reservation_parties_representation_evidence_id_files_id_fk" FOREIGN KEY ("representation_evidence_id") REFERENCES "public"."files"("id") ON DELETE restrict ON UPDATE restrict;
--> statement-breakpoint
ALTER TABLE "reservation_parties" ADD CONSTRAINT "reservation_parties_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE restrict;
--> statement-breakpoint
ALTER TABLE "reservation_units" ADD CONSTRAINT "reservation_units_unit_id_units_id_fk" FOREIGN KEY ("unit_id") REFERENCES "public"."units"("id") ON DELETE restrict ON UPDATE restrict;
--> statement-breakpoint
ALTER TABLE "reservation_units" ADD CONSTRAINT "reservation_units_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE restrict ON UPDATE restrict;
--> statement-breakpoint
ALTER TABLE "reservation_units" ADD CONSTRAINT "reservation_units_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE restrict;
--> statement-breakpoint
ALTER TABLE "reservation_units" ADD CONSTRAINT "reservation_units_reservation_currency_fk" FOREIGN KEY ("reservation_id","currency") REFERENCES "public"."reservations"("id","currency") ON DELETE restrict ON UPDATE restrict;
--> statement-breakpoint
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_deal_id_deals_id_fk" FOREIGN KEY ("deal_id") REFERENCES "public"."deals"("id") ON DELETE restrict ON UPDATE restrict;
--> statement-breakpoint
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_conditions_document_id_files_id_fk" FOREIGN KEY ("conditions_document_id") REFERENCES "public"."files"("id") ON DELETE restrict ON UPDATE restrict;
--> statement-breakpoint
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_confirmation_evidence_id_files_id_fk" FOREIGN KEY ("confirmation_evidence_id") REFERENCES "public"."files"("id") ON DELETE restrict ON UPDATE restrict;
--> statement-breakpoint
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_confirmed_by_users_id_fk" FOREIGN KEY ("confirmed_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE restrict;
--> statement-breakpoint
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE restrict;
--> statement-breakpoint
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE restrict;
--> statement-breakpoint
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_hold_deal_fk" FOREIGN KEY ("hold_id","deal_id") REFERENCES "public"."holds"("id","deal_id") ON DELETE restrict ON UPDATE restrict;
--> statement-breakpoint
ALTER TABLE "transaction_commands" ADD CONSTRAINT "transaction_commands_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE restrict;
--> statement-breakpoint
CREATE UNIQUE INDEX "holds_public_id_unq" ON "holds" USING btree ("public_id");
--> statement-breakpoint
CREATE INDEX "holds_holder_status_expiry_idx" ON "holds" USING btree ("holder_id","status","expires_at");
--> statement-breakpoint
CREATE INDEX "holds_deal_idx" ON "holds" USING btree ("deal_id");
--> statement-breakpoint
CREATE UNIQUE INDEX "inventory_commitments_public_id_unq" ON "inventory_commitments" USING btree ("public_id");
--> statement-breakpoint
CREATE UNIQUE INDEX "inventory_commitments_active_unit_unq" ON "inventory_commitments" USING btree ("unit_id") WHERE "inventory_commitments"."status" = 'active';
--> statement-breakpoint
CREATE UNIQUE INDEX "inventory_commitments_active_identity_unq" ON "inventory_commitments" USING btree ("project_id","unit_code_normalized") WHERE "inventory_commitments"."status" = 'active';
--> statement-breakpoint
CREATE UNIQUE INDEX "reservation_parties_contact_role_unq" ON "reservation_parties" USING btree ("reservation_id","contact_id","role");
--> statement-breakpoint
CREATE UNIQUE INDEX "reservations_public_id_unq" ON "reservations" USING btree ("public_id");
--> statement-breakpoint
CREATE UNIQUE INDEX "reservations_hold_unq" ON "reservations" USING btree ("hold_id") WHERE "reservations"."hold_id" is not null;
--> statement-breakpoint
CREATE INDEX "reservations_deal_idx" ON "reservations" USING btree ("deal_id");
--> statement-breakpoint
CREATE UNIQUE INDEX "transaction_commands_public_id_unq" ON "transaction_commands" USING btree ("public_id");
--> statement-breakpoint
CREATE UNIQUE INDEX "transaction_commands_key_unq" ON "transaction_commands" USING btree ("actor_id","operation","idempotency_key");
--> statement-breakpoint
CREATE INDEX "transaction_commands_retention_idx" ON "transaction_commands" USING btree ("actor_id","operation","idempotency_key","created_at");
--> statement-breakpoint
-- Integridad entre filas: bloquear al padre ANTES de escribir hijos evita write skew.
CREATE FUNCTION m40_lock_parent() RETURNS trigger LANGUAGE plpgsql SET search_path = pg_catalog, public AS $$
DECLARE parent_id integer;
BEGIN
  IF TG_OP = 'UPDATE' AND
    (to_jsonb(NEW)->>'hold_id', to_jsonb(NEW)->>'reservation_id') IS DISTINCT FROM
    (to_jsonb(OLD)->>'hold_id', to_jsonb(OLD)->>'reservation_id') THEN
    RAISE EXCEPTION USING ERRCODE = '23514', MESSAGE = 'M40: no se permite reasignar un componente histórico';
  END IF;
  IF TG_TABLE_NAME = 'hold_units' THEN
    parent_id := NEW.hold_id;
    PERFORM id FROM public.holds WHERE id = parent_id FOR UPDATE;
  ELSE
    parent_id := NEW.reservation_id;
    PERFORM id FROM public.reservations WHERE id = parent_id FOR UPDATE;
  END IF;
  RETURN NEW;
END $$;
--> statement-breakpoint
CREATE TRIGGER m40_hold_units_parent BEFORE INSERT OR UPDATE ON hold_units FOR EACH ROW EXECUTE FUNCTION m40_lock_parent();
--> statement-breakpoint
CREATE TRIGGER m40_reservation_units_parent BEFORE INSERT OR UPDATE ON reservation_units FOR EACH ROW EXECUTE FUNCTION m40_lock_parent();
--> statement-breakpoint
CREATE TRIGGER m40_reservation_parties_parent BEFORE INSERT OR UPDATE ON reservation_parties FOR EACH ROW EXECUTE FUNCTION m40_lock_parent();
--> statement-breakpoint
CREATE FUNCTION m40_check_hold(owner_id integer) RETURNS void LANGUAGE plpgsql SET search_path = pg_catalog, public AS $$
DECLARE h public.holds%ROWTYPE;
BEGIN
  SELECT * INTO h FROM public.holds WHERE id = owner_id;
  IF NOT FOUND THEN RETURN; END IF;
  IF h.status = 'activo' THEN
    IF NOT EXISTS (SELECT 1 FROM public.hold_units WHERE hold_id = h.id) OR EXISTS (
      SELECT 1 FROM public.hold_units hu WHERE hu.hold_id = h.id AND NOT EXISTS (
        SELECT 1 FROM public.inventory_commitments c WHERE c.hold_id = h.id AND c.unit_id = hu.unit_id
          AND c.status = 'active' AND c.expires_at = h.expires_at)) THEN
      RAISE EXCEPTION USING ERRCODE = '23514', MESSAGE = 'M40: paquete de hold incompleto';
    END IF;
  ELSIF EXISTS (SELECT 1 FROM public.inventory_commitments WHERE hold_id = h.id AND status = 'active') THEN
    RAISE EXCEPTION USING ERRCODE = '23514', MESSAGE = 'M40: hold resuelto conserva compromiso activo';
  END IF;
  IF h.status = 'convertido' AND (NOT EXISTS (SELECT 1 FROM public.reservations WHERE hold_id = h.id) OR EXISTS (
    SELECT 1 FROM public.hold_units hu WHERE hu.hold_id = h.id AND NOT EXISTS (
      SELECT 1 FROM public.reservation_units ru JOIN public.reservations r ON r.id = ru.reservation_id
      WHERE r.hold_id = h.id AND ru.unit_id = hu.unit_id))) THEN
    RAISE EXCEPTION USING ERRCODE = '23514', MESSAGE = 'M40: transferencia de hold incompleta';
  END IF;
END $$;
--> statement-breakpoint
CREATE FUNCTION m40_check_reservation(owner_id integer) RETURNS void LANGUAGE plpgsql SET search_path = pg_catalog, public AS $$
DECLARE r public.reservations%ROWTYPE; components numeric;
BEGIN
  SELECT * INTO r FROM public.reservations WHERE id = owner_id;
  IF NOT FOUND THEN RETURN; END IF;
  IF r.hold_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.holds WHERE id = r.hold_id AND status = 'convertido') THEN
    RAISE EXCEPTION USING ERRCODE = '23514', MESSAGE = 'M40: reserva de hold sin conversión atómica';
  END IF;
  IF r.status IN ('pendiente_pago','en_verificacion','confirmada','cancelacion_solicitada') THEN
    SELECT sum(price_cents::numeric) INTO components FROM public.reservation_units WHERE reservation_id = r.id AND released_at IS NULL;
    IF components IS NULL OR components + r.adjustment_cents::numeric <> r.total_cents::numeric OR
      NOT EXISTS (SELECT 1 FROM public.reservation_parties WHERE reservation_id = r.id AND role = 'titular') THEN
      RAISE EXCEPTION USING ERRCODE = '23514', MESSAGE = 'M40: reserva sin titular o total exacto';
    END IF;
    IF EXISTS (SELECT 1 FROM public.reservation_units ru WHERE ru.reservation_id = r.id AND ru.released_at IS NULL AND NOT EXISTS (
      SELECT 1 FROM public.inventory_commitments c WHERE c.reservation_unit_id = ru.id AND c.status = 'active'
        AND c.expires_at IS NOT DISTINCT FROM r.expires_at)) THEN
      RAISE EXCEPTION USING ERRCODE = '23514', MESSAGE = 'M40: paquete de reserva incompleto';
    END IF;
  END IF;
  IF EXISTS (SELECT 1 FROM public.inventory_commitments c JOIN public.reservation_units ru ON ru.id = c.reservation_unit_id
    WHERE ru.reservation_id = r.id AND c.status = 'active' AND
      (r.status NOT IN ('pendiente_pago','en_verificacion','confirmada','cancelacion_solicitada') OR ru.released_at IS NOT NULL)) THEN
    RAISE EXCEPTION USING ERRCODE = '23514', MESSAGE = 'M40: compromiso de reserva sin dueño vigente';
  END IF;
END $$;
--> statement-breakpoint
CREATE FUNCTION m40_check_package() RETURNS trigger LANGUAGE plpgsql SET search_path = pg_catalog, public AS $$
DECLARE reservation_id_value integer;
BEGIN
  CASE TG_TABLE_NAME
    WHEN 'holds' THEN PERFORM public.m40_check_hold(NEW.id);
    WHEN 'hold_units' THEN PERFORM public.m40_check_hold(NEW.hold_id);
    WHEN 'reservations' THEN
      PERFORM public.m40_check_reservation(NEW.id);
      PERFORM public.m40_check_hold(NEW.hold_id);
    WHEN 'reservation_units', 'reservation_parties' THEN PERFORM public.m40_check_reservation(NEW.reservation_id);
    WHEN 'inventory_commitments' THEN
      PERFORM public.m40_check_hold(NEW.hold_id);
      SELECT reservation_id INTO reservation_id_value FROM public.reservation_units WHERE id = NEW.reservation_unit_id;
      PERFORM public.m40_check_reservation(reservation_id_value);
    WHEN 'transaction_commands' THEN
      IF EXISTS (SELECT 1 FROM public.transaction_commands WHERE id = NEW.id AND status <> 'completed') THEN
        RAISE EXCEPTION USING ERRCODE = '23514', MESSAGE = 'M40: comando incompleto requiere rollback';
      END IF;
  END CASE;
  RETURN NULL;
END $$;
--> statement-breakpoint
CREATE CONSTRAINT TRIGGER m40_holds_complete AFTER INSERT OR UPDATE ON holds DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION m40_check_package();
--> statement-breakpoint
CREATE CONSTRAINT TRIGGER m40_hold_units_complete AFTER INSERT OR UPDATE ON hold_units DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION m40_check_package();
--> statement-breakpoint
CREATE CONSTRAINT TRIGGER m40_reservations_complete AFTER INSERT OR UPDATE ON reservations DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION m40_check_package();
--> statement-breakpoint
CREATE CONSTRAINT TRIGGER m40_reservation_units_complete AFTER INSERT OR UPDATE ON reservation_units DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION m40_check_package();
--> statement-breakpoint
CREATE CONSTRAINT TRIGGER m40_reservation_parties_complete AFTER INSERT OR UPDATE ON reservation_parties DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION m40_check_package();
--> statement-breakpoint
CREATE CONSTRAINT TRIGGER m40_commitments_complete AFTER INSERT OR UPDATE ON inventory_commitments DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION m40_check_package();
--> statement-breakpoint
CREATE CONSTRAINT TRIGGER m40_commands_complete AFTER INSERT OR UPDATE ON transaction_commands DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION m40_check_package();
--> statement-breakpoint
-- Conserva identidad durable; no confundir vigencia con el reloj de esta función.
CREATE FUNCTION m40_guard_identity() RETURNS trigger LANGUAGE plpgsql SET search_path = pg_catalog, public AS $$
BEGIN
  -- Serializa el snapshot con ediciones concurrentes de la unidad. El adaptador
  -- debe bloquear el paquete completo por ID ASC antes de escribir componentes.
  PERFORM id FROM public.units WHERE id = NEW.unit_id FOR UPDATE;
  IF NOT EXISTS (SELECT 1 FROM public.units u WHERE u.id = NEW.unit_id AND u.project_id = NEW.project_id
    AND public.normalizar_codigo_unidad(u.code) = NEW.unit_code_normalized) THEN
    RAISE EXCEPTION USING ERRCODE = '23514', MESSAGE = 'M40: identidad de unidad incoherente';
  END IF;
  IF TG_TABLE_NAME = 'inventory_commitments' THEN
   IF NEW.status = 'active' AND NEW.kind <> 'sale' AND EXISTS (
    SELECT 1 FROM public.unit_sales s WHERE s.unit_id = NEW.unit_id OR
      (s.project_id = NEW.project_id AND s.unit_code_normalized = NEW.unit_code_normalized)) THEN
    RAISE EXCEPTION USING ERRCODE = '23514', MESSAGE = 'M40: una venta durable impide adquirir compromiso';
   END IF;
  END IF;
  RETURN NEW;
END $$;
--> statement-breakpoint
CREATE TRIGGER m40_hold_units_identity BEFORE INSERT ON hold_units FOR EACH ROW EXECUTE FUNCTION m40_guard_identity();
--> statement-breakpoint
CREATE TRIGGER m40_reservation_units_identity BEFORE INSERT ON reservation_units FOR EACH ROW EXECUTE FUNCTION m40_guard_identity();
--> statement-breakpoint
CREATE TRIGGER m40_commitment_identity BEFORE INSERT OR UPDATE ON inventory_commitments FOR EACH ROW EXECUTE FUNCTION m40_guard_identity();
--> statement-breakpoint
CREATE FUNCTION m40_guard_history() RETURNS trigger LANGUAGE plpgsql SET search_path = pg_catalog, public AS $$
BEGIN
  IF TG_OP IN ('DELETE','TRUNCATE') THEN
    RAISE EXCEPTION USING ERRCODE = '23514', MESSAGE = 'M40: historia durable no eliminable';
  END IF;
  IF TG_TABLE_NAME = 'transaction_commands' THEN
    IF OLD.status = 'completed' OR (to_jsonb(NEW) - ARRAY['status','http_status','result_public_id','result_code','completed_at','retain_until'])
      IS DISTINCT FROM (to_jsonb(OLD) - ARRAY['status','http_status','result_public_id','result_code','completed_at','retain_until']) THEN
      RAISE EXCEPTION USING ERRCODE = '23514', MESSAGE = 'M40: clave, hash y resultado de comando son durables';
    END IF;
  ELSIF TG_TABLE_NAME = 'hold_units' THEN
    RAISE EXCEPTION USING ERRCODE = '23514', MESSAGE = 'M40: precio congelado de hold inmutable';
  ELSIF TG_TABLE_NAME = 'reservation_units' THEN
    IF OLD.released_at IS NOT NULL OR (to_jsonb(NEW) - ARRAY['released_at','release_reason']) IS DISTINCT FROM
      (to_jsonb(OLD) - ARRAY['released_at','release_reason']) THEN
      RAISE EXCEPTION USING ERRCODE = '23514', MESSAGE = 'M40: componente de reserva inmutable, solo admite liberación histórica';
    END IF;
  ELSIF TG_TABLE_NAME = 'inventory_commitments' THEN
    IF OLD.status = 'resolved' OR (to_jsonb(NEW) - ARRAY['status','expires_at','resolved_at','resolution_reason','row_version','updated_at','updated_by','source','correlation_id']) IS DISTINCT FROM
      (to_jsonb(OLD) - ARRAY['status','expires_at','resolved_at','resolution_reason','row_version','updated_at','updated_by','source','correlation_id']) THEN
      RAISE EXCEPTION USING ERRCODE = '23514', MESSAGE = 'M40: dueño e identidad de compromiso son inmutables';
    END IF;
  ELSIF TG_TABLE_NAME = 'reservation_parties' THEN
    RAISE EXCEPTION USING ERRCODE = '23514', MESSAGE = 'M40: atribución histórica inmutable';
  ELSE
    IF TG_TABLE_NAME = 'holds' AND OLD.status <> 'activo' THEN
      RAISE EXCEPTION USING ERRCODE = '23514', MESSAGE = 'M40: hold resuelto inmutable';
    END IF;
    IF TG_TABLE_NAME = 'reservations' THEN
      IF OLD.status <> 'borrador' AND
        (NEW.currency, NEW.total_cents, NEW.adjustment_cents, NEW.conditions_version, NEW.conditions_document_id, NEW.conditions_hash, NEW.hold_id)
        IS DISTINCT FROM
        (OLD.currency, OLD.total_cents, OLD.adjustment_cents, OLD.conditions_version, OLD.conditions_document_id, OLD.conditions_hash, OLD.hold_id) THEN
        RAISE EXCEPTION USING ERRCODE = '23514', MESSAGE = 'M40: condiciones pactadas inmutables';
      END IF;
    END IF;
    IF NEW.id <> OLD.id OR NEW.public_id <> OLD.public_id OR NEW.created_at <> OLD.created_at OR NEW.created_by <> OLD.created_by
      OR NEW.deal_id <> OLD.deal_id OR (to_jsonb(NEW)->>'holder_id') IS DISTINCT FROM (to_jsonb(OLD)->>'holder_id') THEN
      RAISE EXCEPTION USING ERRCODE = '23514', MESSAGE = 'M40: identidad y autoría original inmutables';
    END IF;
  END IF;
  RETURN NEW;
END $$;
--> statement-breakpoint
DO $$
DECLARE table_name text; role_name text;
BEGIN
  FOREACH table_name IN ARRAY ARRAY['transaction_commands','holds','hold_units','reservations','reservation_parties','reservation_units','inventory_commitments'] LOOP
    EXECUTE format('CREATE TRIGGER m40_history BEFORE UPDATE OR DELETE ON %I FOR EACH ROW EXECUTE FUNCTION public.m40_guard_history()', table_name);
    EXECUTE format('CREATE TRIGGER m40_no_truncate BEFORE TRUNCATE ON %I FOR EACH STATEMENT EXECUTE FUNCTION public.m40_guard_history()', table_name);
    EXECUTE format('REVOKE ALL ON TABLE %I FROM PUBLIC', table_name);
    EXECUTE format('REVOKE ALL ON SEQUENCE %I FROM PUBLIC', table_name || '_id_seq');
    FOREACH role_name IN ARRAY ARRAY['anon','authenticated'] LOOP
      IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = role_name) THEN
        EXECUTE format('REVOKE ALL ON TABLE %I FROM %I', table_name, role_name);
        EXECUTE format('REVOKE ALL ON SEQUENCE %I FROM %I', table_name || '_id_seq', role_name);
      END IF;
    END LOOP;
  END LOOP;
END $$;
--> statement-breakpoint
REVOKE ALL ON FUNCTION m40_lock_parent(), m40_check_hold(integer), m40_check_reservation(integer), m40_check_package(), m40_guard_identity(), m40_guard_history() FROM PUBLIC;
--> statement-breakpoint
-- b1i debe resolver el compromiso antes de mutar disponibilidad o identidad.
CREATE FUNCTION m40_guard_unit_mutation() RETURNS trigger LANGUAGE plpgsql SET search_path = pg_catalog, public AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.inventory_commitments WHERE unit_id = OLD.id AND status = 'active') THEN
    IF TG_OP = 'DELETE' THEN
      RAISE EXCEPTION USING ERRCODE = '23514', MESSAGE = 'M40: unidad comprometida no eliminable';
    END IF;
    IF (NEW.id, NEW.project_id, NEW.code, NEW.status, NEW.deleted_at) IS DISTINCT FROM
      (OLD.id, OLD.project_id, OLD.code, OLD.status, OLD.deleted_at) THEN
      RAISE EXCEPTION USING ERRCODE = '23514', MESSAGE = 'M40: resolver compromiso antes de cambiar unidad';
    END IF;
  END IF;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END $$;
--> statement-breakpoint
CREATE TRIGGER m40_units_commitment_guard BEFORE UPDATE OR DELETE ON units FOR EACH ROW EXECUTE FUNCTION m40_guard_unit_mutation();
--> statement-breakpoint
REVOKE ALL ON FUNCTION m40_guard_unit_mutation() FROM PUBLIC;
