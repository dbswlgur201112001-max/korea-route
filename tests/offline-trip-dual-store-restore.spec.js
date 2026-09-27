const {test,expect}=require('@playwright/test');
test.use({serviceWorkers:'block'});
const trip=days=>({start:'Seoul',dest:'Suwon',date:'2026-09-27',days,time:'10:15',style:'balanced',travelers:'2'});
const raw3=JSON.stringify(trip('3'),null,2);
const raw4=JSON.stringify(trip('4'));
const budget=JSON.stringify({city:'Suwon',style:'balanced',days:3,people:2,total:300000});
const ledger=JSON.stringify({version:1,records:[{id:'11111111-1111-4111-8111-111111111111',storeName:'QA',purchaseDate:'2026-09-27',amountKrw:24000,note:'',createdAt:'2026-09-27T01:00:00Z',updatedAt:'2026-09-27T01:00:00Z',refund:{status:'REFUND_RECEIVED'}}]});
async function start(page){
  await page.clock.install({time:new Date('2026-09-27T03:00:00Z')});
  await page.goto('/');await page.getByRole('button',{name:'Got it',exact:true}).click();
}
async function stores(page){return page.evaluate(()=>({session:sessionStorage.getItem('koreaRouteTrip'),local:localStorage.getItem('koreaRouteSavedTrip'),state:homeTripIntelligence()}));}
async function fixture(page,data){await page.evaluate(({data,raw4})=>{
  sessionStorage.setItem('koreaRouteTrip',raw4);localStorage.setItem('koreaRouteSavedTrip',raw4);koreaRoutePersistSessionState();
  localStorage.setItem('koreaRouteOfflineTrip',JSON.stringify({version:1,savedAt:'2026-09-27T03:00:00Z',data}));
},{data,raw4});}
for(const width of [360,390])test(`valid raw trip restores both stores and real Day at ${width}px, including reload`,async({page})=>{
  await page.setViewportSize({width,height:844});await start(page);
  await page.getByRole('button',{name:'My Trip',exact:true}).click();
  await fixture(page,{koreaRouteTrip:raw3,koreaRouteWallet:budget});
  await page.getByRole('button',{name:'Restore copy',exact:true}).click();
  expect(await stores(page)).toMatchObject({session:raw3,local:raw3,state:{state:'IN_TRIP',day:1,days:3}});
  expect(await page.evaluate(()=>sessionStorage.getItem('koreaRouteWallet'))).toBe(budget);
  await page.reload();expect(await stores(page)).toMatchObject({session:raw3,local:raw3,state:{state:'IN_TRIP',day:1}});
  await expect(page.locator('#todayTripSummary')).toContainText('Day 1 of 3');
  await expect(page.locator('#todayTripSummary')).not.toContainText('Trip dates not confirmed');
});
test('missing trip removes both stores and cannot resurrect from the old automatic backup',async({page,context})=>{
  await start(page);await fixture(page,{koreaRouteWallet:budget});
  await page.evaluate(()=>restoreOfflineTripSnapshot());
  expect(await stores(page)).toMatchObject({session:null,local:null,state:{state:'NO_DATES'}});
  expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('koreaRouteAutoPersist')).data.koreaRouteTrip)).toBeUndefined();
  await page.reload();expect(await stores(page)).toMatchObject({session:null,local:null});
  const other=await context.newPage();await other.goto('/');expect(await stores(other)).toMatchObject({session:null,local:null});await other.close();
});
test('invalid snapshot trip preserves both raw originals while restoring other valid data',async({page})=>{
  await start(page);
  const invalid=['{broken','null','[]','{}','',null,trip(3),...[
    {days:0},{days:11},{days:'03'},{days:true},{date:'2026-02-30'},{date:'20260927'},{start:''},{dest:''}
  ].map(patch=>JSON.stringify({...trip(3),...patch}))];
  for(const value of invalid){
    await fixture(page,{koreaRouteTrip:value,koreaRouteWallet:budget});
    await page.evaluate(()=>{sessionStorage.setItem('koreaRouteMoveVerify','old');restoreOfflineTripSnapshot();});
    expect(await stores(page)).toMatchObject({session:raw4,local:raw4,state:{state:'IN_TRIP',days:4}});
    expect(await page.evaluate(()=>sessionStorage.getItem('koreaRouteWallet'))).toBe(budget);
    expect(await page.evaluate(()=>sessionStorage.getItem('koreaRouteMoveVerify'))).toBeNull();
  }
});
test('ledger missing/invalid/valid/empty policies and other session restore semantics are unchanged',async({page})=>{
  await start(page);
  const replacement=JSON.stringify({version:1,records:[{...JSON.parse(ledger).records[0],amountKrw:35000}]}),empty=JSON.stringify({version:1,records:[]});
  for(const value of [undefined,'{invalid',JSON.stringify({version:2,records:[]}),replacement,empty]){
    const data={koreaRouteTrip:raw3,koreaRouteWallet:budget,koreaRouteStayArea:'existing raw stay'};
    if(value!==undefined)data.koreaRouteExpenseLedger=value;
    await fixture(page,data);
    await page.evaluate(ledger=>{localStorage.setItem('koreaRouteExpenseLedger',ledger);sessionStorage.setItem('koreaRouteMoveVerify','remove me');restoreOfflineTripSnapshot();},ledger);
    expect(await page.evaluate(()=>localStorage.getItem('koreaRouteExpenseLedger'))).toBe(value===replacement||value===empty?value:ledger);
    expect(await stores(page)).toMatchObject({session:raw3,local:raw3});
    expect(await page.evaluate(()=>sessionStorage.getItem('koreaRouteWallet'))).toBe(budget);
    expect(await page.evaluate(()=>sessionStorage.getItem('koreaRouteStayArea'))).toBe('existing raw stay');
    expect(await page.evaluate(()=>sessionStorage.getItem('koreaRouteMoveVerify'))).toBeNull();
    expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('koreaRouteAutoPersist')).data.koreaRouteExpenseLedger)).toBeUndefined();
  }
});
test('REG-003 creation, UI snapshot restore after changing duration, and reload retain one trip',async({page})=>{
  await start(page);await page.getByRole('button',{name:'My Trip',exact:true}).click();
  await page.getByRole('button',{name:'Add a plan',exact:false}).click();
  await page.locator('#dest').selectOption('Suwon');await page.locator('#days').fill('3');await page.locator('#tripDate').fill('2026-09-27');
  await page.getByRole('button',{name:'Create My Trip',exact:false}).click();
  await page.getByRole('button',{name:'My Trip',exact:true}).click();
  await expect(page.locator('#myTripHub')).toContainText('Seoul → Suwon');
  await page.reload();expect((await stores(page)).session).toBe((await stores(page)).local);
  await expect(page.locator('#todayTripSummary')).toContainText('Day 1 of 3');
  await page.getByRole('button',{name:'My Trip',exact:true}).click();
  // Keep the saved copy stable across UI actions, before the normal autosave debounce.
  await page.clock.pauseAt(new Date('2026-09-27T03:01:00Z'));
  await page.getByRole('button',{name:/^(Save|Update) offline copy$/}).click();
  await page.getByRole('button',{name:'🗓️ Plan',exact:true}).click();await page.clock.runFor(100);
  await page.getByRole('button',{name:'Open Plan',exact:true}).click();await page.clock.runFor(100);
  await page.locator('#days').fill('4');await page.getByRole('button',{name:'Create My Trip',exact:false}).click();await page.clock.runFor(100);
  expect(JSON.parse((await stores(page)).local).days).toBe('4');
  await page.getByRole('button',{name:'My Trip',exact:true}).click();await page.clock.runFor(100);
  await page.getByRole('button',{name:'Restore copy',exact:true}).click();
  const restored=await stores(page);expect(restored.session).toBe(restored.local);expect(restored.state).toMatchObject({state:'IN_TRIP',days:3});
  await page.clock.resume();await page.reload();expect((await stores(page)).state).toMatchObject({state:'IN_TRIP',days:3});
  await expect(page.locator('#todayTripSummary')).toContainText('Seoul → Suwon');
});
