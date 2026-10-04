import { createRequire } from "node:module";
import path from "node:path";

const require = createRequire(import.meta.url);
const { chromium } = require("C:/Users/wilbe/node_modules/playwright");

const ARTIFACT_DIR = "C:/Users/wilbe/.gemini/antigravity/brain/b9e5e33d-6c70-4576-8822-29b1fc4557df";

async function run() {
  console.log("Iniciando captura de vistas en vivo desde http://localhost:9301...");
  const browser = await chromium.launch({ headless: true });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 950 },
    deviceScaleFactor: 2,
  });

  // Agregar cookie de evaluación para ingresar autenticado como Administrador
  await context.addCookies([
    {
      name: "qh_dev_role",
      value: "admin",
      domain: "localhost",
      path: "/",
    },
  ]);

  const page = await context.newPage();

  // 1. Captura de Pipeline con el nuevo menú y esquema 10/40/50
  console.log("Navegando a /pipeline...");
  await page.goto("http://localhost:9301/pipeline", { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, "live-crm-pipeline-pro.png") });
  console.log("✓ live-crm-pipeline-pro.png capturado.");

  // 2. Captura de Leads con DataTable y badges
  console.log("Navegando a /leads...");
  await page.goto("http://localhost:9301/leads", { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, "live-crm-leads-pro.png") });
  console.log("✓ live-crm-leads-pro.png capturado.");

  // 3. Captura de Inicio / Dashboard
  console.log("Navegando a /inicio...");
  await page.goto("http://localhost:9301/inicio", { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, "live-crm-inicio-pro.png") });
  console.log("✓ live-crm-inicio-pro.png capturado.");

  await context.close();
  await browser.close();
  console.log("=== CAPTURAS DE VERIFICACIÓN COMPLETADAS ===");
}

run().catch((err) => {
  console.error("Error en capturas:", err);
  process.exit(1);
});
