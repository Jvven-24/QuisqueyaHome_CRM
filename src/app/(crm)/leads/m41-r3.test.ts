import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { test } from "node:test";
import React from "react";
import ts from "typescript";
import { CrearEntradaInput, EditarEntradaInput } from "../../../application/catalogos/entrada.ts";
import { crearEnvioUnico } from "../configuracion/envio.ts";
import { absorcionUnidades } from "../../../domain/unidades.ts";
import { unitFormPayload, availabilitySummary } from "../propiedades/presentacion.ts";
import { reaches } from "../../../domain/rbac.ts";

const require = createRequire(import.meta.url);
type Nodo = { type: unknown; props: Record<string, unknown> };
type Componente = (props: Record<string, unknown>) => Nodo;
type Pagina = (props: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string>> }) => Promise<unknown>;
function nodos(valor: unknown): Nodo[] {
  if (Array.isArray(valor)) return valor.flatMap(nodos);
  if (!valor || typeof valor !== "object" || !("props" in valor)) return [];
  const nodo = valor as Nodo;
  return [nodo, ...nodos(nodo.props.children)];
}
function texto(valor: unknown): string {
  if (Array.isArray(valor)) return valor.map(texto).join("");
  if (typeof valor === "string" || typeof valor === "number") return String(valor);
  return valor && typeof valor === "object" && "props" in valor ? texto((valor as Nodo).props.children) : "";
}
function boton(arbol: Nodo, nombre: string) {
  const nodo = nodos(arbol).find((n) => n.type === "button" && texto(n) === nombre);
  assert.ok(nodo, `Botón ${nombre}`);
  return nodo;
}
const turno = () => new Promise<void>((resolve) => setImmediate(resolve));

/** Ejecuta los handlers del componente real con estado persistente y fetch controlado.
 * No sustituye una prueba de navegador ni mide geometría. */
function entorno(peticion: typeof fetch = fetch) {
  const estados: unknown[] = [];
  let cursor = 0;
  const efectos: (() => void)[] = [];
  const react = { ...React, default: React,
    useState(inicial: unknown) {
      const posicion = cursor++;
      if (!(posicion in estados)) estados[posicion] = inicial;
      return [estados[posicion], (valor: unknown) => { estados[posicion] = typeof valor === "function" ? valor(estados[posicion]) : valor; }];
    },
    useRef(inicial: unknown) {
      const posicion = cursor++;
      if (!(posicion in estados)) estados[posicion] = { current: inicial };
      return estados[posicion];
    },
    useEffect(efecto: () => void, deps: unknown[]) {
      const posicion = cursor++;
      const anterior = estados[posicion] as unknown[] | undefined;
      if (!anterior || deps.some((valor, i) => valor !== anterior[i])) efectos.push(efecto);
      estados[posicion] = deps;
    },
    useMemo: (calcular: () => unknown) => calcular(),
  };
  function cargar(ruta: string, deps: Record<string, unknown> = {}) {
    const codigo = ts.transpileModule(readFileSync(new URL(ruta, import.meta.url), "utf8"), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
    }).outputText;
    const exports: Record<string, unknown> = {};
    class DatosFormulario { constructor(privateForm: { datos: Record<string, unknown> }) { this.datos = privateForm.datos; } datos: Record<string, unknown>; get(nombre: string) { return this.datos[nombre]; } }
    new Function("require", "exports", "fetch", "navigator", "FormData", codigo)(
      (id: string) => id in deps ? deps[id] : id === "react" ? react : require(id), exports, peticion, { onLine: true }, DatosFormulario,
    );
    return exports;
  }
  return { cargar, render(componente: Componente, props: Record<string, unknown> = {}) { cursor = 0; return componente(props); },
    async efectos() { for (const efecto of efectos.splice(0)) efecto(); await turno(); await turno(); } };
}

function campana(peticion: typeof fetch) {
  const env = entorno(peticion);
  const modulo = env.cargar("../_ui/crm-header.tsx", {
    "next/navigation": { usePathname: () => "/leads" },
    "@/components/ui/sidebar": {}, "@/components/ui/dropdown-menu": {}, "@/components/ui/popover": {},
    "../modulos": { MODULOS: [], WORKSPACES: [] }, "./command-palette": {},
  });
  const render = () => env.render(modulo.CrmHeader as Componente, { etiquetaRol: "Administrador" });
  render();
  return { ...env, render };
}
const notificaciones = [1, 2].map((id) => ({ id, title: `Aviso ${id}`, body: null, notificationType: "lead", isRead: false, createdAt: "2026-10-18T12:00:00Z" }));
const cargaCorrecta = () => Response.json({ ok: true, notificaciones, unreadCount: 2 });

