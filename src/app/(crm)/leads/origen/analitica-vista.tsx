"use client";
/** Analítica de origen: filtros por fecha y modelo, tarjetas, embudo, gráficos por video/fuente/campaña y tablas completas. */
import Link from "next/link";
import { ChartCard } from "@/components/ui/chart-card";
import { Section } from "@/components/modulo/section";
import { formatoMinutos, UMBRAL_STL_MINUTOS, type Analitica, type Grupo } from "@/application/seguimiento/analitica";
import MetricChart from "../../_ui/metric-chart";

const FOCO = "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy-700";
const CAMPO = `min-h-11 rounded-lg border border-input-line bg-surface px-3 text-sm text-ink ${FOCO}`;
const BTN = `inline-flex min-h-11 items-center justify-center rounded-lg border border-input-line bg-surface px-3 text-sm font-semibold text-ink hover:bg-surface-hover ${FOCO}`;

function Tarjeta({ titulo, valor, nota }: { titulo: string; valor: string; nota: string }) {
  return (
    <div className="min-w-0 rounded-xl border border-line bg-surface p-4 shadow-sm">
      <dt className="text-sm font-semibold text-ink-muted">{titulo}</dt>
      <dd className="m-0 mt-1 font-heading text-2xl font-bold text-navy-900">{valor}</dd>
      <p className="m-0 mt-1 text-xs text-ink-muted">{nota}</p>
    </div>
  );
}

function Embudo({ etapas }: { etapas: Analitica["embudo"] }) {
  const max = Math.max(1, ...etapas.map((e) => e.valor));
  return (
    <ol className="m-0 grid list-none gap-3 p-0" aria-label="Embudo de origen">
      {etapas.map((e, i) => (
        <li key={e.etapa} className="grid gap-1">
          <div className="flex flex-wrap items-baseline justify-between gap-x-3 text-sm">
            <span className="font-semibold text-ink">{i + 1}. {e.etapa}</span>
            <span className="text-ink"><strong className="font-bold">{e.valor.toLocaleString("es-DO")}</strong> <span className="text-ink-muted">· {e.detalle}</span></span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-surface-alt" aria-hidden="true">
            <div className="h-full rounded-full" style={{ width: `${Math.max(e.valor > 0 ? 2 : 0, (e.valor / max) * 100)}%`, background: `var(--chart-${(i % 4) + 1})` }} />
          </div>
        </li>
      ))}
    </ol>
  );
}

