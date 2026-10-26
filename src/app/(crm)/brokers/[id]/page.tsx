/**
 * M7 · Brokers — Ficha ejecutiva individual de un asesor comercial.
 * Cumple: Controles >= 44-48px, texto >= 13px, foco gold-700, sin alerts nativos, regla multimoneda M22.
 * Prohibida la palabra prohibida en texto visible.
 */

import { and, desc, eq, isNull } from "drizzle-orm";
import { cache } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BROKER_LEVEL_LABELS } from "@/domain/cierre-negocio";
import { cumplimientoPorcentaje, nombreMes, parsearPeriodo } from "@/domain/metas";
import { reaches } from "@/domain/rbac";
import { requireActor } from "@/infrastructure/auth/actor";
import { getDb } from "@/infrastructure/db/client";
import { brokerProfiles, contacts, deals, goals, pipelineStages, projects, roles, users } from "@/infrastructure/db/schema";
import { requireScopeInPage } from "@/infrastructure/page-guard";
import { formatearMonto } from "../../_ui/formato";
import { Avatar, Badge, PageHeader } from "../../_ui/prototipo-ui";
import { Vacio } from "../../_ui/estados";
import {
  ArrowLeft,
  Briefcase,
  Building2,
  Calendar,
  CheckCircle2,
  DollarSign,
  ExternalLink,
  Mail,
  Sparkles,
  TrendingUp,
} from "lucide-react";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return { title: `Ficha de Asesor · #${id} · CRM Quisqueya Home` };
}

