const {test,expect}=require('@playwright/test');
test.use({serviceWorkers:'block',timezoneId:'America/Los_Angeles'});
const KEY='koreaRouteExpenseLedger';
const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jBz8AAAAASUVORK5CYII=','base64');
const file={name:'synthetic.png',mimeType:'image/png',buffer:png};
const result={storeName:'Synthetic shop',purchaseDate:'2026-09-27',totalAmountKrw:12000,issues:[]};
const scan=page=>page.locator('#receiptScan');
const form=page=>page.locator('#expenseLedgerForm');
const review=page=>page.locator('#receiptScanReview');
async function start(page){
  await page.clock.install({time:new Date('2026-09-26T16:00:00Z')});
  await page.addInitScript(()=>{
    window.ledgerWrites=0;window.imageWrites=[];window.permissionCalls=[];window.idbCalls=0;
    const set=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){if(k==='koreaRouteExpenseLedger')window.ledgerWrites++;if(/data:image|base64,/.test(v))window.imageWrites.push(k);return set.call(this,k,v);};
    const deny=name=>()=>{permissionCalls.push(name);throw Error('Unexpected permission');};
    Object.defineProperty(navigator,'mediaDevices',{value:{getUserMedia:deny('media')}});
    Object.defineProperty(navigator,'geolocation',{value:{getCurrentPosition:deny('geo'),watchPosition:deny('geo'),clearWatch:()=>{}}});
    const open=indexedDB.open.bind(indexedDB);indexedDB.open=(...args)=>{idbCalls++;return open(...args);};
  });
  // Every Receipt request is mocked. Never call Gemini or send personal images.
  await page.route('**/api/receipt',route=>route.fulfill({json:result}));
  await page.goto('/');await page.getByRole('button',{name:'Got it',exact:true}).click();
  await page.getByRole('button',{name:'Wallet',exact:true}).click();await expect(form(page)).toBeVisible();
}
async function open(page){await scan(page).getByRole('button',{name:'Scan receipt',exact:true}).click();}
async function photo(page){await page.locator('#receiptScanUpload').setInputFiles(file);await expect(scan(page).locator('img')).toBeVisible();}
async function analyze(page){await scan(page).getByRole('button',{name:'Analyze receipt',exact:true}).click();await expect(review(page)).toBeVisible();}
async function blankLedger(page){expect(await page.evaluate(key=>({raw:localStorage.getItem(key),writes:ledgerWrites}),KEY)).toEqual({raw:null,writes:0});}
async function cleared(page){expect(await page.evaluate(()=>({image:receiptScan.image,result:receiptScan.result,draft:receiptScan.draft,controller:receiptScan.controller}))).toEqual({image:'',result:null,draft:null,controller:null});await expect(scan(page).locator('img')).toHaveCount(0);}
async function noImageStorage(page){
  expect(await page.evaluate(()=>({writes:imageWrites,idb:idbCalls,contains:[...Object.values(localStorage),...Object.values(sessionStorage),JSON.stringify(buildOfflineTripSnapshot()),JSON.stringify(koreaRouteBuildPersistedState())].some(x=>/data:image|base64,/.test(x))}))).toEqual({writes:[],idb:0,contains:false});
}

