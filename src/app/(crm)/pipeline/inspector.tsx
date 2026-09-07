"use client";

import type { ReactNode } from "react";
import { Avatar } from "../_ui/prototipo-ui";
import type { Etapa, MotivoPerdida, NegocioFila, PropiedadDeal } from "./vista";

/**
 * Ficha lateral de un negocio (M3b).
 *
 * Mismo criterio que `ContactoInspector` (M1, `contactos/inspector.tsx`):
 * `LeadInspector` del prototipo (`../_ui/lead-inspector.tsx`) tiene la forma
 * de un `Lead` de muestra —`stage` como texto, `budget` como texto libre,
 * `broker` como nombre— que ya no corresponde a un negocio real, con etapa
 * por `stageId`, monto en centavos y broker por referencia. Un panel propio
 * es más simple que forzar esa forma vieja a encajar en datos nuevos.
 *
 * Solo lectura más el cambio de etapa (mismo mecanismo que soltar una tarjeta
 * en el Kanban, expuesto aquí como `<select>` para quien prefiera no
 * arrastrar) y el historial de auditoría (T6). No hay formulario para editar
 * monto, probabilidad, comisión, fecha estimada o propiedades de interés — no
 * lo pidió el encargo de M3b y sin él un negocio no puede, por ahora, cumplir
 * por su cuenta los requisitos de Negociación/Preselección/Cierre; queda
 * anotado como pendiente en `docs/F1_ANALISIS_Y_PLAN.md` §10.
 */
export function DealInspector({
  negocio,
  etapas,
  motivos,
  propiedades,
  historial,
  enviando,
  onCambiarEtapa,
  onClose,
}: {
  negocio: NegocioFila;
  etapas: Etapa[];
  motivos: MotivoPerdida[];
  propiedades: PropiedadDeal[];
  historial: ReactNode;
  enviando: boolean;
  onCambiarEtapa: (etapaId: number) => void;
  onClose: () => void;
}) {
  const etapaActual = etapas.find((e) => e.id === negocio.stageId);
  const cerrado = etapaActual?.kind !== "open";
  const motivoPerdida = negocio.lossReasonId ? motivos.find((m) => m.id === negocio.lossReasonId) : undefined;

  return (
    <aside className="inspector">
      <div className="drawer-head">
        <div>
          <p className="eyebrow">Ficha de negocio</p>
          <h2>{negocio.contactName}</h2>
        </div>
        <button className="icon-button" onClick={onClose} aria-label="Cerrar detalle">
          ×
        </button>
      </div>
      <div className="contact-hero">
        <Avatar name={negocio.contactName} />
        <div>
          <strong>{negocio.contactPhoneDisplay ?? negocio.contactPhone ?? "Sin teléfono"}</strong>
          <small>{negocio.sourceName ?? "Sin canal"}</small>
        </div>
      </div>

      <dl className="detail-grid">
        <div>
          <dt>Etapa</dt>
          <dd>{etapaActual?.name ?? "—"}</dd>
        </div>
        <div>
          <dt>Responsable</dt>
          <dd>{negocio.brokerName ?? "Sin asignar"}</dd>
        </div>
        <div>
          <dt>Operación</dt>
          <dd>{negocio.operationType === "rent" ? "Alquiler" : "Venta"}</dd>
        </div>
        <div>
          <dt>Monto</dt>
          <dd>
            {negocio.amountCents != null
              ? new Intl.NumberFormat("es-DO", { style: "currency", currency: negocio.currency, maximumFractionDigits: 0 }).format(
                  negocio.amountCents / 100,
                )
              : "Por definir"}
          </dd>
        </div>
        <div>
          <dt>Probabilidad</dt>
          <dd>{negocio.probability != null ? `${negocio.probability}%` : "—"}</dd>
        </div>
        <div>
          <dt>Comisión</dt>
          <dd>{negocio.commissionBasisPoints != null ? `${(negocio.commissionBasisPoints / 100).toFixed(2)}%` : "—"}</dd>
        </div>
        <div>
          <dt>Fecha estimada de cierre</dt>
          <dd>{negocio.expectedCloseDate ?? "—"}</dd>
        </div>
        <div>
          <dt>Próxima acción</dt>
          <dd>{negocio.nextActivityTitle ?? "Sin registrar"}</dd>
        </div>
      </dl>

      {propiedades.length > 0 && (
        <div>
          <h3>Propiedades de interés</h3>
          <ul className="timeline-list">
            {propiedades.map((propiedad) => (
              <li key={propiedad.id}>
                {propiedad.projectName}
                {propiedad.unitCode ? ` · Unidad ${propiedad.unitCode}` : ""}
                {propiedad.isPrimary ? " · Principal" : ""}
              </li>
            ))}
          </ul>
        </div>
      )}

      {motivoPerdida && (
        <p>
          <strong>Motivo de pérdida:</strong> {motivoPerdida.name}
          {negocio.lossComment ? ` — ${negocio.lossComment}` : ""}
        </p>
      )}

      {negocio.notes && (
        <p>
          <strong>Notas:</strong> {negocio.notes}
        </p>
      )}

      {!cerrado && (
        <div className="inspector-actions">
          <label className="span-2" style={{ width: "100%" }}>
            Cambiar de etapa
            <select
              defaultValue=""
              disabled={enviando}
              onChange={(event) => {
                const etapaId = Number(event.target.value);
                event.target.value = "";
                if (etapaId) onCambiarEtapa(etapaId);
              }}
            >
              <option value="" disabled>
                Elige una etapa…
              </option>
              {etapas
                .filter((etapa) => etapa.id !== negocio.stageId)
                .map((etapa) => (
                  <option key={etapa.id} value={etapa.id}>
                    {etapa.name}
                  </option>
                ))}
            </select>
          </label>
        </div>
      )}

      {historial}
    </aside>
  );
}
