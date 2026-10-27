"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useRef, useState, useMemo } from "react";
import {
  Lock,
  ShieldCheck,
  Search,
  CheckCircle2,
  AlertTriangle,
  Info,
} from "lucide-react";
import { crearEnvioUnico } from "./envio";
import { PERMISSION_ACTIONS, PERMISSION_RESOURCES, PERMISSION_SCOPES } from "@/domain/catalogs";
import type { RolOpcion } from "./_usuarios";
import { ResponsivePermissionMatrix } from "@/components/modulo/responsive-permission-matrix";

export type PermisoCelda = { resource: string; action: string; scope: string };

export const ETIQUETAS_RECURSO: Record<string, string> = {
  dashboard: "Panel de inicio",
  leads: "Leads comerciales",
  contacts: "Contactos",
  deals: "Negocios",
  activities: "Actividades y agenda",
  projects: "Propiedades y proyectos",
  units: "Unidades residenciales",
  unit_real_price: "Precio real de unidades",
  construction_phases: "Avances de obra",
  brokers: "Brokers y asesores",
  academy: "Academy y capacitación",
  goals: "Metas comerciales",
  commissions: "Comisiones",
  communications: "Comunicaciones",
  reports: "Reportes BI",
  global_metrics: "Métricas globales",
  settings: "Configuración y gobernanza",
  users: "Usuarios",
  roles: "Roles del sistema",
  audit_log: "Auditoría de eventos",
  integrations: "Integraciones",
};

export const ETIQUETAS_ACCION: Record<string, string> = {
  view: "Ver",
  create: "Crear",
  edit: "Editar",
  delete: "Eliminar",
  import: "Importar",
  export: "Exportar",
};

const ESTILO_DEFAULT = { label: "Ninguno", bg: "#F1F5F9", color: "#64748B", border: "#CBD5E1" };

const ETIQUETAS_ALCANCE: Record<string, { label: string; bg: string; color: string; border: string }> = {
  none: ESTILO_DEFAULT,
  own: { label: "Propio", bg: "#EFF6FF", color: "#1D4ED8", border: "#BFDBFE" },
  team: { label: "Equipo", bg: "#F5F3FF", color: "#6D28D9", border: "#DDD6FE" },
  all: { label: "Todos", bg: "#ECFDF5", color: "#047857", border: "#A7F3D0" },
};

function clave(resource: string, action: string): string {
  return `${resource}:${action}`;
}

