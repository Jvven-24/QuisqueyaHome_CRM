import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const read=(path:string)=>readFileSync(new URL(path,import.meta.url),"utf8");
test("las vistas previas de S5 no despachan ni persisten operaciones de ejemplo",()=>{
 const preview=read("./vista-previa.tsx");
 assert.doesNotMatch(preview,/fetch\s*\(|XMLHttpRequest|sendBeacon/);
 assert.match(preview,/Vista previa · datos de ejemplo/);
 const templates=read("../../comunicaciones/vista.tsx");
 assert.match(templates,/if \(!puedeDespachar\)/);
 assert.match(templates,/if \(!revisionHumana\)/);
 assert.match(templates,/if \(requiereRevisionFiscal\(cuerpoTemplate/);
 assert.match(templates,/generarEnlaceWhatsApp/);
 assert.match(templates,/generarEnlaceTelegram/);
 assert.doesNotMatch(templates,/Ã|Â|â€/);
 assert.doesNotMatch(templates,/~120ms|0\.045\/msg|0\.001\/msg/);
});
test("cada pantalla de ejemplo autoriza su recurso en servidor",()=>{
 for(const path of ["../visitas/page.tsx","../viajes/page.tsx","../../tareas/recurrencias/page.tsx"]){const source=read(path);assert.match(source,/requireActor\(\)/);assert.match(source,/requireScopeInPage\(actor,"activities","view"\)/);}
 for(const path of ["../../comunicaciones/bandeja/page.tsx","../../comunicaciones/campanas/page.tsx"]){assert.match(read(path),/requireScopeInPage\(actor,"communications","view"\)/);}
 const repo=read("../../../../infrastructure/db/repos/agenda-operativa.ts");
 assert.match(repo,/visibleRows\(actor,scope,activities.assigneeId,activities.deletedAt\)/);
});
