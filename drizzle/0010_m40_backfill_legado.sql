-- M40 b1h / TX-32. Expansion only; no activation or financial opening.
-- Run with the official migrator in a maintenance window. A failed statement
-- rolls back the whole migration; retry after reconciling the source conflict.
-- Roll forward after adoption: never delete durable commitments to undo this.
SET LOCAL lock_timeout = '5s';
--> statement-breakpoint
SET LOCAL statement_timeout = '60s';
--> statement-breakpoint
SET LOCAL TIME ZONE 'UTC';
--> statement-breakpoint
DO $$
BEGIN
  -- Stable source and destination; serializes replays without ON CONFLICT hiding
  -- another owner's active commitment. No dependency on a test-created table.
  LOCK TABLE public.units, public.unit_sales, public.inventory_commitments IN SHARE ROW EXCLUSIVE MODE;

  IF EXISTS (
    SELECT 1 FROM public.unit_sales s JOIN public.inventory_commitments c
      ON c.unit_id = s.unit_id OR
        (c.project_id = s.project_id AND c.unit_code_normalized = s.unit_code_normalized)
    WHERE c.status = 'active' AND (c.kind <> 'sale' OR c.unit_sale_id IS DISTINCT FROM s.id)
  ) THEN
    RAISE EXCEPTION USING ERRCODE = '23514', MESSAGE = 'M40 b1h: compromiso activo incompatible con venta durable';
  END IF;
  IF EXISTS (
    SELECT 1 FROM public.unit_sales s JOIN public.inventory_commitments c ON c.unit_sale_id = s.id
    WHERE c.kind <> 'sale' OR c.status <> 'active' OR
      (c.unit_id, c.project_id, c.unit_code_normalized) IS DISTINCT FROM
      (s.unit_id, s.project_id, s.unit_code_normalized)
  ) THEN
    RAISE EXCEPTION USING ERRCODE = '23514', MESSAGE = 'M40 b1h: venta con compromiso historico incompatible';
  END IF;

  INSERT INTO public.inventory_commitments
    (unit_id, project_id, unit_code_normalized, kind, status, unit_sale_id,
     created_by, updated_by, created_at, updated_at, correlation_id, source)
  SELECT s.unit_id, s.project_id, s.unit_code_normalized, 'sale', 'active', s.id,
    s.created_by, s.created_by, s.created_at, s.created_at, s.id,
    'm40:b1h:unit_sales:' || s.id::text
  FROM public.unit_sales s
  WHERE NOT EXISTS (SELECT 1 FROM public.inventory_commitments c WHERE c.unit_sale_id = s.id)
  ORDER BY s.unit_id;

  -- Ganados sin venta durable: remain untouched, no invented owner or debt.
END $$;
--> statement-breakpoint
DO $$
BEGIN
  -- Provenance attestations, not documents or financial evidence. Full original
  -- commissions remain the source; only their fingerprint enters generic audit.
  -- The maintenance lock makes absence checks and repeat execution atomic.
  LOCK TABLE public.commissions, public.deals, public.pipeline_stages, public.audit_log IN SHARE ROW EXCLUSIVE MODE;
  INSERT INTO public.audit_log (user_id, action, entity_type, entity_id, new_value, user_agent)
  SELECT NULL, 'importar', 'commission', c.id,
    jsonb_build_object('version', 1, 'source', 'commissions',
      'snapshot_sha256', encode(sha256(convert_to(to_jsonb(c)::text, 'UTF8')), 'hex'),
      'financial_evidence', 'no_verificada', 'warning', 'evidencia no verificada',
      'adoption', 'pendiente_documentacion')::text,
    'm40:b1h:0010'
  FROM public.commissions c
  WHERE NOT EXISTS (SELECT 1 FROM public.audit_log a WHERE a.entity_type='commission'
    AND a.entity_id=c.id AND a.action='importar' AND a.user_agent='m40:b1h:0010')
  ORDER BY c.id;

  -- No reservation/payment origin exists for these rows: an audit worklist
  -- preserves the exception without fabricating reconciliation cases or debt.
  INSERT INTO public.audit_log (user_id, action, entity_type, entity_id, new_value, user_agent)
  SELECT NULL, 'importar', 'deal', d.id,
    jsonb_build_object('version', 1, 'source', 'deals',
      'issue', 'won_without_durable_sale', 'remediation', 'pendiente',
      'warning', 'evidencia no verificada')::text,
    'm40:b1h:0010'
  FROM public.deals d JOIN public.pipeline_stages s ON s.id=d.stage_id
  WHERE s.kind='won' AND d.operation_type='sale'
    AND NOT EXISTS (SELECT 1 FROM public.unit_sales us WHERE us.deal_id=d.id)
    AND NOT EXISTS (SELECT 1 FROM public.audit_log a WHERE a.entity_type='deal'
      AND a.entity_id=d.id AND a.action='importar' AND a.user_agent='m40:b1h:0010')
  ORDER BY d.id;
END $$;
