import type { FilaComision } from "../_consulta";
import { agruparLotes } from "../../reservas/_finanzas/calculos";
import { FinanceLink } from "../../reservas/_componentes/kit";
import { Section } from "@/components/modulo";
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
} return <Section title="Repartos observados · datos reales"><p>Derivados del libro dentro de tu alcance. Una distribución observada no constituye una regla contractual versionada.</p>{groups.size ? <div className="w-full overflow-x-auto" tabIndex={0} role="region" aria-label="Tasas observadas"><table className="w-full min-w-[620px] border-collapse text-left text-sm"><thead className="bg-surface-alt text-ink-muted"><tr>{["Proyecto", "Moneda", "Tasa", "Broker / agencia", "Registros"].map(label => <th key={label} scope="col" className="border-b border-line px-3 py-2 font-semibold">{label}</th>)}</tr></thead><tbody>{Array.from(groups, ([id, r]) => <tr key={id} className="border-b border-line last:border-0"><td className="px-3 py-2">{r.project}</td><td className="px-3 py-2">{r.currency}</td><td className="px-3 py-2 tabular-nums">{r.rate / 100}%</td><td className="px-3 py-2 tabular-nums">{r.split / 100}% / {(10000 - r.split) / 100}%</td><td className="px-3 py-2 tabular-nums">{r.count}</td></tr>)}</tbody></table></div> : <p>Sin comisiones visibles para observar tasas.</p>}</Section>; }
export function ObservedSettlements({ rows }: {
    rows: FilaComision[];
}) { const groups = agruparLotes(rows); return <Section title="Propuestas desde comisiones aprobadas · datos reales"><p>Se agrupan por beneficiario y moneda. No son lotes persistidos ni órdenes bancarias.</p>{groups.length ? <div className="w-full overflow-x-auto" tabIndex={0} role="region" aria-label="Propuestas de liquidación"><table className="w-full min-w-[620px] border-collapse text-left text-sm"><thead className="bg-surface-alt text-ink-muted"><tr>{["Beneficiario", "Moneda", "Líneas aprobadas", "Revisión"].map(label => <th key={label} scope="col" className="border-b border-line px-3 py-2 font-semibold">{label}</th>)}</tr></thead><tbody>{groups.map(g => <tr key={g.id} className="border-b border-line last:border-0"><td className="px-3 py-2">{g.brokerName}</td><td className="px-3 py-2">{g.currency}</td><td className="px-3 py-2 tabular-nums">{g.lines.length}</td><td className="px-3 py-2"><FinanceLink href={"/comisiones/liquidaciones/" + g.id}>Revisar propuesta</FinanceLink>{g.blocked && <p>Bloqueada: falta beneficiario</p>}</td></tr>)}</tbody></table></div> : <p>No hay comisiones aprobadas en tu alcance.</p>}</Section>; }
