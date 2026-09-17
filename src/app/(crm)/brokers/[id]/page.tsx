/**
 * M7 · Brokers — perfil de un broker (`docs/F3_ANALISIS_Y_PLAN.md` §4.4,
 * issue #33). "Editar perfil" ya existe en M13 (`configuracion`); esta
 * pantalla es solo lectura, así que no hay `vista.tsx` cliente: sin estado
 * propio (ni filtros, ni formularios) separar datos de JSX en dos archivos
 * sería una capa sin motivo, no el patrón que siguen las pantallas con
 * interacción real.
 *
 * Mismo criterio que `propiedades/[slug]/page.tsx`: un id fuera del
 * `visibleRows` del actor responde 404, igual que uno inexistente — un
 * broker no debe poder confirmar por la URL que el perfil de otro existe.
 */

import { and, desc, eq, isNull } from "drizzle-orm";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BROKER_LEVEL_LABELS } from "@/domain/cierre-negocio";
import { cumplimientoPorcentaje, parsearPeriodo } from "@/domain/metas";
import { reaches } from "@/domain/rbac";
import { requireActor } from "@/infrastructure/auth/actor";
import { getDb } from "@/infrastructure/db/client";
import { brokerProfiles, contacts, deals, goals, pipelineStages, projects, roles, users } from "@/infrastructure/db/schema";
import { requireScopeInPage } from "@/infrastructure/page-guard";
import { Avatar, Badge, PageHeader } from "../../_ui/prototipo-ui";
import { Vacio } from "../../_ui/estados";

function formatearMonto(cents: number): string {
  return new Intl.NumberFormat("es-DO", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(cents / 100);
}

function nombreMes(mes: number): string {
  const fecha = new Date(Date.UTC(2000, mes - 1, 1));
  const texto = new Intl.DateTimeFormat("es-DO", { month: "long" }).format(fecha);
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return { title: `Broker · #${id} · CRM Quisqueya Home` };
}

export default async function BrokerDetallePage({ params }: { params: Promise<{ id: string }> }) {
  const actor = await requireActor();
  const scope = requireScopeInPage(actor, "brokers", "view");

  const { id: idParam } = await params;
  const brokerId = Number(idParam);
  if (!Number.isInteger(brokerId) || brokerId <= 0) notFound();

  const db = getDb();

  const [broker] = await db
    .select({
      userId: users.id,
      fullName: users.fullName,
      jobTitle: users.jobTitle,
      roleName: roles.name,
      isActive: users.isActive,
      deletedAt: users.deletedAt,
      specialty: brokerProfiles.specialty,
      level: brokerProfiles.level,
      annualSalesCents: brokerProfiles.annualSalesCents,
      monthlyTargetDeals: brokerProfiles.monthlyTargetDeals,
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
      .where(eq(goals.brokerId, brokerId))
      .orderBy(desc(goals.year), desc(goals.month))
      .limit(6),
  ]);

  const targetDelMes = metaDelMes[0]?.targetDeals ?? broker.monthlyTargetDeals;
  const achievedDelMes = metaDelMes[0]?.achievedDeals ?? 0;
  const porcentajeMeta = cumplimientoPorcentaje(achievedDelMes, targetDelMes);
  const levelLabel = BROKER_LEVEL_LABELS[broker.level];

  return (
    <>
      <PageHeader
        eyebrow="C6 · Equipo"
        title={broker.fullName}
        subtitle={broker.jobTitle ?? broker.roleName}
        action={
          <Link className="button secondary" href="/brokers">
            Volver a Brokers
          </Link>
        }
      />

      <section className="panel">
        <div className="panel-title">
          <div className="broker-card-head">
            <Avatar name={broker.fullName} />
            <div>
              <h2>{broker.fullName}</h2>
              <p>{broker.jobTitle ?? broker.roleName}</p>
            </div>
          </div>
          <Badge tone={broker.level === "top_producer" || broker.level === "top_leader" ? "gold" : "blue"}>{levelLabel}</Badge>
        </div>
        <dl className="detail-grid">
          <div>
            <dt>Especialidad</dt>
            <dd>{broker.specialty ?? "—"}</dd>
          </div>
          <div>
            <dt>Ventas del año</dt>
            <dd>{formatearMonto(broker.annualSalesCents)}</dd>
          </div>
          <div>
            <dt>Negocios activos</dt>
            <dd>{negociosAbiertos.length}</dd>
          </div>
          <div>
            <dt>Meta mensual ({nombreMes(periodo.month)})</dt>
            <dd>{porcentajeMeta === null ? "Sin meta" : `${porcentajeMeta}%`}</dd>
          </div>
        </dl>
        <div className="progress-line">
          <span style={{ width: `${Math.min(porcentajeMeta ?? 0, 100)}%` }} />
        </div>
      </section>

      <section className="panel">
        <div className="panel-title">
          <h2>Proyectos asignados</h2>
        </div>
        {proyectos.length === 0 ? (
          <Vacio titulo="Sin proyectos asignados" texto="Este broker no tiene proyectos a su cargo todavía." />
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Proyecto</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {proyectos.map((proyecto) => (
                  <tr key={proyecto.id}>
                    <td>{proyecto.name}</td>
                    <td className="table-actions">
                      <Link className="text-button" href={`/propiedades/${proyecto.slug}`}>
                        Ver proyecto
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="panel">
        <div className="panel-title">
          <h2>Negocios abiertos</h2>
        </div>
        {negociosAbiertos.length === 0 ? (
          <Vacio titulo="Sin negocios abiertos" texto="Este broker no tiene negocios activos en el embudo." />
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Contacto</th>
                  <th>Monto</th>
                  <th>Etapa</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {negociosAbiertos.map((negocio) => (
                  <tr key={negocio.dealId}>
                    <td>{negocio.contactName}</td>
                    <td>{negocio.amountCents == null ? "Por definir" : formatearMonto(negocio.amountCents)}</td>
                    <td>{negocio.stageName}</td>
                    <td className="table-actions">
                      <Link className="text-button" href={`/pipeline?deal=${negocio.dealId}`}>
                        Ver en pipeline
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="panel">
        <div className="panel-title">
          <h2>Metas de los últimos meses</h2>
        </div>
        {metasRecientes.length === 0 ? (
          <Vacio titulo="Sin metas registradas" texto="Todavía no hay metas fijadas para este broker." />
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Periodo</th>
                  <th>Meta</th>
                  <th>Logrados</th>
                  <th>Cumplimiento</th>
                </tr>
              </thead>
              <tbody>
                {metasRecientes.map((meta) => {
                  const porcentaje = cumplimientoPorcentaje(meta.achievedDeals, meta.targetDeals);
                  return (
                    <tr key={`${meta.year}-${meta.month}`}>
                      <td>
                        {nombreMes(meta.month)} {meta.year}
                      </td>
                      <td>{meta.targetDeals}</td>
                      <td>{meta.achievedDeals}</td>
                      <td>{porcentaje === null ? "Sin meta" : `${porcentaje}%`}</td>
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
}
