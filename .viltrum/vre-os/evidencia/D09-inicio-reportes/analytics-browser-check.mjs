/** Verificación aislada con fixtures sintéticas, NO E2E de Next/DB.
 * No usa .env, .next ni un servidor CRM. Bundles y HTTP solo en memoria.
 */
import assert from "node:assert/strict";
import { readFileSync, mkdirSync, existsSync } from "node:fs";
import { resolve, dirname, extname } from "node:path";
import { createRequire } from "node:module";
import { createServer } from "node:http";
import { once } from "node:events";
import { build } from "esbuild";
import postcss from "postcss";
import tailwind from "@tailwindcss/postcss";
import { chromium } from "playwright";

const root = process.cwd();
const css = (await postcss([tailwind()]).process(readFileSync("src/app/tokens.css", "utf8"), { from: resolve("src/app/tokens.css") })).css;
const entry = `
import React from 'react'; import {createRoot} from 'react-dom/client';
import {InicioVista} from './src/app/(crm)/inicio/vista';
import {ReportesVista} from './src/app/(crm)/reportes/vista';
import {MobileDock} from './src/app/(crm)/_ui/mobile-dock'; import {MODULOS} from './src/app/(crm)/modulos';
const funnel=[{stageId:101,label:'Nuevo',kind:'open',position:1,count:12,reachedCount:24,previousReachedCount:null,passedFromPreviousCount:null,widthPercent:100,passRatePercent:null},{stageId:102,label:'Nuevo',kind:'open',position:2,count:6,reachedCount:12,previousReachedCount:24,passedFromPreviousCount:12,widthPercent:50,passRatePercent:50}];
const sources=[{sourceId:201,source:'Canal sintético con nombre largo',count:18,deals:8,won:2,revenueCents:145500000,spendCents:120000,percentage:75,roiPercent:120,colorClass:'navy'},{sourceId:202,source:'Canal sintético con nombre largo',count:6,deals:2,won:1,revenueCents:60000000,spendCents:null,percentage:25,roiPercent:null,colorClass:'blue'}];
const trend=Array.from({length:18},(_,i)=>({month:new Date(Date.UTC(2025,i,1)).toISOString().slice(0,7),leads:i+10,deals:i+3,won:i,revenueCents:(i+1)*100000}));
const metricas={totalLeads:24,totalDeals:10,filters:{},asOf:'2026-10-04T20:50:03Z',funnel,sources,zones:[{zoneId:301,label:'Cap Cana',count:18,percentage:75},{zoneId:302,label:'Cap Cana',count:6,percentage:25}],lossReasons:[],trend,brokers:[{brokerId:401,name:'Broker sintético',leads:24,deals:10,won:3,volumeCents:205500000,conversionPercent:12.5}],velocity:{sampleSize:3,medianDays:24,p75Days:45},inventory:[{state:'available',count:12,medianAgeDays:20,p75AgeDays:35},{state:'reserved',count:6,medianAgeDays:26,p75AgeDays:40},{state:'sold',count:3,medianAgeDays:45,p75AgeDays:50}],commissions:[{month:'2026-08',count:3,totalCents:900000,brokerCents:600000,agencyCents:300000,paidCents:450000},{month:'2026-09',count:2,totalCents:800000,brokerCents:500000,agencyCents:300000,paidCents:400000}],projection:{totalWeightedCents:42500000,totalDisplayUsd:'US$425,000.00',confidenceEstimated:45,missingProbabilityCount:1,missingAmountCount:1,points:[{month:'2026-10',amountCents:12500000,heightPercent:50},{month:'2026-11',amountCents:30000000,heightPercent:100}]}};
const dashboard={misLeadsCount:24,citasSemanaCount:3,metaMesLabel:'3 / 5',miNivel:'Broker',metaPorcentaje:60,leadsMesCount:24,negociosActivosCount:10,volumenPipelineDisplay:'US$1,234,567.89',cierresMesCount:3,conversionPorcentaje:'12.5%',leadsSinAsignarCount:4,citasHoyCount:1,tareasPendientesCount:3,avancesPorRevisarCount:null,leadsRecientes:Array.from({length:6},(_,i)=>({id:i+1,name:'Persona sintética con nombre muy largo '+i,project:'Proyecto sintético',source:'Canal de prueba',stage:'Nuevo',next:'Revisar la próxima acción del registro'})),saludoNombre:'Prueba',nombre:'Usuario sintético',fechaTexto:'4 de octubre de 2026',funnel,activities:Array.from({length:6},(_,i)=>({id:i+1,title:'Actividad sintética de verificación '+i,startsAt:'2026-10-05T16:00:00Z',location:'Ubicación de prueba'})),projects:[{id:501,name:'Proyecto sintético',leads:24}],academy:null};
const perms={leads:true,deals:true,activities:true,projects:true,goals:true,academy:true,createLead:true};
function App(){return <>{location.pathname==='/inicio'?<InicioVista roleSlug='admin' nombre={dashboard.nombre} metricas={dashboard} permissions={perms}/>:<ReportesVista metricas={metricas} canExport={true} periodo='todo' projects={[{id:501,label:'Proyecto sintético'}]}/>}<MobileDock modulosVisibles={MODULOS} etiquetaRol='Rol sintético'/></>}
createRoot(document.getElementById('root')).render(<App/>);`;

