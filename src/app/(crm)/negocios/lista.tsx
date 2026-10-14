"use client";

import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { formatearMonto } from "../_ui/formato";
import { Badge } from "../_ui/prototipo-ui";
import { calcularAntiguedad, tipoAntiguedad } from "./antiguedad";
import type { CampoOrden, Etapa, NegocioFila } from "./logica";

type Orden = { campo: string; direccion: string };

const fecha = new Intl.DateTimeFormat("es-DO", { day: "2-digit", month: "short", year: "numeric" });
const fechaCorta = new Intl.DateTimeFormat("es-DO", { day: "2-digit", month: "short" });

function resultado(negocio: NegocioFila): { texto: string; tono: "gold" | "green" | "red" } {
  if (negocio.stageKind === "won") return { texto: negocio.operationType === "rent" ? "Alquiler cerrado" : "Venta cerrada", tono: "green" };
  if (negocio.stageKind === "lost") return { texto: "No concretado", tono: "red" };
  return { texto: "Activo", tono: "gold" };
}

function proyecto(negocio: NegocioFila): string {
  const p = negocio.proyectoPrincipal;
  return p ? `${p.projectName}${p.unitCode ? ` · ${p.unitCode}` : ""}` : "Interés general";
}

function Antiguedad({ negocio }: { negocio: NegocioFila }) {
  const tipo = tipoAntiguedad(negocio.stageChangedAt);
  return tipo === "dias"
    ? <span>{calcularAntiguedad(negocio.stageChangedAt)}</span>
    : <span className="italic text-ink-muted">{calcularAntiguedad(negocio.stageChangedAt)}</span>;
}

function Proxima({ negocio }: { negocio: NegocioFila }) {
  if (!negocio.nextActivityTitle) return <span className="text-ink-muted">Sin próxima acción</span>;
  return <span>{negocio.nextActivityTitle}{negocio.nextActivityStartsAt ? ` · ${fechaCorta.format(new Date(negocio.nextActivityStartsAt))}` : ""}</span>;
}

function Monto({ negocio }: { negocio: NegocioFila }) {
  return negocio.amountCents === undefined ? null : <>{formatearMonto(negocio.amountCents, negocio.currency)}</>;
}

function CabeceraOrdenable({ campo, etiqueta, orden, onOrden }: { campo: CampoOrden; etiqueta: string; orden: Orden; onOrden: (campo: CampoOrden) => void }) {
  const activa = orden.campo === campo;
  const Icono = !activa ? ArrowUpDown : orden.direccion === "asc" ? ArrowUp : ArrowDown;
  return (
    <th scope="col" aria-sort={activa ? (orden.direccion === "asc" ? "ascending" : "descending") : "none"} className="px-3 py-1 text-left">
      <button type="button" onClick={() => onOrden(campo)}
        className="inline-flex min-h-12 cursor-pointer items-center gap-1.5 text-[13px] font-bold text-ink hover:text-gold-700">
        <span>{etiqueta}</span>
        <Icono className="size-4" aria-hidden="true" />
        <span className="sr-only">{activa ? (orden.direccion === "asc" ? ", orden ascendente" : ", orden descendente") : ", ordenar"}</span>
      </button>
    </th>
  );
}

/**
 * Lista de negocios. En >= 768 px es una tabla semántica con encabezados
 * ordenables (orden en el servidor, estable por id); en móvil son tarjetas
 * apiladas: nunca tabla con desplazamiento horizontal.
 */
