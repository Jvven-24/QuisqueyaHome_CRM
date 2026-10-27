/**
 * M8 · Metas (`docs/F3_ANALISIS_Y_PLAN.md` §4.1, issue #30). Conecta `/metas`
 * a `goals`: selector de periodo real (`?periodo=AAAA-MM`), meta de la
 * compañía o del broker según el alcance, tabla por broker y el gráfico
 * anual. El JSX visual vive en `./vista.tsx` (cliente).
 *
 * La tabla parte de perfiles activos y une goals del periodo. Si no hay fila,
 * se muestra «sin meta», igual que el directorio y la ficha de brokers (H-08).
 * Los históricos y tendencias conservan solo meses realmente registrados.
 */

import { and, eq, isNotNull, isNull } from "drizzle-orm";
import { fechaSantoDomingo } from "@/domain/zona-horaria";
import { can } from "@/domain/rbac";
import { formatoPeriodo, nombreMes, parsearPeriodo } from "@/domain/metas";
import { requireActor } from "@/infrastructure/auth/actor";
import { getDb } from "@/infrastructure/db/client";
import { brokerProfiles, goals, users } from "@/infrastructure/db/schema";
import { requireScopeInPage } from "@/infrastructure/page-guard";
import { visibleRows } from "@/infrastructure/rbac-filter";
import { equiposActivos, logroDelPeriodo, metasDeAlcance, proyectosParaMetas, reglasDeAtribucion } from "@/infrastructure/db/repos/metas-lectura";
import { MetasVista } from "./vista";

export const metadata = { title: "Metas · CRM Quisqueya Home" };

function primero(valor: string | string[] | undefined): string | undefined {
  return Array.isArray(valor) ? valor[0] : valor;
}

