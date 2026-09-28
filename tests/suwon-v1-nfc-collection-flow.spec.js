const {test,expect}=require('@playwright/test');
const fs=require('fs');
const cp=require('child_process');
test.use({serviceWorkers:'block'});
const ids=['suwon-002','suwon-001','suwon-003'];
const prefixes=['hg','hw','bg'];
const keys=['koreaRouteHaenggungMissionsV2','koreaRouteHwahongmunMissionsV2','koreaRouteBanghwasuryujeongMissionsV2'];
async function rewrite(page){
 await page.route(/\/t(?:\/[^?#]+)?(?:[?#].*)?$/,async route=>{const response=await route.fetch({url:new URL('/nfc-card.html',route.request().url()).href});await route.fulfill({response});});
}
async function count(page){return page.evaluate(()=>JSON.parse(localStorage.getItem('koreaRouteCardCollection')||'[]').length);}
async function raw(page){return page.evaluate(()=>({local:{...localStorage},session:{...sessionStorage}}));}
for(const width of [360,390]){
 test(`${width}px app/card route, 0 to 3 collection, complete without missions, Back`,async({page})=>{
  await rewrite(page);await page.setViewportSize({width,height:844});await page.goto('/t');
  await expect(page.locator('.kr-card-status')).toContainText('0/3');expect(await count(page)).toBe(0);
  await page.getByRole('link',{name:'Back to Suwon route',exact:true}).click();
  await page.getByRole('button',{name:'Got it',exact:true}).click();
  await expect(page.locator('#suwonStartShell')).toBeVisible();
  await expect(page.locator('.suwon-collection-entry')).toContainText('0/3');
  const before=await raw(page);await page.getByRole('button',{name:'Start Suwon trip',exact:true}).click();expect(await raw(page)).toEqual(before);
  for(let i=0;i<3;i++){
   await expect(page.locator('#suwonStartShell li').nth(i).getByRole('link',{name:'View card',exact:true})).toHaveAttribute('href','/t/'+ids[i]);
   await expect(page.locator('#suwonStartShell li').nth(i).getByRole('link',{name:'Open mission',exact:true})).toHaveAttribute('href','/t/'+ids[i]+'#'+prefixes[i]+'-missions');
  }
  await page.locator('#suwonStartShell li').first().getByRole('link',{name:'Open mission',exact:true}).click();
  for(let i=0;i<3;i++){
   await expect(page).toHaveURL(new RegExp('/t/'+ids[i]));expect(await count(page)).toBe(i+1);
   await expect(page.getByRole('link',{name:'Back to Suwon route',exact:true})).toBeVisible();
   expect(await page.locator('input[type=checkbox]:checked').count()).toBe(0);
   if(i<2)await page.getByRole('link',{name:/^Next place/}).click();
  }
  await expect(page.locator('.kr-card-complete')).toContainText('Suwon Complete');
  expect(await page.evaluate(keys=>keys.map(k=>localStorage.getItem(k)),keys)).toEqual([null,null,null]);
  await page.getByRole('link',{name:'View collection',exact:true}).click();
  await expect(page.locator('.kr-card-status')).toContainText('3/3');await expect(page.locator('.kr-card-complete')).toBeVisible();
  await expect(page.locator('.kr-card-choice.is-collected')).toHaveCount(3);
  const collected=await raw(page);await page.reload();expect(await raw(page)).toEqual(collected);
  await page.goBack();await expect(page).toHaveURL(/\/t\/suwon-003/);
  await page.goForward();await expect(page).toHaveURL(/\/t$/);
  await page.getByRole('link',{name:'Back to Suwon route',exact:true}).click();
  await expect(page.locator('.suwon-collection-entry')).toContainText('3/3');
  await expect(page.getByRole('button',{name:'Continue Suwon trip',exact:true})).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 });
 for(const locale of ['en','ko','ja'])test(`${width}px ${locale} all card stories, missions and selector; language is display only`,async({page})=>{
  await rewrite(page);await page.setViewportSize({width,height:844});await page.goto('/t');
  await page.locator('.suwon-card-language').selectOption(locale);
  for(let i=0;i<3;i++){
   await page.goto('/t/'+ids[i]);
   await expect(page.locator('html')).toHaveAttribute('lang',locale);
   if(i===1){
    await expect(page.locator('.hw-intro')).not.toContainText('Start here');
    await expect(page.locator('.hw-intro')).toContainText({en:'Pause here',ko:'이곳에서 잠시 멈춰',ja:'ここで少し立ち止まり'}[locale]);
   }
   if(i===2)await expect(page.locator('.hw-intro')).toContainText({en:'last place on this suggested route',ko:'이 후보 코스의 마지막',ja:'このルート候補の最後の場所'}[locale]);
   await expect(page.locator('#'+prefixes[i]+'-missions input')).toHaveCount(3);
   const start=await raw(page);
   for(const l of ['ja','ko','en',locale])await page.locator('.suwon-card-language').selectOption(l);
   const after=await raw(page);expect(after).toEqual(start);
   await page.locator('#'+prefixes[i]+'-mission-look').check();
   const saved=await page.evaluate(k=>localStorage.getItem(k),keys[i]);expect(JSON.parse(saved)).toEqual({look:true,walk:false,photo:false});
   await page.locator('#'+prefixes[i]+'-mission-walk').check();await page.locator('#'+prefixes[i]+'-mission-photo').check();
   await expect(page.locator('.hw-mission-progress')).toContainText('3/3');
   const records=await raw(page);await page.locator('.suwon-card-language').selectOption(locale==='en'?'ja':'en');await page.locator('.suwon-card-language').selectOption(locale);expect(await raw(page)).toEqual(records);
   await page.locator('.hw-sources summary').click();
   if(locale!=='en'){
    const body=await page.locator('main').innerText();
    const english=body.split('\n').filter(s=>/[A-Za-z]{3}/.test(s.replace(/Korea Route|Google|KRW|NFC|GPS/g,'')));
    expect(english).toEqual([]);
   }
   expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
   if(i===2)await page.screenshot({path:test.info().outputPath(`nfc-${width}-${locale}.png`),fullPage:true});
  }
  await page.goto('/t');await expect(page.locator('.kr-card-complete')).toBeVisible();
  if(locale==='ja')await expect(page.locator('main')).not.toContainText(/Collected|Still to discover|Suwon Complete|Back to|Next place/);
 });
}
test('approved fingerprint scope and original collection writer/mission schema remain intact',()=>{
 const git=(file)=>cp.execFileSync('git',['-c',`safe.directory=${process.cwd().replaceAll('\\','/')}`,'show','2a936a3e08f5d246590fd296a0debbfa245b2096:'+file],{encoding:'utf8'}).replaceAll('\r\n','\n');
 const before=git('nfc-card-landing.js'),after=fs.readFileSync('nfc-card-landing.js','utf8').replaceAll('\r\n','\n');
 for(const name of ['readCollection','firstTapTime','suwonProgress','isSuwonComplete','recordTap']){
  const re=new RegExp('  function '+name+'\\([\\s\\S]*?\n  }');expect(after.match(re)[0]).toBe(before.match(re)[0]);
 }
 for(const key of keys)expect(after.split("const missionKey = '"+key+"'").length).toBe(2);
 const b=JSON.parse(git('main-control/baseline.json')),a=JSON.parse(fs.readFileSync('main-control/baseline.json','utf8'));
 for(const file of ['nfc-card.html','nfc-card-landing.js','nfc-card-landing.css'])a.frozenSourceSha256[file]=b.frozenSourceSha256[file];
 expect(a).toEqual(b);expect(fs.readFileSync('scripts/main-control-guard.js','utf8').replaceAll('\r\n','\n')).toBe(git('scripts/main-control-guard.js'));
});
test('invalid collection and mission raw are preserved on language changes',async({page})=>{
 await rewrite(page);await page.goto('/t');await page.evaluate(keys=>{localStorage.setItem('koreaRouteCardCollection','bad');keys.forEach(k=>localStorage.setItem(k,'bad'));},keys);
 for(const id of ids){await page.goto('/t/'+id);const before=await raw(page);await page.locator('.suwon-card-language').selectOption('ja');await page.locator('.suwon-card-language').selectOption('en');expect(await raw(page)).toEqual({...before,local:{...before.local,koreaRouteLang:'en'}});await page.locator('input[type=checkbox]').first().check();expect(await page.evaluate(k=>localStorage.getItem(k),keys[ids.indexOf(id)])).toBe('bad');}
});
