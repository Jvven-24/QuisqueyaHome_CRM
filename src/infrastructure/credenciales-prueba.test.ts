import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { randomBytes } from "node:crypto";
import { test } from "node:test";
import ts from "typescript";
import * as config from "./env.ts";

const script = readFileSync(new URL("../../scripts/crear-usuario-prueba.mjs", import.meta.url), "utf8");
const ast = ts.createSourceFile("fixture.mjs", script, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS);

test("F02: script sin contraseñas literales ni salida de credenciales", () => {
  let hasLiteral = false;
  let logsPassword = false;
  function visit(node: ts.Node) {
    if (ts.isPropertyAssignment(node) && node.name.getText(ast) === "password" && ts.isStringLiteral(node.initializer)) hasLiteral = true;
    if (ts.isCallExpression(node) && /^console\.(log|error|info|debug)$/.test(node.expression.getText(ast))) {
      for (const arg of node.arguments) if (/\bpassword\b/.test(arg.getText(ast))) logsPassword = true;
    }
    ts.forEachChild(node, visit);
  }
  visit(ast);
  assert.equal(hasLiteral, false, "El script conserva una contraseña literal (valor omitido).");
  assert.equal(logsPassword, false, "El script imprime la contraseña.");
  assert.equal(/process\.env/.test(script), false, "La configuración debe leerse mediante env.ts.");
  assert.match(script, /testUserPassword/);
  assert.ok(script.indexOf("testUserPassword(nombre)") < script.indexOf("const sql = postgres("), "Validar credenciales antes de abrir la conexión.");
});

test("F02: credencial obligatoria del rol desde entorno, sin fallback", (t) => {
  assert.ok("testUserPassword" in config, "Falta el contrato central de credenciales.");
  const read = (config as unknown as { testUserPassword: (role: string) => string }).testUserPassword;
  for (const role of ["admin", "asistente", "broker"]) {
    const name = `CRM_TEST_${role.toUpperCase()}_PASSWORD`;
    const previous = process.env[name];
    t.after(() => { if (previous === undefined) delete process.env[name]; else process.env[name] = previous; });
    delete process.env[name];
    assert.throws(() => read(role), /Falta la variable de entorno/);
    const generated = randomBytes(32).toString("hex");
    process.env[name] = generated;
    assert.equal(read(role) === generated, true, "La lectura no coincide (valor omitido).");
  }
  assert.throws(() => read("otro"), /Rol de prueba/);
});
