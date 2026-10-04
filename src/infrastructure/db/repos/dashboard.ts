/** Inicio: datos autorizados por recurso, nunca por el nombre del rol. */
import { and, eq, sql, type SQL } from "drizzle-orm";
import type { Actor, PermissionScope } from "../../../domain/rbac.ts";
import { visibleRows } from "../../rbac-filter.ts";
import { REPORT_TIME_ZONE, requireReadScope } from "../../../application/reportes/consultas.ts";
import type { ReadScope } from "../../../application/reportes/puertos.ts";
import type { DashboardQuery, DashboardScopes, DashboardSnapshot, DashboardRepositorio } from "../../../application/dashboard/puertos.ts";
import type { Db } from "../client";
import { activities, contacts, deals, leads, projects, goals, academyProgress } from "../schema.ts";
import { scopeFor } from "../../../domain/rbac.ts";

export const DASHBOARD_LIST_LIMIT = 4;
function betweenLocal(column: SQL, from: string, until: string): SQL {
  return sql`(${column} at time zone ${REPORT_TIME_ZONE})::date >= ${from}::date
    and (${column} at time zone ${REPORT_TIME_ZONE})::date < ${until}::date`;
}
export function crearConsultaDashboard(actor: Actor, scope: ReadScope, scopes: DashboardScopes, q: DashboardQuery): SQL {
  requireReadScope(scope);
  const ls = and(visibleRows(actor, scopes.leads, leads.brokerId, leads.deletedAt), q.brokerId === undefined ? undefined : eq(leads.brokerId, q.brokerId));
  const ds = and(visibleRows(actor, scopes.deals, deals.brokerId, deals.deletedAt), q.brokerId === undefined ? undefined : eq(deals.brokerId, q.brokerId));
  const acts = and(visibleRows(actor, scopes.activities, activities.assigneeId, activities.deletedAt), q.brokerId === undefined ? undefined : eq(activities.assigneeId, q.brokerId));
  const ps = visibleRows(actor, scopes.projects, projects.brokerId, projects.deletedAt);
  const contactGrant = scopeFor(actor, "contacts", "view");
  const contactScope: PermissionScope = contactGrant === "none" ? "none" : scope === "all" ? contactGrant : "own";
  const cs = visibleRows(actor, contactScope, contacts.brokerId, contacts.deletedAt);
  const goalScope = visibleRows(actor, scopes.goals, goals.brokerId);
  return sql`
    with vl as (
      select leads.* from leads where ${ls ?? sql`true`} and leads.received_at <= ${q.asOf}::timestamptz
        and (${q.projectId ?? null}::int is null or leads.project_id = ${q.projectId ?? null}::int)
        and (${q.desde ?? null}::date is null or (leads.received_at at time zone ${REPORT_TIME_ZONE})::date >= ${q.desde ?? null}::date)
        and (${q.hasta ?? null}::date is null or (leads.received_at at time zone ${REPORT_TIME_ZONE})::date <= ${q.hasta ?? null}::date)
    ),
    vd as (
      select deals.*, s.kind from deals join pipeline_stages s on s.id = deals.stage_id
      where ${ds ?? sql`true`} and deals.created_at <= ${q.asOf}::timestamptz
        and (${q.projectId ?? null}::int is null or exists (select 1 from deal_properties dp join projects p on p.id = dp.project_id and p.deleted_at is null where dp.deal_id = deals.id and dp.project_id = ${q.projectId ?? null}::int))
    ),
    cohort as (
      select * from vd where
        (${q.desde ?? null}::date is null or (created_at at time zone ${REPORT_TIME_ZONE})::date >= ${q.desde ?? null}::date) and
        (${q.hasta ?? null}::date is null or (created_at at time zone ${REPORT_TIME_ZONE})::date <= ${q.hasta ?? null}::date)
    ),
    reached_events as (
      select h.deal_id, h.to_stage_id as stage_id, h.changed_at as reached_at from deal_stage_history h
      join cohort d on d.id = h.deal_id where h.changed_at <= ${q.asOf}::timestamptz
      union all select id, stage_id, coalesce(stage_changed_at, created_at) from cohort
    ),
    reached as (
      select deal_id, stage_id, min(reached_at) as reached_at from reached_events group by deal_id, stage_id
    ),
    stage_counts as (
      select s.id as "stageId", s.name as label, s.kind, s.position,
        (select count(*)::int from cohort d where d.stage_id = s.id) as count,
        (select count(*)::int from reached r where r.stage_id = s.id) as "reachedCount",
        (select prev.id from pipeline_stages prev where prev.kind <> 'lost' and prev.position < s.position
          order by prev.position desc, prev.id desc limit 1) as previous_id
      from pipeline_stages s where ${scopes.deals !== "none"}
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
    va as (
      select activities.* from activities where ${acts ?? sql`true`}
        and activities.created_at <= ${q.asOf}::timestamptz
        and (${q.projectId ?? null}::int is null or activities.project_id = ${q.projectId ?? null}::int)
        and (${q.desde ?? null}::date is null or (activities.starts_at at time zone ${REPORT_TIME_ZONE})::date >= ${q.desde ?? null}::date)
        and (${q.hasta ?? null}::date is null or (activities.starts_at at time zone ${REPORT_TIME_ZONE})::date <= ${q.hasta ?? null}::date)
    ),
    recent as (
      select l.id, coalesce(c.full_name, 'Nombre no disponible') as name,
        coalesce(p.name, l.project_interest_text, 'Sin proyecto') as project,
        coalesce(s.name, 'Sin canal') as source, l.status as stage,
        coalesce((select a.title from va a where a.lead_id = l.id and a.status = 'pending'
          order by a.starts_at asc nulls last, a.id limit 1), 'Sin próxima actividad') as next,
        l.received_at
      from vl l left join contacts c on c.id = l.contact_id and ${cs ?? sql`true`}
        left join projects p on p.id = l.project_id and ${ps ?? sql`true`}
        left join lead_sources s on s.id = l.source_id
      order by l.received_at desc, l.id desc limit ${DASHBOARD_LIST_LIMIT}
    ),
    upcoming as (
      select id, title, starts_at as "startsAt", location from va
      where status = 'pending' and starts_at >= ${q.asOf}::timestamptz
      order by starts_at, id limit ${DASHBOARD_LIST_LIMIT}
    ),
    demand as (
      select projects.id, projects.name, count(l.id)::int as leads
      from projects join vl l on l.project_id = projects.id where ${ps ?? sql`true`}
      group by projects.id, projects.name order by count(l.id) desc, projects.id limit ${DASHBOARD_LIST_LIMIT}
    ),
    my_goal as (
      select goals.achieved_deals as achieved, goals.target_deals as target from goals
      where goals.broker_id = ${actor.userId} and ${goalScope ?? sql`true`}
        and goals.year = extract(year from ${q.today}::date) and goals.month = extract(month from ${q.today}::date)
    ),
    academy as (
      select i.title, academy_progress.progress_percent as "progressPercent"
      from academy_items i join academy_progress on academy_progress.academy_item_id = i.id
      where i.is_active and not academy_progress.is_completed and academy_progress.user_id = ${actor.userId}
        and ${visibleRows(actor, scopes.academy, academyProgress.userId) ?? sql`true`}
      order by academy_progress.updated_at desc, i.id limit 1
    )
    select jsonb_build_object(
      'fullName', (select full_name from users where id = ${actor.userId} and deleted_at is null),
      'myLeads', (select count(*)::int from vl where broker_id = ${actor.userId}),
      'monthLeads', (select count(*)::int from vl where ${betweenLocal(sql`received_at`, q.monthStart, q.monthEnd)}),
      'activeDeals', (select count(*)::int from vd where kind = 'open' and
        (${q.desde ?? null}::date is null or (created_at at time zone ${REPORT_TIME_ZONE})::date >= ${q.desde ?? null}::date) and
        (${q.hasta ?? null}::date is null or (created_at at time zone ${REPORT_TIME_ZONE})::date <= ${q.hasta ?? null}::date)),
      'pipelineCents', (select coalesce(sum(amount_cents), 0) from vd where kind = 'open' and currency = 'USD' and
        (${q.desde ?? null}::date is null or (created_at at time zone ${REPORT_TIME_ZONE})::date >= ${q.desde ?? null}::date) and
        (${q.hasta ?? null}::date is null or (created_at at time zone ${REPORT_TIME_ZONE})::date <= ${q.hasta ?? null}::date)),
      'monthWon', (select count(*)::int from vd where kind = 'won' and closed_at <= ${q.asOf}::timestamptz
        and ${betweenLocal(sql`closed_at`, q.monthStart, q.monthEnd)}
        and (${q.desde ?? null}::date is null or (closed_at at time zone ${REPORT_TIME_ZONE})::date >= ${q.desde ?? null}::date)
        and (${q.hasta ?? null}::date is null or (closed_at at time zone ${REPORT_TIME_ZONE})::date <= ${q.hasta ?? null}::date)),
      'unassignedLeads', (select count(*)::int from vl where broker_id is null),
      'todayMeetings', (select count(*)::int from va where activity_type = 'meeting' and status = 'pending' and ${betweenLocal(sql`starts_at`, q.today, q.weekEnd)} and (starts_at at time zone ${REPORT_TIME_ZONE})::date = ${q.today}::date),
      'weekMeetings', (select count(*)::int from va where activity_type = 'meeting' and status = 'pending' and ${betweenLocal(sql`starts_at`, q.weekStart, q.weekEnd)}),
      'pendingTasks', (select count(*)::int from va where activity_type = 'task' and status = 'pending'),
      'goal', (select to_jsonb(g) from my_goal g),
      'level', (select level from broker_profiles where user_id = ${actor.userId}),
      'recentLeads', (select coalesce(jsonb_agg(to_jsonb(r) - 'received_at' order by received_at desc, id desc), '[]'::jsonb) from recent r),
      'activities', (select coalesce(jsonb_agg(to_jsonb(a) order by "startsAt", id), '[]'::jsonb) from upcoming a),
      'projects', (select coalesce(jsonb_agg(to_jsonb(d) order by leads desc, id), '[]'::jsonb) from demand d),
      'academy', (select to_jsonb(a) from academy a),
      'funnel', (select coalesce(jsonb_agg(to_jsonb(f) order by position, "stageId"), '[]'::jsonb) from funnel f)
    ) as data
  `;
}
export function repositorioDashboard(db: Pick<Db, "execute">): DashboardRepositorio {
  return {
    async obtenerMetricasDashboard(actor, scope, scopes, query) {
      const rows = await db.execute<{ data: DashboardSnapshot }>(crearConsultaDashboard(actor, scope, scopes, query));
      if (!rows[0]) throw new Error("No se pudo consultar Inicio.");
      return { ...rows[0].data, fullName: rows[0].data.fullName ?? "" };
    },
  };
}

