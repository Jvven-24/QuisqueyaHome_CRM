import assert from "node:assert/strict";
import { test } from "node:test";
import { unitFormPayload, availabilitySummary, publicInventoryCsv } from "./presentacion.ts";

test("S4: alta y edición descriptiva nunca envían estado ni campos de compromisos", () => {
  const raw = {code: " A-101 ", status: "sold", commitmentId: "8", realPrice: "100.25", publicRangeMin: "110.25", bedrooms: "", publicRangeMax: ""};
  const created = unitFormPayload(raw, {editing: false, canEditRealPrice: false});
  assert.deepEqual(created, {code:"A-101", publicRangeMinCents:11025});
  const edited = unitFormPayload(raw, {editing: true, canEditRealPrice: true, expectedVersion: 3});
  assert.deepEqual(edited, {code:"A-101", bedrooms:null, realPriceCents:10025, publicRangeMinCents:11025, publicRangeMaxCents:null, expectedVersion:3});
  assert.equal(Object.hasOwn(created,"status"),false);assert.equal(Object.hasOwn(edited,"status"),false);
});

test("S4: singular y plural canónicos no mezclan 1 con vendidas/reservadas", () => {
  assert.equal(availabilitySummary(1,1,1), "1 vendida · 1 reservada · 1 no disponible");
  assert.equal(availabilitySummary(0,2,3), "0 vendidas · 2 reservadas · 3 no disponibles");
});

test("S4: número inválido no se convierte en null/cero al serializar",()=>{const payload=unitFormPayload({code:"A-1",bedrooms:"no-numero",publicRangeMin:"1e9999"},{editing:false,canEditRealPrice:false});const serialized=JSON.parse(JSON.stringify(payload));assert.equal(serialized.bedrooms,"no-numero");assert.equal(serialized.publicRangeMinCents,"1e9999");});

test("S4: snapshot CSV no exporta secretos/precio real y neutraliza fórmulas",()=>{const row={code:"=HYPERLINK(test)",floorLevel:null,status:"available",currency:"USD",publicRangeMinCents:null,publicRangeMaxCents:10000,rowVersion:2,realPriceCents:987654321,internalNotes:"secreto"};const csv=publicInventoryCsv([row],"2026-10-19T00:00:00Z");assert.ok(csv.includes("'=HYPERLINK"));assert.equal(csv.includes("987654321"),false);assert.equal(csv.includes("secreto"),false);assert.ok(csv.includes('"2026-10-19T00:00:00Z"'));});
