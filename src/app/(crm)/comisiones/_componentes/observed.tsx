import type { FilaComision } from "../_consulta";
import { agruparLotes } from "../../reservas/_finanzas/calculos";
import { FinanceLink } from "../../reservas/_componentes/kit";
import s from "../../reservas/_componentes/finanzas.module.css";
export function ObservedRules({ rows }: {
    rows: FilaComision[];
}) { const groups = new Map<string, {
    project: string;
    currency: string;
    rate: number;
    split: number;
    count: number;
}>(); for (const r of rows) {
    const id = [r.projectName, r.currency, r.commissionBasisPoints, r.brokerShareBasisPoints].join("|");
    const group = groups.get(id) ?? { project: r.projectName ?? "Sin proyecto", currency: r.currency, rate: r.commissionBasisPoints, split: r.brokerShareBasisPoints, count: 0 };
    group.count++;
    groups.set(id, group);
} return <section className={s.panel}><h2>Repartos observados · datos reales</h2><p>Derivados del libro dentro de tu alcance. Una distribución observada no constituye una regla contractual versionada.</p>{groups.size ? <div className={s.tableWrap} tabIndex={0} role="region" aria-label="Tasas observadas"><table className={s.table}><thead><tr><th>Proyecto</th><th>Moneda</th><th>Tasa</th><th>Broker / agencia</th><th>Registros</th></tr></thead><tbody>{Array.from(groups, ([id, r]) => <tr key={id}><td>{r.project}</td><td>{r.currency}</td><td>{r.rate / 100}%</td><td>{r.split / 100}% / {(10000 - r.split) / 100}%</td><td>{r.count}</td></tr>)}</tbody></table></div> : <p>Sin comisiones visibles para observar tasas.</p>}</section>; }
export function ObservedSettlements({ rows }: {
    rows: FilaComision[];
}) { const groups = agruparLotes(rows); return <section className={s.panel}><h2>Propuestas desde comisiones aprobadas · datos reales</h2><p>Se agrupan por beneficiario y moneda. No son lotes persistidos ni órdenes bancarias.</p>{groups.length ? <div className={s.tableWrap} tabIndex={0} role="region" aria-label="Propuestas de liquidación"><table className={s.table}><thead><tr><th>Beneficiario</th><th>Moneda</th><th>Líneas aprobadas</th><th>Revisión</th></tr></thead><tbody>{groups.map(g => <tr key={g.id}><td>{g.brokerName}</td><td>{g.currency}</td><td>{g.lines.length}</td><td><FinanceLink href={"/comisiones/liquidaciones/" + g.id}>Revisar propuesta</FinanceLink>{g.blocked && <p>Bloqueada: falta beneficiario</p>}</td></tr>)}</tbody></table></div> : <p>No hay comisiones aprobadas en tu alcance.</p>}</section>; }
