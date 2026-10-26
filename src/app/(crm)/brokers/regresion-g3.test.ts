import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
const leer = (ruta: string) => readFileSync(new URL(ruta, import.meta.url), "utf8");
test("H-08: brokers, ficha y metas leen la meta del periodo sin fallback al perfil", () => {
  for (const ruta of ["./page.tsx", "./[id]/page.tsx", "../metas/page.tsx"]) {
    const codigo = leer(ruta);
    assert.doesNotMatch(codigo, /monthlyTargetDeals|profileTarget/);
    assert.match(codigo, /goals/);
  }
});
test("H-01: cliente y API comparten contrato sin convertir vacío en cero", () => {
  const vista = leer("../metas/vista.tsx");
  assert.match(vista, /leerObjetivoFormulario\(valorMeta\)/);
  assert.match(vista, /setValorMeta\(e.target.value\)/);
  assert.match(leer("../../api/metas/route.ts"), /import.*FijarMetaInput.*application\/metas\/validacion/);
});
test("M41: no vuelven los simuladores ni reglas fiscales ficticias a las vistas", () => {
  assert.doesNotMatch(leer("./vista.tsx"), /SimuladorCoBrokingModal|precioVentaUSD/);
  assert.doesNotMatch(leer("../comisiones/vista.tsx"), /calculoFiscal|retencionIsrCents|regimenFiscal|pctCaptador/);
});


test("H-12: históricos y tendencias no completan meses ausentes con ceros", () => {
  const pagina = leer("../metas/page.tsx");
  assert.doesNotMatch(pagina, /Array\(12\)\.fill\(0\)|anualPorMes/);
  assert.match(leer("../metas/vista.tsx"), /Sin historial de metas/);
});

test("H-02: la desconexión conserva la página y captura enlaces antes del shell", () => {
  const estado = leer("./estado-conexion.tsx");
  assert.match(estado, /document\.addEventListener\("click", protegerNavegacion, true\)/);
  assert.match(estado, /event\.preventDefault\(\)/);
  assert.match(estado, /event\.stopPropagation\(\)/);
  for (const ruta of ["./layout.tsx", "../metas/layout.tsx", "../comisiones/layout.tsx"]) {
    assert.match(leer(ruta), /<EstadoConexion \/>/);
  }
});

test("H-04: ficha inexistente tiene estado propio y no revela existencia ajena", () => {
  assert.match(leer("./[id]/not-found.tsx"), /Asesor no encontrado/);
  assert.match(leer("./[id]/page.tsx"), /reaches\(actor, scope, broker.userId\)/);
});
