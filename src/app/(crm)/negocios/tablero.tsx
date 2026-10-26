"use client";

import { useMemo, useState, type HTMLAttributes, type ReactNode } from "react";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  closestCorners,
  defaultDropAnimationSideEffects,
  pointerWithin,
  useDroppable,
  useSensor,
  useSensors,
  type Announcements,
  type CollisionDetection,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
  type DropAnimation,
  type UniqueIdentifier,
} from "@dnd-kit/core";
import { SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { MotionConfig, motion, useReducedMotion } from "motion/react";
import { ChevronRight, GripVertical } from "lucide-react";
import { formatearMonto } from "../_ui/formato";
import { TarjetaNegocio } from "./tarjeta-negocio";
import { moverEnLista, previsualizarArrastre, type Arrastre, type MovimientoPendiente } from "./kanban-estado";
import { LIMITE_POR_ETAPA, type ColumnaEtapa, type Etapa, type NegocioFila, type TotalDivisa } from "./logica";
import { PREFERENCIAS_INICIALES, type CampoTarjeta } from "./preferencias";
import { useMediaQuery } from "./usar-entorno";

export type AccionesTablero = {
  etapas: Etapa[];
  ocupado: boolean;
  sinConexion: boolean;
  puedeMover: boolean;
  onVerFicha: (negocio: NegocioFila) => void;
  onMover: (negocio: NegocioFila, etapaId: number) => void;
};

type Presentacion = { campos: Record<CampoTarjeta, boolean>; compacta: boolean };

/* ---------------------------- identificadores ---------------------------- */

const idTarjeta = (id: number) => `n-${id}`;
const idEtapa = (id: number) => `e-${id}`;
function leerId(valor: UniqueIdentifier | null | undefined): { tipo: "n" | "e"; id: number } | null {
  const m = /^([ne])-(\d+)$/.exec(String(valor ?? ""));
  return m ? { tipo: m[1] as "n" | "e", id: Number(m[2]) } : null;
}

/** Prefiere la tarjeta bajo el puntero; si no hay, la columna; con teclado, la esquina más cercana. */
const deteccion: CollisionDetection = (args) => {
  const dentro = pointerWithin(args);
  if (dentro.length > 0) {
    const tarjetas = dentro.filter((c) => leerId(c.id)?.tipo === "n");
    return tarjetas.length > 0 ? tarjetas : dentro;
  }
  return closestCorners(args);
};

/** Ningún arrastre empieza desde un botón, enlace o menú de la tarjeta (sí desde el asa). */
function filtrarEventos(eventos: Record<string, ((e: never) => void) | undefined> | undefined): HTMLAttributes<HTMLElement> {
  const out: Record<string, (e: Event) => void> = {};
  for (const [nombre, manejador] of Object.entries(eventos ?? {})) {
    if (!manejador || nombre === "onKeyDown") continue;
    out[nombre] = (e: Event) => {
      if ((e.target as HTMLElement | null)?.closest("[data-sin-arrastre]")) return;
      (manejador as (e: Event) => void)(e);
    };
  }
  return out as HTMLAttributes<HTMLElement>;
}

function resumenMontos(totales: TotalDivisa[]): string {
  return totales
    .filter((t) => t.amountCents !== undefined)
    .map((t) => formatearMonto(t.amountCents ?? 0, t.currency))
    .join(" · ");
}

function puntoEtapa(kind: Etapa["kind"]): string {
  return kind === "won" ? "bg-emerald-500" : kind === "lost" ? "bg-slate-400" : "bg-gold-500";
}

/* ------------------------------ tarjeta ordenable ------------------------------ */

function TarjetaOrdenable({ negocio, acciones, presentacion, pendiente }: {
  negocio: NegocioFila;
  acciones: AccionesTablero;
  presentacion: Presentacion;
  pendiente: MovimientoPendiente | undefined;
}) {
  const arrastrable = acciones.puedeMover && negocio.stageKind === "open" && !pendiente && !acciones.ocupado && !acciones.sinConexion;
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({
    id: idTarjeta(negocio.id),
    disabled: !arrastrable,
    data: { tipo: "negocio" },
  });
  const reducido = useReducedMotion();
  const asa = arrastrable ? (
    <button
      type="button"
      ref={setActivatorNodeRef}
      {...attributes}
      onKeyDown={(e) => listeners?.onKeyDown?.(e)}
      aria-roledescription="negocio arrastrable"
      aria-label={`Arrastrar el negocio de ${negocio.contactName}`}
      className="-ml-1.5 inline-flex min-h-12 w-8 shrink-0 cursor-grab touch-none items-center justify-center rounded-md text-ink-muted hover:bg-navy-100 hover:text-navy-950 focus-visible:outline-2 focus-visible:outline-gold-700 active:cursor-grabbing"
    >
      <GripVertical className="size-4" aria-hidden="true" />
    </button>
  ) : null;

  return (
    <motion.div
      initial={pendiente && !reducido ? { opacity: 0, y: -8 } : false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: [0.2, 0.8, 0.2, 1] }}
      className="shrink-0"
    >
      <TarjetaNegocio
        negocio={negocio}
        etapas={acciones.etapas}
        ocupado={acciones.ocupado}
        sinConexion={acciones.sinConexion}
        puedeMover={acciones.puedeMover}
        campos={presentacion.campos}
        compacta={presentacion.compacta}
        pendiente={pendiente?.estado}
        arrastre={{
          ref: setNodeRef,
          style: {
            transform: CSS.Translate.toString(transform),
            transition,
            cursor: arrastrable ? undefined : "default",
            WebkitTouchCallout: "none",
          },
          eventos: arrastrable ? { ...filtrarEventos(listeners as never), className: undefined } : undefined,
          asa,
          fantasma: isDragging,
        }}
        onVerFicha={() => acciones.onVerFicha(negocio)}
        onMover={(etapaId) => acciones.onMover(negocio, etapaId)}
      />
    </motion.div>
  );
}

