import test from "node:test";
import assert from "node:assert/strict";
import { viewAsBroker, type Actor, type PermissionScope } from "../../../../domain/rbac.ts";
import { listasAgenda } from "./personas-agenda.ts";
import { destinoGuardadoCita, idActividadCreada } from "./guardado-cita.ts";

const USUARIOS = [
  { id: 1, fullName: "Ana Admin" },
  { id: 2, fullName: "Gema Gerente" },
  { id: 3, fullName: "Bruno Broker" },
  { id: 4, fullName: "Carla Broker" },
  { id: 5, fullName: "Otro Equipo" },
];

function actor(userId: number, roleSlug: string, ver: PermissionScope, crear: PermissionScope, extra: Partial<Actor> = {}): Actor {
  return {
    userId,
    roleSlug,
    permissions: [
      { resource: "activities", action: "view", scope: ver },
      { resource: "activities", action: "create", scope: crear },
      { resource: "brokers", action: "view", scope: ver },
    ],
    ...extra,
  } as Actor;
}

const ids = (xs: readonly { id: number }[]) => xs.map((x) => x.id);

test("gerente que ve todo y crea solo lo suyo: consulta completa, asigna solo a sí mismo", () => {
  const listas = listasAgenda(actor(2, "manager", "all", "own"), USUARIOS);
  assert.deepEqual(ids(listas.personas), [1, 2, 3, 4, 5]);
  assert.deepEqual(ids(listas.asignables), [2]);
  assert.equal(listas.puedeCrear, true);
});

test("crear con alcance team: el servidor rechaza asignar a otros, así que asignables es solo el actor", () => {
  const listas = listasAgenda(actor(2, "manager", "team", "team", { teamUserIds: [3, 4] }), USUARIOS);
  assert.deepEqual(ids(listas.personas), [2, 3, 4]);
  assert.deepEqual(ids(listas.asignables), [2]);
  assert.equal(listas.puedeCrear, true);
});

test("crear con alcance all: asignables son todos los usuarios activos", () => {
  const listas = listasAgenda(actor(1, "admin", "all", "all"), USUARIOS);
  assert.deepEqual(ids(listas.asignables), [1, 2, 3, 4, 5]);
  assert.deepEqual(ids(listas.personas), [1, 2, 3, 4, 5]);
});

test("sin permiso de crear: sin asignables y sin botón de crear; la consulta sigue el alcance de ver", () => {
  const listas = listasAgenda(actor(3, "broker", "own", "none"), USUARIOS);
  assert.deepEqual(ids(listas.personas), [3]);
  assert.deepEqual(listas.asignables, []);
  assert.equal(listas.puedeCrear, false);
});

test("ver como (readOnly): la consulta sigue poblada aunque crear sea none", () => {
  const gerente = actor(2, "manager", "team", "team", { teamUserIds: [3, 4] });
  const broker = actor(3, "broker", "team", "own", { teamUserIds: [4] });
  const vista = viewAsBroker(gerente, broker, "Bruno Broker");
  const listas = listasAgenda(vista, USUARIOS);
  assert.deepEqual(ids(listas.personas), [3, 4]);
  assert.notEqual(listas.personas.length, 0);
  assert.deepEqual(listas.asignables, []);
  assert.equal(listas.puedeCrear, false);
});

test("ver como de admin sobre broker con ver all: Por Broker no queda en 0", () => {
  const admin = actor(1, "admin", "all", "all");
  const broker = actor(3, "broker", "all", "own");
  const listas = listasAgenda(viewAsBroker(admin, broker, "Bruno Broker"), USUARIOS);
  assert.deepEqual(ids(listas.personas), [1, 2, 3, 4, 5]);
  assert.deepEqual(listas.asignables, []);
});

test("anti-duplicado: tras un POST que creó la cita, el reintento es PATCH sobre ese id", () => {
  assert.deepEqual(destinoGuardadoCita(null, null), { url: "/api/actividades", method: "POST", id: null });
  const creado = idActividadCreada({ ok: true, actividad: { id: 77 }, google: { error: "x" } });
  assert.equal(creado, 77);
  assert.deepEqual(destinoGuardadoCita(null, creado), { url: "/api/actividades/77", method: "PATCH", id: 77 });
  assert.deepEqual(destinoGuardadoCita(12, null), { url: "/api/actividades/12", method: "PATCH", id: 12 });
  assert.deepEqual(destinoGuardadoCita(0, null).method, "POST");
  assert.equal(idActividadCreada({}), null);
  assert.equal(idActividadCreada({ actividad: { id: "7" } }), null);
  assert.equal(idActividadCreada(null), null);
});
