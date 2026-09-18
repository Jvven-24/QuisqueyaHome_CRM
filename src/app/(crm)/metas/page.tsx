/**
 * M8 · Metas (`docs/F3_ANALISIS_Y_PLAN.md` §4.1, issue #30). Conecta `/metas`
 * a `goals`: selector de periodo real (`?periodo=AAAA-MM`), meta de la
 * compañía o del broker según el alcance, tabla por broker y el gráfico
 * anual. El JSX visual vive en `./vista.tsx` (cliente).
 *
 * Una sola consulta para la tabla: parte de `broker_profiles` (no de `goals`)
 * con `LEFT JOIN` al periodo pedido, así un broker sin fila en `goals` para
 * este mes igual aparece con su meta de perfil (`monthly_target_deals`) y
 * cero logrados — nunca se cae a "no existe". `visibleRows` sobre
 * `broker_profiles.user_id` hace que, con alcance `own`, solo vuelva la fila
 * del propio actor; `goals` no tiene `deleted_at`, por eso no se le pasa esa
 * columna a `visibleRows` en ninguna de las tres consultas de aquí.
 */

import { and, eq, isNull } from "drizzle-orm";
import { can } from "@/domain/rbac";
import { formatoPeriodo, nombreMes, parsearPeriodo } from "@/domain/metas";
import { requireActor } from "@/infrastructure/auth/actor";
import { getDb } from "@/infrastructure/db/client";
import { brokerProfiles, goals, users } from "@/infrastructure/db/schema";
import { requireScopeInPage } from "@/infrastructure/page-guard";
import { visibleRows } from "@/infrastructure/rbac-filter";
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

  const [heroFilas, filasBrokers, filasAnuales] = await Promise.all([
    db
      .select({ targetDeals: goals.targetDeals, achievedDeals: goals.achievedDeals })
      .from(goals)
      .where(condicionHero)
      .limit(1),
    db
      .select({
        userId: users.id,
        fullName: users.fullName,
        level: brokerProfiles.level,
        profileTarget: brokerProfiles.monthlyTargetDeals,
        targetDeals: goals.targetDeals,
        achievedDeals: goals.achievedDeals,
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
  ]);

  const heroMeta = heroFilas[0] ?? null;

  const anualPorMes = new Map(filasAnuales.map((fila) => [fila.month, fila]));
  const filasDelAnio = Array.from({ length: 12 }, (_, indice) => {
    const mes = indice + 1;
    const fila = anualPorMes.get(mes);
    return { month: mes, targetDeals: fila?.targetDeals ?? 0, achievedDeals: fila?.achievedDeals ?? 0 };
  });

  const brokers = filasBrokers.map((fila) => ({
    userId: fila.userId,
    fullName: fila.fullName,
    level: fila.level,
    targetDeals: fila.targetDeals ?? fila.profileTarget,
    achievedDeals: fila.achievedDeals ?? 0,
  }));

  const opcionesPeriodo = Array.from({ length: 12 }, (_, indice) => {
    const mes = indice + 1;
    return { value: formatoPeriodo({ year: periodo.year, month: mes }), label: `${nombreMes(mes)} ${periodo.year}` };
  });

  return (
    <MetasVista
      periodo={periodo}
      opcionesPeriodo={opcionesPeriodo}
      esVistaCompleta={esVistaCompleta}
      puedeEditar={puedeEditar}
      heroMeta={heroMeta}
      brokers={brokers}
      filasDelAnio={filasDelAnio}
    />
  );
}
