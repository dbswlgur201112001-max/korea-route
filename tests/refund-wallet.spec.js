const {test,expect}=require('@playwright/test');
test.use({serviceWorkers:'block'});
const KEY='koreaRouteExpenseLedger';
const record=(id='11111111-1111-4111-8111-111111111111',name='QA shop')=>({id,storeName:name,purchaseDate:'2026-09-26',amountKrw:20000,note:'note',createdAt:'2026-09-26T01:00:00Z',updatedAt:'2026-09-26T01:00:00Z'});
async function start(page,records=[]){
  await page.clock.install({time:new Date('2026-09-27T03:00:00Z')});await page.goto('/');await page.getByRole('button',{name:'Got it',exact:true}).click();
  if(records.length)await page.evaluate(({key,records})=>localStorage.setItem(key,JSON.stringify({version:1,records})),{key:KEY,records});
  await page.getByRole('button',{name:'Wallet',exact:true}).click();await expect(page.locator('#refundWalletSection')).toBeVisible();
}
async function read(page){return page.evaluate(key=>JSON.parse(localStorage.getItem(key)),KEY);}
const expenses=page=>page.locator('#expenseLedgerSection');const refunds=page=>page.locator('#refundWalletSection');
async function track(page){await expenses(page).getByRole('button',{name:'Track refund',exact:true}).first().click();}
for(const width of [360,390])test.describe(`${width}px refund wallet`,()=>{
  test.use({viewport:{width,height:844}});
  test('track, all statuses persist on reload, original fields and timestamps, confirmed stop',async({page})=>{
    const original=record();await start(page,[original]);await expect(refunds(page)).toContainText('No purchases are being tracked');
    const budget=JSON.stringify({city:'Suwon',style:'balanced',days:3,people:2,total:300000});await page.evaluate(v=>sessionStorage.setItem('koreaRouteWallet',v),budget);
    await track(page);const tracked=(await read(page)).records[0];expect(tracked).toMatchObject({...original,updatedAt:tracked.updatedAt,refund:{status:'UNVERIFIED'}});expect(tracked.updatedAt).not.toBe(original.updatedAt);
    await expect(refunds(page).locator('h3')).toHaveText('QA shop');
    let last=(await read(page)).records[0].updatedAt;
    for(const status of ['CHECK_REQUIRED','STORE_CONFIRMED','REFUND_RECEIVED','UNVERIFIED']){
      await page.clock.runFor(1000);await refunds(page).getByRole('combobox').selectOption(status);
      const saved=(await read(page)).records[0];expect(saved.id).toBe(original.id);expect(saved.createdAt).toBe(original.createdAt);expect(saved.updatedAt).not.toBe(last);last=saved.updatedAt;
      if(status==='STORE_CONFIRMED')await expect(refunds(page)).toContainText('does not guarantee refund approval');
      if(status==='REFUND_RECEIVED')await expect(refunds(page)).toContainText('Recorded by you as received.');
      await page.reload();await page.getByRole('button',{name:'Wallet',exact:true}).click();await expect(refunds(page).getByRole('combobox')).toHaveValue(status);
    }
    page.once('dialog',d=>d.dismiss());await refunds(page).getByRole('button',{name:'Stop tracking',exact:true}).click();expect((await read(page)).records[0].refund).toBeDefined();
    await page.clock.runFor(1000);page.once('dialog',d=>d.accept());await refunds(page).getByRole('button',{name:'Stop tracking',exact:true}).click();
    const saved=(await read(page)).records[0];expect(saved.refund).toBeUndefined();expect(saved).toMatchObject({...original,updatedAt:saved.updatedAt});expect(saved.updatedAt).not.toBe(last);expect((await read(page)).version).toBe(1);
    expect(await page.evaluate(()=>sessionStorage.getItem('koreaRouteWallet'))).toBe(budget);await expect(expenses(page).locator('article')).toHaveCount(1);await expect(refunds(page).locator('article')).toHaveCount(0);
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  });
  test('explicit EN KO JA UI and Helper branches, prefill, legacy open, no status writes',async({page})=>{
    await start(page,[record()]);await track(page);
    const locales=[['Tax Refund','Check conditions','Check refund conditions','Official guide','Close','This purchase (KRW)'],['택스 리펀드','환급 조건 확인','환급 조건 확인','공식 환급 안내','닫기','이번 결제금액 (원)'],['免税・還付','還付条件を確認','還付条件を確認','公式案内','閉じる','今回の購入金額（KRW）']];
    for(let i=0;i<3;i++){
      const [title,conditions,check,official,close,amount]=locales[i];await expect(refunds(page).locator('h2')).toHaveText(title);
      const before=await read(page);await refunds(page).getByRole('button',{name:conditions,exact:true}).click();const sheet=page.locator('#phraseSheetLayer');
      await expect(sheet).toBeVisible();await expect(sheet.getByLabel(amount,{exact:true})).toHaveValue('20000');await expect(sheet.locator('input[type=checkbox]')).toHaveCount(5);
      await expect(sheet.getByRole('button',{name:'↗ '+official,exact:true})).toBeVisible();
      for(const value of ['0','20000','1000000']){
        await sheet.locator('#taxRefundAmount').fill(value);await sheet.getByRole('button',{name:'✓ '+check,exact:true}).click();await expect(sheet.locator('#taxRefundResult h4')).not.toBeEmpty();
        if(i===2)await expect(sheet).not.toContainText(/This purchase|Trip immediate|Passport available|Check refund|Official guide|Recheck:|Entered |General refund|Current official|Confirm final/);
      }
      for(const box of await sheet.locator('input[type=checkbox]').all())await box.check();
      await sheet.locator('#taxRefundAmount').fill('20000');
      for(const total of ['0','4000000','6000000']){await sheet.locator('#taxRefundTripTotal').fill(total);await sheet.getByRole('button',{name:'✓ '+check,exact:true}).click();}
      expect(await read(page)).toEqual(before);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
      await sheet.getByRole('button',{name:close,exact:true}).click();await expect(refunds(page)).toBeVisible();
      if(i===2)await expect(refunds(page)).not.toContainText(/Track refund|Stop tracking|Check conditions|tracked purchases|recorded as received|Not checked|Check required|Store confirmed|Refund received/);
      if(i<2)await page.locator('#walletHub .top button.pill').click();
    }
    await page.evaluate(()=>openTaxRefundHelper());await expect(page.locator('#taxRefundAmount')).toHaveValue('');await expect(page.locator('#taxRefundTripTotal')).toHaveValue('');
    // Official action stays a handoff; never access or alter the real official service in this test.
    await page.evaluate(()=>{window.openedOfficial='';window.open=url=>{window.openedOfficial=url;};openTaxRefundOfficial();});
    expect(await page.evaluate(()=>window.openedOfficial)).toContain('english.visitkorea.or.kr');
  });
});

