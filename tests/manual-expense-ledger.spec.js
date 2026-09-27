const {test,expect}=require('@playwright/test');
test.use({serviceWorkers:'block',timezoneId:'America/Los_Angeles'});
const KEY='koreaRouteExpenseLedger';
const sample=(id='11111111-1111-4111-8111-111111111111',storeName='Other')=>({id,storeName,purchaseDate:'2026-09-26',amountKrw:100,note:'',createdAt:'2026-09-26T01:00:00.000Z',updatedAt:'2026-09-26T01:00:00.000Z'});
async function start(page){
  await page.clock.install({time:new Date('2026-09-26T16:00:00Z')}); // Sep 27 in KST, Sep 26 in browser timezone.
  await page.goto('/');await page.getByRole('button',{name:'Got it',exact:true}).click();
  await page.getByRole('button',{name:'Wallet',exact:true}).click();
  await expect(page.locator('#expenseLedgerSection')).toBeVisible();
}
async function fill(page,{storeName='Shop',purchaseDate='2026-09-27',amountKrw='12000',note=''}={}){
  const form=page.locator('#expenseLedgerForm');
  for(const [name,value] of Object.entries({storeName,purchaseDate,amountKrw,note}))await form.locator(`[name="${name}"]`).fill(value);
}
async function submit(page){await page.locator('#expenseLedgerForm button[type=submit]').click();}
async function read(page){return page.evaluate(key=>JSON.parse(localStorage.getItem(key)),KEY);}
async function seed(page,records){await page.evaluate(({key,records})=>{localStorage.setItem(key,JSON.stringify({version:1,records}));renderExpenseLedger();},{key:KEY,records});}

for(const width of [360,390])test.describe(width+'px manual ledger',()=>{
  test.use({viewport:{width,height:844}});
  test('empty, add, total, edit, cancellation, reload and confirmed deletes preserve Budget',async({page})=>{
    await start(page);
    await expect(page.locator('#expenseLedgerList')).toHaveText('No expenses yet.');
    expect(await read(page)).toBeNull();
    const budget=JSON.stringify({city:'Suwon',style:'balanced',days:3,people:2,total:300000});
    await page.evaluate(budget=>sessionStorage.setItem('koreaRouteWallet',budget),budget);
    await fill(page,{storeName:'  First shop  '});await submit(page);
    await expect(page.locator('#expenseLedgerStatus')).toHaveText('Expense saved.');
    const first=(await read(page)).records[0];
    expect(first.storeName).toBe('First shop');expect(first.refund).toBeUndefined();expect(first.id).toMatch(/^[0-9a-f-]{36}$/);
    await fill(page,{storeName:'Second',amountKrw:'30000'});await submit(page);
    await expect(page.locator('#expenseLedgerCount')).toHaveText('2 purchases');await expect(page.locator('#expenseLedgerTotal')).toHaveText('₩42,000 total');
    const row=page.locator(`[data-expense-id="${first.id}"]`);
    await row.getByRole('button',{name:'Edit',exact:true}).click();
    await fill(page,{storeName:'Changed',amountKrw:'13000'});await page.clock.runFor(1000);await submit(page);
    let saved=await read(page);expect(saved.records[0]).toMatchObject({id:first.id,createdAt:first.createdAt,storeName:'Changed',amountKrw:13000});expect(saved.records[0].updatedAt).not.toBe(first.updatedAt);expect(saved.records[1].storeName).toBe('Second');
    await row.getByRole('button',{name:'Edit',exact:true}).click();await fill(page,{storeName:'Cancel me'});await page.getByRole('button',{name:'Cancel',exact:true}).click();expect(await read(page)).toEqual(saved);
    await page.reload();await page.getByRole('button',{name:'Wallet',exact:true}).click();await expect(page.locator('#expenseLedgerCount')).toHaveText('2 purchases');
    await expect(page.locator('#walletBudgetSetup')).toBeVisible();await expect(page.locator('#liveFxCard')).toBeVisible();await expect(page.getByRole('button',{name:'🛍️ Tax refund',exact:true})).toBeVisible();
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth)).toBe(true);
    page.once('dialog',d=>d.dismiss());await row.getByRole('button',{name:'Delete',exact:true}).click();expect(await read(page)).toEqual(saved);
    page.once('dialog',d=>d.accept());await row.getByRole('button',{name:'Delete',exact:true}).click();expect((await read(page)).records.map(r=>r.storeName)).toEqual(['Second']);
    page.once('dialog',d=>d.accept());await page.locator('#expenseLedgerList').getByRole('button',{name:'Delete',exact:true}).click();expect(await read(page)).toEqual({version:1,records:[]});
    expect(await page.evaluate(()=>sessionStorage.getItem('koreaRouteWallet'))).toBe(budget);
  });
  test('EN KO JA explicit labels, errors, user text and no overflow',async({page})=>{
    await start(page);const section=page.locator('#expenseLedgerSection');
    for(const [title,button,store,next] of [['Expenses','Add expense','Store name','EN / 한국어 / 日本語'],['지출 내역','구매 추가','상점명','한국어 / 日本語 / EN'],['支出記録','支出を追加','店舗名',null]]){
      await expect(section.locator('h2')).toHaveText(title);await expect(section.getByRole('button',{name:button,exact:true})).toBeVisible();await expect(section.getByLabel(store,{exact:true})).toBeVisible();
      await submit(page);await expect(section.locator('[role=status]')).not.toBeEmpty();
      expect(await page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth)).toBe(true);
      if(next)await page.locator('#walletHub .top button.pill').click();
    }
    await expect(section).not.toContainText(/Expenses|Add expense|Store name|Purchase date|Amount|Note|Edit|Delete|Save|Cancel|Total|No expenses|Could not save/);
    await fill(page,{storeName:'Save',note:'Cancel'});await submit(page);await page.clock.runFor(500);
    await expect(section.locator('article h3')).toHaveText('Save');await expect(section.locator('article')).toContainText('Cancel');
    await section.getByRole('button',{name:'編集',exact:true}).click();await expect(section.getByRole('button',{name:'変更を保存',exact:true})).toBeVisible();await expect(section.getByRole('button',{name:'キャンセル',exact:true})).toBeVisible();
    await page.locator('#walletHub .top button.pill').click();await expect(section.locator('h2')).toHaveText('Expenses');
  });
});

