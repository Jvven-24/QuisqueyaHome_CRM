import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync,existsSync} from "node:fs";
import {validarBorradorRed,pasoAltaValido} from "./red-reglas.ts";
const read=(path:string)=>readFileSync(new URL(path,import.meta.url),"utf8");
test("alta guiada no salta identidad ni revisión documental",()=>{assert.equal(pasoAltaValido(0,["","Agencia"],false,false),false);assert.equal(pasoAltaValido(0,["Perfil ejemplo","Agencia ejemplo"],false,false),true);assert.equal(pasoAltaValido(1,[],false,false),false);assert.equal(pasoAltaValido(2,[],true,false),false);});
test("borrador exige motivo y no equivale a operación persistida",()=>{assert.deepEqual(Object.keys(validarBorradorRed({asunto:"",motivo:"",confirma:false})),["asunto","motivo","confirma"]);assert.deepEqual(validarBorradorRed({asunto:"Ejemplo",motivo:"Evidencia pendiente",confirma:true}),{});assert.doesNotMatch(read("./red-previa.tsx"),/fetch\s*\(|XMLHttpRequest|sendBeacon|localStorage/);});
test("404 conserva preflight y no introduce loading ancestro en brokers",()=>{const page=read("../[id]/page.tsx");assert.match(page,/generateViewport/);assert.match(page,/reaches\(actor, scope, broker.userId\)/);assert.match(page,/notFound\(\)/);assert.equal(existsSync(new URL("../loading.tsx",import.meta.url)),false);});
test("pantallas de comunidad autorizan brokers view en servidor",()=>{for(const path of ["../../comunidad/page.tsx","../../comunidad/demandas/page.tsx","../../comunidad/eventos/page.tsx","../../comunidad/moderacion/page.tsx"]){assert.match(read(path),/requireScopeInPage\(actor,"brokers","view"\)/);}});
