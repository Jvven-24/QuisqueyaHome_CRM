"use client";

import { PermisosPersonales } from "./permisos-personales";
import type { PermissionAdminData } from "@/application/permisos/administracion";
import { useState } from "react";
import type { PresenciaIntegraciones } from "@/application/configuracion/integraciones-catalogo";
import { ConfiguracionAvanzada, type EventoAuditoria } from "./avanzada";
import { SimuladorPermisos } from "./simulador-permisos";
import { useOnline } from "../_ui/analytics-state";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Users,
  ShieldCheck,
  Layers,
  FolderTree,
  Trash2,
  Network,
  ChevronRight,
  ShieldAlert,
  Plug,
} from "lucide-react";
import type { EstadoOutbox } from "@/application/compartido/outbox-estado";
import { PageHeader } from "../_ui/prototipo-ui";
import { UsuariosPanel, type RolOpcion, type UsuarioFila } from "./_usuarios";
import { PermisosPanel, type PermisoCelda } from "./_permisos";
import { EtapasPanel, type EtapaFila } from "./_etapas";
import { CatalogosPanel, type CatalogoFila } from "./_catalogos";
import { PapeleraPanel, type PapeleraFila } from "./_papelera";
import { IntegracionesPanel, type IntegracionFila } from "./_integraciones";
import { ConexionesPanel, type DatosConexiones } from "./conexiones/panel";

export type Tab = "centro" | "seo" | "capacidad" | "auditoria" | "usuarios" | "permisos" | "etapas" | "catalogos" | "papelera" | "integraciones" | "conexiones";

type ItemNavegacion = {
  id: Tab;
  titulo: string;
  subtitulo: string;
  icono: React.ElementType;
};

const ITEMS_NAVEGACION: ItemNavegacion[] = [
  { id: "centro", titulo: "Centro de ajustes", subtitulo: "Buscar CFG y preparar propuestas", icono: FolderTree },
  { id: "seo", titulo: "SEO del portal", subtitulo: "Metadatos y vista previa social", icono: Network },
  { id: "capacidad", titulo: "Capacidad y costes", subtitulo: "Servicios y consumos pendientes", icono: Layers },
  { id: "auditoria", titulo: "Auditoría y salida", subtitulo: "Eventos y exportación autorizada", icono: ShieldCheck },
  {
    id: "usuarios",
    titulo: "Usuarios y roles",
    subtitulo: "Brokers, asesores y perfiles",
    icono: Users,
  },
  {
    id: "permisos",
    titulo: "Usuarios y permisos",
    subtitulo: "Matriz de acceso y candados por rol",
    icono: ShieldCheck,
  },
  {
    id: "etapas",
    titulo: "Etapas de Negocios",
    subtitulo: "Flujo comercial y probabilidades",
    icono: Layers,
  },
  {
    id: "catalogos",
    titulo: "Catálogos",
    subtitulo: "Motivos de pérdida y canales",
    icono: FolderTree,
  },
  {
    id: "papelera",
    titulo: "Papelera de reciclaje",
    subtitulo: "Recuperación de borrado lógico",
    icono: Trash2,
  },
  {
    id: "integraciones",
    titulo: "Integraciones",
    subtitulo: "Conectores externos y Outbox",
    icono: Network,
  },
  {
    id: "conexiones",
    titulo: "Conexiones",
    subtitulo: "Google, Gmail y Meta Ads por cuenta",
    icono: Plug,
  },
];

