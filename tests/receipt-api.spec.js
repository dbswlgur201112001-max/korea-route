const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const source = fs.readFileSync(path.join(__dirname,'../api/receipt.js'),'utf8');
// Synthetic signature fixtures only; no real receipt, image service or network.
const image = (mime, bytes) => `data:image/${mime};base64,${Buffer.from(bytes).toString('base64')}`;
const jpeg = image('jpeg',[255,216,255,224,0,2,255,217]);
const png = image('png',[137,80,78,71,13,10,26,10,0,0,0,0]);
const webp = image('webp',[82,73,70,70,4,0,0,0,87,69,66,80]);
const good = {storeName:'테스트 상점',purchaseDate:'2026-09-27',totalAmountKrw:12000,issues:[]};
function harness({ env = {}, fetchImpl, result = good } = {}) {
  let now = Date.parse('2026-09-27T15:30:00Z'); // Sep 28 in Korea, Sep 27 UTC.
  class Clock extends Date { constructor(...args) { super(...(args.length ? args : [now])); } static now() { return now; } }
  const calls = [], timers = new Set();
  const context = vm.createContext({module:{exports:{}},Buffer,Date:Clock,AbortController,
    process:{env:{GEMINI_API_KEY:'fixture-secret',...env}},
    console:{log(){throw Error('Unexpected log');},error(){throw Error('Unexpected log');},warn(){throw Error('Unexpected log');}},
    setTimeout(fn,ms){const timer={fn,ms};timers.add(timer);return timer;},clearTimeout(timer){timers.delete(timer);},
    fetch:async(...args)=>{calls.push(args);return fetchImpl ? fetchImpl(...args) : {ok:true,status:200,json:async()=>({candidates:[{content:{parts:[{text:JSON.stringify(result)}]}}]})};}
  });
  vm.runInContext(source,context);
  return {calls,timers,advance(ms){now+=ms;},limits:vm.runInContext('({MAX_BODY_BYTES,MAX_IMAGE_BYTES,MAX_DATA_URL_CHARS,FETCH_TIMEOUT_MS})',context),
    async request(options={}) {
      const {method='POST',headers={}}=options;
      const body=Object.hasOwn(options,'body')?options.body:{imageDataUrl:jpeg};
      const res={headers:{},setHeader(k,v){this.headers[k]=v;},status(n){this.statusCode=n;return this;},json(value){this.body=JSON.parse(JSON.stringify(value));return this;}};
      await context.module.exports({method,body,headers},res);
      expect(res.headers['Cache-Control']).toBe('no-store, max-age=0');
      expect(JSON.stringify(res.body)).not.toContain('fixture-secret');
      expect(JSON.stringify(res.body)).not.toContain('imageDataUrl');
      expect(JSON.stringify(res.body)).not.toContain('debug');
      return res;
    }
  };
}

