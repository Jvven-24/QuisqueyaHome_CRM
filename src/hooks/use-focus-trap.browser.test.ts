import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { test } from "node:test";
import { build } from "esbuild";

const require = createRequire(import.meta.url);
// Prueba opt-in con navegador real; sin nueva dependencia de producto.
// PLAYWRIGHT_MODULE_PATH apunta al runtime del host cuando no está instalado localmente.
const ruta = process.env.PLAYWRIGHT_MODULE_PATH;

test("DOM real: autofocus por defecto, Tab/ShiftTab/Escape, callback inline, anidamiento, restauración y cleanup antes del timer", { skip: !ruta }, async () => {
  const { chromium } = require(ruta!);
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    const bundle = await build({
      stdin: { contents: `
        import React from "react";
        import {createRoot} from "react-dom/client";
        import {flushSync} from "react-dom";
        import {useFocusTrap} from "./src/hooks/use-focus-trap";
        let parentOpen=true, childOpen=false, version=0;
        window.closes=[];
        function Child(){const ref=useFocusTrap({onClose:()=>{window.closes.push("child");childOpen=false;render();}});return <section role="dialog" ref={ref}><button id="child-first">Uno</button><button id="child-last">Dos</button></section>;}
        function Harness(){const ref=useFocusTrap({isActive:parentOpen,onClose:()=>{window.closes.push("parent-"+version);parentOpen=false;render();}});return parentOpen?<section role="dialog" ref={ref}><button id="first">Primero</button><button id="middle" onClick={()=>{childOpen=true;render();}}>Hijo</button><button id="last">Último</button>{childOpen?<Child/>:null}</section>:null;}
        const root=createRoot(document.getElementById("root"));
        function render(){flushSync(()=>root.render(<Harness/>));}
        window.harness={open(){parentOpen=true;render();},close(){parentOpen=false;render();},rerender(){version++;render();},unmount(){flushSync(()=>root.unmount());}};
        render();
      `, resolveDir: process.cwd(), loader: "tsx" },
      bundle: true, write: false, format: "iife", platform: "browser", define: { "process.env.NODE_ENV": '"production"' },
    });
    await page.setContent('<button id="trigger">Abrir</button><div id="root"></div>');
    await page.focus("#trigger");
    await page.addScriptTag({ content: bundle.outputFiles[0]!.text });
    await page.waitForFunction(() => document.activeElement?.id === "first");
    await page.focus("#last");
    await page.keyboard.press("Tab");
    assert.equal(await page.evaluate(() => document.activeElement?.id), "first");
    await page.keyboard.press("Shift+Tab");
    assert.equal(await page.evaluate(() => document.activeElement?.id), "last");
    await page.focus("#middle");
    await page.evaluate("window.harness.rerender()");
    assert.equal(await page.evaluate(() => document.activeElement?.id), "middle", "callback inline no desmonta la trampa ni restaura foco");
    await page.click("#middle");
    await page.waitForFunction(() => document.activeElement?.id === "child-first");
    await page.focus("#child-last");
    await page.keyboard.press("Tab");
    assert.equal(await page.evaluate(() => document.activeElement?.id), "child-first");
    await page.keyboard.press("Escape");
    await page.waitForFunction(() => document.activeElement?.id === "middle");
    assert.deepEqual(await page.evaluate("window.closes"), ["child"], "Escape del hijo no cierra el padre");
    await page.keyboard.press("Escape");
    await page.waitForFunction(() => document.activeElement?.id === "trigger");
    assert.deepEqual(await page.evaluate("window.closes"), ["child", "parent-1"], "se usa el callback actual y se restaura el trigger");
    await page.evaluate("window.harness.open();window.harness.close()");
    await page.waitForTimeout(60);
    assert.equal(await page.evaluate(() => document.activeElement?.id), "trigger", "el timer cancelado no roba foco tras desmontar");
    await page.keyboard.press("Escape");
    assert.deepEqual(await page.evaluate("window.closes"), ["child", "parent-1"], "no quedan listeners vivos");
  } finally { await browser.close(); }
});
