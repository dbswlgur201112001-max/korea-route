// Live Preview checks. See the QA report for execution status.
// KR_PREVIEW_URL=https://<branch-preview>.vercel.app npx playwright test tests/suwon-travel-pack-v1.browser.spec.cjs
// @playwright/test belongs in a separate QA environment, not the runtime app.
const {test,expect}=require('@playwright/test');
if(!process.env.KR_PREVIEW_URL)throw new Error('Set KR_PREVIEW_URL to this branch Preview.');
const origin=new URL(process.env.KR_PREVIEW_URL).origin;
if(['korea-route.com','www.korea-route.com','korea-route.vercel.app'].includes(new URL(origin).hostname))throw new Error('Use Preview, not Production.');
test.use({serviceWorkers:'block'}); // Fresh context per test; avoid stale application SW assets.
const ids=['001','002','003'],prefixes=['hw','hg','bg'];
const ck='koreaRouteCardCollection',keys=['koreaRouteHwahongmunMissionsV2','koreaRouteHaenggungMissionsV2','koreaRouteBanghwasuryujeongMissionsV2'];
const url=id=>origin+'/t/suwon-'+id;
async function layout(page){
 await page.evaluate(()=>document.fonts.ready);
 expect(await page.evaluate(()=>{
  const width=document.documentElement.clientWidth;
  return{overflow:document.documentElement.scrollWidth>width,outside:[...document.querySelectorAll('main section,main a,main button,main input,main summary')].filter(el=>{const r=el.getBoundingClientRect();return r.width && (r.left< -1 || r.right>width+1);}).map(el=>el.id||el.textContent.trim())};
 })).toEqual({overflow:false,outside:[]});
}
for(const width of [360,390,430])for(const id of ids){
 test(`${id}: ${width}px render, image, routes, expanded local picks, no blocking error`,async({page})=>{
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  await page.setViewportSize({width,height:844});
  const response=await page.goto(url(id));expect(response.ok()).toBeTruthy();
  await expect(page.locator('.kr-travel-pack')).toBeVisible();
  await expect(page.locator('.hw-eyebrow')).toHaveText('SUWON CARD '+id);
  const img=page.locator('.tp-card-image img');await expect(img).toBeVisible();
  await expect(img).toHaveAttribute('src',new RegExp('^/nfc-suwon-'+id+'-.*\\.webp$'));
  await expect.poll(()=>img.evaluate(el=>el.complete&&el.naturalWidth>0)).toBe(true);
  await expect(page.locator('#tp-complete')).toHaveCount(0);
  await page.getByRole('link',{name:'Your first move',exact:true}).click();
  await expect(page.locator('#tp-start')).toBeInViewport();
  await layout(page);
  for(const [i,label] of ['SHORT','STANDARD','EXTENDED'].entries()){
   await page.getByRole('button',{name:label,exact:true}).click();
   await expect(page.locator('.tp-route-panel')).toHaveAttribute('data-route',String(i));
   const n=await page.locator('.tp-route-panel li').count();expect(n).toBeGreaterThanOrEqual(3);expect(n).toBeLessThanOrEqual(5);await layout(page);
  }
  for(const item of await page.locator('.tp-local-pick').all()){await item.locator('summary').click();await expect(item.locator('.tp-address')).toBeVisible();}
  await layout(page);
  for(const a of await page.locator('a[target=_blank]').all()){
   const href=new URL(await a.getAttribute('href'));expect(href.protocol).toBe('https:');
   if(href.hostname==='www.google.com'){expect(href.pathname).toBe('/maps/search/');expect(href.searchParams.get('query')).toContain('Suwon');}
  }
  expect(errors).toEqual([]);
 });
}
for(const id of ids)test(id+' missing artwork has no broken image',async({page})=>{
 await page.route('**/nfc-suwon-'+id+'-*.webp',route=>route.fulfill({status:404,body:''}));
 await page.goto(url(id));await expect(page.locator('.tp-card-image img')).toHaveCount(0);
 await expect(page.locator('.tp-card-image')).toContainText(id);await layout(page);
});

