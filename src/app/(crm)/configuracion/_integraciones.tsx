"use client";
import { ProveedoresActivos, type EstadoProveedor } from "./_proveedores";
import { describirEstadoOutbox, type EstadoOutbox } from "@/application/compartido/outbox-estado";
import type { PresenciaIntegraciones } from "@/application/configuracion/integraciones-catalogo";
import { CentroIntegraciones } from "./centro-integraciones";
export type IntegracionFila = { id: number; provider: string; status: string; lastSyncedAt: Date | null };
export function IntegracionesPanel({ integraciones, estadoOutbox = null, presencias, puedeEditar = false, proveedores = [] }: { integraciones: IntegracionFila[]; estadoOutbox?: EstadoOutbox | null; presencias?: PresenciaIntegraciones; puedeEditar?: boolean; proveedores?: EstadoProveedor[] }) {
  return <div className="grid gap-4">{proveedores.length > 0 && <ProveedoresActivos estado={proveedores} />}<CentroIntegraciones integraciones={integraciones} presencias={presencias} puedeEditar={puedeEditar} /><section className="rounded-xl border border-line bg-surface-alt p-4"><h3 className="font-bold">Eventos del outbox</h3><p>{describirEstadoOutbox(estadoOutbox)}</p><a href="/automatizaciones" className="inline-flex min-h-12 items-center rounded-lg border border-line px-3">Abrir monitor</a><p>Réplica CRM actual: adaptador local de consola. Exportar ICS o abrir WhatsApp por enlace no acredita conexión con el proveedor.</p></section></div>;
}