test('filtered counts, sort, expense edit preserves status, expense delete removes refund row',async({page})=>{
  const a={...record(),refund:{status:'REFUND_RECEIVED'}},b={...record('22222222-2222-4222-8222-222222222222','Newer'),purchaseDate:'2026-09-27',refund:{status:'CHECK_REQUIRED'}},c=record('33333333-3333-4333-8333-333333333333','Untracked');
  await start(page,[a,b,c]);await expect(page.locator('#refundWalletCount')).toHaveText('2 tracked purchases');await expect(page.locator('#refundWalletReceived')).toHaveText('1 recorded as received');await expect(refunds(page).locator('h3')).toHaveText(['Newer','QA shop']);expect((await read(page)).records).toEqual([a,b,c]);
  await expect(refunds(page)).not.toContainText(/Expected refund|Estimated refund/);
  await expenses(page).locator(`[data-expense-id="${a.id}"]`).getByRole('button',{name:'Edit',exact:true}).click();
  for(const [field,value] of Object.entries({storeName:'Edited',purchaseDate:'2026-09-25',amountKrw:'30000',note:'Updated note'}))await page.locator(`#expenseLedgerForm [name=${field}]`).fill(value);
  await page.getByRole('button',{name:'Save edit',exact:true}).click();expect((await read(page)).records[0].refund).toEqual(a.refund);await expect(refunds(page)).toContainText('Edited');await expect(refunds(page)).toContainText('₩30,000');
  page.once('dialog',d=>d.accept());await expenses(page).locator(`[data-expense-id="${a.id}"]`).getByRole('button',{name:'Delete',exact:true}).click();await expect(refunds(page).locator('article')).toHaveCount(1);await expect(page.locator('#refundWalletReceived')).toHaveText('0 recorded as received');
});

