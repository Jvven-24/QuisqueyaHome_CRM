/**
 * Reportes: una sentencia de lectura, una instantánea MVCC.
 * Las fechas filtran eventos; el embudo/forecast filtran cohortes por creación.
 */
import { and, eq, sql, type SQL } from "drizzle-orm";
import type { Actor } from "../../../domain/rbac.ts";
import { visibleRows } from "../../rbac-filter.ts";
import { REPORT_TIME_ZONE, TREND_MONTHS, requireReadScope } from "../../../application/reportes/consultas.ts";
import type { ReadScope, ReportQuery, ReportSnapshot, ReportesRepositorio } from "../../../application/reportes/puertos.ts";
import type { Db } from "../client";
import { leads, deals, units, commissions } from "../schema.ts";

function dateRange(column: SQL, q: ReportQuery): SQL {
  return sql`${column} <= ${q.asOf}::timestamptz
    and (${q.desde ?? null}::date is null or (${column} at time zone ${REPORT_TIME_ZONE})::date >= ${q.desde ?? null}::date)
    and (${q.hasta ?? null}::date is null or (${column} at time zone ${REPORT_TIME_ZONE})::date <= ${q.hasta ?? null}::date)`;
}
export function crearConsultaReportes(actor: Actor, scope: ReadScope, q: ReportQuery): SQL {
  requireReadScope(scope);
  const leadScope = and(visibleRows(actor, scope, leads.brokerId, leads.deletedAt), q.brokerId === undefined ? undefined : eq(leads.brokerId, q.brokerId));
  const dealScope = and(visibleRows(actor, scope, deals.brokerId, deals.deletedAt), q.brokerId === undefined ? undefined : eq(deals.brokerId, q.brokerId));
  const unitScope = and(visibleRows(actor, scope, units.brokerId, units.deletedAt), q.brokerId === undefined ? undefined : eq(units.brokerId, q.brokerId));
  const commissionScope = and(visibleRows(actor, scope, commissions.brokerId), q.brokerId === undefined ? undefined : eq(commissions.brokerId, q.brokerId));
  // No hay atribución broker/proyecto en campaign_spend. Nunca inventar prorrateos.
  const attributableSpend = scope === "all" && q.brokerId === undefined && q.projectId === undefined;
  const leadPeriod = dateRange(sql`received_at`, q);
  const dealPeriod = dateRange(sql`created_at`, q);
  const wonPeriod = dateRange(sql`closed_at`, q);
  return sql`
    with
    visible_leads as (
      select leads.* from leads where ${leadScope ?? sql`true`}
        and (${q.projectId ?? null}::int is null or leads.project_id = ${q.projectId ?? null}::int)
        and leads.received_at <= ${q.asOf}::timestamptz
    ),
    visible_deals as (
      select deals.*, pipeline_stages.kind, pipeline_stages.default_probability
      from deals join pipeline_stages on pipeline_stages.id = deals.stage_id
      where ${dealScope ?? sql`true`} and deals.created_at <= ${q.asOf}::timestamptz
        and (${q.projectId ?? null}::int is null or exists (
          select 1 from deal_properties dp join projects p on p.id = dp.project_id and p.deleted_at is null
          where dp.deal_id = deals.id and dp.project_id = ${q.projectId ?? null}::int))
    ),
    period_leads as (select * from visible_leads where ${leadPeriod}),
    period_deals as (select * from visible_deals where ${dealPeriod}),
    won as (select * from visible_deals where kind = 'won' and ${wonPeriod}),
    reached_events as (
      select h.deal_id, h.to_stage_id as stage_id, h.changed_at as reached_at from deal_stage_history h
      join period_deals d on d.id = h.deal_id where h.changed_at <= ${q.asOf}::timestamptz
      union all select id, stage_id, coalesce(stage_changed_at, created_at) from period_deals
    ),
    reached as (
      select deal_id, stage_id, min(reached_at) as reached_at from reached_events group by deal_id, stage_id
    ),
    stage_counts as (
      select s.id as "stageId", s.name as label, s.kind, s.position,
        (select count(*)::int from period_deals d where d.stage_id = s.id) as count,
        (select count(*)::int from reached r where r.stage_id = s.id) as "reachedCount",
        (select prev.id from pipeline_stages prev where prev.kind <> 'lost' and prev.position < s.position
          order by prev.position desc, prev.id desc limit 1) as previous_id
      from pipeline_stages s
    ),
    funnel as (
      select s."stageId", s.label, s.kind, s.position, s.count, s."reachedCount",
        case when s.kind = 'lost' or s.previous_id is null then null else
          (select count(*)::int from reached r where r.stage_id = s.previous_id) end as "previousReachedCount",
        case when s.kind = 'lost' or s.previous_id is null then null else
          (select count(*)::int from reached r where r.stage_id = s."stageId" and exists (
            select 1 from reached prev where prev.deal_id = r.deal_id and prev.stage_id = s.previous_id and prev.reached_at <= r.reached_at)) end as "passedFromPreviousCount"
      from stage_counts s
    ),
    spend as (
      select mc.source_id, sum(cs.amount_cents) as amount
      from campaign_spend cs join marketing_campaigns mc on mc.id = cs.campaign_id and mc.deleted_at is null
      where ${attributableSpend} and cs.currency = 'USD'
        and cs.month <= (${q.asOf}::timestamptz at time zone ${REPORT_TIME_ZONE})::date
        and (${q.desde ?? null}::date is null or cs.month >= date_trunc('month', ${q.desde ?? null}::date)::date)
        and (${q.hasta ?? null}::date is null or cs.month <= ${q.hasta ?? null}::date)
      group by mc.source_id
    ),
    source_keys as (
      select source_id from period_leads union select source_id from period_deals
      union select source_id from won union select source_id from spend
    ),
    sources as (
      select k.source_id as "sourceId", coalesce(s.name, 'Sin canal') as source,
        (select count(*)::int from period_leads l where l.source_id is not distinct from k.source_id) as count,
        (select count(*)::int from period_deals d where d.source_id is not distinct from k.source_id) as deals,
        (select count(*)::int from won d where d.source_id is not distinct from k.source_id) as won,
        (select coalesce(sum(amount_cents), 0) from won d where d.currency = 'USD' and d.source_id is not distinct from k.source_id) as "revenueCents",
        case when ${attributableSpend} then (select sum(amount) from spend where source_id = k.source_id) else null end as "spendCents"
      from source_keys k left join lead_sources s on s.id = k.source_id
    ),
    zone_counts as (
      select z.id as "zoneId", coalesce(z.name, l.zone_interest, 'Sin zona') as label, count(*)::int as count
      from period_leads l left join zones z on z.id = l.zone_interest_id
      group by z.id, z.name, coalesce(z.name, l.zone_interest, 'Sin zona')
    ),
    losses as (
      select r.id as "reasonId", coalesce(r.name, 'Sin motivo registrado') as label, count(*)::int as count
      from visible_deals d left join loss_reasons r on r.id = d.loss_reason_id
      where d.kind = 'lost' and ${wonPeriod} group by r.id, r.name
    ),
    months as (
      select to_char(m, 'YYYY-MM') as month
      from generate_series(${q.trendStart}::timestamp, ${q.trendStart}::timestamp + (${TREND_MONTHS} - 1) * interval '1 month', interval '1 month') m
    ),
    trend as (
      select m.month,
        (select count(*)::int from period_leads l where to_char(l.received_at at time zone ${REPORT_TIME_ZONE}, 'YYYY-MM') = m.month) as leads,
        (select count(*)::int from period_deals d where to_char(d.created_at at time zone ${REPORT_TIME_ZONE}, 'YYYY-MM') = m.month) as deals,
        (select count(*)::int from won d where to_char(d.closed_at at time zone ${REPORT_TIME_ZONE}, 'YYYY-MM') = m.month) as won,
        (select coalesce(sum(amount_cents), 0) from won d where d.currency = 'USD' and to_char(d.closed_at at time zone ${REPORT_TIME_ZONE}, 'YYYY-MM') = m.month) as "revenueCents"
      from months m
    ),
    broker_keys as (
      select broker_id from period_leads union select broker_id from period_deals union select broker_id from won
    ),
    ranking as (
      select k.broker_id as "brokerId", coalesce(u.full_name, 'Sin asignar') as name,
        (select count(*)::int from period_leads l where l.broker_id is not distinct from k.broker_id) as leads,
        (select count(*)::int from period_deals d where d.broker_id is not distinct from k.broker_id) as deals,
        (select count(*)::int from won d where d.broker_id is not distinct from k.broker_id) as won,
        (select coalesce(sum(amount_cents), 0) from won d where d.currency = 'USD' and d.broker_id is not distinct from k.broker_id) as "volumeCents"
      from broker_keys k left join users u on u.id = k.broker_id
    ),
    durations as (
      select extract(epoch from (d.closed_at - l.received_at)) / 86400.0 as days
      from won d join visible_leads l on l.id = d.lead_id where d.closed_at >= l.received_at
    ),
    inventory as (
      select coalesce(s.name, units.status) as state, count(*)::int as count,
        percentile_cont(0.5) within group (order by extract(epoch from (${q.asOf}::timestamptz - units.created_at)) / 86400.0) as "medianAgeDays",
        percentile_cont(0.75) within group (order by extract(epoch from (${q.asOf}::timestamptz - units.created_at)) / 86400.0) as "p75AgeDays"
      from units join projects p on p.id = units.project_id and p.deleted_at is null
      left join unit_inventory_states s on s.id = units.inventory_state_id
      where ${unitScope ?? sql`true`} and ${dateRange(sql`units.created_at`, q)}
        and (${q.projectId ?? null}::int is null or units.project_id = ${q.projectId ?? null}::int)
      group by coalesce(s.name, units.status)
    ),
    commission_months as (
      select to_char(commissions.closed_date, 'YYYY-MM') as month, count(*)::int as count,
        sum(commissions.total_commission_cents) as "totalCents", sum(commissions.broker_amount_cents) as "brokerCents",
        sum(commissions.agency_amount_cents) as "agencyCents",
        coalesce(sum(commissions.total_commission_cents) filter (where commissions.status = 'paid'), 0) as "paidCents"
      from commissions join visible_deals d on d.id = commissions.deal_id
      where ${commissionScope ?? sql`true`} and commissions.currency = 'USD' and commissions.status <> 'void'
        and commissions.created_at <= ${q.asOf}::timestamptz
        and (commissions.closed_date is null and ${q.desde ?? null}::date is null and ${q.hasta ?? null}::date is null
          or commissions.closed_date <= (${q.asOf}::timestamptz at time zone ${REPORT_TIME_ZONE})::date
            and (${q.desde ?? null}::date is null or commissions.closed_date >= ${q.desde ?? null}::date)
            and (${q.hasta ?? null}::date is null or commissions.closed_date <= ${q.hasta ?? null}::date))
      group by to_char(commissions.closed_date, 'YYYY-MM')
    ),
    forecast as (
      select *, coalesce(probability, default_probability) as effective_probability
      from period_deals where kind = 'open' and currency = 'USD'
    ),
    weighted as (
      select *, round(amount_cents::numeric * effective_probability / 100) as weighted_cents
      from forecast where effective_probability between 0 and 100 and amount_cents is not null
    ),
    forecast_months as (
      select to_char(expected_close_date, 'YYYY-MM') as month, sum(weighted_cents) as "amountCents"
      from weighted group by to_char(expected_close_date, 'YYYY-MM')
    )
    select jsonb_build_object(
      'totalLeads', (select count(*)::int from period_leads),
      'totalDeals', (select count(*)::int from period_deals),
      'funnel', (select coalesce(jsonb_agg(to_jsonb(f) order by position, "stageId"), '[]'::jsonb) from funnel f),
      'sources', (select coalesce(jsonb_agg(to_jsonb(s) order by count desc, "sourceId" nulls last), '[]'::jsonb) from sources s),
      'zones', (select coalesce(jsonb_agg(to_jsonb(z) order by count desc, label), '[]'::jsonb) from zone_counts z),
      'lossReasons', (select coalesce(jsonb_agg(to_jsonb(l) order by count desc, label), '[]'::jsonb) from losses l),
      'trend', (select coalesce(jsonb_agg(to_jsonb(t) order by month), '[]'::jsonb) from trend t),
      'brokers', (select coalesce(jsonb_agg(to_jsonb(r) order by "volumeCents" desc, "brokerId" nulls last), '[]'::jsonb) from ranking r),
      'velocity', (select jsonb_build_object('sampleSize', count(*)::int, 'medianDays', percentile_cont(0.5) within group (order by days), 'p75Days', percentile_cont(0.75) within group (order by days)) from durations),
      'inventory', (select coalesce(jsonb_agg(to_jsonb(i) order by state), '[]'::jsonb) from inventory i),
      'commissions', (select coalesce(jsonb_agg(to_jsonb(c) order by month nulls last), '[]'::jsonb) from commission_months c),
      'projection', jsonb_build_object(
        'totalWeightedCents', (select coalesce(sum(weighted_cents), 0) from weighted),
        'knownAmountCents', (select coalesce(sum(amount_cents), 0) from weighted),
        'missingProbabilityCount', (select count(*)::int from forecast where effective_probability is null or effective_probability not between 0 and 100),
        'missingAmountCount', (select count(*)::int from forecast where amount_cents is null),
        'points', (select coalesce(jsonb_agg(to_jsonb(f) order by month nulls last), '[]'::jsonb) from forecast_months f))
    ) as data
  `;
}
export function repositorioReportes(db: Pick<Db, "execute">): ReportesRepositorio {
  return {
    async obtenerMetricasBi(actor, scope, query) {
      const rows = await db.execute<{ data: ReportSnapshot }>(crearConsultaReportes(actor, scope, query));
      if (!rows[0]) throw new Error("No se pudo consultar el reporte.");
      return rows[0].data;
    },
  };
}