export function ListaNegocios({
  filas,
  etapas,
  orden,
  veMontos,
  esMovil,
  seleccionadoId,
  onOrden,
  onVerFicha,
}: {
  filas: NegocioFila[];
  etapas: Etapa[];
  orden: Orden;
  veMontos: boolean;
  esMovil: boolean;
  seleccionadoId: number | null;
  onOrden: (campo: CampoOrden, direccion?: "asc" | "desc") => void;
  onVerFicha: (negocio: NegocioFila) => void;
}) {
  const nombreEtapa = new Map(etapas.map((e) => [e.id, e.name]));

  if (esMovil) {
    return (
      <div className="grid gap-3">
        <label className="grid gap-1.5 text-sm font-bold text-ink">
          <span>Ordenar por</span>
          <select
            className="min-h-12 w-full rounded-lg border border-input-line bg-surface px-3 text-sm font-medium"
            value={`${orden.campo}:${orden.direccion}`}
            onChange={(e) => { const [campo, direccion] = e.target.value.split(":"); onOrden(campo as CampoOrden, direccion as "asc" | "desc"); }}
          >
            <option value="createdAt:desc">Más recientes primero</option>
            <option value="createdAt:asc">Más antiguos primero</option>
            {veMontos && <option value="amountCents:desc">Monto, de mayor a menor</option>}
            {veMontos && <option value="amountCents:asc">Monto, de menor a mayor</option>}
          </select>
        </label>
        <ul className="m-0 grid list-none gap-3 p-0">
          {filas.map((n) => {
            const r = resultado(n);
            return (
              <li key={n.id} className="grid gap-2 rounded-xl border border-line bg-surface p-3.5">
                <div className="flex items-start justify-between gap-2">
                  <button type="button" onClick={() => onVerFicha(n)} aria-label={`Abrir ficha del negocio de ${n.contactName}`}
                    className="min-h-12 min-w-12 cursor-pointer text-left text-sm font-bold text-navy-950">{n.contactName}</button>
                  <Badge tone={r.tono}>{r.texto}</Badge>
                </div>
                <dl className="m-0 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-[13px]">
                  <dt className="text-ink-muted">Etapa</dt><dd className="m-0">{nombreEtapa.get(n.stageId) ?? "—"}</dd>
                  <dt className="text-ink-muted">Proyecto</dt><dd className="m-0">{proyecto(n)}</dd>
                  {veMontos && <><dt className="text-ink-muted">Monto</dt><dd className="m-0 font-semibold tabular-nums"><Monto negocio={n} /></dd></>}
                  <dt className="text-ink-muted">Broker</dt><dd className="m-0">{n.brokerName ?? "Sin asignar"}</dd>
                  <dt className="text-ink-muted">En etapa</dt><dd className="m-0"><Antiguedad negocio={n} /></dd>
                  <dt className="text-ink-muted">Próxima</dt><dd className="m-0"><Proxima negocio={n} /></dd>
                </dl>
              </li>
            );
          })}
        </ul>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-line bg-surface">
      <table className="w-full border-collapse text-sm">
        <caption className="sr-only">Lista de negocios, {filas.length} en esta página</caption>
        <thead className="bg-surface-alt">
          <tr className="border-b border-line">
            <th scope="col" className="px-3 py-1 text-left text-[13px] font-bold text-ink">Contacto</th>
            <th scope="col" className="px-3 py-1 text-left text-[13px] font-bold text-ink">Proyecto</th>
            <th scope="col" className="px-3 py-1 text-left text-[13px] font-bold text-ink">Etapa</th>
            {veMontos && <CabeceraOrdenable campo="amountCents" etiqueta="Monto" orden={orden} onOrden={onOrden} />}
            <th scope="col" className="px-3 py-1 text-left text-[13px] font-bold text-ink">Broker</th>
            <th scope="col" className="px-3 py-1 text-left text-[13px] font-bold text-ink">En etapa</th>
            <th scope="col" className="px-3 py-1 text-left text-[13px] font-bold text-ink">Próxima acción</th>
            <CabeceraOrdenable campo="createdAt" etiqueta="Creado" orden={orden} onOrden={onOrden} />
          </tr>
        </thead>
        <tbody>
          {filas.map((n) => {
            const r = resultado(n);
            return (
              <tr key={n.id} className={`border-b border-line last:border-0 hover:bg-surface-hover ${seleccionadoId === n.id ? "bg-surface-hover" : ""}`}>
                <th scope="row" className="px-3 py-1 text-left font-normal">
                  <button type="button" onClick={() => onVerFicha(n)} aria-label={`Abrir ficha del negocio de ${n.contactName}`}
                    className="min-h-12 min-w-12 cursor-pointer text-left font-bold text-navy-950 hover:text-gold-700">{n.contactName}</button>
                </th>
                <td className="px-3 py-2 text-ink">{proyecto(n)}</td>
                <td className="px-3 py-2">
                  <div className="grid gap-1"><span className="text-ink">{nombreEtapa.get(n.stageId) ?? "—"}</span><span><Badge tone={r.tono}>{r.texto}</Badge></span></div>
                </td>
                {veMontos && <td className="px-3 py-2 font-semibold tabular-nums text-navy-900"><Monto negocio={n} /></td>}
                <td className="px-3 py-2 text-ink">{n.brokerName ?? "Sin asignar"}</td>
                <td className="px-3 py-2 text-ink"><Antiguedad negocio={n} /></td>
                <td className="px-3 py-2 text-ink"><Proxima negocio={n} /></td>
                <td className="px-3 py-2 text-ink-muted">{fecha.format(new Date(n.createdAt))}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
