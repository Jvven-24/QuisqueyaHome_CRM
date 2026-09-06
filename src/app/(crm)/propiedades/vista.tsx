"use client";

import { useState } from "react";
import Link from "next/link";
import { properties } from "../_ui/datos-muestra";
import { Avatar, Badge, PageHeader } from "../_ui/prototipo-ui";

/**
 * ponytail: datos de muestra portados de `referencia-prototipo/app/page.tsx`
 * (`PropertiesView`). M5 · Propiedades se construye en F2
 * (`docs/F1_ANALISIS_Y_PLAN.md`); sustituye este arreglo local por `projects`
 * y `units` reales, con `stripRestrictedPrices` del dominio decidiendo qué
 * precio ve cada rol — aquí la restricción es solo visual (`roleSlug === "admin"`).
 */
export function PropiedadesVista({ roleSlug }: { roleSlug: string }) {
  const [selected, setSelected] = useState<(typeof properties)[number] | null>(null);
  const isAdmin = roleSlug === "admin";
  const visible = roleSlug === "broker" ? properties.filter((property) => property.broker === "Yostar Medina") : properties;

  if (selected) {
    const unidades = [
      ["B4", "Apartamento", "2", "2", "85 m²", "US$165,000", "US$170K - 185K", "Disponible"],
      ["C2", "Penthouse", "3", "2.5", "110 m²", "US$210,000", "US$220K - 240K", "Reservada"],
      ["A1", "Apartamento", "1", "1", "60 m²", "US$118,000", "US$125K - 140K", "Vendida"],
    ];
    return (
      <>
        <button className="back-button" type="button" onClick={() => setSelected(null)}>
          ← Volver a propiedades
        </button>
        <PageHeader
          eyebrow="Inventario privado"
          title={selected.name}
          subtitle={`${selected.zone} · ${selected.type} · Entrega estimada diciembre 2027`}
          action={
            <Link className="button primary" href="/avances">
              Actualizar avance
            </Link>
          }
        />
        <div className="project-summary">
          <div className="property-visual large">
            <span>QH</span>
            <strong>{selected.progress}%</strong>
          </div>
          <dl className="detail-grid">
            <div>
              <dt>Desarrollador</dt>
              <dd>Grupo Punta Cana Norte</dd>
            </div>
            <div>
              <dt>Unidades disponibles</dt>
              <dd>{selected.units}</dd>
            </div>
            <div>
              <dt>Precio interno</dt>
              <dd>{isAdmin ? selected.price : "Restringido"}</dd>
            </div>
            <div>
              <dt>Rango público</dt>
              <dd>{selected.public}</dd>
            </div>
          </dl>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Unidad</th>
                <th>Tipología</th>
                <th>Hab.</th>
                <th>Baños</th>
                <th>Construcción</th>
                {isAdmin && <th>Precio real</th>}
                <th>Rango público</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {unidades.map((row) => (
                <tr key={row[0]}>
                  {row.slice(0, 5).map((cell) => (
                    <td key={cell}>{cell}</td>
                  ))}
                  {isAdmin && <td>{row[5]}</td>}
                  <td>{row[6]}</td>
                  <td>
                    <Badge tone={row[7] === "Disponible" ? "green" : row[7] === "Reservada" ? "gold" : "neutral"}>
                      {row[7]}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader
        eyebrow="C5 · Inventario privado"
        title={roleSlug === "broker" ? "Mis propiedades" : "Propiedades internas"}
        subtitle="Inventario, disponibilidad y rangos comerciales del equipo."
        action={
          isAdmin ? (
            <button className="button primary" type="button">
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
        <select>
          <option>Todas las zonas</option>
          <option>Punta Cana</option>
          <option>Bávaro</option>
        </select>
        <select>
          <option>Todos los tipos</option>
          <option>En planos</option>
          <option>Alquiler</option>
        </select>
        <select>
          <option>Todos los estados</option>
          <option>Preventa</option>
          <option>En construcción</option>
        </select>
      </div>
      <div className="property-grid">
        {visible.map((property, index) => (
          <button className="property-card" key={property.name} onClick={() => setSelected(property)}>
            <div className={`property-visual visual-${index}`}>
              <span>QH</span>
              <div>
                <small>Avance de obra</small>
                <strong>{property.progress}%</strong>
              </div>
            </div>
            <div className="property-body">
              <div>
                <Badge tone="blue">{property.type}</Badge>
                <small>{property.zone}</small>
              </div>
              <h2>{property.name}</h2>
              <dl>
                <div>
                  <dt>Disponibles</dt>
                  <dd>{property.units}</dd>
                </div>
                <div>
                  <dt>{isAdmin ? "Precio real" : "Rango asignado"}</dt>
                  <dd>{isAdmin ? property.price : property.public}</dd>
                </div>
              </dl>
              <footer>
                <Avatar name={property.broker} small />
                <span>{property.broker}</span>
                <b>Ver detalle →</b>
              </footer>
            </div>
          </button>
        ))}
      </div>
    </>
  );
}
