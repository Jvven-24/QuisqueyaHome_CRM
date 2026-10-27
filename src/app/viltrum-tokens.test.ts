import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const names = (p: string) =>
  new Set([...readFileSync(p, "utf8").matchAll(/(--[a-z0-9-]+)\s*:/g)].map((m) => m[1]));

test("viltrum-tokens.css es aditivo: no redefine tokens del CRM", () => {
  const crm = names("src/app/tokens.css");
  const vil = names("src/app/viltrum-tokens.css");
  assert.ok(vil.size > 0);
  for (const n of vil) assert.ok(!crm.has(n), `${n} ya existe en tokens.css`);
});

test("layout importa tokens.css antes que viltrum-tokens.css", () => {
  const src = readFileSync("src/app/layout.tsx", "utf8");
  const a = src.indexOf('import "./tokens.css"');
  const b = src.indexOf('import "./viltrum-tokens.css"');
  assert.ok(a >= 0 && b > a);
});
