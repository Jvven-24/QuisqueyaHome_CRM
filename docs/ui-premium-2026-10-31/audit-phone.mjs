import fs from 'node:fs/promises';import path from 'node:path';import {createRequire} from 'node:module';
const require=createRequire('C:/Users/wilbe/package.json');const {chromium}=require('playwright');
const base=process.argv[2]||'http://127.0.0.1:9305';if(!/^http:\/\/127\.0\.0\.1:\d+$/.test(base))throw Error('local only');
const c=JSON.parse(await fs.readFile(path.join(process.env.LOCALAPPDATA,'QuisqueyaHome/review-access/admin-local-20261031.json'),'utf8'));
const out='output/playwright/premium-phone-r2';await fs.mkdir(out,{recursive:true});const b=await chromium.launch({headless:true});const p=await b.newPage({viewport:{width:320,height:500},reducedMotion:'reduce'});const results=[];
try{
 await p.goto(base+'/login',{waitUntil:'networkidle'});await p.getByLabel('Correo electrónico corporativo',{exact:true}).fill(c.email);await p.getByLabel('Contraseña',{exact:true}).fill(c.password);await p.getByRole('button',{name:'Entrar al CRM',exact:true}).click();await p.waitForURL('**/inicio');
 await p.goto(base+'/leads',{waitUntil:'networkidle'});await p.getByRole('button',{name:'Registrar lead',exact:true}).click();await p.getByRole('dialog').waitFor();await p.waitForTimeout(350);
 const country=p.getByRole('combobox',{name:'País del teléfono',exact:true});const phone=p.getByRole('textbox',{name:/Número de teléfono/});await phone.scrollIntoViewIfNeeded();
 for(const [iso,number]of [['DO','8095550123'],['US','3055550123']]){
  await country.selectOption(iso);await phone.fill(number);await p.waitForTimeout(100);results.push({country:iso,geometry:await p.getByRole('dialog').evaluate(e=>{const d=e.getBoundingClientRect();const country=e.querySelector('[aria-label="País del teléfono"]');const phone=e.querySelector('input[type=tel]');const rect=x=>{const r=x.getBoundingClientRect();return {left:r.left,right:r.right,width:r.width,top:r.top,bottom:r.bottom,withinDialog:r.left>=d.left&&r.right<=d.right}};return {dialog:{left:d.left,right:d.right},country:rect(country),phone:rect(phone),phoneValue:phone.value,hiddenValue:e.querySelector('input[name=phone]')?.value}})});
 }
 await p.screenshot({path:path.join(out,'phone-320x500.png')});await p.keyboard.press('Escape');results.push({closedWithoutSaving:await p.getByRole('dialog').count()===0});
}catch(e){results.push({error:e.message})}finally{await fs.writeFile(path.join(out,'results.json'),JSON.stringify(results,null,2));console.log(JSON.stringify(results));await b.close()}
