import { chromium } from "playwright";
import fs from "fs";
import path from "path";

const BASE_URL = process.env.BASE_URL || "http://localhost:3100";
const SCREENSHOT_DIR = path.resolve(".viltrum/evidencia/e2e");

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function runRealBrowserTests() {
  console.log(`====================================================`);
  console.log(`[D14 QA + D15 Performance] INICIANDO PRUEBAS REALES E2E`);
  console.log(`Target: ${BASE_URL}`);
  console.log(`Browser: Chromium (Playwright Real Engine)`);
  console.log(`====================================================\n`);

  const browser = await chromium.launch({
    headless: true,
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) QuisqueyaE2E/1.0",
  });

  const page = await context.newPage();

  // Perform real evaluation login via API
  const loginRes = await page.request.post(`${BASE_URL}/api/auth/demo`, {
    data: { role: "admin" },
  });
  console.log(`Demo Auth Status: ${loginRes.status()} ${await loginRes.text()}\n`);

  const consoleErrors = [];
  const hydrationWarnings = [];
  const pageErrors = [];
  const requestErrors = [];

  page.on("console", (msg) => {
    if (msg.type() === "error") {
      const text = msg.text();
      if (text.includes("hydration") || text.includes("hydrated")) {
        hydrationWarnings.push({ url: page.url(), text });
      } else {
        consoleErrors.push({ url: page.url(), text });
      }
    }
  });

  page.on("pageerror", (err) => {
    pageErrors.push({ url: page.url(), message: err.message, stack: err.stack });
  });

  page.on("requestfailed", (req) => {
    // Ignore aborted requests during navigation
    if (req.failure()?.errorText !== "net::ERR_ABORTED") {
      requestErrors.push({ url: req.url(), error: req.failure()?.errorText });
    }
  });

  const results = [];

  async function testRoute(name, route, actions = null) {
    const fullUrl = `${BASE_URL}${route}`;
    process.stdout.write(`-> Probando [${name}] (${route})... `);
    const startNav = Date.now();
    let status = "PASS";
    let failureReason = null;
    let timing = {};

    try {
      const response = await page.goto(fullUrl, {
        waitUntil: "domcontentloaded",
        timeout: 30000,
      });

      const navTime = Date.now() - startNav;
      const httpStatus = response?.status() ?? 0;

      if (httpStatus >= 400) {
        throw new Error(`HTTP ${httpStatus} al cargar ${route}`);
      }

      // Wait a moment for client hydration
      await page.waitForTimeout(500);

      // Measure client metrics
      const clientMetrics = await page.evaluate(() => {
        const perf = window.performance.timing;
        const domCount = document.querySelectorAll("*").length;
        const hasMain = Boolean(document.querySelector("main") || document.querySelector("body"));
        return {
          domReady: perf.domContentLoadedEventEnd - perf.navigationStart,
          loadTime: perf.loadEventEnd - perf.navigationStart,
          domCount,
          hasMain,
        };
      });

      timing = {
        navTime,
        domReady: clientMetrics.domReady > 0 ? clientMetrics.domReady : navTime,
        domCount: clientMetrics.domCount,
      };

      // Perform user interactions if provided
      let actionsCount = 0;
      if (actions) {
        actionsCount = await actions(page);
      }

      // Capture screenshot
      const safeName = route.replace(/[^a-zA-Z0-9]/g, "_").replace(/^_+|_+$/g, "") || "root";
      const screenshotPath = path.join(SCREENSHOT_DIR, `${safeName}.png`);
      await page.screenshot({ path: screenshotPath, fullPage: false });

      console.log(`OK (${navTime}ms, ${clientMetrics.domCount} nodos, ${actionsCount} clics/acciones)`);

      results.push({
        name,
        route,
        status: "PASS",
        httpStatus,
        navTime,
        domCount: clientMetrics.domCount,
        actionsCount,
        screenshot: screenshotPath,
      });
    } catch (err) {
      status = "FAIL";
      failureReason = err.message;
      console.log(`FALLO: ${err.message}`);
      results.push({
        name,
        route,
        status: "FAIL",
        error: err.message,
        navTime: Date.now() - startNav,
      });
    }
  }

  // 1. Dashboard / Inicio
  await testRoute("Dashboard Inicio", "/inicio", async (p) => {
    let actions = 0;
    // Click on quick search trigger (Cmd+K)
    const searchBtn = await p.$('button[aria-label*="Buscar en el CRM"]');
    if (searchBtn) {
      await searchBtn.click();
      actions++;
      await p.waitForTimeout(200);
      // Close command palette with Escape
      await p.keyboard.press("Escape");
      actions++;
    }
    return actions;
  });

  // 2. Leads (M01)
  await testRoute("Leads (M01)", "/leads", async (p) => {
    let actions = 0;
    // Filter tabs
    const tabContactados = await p.$('button:has-text("Contactados")');
    if (tabContactados) {
      await tabContactados.click();
      actions++;
      await p.waitForTimeout(300);
    }
    const tabTodos = await p.$('button:has-text("Todos")');
    if (tabTodos) {
      await tabTodos.click();
      actions++;
      await p.waitForTimeout(300);
    }
    // Search input
    const searchInput = await p.$('input[placeholder*="Buscar"]');
    if (searchInput) {
      await searchInput.fill("Pérez");
      actions++;
      await p.waitForTimeout(200);
      await searchInput.fill("");
      actions++;
    }
    // Click first lead row to check drawer
    const firstRow = await p.$('table tbody tr, [data-lead-id]');
    if (firstRow) {
      await firstRow.click();
      actions++;
      await p.waitForTimeout(400);
      // Close drawer if opened
      const closeBtn = await p.$('button[aria-label*="Cerrar"], [data-state="open"] button');
      if (closeBtn) {
        await closeBtn.click();
        actions++;
      }
    }
    return actions;
  });

  // 3. Negocios / Pipeline (M03)
  await testRoute("Negocios (M03)", "/negocios", async (p) => {
    let actions = 0;
    // Switch between Kanban and List view
    const tabList = await p.$('button:has-text("Vista Lista")');
    if (tabList) {
      await tabList.click();
      actions++;
      await p.waitForTimeout(300);
    }
    const tabKanban = await p.$('button:has-text("Tablero Kanban")');
    if (tabKanban) {
      await tabKanban.click();
      actions++;
      await p.waitForTimeout(300);
    }
    // Inspect Kanban deal card
    const dealCard = await p.$('.deal-card');
    if (dealCard) {
      await dealCard.click();
      actions++;
      await p.waitForTimeout(600);
      // Close drawer if opened
      const closeBtn = await p.$('button:has-text("Cerrar"), button[aria-label*="Cerrar"]');
      if (closeBtn) {
        await closeBtn.click();
        actions++;
        await p.waitForTimeout(300);
      }
    }
    return actions;
  });

  // 4. Contactos
  await testRoute("Contactos", "/contactos", async (p) => {
    let actions = 0;
    const search = await p.$('input[placeholder*="Buscar"]');
    if (search) {
      await search.fill("Gómez");
      actions++;
      await p.waitForTimeout(200);
      await search.fill("");
      actions++;
    }
    return actions;
  });

  // 5. Propiedades / Proyectos
  await testRoute("Propiedades & Proyectos", "/propiedades", async (p) => {
    let actions = 0;
    const filterBtn = await p.$('button:has-text("Filtros"), select');
    if (filterBtn) {
      actions++;
    }
    return actions;
  });

  // 6. Agenda
  await testRoute("Agenda & Citas", "/agenda", async (p) => {
    let actions = 0;
    const todayBtn = await p.$('button:has-text("Hoy")');
    if (todayBtn) {
      await todayBtn.click();
      actions++;
    }
    return actions;
  });

  // 7. Tareas
  await testRoute("Tareas de Seguimiento", "/tareas", async (p) => {
    let actions = 0;
    const tabBtn = await p.$('button:has-text("Completadas"), button:has-text("Todas")');
    if (tabBtn) {
      await tabBtn.click();
      actions++;
      await p.waitForTimeout(200);
    }
    return actions;
  });

  // 8. Reportes
  await testRoute("Reportes & Métricas", "/reportes", async (p) => {
    let actions = 0;
    const periodSelect = await p.$('select, button:has-text("Mes")');
    if (periodSelect) {
      actions++;
    }
    return actions;
  });

  // 9. Comisiones
  await testRoute("Comisiones", "/comisiones", async (p) => {
    let actions = 0;
    const filterSelect = await p.$("select");
    if (filterSelect) {
      actions++;
    }
    return actions;
  });

  // 10. Configuración & Réplica Open Source
  await testRoute("Configuración & Integraciones", "/configuracion", async (p) => {
    let actions = 0;
    // Check if replica Open Source card is present
    const replicaCard = await p.$('text="Réplica CRM"');
    if (replicaCard) {
      actions++;
    }
    const outboxCard = await p.$('text="Outbox Engine"');
    if (outboxCard) {
      actions++;
    }
    return actions;
  });

  // 11. Metas
  await testRoute("Metas de Ventas", "/metas");

  // 12. Brokers
  await testRoute("Equipo de Brokers", "/brokers");

  // 13. Avances de Obra
  await testRoute("Avances de Obra", "/avances");

  // 14. Comunicaciones
  await testRoute("Comunicaciones & Plantillas", "/comunicaciones");

  // 15. Academy LMS
  await testRoute("Academy & Moodle LMS", "/academy");

  await browser.close();

  console.log(`\n====================================================`);
  console.log(`RESUMEN DE PRUEBAS REALES`);
  console.log(`====================================================`);
  const total = results.length;
  const passed = results.filter((r) => r.status === "PASS").length;
  const failed = results.filter((r) => r.status === "FAIL").length;

  console.log(`Total pantallas probadas: ${total}`);
  console.log(`Aprobadas: ${passed}`);
  console.log(`Fallidas: ${failed}`);
  console.log(`Errores no controlados de JavaScript: ${pageErrors.length}`);
  console.log(`Errores críticos en consola: ${consoleErrors.length}`);
  console.log(`Advertencias de hidratación detectadas: ${hydrationWarnings.length}`);
  console.log(`Solicitudes de red fallidas: ${requestErrors.length}`);

  if (consoleErrors.length > 0) {
    console.log(`\nDetalles de errores de consola:`);
    consoleErrors.forEach((e) => console.log(` - [${e.url}]: ${e.text}`));
  }
  if (pageErrors.length > 0) {
    console.log(`\nDetalles de errores JS:`);
    pageErrors.forEach((e) => console.log(` - [${e.url}]: ${e.message}`));
  }
  if (requestErrors.length > 0) {
    console.log(`\nDetalles de requests fallidos:`);
    requestErrors.forEach((e) => console.log(` - [${e.url}]: ${e.error}`));
  }

  // Save report data
  const reportData = {
    timestamp: new Date().toISOString(),
    total,
    passed,
    failed,
    pageErrors,
    consoleErrors,
    requestErrors,
    screens: results,
  };

  const outputDir = path.resolve(".viltrum/rendimiento");
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  fs.writeFileSync(
    path.join(outputDir, "e2e_results.json"),
    JSON.stringify(reportData, null, 2),
    "utf-8"
  );
  console.log(`\nEvidencia guardada en: .viltrum/rendimiento/e2e_results.json`);

  if (failed > 0 || pageErrors.length > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runRealBrowserTests().catch((err) => {
  console.error("Error fatal en el ejecutor E2E:", err);
  process.exit(1);
});
