// Tablero de avance VRE-OS: porcentaje por fase y global, siguiente paso, bloqueos y validación de evidencia.
// Uso: npm run avance [-- --md] [-- --set F2.4=DONE --commit <sha> | --archivo <ruta>] [-- --strict]
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
const RUTA = resolve(RAIZ, ".viltrum/vre-os/roadmap.json");
const SALIDA = resolve(RAIZ, ".viltrum/vre-os/AVANCE.md");
const ESTADOS = { DONE: 1, IN_PROGRESS: 0.5, TODO: 0, BLOCKED: 0 };
const args = process.argv.slice(2);
const valor = (n) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : undefined; };

export function evaluar(mapa, { existeCommit = () => true, existeArchivo = () => true } = {}) {
  const errores = [];
  const items = new Map();
  for (const fase of mapa.fases) for (const it of fase.items) {
    if (items.has(it.id)) errores.push(`id repetido: ${it.id}`);
    if (!(it.estado in ESTADOS)) errores.push(`${it.id}: estado inválido «${it.estado}»`);
    items.set(it.id, { ...it, fase: fase.id });
  }
  for (const it of items.values()) {
    for (const d of it.depende ?? []) if (!items.has(d)) errores.push(`${it.id}: depende de ${d}, que no existe`);
    if (it.estado === "DONE") {
      const ev = it.evidencia;
      if (!ev) errores.push(`${it.id}: DONE sin evidencia`);
      else if (ev.commit && !existeCommit(ev.commit, ev.repo)) errores.push(`${it.id}: el commit ${ev.commit} no existe`);
      else if (ev.archivo && !existeArchivo(ev.archivo)) errores.push(`${it.id}: el archivo ${ev.archivo} no existe`);
      else if (!ev.commit && !ev.archivo) errores.push(`${it.id}: evidencia sin commit ni archivo`);
      for (const d of it.depende ?? []) if (items.get(d) && items.get(d).estado !== "DONE")
        errores.push(`${it.id}: está DONE pero su dependencia ${d} no lo está`);
    }
  }
  // ciclos
  const visitando = new Set(), listo = new Set();
  const visita = (id, ruta) => {
    if (listo.has(id)) return; if (visitando.has(id)) { errores.push(`ciclo: ${[...ruta, id].join(" → ")}`); return; }
    visitando.add(id); for (const d of items.get(id)?.depende ?? []) if (items.has(d)) visita(d, [...ruta, id]);
    visitando.delete(id); listo.add(id);
  };
  for (const id of items.keys()) visita(id, []);

  const fases = mapa.fases.map((fase) => {
    const total = fase.items.reduce((s, i) => s + (i.peso ?? 1), 0);
    const hecho = fase.items.reduce((s, i) => s + (i.peso ?? 1) * ESTADOS[i.estado], 0);
    const cuenta = Object.fromEntries(Object.keys(ESTADOS).map((e) => [e, fase.items.filter((i) => i.estado === e).length]));
    return { id: fase.id, nombre: fase.nombre, peso: fase.peso ?? 1, porcentaje: total ? (100 * hecho) / total : 0, cuenta, n: fase.items.length };
  });
  const pesoTotal = fases.reduce((s, f) => s + f.peso, 0);
  const global = fases.reduce((s, f) => s + f.porcentaje * f.peso, 0) / pesoTotal;
  const listos = [...items.values()].filter((i) => i.estado !== "DONE" && (i.depende ?? []).every((d) => items.get(d)?.estado === "DONE"));
  const siguientes = listos.filter((i) => i.estado !== "BLOCKED");
  const bloqueados = [...items.values()].filter((i) => i.estado === "BLOCKED");
  const esperando = [...items.values()].filter((i) => i.estado === "TODO" && !(i.depende ?? []).every((d) => items.get(d)?.estado === "DONE"));
  return { errores, fases, global, siguientes, bloqueados, esperando, items };
}

const barra = (p, n = 20) => "█".repeat(Math.round((p / 100) * n)).padEnd(n, "░");
export function texto(r, mapa) {
  const L = [`# Avance · ${mapa.programa}`, "", `Actualizado: ${mapa.actualizado} · **Global: ${r.global.toFixed(1)} %** ${barra(r.global)}`, "",
    "| Fase | Avance | Hechas | En curso | Pendientes | Bloqueadas |", "|---|---|---|---|---|---|"];
  for (const f of r.fases) L.push(`| ${f.id} ${f.nombre} | ${barra(f.porcentaje, 12)} ${f.porcentaje.toFixed(0)} % | ${f.cuenta.DONE} | ${f.cuenta.IN_PROGRESS} | ${f.cuenta.TODO} | ${f.cuenta.BLOCKED} |`);
  L.push("", "## Siguiente (dependencias cumplidas, se puede empezar ya)");
  L.push(...(r.siguientes.length ? r.siguientes.map((i) => `- **${i.id}** ${i.titulo}${i.estado === "IN_PROGRESS" ? " _(en curso)_" : ""} — ${i.responsable ?? "sin responsable"}`) : ["- (nada accionable)"]));
  L.push("", "## Bloqueado (necesita una decisión o acceso)");
  L.push(...(r.bloqueados.length ? r.bloqueados.map((i) => `- **${i.id}** ${i.titulo} — ${i.responsable ?? ""}`) : ["- (nada)"]));
  L.push("", `## Esperando dependencias (${r.esperando.length})`, ...r.esperando.slice(0, 12).map((i) => `- ${i.id} ${i.titulo} ← ${(i.depende ?? []).filter((d) => r.items.get(d)?.estado !== "DONE").join(", ")}`));
  if (r.esperando.length > 12) L.push(`- … y ${r.esperando.length - 12} más`);
  L.push("", `## Validación: ${r.errores.length ? `${r.errores.length} error(es)` : "sin errores"}`, ...r.errores.map((e) => `- ${e}`));
  return L.join("\n") + "\n";
}

function git(sha, repo) {
  try { execFileSync("git", ["-C", repo ?? RAIZ, "cat-file", "-e", `${sha}^{commit}`], { stdio: "ignore" }); return true; } catch { return false; }
}
if (process.argv[1]?.endsWith("avance.mjs")) {
  const mapa = JSON.parse(readFileSync(RUTA, "utf8"));
  const set = valor("--set");
  if (set) {
    const [id, estado] = set.split("=");
    const it = mapa.fases.flatMap((f) => f.items).find((i) => i.id === id);
    if (!it) { console.error(`No existe ${id}`); process.exit(2); }
    it.estado = estado; if (valor("--commit")) it.evidencia = { commit: valor("--commit"), ...(valor("--repo") ? { repo: valor("--repo") } : {}) };
    if (valor("--archivo")) it.evidencia = { archivo: valor("--archivo") };
    mapa.actualizado = new Date().toISOString().slice(0, 10);
    writeFileSync(RUTA, JSON.stringify(mapa, null, 1) + "\n");
  }
  const r = evaluar(mapa, { existeCommit: git, existeArchivo: (a) => existsSync(/^[A-Za-z]:|^\//.test(a) ? a : resolve(RAIZ, a)) });
  const t = texto(r, mapa);
  console.log(t);
  if (args.includes("--md") || set) writeFileSync(SALIDA, t);
  if (r.errores.length && (args.includes("--strict") || set)) process.exit(1);
}
