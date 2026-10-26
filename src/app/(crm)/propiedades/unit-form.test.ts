import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { test } from "node:test";
import React from "react";
import ts from "typescript";
import { OPERATION_TYPES, PRICE_PERIODS, UNIT_STATUSES } from "../../../domain/catalogs.ts";
import { unitFormPayload, availabilitySummary } from "./presentacion.ts";
type Node={type:unknown;props:Record<string,unknown>};
function walk(value:unknown):Node[]{if(Array.isArray(value))return value.flatMap(walk);if(!value||typeof value!=="object"||!("props"in value))return [];const node=value as Node;return [node,...walk(node.props.children)];}

for(const editing of [false,true])test("S4: handler real de "+(editing?"edición":"alta")+" no provoca 409 por status y confirma solo al guardar",async()=>{
 const require=createRequire(import.meta.url);let refs=0;let closed=0;let refreshed=0;const sent:{method:string;data:Record<string,unknown>}[]=[];
 const raw={code:"A-101",status:"sold",publicRangeMin:"100.25",realPrice:"80.25"};
 class Form {entries(){return Object.entries(raw)[Symbol.iterator]();}}
 const react={...React,default:React,useRef:(value:unknown)=>({current:refs++===0?{}:value}),useState:(value:unknown)=>[value,()=>{}]};
 const mocks:Record<string,unknown>={react,"next/navigation":{useRouter:()=>({refresh(){refreshed++;}})},"@/hooks/use-focus-trap":{useFocusTrap:()=>({current:null})},
  "../presentacion":{unitFormPayload,availabilitySummary},"../_componentes/project-dossier":{},"../_componentes/unit-inspector":{},"../_componentes/floor-matrix":{},
  "@/domain/unidades":{},"@/application/proyectos/validacion":{},"@/domain/zona-horaria":{},"@/domain/catalogs":{OPERATION_TYPES,PRICE_PERIODS,UNIT_STATUSES},
  "../../_ui/prototipo-ui":{},"../../_ui/alerta-error-formulario":{},"../../_ui/formato":{centavosAUnidad:(value:number)=>value/100},"../../_ui/estados":{},"../_formulario-proyecto":{},"@/components/ui/cotizador-confotur-modal":{},"@/components/ui/dialog":{},"@/components/ui/button":{}};
 const source=readFileSync(new URL("./[slug]/vista.tsx",import.meta.url),"utf8")+"\nexport { FormularioUnidad };";
 const code=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText;
 const exports:Record<string,(props:Record<string,unknown>)=>unknown>={};
 const request=async(_url:string,init:RequestInit)=>{const data=JSON.parse(String(init.body)) as Record<string,unknown>;sent.push({method:String(init.method),data});return Object.hasOwn(data,"status")?new Response("{}",{status:409}):Response.json({ok:true});};
 new Function("require","exports","fetch","FormData",code)((id:string)=>id in mocks?mocks[id]:require(id),exports,request,Form);
 const tree=exports.FormularioUnidad!({proyectoId:3,unidad:editing?{id:7,code:"A-101",status:"sold",rowVersion:4}:undefined,puedeEditarPrecioReal:false,onClose(){closed++;}});
 const form=walk(tree).find(node=>node.type==="form");assert.ok(form);
 await (form.props.onSubmit as (event:{preventDefault:()=>void})=>Promise<void>)({preventDefault(){}});
 assert.equal(sent.length,1);assert.equal(sent[0]!.method,editing?"PATCH":"POST");
 assert.equal(Object.hasOwn(sent[0]!.data,"status"),false);assert.equal(Object.hasOwn(sent[0]!.data,"realPriceCents"),false);
 assert.equal(sent[0]!.data.publicRangeMinCents,10025);assert.equal(sent[0]!.data.expectedVersion,editing?4:undefined);
 assert.equal(refreshed,1);assert.equal(closed,1);
});
