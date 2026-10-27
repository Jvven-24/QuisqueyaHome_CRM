import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { fechaEmisionAcademy, fechaVencimientoAcademy, horaSincronizacionAcademy } from "./academy-fechas.ts";
import { estadoVigenciaConstancia } from "../domain/academy-vigencia.ts";

test("Academy: mismo texto con servidor UTC y navegadores en otras zonas", () => {
  const anterior = process.env.TZ;
  try {
    for (const zona of ["UTC", "America/Santo_Domingo", "America/Los_Angeles", "Asia/Tokyo"]) {
      process.env.TZ = zona;
      const instante = new Date("2026-01-01T03:07:00Z");
      assert.equal(fechaEmisionAcademy(instante), "31/12/2025");
      assert.equal(horaSincronizacionAcademy(instante), "11:07 p.\u00a0m.");
      assert.equal(fechaVencimientoAcademy(instante), "01/01/2026");
    }
  } finally {
    if (anterior === undefined) delete process.env.TZ;
    else process.env.TZ = anterior;
  }
});

test("Academy: medianoche, mediodía y minutos con cero conservan formato", () => {
  for (const [iso, esperado] of [
    ["2026-10-27T04:00:00Z", "12:00 a.\u00a0m."],
    ["2026-10-27T13:05:00Z", "09:05 a.\u00a0m."],
    ["2026-10-27T16:00:00Z", "12:00 p.\u00a0m."],
  ] as const) {
    assert.equal(horaSincronizacionAcademy(new Date(iso)), esperado);
  }
  assert.equal(fechaEmisionAcademy(new Date("2028-03-01T03:59:59Z")), "29/2/2028");
});

test("Academy: el instante serializado evita cambiar vigencia entre SSR e hidratación", () => {
  const constancia = { status: "vigente" as const, issuedAt: new Date("2025-10-27T14:00:00Z") };
  for (const limite of ["2026-08-28T14:00:00Z", "2026-10-27T14:00:00Z"]) {
    const servidor = new Date(Date.parse(limite) - 1);
    const props = JSON.parse(JSON.stringify({ instanteInicial: servidor.toISOString() }));
    assert.equal(
      estadoVigenciaConstancia(constancia, new Date(props.instanteInicial)),
      estadoVigenciaConstancia(constancia, servidor),
    );
    assert.notEqual(
      estadoVigenciaConstancia(constancia, new Date(limite)),
      estadoVigenciaConstancia(constancia, servidor),
      "leer el reloj del cliente al cruzar el límite produciría otro estado",
    );
  }
});

test("Academy: el render conecta el reloj SSR y los formatos deterministas", () => {
  const pagina = readFileSync(new URL("../app/(crm)/academy/page.tsx", import.meta.url), "utf8");
  const vista = readFileSync(new URL("../app/(crm)/academy/vista.tsx", import.meta.url), "utf8");
  assert.match(pagina, /instanteInicial=\{new Date\(\)\.toISOString\(\)\}/);
  assert.match(vista, /useState\(false\)/);
  assert.match(vista, /useEffect\(\(\) => setHidratada\(true\), \[\]\)/);
  assert.match(vista, /hidratada \? Date\.now\(\) : Date\.parse\(instanteInicial\)/);
  assert.doesNotMatch(vista, /new Date\(\)|toLocale(?:Date|Time)String/);
  assert.match(vista, /horaSincronizacionAcademy\(new Date\(ev\.sincronizadoEn\)\)/);
  assert.match(vista, /fechaEmisionAcademy\(new Date\(cert\.issuedAt\)\)/);
});
