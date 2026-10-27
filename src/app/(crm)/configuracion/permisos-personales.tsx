"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LockKeyhole, RotateCcw, ShieldCheck, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PERMISSION_ACTIONS, PERMISSION_RESOURCES, PERMISSION_SCOPES } from "@/domain/catalogs";
import type { Permission } from "@/domain/rbac";
import type { PermissionAdminData, PermissionTeam } from "@/application/permisos/administracion";
import { ETIQUETAS_ACCION, ETIQUETAS_RECURSO, PermisosPanel } from "./_permisos";

const scopes = { none: "Ninguno", own: "Propio", team: "Equipo", all: "Todo" };
const cellKey = (p: { resource: string; action: string }) => `${p.resource}:${p.action}`;

export function PermisosPersonales({ data, puedeEditar }: { data: PermissionAdminData; puedeEditar: boolean }) {
  const [tab, setTab] = useState("roles");
  const [roleId, setRoleId] = useState(data.roles.find(r => !r.isProtected)?.id ?? data.roles[0]?.id);
  const [userId, setUserId] = useState(data.users.find(u => u.roleSlug === "broker")?.id ?? data.users[0]?.id);
  const [teamId, setTeamId] = useState(data.teams[0]?.id);
  const role = data.roles.find(r => r.id === roleId) ?? null;
  const user = data.users.find(u => u.id === userId);
  const team = data.teams.find(t => t.id === teamId);
  return <div className="space-y-6 min-w-0">
    <div className="rounded-xl border border-line bg-navy-950 p-5 text-white sm:p-6">
      <div className="flex flex-wrap items-center gap-3"><ShieldCheck className="size-6 text-gold-600" /><h2 className="text-xl font-semibold">Usuarios y permisos</h2><Badge className="text-[13px] bg-white/10 text-white">Control de acceso</Badge></div>
      <p className="mt-3 max-w-3xl text-sm text-slate-200">Define el acceso de cada perfil, ajusta excepciones personales y organiza quién supervisa cada equipo.</p>
    </div>
    <div role="tablist" aria-label="Administración de acceso" className="flex flex-wrap gap-2 border-b border-line pb-3">
      {([["roles", "Por rol"], ["personas", "Por broker"], ["equipos", "Equipos y supervisores"]] as const).map(([id, label]) => <Button key={id} role="tab" aria-selected={tab === id} aria-controls={`access-${id}`} id={`tab-${id}`} variant={tab === id ? "default" : "outline"} onClick={() => setTab(id)}>{label}</Button>)}
    </div>
    {tab === "roles" && <section role="tabpanel" id="access-roles" aria-labelledby="tab-roles" className="min-w-0">
      <label className="block text-sm font-semibold mb-4">Perfil de acceso<select className="mt-2 block min-h-12 w-full rounded-md border border-line bg-surface px-3 sm:max-w-sm" value={roleId ?? ""} onChange={e => setRoleId(Number(e.target.value))}>{data.roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}</select></label>
      <PermisosPanel key={roleId} roles={data.roles} rolSeleccionado={role} permisos={data.permissions.filter(p => p.roleId === roleId)} puedeEditar={puedeEditar} onSelectRole={setRoleId} />
    </section>}
    {tab === "personas" && <section role="tabpanel" id="access-personas" aria-labelledby="tab-personas" className="space-y-4 min-w-0">
      <label className="block text-sm font-semibold">Broker o usuario<select className="mt-2 block min-h-12 w-full rounded-md border border-line bg-surface px-3 sm:max-w-md" value={userId ?? ""} onChange={e => setUserId(Number(e.target.value))}>{data.users.map(u => <option key={u.id} value={u.id}>{u.fullName} · {data.roles.find(r => r.id === u.roleId)?.name}</option>)}</select></label>
      {user ? <PersonalMatrix key={user.id} user={user} data={data} puedeEditar={puedeEditar} /> : <p role="status">No hay usuarios activos.</p>}
    </section>}
    {tab === "equipos" && <section role="tabpanel" id="access-equipos" aria-labelledby="tab-equipos" className="space-y-4">
      <label className="block text-sm font-semibold">Equipo<select className="mt-2 block min-h-12 w-full rounded-md border border-line bg-surface px-3 sm:max-w-md" value={teamId ?? ""} onChange={e => setTeamId(Number(e.target.value))}>{data.teams.map(t => <option key={t.id} value={t.id}>{t.name} · {t.memberIds.length} miembros</option>)}</select></label>
      {team ? <TeamEditor key={team.id} team={team} data={data} puedeEditar={puedeEditar} /> : <p role="status">No hay equipos activos. Crea el equipo desde <a className="underline" href="/metas">Metas</a> y asigna aquí sus supervisores.</p>}
    </section>}
  </div>;
}

