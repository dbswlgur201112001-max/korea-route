const {test,expect}=require('@playwright/test');
test.use({serviceWorkers:'block'});
const trip=(date='2026-09-27',days=3)=>({start:'Seoul',dest:'Suwon',date,days,travelers:2,time:'09:00',style:'balanced'});
const place=(key)=>({key,city:'Suwon',en:'Place '+key,ko:'장소 '+key,ja:'場所 '+key,lat:37.28,lng:127.01});
async function seed(page,places,plan,route=trip()){
  await page.evaluate(({places,plan,route})=>{
    sessionStorage.setItem('koreaRouteSavedPlaces',JSON.stringify(places));
    sessionStorage.setItem('koreaRouteSavedPlacePlan',JSON.stringify(plan));
    if(route){sessionStorage.setItem('koreaRouteTrip',JSON.stringify(route));localStorage.setItem('koreaRouteSavedTrip',JSON.stringify(route));}
    else{sessionStorage.removeItem('koreaRouteTrip');localStorage.removeItem('koreaRouteSavedTrip');}
    renderHomeTripSummary();
  },{places,plan,route});
}
test.beforeEach(async({page})=>{
  await page.clock.setFixedTime(new Date('2026-09-27T03:00:00Z'));
  await page.goto('/');await page.getByRole('button',{name:'Got it',exact:true}).click();
});
test('only explicit numeric day assignments and eligible Intelligence states',async({page})=>{
  const items=['a','b','c','missing','zero','high','fraction','string','negative','noentry','noday'].map(place);
  items.push({en:'No key'},null);
  const plan={a:{day:1},b:{day:2},c:{day:3},zero:{day:0},high:{day:11},fraction:{day:1.5},string:{day:'1'},negative:{day:-1},noday:{order:0},ghost:{day:1}};
  for(const [route,expected] of [[trip(),['a']],[trip('2026-09-26'),['b']],[trip('2026-09-25'),['c']],[trip('2026-09-28'),null],[trip('2026-09-23'),null],[null,null]]){
    // The reader tolerates malformed entries without involving unrelated legacy renderers.
    await page.evaluate(({items,plan,route})=>{
      sessionStorage.setItem('koreaRouteSavedPlaces',JSON.stringify(items));sessionStorage.setItem('koreaRouteSavedPlacePlan',JSON.stringify(plan));
      if(route){sessionStorage.setItem('koreaRouteTrip',JSON.stringify(route));localStorage.setItem('koreaRouteSavedTrip',JSON.stringify(route));}
      else{sessionStorage.removeItem('koreaRouteTrip');localStorage.removeItem('koreaRouteSavedTrip');}
      renderHomeTodayPlaces();
    },{items,plan,route});
    if(expected)await expect(page.locator('#todayAssignedPlaces [data-saved-key]')).toHaveText(expected.map(k=>'Place '+k));
    else{await expect(page.locator('#todayAssignedPlaces')).toBeHidden();await expect(page.locator('#todayAssignedPlaces')).toHaveText('');}
  }
});
test('valid order sorts only its slots; invalid order retains original position',async({page})=>{
  await seed(page,['a','b','c','d','e'].map(place),{a:{day:1,order:4},b:{day:1,order:'0'},c:{day:1,order:0},d:{day:1,order:-1},e:{day:1}});
  expect(await page.evaluate(()=>readHomeTodayPlaces(1).map(p=>p.key))).toEqual(['c','b','a','d','e']);
  await expect(page.locator('#todayAssignedPlaces [data-saved-key]')).toHaveText(['Place c','Place b','Place a']);
  await expect(page.locator('#todayAssignedPlaces').getByRole('button',{name:'+2 more',exact:true})).toBeVisible();
  await page.locator('#todayAssignedPlaces').getByRole('button',{name:'+2 more',exact:true}).click();
  await expect(page.locator('#myTripHub')).toHaveClass(/active/);
});
test('rendering never writes storage or calls plan normalizers, including malformed inputs',async({page})=>{
  const result=await page.evaluate(()=>{
    sessionStorage.setItem('koreaRouteTrip',JSON.stringify({start:'Seoul',dest:'Suwon',date:'2026-09-27',days:3}));
    localStorage.setItem('koreaRouteSavedTrip',sessionStorage.getItem('koreaRouteTrip'));
    const original=Storage.prototype.setItem,remove=Storage.prototype.removeItem,clear=Storage.prototype.clear;
    const banned=[syncSavedPlacePlan,savedPlacePlanGroups,dayRoutePlaces];let writes=0,calls=0;
    syncSavedPlacePlan=savedPlacePlanGroups=dayRoutePlaces=()=>{calls++;throw Error('Forbidden normalization');};
    const results=[];
    try{
      for(const [places,plan] of [['[]','{}'],['[{"key":"a","en":"A"}]','{"a":{"day":1}}'],['[{"key":"a","en":"A"}]','{"a":{"day":"1"}}'],['null','{}'],['{}','[]'],['[null,{}]','null'],['[','{'],['[]','{"ghost":{"day":1}}']]){
        original.call(sessionStorage,'koreaRouteSavedPlaces',places);original.call(sessionStorage,'koreaRouteSavedPlacePlan',plan);
        const before=JSON.stringify([Object.entries(sessionStorage),Object.entries(localStorage)]);
        Storage.prototype.setItem=Storage.prototype.removeItem=Storage.prototype.clear=()=>{writes++;throw Error('Storage write');};
        renderHomeTodayPlaces();readHomeTodayPlaces(1);
        results.push(before===JSON.stringify([Object.entries(sessionStorage),Object.entries(localStorage)]));
      }
    }finally{Storage.prototype.setItem=original;Storage.prototype.removeItem=remove;Storage.prototype.clear=clear;[syncSavedPlacePlan,savedPlacePlanGroups,dayRoutePlaces]=banned;}
    return {results,writes,calls};
  });
  expect(result.writes).toBe(0);expect(result.calls).toBe(0);expect(result.results.every(Boolean)).toBe(true);
});
for(const width of [360,390])test(width+'px locales, empty state, stored names and existing UI',async({page})=>{
  await page.setViewportSize({width,height:844});
  const items=['a','b','c','d'].map(place);delete items[1].ja;
  await seed(page,items,Object.fromEntries(items.map((p,i)=>[p.key,{day:1,order:i}])));
  const section=page.locator('#todayAssignedPlaces');
  for(const [title,more,empty,button,names] of [
    ['Places assigned to Day 1','+1 more','No places assigned to Day 1','Open My Trip',['Place a','Place b','Place c']],
    ['1일차에 지정한 장소','+1곳 더보기','1일차에 지정된 장소가 없어요','내 여행 열기',['장소 a','장소 b','장소 c']],
    ['1日目に設定した場所','あと1か所','1日目に設定された場所はありません','マイ旅行を開く',['場所 a','Place b','場所 c']]
  ]){
    await expect(section.locator('h3')).toHaveText(title);await expect(section.locator('[data-saved-key]')).toHaveText(names);
    await expect(section.getByRole('button',{name:more,exact:true})).toBeVisible();
    if(title.startsWith('1日')){await expect(section.locator('h3')).not.toContainText(/Places assigned|No places assigned|more|Open My Trip|Day/);}
    await seed(page,items,{});await expect(section.locator('h3')).toHaveText(empty);await expect(section.getByRole('button',{name:button,exact:true})).toBeVisible();
    for(const id of ['todayTripSummary','globalSearchBox','nearbyEssentials'])await expect(page.locator('#'+id)).toBeVisible();
    await expect(page.locator('#todayTripSummary .today-plan-status')).toHaveAttribute('data-plan-state','IN_TRIP');
    await expect(page.locator('#home .v220-core-card')).toHaveCount(4);await expect(page.locator('#v60Tabbar button')).toHaveCount(4);
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth)).toBe(true);
    await seed(page,items,Object.fromEntries(items.map((p,i)=>[p.key,{day:1,order:i}])));await page.locator('#langBtn').click();
  }
  await seed(page,items,{});await section.getByRole('button',{name:'Open My Trip',exact:true}).click();await expect(page.locator('#myTripHub')).toHaveClass(/active/);
});
test('approved My Trip fallback and Today return reflect exact-key reassignment',async({page})=>{
  const key="Suwon::A' & <B> %";
  await seed(page,[place(key)],{[key]:{day:1,order:0}});
  await expect(page.locator('#todayAssignedPlaces [data-saved-key]')).toHaveAttribute('data-saved-key',key);
  await page.locator('#todayAssignedPlaces [data-saved-key]').click();
  await expect(page.locator('#myTripHub')).toHaveClass(/active/);
  await page.evaluate(key=>setSavedPlaceDay(key,2),key);
  await page.locator('#v60Tabbar').getByRole('button',{name:'Today',exact:true}).click();
  await expect(page.locator('#todayAssignedPlaces')).toContainText('No places assigned to Day 1');
  await page.clock.setFixedTime(new Date('2026-09-28T03:00:00Z'));
  await page.locator('#v60Tabbar').getByRole('button',{name:'My Trip',exact:true}).click();
  await page.locator('#v60Tabbar').getByRole('button',{name:'Today',exact:true}).click();
  await expect(page.locator('#todayAssignedPlaces [data-saved-key]')).toHaveText('Place '+key);
});