for(const width of [360,390])test.describe(`${width}px Receipt UI`,()=>{
  test.use({viewport:{width,height:844}});
  test('explicit photo, review, apply, existing submit only, no refund, reload and memory cleanup',async({page})=>{
    await start(page);let choosers=0;page.on('filechooser',()=>choosers++);await open(page);
    await expect(page.locator('#receiptScanCamera')).toHaveAttribute('capture','environment');
    await expect(page.locator('#receiptScanUpload')).not.toHaveAttribute('capture',/.*/);
    for(const id of ['Camera','Upload'])await expect(page.locator('#receiptScan'+id)).toHaveAttribute('accept','image/jpeg,image/png,image/webp');
    expect(choosers).toBe(0);expect(await page.evaluate(()=>permissionCalls)).toEqual([]);
    await page.evaluate(()=>{window.compressionCalls=0;const original=compressCheckRideImage;compressCheckRideImage=async(...args)=>{compressionCalls++;return original(...args);};});
    await photo(page);expect(await page.evaluate(()=>compressionCalls)).toBe(1);await blankLedger(page);await noImageStorage(page);
    await analyze(page);await blankLedger(page);await expect(review(page).locator('[name=storeName]')).toHaveValue('Synthetic shop');
    await review(page).locator('[name=storeName]').fill('Edited shop');await scan(page).getByRole('button',{name:'Use these details',exact:true}).click();
    await blankLedger(page);await expect(form(page).locator('[name=storeName]')).toHaveValue('Edited shop');await expect(form(page).locator('[name=note]')).toHaveValue('');
    await open(page);await photo(page);await form(page).locator('button[type=submit]').click();
    await expect(page.locator('#expenseLedgerStatus')).toHaveText('Expense saved.');await cleared(page);
    const records=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)).records,KEY);expect(records).toHaveLength(1);expect(records[0]).toMatchObject({storeName:'Edited shop',amountKrw:12000,purchaseDate:'2026-09-27'});expect(records[0].refund).toBeUndefined();
    expect(await page.evaluate(()=>ledgerWrites)).toBe(1);await noImageStorage(page);
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth)).toBe(true);
    await page.reload();await page.getByRole('button',{name:'Wallet',exact:true}).click();await expect(page.locator('#expenseLedgerCount')).toHaveText('1 purchase');await cleared(page);await noImageStorage(page);
  });
  test('language and storage rerenders preserve photo, review draft and manual draft without overflow',async({page})=>{
    await start(page);await form(page).locator('[name=note]').fill('Keep my note');await open(page);await photo(page);await analyze(page);
    await review(page).locator('[name=storeName]').fill('My review');
    for(const [title,use] of [['Review before saving','Use these details'],['저장 전 확인','이 내용 사용'],['保存前に確認','この内容を使用']]){
      await expect(review(page).getByRole('heading')).toHaveText(title);await expect(scan(page).getByRole('button',{name:use,exact:true})).toBeVisible();
      await expect(review(page).locator('[name=storeName]')).toHaveValue('My review');await expect(form(page).locator('[name=note]')).toHaveValue('Keep my note');await expect(scan(page).locator('img')).toBeVisible();
      expect(await page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth)).toBe(true);
      if(use!=='この内容を使用')await page.locator('#walletHub .top button.pill').click();
    }
    await expect(scan(page)).not.toContainText(/Scan receipt|Take photo|Choose photo|Review before saving|Analyze receipt|Use these details|Cancel/);
    await page.evaluate(key=>window.dispatchEvent(new StorageEvent('storage',{key,storageArea:localStorage})),KEY);
    await expect(review(page).locator('[name=storeName]')).toHaveValue('My review');await expect(form(page).locator('[name=note]')).toHaveValue('Keep my note');await noImageStorage(page);
  });
});
test('existing manual fields and note win; only empty fields receive reviewed candidates',async({page})=>{
  await start(page);await form(page).locator('[name=storeName]').fill('Manual shop');await form(page).locator('[name=amountKrw]').fill('900');await form(page).locator('[name=note]').fill('Manual note');
  await open(page);await photo(page);await analyze(page);await scan(page).getByRole('button',{name:'Use these details'}).click();
  for(const [name,value] of Object.entries({storeName:'Manual shop',purchaseDate:'2026-09-27',amountKrw:'900',note:'Manual note'}))await expect(form(page).locator(`[name=${name}]`)).toHaveValue(value);
  await blankLedger(page);
});
test('null and uncertain candidates stay blank; issue messages are localized',async({page})=>{
  await start(page);await page.route('**/api/receipt',route=>route.fulfill({json:{storeName:null,purchaseDate:null,totalAmountKrw:null,issues:[{field:'storeName',code:'UNREADABLE'},{field:'purchaseDate',code:'INVALID'},{field:'totalAmountKrw',code:'AMBIGUOUS'}]}}));
  await open(page);await photo(page);await analyze(page);
  for(const name of ['storeName','purchaseDate','totalAmountKrw'])await expect(review(page).locator(`[name=${name}]`)).toHaveValue('');
  for(const phrase of ['More than one value','여러 값이 가능해','複数の候補があるため']){await expect(review(page)).toContainText(phrase);if(!phrase.startsWith('複数'))await page.locator('#walletHub .top button.pill').click();}
  await blankLedger(page);
});
test('invalid files and oversized originals do not analyze or destroy manual draft',async({page})=>{
  await start(page);let calls=0;page.on('request',r=>{if(r.url().endsWith('/api/receipt'))calls++;});await form(page).locator('[name=note]').fill('keep');await open(page);
  await page.locator('#receiptScanUpload').setInputFiles({name:'bad.gif',mimeType:'image/gif',buffer:png});await expect(page.locator('#receiptScanStatus')).toContainText('JPEG');
  await page.locator('#receiptScanUpload').setInputFiles({name:'huge.png',mimeType:'image/png',buffer:Buffer.alloc(12*1024*1024+1)});await expect(page.locator('#receiptScanStatus')).toContainText('12 MiB');
  await expect(form(page).locator('[name=note]')).toHaveValue('keep');expect(calls).toBe(0);await blankLedger(page);
});
for(const action of ['Cancel','Enter manually','Try another photo'])test(`${action} clears image and result but keeps manual draft`,async({page})=>{
  await start(page);await form(page).locator('[name=note]').fill('keep');await open(page);await photo(page);await analyze(page);
  await scan(page).getByRole('button',{name:action,exact:true}).click();await cleared(page);await expect(form(page).locator('[name=note]')).toHaveValue('keep');await blankLedger(page);
});
test('Wallet exit and existing record edit end scanner; edit mode cannot scan',async({page})=>{
  await start(page);await open(page);await photo(page);await analyze(page);await scan(page).getByRole('button',{name:'Use these details'}).click();await form(page).locator('button[type=submit]').click();
  await open(page);await photo(page);await page.locator('#expenseLedgerList').getByRole('button',{name:'Edit',exact:true}).click();await cleared(page);await expect(scan(page).getByRole('button',{name:'Scan receipt'})).toBeDisabled();await expect(scan(page)).toContainText('Finish editing');
  await form(page).getByRole('button',{name:'Cancel',exact:true}).click();await open(page);await photo(page);await page.getByRole('button',{name:'Today',exact:true}).click();await cleared(page);
  await page.getByRole('button',{name:'Wallet',exact:true}).click();await expect(scan(page).getByRole('button',{name:'Scan receipt'})).toBeVisible();
});
test('manual save still rejects future date and invalid amount after OCR apply',async({page})=>{
  await start(page);await open(page);await photo(page);await analyze(page);await scan(page).getByRole('button',{name:'Use these details'}).click();
  await form(page).locator('[name=purchaseDate]').fill('2026-09-28');await form(page).locator('button[type=submit]').click();await blankLedger(page);
  await form(page).locator('[name=purchaseDate]').fill('2026-09-27');
  for(const value of ['0','-1','1.5','1000000000']){await form(page).locator('[name=amountKrw]').fill(value);await form(page).locator('button[type=submit]').click();await blankLedger(page);}
});
test('old response cannot overwrite a new photo or reopen a closed scanner; duplicate analysis blocked',async({page})=>{
  await start(page);await open(page);await photo(page);
  await page.evaluate(()=>{window.pendingReceipt=[];window.realReceiptFetch=window.fetch;window.fetch=(url,options)=>url==='/api/receipt'?new Promise(resolve=>pendingReceipt.push({resolve,signal:options.signal})):realReceiptFetch(url,options);});
  await scan(page).getByRole('button',{name:'Analyze receipt'}).click();await expect(scan(page).getByRole('button',{name:'Analyze receipt'})).toBeDisabled();
  await page.evaluate(()=>analyzeReceiptPhoto());expect(await page.evaluate(()=>pendingReceipt.length)).toBe(1);
  await photo(page);expect(await page.evaluate(()=>pendingReceipt[0].signal.aborted)).toBe(true);
  await scan(page).getByRole('button',{name:'Analyze receipt'}).click();
  await page.evaluate(result=>pendingReceipt[1].resolve({ok:true,json:async()=>({...result,storeName:'New'})}),result);await expect(review(page).locator('[name=storeName]')).toHaveValue('New');
  await page.evaluate(result=>pendingReceipt[0].resolve({ok:true,json:async()=>({...result,storeName:'Old'})}),result);await expect(review(page).locator('[name=storeName]')).toHaveValue('New');
  await photo(page);await scan(page).getByRole('button',{name:'Analyze receipt'}).click();await scan(page).getByRole('button',{name:'Cancel',exact:true}).click();
  await page.evaluate(result=>pendingReceipt[2].resolve({ok:true,json:async()=>result}),result);await cleared(page);await expect(review(page)).toHaveCount(0);await blankLedger(page);
});
test('timeout abort and offline keep manual entry usable',async({page,context})=>{
  await start(page);await open(page);await photo(page);
  await page.evaluate(()=>{window.realReceiptFetch=fetch;window.fetch=(url,options)=>url==='/api/receipt'?new Promise((_resolve,reject)=>options.signal.addEventListener('abort',()=>reject(new DOMException('Aborted','AbortError')))):realReceiptFetch(url,options);});
  await scan(page).getByRole('button',{name:'Analyze receipt'}).click();await page.clock.fastForward(23001);await expect(page.locator('#receiptScanStatus')).toContainText('timed out');
  await context.setOffline(true);await expect(scan(page).getByRole('button',{name:'Analyze receipt'})).toBeDisabled();await expect(scan(page)).toContainText('internet connection');
  for(const [name,value] of Object.entries({storeName:'Offline',purchaseDate:'2026-09-27',amountKrw:'100'}))await form(page).locator(`[name=${name}]`).fill(value);
  await form(page).locator('button[type=submit]').click();await expect(page.locator('#expenseLedgerCount')).toHaveText('1 purchase');await cleared(page);await context.setOffline(false);
});
for(const error of ['RATE_LIMITED','AI_NOT_CONFIGURED','AI_UPSTREAM_FAILED','AI_INVALID_RESULT','AI_EMPTY_RESULT','INVALID_IMAGE','IMAGE_TOO_LARGE'])test(`safe localized error ${error}`,async({page})=>{
  await start(page);await page.route('**/api/receipt',route=>route.fulfill({status:502,json:{error,debug:'NEVER DISPLAY'}}));await form(page).locator('[name=note]').fill('keep');await open(page);await photo(page);await scan(page).getByRole('button',{name:'Analyze receipt'}).click();
  await expect(page.locator('#receiptScanStatus')).not.toHaveText('Analyzing…');await expect(page.locator('#receiptScanStatus')).not.toBeEmpty();
  for(let i=0;i<2;i++){await page.locator('#walletHub .top button.pill').click();await expect(page.locator('#receiptScanStatus')).not.toBeEmpty();}
  await expect(scan(page)).not.toContainText(/NEVER DISPLAY|AI_|RATE_LIMITED|IMAGE_TOO_LARGE/);await expect(form(page).locator('[name=note]')).toHaveValue('keep');await blankLedger(page);
});
test('malformed client responses rejected, including unknown issue enums and additional fields',async({page})=>{
  await start(page);await open(page);await photo(page);
  for(const bad of [{},null,{...result,cardNumber:'secret'},{...result,totalAmountKrw:'12'},{...result,totalAmountKrw:1.5},{...result,purchaseDate:'2026-02-30'},{...result,issues:[{field:'phone',code:'INVALID'}]},{...result,issues:[{field:'storeName',code:'OTHER'}]}]){
    await page.route('**/api/receipt',route=>route.fulfill({json:bad}));await scan(page).getByRole('button',{name:'Analyze receipt'}).click();await expect(page.locator('#receiptScanStatus')).toContainText('result was invalid');await expect(review(page)).toHaveCount(0);
  }
  await blankLedger(page);
});
test('XSS-like merchant remains literal through review, apply and existing save',async({page})=>{
  await start(page);const storeName='<img src=x onerror="window.receiptXss=1">';await page.route('**/api/receipt',route=>route.fulfill({json:{...result,storeName}}));await open(page);await photo(page);await analyze(page);
  await expect(review(page).locator('[name=storeName]')).toHaveValue(storeName);await expect(review(page).locator('img')).toHaveCount(0);
  await scan(page).getByRole('button',{name:'Use these details'}).click();await form(page).locator('button[type=submit]').click();await expect(page.locator('#expenseLedgerList h3')).toHaveText(storeName);expect(await page.evaluate(()=>window.receiptXss)).toBeUndefined();await noImageStorage(page);
});
test('NOT_RECEIPT never fills candidates and is localized in all languages',async({page})=>{
  await start(page);await page.route('**/api/receipt',route=>route.fulfill({json:{storeName:null,purchaseDate:null,totalAmountKrw:null,issues:[{field:'receipt',code:'NOT_RECEIPT'}]}}));
  await open(page);await photo(page);await analyze(page);
  for(const text of ['could not be identified as a receipt','영수증으로 확인하지 못했습니다','レシートとして確認できませんでした']){
    await expect(review(page)).toContainText(text);if(!text.startsWith('レシート'))await page.locator('#walletHub .top button.pill').click();
  }
  for(const field of ['storeName','purchaseDate','totalAmountKrw'])await expect(review(page).locator(`[name=${field}]`)).toHaveValue('');
  await blankLedger(page);
});