for (const fallo of ["red", "http", "contrato", "json"] as const) {
  test(`R3 G1-03: GET ${fallo} muestra error y permite reintentar hasta un vacío confirmado`, async () => {
    let solicitudes = 0;
    const vista = campana(async () => {
      solicitudes++;
      if (solicitudes > 1) return Response.json({ ok: true, notificaciones: [], unreadCount: 0 });
      if (fallo === "red") throw new Error("red");
      return fallo === "http" ? new Response("", { status: 503 }) : fallo === "json" ? new Response("{") : Response.json({ ok: false });
    });
    await vista.efectos();
    const error = vista.render();
    assert.match(texto(error), /No se pudieron cargar/);
    assert.doesNotMatch(texto(error), /No tienes notificaciones/);
    assert.ok(nodos(error).some((n) => n.props.role === "alert"));
    (boton(error, "Reintentar").props.onClick as () => void)();
    vista.render(); await vista.efectos();
    assert.match(texto(vista.render()), /No tienes notificaciones pendientes/);
    assert.equal(solicitudes, 2);
  });
}
for (const individual of [false, true]) {
  for (const fallo of ["red", "403", "500", "contrato"] as const) {
    test(`R3 G1-03b: PATCH ${individual ? "individual" : "todas"} ${fallo} conserva avisos y contador`, async () => {
      const vista = campana(async (_url, opciones) => {
        if (!opciones?.method) return cargaCorrecta();
        if (fallo === "red") throw new Error("red");
        return fallo === "contrato" ? Response.json({ ok: false }) : new Response("", { status: Number(fallo) });
      });
      await vista.efectos();
      const antes = vista.render();
      const accion = individual ? nodos(antes).find((n) => n.type === "div" && typeof n.props.onClick === "function")! : boton(antes, "Marcar leídas");
      await (accion.props.onClick as () => Promise<void>)();
      const despues = vista.render();
      assert.match(texto(despues), /Se conserva el estado anterior/);
      assert.equal(nodos(despues).filter((n) => n.type === "div" && String(n.props.className).includes("bg-gold-50/20")).length, 2);
      assert.ok(nodos(despues).some((n) => n.type === "span" && n.props.children === 2));
    });
  }
  test(`R3 G1-03b: PATCH ${individual ? "individual" : "todas"} espera confirmación y bloquea doble clic`, async () => {
    let resolver!: (respuesta: Response) => void;
    let envios = 0;
    const vista = campana(async (_url, opciones) => {
      if (!opciones?.method) return cargaCorrecta();
      envios++; return new Promise<Response>((resolve) => { resolver = resolve; });
    });
    await vista.efectos();
    const arbol = vista.render();
    const accion = individual ? nodos(arbol).find((n) => n.type === "div" && typeof n.props.onClick === "function")! : boton(arbol, "Marcar leídas");
    const clic = accion.props.onClick as () => Promise<void>;
    const pendiente = clic(); await clic();
    assert.equal(envios, 1);
    assert.equal(nodos(vista.render()).filter((n) => n.type === "div" && String(n.props.className).includes("bg-gold-50/20")).length, 2);
    resolver(Response.json({ ok: true })); await pendiente;
    const final = vista.render();
    assert.equal(nodos(final).filter((n) => n.type === "div" && String(n.props.className).includes("bg-gold-50/20")).length, individual ? 1 : 0);
    assert.doesNotMatch(texto(final), /No se pudieron marcar/);
  });
}

