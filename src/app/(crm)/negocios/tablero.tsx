"use client";

import { useState } from "react";
import { ChevronRight } from "lucide-react";
import { formatearMonto } from "../_ui/formato";
import { TarjetaNegocio } from "./tarjeta-negocio";
import { LIMITE_POR_ETAPA, type ColumnaEtapa, type Etapa, type NegocioFila, type TotalDivisa } from "./logica";
import { useMediaQuery } from "./usar-entorno";

type AccionesTablero = {
  etapas: Etapa[];
  ocupado: boolean;
  sinConexion: boolean;
  puedeMover: boolean;
  onVerFicha: (negocio: NegocioFila) => void;
  onMover: (negocio: NegocioFila, etapaId: number) => void;
};

function resumenMontos(totales: TotalDivisa[]): string {
  return totales
    .filter((t) => t.amountCents !== undefined)
    .map((t) => formatearMonto(t.amountCents ?? 0, t.currency))
    .join(" · ");
}

function EtapaContenido({ columna, acciones, arrastrable }: { columna: ColumnaEtapa; acciones: AccionesTablero; arrastrable: boolean }) {
  const [verTodo, setVerTodo] = useState(false);
  const visibles = verTodo ? columna.filas : columna.filas.slice(0, LIMITE_POR_ETAPA);
  const restantes = columna.filas.length - visibles.length;
  const sinCargar = columna.total - columna.filas.length;
  return (
    <>
      {visibles.map((negocio) => (
        <TarjetaNegocio
          key={negocio.id}
          negocio={negocio}
          etapas={acciones.etapas}
          ocupado={acciones.ocupado}
          sinConexion={acciones.sinConexion}
          puedeMover={acciones.puedeMover}
          arrastrable={arrastrable && acciones.puedeMover}
          onVerFicha={() => acciones.onVerFicha(negocio)}
          onMover={(etapaId) => acciones.onMover(negocio, etapaId)}
        />
      ))}
      {restantes > 0 && (
        <button
          type="button"
          onClick={() => setVerTodo(true)}
          className="min-h-12 w-full shrink-0 cursor-pointer rounded-xl border border-gold-600/40 bg-gold-100 px-3 text-[13px] font-bold text-gold-800"
        >
          Ver {restantes} más en {columna.etapa.name}
        </button>
      )}
      {sinCargar > 0 && (
        <p className="shrink-0 px-1 text-[13px] text-ink-muted" role="status">
          Mostrando {columna.filas.length} de {columna.total}. Usa «Siguiente página» para ver el resto.
        </p>
      )}
      {columna.total === 0 && <div className="kanban-empty">Sin negocios en esta etapa</div>}
    </>
  );
}

/**
 * Tablero por etapas. Se monta UN solo diseño según el ancho:
 * escritorio = columnas; móvil = acordeón vertical sin desplazamiento anidado.
 * El valor inicial (servidor) es escritorio; en móvil se intercambia al hidratar.
 */
export function Tablero({
  columnas,
  acciones,
  alSoltar,
}: {
  columnas: ColumnaEtapa[];
  acciones: AccionesTablero;
  alSoltar: (dealId: number, etapaId: number) => void;
}) {
  const esMovil = useMediaQuery("(max-width: 767px)");
  const [abiertas, setAbiertas] = useState<Record<number, boolean>>({});
  const primeraConDatos = columnas.find((c) => c.total > 0)?.etapa.id;

  if (esMovil) {
    return (
      <div className="flex w-full flex-col gap-3">
        {columnas.map((columna) => {
          const id = columna.etapa.id;
          const expandida = abiertas[id] ?? id === primeraConDatos;
          const montos = resumenMontos(columna.totales);
          return (
            <section key={id} className="rounded-xl border border-line bg-surface-alt">
              <h3 className="m-0">
                <button
                  type="button"
                  onClick={() => setAbiertas((previo) => ({ ...previo, [id]: !expandida }))}
                  aria-expanded={expandida}
                  aria-controls={`etapa-movil-${id}`}
                  className="flex min-h-12 w-full cursor-pointer items-center justify-between gap-2 rounded-xl bg-surface px-3.5 py-2 text-left"
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <ChevronRight className={`size-4 shrink-0 text-ink-muted transition-transform ${expandida ? "rotate-90" : ""}`} aria-hidden="true" />
                    <span className="truncate text-sm font-bold text-navy-950">{columna.etapa.name}</span>
                    <span className="rounded-full border border-line bg-surface-alt px-2 text-[13px] font-bold tabular-nums text-navy-900">{columna.total}</span>
                  </span>
                  {montos && <span className="shrink-0 text-[13px] font-bold tabular-nums text-ink">{montos}</span>}
                </button>
              </h3>
              {expandida && (
                <div id={`etapa-movil-${id}`} className="flex flex-col gap-3 p-3">
                  <EtapaContenido columna={columna} acciones={acciones} arrastrable={false} />
                </div>
              )}
            </section>
          );
        })}
      </div>
    );
  }

  return (
    <div className="kanban">
      {columnas.map((columna) => {
        const montos = resumenMontos(columna.totales);
        return (
          <section
            className="kanban-column"
            key={columna.etapa.id}
            aria-label={`Etapa ${columna.etapa.name}`}
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => alSoltar(Number(event.dataTransfer.getData("dealId")), columna.etapa.id)}
          >
            <header>
              <div className="flex items-center gap-2">
                <span>{columna.etapa.name}</span>
                <span className="rounded-full border border-line bg-surface px-2 tabular-nums">{columna.total}</span>
              </div>
              {montos && <span className="text-[13px] font-bold tabular-nums text-ink">{montos}</span>}
            </header>
            <div className="kanban-column-body">
              <EtapaContenido columna={columna} acciones={acciones} arrastrable />
            </div>
          </section>
        );
      })}
    </div>
  );
}
