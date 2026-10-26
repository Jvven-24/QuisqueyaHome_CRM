import { createRequire } from "node:module";
import path from "node:path";
import { pathToFileURL } from "node:url";

const require = createRequire(import.meta.url);
const { chromium } = require("C:/Users/wilbe/node_modules/playwright");

const ARTIFACT_DIR = "C:/Users/wilbe/.gemini/antigravity/brain/c0aae594-a195-4732-b956-8918e30694b4";
const HTML_FILE = path.join(ARTIFACT_DIR, "crm-redesign-showcase.html");
const FILE_URL = pathToFileURL(HTML_FILE).href;

async function run() {
  console.log("Iniciando captura de vistas del rediseño maestro...");
  const browser = await chromium.launch({ headless: true });

  // 1. Captura Escritorio (1440x950)
  const desktopContext = await browser.newContext({
    viewport: { width: 1440, height: 950 },
    deviceScaleFactor: 2,
  });
  const page = await desktopContext.newPage();
  await page.goto(FILE_URL, { waitUntil: "networkidle" });
  await page.waitForTimeout(600);

  // Captura 1: Escritorio CRM Completo
  await page.screenshot({ path: path.join(ARTIFACT_DIR, "crm-preview-desktop.png") });
  console.log("✓ crm-preview-desktop.png capturado.");

  // Captura 2: Command Palette Modal
  await page.click('#btn-command-palette');
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, "crm-preview-command-palette.png") });
  console.log("✓ crm-preview-command-palette.png capturado.");

  // Captura 3: Móvil PWA
  await page.click('#btn-mobile-pwa');
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, "crm-preview-mobile-pwa.png") });
  console.log("✓ crm-preview-mobile-pwa.png capturado.");

  // Captura 4: Móvil Drawer Abierto
  const masBtn = page.locator('button:has-text("Más")');
  if (await masBtn.count() > 0) {
    await masBtn.click();
    await page.waitForTimeout(400);
    await page.screenshot({ path: path.join(ARTIFACT_DIR, "crm-preview-mobile-drawer.png") });
    console.log("✓ crm-preview-mobile-drawer.png capturado.");
  }

  await desktopContext.close();
  await browser.close();
  console.log("=== TODAS LAS CAPTURAS COMPLETADAS EXITOSAMENTE ===");
}

run().catch((err) => {
  console.error("Error capturando:", err);
  process.exit(1);
});
