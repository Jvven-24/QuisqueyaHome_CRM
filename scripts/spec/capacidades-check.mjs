// Valida capacidades.json: profundidad (muchas capacidades por sistema), URL oficial por fila y coherencia de «verificado».
// Uso: node scripts/spec/capacidades-check.mjs [ruta]
import { readFileSync } from "node:fs";
const ruta = process.argv[2] ?? ".viltrum/vre-os/spec/integraciones/capacidades.json";
const filas = JSON.parse(readFileSync(ruta, "utf8").replace(/^﻿/, ""));
const e = [];
const por = {};
for (const f of filas) (por[f.sistema] ??= []).push(f);
const MIN = { Twenty: 12, Moodle: 10, Chatwoot: 8, "Evolution API": 8, "Cal.com": 8, "Schedule-X": 4, OpenProperty: 8, "MapLibre GL": 6, Meilisearch: 5 };
for (const [s, n] of Object.entries(MIN)) if ((por[s]?.length ?? 0) < n) e.push(`${s}: ${por[s]?.length ?? 0} capacidades (mínimo ${n})`);
if (filas.length < 70) e.push(`solo ${filas.length} filas en total (mínimo 70)`);
filas.forEach((f, i) => {
  const url = String(f.fuente_url ?? "");
  for (const c of ["sistema", "capacidad", "puerto_metodo", "pantalla", "prioridad", "degradado"]) if (!f[c]) e.push(`fila ${i + 1} (${f.sistema}): falta ${c}`);
  if (f.verificado === true && !/^https?:\/\//.test(url)) e.push(`fila ${i + 1} (${f.sistema}/${f.capacidad}): verificado=true sin URL`);
  if (/pipeline/i.test(JSON.stringify(f))) e.push(`fila ${i + 1}: usa «pipeline» (vocabulario: «Negocios»)`);
});
const urls = new Set(filas.map((f) => f.fuente_url).filter(Boolean));
if (urls.size < 30) e.push(`solo ${urls.size} URLs distintas (mínimo 30: una por capacidad, no una por sistema)`);
console.log(`${filas.length} filas, ${Object.keys(por).length} sistemas, ${urls.size} URLs distintas`);
if (e.length) { console.log("FALLA:\n- " + e.join("\n- ")); process.exit(1); }
console.log("OK");