test('mission persistence, isolation, timestamps, taps and complete-day gate',async({page})=>{
 await page.goto(origin+'/t');await expect(page.locator('.kr-card-status')).toContainText('0/3');
 const initial=[{look:true,walk:false,photo:false},{look:false,walk:true,photo:false},{look:false,walk:false,photo:true}];
 await page.evaluate(({keys,initial})=>keys.forEach((key,i)=>localStorage.setItem(key,JSON.stringify(initial[i]))),{keys,initial});
 const firstTimes={};
 for(const [i,id] of ids.entries()){
  await page.goto(url(id));
  for(const [j,name] of ['look','walk','photo'].entries())await expect(page.locator('#'+prefixes[i]+'-mission-'+name)).toBeChecked({checked:initial[i][name]});
  const before=await page.evaluate(ck=>JSON.parse(localStorage.getItem(ck)),ck);firstTimes[id]=before.find(x=>x.id==='suwon-'+id).firstTapAt;
  await expect(page.locator('.hw-collection-count')).toContainText((i+1)+' OF 3');
  await expect(page.locator('#tp-complete')).toHaveCount(i===2?1:0);
  for(const name of ['look','walk','photo'])await page.locator('#'+prefixes[i]+'-mission-'+name).check();
  await expect(page.locator('.hw-mission-progress')).toContainText('3/3');
  expect(await page.evaluate(ck=>JSON.parse(localStorage.getItem(ck)),ck)).toEqual(before);
  const saved=await page.evaluate(keys=>keys.map(key=>JSON.parse(localStorage.getItem(key))),keys);
  for(let j=i+1;j<3;j++)expect(saved[j]).toEqual(initial[j]);
  await page.reload();for(const name of ['look','walk','photo'])await expect(page.locator('#'+prefixes[i]+'-mission-'+name)).toBeChecked();
  const after=await page.evaluate(ck=>JSON.parse(localStorage.getItem(ck)),ck),entry=after.find(x=>x.id==='suwon-'+id);
  expect(entry.firstTapAt).toBe(firstTimes[id]);expect(entry.tapCount).toBe(2);expect(after.length).toBe(i+1);
 }
 for(const id of ids){await page.goto(url(id));await expect(page.locator('#tp-complete')).toBeVisible();await expect(page.getByRole('heading',{name:'The Complete Suwon Route',exact:true})).toBeVisible();await expect(page.locator('#tp-complete li')).toHaveCount(5);}
 for(const width of [360,390,430]){await page.setViewportSize({width,height:844});await layout(page);}
 await page.goto(origin+'/t/suwon-999');await expect(page.locator('h1')).toHaveText('Card not found');await expect(page.locator('.tp-nav')).toHaveCount(0);
 await page.goto(origin+'/t');await expect(page.locator('h1')).toHaveText('Which card do you have?');await expect(page.locator('.kr-card-status')).toContainText('3/3');
});

test('map and local listing actions open the intended external page',async({page,context})=>{
 await page.goto(url('001'));
 const stop=page.locator('.tp-route-panel a').first(),mapHref=await stop.getAttribute('href');
 const mapPromise=context.waitForEvent('page');await stop.click();const map=await mapPromise;
 await map.waitForLoadState('domcontentloaded');expect(new URL(map.url()).hostname).toMatch(/(^|\.)google\./);expect(mapHref).toContain('/maps/search/?api=1&query=');await map.close();
 const pick=page.locator('.tp-local-pick').first();await pick.locator('summary').click();
 const source=pick.getByRole('link',{name:'Visitor details (opens in a new tab)',exact:true}),href=await source.getAttribute('href');
 const sourcePromise=context.waitForEvent('page');await source.click();const listing=await sourcePromise;
 await listing.waitForLoadState('domcontentloaded');expect(new URL(listing.url()).hostname).toBe(new URL(href).hostname);await expect(listing.locator('body')).toContainText('보영');await listing.close();
});
