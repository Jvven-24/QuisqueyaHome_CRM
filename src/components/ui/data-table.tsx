import { useMemo, useState, type ReactNode, type ElementType } from "react";
import { ArrowUpDown, ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Inbox } from "lucide-react";
import { cn } from "@/lib/utils";

export type Columna<F> = {
  clave: string;
  titulo: string;
  celda?: (fila: F) => ReactNode;
  valor?: (fila: F) => string | number;
  alinear?: "izquierda" | "derecha";
  ancho?: string;
  ordenable?: boolean;
  secundaria?: boolean;
  movil?: "titulo" | "subtitulo" | "insignia" | "oculta";
};

export type AccionMasiva = {
  texto: string;
  onClick: (ids: string[]) => void;
  tono?: "normal" | "peligro";
  icono?: ReactNode;
};

type Props<F> = {
  filas: F[];
  columnas: Columna<F>[];
  idDe: (fila: F) => string;
  onAbrir?: (fila: F) => void;
  acciones?: AccionMasiva[];
  vacio?: { titulo: string; cuerpo: string; accion?: ReactNode };
  cargando?: boolean;
  porPagina?: number;
  medioMovil?: (fila: F) => ReactNode;
  ordenInicial?: { clave: string; asc: boolean };
  activa?: string | null;
  etiqueta: string;
};

