// Valida capacidades.json: profundidad (muchas capacidades por sistema), URL oficial por fila y coherencia de «verificado».
// Uso: node scripts/spec/capacidades-check.mjs [ruta]
import { readFileSync, existsSync } from "node:fs";
const ruta = process.argv.slice(2).find((a) => !a.startsWith("--")) ?? ".viltrum/vre-os/spec/integraciones/capacidades.json";
const filas = JSON.parse(readFileSync(ruta, "utf8").replace(/^﻿/, ""));
const e = [];
const por = {};
for (const f of filas) (por[f.sistema] ??= []).push(f);
const MIN = { Twenty: 12, Moodle: 10, Chatwoot: 8, "Evolution API": 8, "Cal.com": 8, "Schedule-X": 4, OpenProperty: 8, "MapLibre GL": 6, Meilisearch: 5 };
for (const [s, n] of Object.entries(MIN)) if ((por[s]?.length ?? 0) < n) e.push(`${s}: ${por[s]?.length ?? 0} capacidades (mínimo ${n})`);
if (filas.length < 60) e.push(`solo ${filas.length} filas en total (mínimo 60)`);
filas.forEach((f, i) => {
  const url = String(f.fuente_url ?? "");
  for (const c of ["sistema", "capacidad", "puerto_metodo", "pantalla", "prioridad", "degradado"]) if (!f[c]) e.push(`fila ${i + 1} (${f.sistema}): falta ${c}`);
  if (f.verificado === true && !/^https?:\/\//.test(url)) e.push(`fila ${i + 1} (${f.sistema}/${f.capacidad}): verificado=true sin URL`);
  if (/pipeline/i.test(JSON.stringify(f))) e.push(`fila ${i + 1}: usa «pipeline» (vocabulario: «Negocios»)`);
});
const urls = new Set(filas.map((f) => f.fuente_url).filter(Boolean));
if (urls.size < 30) e.push(`solo ${urls.size} URLs distintas (mínimo 30: una por capacidad, no una por sistema)`);
if (process.argv.includes("--vivas")) {
  const muertas = [];
  const cola = [...filas.entries()];
  const trabajador = async () => {
    for (let t = cola.shift(); t; t = cola.shift()) {
      const [i, f] = t; let estado;
      if (!/^https?:\/\//.test(String(f.fuente_url))) { if (!existsSync(String(f.fuente_url))) muertas.push({ fila: i + 1, sistema: f.sistema, capacidad: f.capacidad, url: f.fuente_url, estado: "archivo inexistente" }); continue; }
      try { const r = await fetch(f.fuente_url, { redirect: "follow", signal: AbortSignal.timeout(15000), headers: { "user-agent": "Mozilla/5.0 (verificador de enlaces VRE-OS)" } }); estado = r.status; }
      catch (x) { estado = "sin respuesta"; }
      if (!(typeof estado === "number" && (estado < 400 || estado === 403 || estado === 429))) muertas.push({ fila: i + 1, sistema: f.sistema, capacidad: f.capacidad, url: f.fuente_url, estado });
    }
  };
  await Promise.all(Array.from({ length: 8 }, trabajador));
  const vivas = filas.length - muertas.length;
  console.log(`URLs vivas: ${vivas}/${filas.length}`);
  if (muertas.length) { console.log("MUERTAS (404/sin respuesta; no inventes enlaces, abre la documentación y copia la URL real):"); for (const m of muertas.sort((a,b)=>a.fila-b.fila)) console.log(`  fila ${m.fila} [${m.sistema}] ${m.capacidad} -> ${m.estado} ${m.url}`); }
  if (vivas / filas.length < 0.95) e.push(`solo ${Math.round((100 * vivas) / filas.length)} % de las URLs existen (mínimo 95 %)`);
}

{
  const BRIEF = JSON.parse(readFileSync(".viltrum/vre-os/design/pantallas-e1.json", "utf8").replace(/^﻿/, "")).screens.map((x) => x.id);
  const pagina = (u) => String(u).split("#")[0];
  const porPagina = {};
  for (const f of filas) if (/^https?:/.test(String(f.fuente_url))) (porPagina[pagina(f.fuente_url)] ??= []).push(f);
  for (const [pg, fs] of Object.entries(porPagina)) if (fs.length > 2) e.push(`${fs.length} filas apuntan a la misma página ${pg} (fragmentos inventados no cuentan como URL propia): ${fs.map((x) => x.capacidad).slice(0, 4).join("; ")}…`);
  for (const [i, f] of filas.entries()) if (f.pantalla && !BRIEF.includes(f.pantalla) && f.pantalla !== "—") e.push(`fila ${i + 1} (${f.sistema}/${f.capacidad}): pantalla «${f.pantalla}» no existe en el brief (${BRIEF.length} ids SCR-…)`);
  const unicas = new Set(filas.map((f) => pagina(f.fuente_url)));
  if (unicas.size < 30) e.push(`solo ${unicas.size} páginas distintas sin contar fragmentos (mínimo 30)`);
}
console.log(`${filas.length} filas, ${Object.keys(por).length} sistemas, ${urls.size} URLs distintas`);
if (e.length) { console.log("FALLA:\n- " + e.join("\n- ")); process.exit(1); }
console.log("OK");
