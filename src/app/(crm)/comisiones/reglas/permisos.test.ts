import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import type { Actor, PermissionScope } from "../../../../domain/rbac.ts";
import type { PreviewConfig } from "../../reservas/_componentes/preview-types";
import { rulesConfigFor } from "./permisos.ts";

const config: PreviewConfig = {
  title: "Reglas", subtitle: "", missing: "", amountLabel: "", dateLabel: "",
  rows: [], notes: [],
  actions: ["Diseñar regla", "Simular reparto"].map(label => ({ label, missing: "", fields: [] })),
};
const actor = (roleSlug: string, scope?: PermissionScope, readOnly = false): Actor => ({
  userId: 1, roleSlug, readOnly,
  permissions: [
    { resource: "commissions", action: "view", scope: "all" },
    ...(scope ? [{ resource: "commissions" as const, action: "edit" as const, scope }] : []),
  ],
});

test("broker sin edición no recibe acciones ni formularios de reglas", () => {
  const filtered = rulesConfigFor(actor("broker"), config);
  assert.deepEqual(filtered.actions, []);
  assert.deepEqual(filtered.rows, config.rows);
  assert.equal(config.actions.length, 2);
});

test("la configuración global rechaza edición none, own y team", () => {
  for (const scope of ["none", "own", "team"] as const) {
    assert.deepEqual(rulesConfigFor(actor("broker", scope), config).actions, []);
  }
});

test("admin y finanzas con edición total conservan las dos acciones", () => {
  for (const role of ["admin", "finanzas"]) {
    assert.deepEqual(rulesConfigFor(actor(role, "all"), config), config);
    assert.deepEqual(rulesConfigFor(actor(role), config).actions, []);
    assert.deepEqual(rulesConfigFor(actor(role, "all", true), config).actions, []);
  }
});

test("la página filtra en servidor antes de entregar la configuración al cliente", () => {
  const page = readFileSync(new URL("./page.tsx", import.meta.url), "utf8");
  assert.match(page, /await requireActor\(\)/);
  assert.match(page, /rulesConfigFor\(actor, rulesExample\)/);
  assert.match(page, /<PreviewDesk config=\{config\}/);
  assert.doesNotMatch(page, /<PreviewDesk config=\{rulesExample\}/);
});
