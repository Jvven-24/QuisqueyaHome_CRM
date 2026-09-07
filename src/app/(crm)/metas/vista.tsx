"use client";

import { Avatar, Badge, PageHeader } from "../_ui/prototipo-ui";

/**
 * ponytail: datos de muestra portados de `referencia-prototipo/app/page.tsx`
 * (`GoalsView`). M8 · Metas se construye en F3
 * (`docs/F1_ANALISIS_Y_PLAN.md`); sustituye estas filas por `goals` reales,
 * actualizadas exactamente una vez por el cierre transaccional de M3
 * (criterio de terminado #4).
 */
export function MetasVista({ roleSlug }: { roleSlug: string }) {
  const isBroker = roleSlug === "broker";
  const rows: Array<[string, string, string, string, string]> = isBroker
    ? [["Yostar Medina", "4", "2", "50%", "Junior"]]
    : [
        ["Ismael Rosario", "6", "5", "83%", "Top Producer"],
        ["Yostar Medina", "4", "2", "50%", "Junior"],
        ["Luis García", "2", "0", "0%", "Junior"],
      ];

  return (
    <>
      <PageHeader
        eyebrow="C8 · Rendimiento"
        title={isBroker ? "Mis metas" : "Metas y desempeño"}
        subtitle="Cierres del pipeline contra los objetivos mensuales."
        action={
          <select className="header-select">
            <option>Julio 2026</option>
            <option>Junio 2026</option>
          </select>
        }
      />
      <div className="goal-hero">
        <div className="goal-ring" style={{ "--progress": isBroker ? "50%" : "70%" } as React.CSSProperties}>
          <strong>{isBroker ? "50%" : "70%"}</strong>
        </div>
        <div>
          <p className="eyebrow">{isBroker ? "Meta personal" : "Meta del negocio"}</p>
          <h2>{isBroker ? "2 de 4 negocios logrados" : "7 de 10 negocios logrados"}</h2>
          <p>Los cierres alimentan esta meta automáticamente, sin doble captura.</p>
        </div>
      </div>
      <div className="performance-grid">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Broker</th>
                <th>Meta</th>
                <th>Logrados</th>
                <th>Cumplimiento</th>
                <th>Nivel</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row[0]}>
                  <td>
                    <span className="table-person">
                      <Avatar name={row[0]} small />
                      <strong>{row[0]}</strong>
                    </span>
                  </td>
                  <td>{row[1]}</td>
                  <td>{row[2]}</td>
                  <td>
                    <div className="table-progress">
                      <span style={{ width: row[3] }} />
                    </div>
                    <small>{row[3]}</small>
                  </td>
                  <td>
                    <Badge tone={row[4] === "Top Producer" ? "gold" : "blue"}>{row[4]}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="panel annual-chart">
          <h2>Cierres por mes</h2>
          <div className="bar-chart">
            {[5, 7, 8, 6, 10, 9, 7, 0, 0, 0, 0, 0].map((value, index) => (
              <div key={index}>
                <i style={{ height: `${value * 8}px` }} className={value >= 10 ? "hit" : ""} />
                <span>{["E", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"][index]}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
