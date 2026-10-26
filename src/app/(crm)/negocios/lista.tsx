"use client";
import { Fragment, type ReactNode } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { formatearMonto } from "../_ui/formato";
import { Badge } from "../_ui/prototipo-ui";
import { calcularAntiguedad } from "./antiguedad";
import { columnasVisibles, ETIQUETA_COLUMNA, PREFERENCIAS_INICIALES, type ColumnaLista, type Preferencias } from "./preferencias";
import type { CampoOrden, Etapa, NegocioFila } from "./logica";
type Orden = { campo: string; direccion: string };
const fecha = new Intl.DateTimeFormat("es-DO", { day: "2-digit", month: "short", year: "numeric" });
const fechaCorta = new Intl.DateTimeFormat("es-DO", { day: "2-digit", month: "short" });
function estado(n: NegocioFila) { return n.stageKind === "won" ? (n.operationType === "rent" ? "Alquiler cerrado" : "Venta cerrada") : n.stageKind === "lost" ? "No concretado" : "Activo"; }
export function ListaNegocios({ filas, etapas, orden, veMontos, esMovil, seleccionadoId, onOrden, onVerFicha, preferencias = PREFERENCIAS_INICIALES }: {
  filas: NegocioFila[]; etapas: Etapa[]; orden: Orden; veMontos: boolean; esMovil: boolean; seleccionadoId: number | null;
  onOrden: (campo: CampoOrden, direccion?: "asc" | "desc") => void; onVerFicha: (n: NegocioFila) => void; preferencias?: Preferencias;
}) {
  const columnas = columnasVisibles(preferencias, veMontos);
  function valor(c: ColumnaLista, n: NegocioFila): ReactNode {
    switch (c) {
      case "proyecto": return n.proyectoPrincipal ? n.proyectoPrincipal.projectName + (n.proyectoPrincipal.unitCode ? " · " + n.proyectoPrincipal.unitCode : "") : "Interés general";
      case "etapa": return <div className="flex flex-col items-start gap-1"><span>{etapas.find((e) => e.id === n.stageId)?.name ?? "—"}</span>{!esMovil && <Badge tone={n.stageKind === "won" ? "green" : n.stageKind === "lost" ? "red" : "gold"}>{estado(n)}</Badge>}</div>;
      case "monto": return n.amountCents === undefined ? null : formatearMonto(n.amountCents, n.currency);
      case "probabilidad": return n.probability === null ? "Sin definir" : n.probability + "%";
      case "broker": return n.brokerName ?? "Sin asignar";
      case "origen": return n.sourceName ?? "Sin canal";
      case "antiguedad": return calcularAntiguedad(n.stageChangedAt);
      case "proxima": return !n.nextActivityTitle ? "Sin próxima acción" : <span>{n.nextActivityTitle}{n.nextActivityStartsAt ? ` · ${fechaCorta.format(new Date(n.nextActivityStartsAt))}` : ""}</span>;
      case "creado": return fecha.format(new Date(n.createdAt));
    }
  }
  const contacto = (n: NegocioFila) => <button className="inline-flex min-h-12 min-w-12 cursor-pointer items-center text-left font-bold text-navy-950 hover:text-gold-700" type="button" onClick={() => onVerFicha(n)} aria-label={`Abrir ficha del negocio de ${n.contactName}`}>{n.contactName}</button>;
  if (esMovil) {
    return <div className="grid gap-3"><label className="grid gap-2 text-sm font-bold">Ordenar por<select className="min-h-12 rounded-lg border border-line bg-surface px-3" value={`${orden.campo}:${orden.direccion}`} onChange={(e) => { const [c, d] = e.target.value.split(":"); onOrden(c as CampoOrden, d as "asc" | "desc"); }}><option value="createdAt:desc">Más recientes primero</option><option value="createdAt:asc">Más antiguos primero</option>{veMontos && <option value="amountCents:desc">Monto, de mayor a menor</option>}{veMontos && <option value="amountCents:asc">Monto, de menor a mayor</option>}</select></label><ul className="m-0 grid list-none gap-3 p-0">{filas.map((n) => <li className="rounded-xl border border-line bg-surface p-4" key={n.id}><div className="flex items-center justify-between gap-2">{contacto(n)}<Badge tone={n.stageKind === "won" ? "green" : n.stageKind === "lost" ? "red" : "gold"}>{estado(n)}</Badge></div><dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-2 text-[13px]">{columnas.map((c) => <Fragment key={c}><dt className="text-ink-muted">{ETIQUETA_COLUMNA[c]}</dt><dd className="m-0 break-words">{valor(c, n)}</dd></Fragment>)}</dl></li>)}</ul></div>;
  }
  return <div className="max-w-full overflow-x-auto rounded-xl border border-line bg-surface" tabIndex={0} role="region" aria-label="Lista configurable de negocios"><table className="w-full border-collapse text-sm"><caption className="sr-only">Lista de negocios, {filas.length} en esta página</caption><thead className="border-b border-line bg-surface-alt"><tr><th scope="col" className="px-4 py-2 text-left">Contacto</th>{columnas.map((c) => { const campo = c === "monto" ? "amountCents" : c === "creado" ? "createdAt" : null; const activa = campo === orden.campo; const Icono = activa ? orden.direccion === "asc" ? ArrowUp : ArrowDown : ArrowUpDown; return <th key={c} scope="col" className="px-3 py-2 text-left" aria-sort={campo ? activa ? orden.direccion === "asc" ? "ascending" : "descending" : "none" : undefined}>{campo ? <button className="inline-flex min-h-12 items-center gap-2 font-bold" type="button" onClick={() => onOrden(campo)}>{ETIQUETA_COLUMNA[c]}<Icono className="size-4" aria-hidden="true" /></button> : ETIQUETA_COLUMNA[c]}</th>; })}</tr></thead><tbody className="divide-y divide-line">{filas.map((n) => <tr key={n.id} className={seleccionadoId === n.id ? "bg-gold-50" : "hover:bg-surface-hover"}><th scope="row" className="px-4 text-left">{contacto(n)}</th>{columnas.map((c) => <td key={c} className="px-3 py-3 text-ink">{valor(c, n)}</td>)}</tr>)}</tbody></table></div>;
}
