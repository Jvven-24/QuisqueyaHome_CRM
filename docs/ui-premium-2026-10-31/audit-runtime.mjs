import fs from 'node:fs/promises';
import path from 'node:path';
import {createRequire} from 'node:module';
const require=createRequire('C:/Users/wilbe/package.json');
const {chromium}=require('playwright');
const base=process.argv[2]||'http://127.0.0.1:3000';
const phase=process.argv[3]||'baseline';
if(!/^http:\/\/127\.0\.0\.1:\d+$/.test(base))throw Error('local only');
const output=path.resolve('output/playwright/premium-'+phase);
await fs.mkdir(output,{recursive:true});
const credential=JSON.parse(await fs.readFile(path.join(process.env.LOCALAPPDATA,'QuisqueyaHome/review-access/admin-local-20261031.json'),'utf8'));
const routes=process.argv[4]?process.argv[4].split(','):['/inicio','/leads','/contactos','/propiedades','/agenda','/tareas','/brokers','/comunicaciones','/reportes','/metas','/comisiones','/configuracion','/aprobaciones','/avances','/academy','/documentos'];
const browser=await chromium.launch({headless:true});
const context=await browser.newContext({viewport:{width:1440,height:900},reducedMotion:'reduce'});
const page=await context.newPage();
let current='login';const errors=[];const responses=[];const rows=[];
page.on('pageerror',e=>errors.push({route:current,message:e.message}));
page.on('response',r=>{if(r.status()>=400&&r.url().startsWith(base))responses.push({route:current,status:r.status(),path:new URL(r.url()).pathname});});
const flush=()=>fs.writeFile(path.join(output,'results.json'),JSON.stringify({base,phase,routes,rows,errors,responses},null,2));
try{
 await page.goto(base+'/login',{waitUntil:'networkidle',timeout:60000});
 if(await page.locator('#crm-main').count()===0){
  await page.getByLabel('Correo electrónico corporativo',{exact:true}).fill(credential.email);
  await page.getByLabel('Contraseña',{exact:true}).fill(credential.password);
  await page.getByRole('button',{name:'Entrar al CRM',exact:true}).click();
  await page.waitForURL('**/inicio',{timeout:60000});
  console.log('REAL_ADMIN_LOGIN_OK');
 }else console.log('LOCAL_EVALUATION_SESSION_PRESENT');
 for(const route of routes){
  current=route;
  for(const width of [390,320,1440]){
   await page.setViewportSize({width,height:width<768?844:900});
   try{
    const started=Date.now();
    const response=await page.goto(base+route,{waitUntil:'networkidle',timeout:60000});
    await page.locator('#crm-main h1:visible').first().waitFor({state:'visible',timeout:30000});
    const elapsed=Date.now()-started;
    const geometry=await page.evaluate(()=>{
     const main=document.querySelector('#crm-main');const viewport=document.documentElement.clientWidth;
     const visible=e=>{const r=e.getBoundingClientRect();const s=getComputedStyle(e);return r.width>0&&r.height>0&&s.display!=='none'&&s.visibility!=='hidden'};
     const overflow=[...(main?.querySelectorAll('*')||[])].filter(e=>{const r=e.getBoundingClientRect();if(!visible(e)||r.right<=viewport+1||getComputedStyle(e).position==='fixed')return false;let p=e.parentElement;while(p&&p!==main){if(['auto','scroll','hidden','clip'].includes(getComputedStyle(p).overflowX))return false;p=p.parentElement;}return true;}).slice(0,8).map(e=>({tag:e.tagName,className:String(e.className).slice(0,160),right:Math.round(e.getBoundingClientRect().right),width:Math.round(e.getBoundingClientRect().width)}));
     const notes=[...document.querySelectorAll('[role=note]')].filter(visible).map(e=>({tag:e.tagName,height:e.clientHeight,scrollHeight:e.scrollHeight,clamp:getComputedStyle(e).webkitLineClamp}));
     const controls=[...(main?.querySelectorAll('button,a,input,select,textarea')||[])].filter(visible);
     const smallTargets=controls.filter(e=>{const r=e.getBoundingClientRect();return r.height<40&&r.width<100}).slice(0,15).map(e=>({tag:e.tagName,name:(e.getAttribute('aria-label')||e.textContent||e.getAttribute('name')||'').trim().slice(0,55),width:Math.round(e.getBoundingClientRect().width),height:Math.round(e.getBoundingClientRect().height)}));
     return {url:location.pathname,title:document.title,main:!!main,h1:[...(main?.querySelectorAll('h1')||[])].find(visible)?.textContent||null,viewport,scroll:document.documentElement.scrollWidth,height:document.documentElement.scrollHeight,mainTop:main?Math.round(main.getBoundingClientRect().top):null,overflow,notes,smallTargets,error:/Application error:|Algo salió mal|Error al cargar/.test(document.body.innerText)};
    });
    rows.push({route,width,status:response.status(),elapsed,...geometry});
    await page.screenshot({path:path.join(output,route.slice(1)+'-'+width+'.png'),fullPage:phase==='baseline'&&width===390});
    console.log(JSON.stringify({route,width,status:response.status(),elapsed,overflow:geometry.overflow.length,height:geometry.height,error:geometry.error}));
   }catch(e){rows.push({route,width,error:e.message});console.log('ROUTE_FAILURE',route,width,e.name);}
   await flush();
  }
 }
}catch(e){rows.push({failure:e.message});console.log('AUDIT_FAILED',e.name)}finally{await flush();await browser.close();}
