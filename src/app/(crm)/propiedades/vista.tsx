"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { PROJECT_TYPES } from "@/domain/catalogs";
import { Avatar, Badge, PageHeader } from "../_ui/prototipo-ui";
import { SinResultados, Vacio } from "../_ui/estados";
import { ETIQUETAS_TIPO, FormularioProyecto, type BrokerOpcion } from "./_formulario-proyecto";

export type ProyectoFila = {
  id: number;
  slug: string;
  name: string;
  zone: string | null;
  projectType: string;
  progressPercent: number;
  internalPriceCents: number | null;
  publicRangeMinCents: number | null;
  publicRangeMaxCents: number | null;
  currency: string;
  brokerId: number | null;
  brokerName: string | null;
  unidadesDisponibles: number;
  unidadesTotal: number;
};

function formatoRango(minCents: number | null, maxCents: number | null, currency: string): string {
  if (minCents == null && maxCents == null) return "Sin definir";
  const fmt = (cents: number) => `${currency} ${(cents / 100).toLocaleString("es-DO")}`;
  if (minCents != null && maxCents != null) return `${fmt(minCents)} - ${fmt(maxCents)}`;
  return fmt((minCents ?? maxCents)!);
}

/**
 * M5 · Propiedades (F2). Rejilla real de `projects`/`units` — el look
 * (`.property-grid`, `.property-card`, `.filter-bar`) es el mismo que portó
 * T5, solo cambia de dónde vienen los datos y que cada tarjeta navega al
 * detalle (`/propiedades/[slug]`) en vez de abrir un panel local.
 *
 * Zona y tipo viven en la URL (`searchParams`): cada cambio navega,
 * `page.tsx` vuelve a consultar con `visibleRows`.
 */
export function PropiedadesVista({
  proyectos,
  brokers,
  filtros,
  puedeCrear,
  puedeEditarPrecioReal,
}: {
  proyectos: ProyectoFila[];
  brokers: BrokerOpcion[];
  filtros: { zone: string; type?: string };
  puedeCrear: boolean;
  /** Hallazgo P1: sin esto, el campo de precio interno se ve y se envía aunque el servidor lo vaya a descartar. */
  puedeEditarPrecioReal: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [creando, setCreando] = useState(false);

  function irCon(cambios: Record<string, string | undefined>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [clave, valor] of Object.entries(cambios)) {
      if (valor) params.set(clave, valor);
      else params.delete(clave);
    }
    router.push(`${pathname}?${params.toString()}`);
  }

  const hayFiltro = Boolean(filtros.zone || filtros.type);

  return (
    <>
      <PageHeader
        eyebrow="C5 · Inventario privado"
        title="Propiedades internas"
        subtitle="Inventario, disponibilidad y rangos comerciales del equipo."
        action={
          puedeCrear ? (
            <button className="button primary" type="button" onClick={() => setCreando(true)}>
              Nuevo proyecto
            </button>
          ) : undefined
        }
      />
      <div className="privacy-banner">
        <strong>Inventario interno</strong>
        <span>Visible únicamente según los permisos de cada perfil.</span>
      </div>
      <div className="filter-bar">
        <input
          type="search"
          placeholder="Buscar por zona…"
          defaultValue={filtros.zone}
          onKeyDown={(event) => {
            if (event.key === "Enter") irCon({ zone: event.currentTarget.value.trim() || undefined });
          }}
        />
        <select value={filtros.type ?? ""} onChange={(event) => irCon({ type: event.target.value || undefined })}>
          <option value="">Todos los tipos</option>
          {PROJECT_TYPES.map((tipo) => (
            <option key={tipo} value={tipo}>
              {ETIQUETAS_TIPO[tipo]}
            </option>
          ))}
        </select>
      </div>
      {proyectos.length === 0 ? (
        hayFiltro ? (
          <SinResultados />
        ) : (
          <Vacio titulo="Sin proyectos todavía" texto="Registra el primero con “Nuevo proyecto”." />
        )
      ) : (
        <div className="property-grid">
          {proyectos.map((proyecto, index) => (
            <Link className="property-card" key={proyecto.id} href={`/propiedades/${proyecto.slug}`}>
              <div className={`property-visual visual-${index % 4}`}>
                <span>QH</span>
                <div>
                  <small>Avance de obra</small>
                  <strong>{proyecto.progressPercent}%</strong>
                </div>
              </div>
              <div className="property-body">
                <div>
                  <Badge tone="blue">{ETIQUETAS_TIPO[proyecto.projectType] ?? proyecto.projectType}</Badge>
                  <small>{proyecto.zone ?? "Sin zona"}</small>
                </div>
                <h2>{proyecto.name}</h2>
                <dl>
                  <div>
                    <dt>Disponibles</dt>
                    <dd>
                      {proyecto.unidadesDisponibles}/{proyecto.unidadesTotal}
                    </dd>
                  </div>
                  <div>
                    <dt>{proyecto.internalPriceCents != null ? "Precio real" : "Rango asignado"}</dt>
                    <dd>
                      {proyecto.internalPriceCents != null
                        ? `${proyecto.currency} ${(proyecto.internalPriceCents / 100).toLocaleString("es-DO")}`
                        : formatoRango(proyecto.publicRangeMinCents, proyecto.publicRangeMaxCents, proyecto.currency)}
                    </dd>
                  </div>
                </dl>
                <footer>
                  <Avatar name={proyecto.brokerName ?? "Sin asignar"} small />
                  <span>{proyecto.brokerName ?? "Sin asignar"}</span>
                  <b>Ver detalle →</b>
                </footer>
              </div>
            </Link>
          ))}
        </div>
      )}
      {creando && (
        <FormularioProyecto brokers={brokers} puedeEditarPrecioReal={puedeEditarPrecioReal} onClose={() => setCreando(false)} />
      )}
    </>
  );
}
