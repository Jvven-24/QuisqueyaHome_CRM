import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import ts from "typescript";

test("Comisiones no puede marcar paid desde una acción directa sin liquidación", () => {
 const source = readFileSync(new URL("./vista.tsx", import.meta.url), "utf8");
 const tree = ts.createSourceFile("vista.tsx", source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
 function visit(node: ts.Node) {
  if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && node.expression.text === "aplicar") {
   const payload = node.arguments[1];
   assert.ok(payload && ts.isObjectLiteralExpression(payload), "Toda mutación de comisión debe tener payload revisable");
   for (const property of payload.properties) {
    if (ts.isPropertyAssignment(property) && property.name.getText(tree).replace(/["']/g, "") === "status") {
     assert.ok(ts.isStringLiteral(property.initializer), "El estado enviado debe ser explícito");
     assert.notEqual(property.initializer.text, "paid", "El pago requiere liquidación y evidencia bancaria");
    }
   }
  }
  ts.forEachChild(node, visit);
 }
 visit(tree);
 assert.doesNotMatch(source, /comisionParaPagar|setComisionParaPagar|Marcar como pagada|Confirmar marca/);
 assert.match(source, /href="\/comisiones\/liquidaciones"/);
 assert.match(source, /Vista previa de liquidaciones: no registra pagos/);
});
