import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";

const leer = (ruta: string) => readFileSync(new URL(ruta, import.meta.url), "utf8");

function archivos(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entrada) => {
    const ruta = join(dir, entrada.name);
    return entrada.isDirectory() ? archivos(ruta) : [ruta];
  });
}

test("controles unificados usan Radix, objetivo de 44px y foco oro visible", () => {
  const checkbox = leer("./checkbox.tsx");
  const radio = leer("./radio-group.tsx");
  const toggle = leer("./switch.tsx");

  assert.match(checkbox, /Checkbox as CheckboxPrimitive/);
  assert.match(checkbox, /size-11/);
  assert.match(checkbox, /size-\[17px\]/);
  assert.match(checkbox, /data-\[state=indeterminate\]/);
  assert.match(checkbox, /focus-visible:ring-2[^\"]*ring-gold-700/);
  assert.match(radio, /RadioGroup as RadioGroupPrimitive/);
  assert.match(radio, /size-11/);
  assert.match(radio, /size-\[17px\]/);
  assert.match(toggle, /Switch as SwitchPrimitive/);
  assert.match(toggle, /size-11/);
  assert.match(toggle, /h-\[18px\] w-8/);
});

test("DataTable comunica selección parcial como estado indeterminado", () => {
  const table = leer("./data-table.tsx");
  assert.match(table, /algunasMarcadas/);
  assert.match(table, /checked=\{todasMarcadas \? true : algunasMarcadas \? "indeterminate" : false\}/);
});

test("las vistas CRM fuera de Metas y tareas no conservan checkbox o radio nativo", () => {
  const crmFiles = archivos(join(process.cwd(), "src/app/(crm)"));
  const prohibidos = crmFiles.filter((ruta) =>
    !/(^|\/)metas\/|(^|\/)tareas\/|(^|\/)auth\/|login|correo/.test(ruta)
  );
  const encontrados = prohibidos.flatMap((ruta) => {
    const source = readFileSync(ruta, "utf8");
    return /<input\b[^>]*\btype\s*=\s*["'](?:checkbox|radio)["']/.test(source) ? [ruta] : [];
  });
  assert.deepEqual(encontrados, []);
});
