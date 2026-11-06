"use client";

import { Filter, X } from "lucide-react";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import type { CatalogosNegocios } from "@/application/pipeline/puertos";

export type ValoresFiltro = { resultado: string; brokerId: string; projectId: string; stageId: string };
export type ClaveFiltro = keyof ValoresFiltro;

const RESULTADOS = [
  { valor: "open", texto: "Activos" },
  { valor: "won", texto: "Venta cerrada" },
  { valor: "lost", texto: "No concretado" },
];

const CLASE_SELECT =
  "min-h-12 min-w-0 w-full rounded-lg border border-input-line bg-surface px-3 text-sm font-medium text-ink cursor-pointer focus-visible:outline-2 focus-visible:outline-gold-700";

type Props = {
  valores: ValoresFiltro;
  catalogos: CatalogosNegocios;
  /** El filtro por etapa solo tiene sentido en la Lista (el Tablero ya es por etapas). */
  conEtapa: boolean;
  esMovil: boolean;
  deshabilitado: boolean;
  activosAdicionales?: number;
  onCambiar: (clave: ClaveFiltro, valor: string) => void;
  onLimpiar: () => void;
};

function Campos({ valores, catalogos, conEtapa, onCambiar, conEtiqueta }: Pick<Props, "valores" | "catalogos" | "conEtapa" | "onCambiar"> & { conEtiqueta: boolean }) {
  const campo = (etiqueta: string, control: React.ReactNode) =>
    conEtiqueta ? (
      <label className="flex min-w-0 flex-col gap-1.5 text-sm font-semibold text-ink">
        <span>{etiqueta}</span>
        {control}
      </label>
    ) : (
      <>{control}</>
    );
  return (
    <>
      {campo("Resultado",
        <select aria-label="Filtrar por resultado" value={valores.resultado} onChange={(e) => onCambiar("resultado", e.target.value)} className={CLASE_SELECT}>
          <option value="">Todos los resultados</option>
          {RESULTADOS.map((r) => <option key={r.valor} value={r.valor}>{r.texto}</option>)}
        </select>)}
      {conEtapa && campo("Etapa",
        <select aria-label="Filtrar por etapa" value={valores.stageId} onChange={(e) => onCambiar("stageId", e.target.value)} className={CLASE_SELECT}>
          <option value="">Todas las etapas</option>
          {catalogos.etapas.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
        </select>)}
      {catalogos.brokers.length > 0 && campo("Broker",
        <select aria-label="Filtrar por broker" value={valores.brokerId} onChange={(e) => onCambiar("brokerId", e.target.value)} className={CLASE_SELECT}>
          <option value="">Todos los brokers</option>
          {catalogos.brokers.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>)}
      {catalogos.proyectos.length > 0 && campo("Proyecto",
        <select aria-label="Filtrar por proyecto" value={valores.projectId} onChange={(e) => onCambiar("projectId", e.target.value)} className={CLASE_SELECT}>
          <option value="">Todos los proyectos</option>
          {catalogos.proyectos.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>)}
    </>
  );
}

/** Filtros: barra en escritorio, hoja inferior en móvil. Se monta solo una de las dos. */
export function BarraFiltros(props: Props) {
  const { valores, esMovil, deshabilitado, onLimpiar } = props;
  const cantidad = Object.values(valores).filter(Boolean).length + (props.activosAdicionales ?? 0);
  const activos = cantidad > 0;
  const etiquetas: { clave: ClaveFiltro; texto: string }[] = [
    ...(valores.resultado ? [{ clave: "resultado" as const, texto: RESULTADOS.find((r) => r.valor === valores.resultado)?.texto ?? valores.resultado }] : []),
    ...(valores.stageId ? [{ clave: "stageId" as const, texto: "Etapa: " + (props.catalogos.etapas.find((e) => String(e.id) === valores.stageId)?.name ?? valores.stageId) }] : []),
    ...(valores.brokerId ? [{ clave: "brokerId" as const, texto: "Broker: " + (props.catalogos.brokers.find((b) => String(b.id) === valores.brokerId)?.name ?? valores.brokerId) }] : []),
    ...(valores.projectId ? [{ clave: "projectId" as const, texto: "Proyecto: " + (props.catalogos.proyectos.find((p) => String(p.id) === valores.projectId)?.name ?? valores.projectId) }] : []),
  ];
  const resumen = etiquetas.length > 0 && <div className="flex min-w-0 flex-wrap gap-2" aria-label="Filtros activos">{etiquetas.map(({ clave, texto }) => <button type="button" key={clave} disabled={deshabilitado} onClick={() => props.onCambiar(clave, "")} aria-label={`Quitar filtro ${texto}`} className="inline-flex min-h-12 max-w-full items-center gap-2 rounded-lg border border-gold-600/40 bg-gold-100 px-3 text-left text-[13px] font-semibold text-gold-800"><span className="min-w-0 break-words">{texto}</span><X className="size-3.5 shrink-0" aria-hidden="true" /></button>)}</div>;
  const botonLimpiar = (clase: string) => (
    <button type="button" onClick={onLimpiar} disabled={deshabilitado}
      className={`inline-flex min-h-12 cursor-pointer items-center gap-1.5 rounded-lg border border-input-line bg-surface px-3 text-sm font-medium text-ink hover:bg-navy-100 ${clase}`}>
      <X className="size-4" aria-hidden="true" />
      <span>Limpiar filtros</span>
    </button>
  );

  if (esMovil) {
    return (
      <div className="grid min-w-0 gap-2" role="group" aria-label="Filtros de negocios">
        <div className="flex flex-wrap items-center gap-2">
        <Drawer>
          <DrawerTrigger asChild>
            <button type="button" disabled={deshabilitado} className="inline-flex min-h-12 cursor-pointer items-center gap-2 rounded-lg border border-input-line bg-surface px-4 text-sm font-bold text-navy-950">
              <Filter className="size-4 text-gold-700" aria-hidden="true" />
              <span>{activos ? `Filtros · ${cantidad}` : "Filtros"}</span>
            </button>
          </DrawerTrigger>
          <DrawerContent className="max-h-[92dvh]">
            <DrawerHeader>
              <DrawerTitle>Filtros de Negocios</DrawerTitle>
              <DrawerDescription>Los resultados se actualizan al elegir cada filtro.</DrawerDescription>
            </DrawerHeader>
            <fieldset disabled={deshabilitado} className="m-0 flex min-h-0 min-w-0 flex-col gap-4 overflow-y-auto overscroll-contain border-0 p-4">
              <Campos {...props} conEtiqueta />
            </fieldset>
            <DrawerFooter>
              {activos && botonLimpiar("w-full justify-center")}
              <DrawerClose asChild>
                <button type="button" className="min-h-12 w-full cursor-pointer rounded-lg bg-gold-600 px-4 text-sm font-bold text-navy-950">Ver resultados</button>
              </DrawerClose>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
        {activos && botonLimpiar("")}
        </div>
        {resumen}
      </div>
    );
  }

  return (
    <div className="grid min-w-0 gap-3 rounded-xl border border-line bg-surface p-3" role="group" aria-label="Filtros de negocios">
      <fieldset disabled={deshabilitado} className="m-0 grid min-w-0 grid-cols-2 items-end gap-3 border-0 p-0 xl:grid-cols-4">
        <Campos {...props} conEtiqueta />
      </fieldset>
      {activos && <div className="flex min-w-0 flex-wrap items-center justify-between gap-2 border-t border-line pt-3">{resumen}{botonLimpiar("shrink-0")}</div>}
    </div>
  );
}
