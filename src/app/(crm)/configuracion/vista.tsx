"use client";

import { useState } from "react";
import { stageOrder } from "../_ui/datos-muestra";
import { Badge, PageHeader } from "../_ui/prototipo-ui";
import { Vacio } from "../_ui/estados";

/**
 * ponytail: datos de muestra portados de `referencia-prototipo/app/page.tsx`
 * (`SettingsView` + `IntegrationCenter`). M13 · Configuración se construye en
 * F2 (`docs/F1_ANALISIS_Y_PLAN.md`); la tabla de permisos aquí es una maqueta
 * visual — el permiso real se decide en servidor con `permissions` y
 * `scopeFor` del dominio (`src/domain/rbac.ts`), nunca con este toggle de
 * cliente (criterio de terminado #1).
 */
const tabs = [
  "Usuarios y roles",
  "Etapas del pipeline",
  "Metas",
  "Comisiones",
  "Plantillas de WhatsApp",
  "Integraciones",
  "Marca",
];

const permissionLabels = ["Leads", "Contactos", "Pipeline", "Propiedades", "Precios reales", "Métricas globales", "Comisiones", "Configuración"];

const integrations = [
  { name: "Google Calendar", status: "Disponible", tone: "green" as const, text: "Cada cita puede abrirse en Google Calendar y toda la agenda puede exportarse como archivo .ics.", action: "Usar desde Agenda" },
  { name: "WhatsApp Business", status: "Activo", tone: "green" as const, text: "El CRM abre conversaciones desde la ficha del lead y aplica plantillas con contexto.", action: "Click-to-chat" },
  { name: "YouTube", status: "Preparado", tone: "gold" as const, text: "Los proyectos y avances aceptan URL de video. Falta guardar y validar el contenido en el backend.", action: "Enlace manual" },
  { name: "Zoom / Google Meet", status: "Preparado", tone: "gold" as const, text: "La agenda puede almacenar enlaces de reunión cuando exista persistencia de citas.", action: "Enlace manual" },
  { name: "Meta Lead Ads", status: "Fase siguiente", tone: "neutral" as const, text: "Requiere webhook, validación de firma, consentimiento y reglas de asignación.", action: "Requiere backend" },
  { name: "Google Calendar 2 vías", status: "Fase siguiente", tone: "neutral" as const, text: "Requiere usuarios reales, OAuth 2.0, almacenamiento cifrado de tokens y webhooks HTTPS.", action: "Requiere OAuth" },
];

function IntegrationCenter() {
  return (
    <>
      <p className="eyebrow">Conectividad</p>
      <h2>Integraciones</h2>
      <p className="section-intro">
        Capacidades activas hoy y conexiones preparadas para la fase con autenticación y base de datos.
      </p>
      <div className="integration-grid">
        {integrations.map((integration) => (
          <article className="integration-card" key={integration.name}>
            <div>
              <strong>{integration.name}</strong>
              <Badge tone={integration.tone}>{integration.status}</Badge>
            </div>
            <p>{integration.text}</p>
            <small>{integration.action}</small>
          </article>
        ))}
      </div>
      <div className="integration-guard">
        <strong>Seguridad primero</strong>
        <p>
          La sincronización bidireccional se habilita después de implementar identidad real, permisos de servidor y
          almacenamiento cifrado. No se guardarán tokens OAuth en el navegador.
        </p>
      </div>
    </>
  );
}

export function ConfiguracionVista() {
  const [tab, setTab] = useState("Usuarios y roles");
  const [permissions, setPermissions] = useState([
    [true, true, true],
    [true, true, false],
    [true, false, true],
    [true, false, true],
    [true, false, false],
    [true, false, false],
    [true, false, false],
    [true, false, false],
  ]);

  function togglePermission(row: number, column: number) {
    if (column === 0) return;
    setPermissions((current) =>
      current.map((values, rowIndex) =>
        rowIndex === row ? values.map((value, columnIndex) => (columnIndex === column ? !value : value)) : values,
      ),
    );
  }

  return (
    <>
      <PageHeader
        eyebrow="C14 · Administración"
        title="Configuración y permisos"
        subtitle="Controla quién puede ver y modificar cada área."
        action={
          <button className="button primary" type="button">
            Guardar cambios
          </button>
        }
      />
      <div className="settings-layout">
        <nav className="settings-nav">
          {tabs.map((item) => (
            <button className={tab === item ? "active" : ""} onClick={() => setTab(item)} key={item} type="button">
              {item}
            </button>
          ))}
        </nav>
        <section className="panel settings-content">
          {tab === "Usuarios y roles" ? (
            <>
              <div className="panel-title">
                <div>
                  <p className="eyebrow">RBAC</p>
                  <h2>Usuarios y roles</h2>
                </div>
                <button className="button secondary" type="button">
                  Invitar usuario
                </button>
              </div>
              <div className="table-wrap">
                <table className="permission-table">
                  <thead>
                    <tr>
                      <th>Módulo o dato</th>
                      <th>Administrador</th>
                      <th>Asistente</th>
                      <th>Broker</th>
                    </tr>
                  </thead>
                  <tbody>
                    {permissionLabels.map((label, row) => (
                      <tr key={label}>
                        <td>{label}</td>
                        {(permissions[row] ?? []).map((value, column) => (
                          <td key={column}>
                            <button
                              className={value ? "toggle on" : "toggle"}
                              aria-label={`${label} ${value ? "permitido" : "bloqueado"}`}
                              aria-pressed={value}
                              disabled={column === 0}
                              onClick={() => togglePermission(row, column)}
                              type="button"
                            >
                              <span />
                            </button>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="permission-note">
                <strong>Protección del perfil Broker</strong>
                <p>No puede ver métricas globales, precios reales ni datos de otros brokers.</p>
              </div>
            </>
          ) : tab === "Integraciones" ? (
            <IntegrationCenter />
          ) : (
            <>
              <p className="eyebrow">{tab}</p>
              <h2>Configuración de {tab.toLowerCase()}</h2>
              <p className="section-intro">
                Esta sección conserva el alcance definido para el CRM y permite ajustar sus valores operativos.
              </p>
              {tab === "Etapas del pipeline" && (
                <div className="stage-settings">
                  {stageOrder.map((stage, index) => (
                    <div key={stage}>
                      <span>{index + 1}</span>
                      <strong>{stage}</strong>
                      <button className="text-button" type="button">
                        Editar
                      </button>
                    </div>
                  ))}
                </div>
              )}
              {tab === "Marca" && (
                <div className="brand-settings">
                  <div>
                    <span className="swatch navy" />
                    <strong>Azul Quisqueya</strong>
                    <small>#1D2B53</small>
                  </div>
                  <div>
                    <span className="swatch gold" />
                    <strong>Oro Quisqueya</strong>
                    <small>#C7990E</small>
                  </div>
                </div>
              )}
              {!["Etapas del pipeline", "Marca"].includes(tab) && (
                <Vacio
                  titulo={`${tab} listo para configurar`}
                  texto="Los valores de demostración permanecen activos y pueden modificarse aquí."
                />
              )}
            </>
          )}
        </section>
      </div>
    </>
  );
}