const resolverFicha = cache(async (idParam: string) => {
  const actor = await requireActor();
  const scope = requireScopeInPage(actor, "brokers", "view");

  const brokerId = Number(idParam);
  if (!/^\d{1,10}$/.test(idParam) || !Number.isSafeInteger(brokerId) || brokerId <= 0 || brokerId > 2147483647) notFound();

  const db = getDb();

  const [broker] = await db
    .select({
      userId: users.id,
      fullName: users.fullName,
      email: users.email,
      jobTitle: users.jobTitle,
      roleName: roles.name,
      isActive: users.isActive,
      deletedAt: users.deletedAt,
      specialty: brokerProfiles.specialty,
      level: brokerProfiles.level,
      annualSalesCents: brokerProfiles.annualSalesCents,
    })
    .from(brokerProfiles)
    .innerJoin(users, eq(users.id, brokerProfiles.userId))
    .innerJoin(roles, eq(roles.id, users.roleId))
    .where(eq(brokerProfiles.userId, brokerId))
    .limit(1);

  if (!broker || !broker.isActive || broker.deletedAt || !reaches(actor, scope, broker.userId)) notFound();

  const periodo = parsearPeriodo(undefined, new Date());

  const [proyectos, negociosAbiertos, metaDelMes, metasRecientes] = await Promise.all([
    db
      .select({ id: projects.id, name: projects.name, slug: projects.slug })
      .from(projects)
      .where(and(eq(projects.brokerId, brokerId), isNull(projects.deletedAt)))
      .orderBy(projects.name),
    db
      .select({
        dealId: deals.id,
        contactName: contacts.fullName,
        amountCents: deals.amountCents,
        currency: deals.currency,
        stageName: pipelineStages.name,
      })
      .from(deals)
      .innerJoin(contacts, eq(contacts.id, deals.contactId))
      .innerJoin(pipelineStages, eq(pipelineStages.id, deals.stageId))
      .where(and(eq(deals.brokerId, brokerId), isNull(deals.deletedAt), eq(pipelineStages.kind, "open")))
      .orderBy(desc(deals.createdAt)),
    db
      .select({ targetDeals: goals.targetDeals, achievedDeals: goals.achievedDeals })
      .from(goals)
      .where(and(eq(goals.brokerId, brokerId), eq(goals.year, periodo.year), eq(goals.month, periodo.month)))
      .limit(1),
    db
      .select({ year: goals.year, month: goals.month, targetDeals: goals.targetDeals, achievedDeals: goals.achievedDeals })
      .from(goals)
      .where(and(eq(goals.brokerId, brokerId)))
      .orderBy(desc(goals.year), desc(goals.month))
      .limit(6),
  ]);

  const targetDelMes = metaDelMes[0]?.targetDeals ?? 0;
  const achievedDelMes = metaDelMes[0]?.achievedDeals ?? 0;
  const porcentajeMeta = cumplimientoPorcentaje(achievedDelMes, targetDelMes);
  const levelLabel = BROKER_LEVEL_LABELS[broker.level];
  const esElite = broker.level === "top_producer" || broker.level === "top_leader";

  return (
    <>
      <PageHeader
        eyebrow="Equipo y Asesoría"
        title={broker.fullName}
        subtitle={`Ficha ejecutiva integral: cartera activa, volumen anual acumulado y rendimiento histórico.`}
        action={
          <Link
            className="inline-flex items-center justify-center gap-2 min-h-[46px] px-5 rounded-xl border border-line bg-surface hover:bg-surface-alt text-navy-950 text-[13.5px] font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-gold-700 shadow-2xs cursor-pointer"
            href="/brokers"
          >
            <ArrowLeft className="size-4" />
            <span>Volver a Brokers</span>
          </Link>
        }
      />

      {/* Ficha Ejecutiva del Asesor */}
      <section className="bg-surface border border-line/80 rounded-2xl p-6 md:p-8 shadow-xs mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-line">
          <div className="flex items-center gap-5">
            <div className="relative">
              <Avatar name={broker.fullName} />
              {esElite && (
                <span
                  className="absolute -bottom-1 -right-1 size-6 rounded-full bg-gold-600 text-white flex items-center justify-center border-2 border-white shadow-2xs"
                  title="Asesor Élite"
                >
                  <Sparkles className="size-3" />
                </span>
              )}
            </div>
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="font-heading font-black text-2xl md:text-3xl text-navy-950 m-0">
                  {broker.fullName}
                </h1>
                <Badge tone={esElite ? "gold" : "blue"}>{levelLabel}</Badge>
              </div>
              <p className="text-[14px] text-ink-muted mt-1 mb-2 font-medium">
                {broker.jobTitle ?? broker.roleName}
              </p>
              {broker.email && (
                <p className="text-[13px] text-ink-muted/90 flex items-center gap-1.5 m-0">
                  <Mail className="size-3.5 text-gold-600" />
                  <span>{broker.email}</span>
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="bg-surface-alt border border-line px-4 py-2.5 rounded-xl">
              <span className="text-[13px] text-ink-muted block font-semibold uppercase">Especialidad</span>
              <strong className="text-[14px] text-navy-950 font-bold block">{broker.specialty ?? "Inmobiliaria General"}</strong>
            </div>
          </div>
        </div>

        {/* 4 KPIs Clave del Asesor */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          <div className="bg-surface-alt/70 border border-line rounded-xl p-4">
            <span className="text-[13px] font-semibold text-ink-muted uppercase tracking-wider flex items-center gap-1.5">
              <DollarSign className="size-4 text-gold-600" />
              Volumen Anual (USD)
            </span>
            <strong className="block font-heading font-black text-2xl text-navy-950 mt-1 tabular-nums">
              {formatearMonto(broker.annualSalesCents, "USD")}
            </strong>
            <small className="text-[13px] text-ink-muted mt-0.5 block">Ventas acumuladas del año</small>
          </div>

          <div className="bg-surface-alt/70 border border-line rounded-xl p-4">
            <span className="text-[13px] font-semibold text-ink-muted uppercase tracking-wider flex items-center gap-1.5">
              <Briefcase className="size-4 text-blue-600" />
              Cartera Activa
            </span>
            <strong className="block font-heading font-black text-2xl text-navy-950 mt-1 tabular-nums">
              {negociosAbiertos.length}
            </strong>
            <small className="text-[13px] text-ink-muted mt-0.5 block">Negocios en curso</small>
          </div>

          <div className="bg-surface-alt/70 border border-line rounded-xl p-4">
            <span className="text-[13px] font-semibold text-ink-muted uppercase tracking-wider flex items-center gap-1.5">
              <TrendingUp className="size-4 text-emerald-600" />
              Meta {nombreMes(periodo.month)}
            </span>
            <strong className="block font-heading font-black text-2xl text-navy-950 mt-1 tabular-nums">
              {porcentajeMeta === null ? "—" : `${porcentajeMeta}%`}
            </strong>
            <small className="text-[13px] text-ink-muted mt-0.5 block tabular-nums">
              {achievedDelMes} de {targetDelMes} negocios logrados
            </small>
          </div>

          <div className="bg-surface-alt/70 border border-line rounded-xl p-4">
            <span className="text-[13px] font-semibold text-ink-muted uppercase tracking-wider flex items-center gap-1.5">
              <Building2 className="size-4 text-navy-700" />
              Proyectos Asignados
            </span>
            <strong className="block font-heading font-black text-2xl text-navy-950 mt-1 tabular-nums">
              {proyectos.length}
            </strong>
            <small className="text-[13px] text-ink-muted mt-0.5 block">Desarrollos bajo gestión</small>
          </div>
        </div>

        {/* Barra de Progreso del Mes */}
        <div className="mt-6 pt-5 border-t border-line">
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-[13px] text-ink-muted mb-2">
            <span className="font-semibold text-navy-900">Cumplimiento de Meta Mensual ({nombreMes(periodo.month)} {periodo.year})</span>
            <span className="font-bold tabular-nums text-navy-950">
              {porcentajeMeta === null ? "Sin meta establecida" : `${porcentajeMeta}% cumplido`}
            </span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden p-0.5 border border-line">
            <div
              className="h-full rounded-full bg-gradient-to-r from-gold-600 to-amber-400 transition-all duration-300"
              style={{ width: `${Math.min(porcentajeMeta ?? 0, 100)}%` }}
            />
          </div>
        </div>
      </section>

      {/* Sección 1: Negocios Abiertos en Cartera */}
      <section className="bg-surface border border-line/80 rounded-2xl p-6 md:p-7 shadow-xs mb-8">
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-line">
          <div>
            <h2 className="font-heading font-bold text-xl text-navy-950 m-0">Cartera de Negocios en Gestión</h2>
            <p className="text-[13.5px] text-ink-muted m-0 mt-0.5">
              Oportunidades activas gestionadas directamente por {broker.fullName}.
            </p>
          </div>
          <span className="px-3 py-1 rounded-full text-[13px] font-bold bg-blue-50 text-blue-700 border border-blue-200 tabular-nums">
            {negociosAbiertos.length} activos
          </span>
        </div>

        {negociosAbiertos.length === 0 ? (
          <Vacio titulo="Sin negocios abiertos" texto="Este broker no tiene negocios activos en gestión actualmente." />
        ) : (
          <div tabIndex={0} role="region" aria-label="Tabla desplazable horizontalmente" className="max-w-full overflow-x-auto border border-line rounded-xl">
            <table className="w-full min-w-[620px] text-left border-collapse">
              <thead>
                <tr className="bg-surface-alt/70 border-b border-line text-[13px] font-bold text-ink-muted uppercase tracking-wider">
                  <th className="p-4">Contacto / Cliente</th>
                  <th className="p-4 text-right">Monto Estimado</th>
                  <th className="p-4">Etapa Actual</th>
                  <th className="p-4 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {negociosAbiertos.map((negocio) => (
                  <tr key={negocio.dealId} className="hover:bg-surface-alt/40 transition-colors">
                    <td className="p-4 font-bold text-[13.5px] text-navy-950">
                      {negocio.contactName}
                    </td>
                    <td className="p-4 text-right font-black text-[13.5px] text-navy-950 tabular-nums">
                      {negocio.amountCents == null
                        ? "Por definir"
                        : formatearMonto(negocio.amountCents, negocio.currency)}
                    </td>
                    <td className="p-4">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[13px] font-semibold bg-navy-50 text-navy-800 border border-navy-200">
                        {negocio.stageName}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <Link
                        className="inline-flex items-center gap-1.5 min-h-[44px] px-3.5 rounded-xl text-[13px] font-semibold text-gold-700 hover:text-gold-800 hover:bg-gold-50 transition-colors focus:outline-none focus:ring-2 focus:ring-gold-700"
                        href={`/negocios?deal=${negocio.dealId}`}
                      >
                        <span>Ver en negocios</span>
                        <ExternalLink className="size-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Sección 2: Proyectos Asignados */}
      <section className="bg-surface border border-line/80 rounded-2xl p-6 md:p-7 shadow-xs mb-8">
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-line">
          <div>
            <h2 className="font-heading font-bold text-xl text-navy-950 m-0">Proyectos y Desarrollos Asignados</h2>
            <p className="text-[13.5px] text-ink-muted m-0 mt-0.5">
              Complejos inmobiliarios bajo la cartera de comercialización del asesor.
            </p>
          </div>
          <span className="px-3 py-1 rounded-full text-[13px] font-bold bg-navy-50 text-navy-800 border border-navy-200 tabular-nums">
            {proyectos.length} proyectos
          </span>
        </div>

        {proyectos.length === 0 ? (
          <Vacio titulo="Sin proyectos asignados" texto="Este broker no tiene proyectos inmobiliarios asignados todavía." />
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-4">
            {proyectos.map((proyecto) => (
              <div
                key={proyecto.id}
                className="bg-surface-alt/50 border border-line rounded-xl p-4 flex flex-wrap items-center justify-between gap-3 hover:border-gold-500/50 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="size-10 rounded-xl bg-navy-100 flex items-center justify-center text-navy-800 shrink-0">
                    <Building2 className="size-5" />
                  </div>
                  <strong className="text-[14px] font-bold text-navy-950 break-words">{proyecto.name}</strong>
                </div>
                <Link
                  className="inline-flex items-center justify-center min-h-[44px] px-3.5 rounded-xl text-[13px] font-semibold text-gold-700 hover:text-gold-800 hover:bg-gold-50 transition-colors shrink-0 focus:outline-none focus:ring-2 focus:ring-gold-700"
                  href={`/propiedades/${proyecto.slug}`}
                >
                  <span>Ver ficha</span>
                  <ExternalLink className="size-3.5 ml-1" />
                </Link>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Sección 3: Histórico de Metas */}
      <section className="bg-surface border border-line/80 rounded-2xl p-6 md:p-7 shadow-xs">
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-line">
          <div>
            <h2 className="font-heading font-bold text-xl text-navy-950 m-0">Histórico de Metas Mensuales</h2>
            <p className="text-[13.5px] text-ink-muted m-0 mt-0.5">
              Registro de objetivos y cierres logrados en los periodos recientes.
            </p>
          </div>
          <Calendar className="size-5 text-ink-muted" />
        </div>

        {metasRecientes.length === 0 ? (
          <Vacio titulo="Sin metas registradas" texto="Todavía no hay historial de metas fijadas para este broker." />
        ) : (
          <div tabIndex={0} role="region" aria-label="Tabla desplazable horizontalmente" className="max-w-full overflow-x-auto border border-line rounded-xl">
            <table className="w-full min-w-[620px] text-left border-collapse">
              <thead>
                <tr className="bg-surface-alt/70 border-b border-line text-[13px] font-bold text-ink-muted uppercase tracking-wider">
                  <th className="p-4">Periodo</th>
                  <th className="p-4 text-center">Meta Asignada</th>
                  <th className="p-4 text-center">Cierres Logrados</th>
                  <th className="p-4">Cumplimiento</th>
                  <th className="p-4 text-right">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {metasRecientes.map((meta) => {
                  const porcentaje = cumplimientoPorcentaje(meta.achievedDeals, meta.targetDeals);
                  const cumplida = meta.targetDeals > 0 && meta.achievedDeals >= meta.targetDeals;

                  return (
                    <tr key={`${meta.year}-${meta.month}`} className="hover:bg-surface-alt/40 transition-colors">
                      <td className="p-4 font-bold text-[13.5px] text-navy-950">
                        {nombreMes(meta.month)} {meta.year}
                      </td>
                      <td className="p-4 text-center font-bold text-[13.5px] text-navy-950 tabular-nums">
                        {meta.targetDeals}
                      </td>
                      <td className="p-4 text-center font-black text-[13.5px] text-navy-950 tabular-nums">
                        {meta.achievedDeals}
                      </td>
                      <td className="p-4">
                        {porcentaje === null ? (
                          <span className="text-[13px] text-ink-muted">Sin meta fijada</span>
                        ) : (
                          <div className="flex items-center gap-3">
                            <div className="w-28 bg-slate-100 rounded-full h-2 overflow-hidden border border-line">
                              <div
                                className={`h-full rounded-full ${
                                  cumplida
                                    ? "bg-gradient-to-r from-emerald-500 to-teal-400"
                                    : "bg-gradient-to-r from-gold-600 to-amber-400"
                                }`}
                                style={{ width: `${Math.min(porcentaje, 100)}%` }}
                              />
                            </div>
                            <span className="text-[13px] font-bold tabular-nums text-navy-950">{porcentaje}%</span>
                          </div>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        {cumplida ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[13px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="size-3.5" />
                            Cumplida
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[13px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                            En progreso
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
});

// No permitir que loading emita un HTTP 200 antes de validar existencia y alcance.
export async function generateViewport({ params }: { params: Promise<{ id: string }> }) {
  await resolverFicha((await params).id);
  return {};
}

export default async function BrokerDetallePage({ params }: { params: Promise<{ id: string }> }) {
  return resolverFicha((await params).id);
}
