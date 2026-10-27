import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {esVideoDirectoSeguro} from "./reproductor.ts";
test("reproductor incrusta sólo video directo https y ofrece el resto como enlace",()=>{
 assert.equal(esVideoDirectoSeguro("https://cdn.example.com/leccion-1.mp4"),true);
 assert.equal(esVideoDirectoSeguro("https://cdn.example.com/leccion-1.WEBM?token=abc"),true);
 for(const url of [null,"",undefined,"http://cdn.example.com/a.mp4","javascript:alert(1)","https://youtube.com/watch?v=1","https://cdn.example.com/a.mp4.html","no es una url"])
  assert.equal(esVideoDirectoSeguro(url as string|null|undefined),false,String(url));
});
test("vista de Academy usa el reproductor en móvil y botones táctiles de 44 px",()=>{
 const view=readFileSync(new URL("../vista.tsx",import.meta.url),"utf8");
 assert.match(view,/import \{ReproductorLeccion\} from "\.\/_ui\/reproductor-leccion"/);
 assert.match(view,/item\.videoUrl && \(/);
 assert.match(view,/aria-pressed=\{paso\.isCompleted\}/);
 const reproductor=readFileSync(new URL("./reproductor-leccion.tsx",import.meta.url),"utf8");
 assert.match(reproductor,/playsInline/);assert.match(reproductor,/bg-gold-50/);assert.match(reproductor,/bg-navy-950/);
 assert.doesNotMatch(reproductor,/min-h-\[(36|38|40)px\]/);
});
