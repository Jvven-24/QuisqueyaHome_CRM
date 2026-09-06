"use client";

import { Badge, Metric, PageHeader } from "../_ui/prototipo-ui";

/**
 * ponytail: datos de muestra portados de `referencia-prototipo/app/page.tsx`
 * (`CommissionsView`). M9 · Comisiones se construye en F3
 * (`docs/F1_ANALISIS_Y_PLAN.md`); sustituye estas filas por `commissions`
 * real, calculada exactamente una vez por el cierre transaccional de M3
 * (`commissions_deal_unq`, criterio de terminado #4).
 */
const rows = [
  ["Laura Gómez · Bávaro Beach Lofts", "US$132,000", "5%", "50% broker / 50% agencia", "Yostar Medina", "Aprobada"],
  ["Carlos Peña · Praderas", "US$195,000", "5%", "60% broker / 40% agencia", "Ismael Rosario", "Pendiente"],
  ["Marta Solís · Vista Cana", "US$220,000", "4%", "50% broker / 50% agencia", "Ismael Rosario", "Pagada"],
] as const;

export function ComisionesVista() {
  return (
    <>
      <PageHeader
        eyebrow="C9 · Finanzas internas"
        title="Comisiones"
        subtitle="Comisiones de Quisqueya Home, sin colaboración con agencias externas."
        action={
          <button className="button secondary" type="button">
            Exportar reporte
          </button>
        }
      />
      <section className="metrics-row three">
        <Metric label="Comisiones del mes" value="US$48,500" note="6 negocios cerrados" />
        <Metric label="Pendientes de pago" value="US$12,300" note="2 por aprobar" />
        <Metric label="Pagadas" value="US$36,200" note="Actualizado hoy" />
      </section>
      <div className="filter-bar">
        <select>
          <option>Todos los brokers</option>
          <option>Ismael Rosario</option>
          <option>Yostar Medina</option>
        </select>
        <select>
          <option>Julio 2026</option>
          <option>Junio 2026</option>
        </select>
        <select>
          <option>Todos los estados</option>
          <option>Pendiente</option>
          <option>Aprobada</option>
          <option>Pagada</option>
        </select>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Negocio</th>
              <th>Monto de venta</th>
              <th>Comisión</th>
              <th>Reparto interno</th>
              <th>Broker</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row[0]}>
                {row.slice(0, 5).map((cell) => (
                  <td key={cell}>{cell}</td>
                ))}
                <td>
                  <Badge tone={row[5] === "Pagada" ? "green" : row[5] === "Aprobada" ? "gold" : "neutral"}>{row[5]}</Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