/* ------------------------------ contenido de una etapa ------------------------------ */

function EtapaContenido({ columna, acciones, presentacion, pendientes, activo }: {
  columna: ColumnaEtapa;
  acciones: AccionesTablero;
  presentacion: Presentacion;
  pendientes: Record<number, MovimientoPendiente>;
  activo: number | null;
}) {
  const [verTodo, setVerTodo] = useState(false);
  const visibles = verTodo ? columna.filas : columna.filas.slice(0, LIMITE_POR_ETAPA);
  // La tarjeta arrastrada siempre se monta, aunque caiga más allá del límite de «Ver más».
  const conActivo = activo !== null && !visibles.some((f) => f.id === activo) && columna.filas.some((f) => f.id === activo)
    ? [...visibles, columna.filas.find((f) => f.id === activo)!]
    : visibles;
  const restantes = columna.filas.length - visibles.length;
  const sinCargar = columna.total - columna.filas.length;
  return (
    <SortableContext items={conActivo.map((f) => idTarjeta(f.id))} strategy={verticalListSortingStrategy}>
      {conActivo.map((negocio) => (
        <TarjetaOrdenable key={negocio.id} negocio={negocio} acciones={acciones} presentacion={presentacion} pendiente={pendientes[negocio.id]} />
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
      {columna.filas.length === 0 && <div className="kanban-empty">{activo !== null ? "Suelta aquí" : "Sin negocios en esta etapa"}</div>}
    </SortableContext>
  );
}

function AvisoDestino({ etapa }: { etapa: Etapa }) {
  const texto = etapa.kind === "won" ? "Al soltar se pedirá la unidad y el monto del cierre." : etapa.kind === "lost" ? "Al soltar se pedirá el motivo y un comentario." : `Soltar en ${etapa.name}`;
  return <p className="m-0 rounded-md bg-gold-100 px-2 py-1 text-[13px] font-semibold text-gold-900" aria-hidden="true">{texto}</p>;
}

function Contador({ valor }: { valor: number }) {
  return (
    <motion.span
      key={valor}
      initial={{ scale: 1.2 }}
      animate={{ scale: 1 }}
      transition={{ duration: 0.18 }}
      className="inline-block rounded-full border border-line bg-surface-alt px-2.5 py-0.5 text-[13px] font-extrabold tabular-nums text-navy-950 shadow-2xs"
    >
      {valor}
    </motion.span>
  );
}

function ColumnaEscritorio({ columna, destacada, children }: { columna: ColumnaEtapa; destacada: boolean; children: ReactNode }) {
  const { setNodeRef } = useDroppable({ id: idEtapa(columna.etapa.id), data: { tipo: "etapa" } });
  const montos = resumenMontos(columna.totales);
  return (
    <section ref={setNodeRef} className={`kanban-column ${destacada ? "drag-over" : ""}`} aria-label={`Etapa ${columna.etapa.name}`}>
      <header className="flex flex-col gap-1.5 border-b border-line bg-surface px-4 py-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className={`size-2 shrink-0 rounded-full ${puntoEtapa(columna.etapa.kind)}`} aria-hidden="true" />
            <h3 className="m-0 truncate text-sm font-bold font-heading text-navy-950">{columna.etapa.name}</h3>
          </div>
          <Contador valor={columna.total} />
        </div>
        {montos && (
          <div className="flex items-center justify-end">
            <span className="rounded-md bg-gold-50/80 px-2 py-0.5 text-[13px] font-bold tabular-nums text-gold-900 border border-gold-200/60">{montos}</span>
          </div>
        )}
        {destacada && <AvisoDestino etapa={columna.etapa} />}
      </header>
      <div className="kanban-column-body">{children}</div>
    </section>
  );
}

function SeccionMovil({ columna, expandida, destacada, onAlternar, children }: {
  columna: ColumnaEtapa;
  expandida: boolean;
  destacada: boolean;
  onAlternar: () => void;
  children: ReactNode;
}) {
  const { setNodeRef } = useDroppable({ id: idEtapa(columna.etapa.id), data: { tipo: "etapa" } });
  const id = columna.etapa.id;
  const montos = resumenMontos(columna.totales);
  return (
    <section ref={setNodeRef} className={`rounded-xl border bg-surface-alt shadow-2xs transition-colors ${destacada ? "border-gold-600 ring-1 ring-gold-600" : "border-line"}`}>
      <h3 className="m-0">
        <button
          type="button"
          onClick={onAlternar}
          aria-expanded={expandida}
          aria-controls={`etapa-movil-${id}`}
          className="flex min-h-12 w-full cursor-pointer items-center justify-between gap-2 rounded-xl bg-surface px-4 py-3 text-left transition-colors hover:bg-surface-alt"
        >
          <span className="flex min-w-0 items-center gap-2.5">
            <ChevronRight className={`size-4 shrink-0 text-ink-muted transition-transform duration-200 ${expandida ? "rotate-90 text-gold-700" : ""}`} aria-hidden="true" />
            <span className={`size-2 shrink-0 rounded-full ${puntoEtapa(columna.etapa.kind)}`} aria-hidden="true" />
            <span className="truncate text-sm font-bold text-navy-950 font-heading">{columna.etapa.name}</span>
            <Contador valor={columna.total} />
          </span>
          {montos && <span className="shrink-0 rounded-md bg-gold-50/80 px-2 py-0.5 text-[13px] font-bold tabular-nums text-gold-900 border border-gold-200/60">{montos}</span>}
        </button>
      </h3>
      {destacada && <div className="px-3 pt-2"><AvisoDestino etapa={columna.etapa} /></div>}
      {expandida && <div id={`etapa-movil-${id}`} className="flex flex-col gap-3 p-3">{children}</div>}
    </section>
  );
}

/* ---------------------------------- tablero ---------------------------------- */

/**
 * Tablero por etapas con arrastre real (@dnd-kit). Se monta UN solo diseño
 * según el ancho: escritorio = columnas; móvil = acordeón vertical sin
 * desplazamiento anidado. Arrastre con ratón, pulsación larga en táctil y
 * teclado (asa + flechas), con anuncios para lector de pantalla. Soltar
 * pide al padre el movimiento: él lo aplica de forma optimista y lo revierte
 * si el servidor lo rechaza. «Mover a etapa» sigue disponible en cada tarjeta.
 */
export function Tablero({
  columnas,
  pendientes = {},
  acciones,
  presentacion = { campos: PREFERENCIAS_INICIALES.tarjeta, compacta: false },
  onSoltar,
  onReordenar,
}: {
  columnas: ColumnaEtapa[];
  pendientes?: Record<number, MovimientoPendiente>;
  acciones: AccionesTablero;
  presentacion?: Presentacion;
  onSoltar: (dealId: number, etapaId: number, indice: number) => void;
  onReordenar: (dealId: number, etapaId: number, indice: number) => void;
}) {
  const esMovil = useMediaQuery("(max-width: 767px)");
  const reducido = useReducedMotion();
  const [abiertas, setAbiertas] = useState<Record<number, boolean>>({});
  const [activo, setActivo] = useState<number | null>(null);
  const [arrastre, setArrastre] = useState<Arrastre | null>(null);
  const [sobreEtapa, setSobreEtapa] = useState<number | null>(null);
  const vista = useMemo(() => previsualizarArrastre(columnas, arrastre), [columnas, arrastre]);
  const primeraConDatos = columnas.find((c) => c.total > 0)?.etapa.id;

  const sensores = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 260, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const negocioDe = (id: number) => columnas.flatMap((c) => c.filas).find((f) => f.id === id);
  const columnaOriginal = (dealId: number) => columnas.find((c) => c.filas.some((f) => f.id === dealId));
  const columnaVista = (dealId: number) => vista.find((c) => c.filas.some((f) => f.id === dealId));

  function destino(over: UniqueIdentifier | null | undefined): { etapaId: number; indice: number } | null {
    const o = leerId(over);
    if (!o) return null;
    if (o.tipo === "e") {
      const col = vista.find((c) => c.etapa.id === o.id);
      return col ? { etapaId: o.id, indice: col.filas.length } : null;
    }
    const col = columnaVista(o.id);
    return col ? { etapaId: col.etapa.id, indice: col.filas.findIndex((f) => f.id === o.id) } : null;
  }

  function limpiar() {
    setActivo(null);
    setArrastre(null);
    setSobreEtapa(null);
  }

  function alEmpezar({ active }: DragStartEvent) {
    setActivo(leerId(active.id)?.id ?? null);
    setArrastre(null);
    setSobreEtapa(columnaOriginal(leerId(active.id)?.id ?? 0)?.etapa.id ?? null);
  }

  function alPasar({ active, over }: DragOverEvent) {
    const dealId = leerId(active.id)?.id;
    const d = destino(over?.id);
    if (dealId === undefined || !d) return;
    setSobreEtapa(d.etapaId);
    const origen = columnaOriginal(dealId);
    if (!origen) return;
    if (d.etapaId === origen.etapa.id) {
      if (arrastre) setArrastre(null);
      return;
    }
    if (leerId(over?.id)?.id === dealId && leerId(over?.id)?.tipo === "n") return;
    if (arrastre?.hacia === d.etapaId && arrastre.indice === d.indice) return;
    setArrastre({ dealId, hacia: d.etapaId, indice: d.indice });
  }

  function alSoltar({ active, over }: DragEndEvent) {
    const dealId = leerId(active.id)?.id;
    const previa = arrastre;
    const d = destino(over?.id);
    const sobre = leerId(over?.id);
    limpiar();
    if (dealId === undefined || !over || !d) return;
    const origen = columnaOriginal(dealId);
    if (!origen) return;

    if (previa && previa.hacia !== origen.etapa.id) {
      const lista = (vista.find((c) => c.etapa.id === previa.hacia)?.filas ?? []).map((f) => f.id);
      const desde = lista.indexOf(dealId);
      const hasta = d.etapaId === previa.hacia ? (sobre?.tipo === "n" ? lista.indexOf(sobre.id) : lista.length - 1) : desde;
      const final = desde >= 0 && hasta >= 0 ? moverEnLista(lista, desde, hasta) : lista;
      onSoltar(dealId, previa.hacia, Math.max(0, final.indexOf(dealId)));
      return;
    }
    if (d.etapaId !== origen.etapa.id) {
      onSoltar(dealId, d.etapaId, d.indice);
      return;
    }
    if (sobre?.tipo === "n" && sobre.id !== dealId) {
      const lista = origen.filas.map((f) => f.id);
      const final = moverEnLista(lista, lista.indexOf(dealId), lista.indexOf(sobre.id));
      onReordenar(dealId, origen.etapa.id, final.indexOf(dealId));
    }
  }

  const nombreEtapa = (id: number | undefined) => columnas.find((c) => c.etapa.id === id)?.etapa.name ?? "otra etapa";
  const contacto = (id: UniqueIdentifier) => negocioDe(leerId(id)?.id ?? 0)?.contactName ?? "este contacto";
  const anuncios: Announcements = {
    onDragStart: ({ active }) => `Tomaste el negocio de ${contacto(active.id)}, en ${nombreEtapa(columnaOriginal(leerId(active.id)?.id ?? 0)?.etapa.id)}.`,
    onDragOver: ({ active, over }) => {
      const d = destino(over?.id);
      if (!d) return `El negocio de ${contacto(active.id)} no está sobre ninguna etapa.`;
      const total = vista.find((c) => c.etapa.id === d.etapaId)?.filas.length ?? 0;
      return `Negocio de ${contacto(active.id)} sobre ${nombreEtapa(d.etapaId)}, posición ${Math.min(d.indice + 1, Math.max(total, 1))} de ${Math.max(total, 1)}.`;
    },
    onDragEnd: ({ active, over }) => {
      const d = destino(over?.id);
      return d ? `Soltaste el negocio de ${contacto(active.id)} en ${nombreEtapa(d.etapaId)}.` : `Soltaste el negocio de ${contacto(active.id)} fuera de las etapas; no se movió.`;
    },
    onDragCancel: ({ active }) => `Movimiento cancelado. El negocio de ${contacto(active.id)} vuelve a ${nombreEtapa(columnaOriginal(leerId(active.id)?.id ?? 0)?.etapa.id)}.`,
  };

  const animacionSoltar: DropAnimation | null = reducido ? null : {
    duration: 200,
    easing: "cubic-bezier(.2,.8,.2,1)",
    sideEffects: defaultDropAnimationSideEffects({ styles: { active: { opacity: "0.35" } } }),
  };
  const activoNegocio = activo !== null ? negocioDe(activo) : undefined;
  const origenActivo = activo !== null ? columnaOriginal(activo)?.etapa.id : undefined;
  const destaca = (etapaId: number) => activo !== null && sobreEtapa === etapaId && etapaId !== origenActivo;

  function envolver(diseno: ReactNode) {
    return (
      <MotionConfig reducedMotion="user">
        <DndContext
          sensors={sensores}
          collisionDetection={deteccion}
          onDragStart={alEmpezar}
          onDragOver={alPasar}
          onDragEnd={alSoltar}
          onDragCancel={limpiar}
          autoScroll={{ threshold: { x: 0.15, y: 0.18 }, acceleration: 14 }}
          accessibility={{
            announcements: anuncios,
            screenReaderInstructions: {
              draggable: "Para mover un negocio con el teclado, enfoca su asa y pulsa Espacio o Intro. Con las flechas cambias de etapa y de posición. Vuelve a pulsar Espacio o Intro para soltar, o Escape para cancelar. El menú «Mover a etapa» hace lo mismo sin arrastrar.",
            },
          }}
        >
          {diseno}
          <DragOverlay dropAnimation={animacionSoltar}>
            {activoNegocio ? (
              <TarjetaNegocio
                negocio={activoNegocio}
                etapas={acciones.etapas}
                ocupado={false}
                sinConexion={false}
                puedeMover={false}
                campos={presentacion.campos}
                compacta={presentacion.compacta}
                levantada
                onVerFicha={() => undefined}
                onMover={() => undefined}
              />
            ) : null}
          </DragOverlay>
        </DndContext>
      </MotionConfig>
    );
  }

  if (esMovil) {
    return envolver(
      <div className="flex w-full flex-col gap-3">
        {vista.map((columna) => {
          const id = columna.etapa.id;
          const expandida = abiertas[id] ?? id === primeraConDatos;
          return (
            <SeccionMovil key={id} columna={columna} expandida={expandida} destacada={destaca(id)}
              onAlternar={() => setAbiertas((previo) => ({ ...previo, [id]: !expandida }))}>
              <EtapaContenido columna={columna} acciones={acciones} presentacion={presentacion} pendientes={pendientes} activo={activo} />
            </SeccionMovil>
          );
        })}
      </div>,
    );
  }

  return envolver(
    <div className="kanban">
      {vista.map((columna) => (
        <ColumnaEscritorio key={columna.etapa.id} columna={columna} destacada={destaca(columna.etapa.id)}>
          <EtapaContenido columna={columna} acciones={acciones} presentacion={presentacion} pendientes={pendientes} activo={activo} />
        </ColumnaEscritorio>
      ))}
    </div>,
  );
}