test('invalid input rejects all limits using KST today and writes nothing',async({page})=>{
  await start(page);
  for(const patch of [{storeName:''},{storeName:' '},{storeName:'a'.repeat(101)},{purchaseDate:'2026-09-28'},{purchaseDate:'1899-12-31'},
    {amountKrw:'0'},{amountKrw:'-1'},{amountKrw:'1.5'},{amountKrw:'1000000000'},{note:'a'.repeat(501)}]){
    await fill(page,patch);await submit(page);await expect(page.locator('#expenseLedgerStatus')).toContainText('Check the store');expect(await read(page)).toBeNull();
  }
  await fill(page);await page.locator('[name=purchaseDate]').evaluate(el=>{el.type='text';el.value='2026-02-30';});await submit(page);expect(await read(page)).toBeNull();
  await page.locator('[name=purchaseDate]').fill('2026-09-27');await submit(page);expect((await read(page)).records[0].purchaseDate).toBe('2026-09-27');
});

test('UUID unsupported/collision and quota errors do not write or show success; writer revalidates',async({page})=>{
  await start(page);await seed(page,[sample()]);const original=await read(page);await fill(page);
  await page.evaluate(()=>{window.originalUuid=crypto.randomUUID;Object.defineProperty(crypto,'randomUUID',{value:undefined,configurable:true});});
  await submit(page);await expect(page.locator('#expenseLedgerStatus')).toContainText('Could not save');expect(await read(page)).toEqual(original);
  await page.evaluate(id=>Object.defineProperty(crypto,'randomUUID',{value:()=>id,configurable:true}),sample().id);
  await submit(page);expect(await read(page)).toEqual(original);
  await page.evaluate(key=>{Object.defineProperty(crypto,'randomUUID',{value:window.originalUuid,configurable:true});window.originalSet=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){if(k===key)throw new DOMException('Quota','QuotaExceededError');return window.originalSet.call(this,k,v);};},KEY);
  await submit(page);await expect(page.locator('#expenseLedgerStatus')).toContainText('Could not save');expect(await read(page)).toEqual(original);
  expect(await page.evaluate(key=>{Storage.prototype.setItem=window.originalSet;return writeKoreaRouteExpenseLedger({version:2,records:[]},localStorage.getItem(key));},KEY)).toBe(false);
});