export function ConfiguracionVista(props: {
  tab: Tab;
  puedeEditar: boolean;
  accessData?: PermissionAdminData;
  puedeAdministrarAcceso?: boolean;
  puedeCrearCatalogos?: boolean;
  usuarios?: { lista: UsuarioFila[]; roles: RolOpcion[] };
  permisos?: { roles: RolOpcion[]; rolSeleccionado: RolOpcion | null; permisos: PermisoCelda[] };
  etapas?: EtapaFila[];
  catalogos?: { motivos: CatalogoFila[]; canales: CatalogoFila[] };
  papelera?: PapeleraFila[];
  integraciones?: IntegracionFila[];
  estadoOutbox?: EstadoOutbox | null;
  presencias?: PresenciaIntegraciones;
  proveedores?: import("./_proveedores").EstadoProveedor[];
  auditoria?: EventoAuditoria[];
  puedeExportarAuditoria?: boolean;
  conexiones?: DatosConexiones;
}) {
  const { tab, puedeEditar } = props;
  const online = useOnline();
  const [busqueda, setBusqueda] = useState("");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function irATab(nuevoTab: Tab) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", nuevoTab);
    if (nuevoTab !== "permisos") params.delete("rol");
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div style={{ width: "100%", maxWidth: "1400px", minWidth: 0, margin: "0 auto" }}>
      {!online && <p role="status">Sin conexión. Consulta los datos cargados y vuelve a conectarte antes de guardar.</p>}
      <PageHeader
        eyebrow="Administración & Gobernanza"
        title="Configuración del Sistema"
        subtitle="Administra la estructura operativa, matriz RBAC de permisos, flujo de etapas y recuperación lógica."
      />

      {/* Layout con Navegación Lateral Interna */}
      <div
        className={tab === "conexiones" ? "settings-layout grid-cols-1 lg:grid-cols-[320px_minmax(0,1fr)]" : "settings-layout"}
        style={{
          display: "grid",
          gridTemplateColumns: tab === "conexiones" ? undefined : "repeat(auto-fit, minmax(min(100%, 280px), 1fr))",
          gap: "24px",
          marginTop: "20px",
          alignItems: "start",
        }}
      >
        {/* Barra Lateral Interna de Secciones */}
        <nav
          className="settings-nav"
          aria-label="Secciones de configuración"
          style={{
            background: "var(--surface)",
            border: "1px solid var(--line)",
            borderRadius: "14px",
            padding: "8px",
            minWidth: 0,
            boxShadow: "var(--shadow-card)",
            display: "grid",
            gap: "6px",
          }}
        >
          <label className="grid gap-1 p-2 text-sm">Buscar sección<input className="min-h-12 rounded-lg border border-line px-3" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} /></label>
          {ITEMS_NAVEGACION.filter((item) => (item.titulo + " " + item.subtitulo).toLocaleLowerCase("es").includes(busqueda.toLocaleLowerCase("es"))).map((item) => {
            const Icono = item.icono;
            const esActivo = tab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => irATab(item.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "12px 14px",
                  borderRadius: "10px",
                  border: esActivo ? "1px solid var(--gold-600)" : "1px solid transparent",
                  backgroundColor: esActivo ? "var(--navy-950)" : "transparent",
                  color: esActivo ? "#FFFFFF" : "var(--ink)",
                  cursor: "pointer",
                  textAlign: "left",
                  minHeight: "48px",
                  minWidth: 0,
                  transition: "all 140ms ease",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div
                    style={{
                      width: "36px",
                      height: "36px",
                      borderRadius: "8px",
                      background: esActivo ? "rgba(255, 255, 255, 0.12)" : "#F1F5F9",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: esActivo ? "var(--gold-500)" : "var(--navy-900)",
                    }}
                  >
                    <Icono size={18} />
                  </div>
                  <div>
                    <strong style={{ display: "block", fontSize: "14px", fontWeight: 700 }}>
                      {item.titulo}
                    </strong>
                    <span
                      style={{
                        display: "block",
                        fontSize: "13px",
                        color: esActivo ? "#CBD5E1" : "var(--muted)",
                      }}
                    >
                      {item.subtitulo}
                    </span>
                  </div>
                </div>
                <ChevronRight
                  size={16}
                  style={{
                    color: esActivo ? "var(--gold-500)" : "#94A3B8",
                    opacity: esActivo ? 1 : 0.6,
                  }}
                />
              </button>
            );
          })}

          <div
            style={{
              margin: "12px 6px 6px",
              padding: "12px",
              borderRadius: "8px",
              background: "#F8FAFC",
              border: "1px solid var(--line)",
              fontSize: "13px",
              color: "var(--muted)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--navy-900)", fontWeight: 700, marginBottom: "4px" }}>
              <ShieldAlert size={15} color="var(--gold-700)" />
              <span>Gobernanza RBAC</span>
            </div>
            <span>
              {puedeEditar
                ? "Dispones de facultades de edición sobre la configuración."
                : "Modo de sólo lectura: tu rol actual puede auditar pero no alterar parámetros."}
            </span>
          </div>
        </nav>

        {/* Panel de Contenido Principal */}
        <section
          className="panel settings-content"
          style={{
            background: "var(--surface)",
            border: "1px solid var(--line)",
            borderRadius: "14px",
            padding: "clamp(12px, 3vw, 24px)",
            minWidth: 0,
            maxWidth: "100%",
            overflowWrap: "anywhere",
            boxShadow: "var(--shadow-card)",
            minHeight: "560px",
          }}
        >
          {["centro", "seo", "capacidad", "auditoria"].includes(tab) && <ConfiguracionAvanzada tab={tab} puedeEditar={puedeEditar} auditoria={props.auditoria} puedeExportar={props.puedeExportarAuditoria} />}
          {tab === "permisos" && props.permisos && <SimuladorPermisos permisos={props.permisos.permisos} rol={props.permisos.rolSeleccionado?.name ?? "Sin rol"} />}
          {tab === "usuarios" && props.usuarios && (
            <UsuariosPanel {...props.usuarios} puedeEditar={puedeEditar} />
          )}
          {tab === "permisos" && props.accessData && <PermisosPersonales data={props.accessData} puedeEditar={props.puedeAdministrarAcceso ?? false} />}
          {tab === "permisos" && props.permisos && (
            <PermisosPanel key={props.permisos.rolSeleccionado?.id ?? "sin-rol"} {...props.permisos} puedeEditar={puedeEditar} />
          )}
          {tab === "etapas" && props.etapas && (
            <EtapasPanel etapas={props.etapas} puedeEditar={puedeEditar} />
          )}
          {tab === "catalogos" && props.catalogos && (
            <CatalogosPanel {...props.catalogos} puedeEditar={puedeEditar} puedeCrear={props.puedeCrearCatalogos ?? false} />
          )}
          {tab === "papelera" && props.papelera && (
            <PapeleraPanel filas={props.papelera} puedeEditar={puedeEditar} />
          )}
          {tab === "conexiones" && props.conexiones && <ConexionesPanel datos={props.conexiones} />}
          {tab === "integraciones" && props.integraciones && (
            <IntegracionesPanel
              integraciones={props.integraciones}
              presencias={props.presencias}
              proveedores={props.proveedores}
              puedeEditar={puedeEditar}
              estadoOutbox={props.estadoOutbox ?? null}
            />
          )}
        </section>
      </div>
    </div>
  );
}
