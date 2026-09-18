"use client";

import { usePathname, useRouter } from "next/navigation";
import { type FormEvent, useRef, useState } from "react";
import type { BrokerLevel } from "@/domain/catalogs";
import { BROKER_LEVEL_LABELS } from "@/domain/cierre-negocio";
import { cumplimientoPorcentaje, esMetaCumplida, formatoPeriodo } from "@/domain/metas";
import { Avatar, Badge, Modal, PageHeader } from "../_ui/prototipo-ui";
import { Vacio } from "../_ui/estados";

export type HeroMeta = { targetDeals: number; achievedDeals: number } | null;
export type BrokerMetaFila = {
  userId: number;
  fullName: string;
  level: BrokerLevel;
  targetDeals: number;
  achievedDeals: number;
};
export type MesMetaFila = { month: number; targetDeals: number; achievedDeals: number };
export type OpcionPeriodo = { value: string; label: string };

const MESES_CORTOS = ["E", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"];

/**
 * M8 · Metas (F3, issue #30). `goals` real en vez del mock: la meta de la
 * compañía o la del propio broker según el alcance (`esVistaCompleta`), la
 * tabla por broker filtrada en el servidor y el gráfico anual con altura
 * relativa al mes de mayor cierre — nunca el `* 8` fijo del prototipo, que
 * en un mes de más de 15 negocios se saldría del panel.
 */
export function MetasVista({
  periodo,
  opcionesPeriodo,
  esVistaCompleta,
  puedeEditar,
  heroMeta,
  brokers,
  filasDelAnio,
}: {
  periodo: { year: number; month: number };
  opcionesPeriodo: OpcionPeriodo[];
  esVistaCompleta: boolean;
  puedeEditar: boolean;
  heroMeta: HeroMeta;
  brokers: BrokerMetaFila[];
  filasDelAnio: MesMetaFila[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [editandoCompania, setEditandoCompania] = useState(false);
  const [editandoBroker, setEditandoBroker] = useState<BrokerMetaFila | null>(null);

  const periodoActual = formatoPeriodo(periodo);
  const porcentajeHero = heroMeta ? cumplimientoPorcentaje(heroMeta.achievedDeals, heroMeta.targetDeals) : null;
  const maxAnual = Math.max(1, ...filasDelAnio.map((fila) => fila.achievedDeals));

  return (
    <>
      <PageHeader
        eyebrow="C8 · Rendimiento"
        title={esVistaCompleta ? "Metas y desempeño" : "Mis metas"}
        subtitle="Cierres del pipeline contra los objetivos mensuales."
        action={
          <select
            className="header-select"
            value={periodoActual}
            onChange={(event) => router.push(`${pathname}?periodo=${event.target.value}`)}
          >
            {opcionesPeriodo.map((opcion) => (
              <option key={opcion.value} value={opcion.value}>
                {opcion.label}
              </option>
            ))}
          </select>
        }
      />
      <div className="goal-hero">
        <div className="goal-ring" style={{ "--progress": `${porcentajeHero ?? 0}%` } as React.CSSProperties}>
          <strong>{porcentajeHero === null ? "—" : `${porcentajeHero}%`}</strong>
        </div>
        <div>
          <p className="eyebrow">{esVistaCompleta ? "Meta del negocio" : "Meta personal"}</p>
          {heroMeta && porcentajeHero !== null ? (
            <>
              <h2>
                {heroMeta.achievedDeals} de {heroMeta.targetDeals} negocios logrados
              </h2>
              <p>Los cierres alimentan esta meta automáticamente, sin doble captura.</p>
            </>
          ) : (
            <>
              <h2>Sin meta fijada</h2>
              <p>Todavía no hay una meta de negocios para este periodo.</p>
            </>
          )}
          {puedeEditar && esVistaCompleta && (
            <button className="button secondary" type="button" onClick={() => setEditandoCompania(true)}>
              Editar meta de la compañía
            </button>
          )}
        </div>
      </div>
      <div className="performance-grid">
        <div className="table-wrap">
          {brokers.length === 0 ? (
            <Vacio titulo="Sin brokers todavía" texto="No hay brokers activos con perfil para este alcance." />
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Broker</th>
                  <th>Meta</th>
                  <th>Logrados</th>
                  <th>Cumplimiento</th>
                  <th>Nivel</th>
                  {puedeEditar && <th></th>}
                </tr>
              </thead>
              <tbody>
                {brokers.map((broker) => {
                  const porcentaje = cumplimientoPorcentaje(broker.achievedDeals, broker.targetDeals);
                  return (
                    <tr key={broker.userId}>
                      <td>
                        <span className="table-person">
                          <Avatar name={broker.fullName} small />
                          <strong>{broker.fullName}</strong>
                        </span>
                      </td>
                      <td>{broker.targetDeals}</td>
                      <td>{broker.achievedDeals}</td>
                      <td>
                        {porcentaje === null ? (
                          <small>Sin meta</small>
                        ) : (
                          <>
                            <div className="table-progress">
                              <span style={{ width: `${Math.min(porcentaje, 100)}%` }} />
                            </div>
                            <small>{porcentaje}%</small>
                          </>
                        )}
                      </td>
                      <td>
                        <Badge tone={broker.level === "top_producer" || broker.level === "top_leader" ? "gold" : "blue"}>
                          {BROKER_LEVEL_LABELS[broker.level]}
                        </Badge>
                      </td>
                      {puedeEditar && (
                        <td className="table-actions">
                          <button
                            className="icon-button"
                            type="button"
                            onClick={() => setEditandoBroker(broker)}
                            aria-label={`Editar meta de ${broker.fullName}`}
                          >
                            ✎
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
        <div className="panel annual-chart">
          <h2>Cierres por mes</h2>
          <div className="bar-chart">
            {filasDelAnio.map((fila) => (
              <div key={fila.month}>
                <i
                  style={{ height: `${Math.round((fila.achievedDeals / maxAnual) * 120)}px` }}
                  className={esMetaCumplida(fila.achievedDeals, fila.targetDeals) ? "hit" : ""}
                />
                <span>{MESES_CORTOS[fila.month - 1]}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      {editandoCompania && (
        <FormularioMeta
          titulo="Editar meta de la compañía"
          brokerId={null}
          anio={periodo.year}
          mes={periodo.month}
          targetDeals={heroMeta?.targetDeals ?? 0}
          onClose={() => setEditandoCompania(false)}
        />
      )}
      {editandoBroker && (
        <FormularioMeta
          titulo={`Editar meta — ${editandoBroker.fullName}`}
          brokerId={editandoBroker.userId}
          anio={periodo.year}
          mes={periodo.month}
          targetDeals={editandoBroker.targetDeals}
          onClose={() => setEditandoBroker(null)}
        />
      )}
    </>
  );
}

function FormularioMeta({
  titulo,
  brokerId,
  anio,
  mes,
  targetDeals,
  onClose,
}: {
  titulo: string;
  brokerId: number | null;
  anio: number;
  mes: number;
  targetDeals: number;
  onClose: () => void;
}) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [enviando, setEnviando] = useState(false);
  const [errores, setErrores] = useState<Record<string, string>>({});

  async function enviar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!formRef.current) return;
    setEnviando(true);
    setErrores({});

    const form = new FormData(formRef.current);
    const datos = {
      brokerId,
      year: anio,
      month: mes,
      targetDeals: Number(form.get("targetDeals")),
    };
    const respuesta = await fetch("/api/metas", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(datos),
    });
    const cuerpo = await respuesta.json().catch(() => ({}));
    setEnviando(false);

    if (!respuesta.ok) {
      setErrores(cuerpo.fields ?? { _: cuerpo.error ?? "No se pudo guardar la meta." });
      return;
    }

    router.refresh();
    onClose();
  }

  return (
    <Modal title={titulo} onClose={onClose}>
      <form className="form-grid" ref={formRef} onSubmit={enviar}>
        <label className="span-2">
          Meta de negocios del mes
          <input name="targetDeals" type="number" min="0" required defaultValue={targetDeals} autoFocus />
          {errores.targetDeals && <small style={{ color: "#b42318" }}>{errores.targetDeals}</small>}
        </label>
        {errores._ && <small style={{ color: "#b42318" }}>{errores._}</small>}
        <div className="form-actions span-2">
          <button className="button" type="button" onClick={onClose}>
            Cancelar
          </button>
          <button className="button primary" type="submit" disabled={enviando}>
            {enviando ? "Guardando…" : "Guardar"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
