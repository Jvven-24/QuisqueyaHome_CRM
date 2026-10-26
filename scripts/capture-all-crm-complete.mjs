import { createRequire } from "node:module";
import path from "node:path";
import fs from "node:fs";

const require = createRequire(import.meta.url);
const { chromium } = require("C:/Users/wilbe/node_modules/playwright");

const OUTPUT_DIR = "C:/Users/wilbe/.gemini/antigravity/brain/0f56f647-6e28-42d4-b622-302a690c8736/screenshots";
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

const BASE_URL = "http://localhost:3000";

async function run() {
  console.log("Iniciando sesión en Chromium...");
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 960 },
    deviceScaleFactor: 2,
  });

  await context.addCookies([
    {
      name: "qh_dev_role",
      value: "admin",
      domain: "localhost",
      path: "/",
    },
  ]);

  const page = await context.newPage();

  async function capturar(nombre, url, opciones = {}) {
    console.log(`Capturando: ${nombre} (${url})...`);
    try {
      await page.goto(`${BASE_URL}${url}`, { waitUntil: "networkidle", timeout: 15000 });
    } catch {
      // Si timeout de networkidle, esperar solo carga básica
      await page.goto(`${BASE_URL}${url}`, { waitUntil: "load", timeout: 15000 });
    }

    if (opciones.antesDeCaptura) {
      await opciones.antesDeCaptura(page);
    }

    await page.waitForTimeout(opciones.espera ?? 1000);
    const destino = path.join(OUTPUT_DIR, `${nombre}.png`);
    await page.screenshot({ path: destino, fullPage: opciones.fullPage ?? false });
    console.log(`✓ Guardado: ${nombre}.png`);
  }

  // 1. INICIO
  await capturar("01-inicio-dashboard", "/inicio");

  // 2. LEADS
  await capturar("02-leads-lista", "/leads");
  
  // 2b. LEADS - INSPECTOR LATERAL
  await capturar("02b-leads-inspector", "/leads", {
    antesDeCaptura: async (p) => {
      const fila = await p.$("table tbody tr");
      if (fila) await fila.click();
    },
    espera: 800,
  });

  // 2c. LEADS - MODAL DE NOTA DE VOZ AI
  await capturar("02c-leads-audio-transcribe-modal", "/leads", {
    antesDeCaptura: async (p) => {
      const botonVoz = await p.$('button:has-text("Nota de Voz"), button:has-text("Voz")');
      if (botonVoz) await botonVoz.click();
    },
    espera: 800,
  });

  // 3. NEGOCIOS
  await capturar("03-negocios-kanban", "/negocios");
  await capturar("03b-negocios-analisis", "/negocios?vista=analisis");

  // 3c. NEGOCIOS - INSPECTOR Y COTIZADOR CONFOTUR
  await capturar("03c-negocios-inspector-confotur", "/negocios", {
    antesDeCaptura: async (p) => {
      const tarjeta = await p.$('[data-rbd-draggable-id], .kanban-card, [role="button"]');
      if (tarjeta) await tarjeta.click();
    },
    espera: 800,
  });

  // 4. CONTACTOS
  await capturar("04-contactos-directorio", "/contactos");

  // 5. PROPIEDADES
  await capturar("05-propiedades-catalogo", "/propiedades");
  await capturar("05b-propiedades-stacking-plan", "/propiedades/vre-araya-punta-cana", { fullPage: true });

  // 6. AVANCES DE OBRA
  await capturar("06-avances-inspeccion-360-gantt", "/avances", { fullPage: true });

  // 7. AGENDA
  await capturar("07-agenda-7dias-diaspora", "/agenda");

  // 8. TAREAS
  await capturar("08-tareas-playbooks-paginacion", "/tareas");

  // 9. BROKERS
  await capturar("09-brokers-leaderboard-podio", "/brokers");

  // 10. METAS
  await capturar("10-metas-ritmo-run-rate", "/metas");

  // 11. COMISIONES
  await capturar("11-comisiones-liquidacion-tabla", "/comisiones");
  await capturar("11b-comisiones-inspector-dgii", "/comisiones", {
    antesDeCaptura: async (p) => {
      const fila = await p.$("table tbody tr");
      if (fila) await fila.click();
    },
    espera: 800,
  });

  // 12. COMUNICACIONES
  await capturar("12-comunicaciones-meta-whatsapp", "/comunicaciones");

  // 13. ACADEMY LMS
  await capturar("13-academy-moodle-campus", "/academy");
  await capturar("13b-academy-induccion-checklists", "/academy", {
    antesDeCaptura: async (p) => {
      const tab = await p.$('button:has-text("Inducción")');
      if (tab) await tab.click();
    },
    espera: 800,
  });
  await capturar("13c-academy-simulador-examen-rd", "/academy", {
    antesDeCaptura: async (p) => {
      const tab = await p.$('button:has-text("Simulador")');
      if (tab) await tab.click();
    },
    espera: 800,
  });
  await capturar("13d-academy-constancias-boveda", "/academy", {
    antesDeCaptura: async (p) => {
      const tab = await p.$('button:has-text("Constancias")');
      if (tab) await tab.click();
    },
    espera: 800,
  });

  // 14. REPORTES
  await capturar("14-reportes-analitica-funnel", "/reportes");

  // 15. CONFIGURACIÓN
  await capturar("15-configuracion-etapas", "/configuracion");
  await capturar("15b-configuracion-integraciones", "/configuracion?tab=integraciones");
  await capturar("15c-configuracion-catalogos", "/configuracion?tab=catalogos");

  // 16. PALETA DE COMANDOS (Ctrl+K)
  await capturar("16-command-palette-busqueda", "/inicio", {
    antesDeCaptura: async (p) => {
      await p.keyboard.press("Control+k");
    },
    espera: 800,
  });

  await context.close();
  await browser.close();
  console.log("=== TODAS LAS CAPTURAS FUERON GENERADAS CON ÉXITO ===");
}

run().catch((err) => {
  console.error("Error capturando pantallas:", err);
  process.exit(1);
});
