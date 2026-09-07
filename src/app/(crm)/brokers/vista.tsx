"use client";

import { Avatar, Badge, PageHeader } from "../_ui/prototipo-ui";

/**
 * ponytail: datos de muestra portados de `referencia-prototipo/app/page.tsx`
 * (`BrokersView`). M7 · Brokers se construye en F3
 * (`docs/F1_ANALISIS_Y_PLAN.md`); sustituye este arreglo local por
 * `broker_profiles` real.
 */
const brokers = [
  ["Ismael Rosario", "Administrador", "Proyectos en planos", "Top Producer", "US$1,240,000", "15", 82],
  ["Yostar Medina", "Broker", "Alquileres", "Junior", "US$85,000", "5", 50],
  ["Luis García", "Broker en formación", "General", "Junior", "US$0", "2", 20],
] as const;

export function BrokersVista() {
  return (
    <>
      <PageHeader
        eyebrow="C6 · Equipo"
        title="Brokers"
        subtitle="Asignación, especialidad y desarrollo del equipo comercial."
        action={
          <button className="button primary" type="button">
            Invitar broker
          </button>
        }
      />
      <div className="level-scale">
        <span>Junior</span>
        <i />
        <span>Senior</span>
        <i />
        <span>Senior+</span>
        <i />
        <span>Top Producer</span>
        <i />
        <span>Top Leader</span>
      </div>
      <div className="broker-grid">
        {brokers.map(([name, role, specialty, level, sales, deals, progress]) => (
          <article className="broker-card" key={name}>
            <div className="broker-card-head">
              <Avatar name={name} />
              <div>
                <h2>{name}</h2>
                <p>{role}</p>
              </div>
              <Badge tone={level === "Top Producer" ? "gold" : "blue"}>{level}</Badge>
            </div>
            <dl className="detail-grid">
              <div>
                <dt>Especialidad</dt>
                <dd>{specialty}</dd>
              </div>
              <div>
                <dt>Ventas del año</dt>
                <dd>{sales}</dd>
              </div>
              <div>
                <dt>Negocios activos</dt>
                <dd>{deals}</dd>
              </div>
              <div>
                <dt>Meta mensual</dt>
                <dd>{progress}%</dd>
              </div>
            </dl>
            <div className="progress-line">
              <span style={{ width: `${progress}%` }} />
            </div>
            <footer>
              <button className="button secondary" type="button">
                Ver perfil
              </button>
              <button className="text-button" type="button">
                Asignar propiedades
              </button>
            </footer>
          </article>
        ))}
      </div>
    </>
  );
}
