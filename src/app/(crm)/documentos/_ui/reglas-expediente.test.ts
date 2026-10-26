import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {metadatosArchivoDeEjemplo,validarRevisionDocumento} from "./reglas-expediente.ts";
const read=(path:string)=>readFileSync(new URL(path,import.meta.url),"utf8");
test("selección local de documento limita tipo y tamaño, sin acreditar seguridad",()=>{
 assert.equal(metadatosArchivoDeEjemplo({name:"muestra.pdf",size:100,type:"application/pdf"}).ok,true);
 assert.match(metadatosArchivoDeEjemplo({name:"muestra.pdf",size:100,type:"application/pdf"}).mensaje,/No se leyó, escaneó ni subió/);
 assert.equal(metadatosArchivoDeEjemplo({name:"programa.exe",size:100,type:"application/octet-stream"}).ok,false);
 assert.equal(metadatosArchivoDeEjemplo({name:"grande.pdf",size:11*1024*1024,type:"application/pdf"}).ok,false);
 assert.equal(metadatosArchivoDeEjemplo({name:"vacio.pdf",size:0,type:"application/pdf"}).ok,false);
});
test("revisión documental exige motivo y no ejecuta firma/publicación",()=>{
 assert.deepEqual(Object.keys(validarRevisionDocumento({asunto:"",motivo:"",confirma:false})),["asunto","motivo","confirma"]);
 assert.deepEqual(validarRevisionDocumento({asunto:"Ejemplo",motivo:"Revisión de evidencia pendiente",confirma:true}),{});
 const view=read("./expedientes-previa.tsx");assert.doesNotMatch(view,/fetch\s*\(|XMLHttpRequest|sendBeacon|localStorage|dangerouslySetInnerHTML/);assert.match(view,/Vista previa · datos de ejemplo/);
});
test("documentos usa permiso deals y portal settings antes de renderizar",()=>{
 for(const path of ["../page.tsx","../firmas/page.tsx","../kyc/page.tsx"])assert.match(read(path),/requireScopeInPage\(actor,"deals","view"\)/);
 for(const path of ["../../portal/page.tsx","../../portal/publicacion/page.tsx","../../portal/catalogo/page.tsx","../../portal/comprador/page.tsx","../../portal/promotor/page.tsx"])assert.match(read(path),/requireScopeInPage\(actor,"settings","view"\)/);
});