const bundled = await build({ stdin: { contents: entry, loader: "jsx", resolveDir: root }, absWorkingDir: root, tsconfigRaw: { compilerOptions: { jsx: "react-jsx" } }, bundle: true, write: false, format: "iife", platform: "browser", jsx: "automatic", define: { "process.env.NODE_ENV": '"development"' }, plugins: [{ name: "isolated-next-adapters", setup(b) {
  b.onResolve({ filter: /^next\/(link|dynamic|navigation)$/ }, a => ({ path: a.path, namespace: "isolated" }));
  b.onLoad({ filter: /.*/, namespace: "isolated" }, a => ({ loader: "jsx", resolveDir: root, contents: a.path === "next/navigation" ? "export function usePathname(){return location.pathname} export function useRouter(){return {push:path=>location.assign(path)}}" : a.path === "next/link" ? "import React from 'react'; export default function Link(p){return <a {...p}/>;}" : "import React from 'react'; export default function dynamic(load,opts){const C=React.lazy(()=>load().then(m=>({default:m.default??m})));return p=><React.Suspense fallback={opts?.loading?.()}><C {...p}/></React.Suspense>;}" }));
} }, { name: "sandbox-source-loader", setup(b) {
  // El binario Go no puede atravesar la junction node_modules en este sandbox.
  // Node resuelve y lee únicamente los módulos requeridos, en memoria.
  b.onResolve({ filter: /.*/ }, a => {
    let path;
    if (a.path.startsWith("@/")) path = resolve(root, "src", a.path.slice(2));
    else if (a.path.startsWith(".")) path = resolve(a.importer && a.namespace !== "isolated" ? dirname(a.importer) : root, a.path);
    else path = createRequire(a.namespace === "source" ? a.importer : resolve(root, "package.json")).resolve(a.path);
    for (const suffix of ["", ".tsx", ".ts", ".js", ".mjs", "/index.js", "/index.ts"]) {
      if (existsSync(path + suffix) && extname(path + suffix)) return { path: path + suffix, namespace: "source" };
    }
    throw new Error(`Módulo no resuelto: ${a.path}`);
  });
  b.onLoad({ filter: /.*/, namespace: "source" }, a => ({ contents: readFileSync(a.path, "utf8"), loader: extname(a.path) === ".json" ? "json" : extname(a.path) === ".tsx" ? "tsx" : extname(a.path) === ".ts" ? "ts" : "jsx", resolveDir: dirname(a.path) }));
} }] });
const js = bundled.outputFiles[0].text;
const server = createServer((req, res) => {
  if (req.url === "/app.js") { res.setHeader("Content-Type", "text/javascript"); res.end(js); }
  else { res.setHeader("Content-Type", "text/html"); res.end(`<!doctype html><html lang="es"><meta name="viewport" content="width=device-width,initial-scale=1"><style>${css}</style><style>:root{--font-atkinson:Arial;--font-hanken:Arial}#root{max-width:1180px;margin:auto;padding:16px}html,body{overflow-x:visible!important}</style><body><div id="root"></div><script src="/app.js"></script></body></html>`); }
});
server.listen(0, "127.0.0.1");
await once(server, "listening");
let browser;
const output = resolve("src/app/(crm)/_ui/evidencia-d09");
mkdirSync(output, { recursive: true });
try {
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const errors = [];
  page.on("pageerror", e => errors.push(e.message));
  page.on("console", msg => { if (msg.type() === "error") errors.push(msg.text()); });
  const base = `http://127.0.0.1:${server.address().port}`;
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    for (const route of ["inicio", "reportes"]) {
      await page.goto(`${base}/${route}`);
      await page.getByRole("tablist").waitFor();
      const tabs = page.getByRole("tab");
      const count = await tabs.count();
      for (let i = 0; i < count; i++) {
        await tabs.nth(i).click();
        await page.waitForTimeout(100);
        const bounds = await page.evaluate(() => ({ width: innerWidth, document: document.documentElement.scrollWidth }));
        assert.ok(bounds.document <= bounds.width, `${route}/${width}/tab ${i}: overflow ${JSON.stringify(bounds)}`);
      }
      await tabs.first().click();
      await tabs.first().focus();
      await page.keyboard.press("ArrowRight");
      await page.waitForFunction(() => document.querySelectorAll('[role="tab"]')[1]?.getAttribute("aria-selected") === "true");
      assert.equal(await tabs.nth(1).getAttribute("aria-selected"), "true", "tabs con flechas de teclado");
      await page.waitForTimeout(150);
      const legend = page.locator(".analytics-legend-button").first();
      if (await legend.count()) {
        await legend.click();
        assert.equal(await legend.getAttribute("aria-pressed"), "true", "leyenda aísla la serie");
        await legend.click();
        assert.equal(await legend.getAttribute("aria-pressed"), "false", "leyenda restaura las series");
      }
      if (width < 768 && route === "reportes") {
        await page.getByRole("button", { name: "Filtros", exact: true }).click();
        const dialog = page.getByRole("dialog");
        await dialog.getByLabel("Desde", { exact: true }).fill("2026-09-01");
        await dialog.getByRole("button", { name: "Cerrar", exact: true }).click();
        await page.waitForFunction(() => document.activeElement?.textContent === "Filtros");
      }
      if (width < 768) {
        const dock = page.getByRole("navigation", { name: "Navegación móvil rápida" });
        const targets = dock.locator("a,button");
        assert.equal(await targets.count(), 5, "dock conserva cinco accesos");
        for (const target of await targets.all()) {
          const box = await target.boundingBox();
          assert.ok(box.width >= 48 && box.height >= 48, "target del dock mínimo 48px");
        }
      }
      await page.screenshot({ path: resolve(output, `${route}-${width}.png`), fullPage: true });
      console.log(`${route} ${width}px: ${count} tabs, sin overflow global, teclado OK`);
    }
  }
  await page.context().setOffline(true);
  await page.getByRole("status").filter({ hasText: "Sin conexión" }).first().waitFor();
  assert.ok(await page.getByRole("tablist").isVisible());
  console.log("Offline: aviso visible y datos recibidos conservados");
  assert.deepEqual(errors, [], "errores de consola (incluye claves duplicadas)");
  console.log("Consola: 0 errores con nombres de etapas, zonas y canales duplicados");
} finally {
  await browser?.close();
  server.close();
}
