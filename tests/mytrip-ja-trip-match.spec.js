const {test,expect}=require('@playwright/test');
test.use({serviceWorkers:'block',timezoneId:'Asia/Seoul'});
async function setup(page){
 await page.clock.setFixedTime(new Date('2026-09-28T03:00:00Z'));
 await page.goto('/');await page.getByRole('button',{name:'Got it',exact:true}).click();
 await page.evaluate(()=>{
  document.getElementById('dest').value='Suwon';document.getElementById('tripDate').value='2026-09-28';document.getElementById('days').value='4';
  const trip={start:'Seoul',dest:'Suwon',date:'2026-09-28',days:4,time:'09:00',style:'balanced'};
  sessionStorage.setItem('koreaRouteTrip',JSON.stringify(trip));localStorage.setItem('koreaRouteSavedTrip',JSON.stringify(trip));
  const e=V140_OFFICIAL_EVENTS.Suwon.events.find(e=>v147EventOverlapsWindow(e,{start:trip.date,end:'2026-10-01'}));
  v141ToggleEvent('Suwon',encodeURIComponent(v141EventId('Suwon',e)));v60OpenTripOverview();
 });
 await expect(page.locator('#v140MyTripEvents')).toBeVisible();
}
const english=/TRIP MATCH|What's on in|Suggested Day|Show on map|Saved to My Trip|Add to My Trip|MATCHES THIS TRIP|MATCHES TRIP DATES|OUTSIDE TRIP DATES|YOUR DATES|UP NEXT|Events saved to My Trip|Official Suwon events|Suwon festival guide|VISITKOREA English|Source checks|Recheck this event|Based on published/;
for(const width of [360,390])test(width+'px final runtime JA events, EN/KO preservation and read-only render',async({page})=>{
 await page.setViewportSize({width,height:844});await setup(page);
 const box=page.locator('#v140MyTripEvents');await expect(box).toContainText('TRIP MATCH');await expect(box).toContainText('Show on map');await expect(box).toContainText('Events saved to My Trip');
 await page.getByRole('button',{name:'EN / 한국어 / 日本語',exact:true}).click();await expect(box).toContainText('지도에서 보기');await expect(box).toContainText('My Trip에 저장한 행사');
 await page.getByRole('button',{name:'한국어 / 日本語 / EN',exact:true}).click();await expect(box).toContainText('旅行マッチ');await expect(box).toContainText('水原のイベント');await expect(box).toContainText('おすすめ 1日目');await expect(box).toContainText('✓ My Tripに保存済み');await expect(box).toContainText('＋ My Tripに追加');await expect(box).toContainText('旅行日程内');await expect(box).toContainText('水原市公式イベント');await expect(box).not.toContainText(english);
 const result=await page.evaluate(()=>{
  const raw=()=>JSON.stringify([Object.entries(localStorage).sort(),Object.entries(sessionStorage).sort()]);const before=raw(),write=Storage.prototype.setItem,remove=Storage.prototype.removeItem,clear=Storage.prototype.clear;let writes=0;
  Storage.prototype.setItem=Storage.prototype.removeItem=Storage.prototype.clear=()=>{writes++;throw Error('unexpected write');};
  const attributes=html=>{const t=document.createElement('template');t.innerHTML=html;return [...t.content.querySelectorAll('.v140-event-actions button,.v142-saved-actions button')].map(el=>[el.tagName,[...el.attributes].map(a=>[a.name,a.value])]);};
  let en,ja;
  try{lang='en';en=v140EventsHtml('Suwon','trip');lang='ja';ja=v140EventsHtml('Suwon','trip');v140RenderLocalEvents();}finally{Storage.prototype.setItem=write;Storage.prototype.removeItem=remove;Storage.prototype.clear=clear;}
  return {before,after:raw(),writes,en:attributes(en),ja:attributes(ja)};
 });
 expect(result.after).toBe(result.before);expect(result.writes).toBe(0);expect(result.ja).toEqual(result.en);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
test('upcoming, empty feed and saved outside/past states are Japanese in final overrides',async({page})=>{
 await setup(page);
 const outputs=await page.evaluate(()=>{
  lang='ja';const items=v141LoadSavedEvents(),item=items[0];
  v141SaveEvents([item,{...item,id:'qa-outside',key:'qa-outside',nameEn:'QA outside',start:'2026-12-01',end:'2026-12-02'},{...item,id:'qa-past',key:'qa-past',nameEn:'QA past',start:'2025-01-01',end:'2025-01-02'}]);
  const saved=v141SavedEventsHtml();
  const route={start:'Seoul',dest:'Suwon',date:'2026-01-01',days:1};sessionStorage.setItem('koreaRouteTrip',JSON.stringify(route));localStorage.setItem('koreaRouteSavedTrip',JSON.stringify(route));
  document.getElementById('tripDate').value='2026-01-01';document.getElementById('days').value='1';
  const next=v140EventsHtml('Suwon','trip'),missing=v140EventsHtml('Andong','trip');
  return {saved,next,missing};
 });
 expect(outputs.saved).toContain('旅行日程外');expect(outputs.saved).toContain('終了したイベント');expect(outputs.next).toContain('次のイベント');expect(outputs.next).not.toMatch(english);expect(outputs.missing).toContain('地域イベント情報はまだ接続されていません');
});
test('connected-city notes and no trip-scope localization leak to Explore',async({page})=>{
 await setup(page);const result=await page.evaluate(()=>{
  lang='ja';return ['Seoul','Suwon','Busan','Gyeongju','Jeju'].map(city=>{
   const t=document.createElement('template');t.innerHTML=v140EventsHtml(city,'trip');
   return {city,notes:[...t.content.querySelectorAll('.v147-event-note')].map(n=>n.textContent),chrome:[...t.content.querySelectorAll('.v140-events-actions button')].map(n=>n.textContent),explore:v140EventsHtml(city,'city').includes('CITY NOW')};
  });
 });for(const r of result){expect(r.explore).toBe(true);for(const n of r.notes)expect(n).toMatch(/[ぁ-んァ-ヶ一-龯]/);expect(r.chrome.join(' ')).not.toMatch(/Official|festival guide|English|Korean source/);}
});
