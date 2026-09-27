const {test,expect}=require('@playwright/test');
test.use({serviceWorkers:'block'});
const place=key=>({key,city:'Suwon',en:'Place '+key,ko:'장소 '+key,ja:'場所 '+key,lat:37.28,lng:127.01});
async function seed(page,plan={}){await page.evaluate(({items,plan})=>{sessionStorage.setItem('koreaRouteSavedPlaces',JSON.stringify(items));sessionStorage.setItem('koreaRouteSavedPlacePlan',JSON.stringify(plan));const raw=JSON.stringify({start:'Seoul',dest:'Suwon',date:'2026-09-27',days:3});sessionStorage.setItem('koreaRouteTrip',raw);localStorage.setItem('koreaRouteSavedTrip',raw);go('myTripHub');renderSavedPlacesInMyTrip();},{items:['a','b','c'].map(place),plan});}
test.beforeEach(async({page})=>{await page.clock.setFixedTime(new Date('2026-09-27T03:00:00Z'));await page.goto('/');await page.getByRole('button',{name:'Got it',exact:true}).click();});
for(const width of [360,390])test(width+'px unassigned remains read-only, explicit selection updates Today and routes',async({page})=>{
 await page.setViewportSize({width,height:844});await seed(page,{c:{day:1,order:7}});
 const group=page.locator('.saved-unassigned');await expect(group).toContainText('Unassigned');await expect(group.locator('select')).toHaveCount(2);await expect(group.getByRole('button',{name:/Open route|Copy list/})).toHaveCount(0);
 const result=await page.evaluate(()=>{const before=sessionStorage.getItem('koreaRouteSavedPlacePlan');let writes=0;const old=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){if(k==='koreaRouteSavedPlacePlan')writes++;return old.call(this,k,v);};try{renderSavedPlacesInMyTrip();savedPlacePlanGroups(savedPlaces());buildMyTripShareText();buildPrintableTripHtml();return {before,after:sessionStorage.getItem('koreaRouteSavedPlacePlan'),writes,route:dayRoutePlaces(1).map(p=>p.key),legacy:myTripTodayFirstDayPlaces().map(p=>p.key),today:readHomeTodayPlaces(1).map(p=>p.key)};}finally{Storage.prototype.setItem=old;}});
 expect(result.writes).toBe(0);expect(result.after).toBe(result.before);expect(result.route).toEqual(['c']);expect(result.legacy).toEqual(['c']);expect(result.today).toEqual(['c']);
 await group.locator('select').first().selectOption('1');expect(await page.evaluate(()=>savedPlacePlan())).toEqual({a:{day:1,order:8},c:{day:1,order:7}});
 await page.getByRole('button',{name:'Today',exact:true}).click();await expect(page.locator('#todayAssignedPlaces')).toContainText('Place a');
 await page.getByRole('button',{name:'My Trip',exact:true}).click();await page.locator('#myTripSavedPlaces .saved-place-row').filter({hasText:'Place a'}).locator('select').selectOption('2');
 expect(await page.evaluate(()=>({day1:dayRoutePlaces(1).map(p=>p.key),day2:dayRoutePlaces(2).map(p=>p.key),today:readHomeTodayPlaces(1).map(p=>p.key)}))).toEqual({day1:['c'],day2:['a'],today:['c']});
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
test('absent plan stays absent; invalid days stay unassigned; localized choose-day and share/print',async({page})=>{
 await seed(page);await page.evaluate(()=>sessionStorage.removeItem('koreaRouteSavedPlacePlan'));
 for(const [language,title,choose] of [['en','Unassigned','Choose day'],['ko','일차 미지정','일차 선택'],['ja','日程未設定','日程を選択']]){
  const out=await page.evaluate(language=>{lang=language;renderSavedPlacesInMyTrip();return {raw:sessionStorage.getItem('koreaRouteSavedPlacePlan'),share:buildMyTripShareText(),print:buildPrintableTripHtml(),legacy:myTripTodayFirstDayPlaces()};},language);
  expect(out.raw).toBeNull();expect(out.share).toContain(title);expect(out.print).toContain(title);expect(out.print).not.toContain('No saved places');expect(out.share).toContain(language==='ja'?'場所 a':language==='ko'?'장소 a':'Place a');expect(out.legacy).toEqual([]);
  await expect(page.locator('.saved-unassigned')).toContainText(title);await expect(page.locator('.saved-unassigned label').first()).toContainText(choose);
 }
 for(const day of [0,11,1.5,'1',null]){expect(await page.evaluate(day=>{sessionStorage.setItem('koreaRouteSavedPlacePlan',JSON.stringify({a:{day}}));return savedPlacePlanGroups(savedPlaces()).unassigned.length;},day)).toBe(3);}
 for(const day of [0,11,1.5,'',null]){expect(await page.evaluate(day=>{sessionStorage.setItem('koreaRouteSavedPlacePlan','{}');setSavedPlaceDay('a',day);return savedPlacePlan();},day)).toEqual({});}
});
test('Explore Save only, remove cleanup, and explicit bulk assign',async({page})=>{
 await page.evaluate(()=>{openCity('Suwon');});
 const save=page.locator('#city .poi-save-btn').first();await save.click();
 expect(await page.evaluate(()=>savedPlaces().length)).toBeGreaterThan(0);expect(await page.evaluate(()=>savedPlacePlan())).toEqual({});
 await page.evaluate(()=>{assignVisibleExplorePlacesToDay(2);});
 const result=await page.evaluate(()=>({items:savedPlaces(),plan:savedPlacePlan(),visible:visibleExplorePoiEntries().map(({city,poi})=>placeSaveKey(city,poi))}));
 expect(result.visible.length).toBeGreaterThan(0);for(const key of result.visible)expect(result.plan[key].day).toBe(2);
 await seed(page,{a:{day:1,order:0}});await page.evaluate(()=>removeSavedPlace(0));expect(await page.evaluate(()=>savedPlacePlan())).toEqual({});expect(await page.evaluate(()=>savedPlaces().map(p=>p.key))).toEqual(['b','c']);
});
test('recommendation explicit day and legacy day/order survive sync without synthesis',async({page})=>{
 await seed(page,{a:{day:1,order:0},b:{day:2},ghost:{day:1,order:4}});
 expect(await page.evaluate(()=>syncSavedPlacePlan())).toEqual({a:{day:1,order:0},b:{day:2}});
 const result=await page.evaluate(()=>{const p={en:'Recommendation',ko:'추천',lat:37.2,lng:127.0};v38AddRecommendation('Suwon',p,2);return {key:v38RecommendationKey('Suwon',p),plan:savedPlacePlan()};});
 expect(result.plan[result.key].day).toBe(2);expect(result.plan.a).toEqual({day:1,order:0});expect(result.plan.c).toBeUndefined();
});

test('reordering explicit Day 1 excludes unassigned and preserves missing order',async({page})=>{
 await seed(page,{a:{day:1,order:0},c:{day:1,order:1}});
 await page.evaluate(()=>moveSavedPlace('a',1));
 expect(await page.evaluate(()=>savedPlacePlan())).toEqual({a:{day:1,order:1},c:{day:1,order:0}});
 expect(await page.evaluate(()=>dayRoutePlaces(1).map(p=>p.key))).toEqual(['c','a']);
});