export function PermisosPanel({
  roles,
  rolSeleccionado,
  permisos,
  puedeEditar,
  onSelectRole,
}: {
  roles: RolOpcion[];
  rolSeleccionado: RolOpcion | null;
  permisos: PermisoCelda[];
  puedeEditar: boolean;
  onSelectRole?: (id: number) => void;
}) {
  const router = useRouter();
  const enviarUnico = useRef(crearEnvioUnico()).current;
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [matriz, setMatriz] = useState<Record<string, string>>(() =>
    Object.fromEntries(permisos.map((p) => [clave(p.resource, p.action), p.scope])),
  );
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exito, setExito] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState("");

  const esProtegido = Boolean(rolSeleccionado?.isProtected);
  const soloLectura = !puedeEditar || esProtegido;

  function irARol(rolId: number) {
    if (onSelectRole) { onSelectRole(rolId); return; }
    setError(null);
    setExito(null);
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", "permisos");
    params.set("rol", String(rolId));
    router.push(`${pathname}?${params.toString()}`);
  }

  function cambiarCelda(resource: string, action: string, scope: string) {
    if (soloLectura) return;
    setMatriz((actual) => ({ ...actual, [clave(resource, action)]: scope }));
  }

  async function guardar() {
    if (!rolSeleccionado || soloLectura) return;
    await enviarUnico(async () => {
      setError(null); setExito(null);
      if (!navigator.onLine) { setError("Sin conexión. Conéctate para guardar los permisos."); return; }
      setGuardando(true);
      const celdas = PERMISSION_RESOURCES.flatMap((resource) => PERMISSION_ACTIONS.map((action) => ({ resource, action, scope: matriz[clave(resource, action)] ?? "none" })).filter((c) => c.scope !== "none"));
      try {
        const respuesta = await fetch(`/api/roles/${rolSeleccionado.id}/permisos`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ permisos: celdas }) });
        if (!respuesta.ok) {
          const cuerpo = await respuesta.json().catch(() => ({}));
          setError(respuesta.status === 403 ? "No tienes permiso para modificar este rol." : cuerpo.error ?? "No se pudieron guardar los permisos."); return;
        }
        setExito(`Permisos del rol «${rolSeleccionado.name}» actualizados.`); router.refresh();
      } catch { setError("Error de red. No se guardaron los permisos; vuelve a intentarlo."); }
      finally { setGuardando(false); }
    });
  }

  const recursosFiltrados = useMemo(() => {
    return PERMISSION_RESOURCES.filter((rec) => {
      if (!busqueda.trim()) return true;
      const etiqueta = (ETIQUETAS_RECURSO[rec] ?? rec).toLowerCase();
      return etiqueta.includes(busqueda.toLowerCase()) || rec.toLowerCase().includes(busqueda.toLowerCase());
    });
  }, [busqueda]);

  const permisosActivosConteo = useMemo(() => {
    return Object.values(matriz).filter((s) => s && s !== "none").length;
  }, [matriz]);

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px", marginBottom: "16px" }}>
        <div>
          <p className="eyebrow" style={{ margin: "0 0 4px", fontSize: "12px" }}>Gobernanza RBAC</p>
          <h2 style={{ margin: 0, fontSize: "22px", fontWeight: 800, color: "var(--navy-950)" }}>
            Matriz de Permisos por Rol
          </h2>
          <p style={{ margin: "4px 0 0", fontSize: "14px", color: "var(--muted)" }}>
            Control exhaustivo de visibilidad, creación, modificación y eliminación por recurso y alcance.
          </p>
        </div>
        {puedeEditar && !soloLectura && (
          <button
            className="button primary"
            type="button"
            onClick={() => void guardar()}
            disabled={guardando}
            style={{
              minHeight: "44px",
              padding: "10px 20px",
              fontSize: "13px",
              fontWeight: 700,
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            {guardando ? "Guardando cambios…" : "Guardar Matriz de Permisos"}
          </button>
        )}
      </div>

      {/* Selector de Roles */}
      <div
        className="segmented"
        style={{
          display: "flex",
          gap: "8px",
          flexWrap: "wrap",
          padding: "6px",
          background: "#F8FAFC",
          borderRadius: "10px",
          border: "1px solid var(--line)",
          marginBottom: "16px",
        }}
      >
        {roles.map((rol) => {
          const esActivo = rol.id === rolSeleccionado?.id;
          return (
            <button
              key={rol.id}
              type="button"
              onClick={() => irARol(rol.id)}
              style={{
                minHeight: "44px",
                padding: "8px 16px",
                borderRadius: "8px",
                border: esActivo ? "1px solid var(--gold-600)" : "1px solid transparent",
                background: esActivo ? "var(--navy-950)" : "transparent",
                color: esActivo ? "#FFFFFF" : "var(--ink)",
                fontWeight: esActivo ? 800 : 600,
                fontSize: "13px",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                transition: "all 140ms ease",
              }}
            >
              {rol.isProtected && <Lock size={14} color={esActivo ? "var(--gold-500)" : "#94A3B8"} />}
              <span>{rol.name}</span>
            </button>
          );
        })}
      </div>

      {/* Nota de Protección / Solo Lectura */}
      {esProtegido && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            padding: "14px 16px",
            borderRadius: "10px",
            background: "#FEF9C3",
            border: "1px solid #FDE047",
            color: "#854D0E",
            marginBottom: "16px",
            fontSize: "13px",
          }}
        >
          <Lock size={20} className="shrink-0" />
          <div>
            <strong style={{ display: "block", fontSize: "14px" }}>
              Rol Protegido por el Sistema ({rolSeleccionado?.name})
            </strong>
            <span>
              Este rol cuenta con credencial irrestricta de máxima jerarquía. Por salvaguarda de seguridad, sus permisos están blindados con candados inmutables.
            </span>
          </div>
        </div>
      )}

      {!puedeEditar && !esProtegido && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            padding: "14px 16px",
            borderRadius: "10px",
            background: "#EFF6FF",
            border: "1px solid #BFDBFE",
            color: "#1E40AF",
            marginBottom: "16px",
            fontSize: "13px",
          }}
        >
          <Info size={20} className="shrink-0" />
          <span>Tu rol cuenta con alcance de auditoría (sólo lectura) sobre esta matriz.</span>
        </div>
      )}

      {/* Notificaciones Accesibles */}
      {error && (
        <div
          role="alert"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            padding: "12px 16px",
            borderRadius: "8px",
            background: "#FEF2F2",
            border: "1px solid #FCA5A5",
            color: "#991B1B",
            marginBottom: "16px",
            fontSize: "13px",
          }}
        >
          <AlertTriangle size={18} />
          <span>{error}</span>
        </div>
      )}

      {exito && (
        <div
          role="status"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            padding: "12px 16px",
            borderRadius: "8px",
            background: "#ECFDF5",
            border: "1px solid #6EE7B7",
            color: "#065F46",
            marginBottom: "16px",
            fontSize: "13px",
          }}
        >
          <CheckCircle2 size={18} />
          <span>{exito}</span>
        </div>
      )}

      {/* Buscador de Recursos y Contador de Permisos */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "12px",
          marginBottom: "14px",
        }}
      >
        <div style={{ position: "relative", minWidth: 0, flex: "1 1 300px" }}>
          <Search size={16} style={{ position: "absolute", left: "14px", top: "14px", color: "var(--muted)" }} />
          <input
            type="search"
            placeholder="Filtrar por recurso (ej. leads, academy, reportes)…"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            style={{
              minHeight: "44px",
              paddingLeft: "40px",
              fontSize: "13px",
              borderRadius: "8px",
              border: "1px solid var(--line)",
            }}
          />
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "var(--muted)" }}>
          <ShieldCheck size={16} color="var(--gold-700)" />
          <span>
            Permisos activos en <strong>{rolSeleccionado?.name}</strong>: <strong>{permisosActivosConteo}</strong>
          </span>
        </div>
      </div>

      {/* Matriz Visual RBAC */}
      {!rolSeleccionado && <p role="status">No hay roles disponibles para configurar.</p>}
      <ResponsivePermissionMatrix
        resources={recursosFiltrados}
        actions={PERMISSION_ACTIONS}
        resourceLabels={ETIQUETAS_RECURSO}
        actionLabels={ETIQUETAS_ACCION}
        renderCell={(recurso, accion) => {
          const valorActual = matriz[clave(recurso, accion)] ?? "none";
          const infoEstilo = ETIQUETAS_ALCANCE[valorActual] ?? ESTILO_DEFAULT;

          if (soloLectura) {
            return (
              <div
                className="flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border px-3 text-[13px] font-semibold"
                style={{
                  background: esProtegido ? "#FEF9C3" : infoEstilo.bg,
                  borderColor: esProtegido ? "#FDE047" : infoEstilo.border,
                  color: esProtegido ? "#854D0E" : infoEstilo.color,
                }}
                title={esProtegido ? "Celda protegida: acceso total irrestricto de administrador" : "Lectura bloqueada"}
              >
                <Lock size={14} aria-hidden="true" />
                <span>{esProtegido ? "Todos" : infoEstilo.label}</span>
              </div>
            );
          }

          return (
            <select
              value={valorActual}
              disabled={guardando}
              onChange={(e) => cambiarCelda(recurso, accion, e.target.value)}
              aria-label={`${ETIQUETAS_RECURSO[recurso] ?? recurso} - ${ETIQUETAS_ACCION[accion]}`}
              className="min-h-11 w-full min-w-0 rounded-lg border px-2 text-[13px] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-700 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              style={{
                background: infoEstilo.bg,
                color: infoEstilo.color,
                borderColor: infoEstilo.border,
              }}
            >
              {PERMISSION_SCOPES.map((alcance) => (
                <option key={alcance} value={alcance}>
                  {ETIQUETAS_ALCANCE[alcance]?.label ?? alcance}
                </option>
              ))}
            </select>
          );
        }}
      />
    </>
  );
}
