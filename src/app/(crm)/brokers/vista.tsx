"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { BrokerLevel } from "@/domain/catalogs";
import { BROKER_LEVEL_LABELS } from "@/domain/cierre-negocio";
import { FormularioUsuario, type RolOpcion } from "../configuracion/_usuarios";
import { formatearMonto } from "../_ui/formato";
import { Avatar, Badge, Modal, PageHeader } from "../_ui/prototipo-ui";
import { Vacio } from "../_ui/estados";

export type BrokerFila = {
  userId: number;
  fullName: string;
  jobTitle: string;
  specialty: string | null;
  level: BrokerLevel;
  annualSalesCents: number;
  negociosActivos: number;
  /** `null` = sin meta fijada este mes (`domain/metas.ts#cumplimientoPorcentaje`). */
  porcentajeMeta: number | null;
};

export type ProyectoAsignable = { id: number; name: string; brokerId: number | null; brokerName: string | null };

/**
 * M7 · Brokers (`docs/F3_ANALISIS_Y_PLAN.md` §4.4, issue #33). Tarjetas con
 * datos reales de `broker_profiles` — el mock y su comentario `ponytail:` de
 * T7 se reemplazan aquí. `proyectosAsignables` y `roles` llegan vacíos cuando
 * el actor no tiene el permiso correspondiente (decidido en `page.tsx`,
 * nunca aquí: ocultar un botón no es el control de acceso, solo su reflejo).
 */
export function BrokersVista({
  brokers,
  puedeAsignar,
  puedeInvitar,
  proyectosAsignables,
  roles,
}: {
  brokers: BrokerFila[];
  puedeAsignar: boolean;
  puedeInvitar: boolean;
  proyectosAsignables: ProyectoAsignable[];
  roles: RolOpcion[];
}) {
  const [invitando, setInvitando] = useState(false);
  const [asignando, setAsignando] = useState<BrokerFila | null>(null);

  return (
    <>
      <PageHeader
        eyebrow="C6 · Equipo"
        title="Brokers"
        subtitle="Asignación, especialidad y desarrollo del equipo comercial."
        action={
          puedeInvitar && (
            <button className="button primary" type="button" onClick={() => setInvitando(true)}>
              Invitar broker
            </button>
          )
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
      {brokers.length === 0 ? (
        <Vacio titulo="Sin brokers todavía" texto="No hay brokers activos con perfil para este alcance." />
      ) : (
        <div className="broker-grid">
          {brokers.map((broker) => (
            <article className="broker-card" key={broker.userId}>
              <div className="broker-card-head">
                <Avatar name={broker.fullName} />
                <div>
                  <h2>{broker.fullName}</h2>
                  <p>{broker.jobTitle}</p>
                </div>
                <Badge tone={broker.level === "top_producer" || broker.level === "top_leader" ? "gold" : "blue"}>
                  {BROKER_LEVEL_LABELS[broker.level]}
                </Badge>
              </div>
              <dl className="detail-grid">
                <div>
                  <dt>Especialidad</dt>
                  <dd>{broker.specialty ?? "—"}</dd>
                </div>
                <div>
                  <dt>Ventas del año</dt>
                  <dd>{formatearMonto(broker.annualSalesCents)}</dd>
                </div>
                <div>
                  <dt>Negocios activos</dt>
                  <dd>{broker.negociosActivos}</dd>
                </div>
                <div>
                  <dt>Meta mensual</dt>
                  <dd>{broker.porcentajeMeta === null ? "Sin meta" : `${broker.porcentajeMeta}%`}</dd>
                </div>
              </dl>
              <div className="progress-line">
                <span style={{ width: `${Math.min(broker.porcentajeMeta ?? 0, 100)}%` }} />
              </div>
              <footer>
                <Link className="button secondary" href={`/brokers/${broker.userId}`}>
                  Ver perfil
                </Link>
                {puedeAsignar && (
                  <button className="text-button" type="button" onClick={() => setAsignando(broker)}>
                    Asignar propiedades
                  </button>
                )}
              </footer>
            </article>
          ))}
        </div>
      )}
      {invitando && <FormularioUsuario roles={roles} onClose={() => setInvitando(false)} />}
      {asignando && (
        <AsignarPropiedadesModal broker={asignando} proyectos={proyectosAsignables} onClose={() => setAsignando(null)} />
      )}
    </>
  );
}

function AsignarPropiedadesModal({
  broker,
  proyectos,
  onClose,
}: {
  broker: BrokerFila;
  proyectos: ProyectoAsignable[];
  onClose: () => void;
}) {
  const router = useRouter();
  const [seleccionados, setSeleccionados] = useState(
    () => new Set(proyectos.filter((p) => p.brokerId === broker.userId).map((p) => p.id)),
  );
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function alternar(id: number) {
    setSeleccionados((actual) => {
      const copia = new Set(actual);
      if (copia.has(id)) copia.delete(id);
      else copia.add(id);
      return copia;
    });
  }

  async function guardar() {
    setEnviando(true);
    setError(null);
    try {
      const respuesta = await fetch(`/api/brokers/${broker.userId}/proyectos`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ projectIds: Array.from(seleccionados) }),
      });
      const cuerpo = await respuesta.json().catch(() => ({}));
      if (!respuesta.ok) {
        setError(cuerpo.error ?? "No se pudo guardar la asignación.");
        return;
      }
      router.refresh();
      onClose();
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Modal title={`Asignar propiedades a ${broker.fullName}`} onClose={onClose}>
      {proyectos.length === 0 ? (
        <Vacio titulo="Sin proyectos activos" texto="No hay proyectos para asignar todavía." />
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th></th>
                <th>Proyecto</th>
                <th>Asignado a</th>
              </tr>
            </thead>
            <tbody>
              {proyectos.map((proyecto) => (
                <tr key={proyecto.id}>
                  <td>
                    <input
                      type="checkbox"
                      checked={seleccionados.has(proyecto.id)}
                      onChange={() => alternar(proyecto.id)}
                      aria-label={`Asignar ${proyecto.name}`}
                    />
                  </td>
                  <td>{proyecto.name}</td>
                  <td>
                    {proyecto.brokerId == null ? (
                      "—"
                    ) : proyecto.brokerId === broker.userId ? (
                      <Badge tone="blue">Este broker</Badge>
                    ) : (
                      proyecto.brokerName
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {error && <small style={{ color: "#b42318" }}>{error}</small>}
      <div className="form-actions">
        <button className="button" type="button" onClick={onClose}>
          Cancelar
        </button>
        <button className="button primary" type="button" disabled={enviando} onClick={() => void guardar()}>
          {enviando ? "Guardando…" : "Guardar asignación"}
        </button>
      </div>
    </Modal>
  );
}
