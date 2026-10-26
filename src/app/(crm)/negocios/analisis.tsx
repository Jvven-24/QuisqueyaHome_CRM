"use client";

import { useState } from "react";
import { ChartCard } from "@/components/ui/chart-card";
import MetricChart from "../_ui/metric-chart";
import { formatNumber } from "@/lib/formato-analitica";
import { formatearMonto } from "../_ui/formato";
import {
  antiguedadPorEtapa,
  conteoPorEtapa,
  monedasDelResumen,
  resultadosDelResumen,
  valorPonderado,
  valorPorEtapa,
  type Etapa,
  type NegocioFila,
} from "./logica";
import type { ResumenEtapaNegocio } from "@/application/pipeline/puertos";

function TablaAlternativa({ titulo, columnas, filas }: { titulo: string; columnas: [string, string]; filas: [string, string][] }) {
  return (
    <details className="mt-3 text-sm">
      <summary className="inline-flex min-h-12 cursor-pointer items-center font-semibold text-navy-900">Ver datos en tabla</summary>
      <table className="mt-2 w-full border-collapse text-[13px]">
        <caption className="sr-only">{titulo}</caption>
        <thead>
          <tr className="border-b border-line">
            <th scope="col" className="py-1.5 text-left font-bold">{columnas[0]}</th>
            <th scope="col" className="py-1.5 text-right font-bold">{columnas[1]}</th>
          </tr>
        </thead>
        <tbody>
          {filas.map(([a, b]) => (
            <tr key={a} className="border-b border-line last:border-0">
              <th scope="row" className="py-1.5 text-left font-normal">{a}</th>
              <td className="py-1.5 text-right tabular-nums">{b}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </details>
  );
}

/**
 * Análisis de Negocios. Todo sale del resumen del servidor (totales reales con
 * los filtros activos) o de las tarjetas ya cargadas. Lo que se calcula solo
 * con las tarjetas cargadas se rotula como parcial cuando hay más páginas:
 * nunca se presenta un cálculo parcial como total, ni se inventan series.
 */
export function AnalisisNegocios({
  etapas,
  resumen,
  filas,
  hayMasPaginas,
  veMontos,
  sinConexion,
}: {
  etapas: Etapa[];
  resumen: ResumenEtapaNegocio[];
  filas: NegocioFila[];
  hayMasPaginas: boolean;
  veMontos: boolean;
  sinConexion: boolean;
}) {
  const monedas = monedasDelResumen(resumen);
  const [monedaElegida, setMonedaElegida] = useState<string | null>(null);
  const moneda = monedaElegida && monedas.includes(monedaElegida) ? monedaElegida : (monedas[0] ?? "USD");
  const estado = sinConexion ? "offline" : "success";

  const conteos = conteoPorEtapa(etapas, resumen);
  const hayDatos = conteos.some((c) => c.count > 0);
  const resultados = resultadosDelResumen(resumen);
  const valores = veMontos ? valorPorEtapa(etapas, resumen, moneda) : null;
  const ponderado = valorPonderado(filas, moneda);
  const antiguedad = antiguedadPorEtapa(etapas, filas);
  const avisoParcial = hayMasPaginas ? `Calculado con los ${filas.length} negocios cargados; hay más páginas.` : undefined;
  const vacio = "Sin datos";

  if (!hayDatos) {
    return <ChartCard title="Análisis de negocios" subtitle="Conteos y valores con los filtros activos" state="empty" emptyMessage="Sin datos: no hay negocios que analizar con los filtros actuales." />;
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="md:col-span-2">
        <dl className="m-0 grid grid-cols-2 gap-3 md:grid-cols-4">
          {[
            ["Negocios", resultados.abiertos + resultados.ganados + resultados.perdidos],
            ["Activos", resultados.abiertos],
            ["Venta cerrada", resultados.ganados],
            ["No concretado", resultados.perdidos],
          ].map(([etiqueta, valor]) => (
            <div key={etiqueta} className="rounded-xl border border-line bg-surface p-3.5">
              <dt className="text-[13px] font-semibold text-ink-muted">{etiqueta}</dt>
              <dd className="m-0 font-heading text-2xl font-extrabold tabular-nums text-navy-900">{valor}</dd>
            </div>
          ))}
        </dl>
      </div>

      {monedas.length > 1 && veMontos && (
        <label className="flex items-center gap-2 text-sm font-bold text-ink md:col-span-2">
          <span>Divisa de los valores</span>
          <select value={moneda} onChange={(e) => setMonedaElegida(e.target.value)} className="min-h-12 rounded-lg border border-input-line bg-surface px-3 text-sm">
            {monedas.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
        </label>
      )}

      <ChartCard title="Negocios por etapa" subtitle="Cantidad real por etapa, con los filtros activos" state={estado}
        summary={`Negocios por etapa: ${conteos.map((c) => `${c.label} ${c.count}`).join(", ")}.`}>
        <MetricChart type="horizontal" data={conteos.map((c) => ({ id: c.id, label: c.label, total: c.count }))}
          series={[{ key: "total", label: "Negocios", color: "var(--chart-2)" }]} summary="Negocios por etapa" />
        <TablaAlternativa titulo="Negocios por etapa" columnas={["Etapa", "Negocios"]} filas={conteos.map((c) => [c.label, String(c.count)])} />
      </ChartCard>

      <ChartCard title="Cierre y pérdida" subtitle="Resultado de todos los negocios del filtro" state={estado}
        summary={`Activos ${resultados.abiertos}, venta cerrada ${resultados.ganados}, no concretado ${resultados.perdidos}.`}>
        <MetricChart type="horizontal"
          data={[
            { id: "abiertos", label: "Activos", total: resultados.abiertos },
            { id: "ganados", label: "Venta cerrada", total: resultados.ganados },
            { id: "perdidos", label: "No concretado", total: resultados.perdidos },
          ]}
          series={[{ key: "total", label: "Negocios", color: "var(--chart-4)" }]} summary="Negocios por resultado" />
        <TablaAlternativa titulo="Negocios por resultado" columnas={["Resultado", "Negocios"]}
          filas={[["Activos", String(resultados.abiertos)], ["Venta cerrada", String(resultados.ganados)], ["No concretado", String(resultados.perdidos)]]} />
      </ChartCard>

      {veMontos ? (
        <ChartCard title={`Valor por etapa (${moneda})`} subtitle="Suma de montos comerciales por etapa; cada divisa por separado"
          state={valores && valores.some((v) => v.unidades > 0) ? estado : "empty"} emptyMessage={vacio}
          summary={valores ? `Valor por etapa en ${moneda}: ${valores.map((v) => `${v.label} ${formatNumber(v.unidades)}`).join(", ")}.` : undefined}>
          {valores && (
            <>
              <MetricChart type="horizontal" data={valores.map((v) => ({ id: v.id, label: v.label, valor: v.unidades }))}
                series={[{ key: "valor", label: `Valor (${moneda})`, color: "var(--chart-1)" }]} summary={`Valor por etapa en ${moneda}`} />
              <TablaAlternativa titulo={`Valor por etapa en ${moneda}`} columnas={["Etapa", `Valor (${moneda})`]}
                filas={valores.map((v) => [v.label, formatearMonto(Math.round(v.unidades * 100), moneda)])} />
            </>
          )}
        </ChartCard>
      ) : (
        <ChartCard title="Valor por etapa" subtitle="No disponible para tu rol" state="permission" />
      )}

      {veMontos && (
        <ChartCard title={`Valor ponderado (${moneda})`} subtitle="Negocios activos: monto por su probabilidad guardada" state={ponderado.considerados > 0 ? estado : "empty"} emptyMessage={vacio}>
          <p className="m-0 font-heading text-3xl font-extrabold tabular-nums text-navy-900">
            {formatearMonto(Math.round(ponderado.unidades * 100), moneda)}
          </p>
          <p className="mt-2 text-[13px] text-ink-muted">
            {ponderado.considerados} negocios considerados
            {ponderado.sinProbabilidad > 0 && ` · ${ponderado.sinProbabilidad} sin probabilidad`}
            {ponderado.sinMonto > 0 && ` · ${ponderado.sinMonto} sin monto`}
            {avisoParcial ? ` · ${avisoParcial}` : ""}
          </p>
        </ChartCard>
      )}

      <ChartCard title="Días promedio en etapa" subtitle="Negocios activos con fecha de entrada a la etapa" state={antiguedad.some((a) => a.dias !== null) ? estado : "empty"} emptyMessage={vacio}
        summary={`Días promedio por etapa: ${antiguedad.map((a) => `${a.label} ${a.dias ?? "sin datos"}`).join(", ")}.`}>
        <MetricChart type="horizontal" data={antiguedad.map((a) => ({ id: a.id, label: a.label, dias: a.dias }))}
          series={[{ key: "dias", label: "Días", color: "var(--chart-3)" }]} summary="Días promedio por etapa" />
        <TablaAlternativa titulo="Días promedio por etapa" columnas={["Etapa", "Días (negocios con fecha / sin fecha)"]}
          filas={antiguedad.map((a) => [a.label, a.dias === null ? `Sin datos (${a.sinFecha} sin fecha)` : `${a.dias} (${a.conFecha} / ${a.sinFecha})`])} />
        {avisoParcial && <p className="mt-2 text-[13px] text-ink-muted" role="status">{avisoParcial}</p>}
      </ChartCard>
    </div>
  );
}
