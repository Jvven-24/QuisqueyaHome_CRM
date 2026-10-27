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
test("controles de Academy miden al menos 44 px y las pestañas hacen scroll suave en móvil",()=>{
 for(const file of ["../vista.tsx","../administracion/vista.tsx"]){
  const source=readFileSync(new URL(file,import.meta.url),"utf8");
  assert.doesNotMatch(source,/min-h-\[(36|38)px\]/);
  assert.match(source,/role="tablist"[\s\S]*?className="flex flex-nowrap[^"]*overflow-x-auto scroll-smooth snap-x/);
 }
});
test("finalizar contenido o paso exige academy:edit y las constancias usan navy y oro",()=>{
 for(const file of ["../../../api/academy/[id]/progreso/route.ts","../../../api/academy/checklist/[id]/route.ts"]){
  const route=readFileSync(new URL(file,import.meta.url),"utf8");
  assert.match(route,/can\(actor, "academy", "edit"\)/);assert.match(route,/status: 403/);
 }
 const view=readFileSync(new URL("../vista.tsx",import.meta.url),"utf8");
 assert.match(view,/bg-navy-900 border border-gold-600 px-4 py-2 text-xs font-semibold text-gold-100/);assert.match(view,/border-t-gold-600/);assert.match(view,/bg-gold-100 border border-gold-600/);
});
