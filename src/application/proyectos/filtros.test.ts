import { test } from "node:test";
import assert from "node:assert/strict";
import { filtrarProyectos } from "./filtros.ts";
const proyectos = [{ name: "Araya", zone: "Punta Cana", projectType: "presale" }, { name: "Vista Bávaro", zone: null, projectType: "blueprint" }];
test("catálogo: búsqueda parcial sin acentos y filtros combinados, sin inventar coincidencias", () => {
  assert.deepEqual(filtrarProyectos(proyectos, "zzzqqq"), []);
  assert.deepEqual(filtrarProyectos(proyectos, "punta"), [proyectos[0]]);
  assert.deepEqual(filtrarProyectos(proyectos, "bavaro", "blueprint"), [proyectos[1]]);
  assert.deepEqual(filtrarProyectos(proyectos, "punta", "blueprint"), []);
  assert.deepEqual(filtrarProyectos(proyectos, ""), proyectos);
});
