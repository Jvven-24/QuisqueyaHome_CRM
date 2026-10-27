/**
 * Adaptador Drizzle de metas por alcance, equipos y regla de atribución
 * (`application/metas/alcances-puertos.ts`). Solo objetivos y configuración:
 * lo logrado se deriva en `metas-lectura.ts` de los negocios ganados.
 */
import { and, eq, inArray, ne } from "drizzle-orm";
import type { Equipo, MetaAlcance, ReglaAtribucion, RepositorioMetasAlcance, ReposMetasAlcance } from "../../../application/metas/alcances-puertos";
import { leerConfigAtribucion, type AlcanceMeta } from "../../../domain/metas-alcances";
import { attributionRules, brokerProfiles, projects, scopedGoals, teamMembers, teams } from "../schema";
import { auditoriaDrizzle, type Tx } from "./compartido";

function aMeta(f: typeof scopedGoals.$inferSelect): MetaAlcance {
  return { id: f.id, scopeType: f.scopeType as AlcanceMeta, scopeId: f.scopeId, year: f.year, month: f.month, targetDeals: f.targetDeals, targetAmountCents: f.targetAmountCents, currency: f.currency };
}

function aRegla(f: typeof attributionRules.$inferSelect): ReglaAtribucion {
  return { id: f.id, version: f.version, scope: f.scope, rule: f.rule, config: leerConfigAtribucion(f.config), isActive: f.isActive, approvedBy: f.approvedBy, approvedAt: f.approvedAt };
}

export function repositorioMetasAlcance(tx: Tx): RepositorioMetasAlcance {
  async function equipo(id: number): Promise<Equipo | undefined> {
    const [e] = await tx.select().from(teams).where(eq(teams.id, id)).limit(1);
    if (!e) return undefined;
    const miembros = await tx.select({ userId: teamMembers.userId }).from(teamMembers).where(eq(teamMembers.teamId, id));
    return { id: e.id, name: e.name, slug: e.slug, leaderId: e.leaderId, isActive: e.isActive, memberIds: miembros.map((m) => m.userId).sort((a, b) => a - b) };
  }
  return {
    async existeAlcance(tipo, id) {
      if (tipo === "project") {
        const [p] = await tx.select({ id: projects.id }).from(projects).where(eq(projects.id, id)).limit(1);
        return Boolean(p);
      }
      const [t] = await tx.select({ id: teams.id }).from(teams).where(and(eq(teams.id, id), eq(teams.isActive, true))).limit(1);
      return Boolean(t);
    },

    async fijarMetaAlcance({ actorId, ...d }) {
      const [anterior] = await tx
        .select()
        .from(scopedGoals)
        .where(and(eq(scopedGoals.scopeType, d.scopeType), eq(scopedGoals.scopeId, d.scopeId), eq(scopedGoals.year, d.year), eq(scopedGoals.month, d.month)))
        .limit(1);
      const [fila] = await tx
        .insert(scopedGoals)
        .values({ scopeType: d.scopeType, scopeId: d.scopeId, year: d.year, month: d.month, targetDeals: d.targetDeals, targetAmountCents: d.targetAmountCents, currency: d.currency, createdBy: actorId, updatedBy: actorId })
        .onConflictDoUpdate({
          target: [scopedGoals.scopeType, scopedGoals.scopeId, scopedGoals.year, scopedGoals.month],
          set: { targetDeals: d.targetDeals, targetAmountCents: d.targetAmountCents, currency: d.currency, updatedBy: actorId },
        })
        .returning();
      return { anterior: anterior ? aMeta(anterior) : undefined, meta: aMeta(fila!) };
    },

    async eliminarMetaAlcance(id) {
      const [f] = await tx.delete(scopedGoals).where(eq(scopedGoals.id, id)).returning();
      return f ? aMeta(f) : undefined;
    },

    async noBrokers(ids) {
      if (!ids.length) return [];
      const filas = await tx.select({ userId: brokerProfiles.userId }).from(brokerProfiles).where(inArray(brokerProfiles.userId, [...ids]));
      const si = new Set(filas.map((f) => f.userId));
      return ids.filter((i) => !si.has(i));
    },

    buscarEquipo: equipo,

    async existeSlugEquipo(slug, excepto) {
      const [f] = await tx
        .select({ id: teams.id })
        .from(teams)
        .where(excepto != null ? and(eq(teams.slug, slug), ne(teams.id, excepto)) : eq(teams.slug, slug))
        .limit(1);
      return Boolean(f);
    },

    async guardarEquipo({ id, name, slug, leaderId, memberIds, actorId }) {
      let teamId = id;
      if (teamId != null) {
        await tx.update(teams).set({ name, slug, leaderId, updatedBy: actorId }).where(eq(teams.id, teamId));
        await tx.delete(teamMembers).where(eq(teamMembers.teamId, teamId));
      } else {
        const [f] = await tx.insert(teams).values({ name, slug, leaderId, createdBy: actorId, updatedBy: actorId }).returning({ id: teams.id });
        teamId = f!.id;
      }
      if (memberIds.length) {
        // Un broker, un equipo (`team_members_user_unq`): se retira del anterior.
        await tx.delete(teamMembers).where(inArray(teamMembers.userId, memberIds));
        await tx.insert(teamMembers).values(memberIds.map((userId) => ({ teamId: teamId!, userId, createdBy: actorId })));
      }
      return (await equipo(teamId))!;
    },

    async versionesDeRegla() {
      const filas = await tx.select({ version: attributionRules.version }).from(attributionRules);
      return filas.map((f) => f.version);
    },

    async publicarRegla({ version, scope, rule, config, actorId, cuando }) {
      const [anterior] = await tx.select().from(attributionRules).where(eq(attributionRules.isActive, true)).limit(1).for("update");
      await tx.update(attributionRules).set({ isActive: false }).where(eq(attributionRules.isActive, true));
      const [f] = await tx
        .insert(attributionRules)
        .values({ version, scope, rule, config, isActive: true, approvedBy: actorId, approvedAt: cuando, createdBy: actorId })
        .returning();
      return { anterior: anterior ? aRegla(anterior) : undefined, regla: aRegla(f!) };
    },
  };
}

export function reposMetasAlcance(tx: Tx): ReposMetasAlcance {
  return { alcances: repositorioMetasAlcance(tx), auditoria: auditoriaDrizzle(tx) };
}