for (const editar of [false, true]) {
  test(`R3 G4-01: ${editar ? "edición" : "alta"} confirma con nombre solo tras guardar y sin insertar banner`, async () => {
    const avisos: string[] = [];
    let refrescos = 0;
    let resolver!: (respuesta: Response) => void;
    const env = entorno(async () => new Promise<Response>((resolve) => { resolver = resolve; }));
    const { CatalogosPanel } = env.cargar("../configuracion/_catalogos.tsx", {
      "next/navigation": { useRouter: () => ({ refresh() { refrescos++; } }) },
      "sonner": { toast: { success(mensaje: string) { avisos.push(mensaje); } } },
      "@/application/catalogos/entrada": { CrearEntradaInput, EditarEntradaInput }, "./envio": { crearEnvioUnico }, "../_ui/prototipo-ui": {},
    });
    const panel = (CatalogosPanel as Componente)({ motivos: [{ id: 1, name: "Original", position: 0, isActive: true }], canales: [], puedeCrear: true, puedeEditar: true });
    const lista = nodos(panel).find((n) => typeof n.type === "function" && n.type.name === "ListaCatalogo")!;
    const render = () => env.render(lista.type as Componente, lista.props);
    (boton(render(), editar ? "Editar" : "Nuevo Registro").props.onClick as () => void)();
    const formulario = nodos(render()).find((n) => n.type === "form")!;
    const guardado = (formulario.props.onSubmit as (e: unknown) => void)({ preventDefault() {}, currentTarget: { datos: { name: "  Referido del cliente  ", position: "1" }, elements: { namedItem: () => ({ checked: true }) } } });
    assert.deepEqual(avisos, []);
    resolver(new Response("{}", { status: 200 }));
    await guardado; await turno();
    assert.deepEqual(avisos, ["Se guardó «Referido del cliente»."]);
    assert.equal(refrescos, 1);
    assert.ok(!nodos(render()).some((n) => n.props.role === "status"));
  });
}

test("R3 G2-19: ficha muestra estados comerciales separados y enlaces de obra comprensibles", () => {
  const env = entorno();
  const modulo = env.cargar("../propiedades/[slug]/vista.tsx", {
    "../presentacion": { unitFormPayload, availabilitySummary },
    "../_componentes/project-dossier": { ProjectDossier: () => null },
    "../_componentes/unit-inspector": { UnitInspector: () => null },
    "../_componentes/floor-matrix": { FloorMatrix: () => null },
    "next/navigation": { useRouter: () => ({}) }, "@/hooks/use-focus-trap": {},
    "@/domain/unidades": { absorcionUnidades }, "@/application/proyectos/validacion": { descripcionComercial: () => null },
    "@/domain/zona-horaria": {}, "@/domain/catalogs": {}, "../../_ui/prototipo-ui": {},
    "../../_ui/alerta-error-formulario": {}, "../../_ui/formato": {}, "../../_ui/estados": {},
    "../_formulario-proyecto": { ETIQUETAS_TIPO: {} }, "@/components/ui/cotizador-confotur-modal": {},
    "@/components/ui/dialog": {}, "@/components/ui/button": {},
  });
  const arbol = env.render(modulo.PropiedadDetalleVista as Componente, {
    proyecto: { name: "Proyecto", slug: "proyecto", projectType: "villa", progressPercent: 0, currency: "USD" },
    unidades: ["available", "sold", "reserved", "unavailable"].map((status, id) => ({ id, status, code: String(id), realPriceCents: null })),
    brokers: [], puedeVerAvances: true,
  });
  const contenido = texto(arbol);
  assert.match(contenido, /1 vendida · 1 reservada · 1 no disponible/);
  assert.match(contenido, /1 disponible/);
  assert.match(contenido, /Ver avance y etapas de la obra/);
  assert.match(contenido, /Inventario de unidades/);
  assert.doesNotMatch(contenido, /colocadas|cronograma de fases|Absorción|Hab\.|Matriz de Unidades|tipologías arquitectónicas/);
});