export default async function MetasPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const actor = await requireActor();
  const scope = requireScopeInPage(actor, "goals", "view");
  const puedeEditar = can(actor, "goals", "edit");
  // Reiniciar, metas de proyecto/equipo, equipos y regla: solo alcance `all` de goals:edit.
  const puedeAdministrar = puedeEditar && scope === "all";

  const params = await searchParams;
  const periodo = parsearPeriodo(primero(params.periodo), new Date());
  const esVistaCompleta = scope === "all";

  const db = getDb();
  const condicionHero = esVistaCompleta
    ? and(isNull(goals.brokerId), eq(goals.year, periodo.year), eq(goals.month, periodo.month))
    : and(eq(goals.brokerId, actor.userId), eq(goals.year, periodo.year), eq(goals.month, periodo.month));
  const condicionAnual = esVistaCompleta
    ? and(isNull(goals.brokerId), eq(goals.year, periodo.year))
    : and(eq(goals.brokerId, actor.userId), eq(goals.year, periodo.year));
  const condicionTendencias = esVistaCompleta
    ? and(isNotNull(goals.brokerId), eq(goals.year, periodo.year))
    : and(eq(goals.brokerId, actor.userId), eq(goals.year, periodo.year));

  const [heroFilas, filasBrokers, filasAnuales, filasTendencias, baselineRows, logro, alcances, equipos, proyectos, reglas] = await Promise.all([
    db
      .select({ targetDeals: goals.targetDeals, achievedDeals: goals.achievedDeals, targetAmountCents: goals.targetAmountCents, achievedAmountCents: goals.achievedAmountCents, currency: goals.currency })
      .from(goals)
      .where(condicionHero)
      .limit(1),
    db
      .select({
        userId: users.id,
        fullName: users.fullName,
        level: brokerProfiles.level,
        targetDeals: goals.targetDeals,
        achievedDeals: goals.achievedDeals,
        targetAmountCents: goals.targetAmountCents, achievedAmountCents: goals.achievedAmountCents, currency: goals.currency,
      })
      .from(brokerProfiles)
      .innerJoin(users, eq(users.id, brokerProfiles.userId))
      .leftJoin(
        goals,
        and(eq(goals.brokerId, brokerProfiles.userId), eq(goals.year, periodo.year), eq(goals.month, periodo.month)),
      )
      .where(and(eq(users.isActive, true), isNull(users.deletedAt), visibleRows(actor, scope, brokerProfiles.userId)))
      .orderBy(users.fullName),
    db
      .select({ month: goals.month, targetDeals: goals.targetDeals, achievedDeals: goals.achievedDeals })
      .from(goals)
      .where(condicionAnual),
    db
      .select({ brokerId: goals.brokerId, month: goals.month, achievedDeals: goals.achievedDeals })
      .from(goals)
      .where(condicionTendencias),
    db.select({targetDeals: goals.targetDeals, achievedDeals: goals.achievedDeals, targetAmountCents: goals.targetAmountCents, achievedAmountCents: goals.achievedAmountCents, currency: goals.currency}).from(goals).where(and(esVistaCompleta ? isNull(goals.brokerId) : eq(goals.brokerId, actor.userId), eq(goals.year, periodo.year - 1), eq(goals.month, periodo.month))).limit(1),
    logroDelPeriodo(db, periodo.year, periodo.month),
    metasDeAlcance(db, periodo.year, periodo.month),
    equiposActivos(db),
    puedeAdministrar ? proyectosParaMetas(db) : Promise.resolve([]),
    reglasDeAtribucion(db),
  ]);

  const heroMeta = heroFilas[0] ?? null;

  const filasDelAnio = filasAnuales.toSorted((a, b) => a.month - b.month);

  const tendenciasPorBroker = new Map<number, { month: number; achievedDeals: number }[]>();
  for (const fila of filasTendencias) {
    if (fila.brokerId == null) continue;
    if (!tendenciasPorBroker.has(fila.brokerId)) {
      tendenciasPorBroker.set(fila.brokerId, []);
    }
    const arr = tendenciasPorBroker.get(fila.brokerId)!;
    if (fila.month >= 1 && fila.month <= 12) {
      arr.push({ month: fila.month, achievedDeals: fila.achievedDeals });
    }
  }

  const brokers = filasBrokers.map((fila) => ({
    userId: fila.userId,
    fullName: fila.fullName,
    level: fila.level,
    targetDeals: fila.targetDeals ?? 0,
    achievedDeals: fila.achievedDeals ?? 0,
    targetAmountCents: fila.targetAmountCents ?? null, achievedAmountCents: fila.achievedAmountCents ?? 0, currency: fila.currency ?? null,
    tieneMeta: fila.targetDeals != null,
    logro: logro.porBroker.get(fila.userId) ?? [],
    tendencia: tendenciasPorBroker.get(fila.userId)?.toSorted((a, b) => a.month - b.month) ?? [],
  }));

  // Alcance `own`: solo las metas de proyecto y las del equipo propio.
  const misEquipos = new Set(equipos.filter((e) => e.miembros.some((m) => m.id === actor.userId)).map((e) => e.id));
  const metasAlcance = alcances
    .filter((m) => esVistaCompleta || m.scopeType === "project" || misEquipos.has(m.scopeId))
    .map((m) => ({ ...m, logro: (m.scopeType === "project" ? logro.porProyecto : logro.porEquipo).get(m.scopeId) ?? [] }));
  const heroLogro = esVistaCompleta ? logro.compania : logro.porBroker.get(actor.userId) ?? [];

  const opcionesPeriodo = Array.from({ length: 12 }, (_, indice) => {
    const mes = indice + 1;
    return { value: formatoPeriodo({ year: periodo.year, month: mes }), label: `${nombreMes(mes)} ${periodo.year}` };
  });

  return (
    <MetasVista
      periodo={periodo}
      fechaEvaluacion={fechaSantoDomingo(new Date())}
      opcionesPeriodo={opcionesPeriodo}
      esVistaCompleta={esVistaCompleta}
      puedeEditar={puedeEditar}
      puedeAdministrar={puedeAdministrar}
      heroLogro={heroLogro}
      metasAlcance={metasAlcance}
      equipos={esVistaCompleta ? equipos : []}
      proyectos={proyectos}
      reglas={reglas}
      heroMeta={heroMeta}
      baseline={baselineRows[0] ?? null}
      brokers={brokers}
      filasDelAnio={filasDelAnio}
    />
  );
}
