import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";
import { test } from "node:test";
import ts from "typescript";

type Evento = { preventDefault: () => void; target?: { value: string } };
type Props = { children?: unknown; onChange?: (e: Evento) => void; onSubmit?: (e: Evento) => void; onEscapeKeyDown?: (e: Evento) => void; onInteractOutside?: (e: Evento) => void; onOpenChange?: (b: boolean) => void; [k: string]: unknown };
type Nodo = { type: string | ((p: Props) => Nodo); props: Props };
function nodos(n: unknown): Nodo[] {
  if (Array.isArray(n)) return n.flatMap(nodos);
  if (!n || typeof n !== "object" || !("props" in n)) return [];
  const nodo = n as Nodo;
  return [nodo, ...nodos(nodo.props.children)];
}
const require = createRequire(import.meta.url);
const url = (s: string) => "data:text/javascript;base64," + Buffer.from(s).toString("base64");
const hooksUrl = url('let slots=[],i=0; export function reset(){slots=[];i=0;} export function render(){i=0;} export function useState(v){const j=i++;if(!(j in slots))slots[j]=v;return [slots[j],v=>{slots[j]=typeof v==="function"?v(slots[j]):v;}];} export function useRef(v){const j=i++;if(!(j in slots))slots[j]={current:v};return slots[j];}');
const dialogUrl = url('export const Dialog="dialog",DialogContent="content",DialogDescription="description",DialogFooter="footer",DialogHeader="header",DialogTitle="title";');
const iconsUrl = url('export const AlertTriangle="icon";');
const formatoUrl = url('export const centavosAUnidad=v=>v===null?null:v/100,unidadACentavos=v=>v===""?null:Math.round(Number(v)*100);');
const source = readFileSync("src/app/(crm)/negocios/dialogos.tsx", "utf8");
let js = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext, jsx: ts.JsxEmit.ReactJSX } }).outputText;
for (const [from, to] of [["react", hooksUrl], ["react/jsx-runtime", pathToFileURL(require.resolve("react/jsx-runtime")).href], ["lucide-react", iconsUrl], ["@/components/ui/dialog", dialogUrl], ["../_ui/formato", formatoUrl]]) js = js.replaceAll('from "' + from + '"', 'from ' + JSON.stringify(to));
const modulo = await import(url(js));
const hooks = await import(hooksUrl);

for (const tipo of ["perdida", "cierre"] as const) for (const ok of [false, true]) {
  test(tipo + ": Escape/exterior/openChange y doble envío no cancelan mientras la petición real está pendiente; resultado " + ok, async () => {
    hooks.reset();
    let resolver!: (r: { ok: boolean; error?: string }) => void;
    const pendiente = new Promise<{ ok: boolean; error?: string }>((r) => { resolver = r; });
    let cancelaciones = 0;
    let envios = 0;
    const comunes = { onConfirmar: () => { envios++; return pendiente; }, onCancelar: () => { cancelaciones++; } };
    const props = tipo === "perdida" ? { ...comunes, contacto: "Contacto", motivos: [{ id: 1, name: "Otro", isActive: true }] } : { ...comunes, negocio: { contactName: "Contacto", amountCents: 2000, currency: "USD", operationType: "sale" }, propiedades: [{ projectId: 1, projectName: "Proyecto", isPrimary: true, unitId: 8 }], proyectos: [{ id: 1, unidades: [{ id: 8, code: "A" }] }], nombreEtapa: "Ganado" };
    const render = () => { hooks.render(); return (tipo === "perdida" ? modulo.DialogoPerdida(props) : modulo.DialogoCierre(props)) as Nodo; };
    let tree = render();
    if (tipo === "perdida") {
      nodos(tree).find((n) => n.type === "select")!.props.onChange!({ preventDefault() {}, target: { value: "1" } });
      nodos(tree).find((n) => n.type === "textarea")!.props.onChange!({ preventDefault() {}, target: { value: "Motivo completo" } });
      tree = render();
    }
    const form = nodos(tree).find((n) => n.type === "form")!;
    form.props.onSubmit!({ preventDefault() {} });
    assert.equal(envios, 1);
    // Intenta cerrar usando incluso el callback anterior al re-render: la ref debe protegerlo.
    let marco = (tree.type as (p: Props) => Nodo)(tree.props);
    marco.props.onOpenChange!(false);
    let prevenidos = 0;
    const content = nodos(marco).find((n) => n.type === "content")!;
    content.props.onEscapeKeyDown!({ preventDefault() { prevenidos++; } });
    content.props.onInteractOutside!({ preventDefault() { prevenidos++; } });
    assert.equal(prevenidos, 2);
    assert.equal(cancelaciones, 0, "no se anuncia cancelación mientras el servidor puede persistir");
    form.props.onSubmit!({ preventDefault() {} });
    assert.equal(envios, 1, "una única mutación aun con submit repetido");
    tree = render();
    marco = (tree.type as (p: Props) => Nodo)(tree.props);
    assert.equal(nodos(marco).find((n) => n.type === "content")!.props["aria-busy"], true);
    assert.ok(nodos(marco).some((n) => n.props.role === "status"), "se explica el bloqueo accesiblemente");
    resolver(ok ? { ok: true } : { ok: false, error: "No se pudo guardar" });
    await new Promise((r) => setImmediate(r));
    tree = render();
    marco = (tree.type as (p: Props) => Nodo)(tree.props);
    assert.equal(nodos(marco).find((n) => n.type === "content")!.props["aria-busy"], false);
    marco.props.onOpenChange!(false);
    assert.equal(cancelaciones, 1, "solo después de conocer el resultado se permite cerrar");
  });
}

test("navegación y cancelación de ficha en vuelo conservan el estado optimista hasta la respuesta", async () => {
  const vista = readFileSync("src/app/(crm)/negocios/vista.tsx", "utf8");
  const ast = ts.createSourceFile("vista.tsx", vista, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const funciones = new Map<string, string>();
  function visitar(n: ts.Node) {
    if (ts.isFunctionDeclaration(n) && n.name && ["navegar", "cambiarModo", "abrirFicha", "cerrarFicha"].includes(n.name.text)) funciones.set(n.name.text, n.getText(ast));
    ts.forEachChild(n, visitar);
  }
  visitar(ast);
  assert.equal(funciones.size, 4);
  const ensayo = 'export function ejecutar(){ const enCurso={current:true};let efectos=0;const dispatch=()=>efectos++,setPerdida=()=>efectos++;const negocioSeleccionado={id:1};const kanban={pendientes:{1:{estado:"dialogo",dealId:1}}};const searchParams={toString(){efectos++;return "";}};' + [...funciones.values()].join("\n") + ';navegar({deal:undefined});cambiarModo("lista");abrirFicha({id:2});cerrarFicha();return efectos;}';
  const jsEnsayo = ts.transpileModule(ensayo, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } }).outputText;
  const m = await import(url(jsEnsayo));
  assert.equal(m.ejecutar(), 0, "ningún callback real debe navegar, borrar el diálogo ni revertir la tarjeta durante el envío");
});
