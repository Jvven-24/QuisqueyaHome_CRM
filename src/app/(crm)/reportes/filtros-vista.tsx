"use client";
import { useId, useState } from "react";
import type { ReportFilters } from "@/application/reportes/puertos";
import { Drawer, DrawerClose, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer";
import { analyticsCopy, reportPeriods } from "../_ui/analitica-copy";

export type FilterOption = { id: number; label: string; count?: number };
type Props = { filters: ReportFilters; periodo: string; tab: string; projects: FilterOption[]; brokers: FilterOption[]; online: boolean };

function FilterFields({ filters, periodo, projects, brokers, prefix }: Props & { prefix: string }) {
  const c = analyticsCopy.common;
  const [range, setRange] = useState(periodo);
  const [desde, setDesde] = useState(filters.desde ?? "");
  const [hasta, setHasta] = useState(filters.hasta ?? "");
  return <div className="analytics-filter-fields">
    <label htmlFor={`${prefix}-periodo`}>{c.range}<select id={`${prefix}-periodo`} name="periodo" value={range} onChange={e => { setRange(e.target.value); setDesde(""); setHasta(""); }}>{reportPeriods.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}</select></label>
    <label htmlFor={`${prefix}-desde`}>{c.from}<input id={`${prefix}-desde`} type="date" name="desde" value={desde} onChange={e => setDesde(e.target.value)} max={hasta || undefined} /></label>
    <label htmlFor={`${prefix}-hasta`}>{c.to}<input id={`${prefix}-hasta`} type="date" name="hasta" value={hasta} onChange={e => setHasta(e.target.value)} min={desde || undefined} /></label>
    <label htmlFor={`${prefix}-proyecto`}>{c.project}<select id={`${prefix}-proyecto`} name="projectId" defaultValue={filters.projectId ?? ""}>
      <option value="">{c.allProjects}</option>
      {filters.projectId && !projects.some(p => p.id === filters.projectId) && <option value={filters.projectId}>{c.selectedProject}</option>}
      {projects.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
    </select></label>
    <label htmlFor={`${prefix}-broker`}>{c.broker}<select id={`${prefix}-broker`} name="brokerId" defaultValue={filters.brokerId ?? ""}>
      <option value="">{c.allBrokers}</option>
      {filters.brokerId && !brokers.some(b => b.id === filters.brokerId) && <option value={filters.brokerId}>{c.selectedBroker}</option>}
      {brokers.map(b => <option key={b.id} value={b.id}>{b.label}</option>)}
    </select></label>
  </div>;
}

export function ReportFiltersView(props: Props) {
  const id = useId();
  const c = analyticsCopy.common;
  return <>
    <form method="get" action="/reportes" className="analytics-filter-bar">
      <input type="hidden" name="tab" value={props.tab} />
      <FilterFields {...props} prefix={`${id}-desktop`} />
      <button className="analytics-button analytics-primary" type="submit" disabled={!props.online} title={!props.online ? "Sin conexión. Conéctate para aplicar los filtros." : undefined}>{c.apply}</button>
      <a className="analytics-button" href={`/reportes?tab=${encodeURIComponent(props.tab)}`}>{c.clear}</a>
    </form>
    <div className="analytics-mobile-filters"><Drawer>
      <DrawerTrigger asChild><button className="analytics-button" type="button">{c.filters}</button></DrawerTrigger>
      <DrawerContent className="analytics-sheet">
        <DrawerHeader className="analytics-sheet-header"><DrawerTitle>{c.filters}</DrawerTitle><DrawerDescription>{c.filtered}</DrawerDescription><DrawerClose asChild><button className="analytics-button" type="button">{c.close}</button></DrawerClose></DrawerHeader>
        <form method="get" action="/reportes" className="analytics-sheet-form">
          <input type="hidden" name="tab" value={props.tab} />
          <div className="analytics-sheet-body"><FilterFields {...props} prefix={`${id}-mobile`} /><p>{c.projectsPartial}</p></div>
          <DrawerFooter className="analytics-sheet-footer"><button className="analytics-button analytics-primary" type="submit" disabled={!props.online} title={!props.online ? "Sin conexión. Conéctate para aplicar los filtros." : undefined}>{c.apply}</button><a className="analytics-button" href={`/reportes?tab=${encodeURIComponent(props.tab)}`}>{c.clear}</a></DrawerFooter>
        </form>
      </DrawerContent>
    </Drawer></div>
    <p className="analytics-filter-note">{c.projectsPartial}</p>
  </>;
}
