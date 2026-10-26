import assert from "node:assert/strict";
import { test } from "node:test";
import { AJUSTES_CATALOGO } from "../../../application/configuracion/ajustes-catalogo.ts";
import { INTEGRACIONES, estadoDeVariables } from "../../../application/configuracion/integraciones-catalogo.ts";
import { prepararSeo, urlSeoSegura } from "../../../application/configuracion/seo.ts";
import { presenciaIntegraciones } from "../../../infrastructure/env.ts";

test("catálogo recuperado: claves únicas, 121 propuestas sin activación implícita", () => {
  assert.equal(AJUSTES_CATALOGO.length, 121);
  assert.equal(new Set(AJUSTES_CATALOGO.map((a) => a.id)).size, 121);
  assert.equal(new Set(AJUSTES_CATALOGO.map((a) => a.clave)).size, 121);
  assert.ok(AJUSTES_CATALOGO.every((a) => a.efecto && a.tipo && a.responsable));
});
test("integraciones: presencia sólo devuelve nombres, nunca valores ni conexión verificada", () => {
  const nombre = "WHATSAPP_API_TOKEN"; const previo = process.env[nombre];
  try {
    process.env[nombre] = "secreto-sintetico-no-real";
    const p = presenciaIntegraciones(INTEGRACIONES);
    assert.ok(p.whatsapp_business!.presentes.includes(nombre));
    assert.ok(!JSON.stringify(p).includes("secreto-sintetico-no-real"));
    const def = INTEGRACIONES.find((i) => i.id === "whatsapp_business")!;
    assert.equal(estadoDeVariables(def, { whatsapp_business: { presentes: [...def.variables], faltantes: [] } }), "Variables presentes · conexión sin verificar");
    assert.equal(estadoDeVariables(def, undefined), "Sin lectura de configuración");
    assert.ok(INTEGRACIONES.every((i) => i.docs.startsWith("https://") && i.pasos.length >= 4));
  } finally { if (previo === undefined) delete process.env[nombre]; else process.env[nombre] = previo; }
});
test("SEO es una vista previa textual con URL segura y datos estructurados válidos", () => {
  for (const v of ["javascript:alert(1)", "data:text/html,x", "https://usuario:clave@ejemplo.test", "basura"]) assert.equal(urlSeoSegura(v), null);
  const p = prepararSeo(' <script>ejemplo</script> ', "Descripción", "https://ejemplo.test/proyecto");
  assert.equal(p.canonica, "https://ejemplo.test/proyecto");
  assert.equal(JSON.parse(p.schema!).name, "<script>ejemplo</script>");
  assert.equal(prepararSeo("A", "B", "file:///x").schema, null);
});
