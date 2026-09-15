"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { PageHeader } from "../_ui/prototipo-ui";
import { UsuariosPanel, type RolOpcion, type UsuarioFila } from "./_usuarios";
import { PermisosPanel, type PermisoCelda } from "./_permisos";
import { EtapasPanel, type EtapaFila } from "./_etapas";
import { CatalogosPanel, type CatalogoFila } from "./_catalogos";
import { PapeleraPanel, type PapeleraFila } from "./_papelera";
import { IntegracionesPanel, type IntegracionFila } from "./_integraciones";

export type Tab = "usuarios" | "permisos" | "etapas" | "catalogos" | "papelera" | "integraciones";

const ETIQUETAS_TAB: Record<Tab, string> = {
  usuarios: "Usuarios y roles",
  permisos: "Permisos",
  etapas: "Etapas del pipeline",
  catalogos: "Catálogos",
  papelera: "Papelera",
  integraciones: "Integraciones",
};

/**
 * M13 · Configuración (F2). Solo el shell y la navegación por pestaña — cada
 * panel es su propio componente porque cada uno tiene su propio formulario y
 * su propio estado local, y mezclarlos en un archivo de 700 líneas es más
 * difícil de revisar que seis archivos de 100.
 *
 * Las cuatro pestañas que el prototipo tenía y que no le tocan a M13 (Metas,
 * Comisiones, Plantillas de WhatsApp, Marca — `docs/F2_ANALISIS_Y_PLAN.md`
 * §4.3) ya no aparecen en la barra: no hay nada que mostrar en ellas todavía,
 * y un tab vacío con "listo para configurar" no es más honesto que no tenerlo.
 */
export function ConfiguracionVista(props: {
  tab: Tab;
  puedeEditar: boolean;
  usuarios?: { lista: UsuarioFila[]; roles: RolOpcion[] };
  permisos?: { roles: RolOpcion[]; rolSeleccionado: RolOpcion | null; permisos: PermisoCelda[] };
  etapas?: EtapaFila[];
  catalogos?: { motivos: CatalogoFila[]; canales: CatalogoFila[] };
  papelera?: PapeleraFila[];
  integraciones?: IntegracionFila[];
}) {
  const { tab, puedeEditar } = props;
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
    <>
      <PageHeader
        eyebrow="C14 · Administración"
        title="Configuración y permisos"
        subtitle="Controla quién puede ver y modificar cada área."
      />
      <div className="settings-layout">
        <nav className="settings-nav">
          {(Object.keys(ETIQUETAS_TAB) as Tab[]).map((item) => (
            <button className={tab === item ? "active" : ""} onClick={() => irATab(item)} key={item} type="button">
              {ETIQUETAS_TAB[item]}
            </button>
          ))}
        </nav>
        <section className="panel settings-content">
          {tab === "usuarios" && props.usuarios && <UsuariosPanel {...props.usuarios} puedeEditar={puedeEditar} />}
          {tab === "permisos" && props.permisos && <PermisosPanel {...props.permisos} puedeEditar={puedeEditar} />}
          {tab === "etapas" && props.etapas && <EtapasPanel etapas={props.etapas} puedeEditar={puedeEditar} />}
          {tab === "catalogos" && props.catalogos && <CatalogosPanel {...props.catalogos} puedeEditar={puedeEditar} />}
          {tab === "papelera" && props.papelera && <PapeleraPanel filas={props.papelera} puedeEditar={puedeEditar} />}
          {tab === "integraciones" && props.integraciones && <IntegracionesPanel integraciones={props.integraciones} />}
        </section>
      </div>
    </>
  );
}