function Tabla({ titulo, grupos, conClics }: { titulo: string; grupos: Grupo[]; conClics: boolean }) {
  const colClics = conClics && grupos.some((g) => g.clics != null);
  return (
    <div className="overflow-x-auto" tabIndex={0} role="region" aria-label={`Tabla: ${titulo}`}>
      <table className="w-full min-w-[34rem] border-collapse text-[13px]">
        <caption className="sr-only">{titulo}</caption>
        <thead>
          <tr className="border-b border-line text-left text-ink-muted">
            <th scope="col" className="py-2 pr-3 font-bold">{titulo}</th>
            {colClics && <th scope="col" className="px-2 py-2 text-right font-bold">Visitantes</th>}
            <th scope="col" className="px-2 py-2 text-right font-bold">Leads</th>
            <th scope="col" className="px-2 py-2 text-right font-bold">Contactados</th>
            <th scope="col" className="px-2 py-2 text-right font-bold">Convertidos</th>
            <th scope="col" className="px-2 py-2 text-right font-bold">Conversión</th>
            <th scope="col" className="py-2 pl-2 text-right font-bold">Tiempo a 1.er contacto</th>
          </tr>
        </thead>
        <tbody>
          {grupos.map((g) => (
            <tr key={g.clave} className="border-b border-line/70 last:border-0">
              <th scope="row" className="max-w-[16rem] py-2 pr-3 text-left font-semibold text-ink"><span className="block truncate" title={g.etiqueta}>{g.etiqueta}</span></th>
              {colClics && <td className="px-2 py-2 text-right tabular-nums">{g.visitantes ?? "—"}</td>}
              <td className="px-2 py-2 text-right tabular-nums">{g.leads}</td>
              <td className="px-2 py-2 text-right tabular-nums">{g.contactados}</td>
              <td className="px-2 py-2 text-right tabular-nums">{g.convertidos}</td>
              <td className="px-2 py-2 text-right tabular-nums">{g.leads ? `${g.conversion} %` : "—"}</td>
              <td className="py-2 pl-2 text-right tabular-nums" title={g.stlEnMetaPct != null ? `${g.stlEnMetaPct} % de los contactados, en ≤ ${UMBRAL_STL_MINUTOS} min` : undefined}>{formatoMinutos(g.stlMedianaMin)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Grafico({ titulo, subtitulo, grupos, color, conClics }: { titulo: string; subtitulo: string; grupos: Grupo[]; color: string; conClics: boolean }) {
  const top = grupos.slice(0, 8);
  return (
    <ChartCard title={titulo} subtitle={subtitulo} state={grupos.length === 0 ? "empty" : "success"} emptyMessage="Todavía no hay leads con este origen en el periodo."
      summary={`${titulo}: ${top.map((g) => `${g.etiqueta} ${g.leads} leads`).join(", ")}.`}>
      <MetricChart type="horizontal" data={top.map((g) => ({ id: g.clave, label: g.etiqueta, leads: g.leads, convertidos: g.convertidos }))}
        series={[{ key: "leads", label: "Leads", color }, { key: "convertidos", label: "Convertidos", color: "var(--chart-4)" }]} summary={titulo} />
      <div className="mt-4"><Tabla titulo={titulo.replace(/^Leads por /, "").replace(/^./, (c) => c.toUpperCase())} grupos={grupos} conClics={conClics} /></div>
    </ChartCard>
  );
}

export function AnaliticaOrigen({ datos, modelo, desde, hasta, veClics, hoy }: { datos: Analitica; modelo: "first" | "last"; desde: string; hasta: string; veClics: boolean; hoy: string }) {
  const r = datos.resumen;
  const dias = (n: number) => `?desde=${new Date(Date.parse(`${hoy}T00:00:00Z`) - (n - 1) * 86400000).toISOString().slice(0, 10)}&hasta=${hoy}&modelo=${modelo}`;
  return (
    <div className="grid min-w-0 gap-4">
      <Section>
        <form method="get" className="flex flex-wrap items-end gap-3" aria-label="Filtros de origen">
          <label className="grid gap-1 text-sm font-semibold text-ink">Desde<input type="date" name="desde" defaultValue={desde} className={CAMPO} /></label>
          <label className="grid gap-1 text-sm font-semibold text-ink">Hasta<input type="date" name="hasta" defaultValue={hasta} className={CAMPO} /></label>
          <label className="grid gap-1 text-sm font-semibold text-ink">Atribución
            <select name="modelo" defaultValue={modelo} className={CAMPO}>
              <option value="first">Primer toque (cómo nos conoció)</option>
              <option value="last">Último toque (qué lo decidió)</option>
            </select>
          </label>
          <button type="submit" className={`${BTN} bg-navy-900 text-white hover:bg-navy-800`} style={{ background: "var(--color-navy-900)", color: "#fff", borderColor: "var(--color-navy-900)" }}>Aplicar</button>
          <nav aria-label="Periodos rápidos" className="flex flex-wrap gap-2">
            {[7, 30, 90].map((n) => <Link key={n} href={dias(n)} className={BTN}>Últimos {n} días</Link>)}
          </nav>
        </form>
      </Section>

      <dl className="m-0 grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(min(100%,11.5rem),1fr))]">
        <Tarjeta titulo="Leads" valor={r.leads.toLocaleString("es-DO")} nota={r.sinAtribucion ? `${r.sinAtribucion} sin atribución por enlace` : "Todos con atribución"} />
        <Tarjeta titulo="Conversión" valor={r.leads ? `${r.conversion} %` : "—"} nota={`${r.convertidos} convertidos`} />
        <Tarjeta titulo="Primer contacto (mediana)" valor={formatoMinutos(r.stlMedianaMin)} nota={`${r.stlEnMetaPct != null ? `${r.stlEnMetaPct} % de los contactados en ≤ ${UMBRAL_STL_MINUTOS} min` : "Aún sin contactos"} · ${r.sinContactar} sin contactar`} />
        {veClics && <Tarjeta titulo="Visitantes por enlace" valor={r.visitantes.toLocaleString("es-DO")} nota={`${r.clics.toLocaleString("es-DO")} clics, sin bots`} />}
      </dl>

      <div className="grid min-w-0 items-start gap-4 xl:grid-cols-2">
        <Section title="Embudo de origen"><Embudo etapas={datos.embudo} /></Section>
        <ChartCard title="Leads por día" subtitle="Hora de República Dominicana" state={r.leads === 0 ? "empty" : "success"} emptyMessage="No hay leads en este periodo."
          summary={`Leads por día: ${datos.porDia.map((d) => `${d.dia} ${d.leads}`).join(", ")}.`}>
          <MetricChart type="area" data={datos.porDia.map((d) => ({ id: d.dia, label: d.dia.slice(5).split("-").reverse().join("/"), leads: d.leads }))} series={[{ key: "leads", label: "Leads", color: "var(--chart-1)" }]} summary="Leads por día" />
        </ChartCard>
      </div>

      <Grafico titulo="Leads por video o enlace" subtitulo="Cada enlace de seguimiento es un video o anuncio" grupos={datos.porVideo} color="var(--chart-2)" conClics={veClics} />
      <div className="grid min-w-0 items-start gap-4 xl:grid-cols-2">
        <Grafico titulo="Leads por fuente" subtitulo="UTM source y medium" grupos={datos.porFuente} color="var(--chart-1)" conClics={false} />
        <Grafico titulo="Leads por campaña" subtitulo="Campaña del enlace o del lead" grupos={datos.porCampana} color="var(--chart-3)" conClics={false} />
      </div>
    </div>
  );
}
