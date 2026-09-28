const {test,expect}=require('@playwright/test');
const fs=require('fs'),vm=require('vm'),cp=require('child_process');
test.use({serviceWorkers:'block'});
for(const width of [360,390])for(const locale of ['en','ko','ja'])test(`${width} ${locale} private auth surface, no local persistence, no upload`,async({page})=>{
 await page.route('**/api/memory-auth?action=session',r=>r.fulfill({status:503,json:{error:'MEMORY_NOT_CONFIGURED'}}));
 await page.goto('/memory.html');await page.setViewportSize({width,height:844});
 await page.evaluate(()=>{localStorage.setItem('koreaRouteCardCollection','synthetic-existing');sessionStorage.setItem('koreaRouteTrip','synthetic-existing');});
 const before=await page.evaluate(()=>({local:{...localStorage},session:{...sessionStorage}}));
 await page.locator('#language').selectOption(locale);
 await expect(page.locator('#title')).toHaveText({en:'My Suwon memory',ko:'나의 수원 추억',ja:'私の水原の思い出'}[locale]);
 await expect(page.locator('#status')).toHaveText({en:'Cloud memories are not available yet. Please try again later.',ko:'추억 저장 서비스를 아직 사용할 수 없습니다. 나중에 다시 시도하세요.',ja:'思い出の保存サービスはまだ利用できません。時間をおいてお試しください。'}[locale]);
 expect(await page.locator('input[type=file]').count()).toBe(0);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 expect(await page.evaluate(()=>({local:{...localStorage},session:{...sessionStorage}}))).toEqual(before);
 if(locale==='ja')await expect(page.locator('main')).not.toContainText(/Send sign-in|Cloud memories|Back to Suwon|Sign out/);
});
test('callback fragment removed immediately, expired recovery never persists token',async({page})=>{
 await page.route('**/api/memory-auth?action=callback',r=>r.fulfill({status:400,json:{error:'LINK_EXPIRED_OR_WRONG_BROWSER'}}));
 await page.goto('/memory.html?state=synthetic#token_hash='+ 'b'.repeat(64));await expect(page).toHaveURL(/\/memory.html$/);await page.locator('#verify').click();await expect(page.locator('#status')).toContainText('expired');await expect(page.locator('#login')).toBeVisible();expect(await page.evaluate(()=>localStorage.length+sessionStorage.length)).toBe(0);
});
test('SW never intercepts private documents/auth/API/signed URLs; travel navigation retained',()=>{
 const handlers={};vm.runInNewContext(fs.readFileSync('sw.js','utf8'),{self:{addEventListener:(n,f)=>handlers[n]=f,location:{origin:'https://preview.invalid'}},URL,Set});
 for(const path of ['/memory.html','/memory.js','/memory.css','/auth/callback','/api/memory-auth?action=session','/api/memory-media?action=view','https://project.supabase.co/storage/v1/object/sign/travel-memories/test?token=x']){
 let intercepted=false;handlers.fetch({request:{url:new URL(path,'https://preview.invalid').href,method:'GET',mode:'navigate'},respondWith(){intercepted=true;}});expect(intercepted).toBe(false);
 }
 const src=fs.readFileSync('sw.js','utf8');expect(src).toContain("caches.match('/index.html')");expect(src).toContain("caches.match('/nfc-card.html')");expect(src.match(/const CORE=\[([^;]+);/)[0]).not.toContain('memory');
});
test('existing engines, collections, missions and all storage contracts byte-identical to approved base',()=>{
 const git=file=>cp.execFileSync('git',['-c',`safe.directory=${process.cwd().replaceAll('\\','/')}`,'show','f9de19c5f2854eb7bd004a74f01fadf398452337:'+file],{encoding:'utf8',maxBuffer:16*1024*1024}).replaceAll('\r\n','\n');
 for(const file of ['index.html','nfc-card.html','nfc-card-landing.js','nfc-card-landing.css','scripts/main-control-guard.js','api/receipt.js'])expect(fs.readFileSync(file,'utf8').replaceAll('\r\n','\n')).toBe(git(file));
 const base=JSON.parse(git('main-control/baseline.json')),now=JSON.parse(fs.readFileSync('main-control/baseline.json','utf8'));for(const key of ['protectedStorageKeys','storageContract','storageSourceSha256'])expect(now[key]).toEqual(base[key]);
 for(const file of ['memory.js','memory.html'])expect(fs.readFileSync(file,'utf8')).not.toMatch(/localStorage|sessionStorage|indexedDB|caches\.open|service_role|SUPABASE_SECRET/);
});
