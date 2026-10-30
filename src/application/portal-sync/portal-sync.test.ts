import assert from "node:assert/strict";
import { test } from "node:test";
import { exigirPortalSync, planificar, portalSyncHabilitado, reconciliarPortal } from "./casos-de-uso.ts";
import { fuenteEnMemoria, portalEnMemoria } from "./en-memoria.ts";
import { firmar, verificarFirma } from "./firma.ts";
import { canonico, estadoPublico, huellaDe, proyectarProyecto, type FilaProyecto, type FilaUnidad } from "./proyeccion.ts";

const fila = (slug: string, extra: Partial<FilaProyecto> = {}): FilaProyecto => ({
  slug, name: `Proyecto ${slug}`, zone: "Bávaro", projectType: "blueprint", operationType: "sale", developer: "Dev", description: "Desc",
  estimatedDeliveryDate: "2028-01-01", progressPercent: 10, currency: "USD", publicRangeMinCents: 10000000, publicRangeMaxCents: 20000000, videoUrl: null, ...extra,
});
const unidad = (code: string, status = "available"): FilaUnidad => ({ code, unitType: "apto", bedrooms: 2, bathrooms: 2, builtAreaM2: 90, floorLevel: 3, tower: "A", status, publicRangeMinCents: 15000000, publicRangeMaxCents: 16000000 });
const proyecto = (slug: string, extra: Partial<FilaProyecto> = {}, us: FilaUnidad[] = [unidad("A-2"), unidad("A-10")]) => proyectarProyecto(fila(slug, extra), us);

test("proyección: lista blanca, sin precios reales ni notas internas, unidades en orden natural", () => {
  const sucia = { ...fila("torre"), internalPriceCents: 1, brokerId: 9, internalNotes: "secreto" } as FilaProyecto;
  const u = { ...unidad("A-1"), realPriceCents: 123, internalNotes: "no publicar", brokerId: 4 } as FilaUnidad;
  const p = proyectarProyecto(sucia, [unidad("A-10"), u, unidad("A-2")]);
  const texto = JSON.stringify(p);
  for (const prohibido of ["internalPrice", "brokerId", "internalNotes", "realPrice", "secreto", "no publicar", "123"]) assert.ok(!texto.includes(prohibido), prohibido);
  assert.deepEqual(p.units.map((x) => x.code), ["A-1", "A-2", "A-10"]);
  assert.equal(estadoPublico("sold"), "unavailable"); assert.equal(estadoPublico("reserved"), "reserved"); assert.equal(estadoPublico("available"), "available");
});

test("huella: estable ante el orden de claves y de unidades; cambia con cualquier dato público", () => {
  assert.equal(canonico({ b: 1, a: [2, { d: 1, c: 2 }] }), canonico({ a: [2, { c: 2, d: 1 }], b: 1 }));
  const a = proyecto("x", {}, [unidad("1"), unidad("2")]); const b = proyecto("x", {}, [unidad("2"), unidad("1")]);
  assert.equal(huellaDe(a), huellaDe(b));
  assert.notEqual(huellaDe(a), huellaDe(proyecto("x", { progressPercent: 11 })));
  assert.notEqual(huellaDe(a), huellaDe(proyecto("x", {}, [unidad("1"), unidad("2", "sold")])));
});

test("reconciliar: crea, actualiza y retira; la segunda corrida no hace nada (idempotente)", async () => {
  const nuevo = proyecto("nuevo"); const igual = proyecto("igual"); const cambiado = proyecto("cambiado", { progressPercent: 50 }); const viejoCambiado = proyecto("cambiado", { progressPercent: 40 });
  const portal = portalEnMemoria([{ proyecto: igual, huella: huellaDe(igual) }, { proyecto: viejoCambiado, huella: huellaDe(viejoCambiado) }, { proyecto: proyecto("retirado"), huella: "h" }]);
  const deps = { fuente: fuenteEnMemoria([nuevo, igual, cambiado]), portal: portal.puerto };
  const r1 = await reconciliarPortal(deps);
  assert.deepEqual([r1.creados, r1.actualizados, r1.retirados, r1.sinCambios, r1.errores.length], [1, 1, 1, 1, 0]);
  assert.deepEqual(portal.llamadas.map((l) => `${l.op}:${l.slug}`).sort(), ["publicar:cambiado", "publicar:nuevo", "retirar:retirado"]);
  portal.llamadas.length = 0;
  const r2 = await reconciliarPortal(deps);
  assert.deepEqual([r2.creados, r2.actualizados, r2.retirados, r2.sinCambios], [0, 0, 0, 3]);
  assert.equal(portal.llamadas.length, 0);
});

test("reconciliar: simulacro informa sin escribir; un proyecto que falla no frena a los demás y se reintenta", async () => {
  const a = proyecto("a"); const b = proyecto("b");
  const portal = portalEnMemoria();
  const deps = { fuente: fuenteEnMemoria([a, b]), portal: portal.puerto };
  const seco = await reconciliarPortal(deps, { simulacro: true });
  assert.equal(seco.simulacro, true); assert.equal(seco.creados, 2); assert.equal(portal.llamadas.length, 0);
  portal.fallar.add("a");
  const r = await reconciliarPortal(deps);
  assert.equal(r.creados, 1); assert.deepEqual(r.errores, [{ slug: "a", error: "Portal no disponible" }]);
  portal.fallar.clear();
  const r2 = await reconciliarPortal(deps);
  assert.deepEqual([r2.creados, r2.sinCambios, r2.errores.length], [1, 1, 0]);
});

test("planificar: despublicar en el CRM retira del portal", async () => {
  const p = proyecto("p");
  const portal = portalEnMemoria([{ proyecto: p, huella: huellaDe(p) }]);
  const plan = await planificar({ fuente: fuenteEnMemoria([]), portal: portal.puerto });
  assert.deepEqual(plan.acciones, [{ tipo: "retirar", slug: "p" }]);
});

test("bandera: apagada por defecto; solo valores explícitos la encienden", () => {
  for (const v of [undefined, "", "0", "false", "no", "quizás"]) assert.equal(portalSyncHabilitado({ PORTAL_SYNC_ENABLED: v }), false);
  for (const v of ["1", "true", "TRUE", " sí "]) assert.equal(portalSyncHabilitado({ PORTAL_SYNC_ENABLED: v }), true);
  assert.throws(() => exigirPortalSync({}), /desactivada/);
});

test("firma HMAC: válida, alterada, caducada y sin secreto", () => {
  const ahora = 1_800_000_000_000; const ts = ahora / 1000;
  const firma = firmar("s3", ts, "put", "/api/x", "{}");
  const base = { timestamp: ts, metodo: "PUT", ruta: "/api/x", cuerpo: "{}", firma };
  assert.equal(verificarFirma("s3", base, ahora), true);
  assert.equal(verificarFirma("otro", base, ahora), false);
  assert.equal(verificarFirma("s3", { ...base, cuerpo: "{ }" }, ahora), false);
  assert.equal(verificarFirma("s3", { ...base, ruta: "/api/y" }, ahora), false);
  assert.equal(verificarFirma("s3", base, ahora + 301_000), false);
  assert.equal(verificarFirma("", base, ahora), false);
  assert.equal(verificarFirma("s3", { ...base, firma: "zz" }, ahora), false);
});