test('canonical reread, missing/duplicate ID and storage failures preserve other records',async({page})=>{
  const a=record(),b=record('22222222-2222-4222-8222-222222222222','External');await start(page,[a]);
  await page.evaluate(({key,a,b})=>localStorage.setItem(key,JSON.stringify({version:1,records:[a,b]})),{key:KEY,a,b});await track(page);expect((await read(page)).records[1]).toEqual(b);
  await page.evaluate(({key,b})=>localStorage.setItem(key,JSON.stringify({version:1,records:[b]})),{key:KEY,b});await page.evaluate(id=>mutateRefundTracking(id,'status','REFUND_RECEIVED'),a.id);expect((await read(page)).records).toEqual([b]);
  await page.evaluate(({key,b})=>{localStorage.setItem(key,JSON.stringify({version:1,records:[b,b]}));renderExpenseLedger();},{key:KEY,b});await page.evaluate(id=>mutateRefundTracking(id,'start'),b.id);expect((await read(page)).records).toEqual([b,b]);
  await page.evaluate(({key,a})=>{localStorage.setItem(key,JSON.stringify({version:1,records:[a]}));renderExpenseLedger();window.realSet=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){if(k===key)throw Error('quota');return window.realSet.call(this,k,v);};},{key:KEY,a});await track(page);expect((await read(page)).records).toEqual([a]);await expect(page.locator('#refundWalletStatus')).toContainText('Could not save');
  await page.evaluate(key=>{Storage.prototype.setItem=window.realSet;localStorage.setItem(key,'{bad');renderExpenseLedger();},KEY);await expect(refunds(page)).toContainText('could not be read');expect(await page.evaluate(key=>localStorage.getItem(key),KEY)).toBe('{bad');
});

test('two tabs refresh both views without writes; user names remain literal in Japanese',async({page,context})=>{
  const a=record(undefined,'<script>alert(1)</script>');await start(page,[a]);await track(page);await expect(refunds(page).locator('h3')).toHaveText(a.storeName);await expect(refunds(page).locator('script')).toHaveCount(0);
  const other=await context.newPage();await other.goto('/');
  const next={...a,storeName:'Save',refund:{status:'REFUND_RECEIVED'}};
  await other.evaluate(({key,next})=>localStorage.setItem(key,JSON.stringify({version:1,records:[next]})),{key:KEY,next});
  await expect(page.locator('#refundWalletReceived')).toHaveText('1 recorded as received');await expect(expenses(page).locator('article h3')).toHaveText('Save');expect((await read(page)).records).toEqual([next]);
  await page.locator('#walletHub .top button.pill').click();await page.locator('#walletHub .top button.pill').click();await page.clock.runFor(200);await expect(refunds(page).locator('h3')).toHaveText('Save');await expect(refunds(page)).toContainText('受取済みとして記録されています。');await other.close();
});

test('refund changes use existing offline freshness, debounce and valid schema only',async({page})=>{
  await start(page,[{...record(),refund:{status:'UNVERIFIED'}}]);await page.evaluate(()=>saveOfflineTripSnapshot());await refunds(page).getByRole('combobox').selectOption('CHECK_REQUIRED');expect(await page.evaluate(()=>offlineSnapshotFreshness().state)).toBe('changed');await page.clock.runFor(3500);
  expect(await page.evaluate(key=>parseKoreaRouteExpenseLedger(readOfflineTripSnapshot().data[key]).records[0].refund.status,KEY)).toBe('CHECK_REQUIRED');expect(await page.evaluate(()=>offlineSnapshotFreshness().state)).toBe('current');
  expect(Object.keys((await read(page)).records[0].refund)).toEqual(['status']);expect((await read(page)).version).toBe(1);
});
