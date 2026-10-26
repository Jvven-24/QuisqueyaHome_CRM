import assert from "node:assert/strict";
import { test } from "node:test";
import { AprendizajeEnMemoria } from "./en-memoria.ts";

test("AprendizajePort: comprobarSalud reporta estado disponible, versión LTS y enlaces de autoría Moodle", async () => {
  const puerto = new AprendizajeEnMemoria();
  const salud = await puerto.comprobarSalud();

  assert.equal(salud.disponible, true);
  assert.equal(salud.url, "http://127.0.0.1:9330");
  assert.equal(salud.urlCrearCurso, "http://127.0.0.1:9330/course/edit.php?category=1");
  assert.ok(salud.version.includes("4.5.15"));
});

test("AprendizajePort: listarCursos retorna catálogo oficial de formación con enlaces de lanzamiento y edición", async () => {
  const puerto = new AprendizajeEnMemoria();
  const cursos = await puerto.listarCursos();

  assert.equal(cursos.length, 3);
  assert.equal(cursos[0]?.codigo, "QHA-CONFOTUR");
  assert.equal(cursos[0]?.urlEdicion, "http://127.0.0.1:9330/course/edit.php?id=2");
  assert.equal(cursos[1]?.codigo, "QHA-RESERVAS");
  assert.equal(cursos[2]?.codigo, "QHA-PLAFT");
});

test("AprendizajePort: crearCurso y matricularUsuarios registran curso y progreso por persona", async () => {
  const puerto = new AprendizajeEnMemoria();
  const curso = await puerto.crearCurso({
    nombre: "Inducción Quisqueya Home — Asesor inmobiliario en Punta Cana",
    codigo: "QHA-IND-PC",
    resumen: "Curso oficial de inducción comercial y legal CONFOTUR en Punta Cana.",
    categoriaId: 1,
    notaMinima: 80,
  });

  assert.equal(curso.codigo, "QHA-IND-PC");
  assert.equal(curso.notaMinima, 80);

  const sync = await puerto.asegurarUsuario({
    localUserId: 2,
    email: "broker.prueba@quisqueyahome.do",
    fullName: "Broker de Prueba",
    roleSlug: "broker",
  });

  const mat = await puerto.matricularUsuarios(Number(curso.id), [
    { moodleUserId: sync.moodleUserId, rolCurso: "student" },
  ]);
  assert.equal(mat.matriculados, 1);

  const progreso = await puerto.listarProgresoCurso(Number(curso.id));
  assert.equal(progreso.length, 1);
  assert.equal(progreso[0]?.email, "broker.prueba@quisqueyahome.do");
  assert.equal(progreso[0]?.rolCurso, "student");
});

test("AprendizajePort: evidencia caída reporta null sin arrojar excepción", async () => {
  const puerto = new AprendizajeEnMemoria();
  puerto.disponible = false;

  const salud = await puerto.comprobarSalud();
  assert.equal(salud.disponible, false);

  const cursos = await puerto.listarCursos();
  assert.deepEqual(cursos, []);

  const evidencia = await puerto.obtenerEvidencia(1, "QHA-CONFOTUR-01");
  assert.equal(evidencia, null);
});
