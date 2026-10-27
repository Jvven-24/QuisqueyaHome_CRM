/**
 * M8 · Lecturas de Metas que derivan lo logrado de los negocios ganados del
 * periodo (hora de Santo Domingo), sin tocar `goals`. Fuente única del
 * desglose por moneda y del avance de metas de proyecto/equipo.
 *
 * Atribución: si el negocio tiene versión de regla congelada al cierre se usa
 * su proyecto/equipo congelado; si es anterior a la regla (legado), el
 * proyecto de su propiedad principal y el equipo actual del broker.
 */
import { and, asc, desc, eq, isNull, sql } from "drizzle-orm";
import { agruparLogroPorMoneda, leerConfigAtribucion, type LogroPorMoneda } from "@/domain/metas-alcances";
import type { getDb } from "../client";
import { attributionRules, deals, pipelineStages, projects, scopedGoals, teamMembers, teams, users } from "../schema";

type Db = ReturnType<typeof getDb>;

function ganadosDelPeriodo(year: number, month: number) {
  return and(
    eq(pipelineStages.kind, "won"),
    isNull(deals.deletedAt),
    sql`extract(year from ${deals.closedAt} at time zone 'America/Santo_Domingo') = ${year}`,
    sql`extract(month from ${deals.closedAt} at time zone 'America/Santo_Domingo') = ${month}`,
  );
}

const proyectoAtribuido = sql<number | null>`case when ${deals.attributionRuleVersion} is not null then ${deals.attributedProjectId}
  else (select dp.project_id from deal_properties dp where dp.deal_id = ${deals.id} order by dp.is_primary desc, dp.id limit 1) end`;
const equipoAtribuido = sql<number | null>`case when ${deals.attributionRuleVersion} is not null then ${deals.attributedTeamId}
  else (select tm.team_id from team_members tm where tm.user_id = ${deals.brokerId} limit 1) end`;

export type LogroPeriodo = {
  compania: LogroPorMoneda[];
  porBroker: Map<number, LogroPorMoneda[]>;
  porProyecto: Map<number, LogroPorMoneda[]>;
  porEquipo: Map<number, LogroPorMoneda[]>;
};

export async function logroDelPeriodo(db: Db, year: number, month: number): Promise<LogroPeriodo> {
  const filas = await db
    .select({
      brokerId: deals.brokerId,
      currency: deals.currency,
      amountCents: deals.amountCents,
      projectId: proyectoAtribuido,
      teamId: equipoAtribuido,
    })
    .from(deals)
    .innerJoin(pipelineStages, eq(pipelineStages.id, deals.stageId))
    .where(ganadosDelPeriodo(year, month));
  const agrupar = (clave: (f: (typeof filas)[number]) => number | null) => {
    const m = new Map<number, typeof filas>();
    for (const f of filas) {
      const k = clave(f);
      if (k == null) continue;
      m.set(Number(k), [...(m.get(Number(k)) ?? []), f]);
    }
    return new Map([...m].map(([k, v]) => [k, agruparLogroPorMoneda(v)]));
  };
  return {
    compania: agruparLogroPorMoneda(filas),
    porBroker: agrupar((f) => f.brokerId),
    porProyecto: agrupar((f) => f.projectId),
    porEquipo: agrupar((f) => f.teamId),
  };
}

export type MetaAlcanceFila = {
  id: number;
  scopeType: "project" | "team";
  scopeId: number;
  nombre: string;
  targetDeals: number;
  targetAmountCents: number | null;
  currency: string;
};

export async function metasDeAlcance(db: Db, year: number, month: number): Promise<MetaAlcanceFila[]> {
  const filas = await db
    .select({
      id: scopedGoals.id,
      scopeType: scopedGoals.scopeType,
      scopeId: scopedGoals.scopeId,
      targetDeals: scopedGoals.targetDeals,
      targetAmountCents: scopedGoals.targetAmountCents,
      currency: scopedGoals.currency,
      proyecto: projects.name,
      equipo: teams.name,
    })
    .from(scopedGoals)
    .leftJoin(projects, and(eq(scopedGoals.scopeType, "project"), eq(projects.id, scopedGoals.scopeId)))
    .leftJoin(teams, and(eq(scopedGoals.scopeType, "team"), eq(teams.id, scopedGoals.scopeId)))
    .where(and(eq(scopedGoals.year, year), eq(scopedGoals.month, month)))
    .orderBy(asc(scopedGoals.scopeType), asc(scopedGoals.id));
  return filas.map((f) => ({
    id: f.id,
    scopeType: f.scopeType as "project" | "team",
    scopeId: f.scopeId,
    nombre: (f.scopeType === "project" ? f.proyecto : f.equipo) ?? `#${f.scopeId}`,
    targetDeals: f.targetDeals,
    targetAmountCents: f.targetAmountCents,
    currency: f.currency,
  }));
}

export type EquipoFila = { id: number; name: string; leaderId: number | null; leader: string | null; miembros: { id: number; nombre: string }[] };

export async function equiposActivos(db: Db): Promise<EquipoFila[]> {
  const base = await db
    .select({ id: teams.id, name: teams.name, leaderId: teams.leaderId, leader: users.fullName })
    .from(teams)
    .leftJoin(users, eq(users.id, teams.leaderId))
    .where(eq(teams.isActive, true))
    .orderBy(asc(teams.name));
  const miembros = await db
    .select({ teamId: teamMembers.teamId, id: users.id, nombre: users.fullName })
    .from(teamMembers)
    .innerJoin(users, eq(users.id, teamMembers.userId))
    .orderBy(asc(users.fullName));
  return base.map((t) => ({ ...t, miembros: miembros.filter((m) => m.teamId === t.id).map(({ id, nombre }) => ({ id, nombre })) }));
}

export async function proyectosParaMetas(db: Db): Promise<{ id: number; name: string }[]> {
  return db.select({ id: projects.id, name: projects.name }).from(projects).orderBy(asc(projects.name));
}

export type ReglaFila = { version: number; scope: string; rule: string; equipo: string; isActive: boolean; aprobadaPor: string | null; aprobadaEn: string | null };

export async function reglasDeAtribucion(db: Db): Promise<ReglaFila[]> {
  const filas = await db
    .select({ version: attributionRules.version, scope: attributionRules.scope, rule: attributionRules.rule, config: attributionRules.config, isActive: attributionRules.isActive, aprobadaPor: users.fullName, aprobadaEn: attributionRules.approvedAt })
    .from(attributionRules)
    .leftJoin(users, eq(users.id, attributionRules.approvedBy))
    .orderBy(desc(attributionRules.version));
  return filas.map((f) => ({
    version: f.version,
    scope: f.scope,
    rule: f.rule,
    equipo: leerConfigAtribucion(f.config).equipo,
    isActive: f.isActive,
    aprobadaPor: f.aprobadaPor,
    aprobadaEn: f.aprobadaEn ? f.aprobadaEn.toISOString() : null,
  }));
}
