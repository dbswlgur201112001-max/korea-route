const {test,expect}=require('@playwright/test');
test.use({serviceWorkers:'block'});
const shell=page=>page.locator('#suwonStartShell');
const names={en:['Hwaseong Haenggung Palace','Hwahongmun Gate','Banghwasuryujeong Pavilion'],ko:['화성행궁','화홍문','방화수류정'],ja:['華城行宮','華虹門','訪花隨柳亭']};
async function start(page){await page.goto('/');await page.getByRole('button',{name:'Got it',exact:true}).click();}
async function selectSuwon(page){await page.getByRole('button',{name:'Explore',exact:true}).click();await page.locator('#exploreQuickCity').selectOption('Suwon');await page.getByRole('button',{name:'Open city',exact:true}).click();await page.getByRole('button',{name:'Today',exact:true}).click();}
for(const width of [360,390]){
 test(`${width}px Suwon entry, three stops, explicit locales and read-only Start`,async({page})=>{
  await page.setViewportSize({width,height:844});await start(page);await expect(shell(page)).toBeHidden();await selectSuwon(page);
  await expect(shell(page)).toBeVisible();await expect(shell(page)).toContainText('SUWON TRAVEL PACK');
  await expect(shell(page).locator('li')).toHaveCount(3);
  expect(await shell(page).locator('li').evaluateAll(nodes=>nodes.map(n=>n.dataset.cardId))).toEqual(['suwon-002','suwon-001','suwon-003']);
  const before=await page.evaluate(()=>({local:{...localStorage},session:{...sessionStorage}}));
  await shell(page).getByRole('button',{name:'Start Suwon trip',exact:true}).click();
  await expect(shell(page).getByRole('button',{name:'Start Suwon trip',exact:true})).toHaveAttribute('aria-expanded','true');
  expect(await page.evaluate(()=>({local:{...localStorage},session:{...sessionStorage}}))).toEqual(before);
  for(const [language,cta,note] of [
   ['en','Start Suwon trip','Card numbers are not the visiting order.'],
   ['ko','수원 여행 시작','카드 번호는 방문 순서가 아닙니다.'],
   ['ja','水原の旅を始める','カード番号は訪問順ではありません。']
  ]){
   await expect(shell(page).locator('.suwon-scenic-option')).toHaveText({en:'Scenic walk option along Suwoncheon',ko:'수원천을 따라 걷는 풍경 코스 후보',ja:'水原川沿いを歩く景色の楽しめるルート候補'}[language]);
   await expect(shell(page).locator('.suwon-route-story')).toContainText({en:'Field check required.',ko:'현장 확인 필요.',ja:'現地確認が必要です。'}[language]);
   await expect(shell(page)).not.toContainText('Walk through three Suwon places');
   await expect(shell(page)).toContainText({en:'Explore three Suwon places',ko:'수원의 세 장소를 둘러보며',ja:'水原の3つの場所を巡り'}[language]);
   await expect(shell(page).locator('li')).toHaveCount(3);
   await expect(shell(page).locator('li h4')).toHaveText(names[language]);await expect(shell(page)).toContainText(note);
   await expect(shell(page).getByRole('button',{name:cta,exact:true})).toBeVisible();
   await expect(shell(page)).not.toContainText(/Haenggung-dong|행궁동|Best route|Optimal route|guaranteed|Always open|Verified visit|\d+\s*(hours?|minutes?|km)\b/i);
   await shell(page).locator('summary').click();
   if(language==='ja')await expect(shell(page)).not.toContainText(/Start|Continue|Saved|Not assigned|Collected|View card|Open mission|Collection|Next place|Your Suwon route/);
   expect(await page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth)).toBe(true);
   if(language!=='ja')await page.locator('#langBtn').click();
  }
  await page.screenshot({path:test.info().outputPath(`suwon-${width}-ja.png`),fullPage:true});
 });
 test(`${width}px Save only stays unassigned, existing explicit day flow and general engines`,async({page})=>{
  await page.setViewportSize({width,height:844});await start(page);
  await page.evaluate(()=>openCityFromHub('Suwon'));
  await page.locator('#cityPoiList .poi-save-btn').first().click();
  await page.getByRole('button',{name:'Today',exact:true}).click();
  await expect(shell(page)).toContainText('Saved — not added to a trip day yet.');
  expect(await page.evaluate(()=>savedPlacePlan())).toEqual({});
  await shell(page).getByRole('button',{name:'Continue Suwon trip',exact:true}).click();
  await shell(page).getByRole('button',{name:'Choose day',exact:true}).click();
  await expect(page.locator('#myTripSavedPlaces')).toHaveClass(/v60-selected/);
  await expect(page.locator('#myTripSavedPlaces')).toBeVisible();
  await page.locator('#myTripSavedPlaces .saved-unassigned select').selectOption('2');
  await expect.poll(()=>page.evaluate(()=>savedPlacePlan()['Suwon::Hwaseong Haenggung']?.day)).toBe(2);
  // Existing V203 Back closes the My Trip detail layer before leaving the screen.
  await page.getByRole('button',{name:'Today',exact:true}).click();
  await expect(page.locator('#myTripHub')).not.toHaveClass(/v60-detail/);
  await page.getByRole('button',{name:'Today',exact:true}).click();
  await expect(page.locator('#home')).toHaveClass(/active/);
  await expect(shell(page).locator('li').first()).toContainText('In trip');
  expect(await page.evaluate(()=>savedPlacePlan()['Suwon::Hwaseong Haenggung'].day)).toBe(2);
  await shell(page).getByRole('button',{name:'Check transport',exact:true}).click();await expect(page.locator('#moveHub')).toHaveClass(/active/);
  await page.goBack();await expect(page.locator('#home')).toHaveClass(/active/);
  await shell(page).getByRole('button',{name:'Scan & translate',exact:true}).click();await expect(page.locator('#scanTranslateChoices')).toBeVisible();
  await page.getByRole('button',{name:'Today',exact:true}).click();await shell(page).getByRole('button',{name:'Help',exact:true}).click();await expect(page.locator('#helperHub')).toHaveClass(/active/);
  await page.getByRole('button',{name:'Today',exact:true}).click();await shell(page).getByRole('button',{name:'Explore more',exact:true}).click();await expect(page.locator('#cityPoiList')).toContainText('Haenggung-dong');
  // The existing place-search engine receives the selected core place; no coordinates are invented.
  await page.evaluate(()=>{window.suwonMapCalls=[];window.v140OpenEventPlace=(...args)=>window.suwonMapCalls.push(args);});
  await page.getByRole('button',{name:'Today',exact:true}).click();await shell(page).locator('li').nth(1).getByRole('button',{name:'Get there',exact:true}).click();
  expect(await page.evaluate(()=>window.suwonMapCalls)).toEqual([['Suwon','화홍문']]);
 });
}
test('trip, saved, collection and mission raw stay unchanged across repeated rendering',async({page})=>{
 await start(page);
 const result=await page.evaluate(()=>{
  const trip='{"start":"Seoul","dest":"Suwon","date":"2026-09-28","days":1}';
  sessionStorage.setItem('koreaRouteTrip',trip);localStorage.setItem('koreaRouteSavedTrip',trip);
  localStorage.setItem('koreaRouteCardCollection','[{"id":"suwon-001","firstTapAt":"2026-09-28T09:00:00+09:00","tapCount":1}]');
  localStorage.setItem('koreaRouteHwahongmunMissionsV2','{"look":true,"walk":false,"photo":false}');
  sessionStorage.setItem('koreaRouteSavedPlacePlan','{}');
  const before={local:{...localStorage},session:{...sessionStorage}};const old=Storage.prototype.setItem;let writes=0;
  Storage.prototype.setItem=function(...args){writes++;return old.apply(this,args);};
  try{for(const language of ['en','ko','ja']){lang=language;renderSuwonStartShell();renderSuwonStartShell();}return {before,after:{local:{...localStorage},session:{...sessionStorage}},writes};}finally{Storage.prototype.setItem=old;}
 });
 expect(result.writes).toBe(0);expect(result.after).toEqual(result.before);
 await expect(shell(page)).toContainText('水原の旅を続ける');await expect(shell(page).locator('li').nth(1)).toContainText('収集済み');
});
test('invalid stored shapes do not create progress; explicit other city retains general Today',async({page})=>{
 await start(page);await selectSuwon(page);
 for(const raw of ['not JSON','{}','[null]','[{"id":"suwon-001"}]']){
  await page.evaluate(raw=>{localStorage.setItem('koreaRouteCardCollection',raw);sessionStorage.setItem('koreaRouteSavedPlaces',raw);sessionStorage.setItem('koreaRouteSavedPlacePlan',raw);renderSuwonStartShell();},raw);
  await expect(shell(page).getByRole('button',{name:'Start Suwon trip',exact:true})).toBeVisible();
 }
 await page.evaluate(()=>{localStorage.setItem('koreaRouteSavedTrip',JSON.stringify({dest:'Suwon'}));openCityFromHub('Busan');});
 await page.getByRole('button',{name:'Today',exact:true}).click();await expect(shell(page)).toBeHidden();
 await expect(page.locator('#home .v220-core-card')).toHaveCount(4);await expect(page.locator('#v60Tabbar button')).toHaveCount(4);await expect(page.locator('#home .v220-popular')).toBeVisible();
});
test('NFC links use existing IDs and mission anchors; following a card uses existing collection writer',async({page})=>{
 await start(page);await selectSuwon(page);await shell(page).getByRole('button',{name:'Start Suwon trip',exact:true}).click();
 for(const [i,id,anchor] of [[0,'suwon-002','hg-missions'],[1,'suwon-001','hw-missions'],[2,'suwon-003','bg-missions']]){
  await expect(shell(page).locator('li').nth(i).getByRole('link',{name:'View card',exact:true})).toHaveAttribute('href','/t/'+id);
  await expect(shell(page).locator('li').nth(i).getByRole('link',{name:'Open mission',exact:true})).toHaveAttribute('href','/t/'+id+'#'+anchor);
 }
 expect(await page.evaluate(()=>localStorage.getItem('koreaRouteCardCollection'))).toBeNull();
 // Local http-server lacks Vercel rewrites; serve the unchanged NFC document at its existing URL.
 await page.route('**/t/suwon-002',async route=>{const response=await route.fetch({url:new URL('/nfc-card.html',page.url()).href});await route.fulfill({response});});
 await shell(page).locator('li').first().getByRole('link',{name:'View card',exact:true}).click();
 await expect(page.locator('#hg-collection')).toContainText('SUWON COLLECTION 1/3');
 expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('koreaRouteCardCollection')).map(c=>c.id))).toEqual(['suwon-002']);
 await page.goBack();await expect(shell(page).locator('li').first()).toContainText('Collected');
});
