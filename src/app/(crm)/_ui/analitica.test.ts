import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";
import { test } from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";
import { formatUsd } from "../../../lib/formato-analitica.ts";

const files = [
  "src/app/(crm)/inicio/vista.tsx", "src/app/(crm)/reportes/vista.tsx",
  "src/infrastructure/db/repos/reportes.ts", "src/infrastructure/db/repos/dashboard.ts",
];

/** AST: los estilos/umbrales sueltos no son datasets. Una fila numérica literal sí. */
function fixedDatasets(source: string, file: string): string[] {
  const ast = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, file.endsWith("tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
  const findings: string[] = [];
  function numeric(node: ts.Node): boolean {
    return ts.isNumericLiteral(node) || (ts.isPrefixUnaryExpression(node) && ts.isNumericLiteral(node.operand));
  }
  function literalBusinessRow(node: ts.Node): boolean {
    if (!ts.isObjectLiteralExpression(node)) return false;
    return node.properties.some(p => ts.isPropertyAssignment(p) && (numeric(p.initializer) || literalBusinessRow(p.initializer) || (ts.isArrayLiteralExpression(p.initializer) && p.initializer.elements.some(numeric))));
  }
  function visit(node: ts.Node) {
    if (ts.isArrayLiteralExpression(node)) {
      const name = ts.isVariableDeclaration(node.parent) ? node.parent.name.getText(ast) : "";
      if (node.elements.some(literalBusinessRow) || (/data|datos|funnel|embudo|trend|tendencia|inventory|inventario|projection|proyeccion|commission|comision|kpi|series|metrics|metricas|revenue|ingreso|volume|volumen|count|conteo/i.test(name) && node.elements.some(numeric))) {
        const line = ast.getLineAndCharacterOfPosition(node.getStart(ast)).line + 1;
        findings.push(`${file}:${line}`);
      }
    }
    ts.forEachChild(node, visit);
  }
  visit(ast);
  return findings;
}

test("Inicio y Reportes: guarda anti-hardcode lee las dos vistas y los dos repositorios", () => {
  for (const file of files) assert.deepEqual(fixedDatasets(readFileSync(file, "utf8"), file), [], file);
});

test("guarda anti-hardcode: mutación de cada fuente rechazada, incluidos ceros y arrays primitivos", () => {
  for (const file of files) {
    const original = readFileSync(file, "utf8");
    for (const mutant of [
      '\nconst datos = [{ label: "Nuevo", count: 42 }];',
      '\nconst funnel = [{ label: "Cierre", passRatePercent: 0 }];',
      '\nconst datos = [{ totals: { revenueCents: 12000 } }];',
      '\nconst metricas = [70, 40, 20];',
    ]) assert.ok(fixedDatasets(original + mutant, file).length > 0, `mutación sobrevivió: ${file}`);
  }
  assert.deepEqual(fixedDatasets('const data = rows.map(row => ({ count: row.count })); const colors = ["var(--chart-1)"]; const width = 320;', "safe.ts"), []);
});

test("formato USD: utiliza centavos y distingue un cero real", () => {
  const expected = new Intl.NumberFormat("es-DO", { style: "currency", currency: "USD" });
  assert.equal(formatUsd(123456), expected.format(1234.56));
  assert.equal(formatUsd(0), expected.format(0));
});

/** Transpilar solo el componente aislado en memoria, sin build ni archivos .next. */
const require = createRequire(import.meta.url);
function moduleUrl(source: string, filename: string): string {
  const js = ts.transpileModule(source, { fileName: filename, compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext, jsx: ts.JsxEmit.ReactJSX } }).outputText;
  const resolved = js.replace(/from "react\/jsx-runtime"/g, `from ${JSON.stringify(pathToFileURL(require.resolve("react/jsx-runtime")).href)}`).replace(/from "react"/g, `from ${JSON.stringify(pathToFileURL(require.resolve("react")).href)}`);
  return `data:text/javascript;base64,${Buffer.from(resolved).toString("base64")}`;
}
const copySource = readFileSync("src/app/(crm)/_ui/analitica-copy.ts", "utf8");
const copyUrl = moduleUrl(copySource, "copy.ts");
const cardSource = readFileSync("src/components/ui/chart-card.tsx", "utf8").replace('"@/app/(crm)/_ui/analitica-copy"', JSON.stringify(copyUrl));
const { ChartCard } = await import(moduleUrl(cardSource, "chart-card.tsx"));
const { analyticsCopy } = await import(copyUrl);

for (const state of ["loading", "empty", "error", "offline", "success", "permission"] as const) {
  test(`ChartCard aislado: estado ${state}`, () => {
    const html = renderToStaticMarkup(React.createElement(ChartCard, { title: "Métrica", subtitle: "Periodo", state, onRetry: () => {}, emptyAction: React.createElement("a", { href: "/reportes" }, "Limpiar") }, React.createElement("span", null, "DATO_AUTORIZADO")));
    assert.ok(html.includes("Métrica"));
    if (state === "success" || state === "offline") assert.ok(html.includes("DATO_AUTORIZADO"));
    else assert.ok(!html.includes("DATO_AUTORIZADO"), "El estado debe ocultar el contenido de la región");
    if (state === "loading") assert.ok(html.includes('aria-busy="true"') && html.includes(analyticsCopy.common.loading));
    if (state === "empty") assert.ok(html.includes(analyticsCopy.common.empty) && html.includes('href="/reportes"'));
    if (state === "error") assert.ok(html.includes('role="alert"') && html.includes(analyticsCopy.common.retry));
    if (state === "offline") assert.ok(html.includes(analyticsCopy.common.offline));
    if (state === "permission") assert.ok(html.includes(analyticsCopy.common.permission));
  });
}
