const {test,expect}=require('@playwright/test');
test.use({serviceWorkers:'block'});
async function setup(page,count=1){
 await page.goto('/');const tips=page.getByRole('button',{name:'Got it',exact:true});if(await tips.isVisible())await tips.click();
 await page.evaluate(count=>{
  const places=Array.from({length:count},(_,i)=>({key:'qa'+i,city:'Suwon',en:'QA place '+i,ko:'시험 장소 '+i,ja:'確認場所 '+i,lat:37.28,lng:127.01}));
  sessionStorage.setItem('koreaRouteSavedPlaces',JSON.stringify(places));sessionStorage.setItem('koreaRouteSavedPlacePlan',JSON.stringify(Object.fromEntries(places.map((p,i)=>[p.key,{day:1,order:i}]))));
  sessionStorage.setItem('koreaRouteTripChecklist','{"passport":true}');
  v60OpenTripOverview();
 },count);
}
for(const width of [360,390])test(width+'px Japanese My Trip cards and print/share retain storage',async({page})=>{
 await page.setViewportSize({width,height:844});await setup(page);
 const result=await page.evaluate(()=>{
  const keys=['koreaRouteTrip','koreaRouteSavedTrip','koreaRouteSavedPlaces','koreaRouteSavedPlacePlan','koreaRouteWallet','koreaRouteExpenseLedger','koreaRouteOfflineTrip','koreaRouteAutoPersist','koreaRouteTripChecklist'];
  const raw=()=>keys.map(k=>[k,sessionStorage.getItem(k),localStorage.getItem(k)]);
  const before=raw();const writes=[];const original=Storage.prototype.setItem;
  Storage.prototype.setItem=function(k,v){writes.push(k);return original.call(this,k,v)};
  try{for(const locale of ['en','ko','ja']){lang=locale;renderSavedPlacesInMyTrip();renderMyTripChecklist();renderMyTripEmergencyCard();}}
  finally{Storage.prototype.setItem=original;}
  return {before,after:raw(),writes,print:buildPrintableTripHtml(),share:buildMyTripShareText()};
 });
 expect(result.after).toEqual(result.before);expect(result.writes).toEqual([]);
 const today=page.locator('#myTripTodayCard');
 await expect(today).toContainText('今必要な情報');await expect(today).toContainText('1日目の場所');await expect(today).toContainText('今日のルートを見る');
 await expect(today).not.toContainText(/What you need now|Day 1 places|Checklist|Visited|More|About this card/);
 const checklist=page.locator('#myTripChecklist');await expect(checklist).toContainText('出発前のチェック');
 await expect(checklist.locator('.trip-check-item span')).toHaveText(['パスポート・身分証明書','海外対応カードと予備の支払い手段','交通カードの準備','eSIM・ローミング','宿泊先の住所を保存','空港への移動手段を確認']);
 await expect(checklist).not.toContainText('Before you go');
 const unified=page.locator('#myTripUnifiedItinerary');await expect(unified).toContainText('旅程一覧');await expect(unified).toContainText('旅行をひと目で確認');await expect(unified).toContainText('1か所');await expect(unified).not.toContainText(/Choose a route|Choose a stay|Build a budget|Your trip/);
 const saved=page.locator('#myTripSavedPlaces');await expect(saved).toContainText('保存した場所 1か所');await expect(saved).toContainText('旅行を共有');await expect(saved).toContainText('印刷 / PDF');await expect(saved).not.toContainText(/Share trip|Print \/ PDF|Open route|Copy list|Remove|Map handoff/);
 expect(result.print).toContain('マイ旅行の予定');expect(result.print).not.toMatch(/No route selected|No stay selected|No budget set|Ambulance/);expect(result.share).toContain('マイ旅行');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
for(const count of [0,1,2])test('offline and unified count '+count+' EN/KO/JA',async({page})=>{
 await setup(page,count);await page.locator('#myTripOfflineSnapshot').getByRole('button',{name:'Save offline copy',exact:true}).click();
 for(const [locale,label] of [['en',count===1?'1 place':count+' places'],['ko',count+'곳'],['ja',count+'か所']]){
  await page.evaluate(locale=>{lang=locale;renderSavedPlacesInMyTrip();},locale);
  await expect(page.locator('#myTripOfflineSnapshot .offline-trip-badge')).toHaveText(label);
  await expect(page.locator('#myTripUnifiedItinerary .unified-itinerary-count')).toHaveText(label);
  if(count)await expect(page.locator('#myTripUnifiedItinerary .unified-day-chip span')).toHaveText(label);
 }
});
test('Japanese empty state and Today core labels',async({page})=>{
 await setup(page,0);await page.evaluate(()=>{lang='ja';renderSavedPlacesInMyTrip();});
 await expect(page.locator('#myTripTodayCard')).toContainText('保存された予定はまだありません');await expect(page.locator('#myTripTodayCard')).toContainText('+ 予定を追加');await expect(page.locator('#myTripSavedPlaces')).toContainText('旅行リストを作りましょう');
 await page.evaluate(()=>{sessionStorage.setItem('koreaRouteTrip',JSON.stringify({start:'Seoul',dest:'Suwon'}));sessionStorage.setItem('koreaRouteStayArea',JSON.stringify({area:'Suwon'}));sessionStorage.setItem('koreaRouteWallet',JSON.stringify({total:12000}));renderMyTripTodayCard();});
 await expect(page.locator('#myTripTodayCard')).toContainText('移動');await expect(page.locator('#myTripTodayCard')).toContainText('予算');await expect(page.locator('#myTripTodayCard')).toContainText('宿泊');
});
