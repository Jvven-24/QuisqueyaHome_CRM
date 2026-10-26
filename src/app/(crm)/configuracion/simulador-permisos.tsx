"use client";
import { useState } from "react";
import { PERMISSION_RESOURCES, PERMISSION_ACTIONS } from "@/domain/catalogs";
import type { PermisoCelda } from "./_permisos";
export function SimuladorPermisos({ permisos, rol }: { permisos: PermisoCelda[]; rol: string }) {
  const [recurso, setRecurso] = useState<string>("deals"); const [accion, setAccion] = useState<string>("view");
  const scope = permisos.find((p) => p.resource === recurso && p.action === accion)?.scope ?? "none";
  return <details className="my-3 rounded-lg border border-line p-3 text-sm"><summary className="min-h-12 cursor-pointer py-3">Simulador «ver como» · {rol}</summary><p>Simulación local con los permisos consultados del rol. No cambia tu sesión, no concede permisos y no sustituye la autorización del servidor.</p><label>Recurso <select className="min-h-12 rounded border border-line px-3" value={recurso} onChange={(e) => setRecurso(e.target.value)}>{PERMISSION_RESOURCES.map((r) => <option key={r}>{r}</option>)}</select></label> <label>Acción <select className="min-h-12 rounded border border-line px-3" value={accion} onChange={(e) => setAccion(e.target.value)}>{PERMISSION_ACTIONS.map((a) => <option key={a}>{a}</option>)}</select></label><p role="status">Resultado del rol: {scope === "none" ? "Sin permiso" : scope === "all" ? "Alcance total" : scope === "own" ? "Sólo registros propios" : "Alcance del equipo según contrato vigente"}.</p></details>;
}
