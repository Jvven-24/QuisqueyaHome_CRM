// D05 auditoria visual. Uso: node capturar.mjs  (servidor de revision en :9301)
import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const require = createRequire(import.meta.url);
const { chromium } = require("C:/Users/wilbe/node_modules/playwright");
const dir = path.dirname(fileURLToPath(import.meta.url));
const BASE = "http://localhost:9301";
const VIEWS = { d: { width: 1440, height: 900 }, m: { width: 390, height: 844 } };

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: VIEWS.d });
const page = await ctx.newPage();
await page.goto(BASE + "/login", { waitUntil: "domcontentloaded" }).catch(() => {});
const r = await page.evaluate(async () => {
  const x = await fetch("/api/auth/demo", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ role: "admin" }) });
  return x.status;
});
console.log("demo login", r);

async function descubrir(href, re) {
  await page.goto(BASE + href, { waitUntil: "networkidle" }).catch(() => {});
  const hs = await page.$$eval("a[href]", (as) => as.map((a) => a.getAttribute("href")));
  return hs.find((h) => re.test(h || ""));
}
const slugHref = (await descubrir("/propiedades", /^\/propiedades\/[^/?#]+$/)) || null;
const brokerHref = (await descubrir("/brokers", /^\/brokers\/[^/?#]+$/)) || null;
console.log({ slugHref, brokerHref });

const rutas = [
  ["inicio", "/inicio"], ["leads", "/leads"], ["contactos", "/contactos"],
  ["negocios", "/negocios"], ["negocios-lista", "/negocios?vista=lista"], ["negocios-analisis", "/negocios?vista=analisis"],
  ["propiedades", "/propiedades"], ["proyecto", slugHref], ["avances", "/avances"], ["agenda", "/agenda"],
  ["tareas", "/tareas"], ["brokers", "/brokers"], ["broker-ficha", brokerHref], ["comisiones", "/comisiones"],
  ["metas", "/metas"], ["comunicaciones", "/comunicaciones"], ["reportes", "/reportes"], ["academy", "/academy"],
  ["configuracion", "/configuracion"],
].filter((x) => x[1]);

const medir = () => {
  const vw = document.documentElement.clientWidth;
  const scrollX = document.documentElement.scrollWidth > vw + 1;
  const vis = (e) => { const r = e.getBoundingClientRect(); const s = getComputedStyle(e); return r.width > 0 && r.height > 0 && s.visibility !== "hidden" && s.display !== "none"; };
  const small = [];
  document.querySelectorAll("a[href],button,input:not([type=hidden]),select,textarea,[role=button],[role=tab],[role=checkbox]").forEach((e) => {
    if (!vis(e)) return; const r = e.getBoundingClientRect();
    if (r.height < 44 || r.width < 44) small.push((e.tagName + ":" + (e.getAttribute("aria-label") || e.textContent || "").trim().slice(0, 20)) + " " + Math.round(r.width) + "x" + Math.round(r.height));
  });
  const parse = (c) => { const m = c.match(/rgba?\(([^)]+)\)/); if (!m) return null; const p = m[1].split(/[, /]+/).map(Number); return { r: p[0], g: p[1], b: p[2], a: p[3] ?? 1 }; };
  const lum = ({ r, g, b }) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
  const bgOf = (e) => { while (e) { const c = parse(getComputedStyle(e).backgroundColor); if (c && c.a > 0.9) return c; e = e.parentElement; } return { r: 255, g: 255, b: 255, a: 1 }; };
  const bad = []; let n = 0;
  const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const seen = new Set();
  while (w.nextNode()) {
    const t = w.currentNode; if (!t.textContent.trim()) continue; const e = t.parentElement; if (!e || seen.has(e) || !vis(e)) continue; seen.add(e);
    const s = getComputedStyle(e); const fg = parse(s.color); if (!fg) continue; const bg = bgOf(e);
    const L1 = lum(fg), L2 = lum(bg); const cr = (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05);
    const size = parseFloat(s.fontSize); const bold = parseInt(s.fontWeight) >= 700; const need = size >= 24 || (size >= 18.66 && bold) ? 3 : 4.5;
    n++; if (cr < need) bad.push(cr.toFixed(2) + " " + t.textContent.trim().slice(0, 25));
  }
  const tiny = [...seen].filter((e) => parseFloat(getComputedStyle(e).fontSize) < 12).length;
  return { scrollX, smallCount: small.length, smallSample: small.slice(0, 5), textNodes: n, lowContrast: bad.length, contrastSample: bad.slice(0, 5), tiny12: tiny, h1: document.querySelectorAll("h1").length, bodyH: document.documentElement.scrollHeight };
};

const informe = {};
for (const [vk, vp] of Object.entries(VIEWS)) {
  await page.setViewportSize(vp);
  for (const [nombre, ruta] of rutas) {
    const errs = [];
    const onC = (m) => { if (m.type() === "error") errs.push(m.text().slice(0, 140)); };
    const onP = (e) => errs.push("pageerror: " + String(e).slice(0, 140));
    page.on("console", onC); page.on("pageerror", onP);
    let status = null;
    try { const resp = await page.goto(BASE + ruta, { waitUntil: "networkidle", timeout: 45000 }); status = resp?.status(); } catch (e) { errs.push("goto: " + e.message.slice(0, 80)); }
    await page.waitForTimeout(700);
    await page.screenshot({ path: path.join(dir, `${nombre}-${vk === "d" ? "1440" : "390"}.png`), fullPage: false });
    await page.screenshot({ path: path.join(dir, `${nombre}-${vk === "d" ? "1440" : "390"}-full.png`), fullPage: true }).catch(() => {});
    const m = await page.evaluate(medir).catch((e) => ({ error: String(e) }));
    page.off("console", onC); page.off("pageerror", onP);
    informe[`${nombre}@${vk}`] = { ruta, status, url: page.url().replace(BASE, ""), ...m, consoleErrors: errs.length, consoleSample: errs.slice(0, 2) };
    console.log(nombre, vk, status, JSON.stringify({ sx: m.scrollX, small: m.smallCount, lc: m.lowContrast, ce: errs.length }));
  }
}
fs.writeFileSync(path.join(dir, "medidas.json"), JSON.stringify(informe, null, 1));
await browser.close();