for (const [ruta, seleccion] of [["leads", "lead"], ["contactos", "contacto"], ["negocios", "deal"]] as const) {
  test(`R3 G1-08: ${ruta} valida en viewport y en página con digest 404`, async () => {
    const { notFound } = require("next/navigation");
    const { getAccessFallbackHTTPStatus } = require("next/dist/client/components/http-access-fallback/http-access-fallback");
    const env = entorno();
    let lecturas = 0;
    const modulo = env.cargar(`../${ruta}/[id]/page.tsx`, {
      react: { cache: (fn: unknown) => fn }, "next/navigation": { notFound },
      "../page": { default: async ({ searchParams }: { searchParams: Promise<Record<string, string>> }) => {
        lecturas++;
        const params = await searchParams;
        assert.equal(params.ficha, "1");
        if (params[seleccion] === "999999999") notFound();
        return { seleccion: params[seleccion], modo: params.modo };
      } },
    });
    for (const nombre of ["default", "generateViewport"]) {
      const page = modulo[nombre] as Pagina;
      for (const id of ["abc", "1e3", "0x1", "-1", "0", "2147483648", "999999999"]) {
        await assert.rejects(page({ params: Promise.resolve({ id }), searchParams: Promise.resolve({ modo: "lista" }) }), (error: unknown) => getAccessFallbackHTTPStatus(error) === 404);
      }
      await page({ params: Promise.resolve({ id: "1" }), searchParams: Promise.resolve({ modo: "lista" }) });
    }
    assert.equal(lecturas, 4); // Solo un inexistente y un existente por entrada.
  });
}

test("R3 H-04: viewport y página de brokers rechazan inválidos, ausentes, ajenos y borrados con digest 404", async () => {
  const { notFound } = require("next/navigation");
  const { getAccessFallbackHTTPStatus } = require("next/dist/client/components/http-access-fallback/http-access-fallback");
  for (const fila of [undefined, { userId: 99, isActive: true, deletedAt: null }, { userId: 5, isActive: true, deletedAt: new Date() }, { userId: 5, isActive: false, deletedAt: null }]) {
    let lecturas = 0;
    const env = entorno();
    const cadena = { from() { return this; }, innerJoin() { return this; }, where() { return this; }, async limit() { return fila ? [fila] : []; } };
    const modulo = env.cargar("../brokers/[id]/page.tsx", {
      react: { cache: (fn: unknown) => fn }, "next/navigation": { notFound },
      "drizzle-orm": { and: () => true, desc: () => true, eq: () => true, isNull: () => true },
      "@/domain/cierre-negocio": {}, "@/domain/metas": {}, "@/domain/rbac": { reaches },
      "@/infrastructure/auth/actor": { requireActor: async () => ({ userId: 5 }) },
      "@/infrastructure/page-guard": { requireScopeInPage: () => "own" },
      "@/infrastructure/db/client": { getDb: () => ({ select() { lecturas++; return cadena; } }) },
      "@/infrastructure/db/schema": { users: {}, roles: {}, brokerProfiles: {} },
      "../../_ui/formato": {}, "../../_ui/prototipo-ui": {}, "../../_ui/estados": {},
    });
    for (const nombre of ["default", "generateViewport"]) {
      for (const id of ["abc", "2147483648", "5"]) {
        await assert.rejects((modulo[nombre] as Pagina)({ params: Promise.resolve({ id }), searchParams: Promise.resolve({}) }), (error: unknown) => getAccessFallbackHTTPStatus(error) === 404);
      }
    }
    assert.equal(lecturas, 2); // Un registro por entrada, nunca proyectos ni cartera.
  }
});

// El revisor apunta este test al servidor que ejecute ESTE parche; nunca inicia Next.
// No se adjuntan cookies ni credenciales; usar únicamente el entorno local demo autorizado.
const baseHttp = process.env.CRM_R3_HTTP_BASE_URL;
test("R3 HTTP real: las ocho URLs inexistentes/malformadas devuelven 404 con estado español", { skip: !baseHttp && "Requiere servidor con el parche y CRM_R3_HTTP_BASE_URL" }, async () => {
  const base = new URL(baseHttp!);
  assert.ok(["localhost", "127.0.0.1", "[::1]"].includes(base.hostname));
  assert.equal(base.username + base.password, "");
  for (const [ruta, titulo] of [["leads", "Lead"], ["contactos", "Contacto"], ["negocios", "Negocio"], ["brokers", "Asesor"]]) {
    for (const id of ["abc", "999999999"]) {
      const respuesta = await fetch(new URL(`/${ruta}/${id}`, base), { redirect: "manual", signal: AbortSignal.timeout(30000), headers: { "user-agent": "Mozilla/5.0 Chrome/130.0.0.0" } });
      assert.equal(respuesta.status, 404, `${ruta}/${id}`);
      assert.ok((await respuesta.text()).includes(`${titulo} no encontrado`), `${ruta}/${id}: estado propio`);
    }
  }
});
