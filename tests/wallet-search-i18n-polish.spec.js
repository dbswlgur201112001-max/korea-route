const {test,expect}=require('@playwright/test');
test.use({serviceWorkers:'block'});
const wallet=JSON.stringify({city:'Seoul',style:'balanced',days:3,people:2,total:525000});
const record=n=>({id:`${n}1111111-1111-4111-8111-111111111111`,storeName:'QA shop '+n,purchaseDate:'2026-09-26',amountKrw:12000,refund:{status:'UNVERIFIED'},note:'',createdAt:'2026-09-26T01:00:00Z',updatedAt:'2026-09-26T01:00:00Z'});
async function start(page){await page.clock.setFixedTime(new Date('2026-09-27T03:00:00Z'));await page.route('https://api.frankfurter.dev/**',r=>r.fulfill({json:{rate:1400,date:'2026-09-26'}}));await page.goto('/');await page.getByRole('button',{name:'Got it',exact:true}).click();await page.evaluate(wallet=>{sessionStorage.setItem('koreaRouteWallet',wallet);},wallet);await page.getByRole('button',{name:'Wallet',exact:true}).click();await expect(page.locator('#walletHub')).toHaveClass(/active/);}
for(const width of [360,390])test(width+'px Wallet locale cycle preserves selection, raw stores and calculation',async({page})=>{
 await page.setViewportSize({width,height:844});await start(page);
 const ledger=JSON.stringify({version:1,records:[record(1)]});await page.evaluate(ledger=>{localStorage.setItem('koreaRouteExpenseLedger',ledger);renderExpenseLedger();},ledger);
 await page.locator('#walletStyle').selectOption('comfort');await page.getByRole('button',{name:'Build wallet estimate',exact:true}).click();
 const numbers=(await page.locator('#walletSummary b, #walletResults .wallet-breakdown b').allTextContents()).filter(v=>v.startsWith('₩')); expect(numbers[0]).toBe('₩113,400');expect(numbers[1]).toBe('₩701,400');
 const cases=[['en',['Budget','Balanced','Comfort']],['ko',['절약형','균형형','편안형']],['ja',['節約','バランス','快適']],['en',['Budget','Balanced','Comfort']]];
 for(let i=0;i<cases.length;i++){
  const [language,options]=cases[i];if(i)await page.locator('#walletHub .pill').click();
  await expect(page.locator('#walletStyle option')).toHaveText(options);await expect(page.locator('#walletStyle')).toHaveValue('comfort');expect((await page.locator('#walletSummary b, #walletResults .wallet-breakdown b').allTextContents()).filter(v=>v.startsWith('₩'))).toEqual(numbers);
  expect(await page.evaluate(()=>sessionStorage.getItem('koreaRouteWallet'))).toBe(wallet);expect(await page.evaluate(()=>localStorage.getItem('koreaRouteExpenseLedger'))).toBe(ledger);
  if(language==='ja'){
   const budget=page.locator('#walletHub .wallet-panel').first();await expect(budget).toContainText('予算設定');await expect(budget).toContainText('1人・1日あたり');await expect(budget).toContainText('支払い時の注意点');await expect(budget).toContainText('参考レート');
   await expect(budget).not.toContainText(/Budget setup|Travel style|Per person|Trip estimate|Cash friction|Food \/ day|Pass candidate|Foreign-card|Daily FX|Save budget|Compare passes|Payment friction|VISITOR|Foreign-issued|Korean phone|Transit-card|Possible cash|Connectivity|Prototype estimate|Planned comparison|Compare eSIM|View FX|reference rate/);
   await expect(page.locator('#walletHub .arch-hero')).not.toContainText(/Check money|Use the daily|TRIP WALLET/);await expect(page.locator('#walletHub .back')).toHaveAttribute('aria-label','戻る');
   await expect(page.locator('#expenseLedgerCount')).toHaveText('購入 1件');await expect(page.locator('#refundWalletCount')).toHaveText('還付記録 1件');
  }
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 }
 expect(await page.evaluate(()=>Object.values(WALLET_STYLE).map(v=>v.factor))).toEqual([.78,1,1.35]);
});
test('FX idle, loading, unavailable and success remain Japanese across rerender',async({page})=>{
 await start(page);await page.locator('#walletHub .pill').click();await page.locator('#walletHub .pill').click();
 for(const [state,text]of [['idle','レートを読み込むとKRW換算額を表示します。'],['loading','最新の日次レートを確認中…'],['unavailable','為替を取得できません。架空のレートは表示しません。']]){
  await page.evaluate(state=>{liveFxRate=null;document.getElementById('liveFxBadge').dataset.fxState=state;renderLiveFxConversion();},state);await expect(page.locator('#liveFxResult')).toContainText(text);
 }
 await page.unroute('https://api.frankfurter.dev/**');await page.route('https://api.frankfurter.dev/**',r=>r.abort());await page.getByRole('button',{name:'レートを更新',exact:true}).click();await expect(page.locator('#liveFxResult')).toContainText('架空のレートは表示しません');
 await page.locator('#walletHub .pill').click();await expect(page.locator('#liveFxResult')).toContainText('FX is unavailable');
 await page.unroute('https://api.frankfurter.dev/**');await page.route('https://api.frankfurter.dev/**',r=>r.fulfill({json:{rate:1400,date:'2026-09-26'}}));await page.getByRole('button',{name:'Refresh rate',exact:true}).click();await expect(page.locator('#liveFxResult strong')).toHaveText('$100 ≈ ₩140,000');
});
test('saved-place Japanese description and click dispatch preserved',async({page})=>{
 await start(page);await page.getByRole('button',{name:'Today',exact:true}).click();await page.evaluate(()=>sessionStorage.setItem('koreaRouteSavedPlaces',JSON.stringify([{key:'Suwon::QA Place',city:'Suwon',en:'QA Place',ko:'QA 장소',lat:37.28,lng:127.01}])));
 await page.locator('#langBtn').click();await page.locator('#langBtn').click();await page.locator('#globalSearchInput').fill('QA Place');
 const result=page.locator('#globalSearchResults').getByRole('button').filter({hasText:'保存した場所 · Suwon'});await expect(result).toBeVisible();await expect(page.locator('#globalSearchResults')).not.toContainText('Saved place · Suwon');
 await page.evaluate(()=>{window.__searchRun=[];const original=runGlobalSearchResult;runGlobalSearchResult=function(...args){window.__searchRun.push(args);return original.apply(this,args);};});await result.click();expect(await page.evaluate(()=>window.__searchRun.length)).toBe(1);
});
test('English singular/plural and unchanged ledger totals/refund status',async({page})=>{
 await start(page);
 for(const n of [1,2]){const raw=JSON.stringify({version:1,records:Array.from({length:n},(_,i)=>record(i+1))});await page.evaluate(raw=>{localStorage.setItem('koreaRouteExpenseLedger',raw);renderExpenseLedger();},raw);await expect(page.locator('#expenseLedgerCount')).toHaveText(n===1?'1 purchase':'2 purchases');await expect(page.locator('#refundWalletCount')).toHaveText(n===1?'1 tracked purchase':'2 tracked purchases');await expect(page.locator('#expenseLedgerTotal')).toHaveText(n===1?'₩12,000 total':'₩24,000 total');expect(await page.evaluate(()=>localStorage.getItem('koreaRouteExpenseLedger'))).toBe(raw);}
});
