import assert from "node:assert/strict";
import { test } from "node:test";
import { consultarDashboard, dashboardScopes, dashboardQuery } from "./consultas.ts";
import { dashboardEnMemoria } from "./en-memoria.ts";
import type { Actor } from "../../domain/rbac.ts";
import type { DashboardSnapshot } from "./puertos.ts";
const actor: Actor = { userId: 27, roleSlug: "admin", permissions: [{ resource: "leads", action: "view", scope: "own" }, { resource: "deals", action: "view", scope: "team" }, { resource: "activities", action: "view", scope: "all" }] };
function snapshot(): DashboardSnapshot {
  return { fullName: "Usuario de prueba", myLeads: 0, monthLeads: 0, activeDeals: 0, pipelineCents: 0, monthWon: 0, unassignedLeads: 0, todayMeetings: 0, weekMeetings: 0, pendingTasks: 0, goal: null, level: null, recentLeads: [], activities: [], projects: [], academy: null, funnel: [] };
}
test("Inicio: ceros, agenda vacía y ausencia de meta/nivel no generan muestras", async () => {
  const d = dashboardEnMemoria(snapshot());
  const result = await consultarDashboard(d.repo, actor, "all");
  assert.equal(result.nombre, "Usuario de prueba"); assert.equal(result.leadsMesCount, 0);
  assert.equal(result.metaMesLabel, "Sin meta"); assert.equal(result.miNivel, "Sin nivel");
  assert.equal(result.avancesPorRevisarCount, null); assert.equal(result.academy, null);
  assert.deepEqual(result.activities, []); assert.deepEqual(result.projects, []); assert.deepEqual(result.funnel, []);
});
test("Inicio: permisos por recurso y alcance intersectan incluso si el rol se llama admin", () => {
  assert.deepEqual(dashboardScopes(actor, "all"), { leads: "own", deals: "team", activities: "all", projects: "none", goals: "none", academy: "none" });
  assert.equal(dashboardScopes(actor, "team").activities, "team");
  assert.equal(dashboardScopes(actor, "own").deals, "own");
});
test("Inicio: no oculta el fallo de base de datos", async () => {
  const failure = new Error("fallo simulado");
  await assert.rejects(consultarDashboard(dashboardEnMemoria(snapshot(), failure).repo, actor, "all"), error => error === failure);
});
test("Inicio: nombre, agenda y progreso viajan desde el puerto sin cambiar cifras", async () => {
  const s = snapshot(); s.goal = { achieved: 1, target: 7 }; s.monthLeads = 9; s.monthWon = 2;
  s.activities = [{ id: 88, title: "Actividad de prueba", startsAt: "2026-10-06T15:00:00Z", location: null }];
  s.academy = { title: "Curso de prueba", progressPercent: 31 };
  const d = dashboardEnMemoria(s);
  const result = await consultarDashboard(d.repo, actor, "team", { brokerId: 27 }, new Date("2026-10-01T02:00:00Z"));
  assert.equal(result.metaPorcentaje, 14.3); assert.equal(result.conversionPorcentaje, "22.2%");
  assert.deepEqual(result.activities, s.activities); assert.deepEqual(result.academy, s.academy);
  assert.equal(d.calls[0]!.actor, actor); assert.equal(d.calls[0]!.query.brokerId, 27);
});
test("Inicio: límites del mes, día y semana son locales, independientes de TZ del proceso", () => {
  const q = dashboardQuery({}, new Date("2026-10-01T02:00:00Z"));
  assert.equal(q.today, "2026-09-30"); assert.equal(q.monthStart, "2026-09-01");
  assert.equal(q.monthEnd, "2026-10-01"); assert.equal(q.weekStart, "2026-09-28"); assert.equal(q.weekEnd, "2026-10-05");
});