test('invalid stored data stays untouched and exposes only a safe error state',async({page})=>{
  await page.addInitScript(key=>localStorage.setItem(key,'{invalid'),KEY);await start(page);
  await expect(page.locator('#expenseLedgerStatus')).toContainText('Expense data could not be read');await expect(page.locator('#expenseLedgerForm')).toHaveCount(0);
  expect(await page.evaluate(key=>localStorage.getItem(key),KEY)).toBe('{invalid');await page.reload();expect(await page.evaluate(key=>localStorage.getItem(key),KEY)).toBe('{invalid');
});

test('XSS stays literal and display sorting never reorders saved records',async({page})=>{
  await start(page);const text='<script>alert(1)</script>';await fill(page,{storeName:text,note:'<img src=x onerror=alert(1)>'});let dialogs=0;page.on('dialog',d=>{dialogs++;d.dismiss();});await submit(page);
  await expect(page.locator('#expenseLedgerList h3')).toHaveText(text);await expect(page.locator('#expenseLedgerList script, #expenseLedgerList img')).toHaveCount(0);expect(dialogs).toBe(0);
  const older=sample(),newer={...sample('22222222-2222-4222-8222-222222222222','Newer'),purchaseDate:'2026-09-27'},sameDay={...sample('33333333-3333-4333-8333-333333333333','Latest'),purchaseDate:'2026-09-27',createdAt:'2026-09-27T01:00:00Z'};
  await seed(page,[older,newer,sameDay]);await expect(page.locator('#expenseLedgerList h3')).toHaveText(['Latest','Newer','Other']);expect((await read(page)).records).toEqual([older,newer,sameDay]);
});

test('canonical reread preserves external records and refund; missing/duplicate IDs cannot mutate',async({page})=>{
  await start(page);const original={...sample(),refund:{status:'CHECK_REQUIRED'}};await seed(page,[original]);await page.locator('#expenseLedgerList').getByRole('button',{name:'Edit',exact:true}).click();await fill(page,{storeName:'Edited'});
  const external=sample('22222222-2222-4222-8222-222222222222','External');
  await page.evaluate(({key,original,external})=>localStorage.setItem(key,JSON.stringify({version:1,records:[original,external]})),{key:KEY,original,external});await submit(page);
  expect((await read(page)).records[1]).toEqual(external);expect((await read(page)).records[0].refund).toEqual(original.refund);
  await page.locator(`[data-expense-id="${original.id}"]`).getByRole('button',{name:'Edit',exact:true}).click();
  await page.evaluate(({key,external})=>localStorage.setItem(key,JSON.stringify({version:1,records:[external]})),{key:KEY,external});await submit(page);await expect(page.locator('#expenseLedgerStatus')).toContainText('no longer exists');expect((await read(page)).records).toEqual([external]);
  page.once('dialog',d=>d.accept());await page.evaluate(id=>deleteManualExpense(id),original.id);expect((await read(page)).records).toEqual([external]);
  await seed(page,[external,external]);page.once('dialog',d=>d.accept());await page.evaluate(id=>deleteManualExpense(id),external.id);expect((await read(page)).records).toHaveLength(2);
});

test('real cross-tab storage event refreshes UI without writing and preserves a pending edit',async({page,context})=>{
  await start(page);await seed(page,[sample()]);await page.locator('#expenseLedgerList').getByRole('button',{name:'Edit',exact:true}).click();await fill(page,{storeName:'Draft'});
  const other=await context.newPage();await other.goto('/');const external=sample('22222222-2222-4222-8222-222222222222','External');
  await other.evaluate(({key,records})=>localStorage.setItem(key,JSON.stringify({version:1,records})),{key:KEY,records:[sample(),external]});
  await expect(page.locator('#expenseLedgerCount')).toHaveText('2 purchases');await expect(page.locator('[name=storeName]')).toHaveValue('Draft');expect((await read(page)).records).toEqual([sample(),external]);
  await submit(page);expect((await read(page)).records[1]).toEqual(external);await other.close();
});

test('CRUD wakes existing offline freshness and polling/debounce saves valid copy',async({page})=>{
  await start(page);await page.evaluate(()=>saveOfflineTripSnapshot());await fill(page);await submit(page);
  expect(await page.evaluate(()=>offlineSnapshotFreshness().state)).toBe('changed');await page.clock.runFor(3500);
  expect(await page.evaluate(key=>parseKoreaRouteExpenseLedger(readOfflineTripSnapshot().data[key]).records.length,KEY)).toBe(1);
  expect(await page.evaluate(()=>offlineSnapshotFreshness().state)).toBe('current');
});