function PersonalMatrix({ user, data, puedeEditar }: { user: PermissionAdminData["users"][number]; data: PermissionAdminData; puedeEditar: boolean }) {
  const router = useRouter();
  const inherited = new Map(data.permissions.filter(p => p.roleId === user.roleId).map(p => [cellKey(p), p.scope]));
  const [overrides, setOverrides] = useState<Permission[]>(data.overrides.filter(p => p.userId === user.id));
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [reason, setReason] = useState("");
  const [search, setSearch] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const protectedUser = user.isProtected || user.roleSlug === "admin";
  const editable = puedeEditar && !protectedUser;
  const cells = new Map(overrides.map(p => [cellKey(p), p.scope]));
  async function save(reset = false) {
    if (!editable || busy || reason.trim().length < 3) return;
    if (!navigator.onLine) { setError("Sin conexión. Conéctate para guardar los permisos."); return; }
    setBusy(true); setError(null); setMessage(null);
    const changes = reset ? Object.fromEntries(overrides.map(p => [cellKey(p), "inherit"])) : { ...draft };
    let saved = 0;
    try {
      for (const [key, value] of Object.entries(changes)) {
        const [resource, action] = key.split(":");
        const res = await fetch(`/api/permisos/usuarios/${user.id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ resource, action, scope: value === "inherit" ? null : value, reason }) });
        if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? "No se pudo guardar el permiso.");
        saved++;
        setOverrides(current => {
          const rest = current.filter(p => cellKey(p) !== key);
          return value === "inherit" ? rest : [...rest, { resource, action, scope: value } as Permission];
        });
        setDraft(current => { const next = { ...current }; delete next[key]; return next; });
      }
      if (reset) setDraft({});
      setMessage(reset ? "Permisos restablecidos al rol." : "Permisos personales guardados."); router.refresh();
    } catch (e) { setError(`${e instanceof Error ? e.message : "Error de red."} ${saved} celdas guardadas; las restantes siguen pendientes.`); }
    finally { setBusy(false); }
  }
  return <div className="space-y-4 min-w-0">
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-line bg-surface-alt p-4">
      <div><h3 className="font-semibold text-ink">{user.fullName}</h3><p className="mt-1 text-sm text-muted-foreground">Hereda de {data.roles.find(r => r.id === user.roleId)?.name}. Cada excepción reemplaza una sola celda.</p></div>
      <Badge variant="outline" className="text-[13px] tabular-nums">{overrides.length ? `${overrides.length} personalizados` : "Sin excepciones"}</Badge>
    </div>
    {protectedUser && <p className="flex items-center gap-2 rounded-lg bg-gold-100 p-4 text-sm text-gold-800"><LockKeyhole className="size-5" />El administrador protegido conserva sus permisos de rol y no admite excepciones.</p>}
    {editable && <div className="grid gap-4 rounded-lg border border-line p-4 lg:grid-cols-[1fr_auto]">
      <label className="text-sm font-semibold">Motivo del cambio <input maxLength={500} minLength={3} value={reason} disabled={busy} onChange={e => setReason(e.target.value)} placeholder="Describe por qué ajustas este acceso" className="mt-2 block min-h-12 w-full rounded-md border border-line bg-surface px-3 font-normal" /><span className="mt-1 block text-[13px] font-normal text-muted-foreground">Obligatorio para guardar o restablecer. Quedará en la auditoría.</span></label>
      <div className="flex flex-wrap items-center gap-2"><Button disabled={busy || reason.trim().length < 3 || !Object.keys(draft).length} onClick={() => void save()}>{busy ? "Guardando…" : `Guardar cambios (${Object.keys(draft).length})`}</Button><Button variant="outline" disabled={busy || reason.trim().length < 3 || !overrides.length} onClick={() => void save(true)}><RotateCcw />Restablecer al rol</Button></div>
    </div>}
    {error && <p role="alert" className="rounded-lg bg-danger-bg p-4 text-sm text-danger">{error}</p>}
    {message && <p role="status" className="rounded-lg bg-success-bg p-4 text-sm text-success">{message}</p>}
    <label className="block text-sm font-semibold">Buscar recurso<input type="search" value={search} onChange={e => setSearch(e.target.value)} className="mt-2 block min-h-12 w-full rounded-md border border-line bg-surface px-3 sm:max-w-md" placeholder="Leads, contactos, proyectos…" /></label>
    <p id="personal-matrix-help" className="text-sm text-muted-foreground">Selecciona «Heredar» para quitar una excepción. «Ninguno» revoca el acceso de esa celda. Desplaza la matriz para ver todas las acciones.</p>
    <div role="region" aria-label="Matriz personal de permisos" aria-describedby="personal-matrix-help" tabIndex={0} className="max-w-full overflow-x-auto rounded-lg border border-line">
      <table className="w-full text-sm"><thead className="bg-surface-alt"><tr><th className="p-4 text-left">Recurso</th>{PERMISSION_ACTIONS.map(a => <th key={a} className="p-3 text-left">{ETIQUETAS_ACCION[a]}</th>)}</tr></thead><tbody>
        {PERMISSION_RESOURCES.filter(r => `${r} ${ETIQUETAS_RECURSO[r] ?? ""}`.toLowerCase().includes(search.toLowerCase())).map(resource => <tr key={resource} className="border-t border-line">
          <th scope="row" className="min-w-52 p-4 text-left font-semibold">{ETIQUETAS_RECURSO[resource] ?? resource}</th>
          {PERMISSION_ACTIONS.map(action => {
            const key = cellKey({ resource, action });
            const personal = !protectedUser && cells.has(key);
            const value = draft[key] ?? (personal ? cells.get(key)! : "inherit");
            const inheritedScope = inherited.get(key) ?? "none";
            return <td key={action} className="min-w-44 p-3 align-top"><select disabled={!editable || busy} aria-label={`${ETIQUETAS_RECURSO[resource] ?? resource}: ${ETIQUETAS_ACCION[action]}`} value={value} onChange={e => setDraft(v => ({ ...v, [key]: e.target.value }))} className={`min-h-12 w-full rounded-md border bg-surface px-2 text-[13px] ${personal ? "border-gold-700" : "border-line"}`}><option value="inherit">Heredar · {scopes[inheritedScope]}</option>{PERMISSION_SCOPES.map(s => <option key={s} value={s}>{scopes[s]}</option>)}</select>
              {personal && <Badge variant="outline" className="mt-2 text-[13px] border-gold-700 text-gold-800">Personalizado</Badge>}
              {draft[key] !== undefined && <span className="mt-2 block text-[13px] text-muted-foreground">Sin guardar</span>}
            </td>;
          })}
        </tr>)}
      </tbody></table>
    </div>
  </div>;
}

function TeamEditor({ team, data, puedeEditar }: { team: PermissionTeam; data: PermissionAdminData; puedeEditar: boolean }) {
  const router = useRouter();
  const [leaderId, setLeaderId] = useState(team.leaderId);
  const [members, setMembers] = useState(team.memberIds);
  const [supervisors, setSupervisors] = useState(team.supervisorIds);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const toggle = (ids: number[], id: number) => ids.includes(id) ? ids.filter(i => i !== id) : [...ids, id];
  async function save() {
    if (busy || !puedeEditar) return;
    if (!navigator.onLine) { setError("Sin conexión. Conéctate para guardar el equipo."); return; }
    setBusy(true); setError(null); setMessage(null);
    try {
      const res = await fetch(`/api/permisos/equipos/${team.id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ leaderId, memberIds: members, supervisorIds: supervisors }) });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? "No se pudo guardar el equipo.");
      setMessage("Equipo y supervisores actualizados."); router.refresh();
    } catch (e) { setError(e instanceof Error ? e.message : "Error de red. Vuelve a intentarlo."); } finally { setBusy(false); }
  }
  return <div className="space-y-5 rounded-xl border border-line bg-surface p-4 sm:p-6">
    <div className="flex items-center gap-3"><Users className="size-5 text-gold-700" /><h3 className="text-lg font-semibold">{team.name}</h3></div>
    <p className="text-sm text-muted-foreground">El líder y los supervisores acceden a los registros del equipo según sus permisos. Cada miembro pertenece a un equipo; seleccionarlo aquí lo traslada desde el anterior.</p>
    <label className="block text-sm font-semibold">Líder<select disabled={!puedeEditar || busy} value={leaderId ?? ""} onChange={e => setLeaderId(e.target.value ? Number(e.target.value) : null)} className="mt-2 block min-h-12 w-full rounded-md border border-line bg-surface px-3 sm:max-w-md"><option value="">Sin líder</option>{data.users.map(u => <option key={u.id} value={u.id}>{u.fullName}</option>)}</select></label>
    <div className="grid gap-6 lg:grid-cols-2">
      <fieldset disabled={!puedeEditar || busy} className="rounded-lg border border-line p-3"><legend className="px-2 text-sm font-semibold">Miembros del equipo</legend>{data.users.map(u => <label key={u.id} className="flex min-h-12 cursor-pointer items-center gap-3 text-sm"><input type="checkbox" checked={members.includes(u.id)} onChange={() => setMembers(v => toggle(v, u.id))} className="size-5 accent-gold-700" /><span>{u.fullName}{data.teams.find(t => t.id !== team.id && t.memberIds.includes(u.id)) && <span className="block text-[13px] text-muted-foreground">Se trasladará de {data.teams.find(t => t.memberIds.includes(u.id))?.name}</span>}</span></label>)}</fieldset>
      <fieldset disabled={!puedeEditar || busy} className="rounded-lg border border-line p-3"><legend className="px-2 text-sm font-semibold">Supervisores</legend>{data.users.filter(u => ["manager", "admin"].includes(u.roleSlug)).map(u => <label key={u.id} className="flex min-h-12 cursor-pointer items-center gap-3 text-sm"><input type="checkbox" checked={supervisors.includes(u.id)} onChange={() => setSupervisors(v => toggle(v, u.id))} className="size-5 accent-gold-700" />{u.fullName}</label>)}<p className="mt-2 text-[13px] text-muted-foreground">Un supervisor puede gestionar varios equipos.</p></fieldset>
    </div>
    {error && <p role="alert" className="text-sm text-danger">{error}</p>}{message && <p role="status" className="text-sm text-success">{message}</p>}
    {puedeEditar && <Button disabled={busy} onClick={() => void save()}>{busy ? "Guardando…" : "Guardar equipo y supervisores"}</Button>}
  </div>;
}