export function DataTable<F>({
  filas,
  columnas,
  idDe,
  onAbrir,
  acciones,
  vacio,
  cargando,
  porPagina = 25,
  activa,
  etiqueta,
  ordenInicial,
  medioMovil,
}: Props<F>) {
  const [orden, setOrden] = useState<{ clave: string; asc: boolean } | null>(ordenInicial ?? null);
  const [pagina, setPagina] = useState(0);
  const CabeceraFicha: ElementType = onAbrir ? "button" : "div";
  const [marcadas, setMarcadas] = useState<Set<string>>(new Set());

  const ordenadas = useMemo(() => {
    if (!orden) return filas;
    const columna = columnas.find((c) => c.clave === orden.clave);
    if (!columna?.valor) return filas;
    const lectura = columna.valor;
    return [...filas].sort((a, b) => {
      const x = lectura(a);
      const y = lectura(b);
      if (typeof x === "number" && typeof y === "number") return orden.asc ? x - y : y - x;
      return orden.asc
        ? String(x).localeCompare(String(y), "es", { numeric: true })
        : String(y).localeCompare(String(x), "es", { numeric: true });
    });
  }, [filas, columnas, orden]);

  const paginas = Math.max(1, Math.ceil(ordenadas.length / porPagina));
  const actual = Math.min(pagina, paginas - 1);
  const visibles = ordenadas.slice(actual * porPagina, actual * porPagina + porPagina);
  const idsVisibles = visibles.map(idDe);
  const todasMarcadas = idsVisibles.length > 0 && idsVisibles.every((id) => marcadas.has(id));

  function alternar(id: string) {
    setMarcadas((previas) => {
      const copia = new Set(previas);
      if (copia.has(id)) copia.delete(id);
      else copia.add(id);
      return copia;
    });
  }

  function alternarTodas() {
    setMarcadas((previas) => {
      const copia = new Set(previas);
      if (todasMarcadas) idsVisibles.forEach((id) => copia.delete(id));
      else idsVisibles.forEach((id) => copia.add(id));
      return copia;
    });
  }

  function ordenarPor(clave: string) {
    setOrden((previo) => (previo?.clave === clave ? { clave, asc: !previo.asc } : { clave, asc: true }));
    setPagina(0);
  }

  if (cargando) return <Esqueleto columnas={columnas.length} />;

  if (!filas.length) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border bg-card px-6 py-10 text-center">
        <span className="grid size-12 place-items-center rounded-lg bg-muted text-muted-foreground border border-border/60">
          <Inbox size={22} />
        </span>
        <strong className="text-[15px] font-bold text-foreground">{vacio?.titulo || "Nada que mostrar"}</strong>
        <p className="max-w-[46ch] text-[13px] leading-relaxed text-muted-foreground">{vacio?.cuerpo || ""}</p>
        {vacio?.accion}
      </div>
    );
  }

  const seleccionables = !!acciones?.length;

  return (
    <div className="flex flex-col gap-3">
      {seleccionables && marcadas.size > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-gold-500/40 bg-gold-500/10 px-3 py-2">
          <strong className="text-[12.5px] font-bold text-foreground">
            {marcadas.size} seleccionad{marcadas.size === 1 ? "o" : "os"}
          </strong>
          <button
            type="button"
            onClick={() => setMarcadas(new Set())}
            className="text-[12px] font-semibold text-gold-600 hover:text-gold-500 cursor-pointer"
          >
            Quitar selección
          </button>
          <span className="ml-auto flex flex-wrap gap-2">
            {acciones!.map((accion) => (
              <button
                key={accion.texto}
                type="button"
                onClick={() => {
                  accion.onClick([...marcadas]);
                  setMarcadas(new Set());
                }}
                className={cn(
                  "inline-flex min-h-[32px] items-center gap-1.5 rounded-md px-2.5 text-[12px] font-bold text-white transition-all cursor-pointer shadow-none",
                  accion.tono === "peligro"
                    ? "bg-rose-600 hover:bg-rose-700"
                    : "bg-navy-950 hover:bg-navy-900 border border-gold-600/30"
                )}
              >
                {accion.icono}
                {accion.texto}
              </button>
            ))}
          </span>
        </div>
      )}

      {/* Vista Escritorio */}
      <div className="hidden overflow-hidden rounded-lg border border-border bg-card shadow-none md:block">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left" aria-label={etiqueta}>
            <thead>
              <tr className="border-b border-border bg-muted/40 h-9">
                {seleccionables && (
                  <th scope="col" className="w-10 px-3 py-2">
                    <input
                      type="checkbox"
                      checked={todasMarcadas}
                      onChange={alternarTodas}
                      aria-label="Seleccionar todo lo visible"
                      className="size-4 cursor-pointer accent-gold-500 rounded"
                    />
                  </th>
                )}
                {columnas.map((columna) => (
                  <th
                    key={columna.clave}
                    scope="col"
                    style={columna.ancho ? { width: columna.ancho } : undefined}
                    aria-sort={orden?.clave === columna.clave ? (orden.asc ? "ascending" : "descending") : undefined}
                    className={cn(
                      "h-9 px-3 py-2 text-[11px] font-semibold text-muted-foreground",
                      columna.alinear === "derecha" && "text-right",
                      columna.secundaria && "hidden lg:table-cell"
                    )}
                  >
                    {columna.ordenable && columna.valor ? (
                      <button
                        type="button"
                        onClick={() => ordenarPor(columna.clave)}
                        className={cn(
                          "inline-flex items-center gap-1 transition-colors hover:text-foreground cursor-pointer",
                          orden?.clave === columna.clave && "text-foreground font-black"
                        )}
                      >
                        {columna.titulo}
                        {orden?.clave === columna.clave ? (
                          orden.asc ? (
                            <ChevronUp size={13} className="text-gold-500" />
                          ) : (
                            <ChevronDown size={13} className="text-gold-500" />
                          )
                        ) : (
                          <ArrowUpDown size={12} className="opacity-40" />
                        )}
                      </button>
                    ) : (
                      columna.titulo
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {visibles.map((fila) => {
                const id = idDe(fila);
                return (
                  <tr
                    key={id}
                    onClick={onAbrir ? () => onAbrir(fila) : undefined}
                    className={cn(
                      "transition-colors duration-150 h-10",
                      onAbrir && "cursor-pointer hover:bg-gold-500/5",
                      activa === id && "bg-gold-500/10 border-l-4 border-l-gold-500 shadow-none",
                      marcadas.has(id) && "bg-gold-500/5"
                    )}
                  >
                    {seleccionables && (
                      <td className="px-3 py-2" onClick={(evento) => evento.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={marcadas.has(id)}
                          onChange={() => alternar(id)}
                          aria-label={"Seleccionar fila"}
                          className="size-4 cursor-pointer accent-gold-500"
                        />
                      </td>
                    )}
                    {columnas.map((columna) => (
                      <td
                        key={columna.clave}
                        className={cn(
                          "px-3 py-2 align-middle text-[13px] text-foreground",
                          columna.alinear === "derecha" && "text-right tabular-nums",
                          columna.secundaria && "hidden lg:table-cell"
                        )}
                      >
                        {columna.celda ? columna.celda(fila) : String(columna.valor?.(fila) ?? "")}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Vista Móvil (tarjetas apiladas adaptables) */}
      <ul className="flex list-none flex-col gap-2.5 md:hidden p-0 m-0">
        {visibles.map((fila) => {
          const id = idDe(fila);
          const titulo = columnas.find((c) => c.movil === "titulo");
          const subtitulo = columnas.find((c) => c.movil === "subtitulo");
          const insignia = columnas.find((c) => c.movil === "insignia");
          const resto = columnas.filter((c) => !c.movil && !c.secundaria);
          return (
            <li key={id}>
              <div
                className={cn(
                  "flex flex-col gap-2 rounded-lg border bg-card p-3 shadow-none transition-all",
                  activa === id ? "border-gold-500/50 bg-gold-500/5 ring-1 ring-gold-500/30" : "border-border"
                )}
              >
                <div className="flex items-start gap-2.5">
                  {seleccionables && (
                    <input
                      type="checkbox"
                      checked={marcadas.has(id)}
                      onChange={() => alternar(id)}
                      aria-label={"Seleccionar ficha"}
                      className="mt-1 size-4 shrink-0 cursor-pointer accent-gold-500"
                    />
                  )}
                  {medioMovil && <span className="shrink-0">{medioMovil(fila)}</span>}
                  {/* Sin onAbrir no hay acción: un div evita anidar un botón dentro de otro botón
                      cuando la columna título trae su propio botón (React #418 en /metas y /reservas/facturacion). */}
                  <CabeceraFicha
                    {...(onAbrir
                      ? { type: "button" as const, onClick: () => onAbrir(fila) }
                      : {})}
                    className={"min-w-0 flex-1 text-left bg-transparent border-none p-0" + (onAbrir ? " cursor-pointer" : "")}
                  >
                    <strong className="line-clamp-2 text-[14px] font-bold leading-snug text-foreground">
                      {titulo ? textoPlano(titulo, fila, id) : id}
                    </strong>
                    {subtitulo && (
                      <small className="mt-0.5 block truncate text-[12px] text-muted-foreground">
                        {textoPlano(subtitulo, fila, "")}
                      </small>
                    )}
                  </CabeceraFicha>
                </div>
                {(insignia || resto.length > 0) && (
                  <dl className="flex flex-wrap items-center gap-x-3 gap-y-1.5 border-t border-border/60 pt-2 mt-1">
                    {insignia && (
                      <dd className="mr-1 m-0">
                        {insignia.celda ? insignia.celda(fila) : String(insignia.valor?.(fila) ?? "")}
                      </dd>
                    )}
                    {resto.map((columna) => (
                      <div key={columna.clave} className="flex min-w-0 max-w-full items-baseline gap-1.5">
                        <dt className="shrink-0 text-[10.5px] font-bold uppercase tracking-[0.06em] text-muted-foreground">
                          {columna.titulo}
                        </dt>
                        <dd className="min-w-0 text-[12.5px] text-foreground [&_*]:whitespace-normal m-0">
                          {columna.celda ? columna.celda(fila) : String(columna.valor?.(fila) ?? "")}
                        </dd>
                      </div>
                    ))}
                  </dl>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      {/* Paginación */}
      {paginas > 1 && (
        <nav className="flex items-center justify-between gap-3 px-1 mt-1" aria-label="Páginas">
          <p className="text-[12px] text-muted-foreground">
            {actual * porPagina + 1}–{Math.min(ordenadas.length, (actual + 1) * porPagina)} de {ordenadas.length}
          </p>
          <span className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={actual === 0}
              onClick={() => setPagina(actual - 1)}
              className="grid size-8 place-items-center rounded-lg border border-border bg-card text-foreground transition-colors hover:bg-muted disabled:opacity-40 cursor-pointer"
              aria-label="Página anterior"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="min-w-[56px] text-center text-[12px] font-semibold tabular-nums text-foreground">
              {actual + 1} / {paginas}
            </span>
            <button
              type="button"
              disabled={actual >= paginas - 1}
              onClick={() => setPagina(actual + 1)}
              className="grid size-8 place-items-center rounded-lg border border-border bg-card text-foreground transition-colors hover:bg-muted disabled:opacity-40 cursor-pointer"
              aria-label="Página siguiente"
            >
              <ChevronRight size={16} />
            </button>
          </span>
        </nav>
      )}
    </div>
  );
}

function textoPlano<F>(columna: Columna<F>, fila: F, respaldo: string): ReactNode {
  if (columna.valor) return String(columna.valor(fila) ?? "") || respaldo;
  return columna.celda ? columna.celda(fila) : respaldo;
}

function Esqueleto({ columnas }: { columnas: number }) {
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card" aria-hidden="true">
      <div className="h-9 border-b border-border bg-muted/40" />
      {Array.from({ length: 5 }).map((_, fila) => (
        <div key={fila} className="flex gap-3 border-b border-border/60 px-3 py-2 last:border-0">
          {Array.from({ length: columnas }).map((__, celda) => (
            <span
              key={celda}
              className="h-4 flex-1 animate-pulse rounded bg-muted"
              style={{ animationDelay: `${(fila * columnas + celda) * 40}ms` }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
