"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { PERMISSION_ACTIONS, PERMISSION_RESOURCES, PERMISSION_SCOPES } from "@/domain/catalogs";
import type { RolOpcion } from "./_usuarios";

export type PermisoCelda = { resource: string; action: string; scope: string };

const ETIQUETAS_RECURSO: Record<string, string> = {
  dashboard: "Panel de inicio",
  leads: "Leads",
  contacts: "Contactos",
  deals: "Negocios",
  activities: "Actividades",
  projects: "Propiedades",
  units: "Unidades",
  unit_real_price: "Precio real de unidades",
  construction_phases: "Avances de obra",
  brokers: "Brokers",
  academy: "Academy",
  goals: "Metas",
  commissions: "Comisiones",
  communications: "Comunicaciones",
  reports: "Reportes",
  global_metrics: "Métricas globales",
  settings: "Configuración",
  users: "Usuarios",
  roles: "Roles",
  audit_log: "Auditoría",
  integrations: "Integraciones",
};

const ETIQUETAS_ACCION: Record<string, string> = {
  view: "Ver",
  create: "Crear",
  edit: "Editar",
  delete: "Eliminar",
  import: "Importar",
  export: "Exportar",
};

const ETIQUETAS_ALCANCE: Record<string, string> = {
  none: "Ninguno",
  own: "Propio",
  team: "Equipo",
  all: "Todos",
};

function clave(resource: string, action: string): string {
  return `${resource}:${action}`;
}

/**
 * M13 · Permisos — la matriz real (decisión #27), no las 8 casillas del
 * prototipo: una fila por recurso, una columna por acción, y en cada celda
 * el alcance. El rol administrador se ve pero no se edita (R10, §10.4) — el
 * servidor lo bloquearía de todas formas (`api/roles/[id]/permisos`), esto
 * solo evita el viaje de ida y vuelta.
 */
export function PermisosPanel({
  roles,
  rolSeleccionado,
  permisos,
  puedeEditar,
}: {
  roles: RolOpcion[];
  rolSeleccionado: RolOpcion | null;
  permisos: PermisoCelda[];
  puedeEditar: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [matriz, setMatriz] = useState<Record<string, string>>(() =>
    Object.fromEntries(permisos.map((p) => [clave(p.resource, p.action), p.scope])),
  );
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const soloLectura = !puedeEditar || Boolean(rolSeleccionado?.isProtected);

  function irARol(rolId: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", "permisos");
    params.set("rol", String(rolId));
    router.push(`${pathname}?${params.toString()}`);
  }

  function cambiarCelda(resource: string, action: string, scope: string) {
    setMatriz((actual) => ({ ...actual, [clave(resource, action)]: scope }));
  }

  async function guardar() {
    if (!rolSeleccionado) return;
    setGuardando(true);
    setError(null);
    const celdas = PERMISSION_RESOURCES.flatMap((resource) =>
      PERMISSION_ACTIONS.map((action) => ({ resource, action, scope: matriz[clave(resource, action)] ?? "none" })).filter((c) => c.scope !== "none"),
    );
    const respuesta = await fetch(`/api/roles/${rolSeleccionado.id}/permisos`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ permisos: celdas }),
    });
    setGuardando(false);
    if (!respuesta.ok) {
      const cuerpo = await respuesta.json().catch(() => ({}));
      setError(cuerpo.error ?? "No se pudieron guardar los permisos.");
      return;
    }
    router.refresh();
  }

  return (
    <>
      <div className="panel-title">
        <div>
          <p className="eyebrow">RBAC</p>
          <h2>Permisos por rol</h2>
        </div>
        {puedeEditar && !soloLectura && (
          <button className="button primary" type="button" onClick={() => void guardar()} disabled={guardando}>
            {guardando ? "Guardando…" : "Guardar cambios"}
          </button>
        )}
      </div>
      <div className="segmented">
        {roles.map((rol) => (
          <button key={rol.id} className={rol.id === rolSeleccionado?.id ? "active" : ""} type="button" onClick={() => irARol(rol.id)}>
            {rol.name}
          </button>
        ))}
      </div>
      {soloLectura && (
        <div className="permission-note">
          <strong>{rolSeleccionado?.isProtected ? "Protección del rol administrador" : "Sin permiso para editar"}</strong>
          <p>
            {rolSeleccionado?.isProtected
              ? "Los permisos del administrador no se pueden modificar."
              : "Tu rol no tiene permiso para cambiar la configuración de permisos."}
          </p>
        </div>
      )}
      {error && (
        <div className="permission-note" role="alert">
          <strong>No se pudo guardar</strong>
          <p>{error}</p>
        </div>
      )}
      <div className="table-wrap">
        <table className="permission-table">
          <thead>
            <tr>
              <th>Recurso</th>
              {PERMISSION_ACTIONS.map((accion) => (
                <th key={accion}>{ETIQUETAS_ACCION[accion]}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {PERMISSION_RESOURCES.map((recurso) => (
              <tr key={recurso}>
                <td>{ETIQUETAS_RECURSO[recurso] ?? recurso}</td>
                {PERMISSION_ACTIONS.map((accion) => (
                  <td key={accion}>
                    <select
                      value={matriz[clave(recurso, accion)] ?? "none"}
                      disabled={soloLectura}
                      onChange={(e) => cambiarCelda(recurso, accion, e.target.value)}
                      aria-label={`${ETIQUETAS_RECURSO[recurso] ?? recurso} · ${ETIQUETAS_ACCION[accion]}`}
                    >
                      {PERMISSION_SCOPES.map((alcance) => (
                        <option key={alcance} value={alcance}>
                          {ETIQUETAS_ALCANCE[alcance]}
                        </option>
                      ))}
                    </select>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
