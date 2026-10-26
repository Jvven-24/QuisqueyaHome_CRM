import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {filtrarBiblioteca,cursoSeleccionadoValido} from "./biblioteca.ts";
test("biblioteca combina acentos, categoría y matrícula sin inventar cursos",()=>{
 const rows=[{id:1,codigo:"A-1",nombre:"Inducción",categoria:"Formación",matriculado:true},{id:2,codigo:"A-2",nombre:"Introducción al catálogo",categoria:"Producto",matriculado:false}];
 assert.deepEqual(filtrarBiblioteca(rows,"induccion","Formación",true).map(c=>c.id),[1]);
 assert.deepEqual(filtrarBiblioteca(rows,"","Producto",true),[]);assert.equal(rows.length,2);
});
test("matrícula sólo admite ID seguro presente en catálogo real",()=>{
 const rows=[{id:42}];assert.equal(cursoSeleccionadoValido(42,rows),true);for(const id of [0,3,1.5,NaN,Number.MAX_SAFE_INTEGER+1])assert.equal(cursoSeleccionadoValido(id,rows),false);
 const source=readFileSync(new URL("../administracion/vista.tsx",import.meta.url),"utf8");assert.match(source,/if \(!cursoSeleccionadoValido\(cursoMatriculaId,cursos\)\)/);assert.doesNotMatch(source,/initialCursos\[0\]\.id : 3/);
});
test("Academy conserva los servicios reales y aprobación independiente",()=>{
 const view=readFileSync(new URL("../vista.tsx",import.meta.url),"utf8");
 assert.match(view,/\/api\/academy\/solicitudes/);assert.match(view,/\/api\/academy\/revisiones/);assert.match(view,/constancias/);assert.match(view,/huella SHA-256/);
 const admin=readFileSync(new URL("../administracion/vista.tsx",import.meta.url),"utf8");assert.match(admin,/\/api\/academy\/cursos/);assert.match(admin,/\/api\/academy\/matriculas/);assert.match(admin,/cert.brokerId !== usuarioId/);
});
