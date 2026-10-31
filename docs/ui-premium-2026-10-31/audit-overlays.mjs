import fs from 'node:fs/promises';import path from 'node:path';import {createRequire} from 'node:module';
const require=createRequire('C:/Users/wilbe/package.json');const {chromium}=require('playwright');
const base=process.argv[2]||'http://127.0.0.1:3000';const phase=process.argv[3]||'baseline';
if(!/^http:\/\/127\.0\.0\.1:\d+$/.test(base))throw Error('local only');
const width=Number(process.argv[4]||390);const out=path.resolve('output/playwright/premium-'+phase);await fs.mkdir(out,{recursive:true});
const c=JSON.parse(await fs.readFile(path.join(process.env.LOCALAPPDATA,'QuisqueyaHome/review-access/admin-local-20261031.json'),'utf8'));
const browser=await chromium.launch({headless:true});const context=await browser.newContext({viewport:{width,height:844},reducedMotion:'reduce'});const page=await context.newPage();const rows=[];
try{
 await page.goto(base+'/login',{waitUntil:'networkidle',timeout:60000});
 if(await page.locator('#crm-main').count()===0){await page.getByLabel('Correo electrónico corporativo',{exact:true}).fill(c.email);await page.getByLabel('Contraseña',{exact:true}).fill(c.password);await page.getByRole('button',{name:'Entrar al CRM',exact:true}).click();await page.waitForURL('**/inicio',{timeout:60000});}
 for(const [route,name] of [['/propiedades','Nuevo proyecto'],['/contactos','Nuevo contacto'],['/leads','Registrar lead']]){
  try{
   await page.setViewportSize({width,height:844});await page.goto(base+route,{waitUntil:'networkidle',timeout:60000});await page.getByRole('button',{name,exact:true}).click();
   const dialog=page.getByRole('dialog').last();await dialog.waitFor();
   for(const height of [844,500]){
    await page.setViewportSize({width,height});await page.waitForTimeout(350);
    const geometry=await dialog.evaluate(e=>{const r=e.getBoundingClientRect();const s=getComputedStyle(e);const p=e.parentElement;const ps=p&&getComputedStyle(p);return {top:r.top,bottom:r.bottom,height:r.height,viewport:innerHeight,scrollHeight:e.scrollHeight,overflowY:s.overflowY,className:String(e.className),computed:{height:s.height,minHeight:s.minHeight,maxHeight:s.maxHeight,overflow:s.overflow},parent:p&&{className:String(p.className),height:ps.height,alignItems:ps.alignItems,flexDirection:ps.flexDirection},controls:[...e.querySelectorAll('button')].map(b=>({label:b.getAttribute('aria-label')||b.innerText,top:b.getBoundingClientRect().top,bottom:b.getBoundingClientRect().bottom}))}});
    await page.screenshot({path:path.join(out,route.slice(1)+'-modal-'+height+'.png')});rows.push({route,height,geometry});
   }
   const actions=[];for(const button of await dialog.getByRole('button').all()){const label=await button.getAttribute('aria-label')||await button.innerText();if(!/Cerrar|Cancelar|Crear|Registrar/.test(label))continue;await button.scrollIntoViewIfNeeded();await page.waitForTimeout(100);actions.push(await button.evaluate(b=>{const r=b.getBoundingClientRect();const x=Math.max(0,Math.min(innerWidth-1,r.left+r.width/2));const y=Math.max(0,Math.min(innerHeight-1,r.top+r.height/2));const hit=document.elementFromPoint(x,y);return {label:b.getAttribute('aria-label')||b.innerText,top:r.top,bottom:r.bottom,inside:r.top>=0&&r.bottom<=innerHeight,receivesPointer:hit===b||b.contains(hit)}}));}rows.push({route,width,actionReachability:actions});
   await page.keyboard.press('Escape');await page.waitForTimeout(350);rows.push({route,escapeClosed:await page.getByRole('dialog').count()===0});
  }catch(e){rows.push({route,error:e.message});}
 }
 await page.setViewportSize({width,height:844});await page.goto(base+'/propiedades',{waitUntil:'networkidle'});
 await page.getByRole('button',{name:'Ver todos los módulos',exact:true}).click();await page.getByRole('dialog').waitFor();await page.waitForTimeout(350);await page.screenshot({path:path.join(out,'mobile-modules.png')});const before=await page.evaluate(()=>scrollY);await page.mouse.move(12,150);await page.mouse.wheel(0,600);await page.waitForTimeout(300);const after=await page.evaluate(()=>scrollY);rows.push({mobileMenuBackgroundScroll:{before,after,locked:before===after}});
 const lastLink=page.getByRole('dialog').getByRole('link').last();await lastLink.scrollIntoViewIfNeeded();await page.waitForTimeout(150);rows.push({lastMenuLink:await lastLink.evaluate(e=>{const r=e.getBoundingClientRect();const scroll=e.closest('[style]');const sr=scroll?.getBoundingClientRect();return {name:e.textContent.trim(),top:r.top,bottom:r.bottom,viewport:innerHeight,scrollHeight:scroll?.scrollHeight,clientHeight:scroll?.clientHeight,scrollTop:scroll?.scrollTop,maxHeight:scroll?getComputedStyle(scroll).maxHeight:null,withinScrollport:sr?r.top>=sr.top&&r.bottom<=Math.min(sr.bottom,innerHeight):false}})});await page.screenshot({path:path.join(out,'mobile-modules-last.png')});
 await page.keyboard.press('Escape');await page.waitForTimeout(350);rows.push({mobileMenuEscapeClosed:await page.getByRole('dialog').count()===0});
 await page.goto(base+'/automatizaciones',{waitUntil:'networkidle',timeout:60000});await page.getByRole('tablist').waitFor();await page.getByRole('tab').first().focus();const tabStates=[];for(let i=0;i<2;i++){await page.keyboard.press('ArrowRight');await page.waitForTimeout(650);tabStates.push(await page.evaluate(()=>({url:location.pathname+location.search,focused:document.activeElement?.id,selected:document.querySelector('[role=tab][aria-selected=true]')?.id})));}rows.push({automationArrowRight:tabStates});
}catch(e){rows.push({failure:e.message});}finally{await fs.writeFile(path.join(out,'overlays.json'),JSON.stringify(rows,null,2));console.log(JSON.stringify(rows));await browser.close();}