for (const [name,request,status,error] of [
  ['GET',{method:'GET'},405,'METHOD_NOT_ALLOWED'],
  ['missing body',{body:undefined},400,'INVALID_JSON'],
  ['null body',{body:null},400,'INVALID_JSON'],
  ['invalid JSON',{body:'{'},400,'INVALID_JSON'],
  ['array body',{body:[]},400,'INVALID_JSON'],
  ['missing image',{body:{}},400,'INVALID_IMAGE'],
  ['invalid data URL',{body:{imageDataUrl:'not an image'}},400,'INVALID_IMAGE'],
  ['unsupported MIME',{body:{imageDataUrl:image('gif',[71,73,70])}},400,'INVALID_IMAGE'],
  ['wrong magic',{body:{imageDataUrl:image('jpeg',[0,1,2])}},400,'INVALID_IMAGE'],
  ['MIME mismatch',{body:{imageDataUrl:png.replace('image/png','image/jpeg')}},400,'INVALID_IMAGE'],
  ['bad alphabet',{body:{imageDataUrl:'data:image/jpeg;base64,%%%%'}},400,'INVALID_IMAGE'],
  ['bad padding',{body:{imageDataUrl:'data:image/jpeg;base64,/9j/===='}},400,'INVALID_IMAGE'],
  ['noncanonical base64',{body:{imageDataUrl:'data:image/jpeg;base64,/9j/AB=='}},400,'INVALID_IMAGE'],
  ['empty base64',{body:{imageDataUrl:'data:image/png;base64,'}},400,'INVALID_IMAGE'],
  ['oversized image',{body:{imageDataUrl:'data:image/jpeg;base64,'+'A'.repeat(3000000)}},413,'IMAGE_TOO_LARGE'],
  ['oversized declared body',{headers:{'content-length':'3100001'}},413,'IMAGE_TOO_LARGE'],
  ['oversized actual body',{body:{imageDataUrl:jpeg,extra:'a'.repeat(3100000)}},413,'IMAGE_TOO_LARGE']
]) {
  test(`receipt request: ${name}`,async()=>{
    const h=harness();
    const res=await h.request(request);
    expect(res.statusCode).toBe(status);expect(res.body).toEqual({error});expect(h.calls).toHaveLength(0);
    if(status===405) expect(res.headers.Allow).toBe('POST');
  });
}
for (const [mime,data] of [['jpeg',jpeg],['png',png],['webp',webp],['jpeg',jpeg.replace('image/jpeg','image/jpg')]]) {
  test(`receipt accepts ${mime} ${data.slice(0,15)}`,async()=>{
    const h=harness();const res=await h.request({body:JSON.stringify({imageDataUrl:data})});
    expect(res.statusCode).toBe(200);expect(res.body).toEqual(good);
    const [url,options]=h.calls[0];const upstream=JSON.parse(options.body);
    expect(url).not.toContain('fixture-secret');expect(url).toContain('gemini-2.5-flash-lite');
    expect(options.headers['x-goog-api-key']).toBe('fixture-secret');
    expect(upstream.contents[0].parts[1].inlineData.mimeType).toBe('image/'+mime);
    expect(upstream.generationConfig.responseMimeType).toBe('application/json');
    expect(upstream.generationConfig.responseSchema.required).toEqual(Object.keys(good));
    expect(upstream.generationConfig.temperature).toBe(0);expect(h.calls).toHaveLength(1);expect(h.timers.size).toBe(0);
  });
}
for (const [name,env,error,status] of [
  ['missing key',{GEMINI_API_KEY:''},'AI_NOT_CONFIGURED',503],
  ['invalid model',{GEMINI_RECEIPT_MODEL:'bad/model?secret'},'INVALID_MODEL_CONFIG',500]
]) test(`receipt config: ${name}`,async()=>{const h=harness({env});const r=await h.request();expect(r.statusCode).toBe(status);expect(r.body).toEqual({error});expect(h.calls).toHaveLength(0);});
test('receipt model precedence',async()=>{
  for(const [env,model] of [[{GEMINI_MODEL:'generic-flash'},'generic-flash'],[{GEMINI_MODEL:'generic-flash',GEMINI_RECEIPT_MODEL:'receipt-flash'},'receipt-flash']]){
    const h=harness({env});await h.request();expect(h.calls[0][0]).toContain('/'+model+':generateContent');
  }
});
test('receipt limiter: eight per IP, Retry-After, expiry and no automatic retries',async()=>{
  const h=harness();for(let i=0;i<8;i++) expect((await h.request()).statusCode).toBe(200);
  const blocked=await h.request();expect(blocked.statusCode).toBe(429);expect(blocked.body).toEqual({error:'RATE_LIMITED'});expect(blocked.headers['Retry-After']).toBe('600');
  expect(h.calls).toHaveLength(8);expect((await h.request({headers:{'x-forwarded-for':'192.0.2.1'}})).statusCode).toBe(200);
  h.advance(600000);expect((await h.request()).statusCode).toBe(200);
});
test('receipt timeout aborts after configured 20 seconds and returns no details',async()=>{
  const h=harness({fetchImpl:(_url,options)=>new Promise((_resolve,reject)=>options.signal.addEventListener('abort',()=>reject(Object.assign(new Error('private upstream data'),{name:'AbortError'}))))});
  const pending=h.request();expect([...h.timers][0].ms).toBe(20000);[...h.timers][0].fn();
  const res=await pending;expect(res.statusCode).toBe(504);expect(res.body).toEqual({error:'AI_TIMEOUT'});expect(h.timers.size).toBe(0);expect(h.calls).toHaveLength(1);
});
for(const [name,response,error,status] of [
  ['upstream failure',{ok:false,status:500},'AI_UPSTREAM_FAILED',502],
  ['upstream throttle',{ok:false,status:429},'RATE_LIMITED',429],
  ['empty result',{ok:true,json:async()=>({candidates:[]})},'AI_EMPTY_RESULT',502],
  ['invalid JSON',{ok:true,json:async()=>({candidates:[{content:{parts:[{text:'not JSON with private contents'}]}}]})},'AI_INVALID_RESULT',502],
  ['invalid envelope',{ok:true,json:async()=>{throw new SyntaxError('private body');}},'AI_INVALID_RESULT',502]
]) test(`receipt error: ${name}`,async()=>{const h=harness({fetchImpl:async()=>response});const r=await h.request();expect(r.statusCode).toBe(status);expect(r.body).toEqual({error});expect(h.timers.size).toBe(0);if(status===429)expect(r.headers['Retry-After']).toBe('60');});
test('receipt network error does not leak error details',async()=>{const h=harness({fetchImpl:async()=>{throw Error('fixture-secret raw image');}});expect((await h.request()).body).toEqual({error:'AI_UPSTREAM_FAILED'});});
for(const [name,changes,field,code] of [
  ['ambiguous amount',{issues:[{field:'totalAmountKrw',code:'AMBIGUOUS'}]},'totalAmountKrw','AMBIGUOUS'],
  ['invalid date',{purchaseDate:'2026-02-30'},'purchaseDate','INVALID'],
  ['future date',{purchaseDate:'2026-09-29'},'purchaseDate','INVALID'],
  ['two digit year',{purchaseDate:'26-09-27'},'purchaseDate','INVALID'],
  ['zero amount',{totalAmountKrw:0},'totalAmountKrw','INVALID'],
  ['huge amount',{totalAmountKrw:1000000000},'totalAmountKrw','INVALID'],
  ['negative amount',{totalAmountKrw:-1},'totalAmountKrw','INVALID'],
  ['fractional amount',{totalAmountKrw:1.5},'totalAmountKrw','INVALID'],
  ['string amount',{totalAmountKrw:'12000'},'totalAmountKrw','INVALID'],
  ['missing total',{totalAmountKrw:null},'totalAmountKrw','UNREADABLE'],
  ['missing name',{storeName:null},'storeName','UNREADABLE'],
  ['missing date',{purchaseDate:null},'purchaseDate','UNREADABLE']
]) test(`receipt normalize: ${name}`,async()=>{const r=await harness({result:{...good,...changes}}).request();expect(r.statusCode).toBe(200);expect(r.body[field]).toBeNull();expect(r.body.issues).toContainEqual({field,code});});
test('receipt KST today and amount boundaries accepted',async()=>{
  for(const totalAmountKrw of [1,999999999]){const result={...good,purchaseDate:'2026-09-28',totalAmountKrw};expect((await harness({result}).request()).body).toEqual(result);}
});
test('receipt NOT_RECEIPT discards all proposed values',async()=>{
  const r=await harness({result:{...good,issues:[{field:'receipt',code:'NOT_RECEIPT',private:'sensitive'}]}}).request();
  expect(r.body).toEqual({storeName:null,purchaseDate:null,totalAmountKrw:null,issues:[{field:'receipt',code:'NOT_RECEIPT'}]});
});
test('receipt private properties stripped, issues bounded, invalid enums ignored',async()=>{
  const result={...good,phone:'private-phone',cardNumber:'private-card',address:'private-address',rawText:'private-text',refund:{status:'STORE_CONFIRMED'},issues:Array(100).fill({field:'totalAmountKrw',code:'AMBIGUOUS',raw:'private'}).concat([{field:'phone',code:'INVALID'},{field:'storeName',code:'made-up'}])};
  const r=await harness({result}).request();expect(Object.keys(r.body)).toEqual(Object.keys(good));expect(JSON.stringify(r.body)).not.toContain('private');
  expect(r.body.storeName).toBe(good.storeName);expect(r.body.issues).toEqual([{field:'totalAmountKrw',code:'AMBIGUOUS'}]);
});
test('receipt name control characters, trim and length normalized',async()=>{
  const r=await harness({result:{...good,storeName:' \u0000'+ '가'.repeat(120)+'\u007f '}}).request();expect(r.body.storeName).toBe('가'.repeat(100));
});
test('receipt malformed result shape rejected',async()=>{
  for(const result of [null,[],{}, {...good,issues:'private'}, {...good,issues:undefined}]) expect((await harness({result}).request()).body).toEqual({error:'AI_INVALID_RESULT'});
});
test('receipt numeric byte limits stay below platform body cap',async()=>{
  const h=harness();expect(h.limits).toMatchObject({MAX_BODY_BYTES:3100000,MAX_IMAGE_BYTES:2250000,MAX_DATA_URL_CHARS:3000000,FETCH_TIMEOUT_MS:20000});
});
test('receipt near-limit base64 validates without regex stack overflow',async()=>{
  const bytes=Buffer.alloc(2249970);bytes[0]=255;bytes[1]=216;bytes[2]=255;
  const h=harness();const r=await h.request({body:{imageDataUrl:image('jpeg',bytes)}});
  expect(r.statusCode).toBe(200);expect(h.calls).toHaveLength(1);
});
test('receipt abort during response body processing remains a timeout',async()=>{
  const h=harness({fetchImpl:async(_url,options)=>({ok:true,json:()=>new Promise((_resolve,reject)=>{
    options.signal.addEventListener('abort',()=>reject(Object.assign(Error('private'),{name:'AbortError'})));
    [...h.timers][0].fn();
  })})});
  expect((await h.request()).body).toEqual({error:'AI_TIMEOUT'});expect(h.timers.size).toBe(0);
});
