import { createRequire } from "node:module";
import path from "node:path";
import { pathToFileURL } from "node:url";

const require = createRequire(import.meta.url);
const { chromium } = require("C:/Users/wilbe/node_modules/playwright");

const ARTIFACT_DIR = "C:/Users/wilbe/.gemini/antigravity/brain/c0aae594-a195-4732-b956-8918e30694b4";
const HTML_FILE = path.join(ARTIFACT_DIR, "crm-redesign-showcase.html");
const FILE_URL = pathToFileURL(HTML_FILE).href;

async function run() {
  console.log("Iniciando captura de vistas móviles del rediseño maestro...");
  const browser = await chromium.launch({ headless: true });

  const desktopContext = await browser.newContext({
    viewport: { width: 1440, height: 950 },
    deviceScaleFactor: 2,
  });
  const page = await desktopContext.newPage();
  await page.goto(FILE_URL, { waitUntil: "networkidle" });
  await page.waitForTimeout(500);

  // 1. Cambiar a Móvil PWA
  await page.evaluate(() => switchView('mobile-pwa'));
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, "crm-preview-mobile-pwa.png") });
  console.log("✓ crm-preview-mobile-pwa.png capturado.");

  // 2. Abrir Drawer "Más"
  await page.evaluate(() => toggleMobileDrawer());
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, "crm-preview-mobile-drawer.png") });
  console.log("✓ crm-preview-mobile-drawer.png capturado.");

  await desktopContext.close();
  await browser.close();
  console.log("=== CAPTURAS MÓVILES COMPLETADAS ===");
}

run().catch((err) => {
  console.error("Error capturando móviles:", err);
  process.exit(1);
});
