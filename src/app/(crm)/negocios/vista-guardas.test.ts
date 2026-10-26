/**
 * Guardas estructurales de la vista de Negocios: hallazgos P1, P2 y P3 de
 * T-E1-1c1a y los criterios CA-07, CA-08, CA-11, CA-12 y CA-17 de M03.
 * Leen el código fuente porque la vista depende de Next y de alias que el
 * ejecutor de pruebas de Node no resuelve; el comportamiento puro está en
 * logica.test.ts.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const BASE = "src/app/(crm)/negocios/";
const ARCHIVOS_VISTA = [
  "vista.tsx", "tablero.tsx", "tarjeta-negocio.tsx", "lista.tsx", "analisis.tsx",
  "filtros.tsx", "dialogos.tsx", "inspector.tsx",
];
const fuente = (archivo: string) => readFileSync(BASE + archivo, "utf8");

test("P1 un solo árbol montado: el tablero elige el diseño por JavaScript, no oculta con CSS", () => {
  const tablero = fuente("tablero.tsx");
  assert.ok(tablero.includes('useMediaQuery("(max-width: 767px)")'));
  assert.ok(/if \(esMovil\) \{\s*return/.test(tablero), "el acordeón móvil debe retornar antes del kanban");
  for (const archivo of ARCHIVOS_VISTA) {
    assert.ok(!/hidden md:flex|md:hidden/.test(fuente(archivo)), `${archivo}: montar dos diseños y ocultar uno con CSS está prohibido`);
  }
});

test("P1 los filtros también montan una sola variante (barra o hoja)", () => {
  const filtros = fuente("filtros.tsx");
  assert.ok(filtros.includes("if (esMovil)"));
  assert.ok(!filtros.includes("md:hidden"));
});

test("P2 móvil sin desplazamiento anidado: el acordeón no fija altura ni overflow propio", () => {
  const tablero = fuente("tablero.tsx");
  const movil = tablero.slice(tablero.indexOf("if (esMovil)"), tablero.indexOf('<div className="kanban">'));
  assert.ok(movil.length > 200);
  assert.ok(!/overflow-(y-)?(auto|scroll)|max-h-|\bh-\[/.test(movil), "el acordeón crece con su contenido");
  assert.ok(!movil.includes("kanban-column-body"));
});

test("P3 «Sin fecha de etapa» se distingue visualmente de una antigüedad real", () => {
  const tarjeta = fuente("tarjeta-negocio.tsx");
  assert.ok(tarjeta.includes("tipoAntiguedad"));
  assert.ok(tarjeta.includes("border-dashed") && tarjeta.includes("italic"));
});

test("CA-17 texto >= 13 px, sin diálogos nativos y controles de 48 px", () => {
  for (const archivo of ARCHIVOS_VISTA) {
    const texto = fuente(archivo);
    assert.ok(!/text-xs|text-\[(?:9|10|11|12)px\]/.test(texto), `${archivo}: texto menor de 13 px`);
    assert.ok(!/\b(alert|confirm|prompt)\(/.test(texto), `${archivo}: usa diálogos nativos del navegador`);
    assert.ok(!/\bmin-h-(8|9|10|11)\b/.test(texto), `${archivo}: control por debajo de 48 px`);
  }
  assert.ok(fuente("tarjeta-negocio.tsx").includes("min-h-12 min-w-12"));
  assert.ok(fuente("vista.tsx").includes("min-h-12 min-w-12"));
  assert.ok(fuente("lista.tsx").includes("min-h-12"));
});

test("CA-17 «Mover a…» funciona con teclado y el arrastre es opcional", () => {
  const tarjeta = fuente("tarjeta-negocio.tsx");
  assert.ok(tarjeta.includes("Mover a…") && tarjeta.includes("DropdownMenu"));
  assert.ok(fuente("tablero.tsx").includes("disabled: !arrastrable"), "el arrastre respeta permiso, conexión y operación en curso");
  assert.ok(tarjeta.includes("abierto && puedeMover"), "un negocio cerrado no se puede mover");
});

test("CA-11 la vista no pinta montos ni comisión que el DTO del rol no trae", () => {
  const tarjeta = fuente("tarjeta-negocio.tsx");
  assert.ok(tarjeta.includes("negocio.amountCents !== undefined"));
  const inspector = fuente("inspector.tsx");
  assert.ok(inspector.includes("negocio.commissionBasisPoints !== undefined"));
  for (const archivo of ["inspector.tsx", "tarjeta-negocio.tsx", "lista.tsx", "analisis.tsx"]) {
    assert.ok(!/realPriceCents|totalCommissionCents/.test(fuente(archivo)), `${archivo}: precio real o comisión de terceros`);
  }
});

test("CA-08/12 el cierre exige unidad, guarda contra doble envío y muestra el 409 sin cerrar", () => {
  const dialogo = fuente("dialogos.tsx");
  assert.ok(dialogo.includes("Elegir unidad") && dialogo.includes("Crear unidad"));
  assert.ok(dialogo.includes("if (faltaUnidad || faltaMonto) return;"));
  assert.ok(dialogo.includes("if (enCurso.current) return;"));
  assert.ok(fuente("api.ts").includes("estado === 409"));
  const vista = fuente("vista.tsx");
  assert.ok(vista.includes("if (r.ok) navegar({ cerrar: undefined }, true);"), "el diálogo solo se cierra con respuesta confirmada");
});

test("CA-07 pérdida: motivo y comentario obligatorios y el error conserva lo escrito", () => {
  const dialogo = fuente("dialogos.tsx");
  assert.ok(dialogo.includes("Elige un motivo.") && dialogo.includes("Escribe un comentario."));
  assert.ok(dialogo.includes("if (!resultado.ok) setError(resultado.error)"));
  const vista = fuente("vista.tsx");
  assert.ok(vista.includes("if (r.ok) setPerdida(null);"));
});

test("el asistente no ejecuta cambios directos: los controles de edición quedan ocultos", () => {
  const vista = fuente("vista.tsx");
  assert.ok(vista.includes('const puedeEditar = rol !== "assistant";'));
  assert.ok(fuente("inspector.tsx").includes("const editable = abierto && puedeEditar;"));
});
