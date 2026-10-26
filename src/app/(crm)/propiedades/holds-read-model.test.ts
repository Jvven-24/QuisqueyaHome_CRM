import assert from "node:assert/strict";
import {test} from "node:test";
import {visibleHoldSnapshots} from "./holds-read-model.ts";
test("S4: holds se proyectan sin identidad/motivo y solo para la unidad solicitada",()=>{const expiry="2026-10-20T16:00:00Z";const result=visibleHoldSnapshots({ok:true,holds:[{status:"activo",expiresAt:expiry,rowVersion:3,holderId:99,reason:"privado",units:[{unitId:7}]},{status:"activo",expiresAt:expiry,rowVersion:2,units:[{unitId:8}]}]},7);assert.deepEqual(result,[{expiresAt:expiry,version:3}]);assert.equal(JSON.stringify(result).includes("privado"),false);});
test("S4: una respuesta inválida de holds falla en vez de fingir disponibilidad",()=>{assert.throws(()=>visibleHoldSnapshots({ok:false,holds:[]},7));assert.throws(()=>visibleHoldSnapshots({ok:true,holds:[{status:"activo",expiresAt:"no-fecha",rowVersion:1,units:[]}]},7));});
