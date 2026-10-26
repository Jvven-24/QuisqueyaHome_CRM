import test from "node:test";
import assert from "node:assert/strict";
import { montoExacto, centavosEntrada, cuentaRegresiva, antiguedad, agruparLotes, totalesMoneda } from "./calculos.ts";
test("dinero exacto más allá del entero seguro y entradas decimales",()=>{ assert.equal(montoExacto("900719925474099399", "USD"), "USD 9,007,199,254,740,993.99"); assert.equal(centavosEntrada("10,01"),"1001"); assert.equal(centavosEntrada("1e8"),undefined); assert.equal(centavosEntrada("-1"),undefined); });
test("vencimiento y umbrales usan reloj servidor sin negativos",()=>{const end="2026-10-20T00:00:00Z"; assert.equal(cuentaRegresiva(end,Date.parse(end)+1).seconds,0); assert.equal(cuentaRegresiva(end,Date.parse(end)-3600000).threshold,"Por vencer en menos de 24 horas");});
test("aging separa los límites y las monedas",()=>{for(const [days,expected] of [[0,"0-30"],[30,"0-30"],[31,"31-60"],[60,"31-60"],[61,"61-90"],[90,"61-90"],[91,"+90"]] as const) assert.equal(antiguedad("2026-01-01",new Date(Date.parse("2026-01-01")+days*86400000).toISOString()),expected); assert.deepEqual(totalesMoneda([{currency:"USD",c:"99"},{currency:"DOP",c:"10"}],r=>r.c),[{currency:"USD",cents:"99"},{currency:"DOP",cents:"10"}]);});
test("lotes incluyen solo aprobadas y separan beneficiario y moneda",()=>{const r={id:1,brokerId:1,brokerName:"Asesor",currency:"USD",brokerAmountCents:101,status:"approved"};const groups=agruparLotes([r,{...r,id:2,currency:"DOP"},{...r,id:3,status:"paid"},{...r,id:4,brokerId:null}]);assert.equal(groups.length,3);assert.equal(groups[0]?.cents,"101");assert.equal(groups[2]?.blocked,true);});

test("rechaza centavos number sin precisión antes de formatear, sumar o agrupar", () => {
 const row = { id: 1, brokerId: 1, brokerName: "Asesor", currency: "USD", status: "approved" };
 for (const value of [Number.MAX_SAFE_INTEGER + 1, Number.MIN_SAFE_INTEGER - 1, 1.5, Infinity, NaN]) {
  assert.throws(() => montoExacto(value, "USD"), { name: "RangeError", message: /centavos no seguro/ });
  assert.throws(() => totalesMoneda([{ currency: "USD", value }], r => r.value), { name: "RangeError" });
  assert.throws(() => agruparLotes([{ ...row, brokerAmountCents: value }]), { name: "RangeError" });
 }
 assert.equal(montoExacto(Number.MAX_SAFE_INTEGER, "USD"), montoExacto(String(Number.MAX_SAFE_INTEGER), "USD"));
 assert.deepEqual(totalesMoneda([{currency:"USD", value:"900719925474099399"}, {currency:"USD", value:1n}], r => r.value), [{currency:"USD", cents:"900719925474099400"}]);
});
