/** D-04 / decisión #45: el vocabulario técnico no llega al cliente. */
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { test } from "node:test";
import ts from "typescript";

const src = new URL("../", import.meta.url);
const archivos = ["app", "components", "application"].flatMap((capa) =>
  readdirSync(new URL(`${capa}/`, src), { recursive: true })
    .map((archivo) => `${capa}/${String(archivo).replaceAll("\\", "/")}`)
    .filter((archivo) => /\.tsx?$/.test(archivo) && !/\.test\.tsx?$/.test(archivo)),
);

function ancestro(nodo: ts.Node, cumple: (n: ts.Node) => boolean): ts.Node | undefined {
  for (let actual: ts.Node | undefined = nodo; actual; actual = actual.parent) {
    if (cumple(actual)) return actual;
  }
  return undefined;
}

/** Excepciones técnicas delimitadas por valor Y contexto; nunca por archivo. */
function tecnico(nodo: ts.Node, texto: string): boolean {
  // Los imports/exports conservan application/pipeline y su adaptador.
  if ((ts.isImportDeclaration(nodo.parent) || ts.isExportDeclaration(nodo.parent)) && nodo.parent.moduleSpecifier === nodo) return true;

  // Endpoint interno permitido solo como primer argumento de fetch.
  const llamada = ancestro(nodo, ts.isCallExpression);
  if (llamada && ts.isCallExpression(llamada) && ts.isIdentifier(llamada.expression) && llamada.expression.text === "fetch") {
    const argumento = llamada.arguments[0];
    if (argumento && (argumento === nodo || nodo.parent === argumento) && /^\/api\/pipeline(?:\/|$)/.test(texto)) return true;
  }

  const propiedad = nodo.parent;
  if (ts.isPropertyAssignment(propiedad) && propiedad.initializer === nodo) {
    // Entidad persistida de auditoría; no cambiar el contrato del dominio.
    if (propiedad.name.getText() === "entidad" && texto === "pipeline_stage") return true;
    // Claves internas de KPI/paleta; la etiqueta visible se comprueba aparte.
    if (propiedad.name.getText() === "key" && texto === "pipeline") return true;
    if (propiedad.name.getText() === "id" && texto === "act-pipeline") return true;
  }

  // Clases existentes en globals.css, fuera del alcance del cambio.
  const atributo = ancestro(nodo, ts.isJsxAttribute);
  return Boolean(atributo && ts.isJsxAttribute(atributo) && atributo.name.getText() === "className" &&
    ["pipeline-total", "pipeline-layout", "pipeline-layout inspector-open"].includes(texto));
}

function infracciones(archivo: string, codigo: string): string[] {
  const fuente = ts.createSourceFile(archivo, codigo, ts.ScriptTarget.Latest, true);
  const encontradas: string[] = [];
  function visitar(nodo: ts.Node) {
    if (ts.isStringLiteralLike(nodo) || ts.isTemplateHead(nodo) || ts.isTemplateMiddle(nodo) || ts.isTemplateTail(nodo) || ts.isJsxText(nodo)) {
      // TypeScript decodifica escapes de cadenas; JSX admite entidades numéricas.
      const texto = nodo.text.replace(/&#(x[\da-f]+|\d+);/gi, (_, valor: string) =>
        String.fromCodePoint(valor.toLowerCase().startsWith("x") ? parseInt(valor.slice(1), 16) : parseInt(valor, 10)),
      );
      if (/pipeline/i.test(texto) && !tecnico(nodo, texto)) {
        const linea = fuente.getLineAndCharacterOfPosition(nodo.getStart(fuente)).line + 1;
        encontradas.push(`src/${archivo}:${linea}: ${texto.trim()}`);
      }
    }
    ts.forEachChild(nodo, visitar);
  }
  visitar(fuente);
  return encontradas;
}

test("D-04: ningún literal ni texto JSX muestra el vocabulario prohibido", () => {
  assert.ok(archivos.length > 100, "El recorrido de fuentes no puede quedar vacío.");
  assert.deepEqual(archivos.flatMap((archivo) => infracciones(archivo, readFileSync(new URL(archivo, src), "utf8"))), []);
});

test("D-04: las excepciones técnicas no permiten etiquetas, errores ni enlaces antiguos", () => {
  for (const codigo of [
    '<div title="Pipeline" />', '<div>PIPELINE</div>', 'const title = "Pipe\\u006cine";',
    'const title = `Ver pipeline ${id}`;', '<div>Pipe&#108;ine</div>',
    '<div title="/api/pipeline" />', '<div title="pipeline-layout" />',
    'const title = "pipeline_stage";', '<a href="/pipeline">Ver negocios</a>',
    'throw new Error("No se pudo cargar pipeline");',
  ]) assert.ok(infracciones("ejemplo.tsx", codigo).length > 0, codigo);
});
